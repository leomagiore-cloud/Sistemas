import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

/* -----------------------------
   Tipos
------------------------------ */
export interface Store {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at?: string;
  email?: string;
  phone?: string;
  address?: string;
  cnpj?: string;
  open_time?: string;
  close_time?: string;
  dark_mode?: boolean;
  sound_notifications?: boolean;
  auto_backup?: boolean;
}

type StoreRole = "proprietario" | "gerente" | "funcionario";

interface StoresContextType {
  stores: Store[];
  currentStore: Store | null;
  currentStoreRole: StoreRole | null;
  isLoading: boolean;

  setCurrentStore: (store: Store) => Promise<void>;
  createStore: (name: string) => Promise<void>;
  updateStore: (data: Partial<Store> & { id: string }) => Promise<void>;
  refreshStores: () => Promise<void>;
}

/* -----------------------------
   Context
------------------------------ */
const StoresContext = createContext<StoresContextType | undefined>(undefined);

/* -----------------------------
   Provider
------------------------------ */
export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [currentStoreRole, setCurrentStoreRole] =
    useState<StoreRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* -----------------------------
     Carregar adegas do usuário
  ------------------------------ */
  const loadStores = async () => {
    if (!user) {
      setStores([]);
      setCurrentStoreState(null);
      setCurrentStoreRole(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar adegas");
      console.error('❌ Erro ao carregar stores:', error);
      setIsLoading(false);
      return;
    }

    console.log('✅ Stores carregadas:', data?.length || 0);
    setStores(data || []);

    // Define a primeira como ativa automaticamente
    if (data && data.length > 0) {
      setCurrentStoreState(data[0]);
      setCurrentStoreRole("proprietario");
    } else {
      setCurrentStoreState(null);
      setCurrentStoreRole(null);
    }

    setIsLoading(false);
  };

  /* -----------------------------
     Criar nova adega
  ------------------------------ */
  const createStore = async (name: string) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    console.log('🔄 Criando store:', name);

    const storeData = {
      name,
      owner_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: '09:00',
      close_time: '22:00',
      dark_mode: true,
      sound_notifications: true,
      auto_backup: true,
    };

    const { data, error } = await supabase
      .from("stores")
      .insert(storeData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar store:', error);
      toast.error("Erro ao criar adega: " + error.message);
      throw error;
    }

    toast.success("Adega criada com sucesso");

    setStores((prev) => [...prev, data]);
    setCurrentStoreState(data);
    setCurrentStoreRole("proprietario");
    
    return data;
  };

  /* -----------------------------
     Atualizar adega (MUTATION)
  ------------------------------ */
  const updateStoreMutation = useMutation({
    mutationFn: async (data: Partial<Store> & { id: string }) => {
      console.log('🔄 Atualizando store:', data.id);
      
      // ✅ Remove campos undefined e converte booleanos
      const cleanData: any = { ...data };
      delete cleanData.id; // Remove id do objeto de update
      
      // Garante que booleanos sejam booleanos
      if (cleanData.dark_mode !== undefined) {
        cleanData.dark_mode = Boolean(cleanData.dark_mode);
      }
      if (cleanData.sound_notifications !== undefined) {
        cleanData.sound_notifications = Boolean(cleanData.sound_notifications);
      }
      if (cleanData.auto_backup !== undefined) {
        cleanData.auto_backup = Boolean(cleanData.auto_backup);
      }
      
      cleanData.updated_at = new Date().toISOString();
      
      console.log('📤 Dados limpos para update:', cleanData);
      
      const { error } = await supabase
        .from("stores")
        .update(cleanData)
        .eq("id", data.id);

      if (error) {
        console.error('❌ Erro no update:', error);
        throw error;
      }
      
      return { ...cleanData, id: data.id };
    },
    onSuccess: (updatedData) => {
      toast.success("Adega atualizada");
      
      // Atualiza a lista de stores
      setStores((prev) =>
        prev.map((s) => (s.id === updatedData.id ? { ...s, ...updatedData } : s))
      );

      // Atualiza a store atual se for a mesma
      if (currentStore?.id === updatedData.id) {
        setCurrentStoreState((prev) =>
          prev ? { ...prev, ...updatedData } : prev
        );
      }
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutation updateStore:', error);
      toast.error("Erro ao atualizar adega: " + error.message);
    }
  });

  const updateStore = async (data: Partial<Store> & { id: string }) => {
    return updateStoreMutation.mutateAsync(data);
  };

  /* -----------------------------
     Trocar adega ativa
  ------------------------------ */
  const setCurrentStore = async (store: Store) => {
    setCurrentStoreState(store);
    setCurrentStoreRole("proprietario");
  };

  /* -----------------------------
     Refresh manual
  ------------------------------ */
  const refreshStores = async () => {
    await loadStores();
  };

  /* -----------------------------
     Effects
  ------------------------------ */
  useEffect(() => {
    loadStores();
  }, [user?.id]);

  /* -----------------------------
     Context value
  ------------------------------ */
  const value: StoresContextType = {
    stores,
    currentStore,
    currentStoreRole,
    isLoading,
    setCurrentStore,
    createStore,
    updateStore,
    refreshStores,
  };

  return (
    <StoresContext.Provider value={value}>
      {children}
    </StoresContext.Provider>
  );
}

/* -----------------------------
   Hooks
------------------------------ */
export function useStores() {
  const context = useContext(StoresContext);
  if (!context) {
    throw new Error("useStores must be used within StoreProvider");
  }
  return context;
}

export function useCurrentStore() {
  const { currentStore } = useStores();
  return currentStore;
}