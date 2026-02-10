// src/components/auth/RequireAuth.tsx - VERSÃO DEBUG
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfilePermissions } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'seller' | 'user';
}

export function RequireAuth({ children, requiredRole = 'user' }: RequireAuthProps) {
  const { user, loading: authLoading } = useAuth();
  const { isApproved, hasPermission, isAdmin } = useProfilePermissions();

  // DEBUG
  console.log('🔐 [RequireAuth] Verificando:', {
    user: user?.id,
    authLoading,
    isApproved,
    isAdmin,
    requiredRole,
    hasPermission: requiredRole ? hasPermission(requiredRole) : true
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-wine" />
      </div>
    );
  }

  if (!user) {
    console.log('🔐 [RequireAuth] Redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  // ✅ PERMITE ADMIN SEM VERIFICAÇÃO DE APROVAÇÃO
  if (isAdmin) {
    console.log('👑 [RequireAuth] Usuário é admin, permitindo acesso');
    return <>{children}</>;
  }

  // Para não-admins, verifica aprovação
  if (!isApproved) {
    console.log('⏳ [RequireAuth] Usuário não aprovado, redirecionando');
    return <Navigate to="/waiting-approval" replace />;
  }

  // Verifica role específica se necessário
  if (requiredRole && !hasPermission(requiredRole)) {
    console.log('🚫 [RequireAuth] Permissão insuficiente para:', requiredRole);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ [RequireAuth] Acesso permitido');
  return <>{children}</>;
}