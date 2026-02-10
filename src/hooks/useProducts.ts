import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStores } from './useStores';
import type { Database } from '@/integrations/supabase/types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];
type ProductCategory = Database['public']['Enums']['product_category'];

export type Product = ProductRow;
export type { ProductCategory };

export function useProducts() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['products', currentStore?.id],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!currentStore,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { currentStore } = useStores();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...product, store_id: currentStore?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar produto: ' + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProductUpdate }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover produto: ' + error.message);
    },
  });
}

export function useLowStockProducts() {
  const { currentStore } = useStores();
  
  return useQuery({
    queryKey: ['products', 'low-stock', currentStore?.id],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('stock_quantity');
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter products where stock is below minimum
      return (data as Product[]).filter(p => p.stock_quantity <= p.min_stock);
    },
    enabled: !!currentStore,
  });
}

export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'vinho_tinto', label: 'Vinho Tinto' },
  { value: 'vinho_branco', label: 'Vinho Branco' },
  { value: 'vinho_rose', label: 'Vinho Rosé' },
  { value: 'espumante', label: 'Espumante' },
  { value: 'cerveja_pilsen', label: 'Cerveja Pilsen' },
  { value: 'cerveja_ipa', label: 'Cerveja IPA' },
  { value: 'cerveja_stout', label: 'Cerveja Stout' },
  { value: 'cerveja_artesanal', label: 'Cerveja Artesanal' },
  { value: 'vodka', label: 'Vodka' },
  { value: 'whisky', label: 'Whisky' },
  { value: 'rum', label: 'Rum' },
  { value: 'gin', label: 'Gin' },
  { value: 'tequila', label: 'Tequila' },
  { value: 'cachaca', label: 'Cachaça' },
  { value: 'licor', label: 'Licor' },
  { value: 'refrigerante', label: 'Refrigerante' },
  { value: 'suco', label: 'Suco' },
  { value: 'agua', label: 'Água' },
  { value: 'energetico', label: 'Energético' },
  { value: 'gelo', label: 'Gelo' },
  { value: 'carvao', label: 'Carvão' },
  { value: 'narguile', label: 'Narguilé' },
  { value: 'essencia', label: 'Essência' },
  { value: 'acessorio', label: 'Acessório' },
  { value: 'aperitivo', label: 'Aperitivo' },
  { value: 'combo', label: 'Combo' },
];
