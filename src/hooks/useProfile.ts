// src/hooks/useProfile.tsx - VERSÃO COMPLETA CORRIGIDA
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_approved: boolean;
  is_blocked: boolean;
  approved_at: string | null;
  approved_by: string | null;
  blocked_at: string | null;
  blocked_reason: string | null;
  role?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        console.log('🔄 [useProfile] Buscando perfil para usuário:', user.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('❌ [useProfile] Erro ao buscar perfil:', error);
          
          // Se o perfil não existir, cria um automaticamente
          if (error.code === 'PGRST116') {
            console.log('➕ [useProfile] Perfil não encontrado, criando automaticamente...');
            await createDefaultProfile(user);
            
            // Tenta buscar novamente
            const { data: newData, error: newError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (newError) {
              console.error('❌ [useProfile] Erro ao buscar perfil após criação:', newError);
              throw newError;
            }
            
            console.log('✅ [useProfile] Perfil criado automaticamente');
            return formatProfile(newData, user);
          }
          
          throw error;
        }
        
        console.log('✅ [useProfile] Perfil encontrado no banco');
        return formatProfile(data, user);
        
      } catch (error: any) {
        console.error('🚨 [useProfile] Erro crítico ao buscar perfil:', error);
        
        // Em caso de erro de política RLS ou qualquer outro erro,
        // retorna um perfil FORÇADO para o admin
        console.log('🔄 [useProfile] Criando perfil local como fallback...');
        return createLocalProfile(user);
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ✅ FUNÇÃO CRÍTICA: Cria perfil local quando o banco falha
function createLocalProfile(user: any): Profile {
  const userId = user.id;
  const userEmail = user.email;
  
  // ✅ IDENTIFICAÇÃO DO ADMIN PELO ID
  const isAdminUser = userId === 'e82db248-3bcb-43c5-b455-b9a4d45acbef';
  
  console.log('👤 [createLocalProfile] Criando perfil local para:', {
    userId,
    isAdminUser,
    email: userEmail
  });
  
  return {
    id: userId,
    email: userEmail,
    full_name: user.user_metadata?.full_name || null,
    avatar_url: null,
    phone: null,
    // ✅ ADMIN SEMPRE APROVADO, outros não
    is_approved: isAdminUser,
    is_blocked: false,
    approved_at: isAdminUser ? new Date().toISOString() : null,
    approved_by: null,
    blocked_at: null,
    blocked_reason: null,
    // ✅ ADMIN SEMPRE COM ROLE 'admin'
    role: isAdminUser ? 'admin' : 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Profile;
}

// ✅ FUNÇÃO para formatar o perfil do banco
function formatProfile(data: any, user: any): Profile {
  const userId = user.id;
  const userEmail = user.email;
  
  // ✅ IDENTIFICAÇÃO DO ADMIN PELO ID
  const isAdminUser = userId === 'e82db248-3bcb-43c5-b455-b9a4d45acbef';
  
  console.log('📝 [formatProfile] Formatando perfil:', {
    dataRole: data.role,
    dataIsApproved: data.is_approved,
    isAdminUser,
    userId
  });
  
  // ✅ FORÇA admin ser aprovado independente do que está no banco
  const isApproved = isAdminUser ? true : (data.is_approved === true);
  const role = isAdminUser ? 'admin' : (data.role || 'user');
  
  return {
    id: data.id || userId,
    email: data.email || userEmail,
    full_name: data.full_name || user.user_metadata?.full_name || null,
    avatar_url: data.avatar_url || null,
    phone: data.phone || null,
    is_approved: isApproved,
    is_blocked: data.is_blocked === true,
    approved_at: data.approved_at || (isAdminUser ? new Date().toISOString() : null),
    approved_by: data.approved_by || null,
    blocked_at: data.blocked_at || null,
    blocked_reason: data.blocked_reason || null,
    role: role,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  } as Profile;
}

// ✅ Função para criar perfil padrão no banco
async function createDefaultProfile(user: any) {
  try {
    console.log('🏗️ [createDefaultProfile] Criando perfil padrão para:', user.id);
    
    const userId = user.id;
    const isAdminUser = userId === 'e82db248-3bcb-43c5-b455-b9a4d45acbef';
    
    const profileData = {
      id: userId,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      // ✅ Admin criado já como admin e aprovado
      role: isAdminUser ? 'admin' : 'user',
      is_approved: isAdminUser, // Admin true, outros false
      is_blocked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('📦 [createDefaultProfile] Dados do perfil:', profileData);
    
    const { error } = await supabase
      .from('profiles')
      .insert(profileData);
    
    if (error) {
      console.error('❌ [createDefaultProfile] Erro ao criar perfil:', error);
      
      // Tenta com campos mínimos
      try {
        const { error: simpleError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: user.user_metadata?.full_name || '',
            role: isAdminUser ? 'admin' : 'user',
          });
        
        if (simpleError) throw simpleError;
        console.log('✅ [createDefaultProfile] Perfil criado com campos mínimos');
      } catch (simpleError: any) {
        console.error('❌ [createDefaultProfile] Falha ao criar perfil mínimo:', simpleError);
        throw simpleError;
      }
    } else {
      console.log('✅ [createDefaultProfile] Perfil padrão criado com sucesso');
    }
    
  } catch (error) {
    console.error('🚨 [createDefaultProfile] Falha crítica ao criar perfil:', error);
    throw error;
  }
}

export function useAllProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profiles', 'all'],
    queryFn: async () => {
      try {
        console.log('🔍 [useAllProfiles] Buscando TODOS os perfis...');
        
        // AGORA com políticas simples, pode buscar tudo
        const { data, error, count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });
        
        console.log('📊 [useAllProfiles] Resultado:', {
          total: count,
          encontrados: data?.length,
          erro: error?.message
        });
        
        if (error) {
          console.error('❌ [useAllProfiles] Erro:', error);
          
          // Fallback: busca apenas o próprio
          const { data: ownData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single();
          
          return ownData ? [ownData] as Profile[] : [];
        }
        
        return data as Profile[];
      } catch (error) {
        console.error('🚨 [useAllProfiles] Erro crítico:', error);
        return [];
      }
    },
    enabled: !!user,
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      // Invalida queries específicas
      queryClient.invalidateQueries({ queryKey: ['profiles', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success('Usuário aprovado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao aprovar usuário:', error);
      toast.error('Erro ao aprovar usuário: ' + (error.message || 'Erro desconhecido'));
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success('Usuário bloqueado!');
    },
    onError: (error: any) => {
      console.error('Erro ao bloquear usuário:', error);
      toast.error('Erro ao bloquear usuário: ' + (error.message || 'Erro desconhecido'));
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: false,
          blocked_at: null,
          blocked_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success('Usuário desbloqueado!');
    },
    onError: (error: any) => {
      console.error('Erro ao desbloquear usuário:', error);
      toast.error('Erro ao desbloquear usuário: ' + (error.message || 'Erro desconhecido'));
    },
  });
}

export function useRevokeApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: false,
          approved_at: null,
          approved_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success('Aprovação revogada!');
    },
    onError: (error: any) => {
      console.error('Erro ao revogar aprovação:', error);
      toast.error('Erro ao revogar aprovação: ' + (error.message || 'Erro desconhecido'));
    },
  });
}

// Hook auxiliar para permissões - ATUALIZADO
export function useProfilePermissions() {
  const { data: profile } = useProfile();
  
  const role = profile?.role || 'user';
  
  // ✅ CORREÇÃO: is_approved baseado no ID para admin
  const isAdminUser = profile?.id === 'e82db248-3bcb-43c5-b455-b9a4d45acbef';
  const isApproved = isAdminUser ? true : (profile?.is_approved === true && profile?.is_blocked === false);
  
  console.log('🔐 [useProfilePermissions] Verificando permissões:', {
    profileId: profile?.id,
    role,
    isApproved,
    isAdminUser,
    dbIsApproved: profile?.is_approved,
    dbIsBlocked: profile?.is_blocked
  });
  
  const hasPermission = (requiredRole: string) => {
    if (!isApproved) {
      console.log('⛔ [hasPermission] Usuário não aprovado');
      return false;
    }
    
    const roleHierarchy = {
      'admin': 4,
      'manager': 3,
      'seller': 2,
      'user': 1
    };
    
    const userLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 1;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 1;
    
    const hasPerm = userLevel >= requiredLevel;
    console.log(`📊 [hasPermission] ${role} (${userLevel}) >= ${requiredRole} (${requiredLevel}) = ${hasPerm}`);
    
    return hasPerm;
  };

  // ✅ Retornar propriedades booleanas (não funções)
  const isAdmin = hasPermission('admin');
  const isManager = hasPermission('manager');
  const isSeller = hasPermission('seller');
  const isRegularUser = role === 'user' && isApproved;

  return {
    profile,
    isApproved,
    role,
    hasPermission, // função
    isAdmin,       // booleano
    isManager,     // booleano
    isSeller,      // booleano
    isRegularUser, // booleano
  };
}