import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStores } from './useStores';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  address: string | null;
  city: string | null;
  neighborhood: string | null;
  birth_date: string | null;
  loyalty_points: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  store_id: string | null;
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'loyalty_points' | 'store_id'>;
export type CustomerUpdate = Partial<CustomerInsert>;

export function useCustomers() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['customers', currentStore?.id],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!currentStore,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Customer | null;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { currentStore } = useStores();

  return useMutation({
    mutationFn: async (customer: CustomerInsert) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({ ...customer, store_id: currentStore?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente cadastrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar cliente: ' + error.message);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CustomerUpdate }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar cliente: ' + error.message);
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover cliente: ' + error.message);
    },
  });
}

export function useBirthdayCustomers() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['customers', 'birthdays', currentStore?.id],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .not('birth_date', 'is', null)
        .order('name');
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const currentMonth = new Date().getMonth() + 1;
      return (data as Customer[]).filter(c => {
        if (!c.birth_date) return false;
        const month = new Date(c.birth_date).getMonth() + 1;
        return month === currentMonth;
      });
    },
    enabled: !!currentStore,
  });
}
