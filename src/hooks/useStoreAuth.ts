// hooks/useStoreAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface ActiveStore {
  id: string;
  name: string;
  sessionStart: string;
  requires_password?: boolean;
}

export function useStoreAuth() {
  const [activeStore, setActiveStore] = useState<ActiveStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingAccess, setVerifyingAccess] = useState(false);

  // Carrega adega ativa do localStorage
  useEffect(() => {
    const loadActiveStore = async () => {
      const storeId = localStorage.getItem('active_store_id');
      const storeName = localStorage.getItem('active_store_name');
      const sessionStart = localStorage.getItem('store_session_start');

      if (storeId && storeName && sessionStart) {
        // Verifica se a sessão ainda é válida (menos de 24 horas)
        const sessionDate = new Date(sessionStart);
        const now = new Date();
        const hoursDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setActiveStore({
            id: storeId,
            name: storeName,
            sessionStart
          });
        } else {
          // Sessão expirada
          clearStore();
        }
      }
      setLoading(false);
    };

    loadActiveStore();
  }, []);

  // Define adega ativa
  const setStore = async (storeId: string, storeName: string, requiresPassword = false) => {
    try {
      localStorage.setItem('active_store_id', storeId);
      localStorage.setItem('active_store_name', storeName);
      localStorage.setItem('store_session_start', new Date().toISOString());

      setActiveStore({
        id: storeId,
        name: storeName,
        sessionStart: new Date().toISOString(),
        requires_password: requiresPassword
      });

      // Salva sessão no banco
      await saveStoreSession(storeId);
      
      return true;
    } catch (error) {
      console.error('Erro ao definir adega ativa:', error);
      return false;
    }
  };

  // Verifica senha da adega
  const verifyStorePassword = async (storeId: string, password: string): Promise<boolean> => {
    try {
      const { data: store, error } = await supabase
        .from('stores')
        .select('store_password, requires_password')
        .eq('id', storeId)
        .single();

      if (error) {
        toast.error('Erro ao verificar adega');
        return false;
      }

      // Se a adega não requer senha, retorna true
      if (!store.requires_password) return true;

      // EM PRODUÇÃO: Substitua por bcrypt.compare()
      return store.store_password === password;
    } catch (error) {
      console.error('Erro na verificação de senha:', error);
      toast.error('Erro ao verificar senha');
      return false;
    }
  };

  // Acessa adega com senha
  const accessStoreWithPassword = async (storeId: string, storeName: string, password: string): Promise<boolean> => {
    setVerifyingAccess(true);
    try {
      const isValid = await verifyStorePassword(storeId, password);
      
      if (isValid) {
        await setStore(storeId, storeName, true);
        toast.success('Acesso concedido!');
        return true;
      } else {
        toast.error('Senha incorreta');
        return false;
      }
    } finally {
      setVerifyingAccess(false);
    }
  };

  // Acessa adega sem senha
  const accessStoreWithoutPassword = async (storeId: string, storeName: string): Promise<boolean> => {
    return await setStore(storeId, storeName, false);
  };

  // Verifica se o usuário tem alguma adega
  const hasStores = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Erro ao verificar adegas:', error);
      return false;
    }
  };

  // Obtém todas as adegas do usuário
  const getUserStores = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // CORREÇÃO: Remova o parâmetro extra 'user_id=eq.xxx' da URL
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      // .eq('user_id', user.id) // ← ESTÁ CAUSANDO ERRO 400
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar adegas:', error);
    return [];
  }
};

  // Limpa sessão
  const clearStore = () => {
    localStorage.removeItem('active_store_id');
    localStorage.removeItem('active_store_name');
    localStorage.removeItem('store_session_start');
    setActiveStore(null);
  };

  // Verifica se usuário tem acesso à adega ativa
  const checkStoreAccess = async (storeId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: store } = await supabase
      .from('stores')
      .select('user_id')
      .eq('id', storeId)
      .single();

    return store?.user_id === user.id;
  };

  // Middleware para proteger rotas que precisam de adega
  const requireStoreAuth = async (): Promise<boolean> => {
    if (!activeStore?.id) return false;
    
    const hasAccess = await checkStoreAccess(activeStore.id);
    if (!hasAccess) {
      clearStore();
      toast.info('Sessão expirada. Selecione uma adega novamente.');
      return false;
    }
    
    return true;
  };

  // Verifica se precisa redirecionar para seleção de adega
  const shouldRedirectToStoreSelect = async (): Promise<boolean> => {
    // Se já tem adega ativa, não redireciona
    if (activeStore?.id) return false;
    
    // Verifica se tem adegas
    const userHasStores = await hasStores();
    
    // Se não tem adegas, redireciona para criação
    if (!userHasStores) {
      return true; // Vai para /stores/create-first
    }
    
    // Se tem adegas mas nenhuma está selecionada, redireciona para seleção
    return true;
  };

  // Cria a primeira adega para novo usuário
  const createFirstStore = async (storeData: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    cnpj?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('stores')
        .insert({
          ...storeData,
          user_id: user.id,
          is_active: true,
          requires_password: false, // Primeira adega sem senha
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Define como adega ativa
      await setStore(data.id, data.name, false);
      
      toast.success('Primeira adega criada com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao criar primeira adega:', error);
      toast.error('Erro ao criar adega');
      throw error;
    }
  };

  // Define senha para adega atual
  const setStorePassword = async (password: string): Promise<boolean> => {
    try {
      if (!activeStore?.id) {
        toast.error('Nenhuma adega selecionada');
        return false;
      }

      // EM PRODUÇÃO: Use bcrypt.hash()
      const { error } = await supabase
        .from('stores')
        .update({
          store_password: password,
          requires_password: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeStore.id);

      if (error) throw error;

      toast.success('Senha definida com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao definir senha:', error);
      toast.error('Erro ao definir senha');
      return false;
    }
  };

  // Remove senha da adega atual
  const removeStorePassword = async (): Promise<boolean> => {
    try {
      if (!activeStore?.id) {
        toast.error('Nenhuma adega selecionada');
        return false;
      }

      const { error } = await supabase
        .from('stores')
        .update({
          store_password: null,
          requires_password: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeStore.id);

      if (error) throw error;

      toast.success('Senha removida com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao remover senha:', error);
      toast.error('Erro ao remover senha');
      return false;
    }
  };

  return {
    activeStore,
    loading,
    verifyingAccess,
    setStore,
    clearStore,
    checkStoreAccess,
    requireStoreAuth,
    verifyStorePassword,
    accessStoreWithPassword,
    accessStoreWithoutPassword,
    hasStores,
    getUserStores,
    shouldRedirectToStoreSelect,
    createFirstStore,
    setStorePassword,
    removeStorePassword
  };
}

// Salva sessão no banco
async function saveStoreSession(storeId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('store_sessions')
    .insert({
      user_id: user.id,
      store_id: storeId,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  if (error) console.error('Erro ao salvar sessão:', error);
}