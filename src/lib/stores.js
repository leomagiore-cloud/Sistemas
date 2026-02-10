// lib/stores.js
export async function updateStorePassword(storeId, currentPassword, newPassword) {
  // 1. Verifica senha atual
  const { data: store } = await supabase
    .from('stores')
    .select('store_password')
    .eq('id', storeId)
    .single();
  
  if (!store || store.store_password !== currentPassword) {
    return false;
  }
  
  // 2. Atualiza com nova senha
  // EM PRODUÇÃO: Faça hash da senha!
  const { error } = await supabase
    .from('stores')
    .update({ 
      store_password: newPassword,
      updated_at: new Date().toISOString()
    })
    .eq('id', storeId);
  
  return !error;
}