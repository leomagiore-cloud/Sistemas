import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { useStores } from './useStores';

export interface StockMovement {
  id: string;
  product_id: string;
  user_id: string | null;
  store_id: string | null;
  type: 'entrada' | 'saida' | 'ajuste' | 'perda';
  quantity: number;
  reason: string | null;
  created_at: string;
}

export interface StockMovementWithProduct extends StockMovement {
  products: { name: string };
}

export function useStockMovements(limit: number = 50) {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['stock_movements', limit, currentStore?.id],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          products (name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as StockMovementWithProduct[];
    },
    enabled: !!currentStore,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentStore } = useStores();

  return useMutation({
    mutationFn: async (movement: {
      product_id: string;
      type: StockMovement['type'];
      quantity: number;
      reason?: string;
    }) => {
      // Create movement
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: movement.product_id,
          user_id: user?.id || null,
          store_id: currentStore?.id || null,
          type: movement.type,
          quantity: movement.quantity,
          reason: movement.reason || null,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Update product stock
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', movement.product_id)
        .single();
      
      if (product) {
        let newStock = product.stock_quantity;
        if (movement.type === 'entrada') {
          newStock += movement.quantity;
        } else if (movement.type === 'saida' || movement.type === 'perda') {
          newStock -= movement.quantity;
        } else if (movement.type === 'ajuste') {
          newStock = movement.quantity; // Ajuste define o valor exato
        }

        await supabase
          .from('products')
          .update({ stock_quantity: Math.max(0, newStock) })
          .eq('id', movement.product_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Movimentação registrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar movimentação: ' + error.message);
    },
  });
}
