// app/dashboard/page.js ou similar
import { redirect } from 'next/navigation';
import { getStoresByUser } from '@/lib/supabase';

export default async function DashboardPage() {
  const { data: stores, error } = await getStoresByUser();
  
  if (error) {
    return <div>Erro ao carregar adegas</div>;
  }
  
  // Se não tem adegas, redireciona para criar a primeira
  if (!stores || stores.length === 0) {
    redirect('/stores/create-first');
  }
  
  // Se tem apenas 1 adega SEM senha, redireciona direto
  if (stores.length === 1 && !stores[0].store_password) {
    redirect(`/stores/${stores[0].id}/dashboard`);
  }
  
  // Se tem múltiplas adegas ou precisa de senha, mostra seleção
  redirect('/stores/select');
}