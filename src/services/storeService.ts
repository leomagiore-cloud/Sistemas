import { supabase } from '@/lib/supabase';

export interface Store {
  id: string;
  name: string;
  address?: string;
  requires_password: boolean;
  store_password?: string;
  created_at: string;
  updated_at: string;
}

export async function getUserStores(): Promise<Store[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function checkUserStores(userId: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

export async function verifyStorePassword(storeId: string, password: string): Promise<boolean> {
  const { data: store } = await supabase
    .from('stores')
    .select('store_password')
    .eq('id', storeId)
    .single();

  if (!store?.store_password) return false;
  
  // EM PRODUÇÃO: Use bcrypt.compare()
  return store.store_password === password;
}

export async function setStorePassword(storeId: string, password: string): Promise<void> {
  // EM PRODUÇÃO: Hash a senha
  const { error } = await supabase
    .from('stores')
    .update({
      store_password: password,
      requires_password: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', storeId);

  if (error) throw error;
}