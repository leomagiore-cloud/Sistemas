// src/hooks/usePermissions.tsx
import { useProfile } from './useProfile';
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  
  const hasPermission = (requiredRole: string) => {
    if (!profile || !user) return false;
    
    // Verifique se o usuário está aprovado e não bloqueado
    if (!profile.is_approved || profile.is_blocked) return false;
    
    // Adicione lógica de roles conforme sua necessidade
    // Por enquanto, vamos considerar que usuários aprovados têm acesso básico
    const userRole = profile.role || 'user';
    const roleHierarchy = {
      'admin': 4,
      'manager': 3,
      'seller': 2,
      'user': 1
    };
    
    return roleHierarchy[userRole as keyof typeof roleHierarchy] >= 
           roleHierarchy[requiredRole as keyof typeof roleHierarchy];
  };

  const isAdmin = () => hasPermission('admin');
  const isManager = () => hasPermission('manager');
  const isSeller = () => hasPermission('seller');
  const isApprovedUser = () => profile?.is_approved === true && !profile?.is_blocked;

  return {
    hasPermission,
    isAdmin,
    isManager,
    isSeller,
    isApprovedUser,
    profile,
  };
}