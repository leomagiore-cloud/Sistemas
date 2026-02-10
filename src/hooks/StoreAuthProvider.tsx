// hooks/useStoreAuth.tsx (Provider)
import { createContext, useContext, ReactNode } from 'react';
import { useStoreAuth } from './useStoreAuth';

const StoreAuthContext = createContext<ReturnType<typeof useStoreAuth> | null>(null);

export function StoreAuthProvider({ children }: { children: ReactNode }) {
  const storeAuth = useStoreAuth();
  
  return (
    <StoreAuthContext.Provider value={storeAuth}>
      {children}
    </StoreAuthContext.Provider>
  );
}

export const useStoreAuthContext = () => {
  const context = useContext(StoreAuthContext);
  if (!context) {
    throw new Error('useStoreAuthContext must be used within StoreAuthProvider');
  }
  return context;
};