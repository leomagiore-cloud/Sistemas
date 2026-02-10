// types/store.ts
export interface Store {
  id: string;
  user_id: string;
  name: string;
  store_password?: string;
  requires_password: boolean;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreSession {
  id: string;
  user_id: string;
  store_id: string;
  expires_at: string;
  created_at: string;
}