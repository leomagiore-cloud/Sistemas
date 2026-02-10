import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStores } from './useStores';

export interface FinancialTransaction {
  id: string;
  type: 'entrada' | 'saida';
  category: string;
  description: string | null;
  amount: number;
  payment_method: string | null;
  sale_id: string | null;
  user_id: string | null;
  store_id: string | null;
  created_at: string;
}

export function useFinancialTransactions() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['financial_transactions', currentStore?.id],
    queryFn: async () => {
      let query = supabase
        .from('financial_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as FinancialTransaction[];
    },
    enabled: !!currentStore,
  });
}

export function useFinancialStats() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['financial_transactions', 'stats', currentStore?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      let query = supabase
        .from('financial_transactions')
        .select('*')
        .gte('created_at', monthStart.toISOString());
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }

      const { data: monthTransactions } = await query;

      const transactions = monthTransactions || [];
      
      const entradas = transactions
        .filter(t => t.type === 'entrada')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const saidas = transactions
        .filter(t => t.type === 'saida')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        entradas,
        saidas,
        saldo: entradas - saidas,
      };
    },
    enabled: !!currentStore,
  });
}
