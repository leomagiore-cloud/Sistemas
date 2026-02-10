// src/components/DebugAuthFlow.tsx
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useProfilePermissions } from '@/hooks/useProfile';

export function DebugAuthFlow() {
  const { user, isAdmin } = useAuth();
  const { data: profile } = useProfile();
  const { isApproved, role, hasPermission } = useProfilePermissions();
  
  useEffect(() => {
    console.log('=== 🔍 DEBUG AUTH FLOW ===');
    console.log('1. Usuário Auth:', {
      id: user?.id,
      email: user?.email,
      isAdmin: isAdmin
    });
    
    console.log('2. Perfil do banco:', profile ? {
      id: profile.id,
      role: profile.role,
      is_approved: profile.is_approved,
      is_blocked: profile.is_blocked,
      source: 'database'
    } : 'null (usando fallback)');
    
    console.log('3. Permissões:', {
      isApproved,
      role,
      canAccessAdmin: hasPermission('admin'),
      canSeeUsers: isAdmin
    });
    
    console.log('=== 🏁 FIM DEBUG ===');
  }, [user, profile, isAdmin, isApproved, role, hasPermission]);
  
  return null;
}

// Adicione no App.tsx: <DebugAuthFlow />