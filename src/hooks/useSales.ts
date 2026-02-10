import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { useStores } from './useStores';
import type { Database } from '@/integrations/supabase/types';

type SaleRow = Database['public']['Tables']['sales']['Row'];
type SaleItemRow = Database['public']['Tables']['sale_items']['Row'];
type PaymentMethod = Database['public']['Enums']['payment_method'];

export type Sale = SaleRow;
export type SaleItem = SaleItemRow;

export interface SaleWithItems extends Sale {
  sale_items: (SaleItem & { products: { name: string } })[];
  customers: { name: string } | null;
}

export interface CreateSaleInput {
  customer_id?: string | null;
  payment_method: PaymentMethod;
  discount?: number;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    price: number;
    total_price?: number;
  }[];
}

export interface CancelSaleInput {
  saleId: string;
  reason: string;
}

// Função principal para buscar vendas
export function useSales() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['sales', currentStore?.id],
    queryFn: async () => {
      console.log('📊 [useSales] Buscando vendas para loja:', currentStore?.id);
      
      let query = supabase
        .from('sales')
        .select(`
          *,
          customers (name),
          sale_items (
            *,
            products (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ [useSales] Erro ao buscar vendas:', error);
        throw error;
      }
      
      console.log(`✅ [useSales] ${data?.length || 0} vendas encontradas`);
      return data as SaleWithItems[];
    },
    enabled: !!currentStore,
    staleTime: 5 * 60 * 1000,
  });
}

// Função para vendas do dia
export function useTodaySales() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['sales', 'today', currentStore?.id],
    queryFn: async () => {
      console.log('📊 [useTodaySales] Buscando vendas de hoje');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let query = supabase
        .from('sales')
        .select('*')
        .gte('created_at', today.toISOString())
        .eq('status', 'concluida');
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ [useTodaySales] Erro:', error);
        throw error;
      }
      
      console.log(`✅ [useTodaySales] ${data?.length || 0} vendas hoje`);
      return data as Sale[];
    },
    enabled: !!currentStore,
  });
}

// Função para criar nova venda
export function useCreateSale() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentStore } = useStores();

  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      console.log('🛒 [useCreateSale] Iniciando venda:', {
        items: input.items.length,
        user: user?.id,
        store: currentStore?.id,
        payment: input.payment_method
      });
      
      // Validações
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      if (!currentStore?.id) {
        throw new Error('Nenhuma loja selecionada');
      }

      if (input.items.length === 0) {
        throw new Error('Nenhum item na venda');
      }

      // Calcular totais
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const discount = input.discount || 0;
      const total = subtotal - discount;

      if (total <= 0) {
        throw new Error('Total da venda deve ser maior que zero');
      }

      console.log('💰 [useCreateSale] Totais calculados:', { subtotal, discount, total });

      // 1. Criar venda
      const saleData = {
        customer_id: input.customer_id || null,
        seller_id: user.id,
        store_id: currentStore.id,
        status: 'concluida',
        payment_method: input.payment_method,
        subtotal,
        discount,
        total,
        notes: input.notes || null,
      };

      console.log('📝 [useCreateSale] Criando venda:', saleData);

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();
      
      if (saleError) {
        console.error('❌ [useCreateSale] Erro ao criar venda:', saleError);
        throw saleError;
      }

      console.log('✅ [useCreateSale] Venda criada:', sale.id);

      // 2. Criar itens da venda
      const saleItems = input.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total_price: item.total_price || item.price * item.quantity,
      }));

      console.log('🛍️ [useCreateSale] Criando itens:', saleItems.length);

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);
      
      if (itemsError) {
        console.error('❌ [useCreateSale] Erro ao criar itens:', itemsError);
        throw itemsError;
      }

      console.log('✅ [useCreateSale] Itens criados');

      // 3. Atualizar estoque e registrar movimentos
      for (const item of input.items) {
  console.log(`📦 [useCreateSale] Atualizando estoque produto: ${item.product_id}`);
  
  // Buscar estoque atual
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('stock_quantity, name')
    .eq('id', item.product_id)
    .single();
  
  if (productError) {
    console.error('❌ [useCreateSale] Erro ao buscar produto:', productError);
    throw new Error(`Produto ${item.product_id} não encontrado`);
  }

  if (product) {
    // VERIFIQUE SE O ESTOQUE É SUFICIENTE
    if (product.stock_quantity < item.quantity) {
      console.error(`❌ [useCreateSale] Estoque insuficiente: ${product.name}`);
      throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${product.stock_quantity}`);
    }
    
    const novoEstoque = Math.max(0, product.stock_quantity - item.quantity);
    
    console.log(`📊 [useCreateSale] Atualizando ${product.name}: ${product.stock_quantity} → ${novoEstoque}`);
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        stock_quantity: novoEstoque
      })
      .eq('id', item.product_id);

    if (updateError) {
      console.error('❌ [useCreateSale] Erro ao atualizar estoque:', updateError);
      throw new Error(`Erro ao atualizar estoque de ${product.name}`);
    }

    console.log(`✅ [useCreateSale] Estoque atualizado: ${product.name}`);

    // Registrar movimento de estoque
    await supabase
      .from('stock_movements')
      .insert({
        product_id: item.product_id,
        user_id: user.id,
        store_id: currentStore.id,
        type: 'saida',
        quantity: item.quantity,
        reason: `Venda #${sale.id.slice(0, 8)}`,
        previous_stock: product.stock_quantity,
        new_stock: novoEstoque,
      });
  } else {
    console.warn(`⚠️ [useCreateSale] Produto não encontrado: ${item.product_id}`);
    throw new Error(`Produto não encontrado: ${item.product_id}`);
  }
}

      // 4. Criar transação financeira
      await supabase
        .from('financial_transactions')
        .insert({
          type: 'entrada',
          category: 'venda',
          description: `Venda #${sale.id.slice(0, 8)}`,
          amount: total,
          payment_method: input.payment_method,
          sale_id: sale.id,
          store_id: currentStore.id,
          user_id: user.id,
        });

      console.log('✅ [useCreateSale] Transação financeira criada');
      console.log('🎉 [useCreateSale] Venda finalizada com sucesso!');

      return sale;
    },
    onSuccess: (sale) => {
      console.log('🔄 [useCreateSale] Invalidando queries...');
      
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['sales', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['sales', 'today'] });
      
      // Toast simples sem JSX
      toast.success(`Venda #${sale.id.slice(0, 8)} realizada com sucesso! Total: R$ ${sale.total.toFixed(2)}`);
    },
    onError: (error: any) => {
      console.error('💣 [useCreateSale] Erro ao registrar venda:', error);
      
      let errorMessage = 'Erro ao registrar venda';
      
      if (error.code === '23502') {
        const column = error.message.match(/column "(.+?)"/)?.[1];
        errorMessage = `Erro: Campo obrigatório "${column}" não preenchido`;
      } else if (error.message.includes('violates not-null constraint')) {
        errorMessage = 'Erro: Preencha todos os campos obrigatórios';
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
    },
  });
}

// Função para estatísticas de vendas
// useSales.ts - Função useSalesStats
// useSales.ts - Função useSalesStats CORRIGIDA
export function useSalesStats() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['sales', 'stats', currentStore?.id],
    queryFn: async () => {
      console.log('📈 [useSalesStats] Calculando estatísticas');
      
      if (!currentStore?.id) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // BUSCAR APENAS VENDAS CONCLUÍDAS PARA FATURAMENTO
      let queryConcluidas = supabase
        .from('sales')
        .select('*')
        .eq('store_id', currentStore.id)
        .eq('status', 'concluida'); // ← FILTRO IMPORTANTE!
      
      const { data: salesConcluidas, error: errorConcluidas } = await queryConcluidas;
      
      if (errorConcluidas) {
        console.error('❌ [useSalesStats] Erro ao buscar vendas concluídas:', errorConcluidas);
        throw errorConcluidas;
      }

      // BUSCAR TODAS AS VENDAS PARA ESTATÍSTICAS GERAIS
      let queryAll = supabase
        .from('sales')
        .select('*')
        .eq('store_id', currentStore.id);
      
      const { data: allSales, error: errorAll } = await queryAll;
      
      if (errorAll) {
        console.error('❌ [useSalesStats] Erro ao buscar todas vendas:', errorAll);
        // Não interrompe, usa apenas as concluídas
      }

      const salesData = allSales || [];
      const concluidasData = salesConcluidas || [];

      // Filtrar por período
      const todaySales = salesData.filter(s => {
        try {
          const saleDate = new Date(s.created_at);
          return saleDate >= today;
        } catch {
          return false;
        }
      });

      const weekSales = salesData.filter(s => {
        try {
          const saleDate = new Date(s.created_at);
          return saleDate >= weekAgo;
        } catch {
          return false;
        }
      });

      // Vendas de hoje CONCLUÍDAS
      const todaySalesConcluidas = todaySales.filter(s => s.status === 'concluida');
      // Vendas da semana CONCLUÍDAS
      const weekSalesConcluidas = weekSales.filter(s => s.status === 'concluida');
      // Cancelamentos
      const cancelledSales = salesData.filter(s => s.status === 'cancelada');

      // Cálculos com vendas CONCLUÍDAS
      const todayTotal = todaySalesConcluidas.reduce((sum, s) => sum + Number(s.total), 0);
      const todayCount = todaySalesConcluidas.length;
      const weekTotal = weekSalesConcluidas.reduce((sum, s) => sum + Number(s.total), 0);
      const weekCount = weekSalesConcluidas.length;
      
      // Cancelamentos
      const cancelledCount = cancelledSales.length;
      const cancelledRevenue = cancelledSales.reduce((sum, s) => sum + Number(s.total), 0);
      
      // Ticket médio apenas com vendas concluídas
      const avgTicket = weekCount > 0 ? weekTotal / weekCount : 0;

      // FATURAMENTO TOTAL (todas vendas concluídas, SEM canceladas)
      const totalRevenue = concluidasData.reduce((sum, s) => sum + Number(s.total), 0);

      console.log('📊 [useSalesStats] Estatísticas calculadas:', {
        hoje: { total: todayTotal, count: todayCount },
        semana: { total: weekTotal, count: weekCount },
        cancelamentos: { count: cancelledCount, valor: cancelledRevenue },
        faturamentoTotal: totalRevenue
      });

      return {
        // Estatísticas do período
        todayTotal,
        todayCount,
        weekTotal,
        weekCount,
        
        // Cancelamentos
        cancelledCount,
        cancelledRevenue,
        
        // Ticket médio
        avgTicket,
        
        // Totais gerais (SEM cancelamentos)
  totalRevenue,
  totalOrders: weekCount,
  avgTicket,
  cancelledOrders: cancelledCount,
  cancelledRevenue,
      };
    },
    enabled: !!currentStore,
  });
}

// useSales.ts - Função useCancelSale atualizada
export function useCancelSale() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentStore } = useStores();

  return useMutation({
    mutationFn: async (input: CancelSaleInput) => {
      console.log('❌ [useCancelSale] Iniciando cancelamento:', input);
      
      // Validações básicas
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      if (!currentStore?.id) {
        throw new Error('Nenhuma loja selecionada');
      }

      // 1. Verificar se a venda existe e não está cancelada
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', input.saleId)
        .single();

      if (saleError) {
        console.error('❌ [useCancelSale] Venda não encontrada:', saleError);
        throw new Error('Venda não encontrada');
      }

      if (sale.status === 'cancelada') {
        console.warn('⚠️ [useCancelSale] Venda já cancelada');
        throw new Error('Venda já cancelada');
      }

      // 2. VALIDAÇÃO: Verificar se a venda é do dia atual
      const saleDate = new Date(sale.created_at);
      const today = new Date();
      
      // Comparar apenas data (ignorar hora)
      const isSameDay = 
        saleDate.getDate() === today.getDate() &&
        saleDate.getMonth() === today.getMonth() &&
        saleDate.getFullYear() === today.getFullYear();
      
      if (!isSameDay) {
        console.error('❌ [useCancelSale] Venda não pode ser cancelada: Fora do prazo', {
          dataVenda: saleDate.toLocaleDateString('pt-BR'),
          hoje: today.toLocaleDateString('pt-BR')
        });
        throw new Error('Cancelamento permitido apenas no mesmo dia da venda');
      }

      console.log('✅ [useCancelSale] Venda encontrada (do dia atual):', {
        id: sale.id,
        total: sale.total,
        status: sale.status,
        dataVenda: saleDate.toLocaleDateString('pt-BR'),
        dataAtual: today.toLocaleDateString('pt-BR')
      });

      // 3. Obter itens da venda
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', input.saleId);

      if (itemsError) {
        console.error('❌ [useCancelSale] Erro ao buscar itens:', itemsError);
        throw new Error('Erro ao buscar itens da venda');
      }

      console.log(`📦 [useCancelSale] ${saleItems?.length || 0} itens encontrados`);

      // 4. Restaurar estoque
      if (saleItems && saleItems.length > 0) {
        for (const item of saleItems) {
          console.log(`🔄 [useCancelSale] Restaurando estoque produto: ${item.product_id}`);
          
          // Buscar estoque atual
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock_quantity, name')
            .eq('id', item.product_id)
            .single();

          if (productError) {
            console.error('❌ [useCancelSale] Erro ao buscar produto:', productError);
            continue; // Continua com os outros produtos
          }

          if (product) {
            const novoEstoque = product.stock_quantity + item.quantity;
            
            // Update do estoque
            const { error: updateStockError } = await supabase
              .from('products')
              .update({ 
                stock_quantity: novoEstoque
              })
              .eq('id', item.product_id);

            if (updateStockError) {
              console.error('❌ [useCancelSale] Erro ao atualizar estoque:', updateStockError);
              throw new Error(`Erro ao atualizar estoque do produto: ${product.name}`);
            }

            console.log(`✅ [useCancelSale] Estoque restaurado: ${product.name} (${product.stock_quantity} → ${novoEstoque})`);

            // Registrar movimento de estoque
            await supabase
              .from('stock_movements')
              .insert({
                product_id: item.product_id,
                user_id: user.id,
                store_id: currentStore.id,
                type: 'entrada',
                quantity: item.quantity,
                reason: `Cancelamento venda #${input.saleId.slice(0, 8)} - ${input.reason}`,
                previous_stock: product.stock_quantity,
                new_stock: novoEstoque,
              });
          } else {
            console.warn(`⚠️ [useCancelSale] Produto não encontrado: ${item.product_id}`);
          }
        }
      }

      // 5. Atualizar status da venda
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          status: 'cancelada',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancel_reason: input.reason
        })
        .eq('id', input.saleId);

      if (updateError) {
        console.error('❌ [useCancelSale] Erro ao atualizar venda:', updateError);
        throw new Error('Erro ao atualizar status da venda');
      }

      // 6. Registrar transação financeira de saída
      const { error: transactionError } = await supabase
        .from('financial_transactions')
        .insert({
          type: 'saida',
          category: 'cancelamento_venda',
          description: `Cancelamento venda #${input.saleId.slice(0, 8)} - ${input.reason}`,
          amount: sale.total,
          payment_method: sale.payment_method,
          sale_id: input.saleId,
          store_id: currentStore.id,
          user_id: user.id,
        });

      if (transactionError) {
        console.error('❌ [useCancelSale] Erro ao registrar transação:', transactionError);
        // Não interrompe o processo, apenas loga o erro
      }

      console.log('✅ [useCancelSale] Venda cancelada com sucesso!');
      console.log('📝 [useCancelSale] Transação financeira registrada');

      return { success: true, saleId: input.saleId, total: sale.total };
    },
    onSuccess: (data) => {
      console.log('🔄 [useCancelSale] Invalidando queries...');
      
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['sales', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['sales', 'today'] });
      
      // Toast simples
      toast.success(`Venda #${data.saleId.slice(0, 8)} cancelada com sucesso! Estoque restaurado.`);
    },
    onError: (error: any) => {
      console.error('💣 [useCancelSale] Erro ao cancelar venda:', error);
      
      let errorMessage = 'Erro ao cancelar venda';
      
      if (error.message.includes('mesmo dia')) {
        errorMessage = error.message; // Já tem a mensagem correta
      } else if (error.message.includes('já cancelada')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
    },
  });
}

export function useRecentSales(limit: number = 5) {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['sales', 'recent', currentStore?.id, limit],
    queryFn: async () => {
      console.log('🕒 [useRecentSales] Buscando vendas recentes');
      
      let query = supabase
        .from('sales')
        .select(`
          *,
          customers (name),
          sale_items (*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      // Apenas vendas concluídas
      query = query.eq('status', 'concluida');
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ [useRecentSales] Erro ao buscar vendas:', error);
        throw error;
      }
      
      console.log(`✅ [useRecentSales] ${data?.length || 0} vendas recentes encontradas`);
      return data as SaleWithItems[];
    },
    enabled: !!currentStore,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// useSales.ts - Adicione esta função
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, 
         startOfMonth, endOfMonth, subDays, eachDayOfInterval, 
         eachWeekOfInterval, eachMonthOfInterval, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

type ChartPeriod = "daily" | "weekly" | "monthly";

// Função para buscar dados do gráfico de vendas
export function useSalesChartData(period: ChartPeriod = "daily") {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['sales', 'chart', period, currentStore?.id],
    queryFn: async () => {
      console.log(`📊 [useSalesChartData] Buscando dados para período: ${period}`);
      
      if (!currentStore?.id) {
        console.log('⚠️ [useSalesChartData] Nenhuma loja selecionada');
        return [];
      }

      try {
        // Buscar todas as vendas concluídas da loja
        const { data: sales, error } = await supabase
          .from('sales')
          .select('*')
          .eq('store_id', currentStore.id)
          .eq('status', 'concluida')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ [useSalesChartData] Erro ao buscar vendas:', error);
          throw error;
        }

        if (!sales || sales.length === 0) {
          console.log('📭 [useSalesChartData] Nenhuma venda encontrada');
          return generateEmptyChartData(period);
        }

        // Processar dados de acordo com o período
        const chartData = processSalesForChart(sales, period);
        
        console.log(`✅ [useSalesChartData] Dados processados: ${chartData.length} períodos`);
        return chartData;

      } catch (error) {
        console.error('💣 [useSalesChartData] Erro:', error);
        return generateEmptyChartData(period);
      }
    },
    enabled: !!currentStore,
    staleTime: 5 * 60 * 1000,
  });
}

// Função para processar vendas para o gráfico
function processSalesForChart(sales: Sale[], period: ChartPeriod) {
  const now = new Date();
  let periods: Date[];
  let periodFormat: (date: Date) => string;
  
  if (period === "daily") {
    // Últimos 7 dias
    const startDate = subDays(startOfDay(now), 6);
    periods = eachDayOfInterval({ start: startDate, end: now });
    periodFormat = (date: Date) => format(date, 'EEE', { locale: ptBR });
  } else if (period === "weekly") {
    // Últimas 4 semanas
    const startDate = startOfWeek(subDays(now, 28));
    periods = eachWeekOfInterval({ 
      start: startDate, 
      end: now 
    }, { weekStartsOn: 1 }); // Segunda-feira
    periodFormat = (date: Date) => `Sem ${format(date, 'w', { locale: ptBR })}`;
  } else {
    // Últimos 6 meses
    const startDate = startOfMonth(subDays(now, 180));
    periods = eachMonthOfInterval({ start: startDate, end: now });
    periodFormat = (date: Date) => format(date, 'MMM', { locale: ptBR });
  }

  // Agrupar vendas por período
  return periods.map((periodStart, index) => {
    let periodEnd: Date;
    let periodName: string;
    
    if (period === "daily") {
      periodEnd = endOfDay(periodStart);
      periodName = periodFormat(periodStart);
    } else if (period === "weekly") {
      periodEnd = endOfWeek(periodStart, { weekStartsOn: 1 });
      periodName = periodFormat(periodStart);
    } else {
      periodEnd = endOfMonth(periodStart);
      periodName = periodFormat(periodStart);
    }

    // Filtrar vendas dentro deste período
    const periodSales = sales.filter(sale => {
      try {
        const saleDate = parseISO(sale.created_at);
        return isWithinInterval(saleDate, { start: periodStart, end: periodEnd });
      } catch {
        return false;
      }
    });

    // Calcular total do período
    const total = periodSales.reduce((sum, sale) => sum + Number(sale.total), 0);

    return {
      name: periodName,
      vendas: total,
      // Se quiser manter a meta (opcional)
      meta: period === "daily" ? 4000 : 
            period === "weekly" ? 30000 : 120000,
    };
  });
}

// Gerar dados vazios para o gráfico
function generateEmptyChartData(period: ChartPeriod) {
  const now = new Date();
  let periods: Date[];
  let periodFormat: (date: Date) => string;
  
  if (period === "daily") {
    const startDate = subDays(startOfDay(now), 6);
    periods = eachDayOfInterval({ start: startDate, end: now });
    periodFormat = (date: Date) => format(date, 'EEE', { locale: ptBR });
  } else if (period === "weekly") {
    const startDate = startOfWeek(subDays(now, 28));
    periods = eachWeekOfInterval({ 
      start: startDate, 
      end: now 
    }, { weekStartsOn: 1 });
    periodFormat = (date: Date) => `Sem ${format(date, 'w', { locale: ptBR })}`;
  } else {
    const startDate = startOfMonth(subDays(now, 180));
    periods = eachMonthOfInterval({ start: startDate, end: now });
    periodFormat = (date: Date) => format(date, 'MMM', { locale: ptBR });
  }

  return periods.map((periodStart) => ({
    name: periodFormat(periodStart),
    vendas: 0,
    meta: period === "daily" ? 4000 : 
          period === "weekly" ? 30000 : 120000,
  }));
}

// useSales.ts - Adicione esta função
export interface CategorySalesData {
  category: string;
  total_quantity: number;
  total_revenue: number;
}

// Função para buscar vendas por categoria
export function useCategorySales() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['sales', 'categories', currentStore?.id],
    queryFn: async () => {
      console.log('📊 [useCategorySales] Buscando vendas por categoria');
      
      if (!currentStore?.id) {
        console.log('⚠️ [useCategorySales] Nenhuma loja selecionada');
        return [];
      }

      try {
        // Buscar todas as vendas concluídas da loja com seus itens
        const { data: sales, error: salesError } = await supabase
          .from('sales')
          .select(`
            id,
            sale_items (
              product_id,
              quantity,
              price,
              products (
                category
              )
            )
          `)
          .eq('store_id', currentStore.id)
          .eq('status', 'concluida');

        if (salesError) {
          console.error('❌ [useCategorySales] Erro ao buscar vendas:', salesError);
          throw salesError;
        }

        if (!sales || sales.length === 0) {
          console.log('📭 [useCategorySales] Nenhuma venda encontrada');
          return [];
        }

        // Agrupar por categoria
        const categoryMap = new Map<string, CategorySalesData>();

        sales.forEach(sale => {
          const saleItems = sale.sale_items || [];
          
          saleItems.forEach((item: any) => {
            const product = item.products;
            if (!product || !product.category) return;

            const category = product.category;
            const quantity = item.quantity || 0;
            const price = item.price || 0;
            const revenue = price * quantity;

            if (categoryMap.has(category)) {
              const existing = categoryMap.get(category)!;
              existing.total_quantity += quantity;
              existing.total_revenue += revenue;
            } else {
              categoryMap.set(category, {
                category,
                total_quantity: quantity,
                total_revenue: revenue
              });
            }
          });
        });

        // Converter para array
        const categoryData = Array.from(categoryMap.values())
          .filter(item => item.total_revenue > 0)
          .sort((a, b) => b.total_revenue - a.total_revenue);

        console.log('✅ [useCategorySales] Dados por categoria:', categoryData.length);
        return categoryData;

      } catch (error) {
        console.error('💣 [useCategorySales] Erro:', error);
        return [];
      }
    },
    enabled: !!currentStore,
    staleTime: 5 * 60 * 1000,
  });
}