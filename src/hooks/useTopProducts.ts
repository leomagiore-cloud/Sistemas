// src/hooks/useTopProducts.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStores } from './useStores';

export interface TopProduct {
  product_id: string;
  product_name: string;
  category: string;
  total_quantity: number;
  total_revenue: number;
  image_url?: string;
  unit_price: number;
}

export function useTopProducts(limit: number = 5) {
  const { currentStore } = useStores();

  return useQuery({
    queryKey: ['top-products', currentStore?.id, limit],
    queryFn: async () => {
      console.log('📊 [useTopProducts] Buscando produtos mais vendidos');
      
      if (!currentStore?.id) {
        console.log('⚠️ [useTopProducts] Nenhuma loja selecionada');
        return [];
      }

      try {
        // Primeiro, buscar todas as vendas concluídas da loja
        const { data: sales, error: salesError } = await supabase
          .from('sales')
          .select('id')
          .eq('store_id', currentStore.id)
          .eq('status', 'concluida');

        if (salesError) {
          console.error('❌ [useTopProducts] Erro ao buscar vendas:', salesError);
          throw salesError;
        }

        if (!sales || sales.length === 0) {
          console.log('📭 [useTopProducts] Nenhuma venda encontrada');
          return [];
        }

        const saleIds = sales.map(sale => sale.id);

        // Buscar itens dessas vendas
        const { data: saleItems, error: itemsError } = await supabase
          .from('sale_items')
          .select(`
            id,
            sale_id,
            product_id,
            quantity,
            price,
            products (
              name,
              category,
              image_url
            )
          `)
          .in('sale_id', saleIds);

        if (itemsError) {
          console.error('❌ [useTopProducts] Erro ao buscar itens:', itemsError);
          throw itemsError;
        }

        console.log('📦 [useTopProducts] Itens encontrados:', saleItems?.length);

        // Agrupar por produto
        const productMap = new Map<string, TopProduct>();

        saleItems?.forEach((item: any) => {
          const product = item.products;
          if (!product) return;

          const productId = item.product_id;
          const quantity = item.quantity || 0;
          const unitPrice = item.price || 0;
          const revenue = unitPrice * quantity; // Faturamento correto: preço × quantidade

          if (productMap.has(productId)) {
            const existing = productMap.get(productId)!;
            existing.total_quantity += quantity;
            existing.total_revenue += revenue;
            // Atualizar preço unitário (média ponderada)
            existing.unit_price = (existing.unit_price + unitPrice) / 2;
          } else {
            productMap.set(productId, {
              product_id: productId,
              product_name: product.name,
              category: product.category,
              total_quantity: quantity,
              total_revenue: revenue,
              image_url: product.image_url,
              unit_price: unitPrice
            });
          }
        });

        // Converter para array e ordenar por quantidade vendida
        const topProducts = Array.from(productMap.values())
          .sort((a, b) => b.total_quantity - a.total_quantity)
          .slice(0, limit);

        console.log('✅ [useTopProducts] Top produtos encontrados:', topProducts.length);
        topProducts.forEach(product => {
          console.log(`  • ${product.product_name}: ${product.total_quantity} un, R$ ${product.total_revenue.toFixed(2)}`);
        });

        return topProducts as TopProduct[];

      } catch (error) {
        console.error('💣 [useTopProducts] Erro geral:', error);
        return [];
      }
    },
    enabled: !!currentStore,
    staleTime: 5 * 60 * 1000,
  });
}