import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStores } from './useStores';
import type { Database } from '@/integrations/supabase/types';

type DeliveryRow = Database['public']['Tables']['deliveries']['Row'];
type DeliveryStatus = Database['public']['Enums']['delivery_status'];

export interface DeliveryWithSale extends DeliveryRow {
  sales: {
    id: string;
    total: number;
    customer_id: string | null;
    customers: { name: string; phone: string | null } | null;
    sale_items: { quantity: number }[];
  } | null;
}

export function useDeliveries() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['deliveries', currentStore?.id],
    queryFn: async () => {
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          sales (
            id,
            total,
            customer_id,
            customers (name, phone),
            sale_items (quantity)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as DeliveryWithSale[];
    },
    enabled: !!currentStore,
  });
}

export function useActiveDeliveries() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['deliveries', 'active', currentStore?.id],
    queryFn: async () => {
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          sales (
            id,
            total,
            customer_id,
            customers (name, phone),
            sale_items (quantity)
          )
        `)
        .in('status', ['pendente', 'preparando', 'em_rota'])
        .order('created_at', { ascending: false });
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as DeliveryWithSale[];
    },
    enabled: !!currentStore,
  });
}

export function useCompletedDeliveries() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['deliveries', 'completed', currentStore?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let query = supabase
        .from('deliveries')
        .select(`
          *,
          sales (
            id,
            total,
            customer_id,
            customers (name, phone),
            sale_items (quantity)
          )
        `)
        .eq('status', 'entregue')
        .gte('delivered_at', today.toISOString())
        .order('delivered_at', { ascending: false })
        .limit(10);
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as DeliveryWithSale[];
    },
    enabled: !!currentStore,
  });
}

export function useDeliveryStats() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['deliveries', 'stats', currentStore?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let query = supabase
        .from('deliveries')
        .select('id, status, created_at, delivered_at')
        .gte('created_at', today.toISOString());
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }

      const { data: todayDeliveries, error } = await query;

      if (error) throw error;

      const total = todayDeliveries?.length || 0;
      const delivered = todayDeliveries?.filter(d => d.status === 'entregue').length || 0;
      const pending = todayDeliveries?.filter(d => d.status === 'pendente').length || 0;
      const preparing = todayDeliveries?.filter(d => d.status === 'preparando').length || 0;
      const inRoute = todayDeliveries?.filter(d => d.status === 'em_rota').length || 0;
      
      // Calculate average delivery time for delivered orders
      const deliveredWithTime = todayDeliveries?.filter(d => d.status === 'entregue' && d.delivered_at) || [];
      let avgTimeMinutes = 0;
      if (deliveredWithTime.length > 0) {
        const totalMinutes = deliveredWithTime.reduce((sum, d) => {
          const created = new Date(d.created_at).getTime();
          const deliveredTime = new Date(d.delivered_at!).getTime();
          return sum + (deliveredTime - created) / (1000 * 60);
        }, 0);
        avgTimeMinutes = Math.round(totalMinutes / deliveredWithTime.length);
      }

      const successRate = total > 0 ? Math.round((delivered / total) * 100 * 10) / 10 : 0;

      return {
        total,
        delivered,
        pending,
        preparing,
        inRoute,
        avgTimeMinutes,
        successRate,
      };
    },
    enabled: !!currentStore,
  });
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DeliveryStatus }) => {
      const updates: Partial<DeliveryRow> = { status };
      
      if (status === 'entregue') {
        updates.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });
}

export interface CreateDeliveryInput {
  sale_id: string;
  address: string;
  neighborhood?: string;
  city?: string;
  delivery_fee?: number;
  notes?: string;
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  const { currentStore } = useStores();

  return useMutation({
    mutationFn: async (input: CreateDeliveryInput) => {
      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          sale_id: input.sale_id,
          address: input.address,
          neighborhood: input.neighborhood || null,
          city: input.city || null,
          delivery_fee: input.delivery_fee || 0,
          notes: input.notes || null,
          status: 'pendente',
          store_id: currentStore?.id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Entrega criada!');
    },
    onError: (error) => {
      toast.error('Erro ao criar entrega: ' + error.message);
    },
  });
}
