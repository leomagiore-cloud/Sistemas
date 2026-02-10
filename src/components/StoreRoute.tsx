// src/components/StoreRoute.tsx - VERSÃO SIMPLIFICADA
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStoreAuth } from '@/hooks/useStoreAuth';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function StoreRoute() {
  const { user, loading: authLoading } = useAuth();
  const { activeStore, loading, requireStoreAuth } = useStoreAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      setChecking(true);
      
      if (authLoading || loading) return;
      
      if (!user) {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      if (!activeStore?.id) {
        const isStoreSelectionRoute = location.pathname.includes('/select-store') || 
                                     location.pathname.includes('/stores/create');
        
        if (isStoreSelectionRoute) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
        setChecking(false);
        return;
      }

      const access = await requireStoreAuth();
      setHasAccess(access);
      setChecking(false);
    };

    checkAccess();
  }, [user, authLoading, loading, activeStore, requireStoreAuth, location.pathname]);

  if (authLoading || loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    if (!user) {
      return <Navigate to="/auth" replace />;
    }
    
    if (!activeStore?.id && !location.pathname.includes('/select-store')) {
      return <Navigate to="/select-store" replace />;
    }
    
    return <Navigate to="/select-store" replace />;
  }

  return <Outlet />;
}