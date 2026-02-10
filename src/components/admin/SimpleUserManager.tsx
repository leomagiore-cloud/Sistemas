// src/components/admin/SimpleUserManager.tsx
import { useState, useEffect } from "react";
import { Users, Check, ShieldOff, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SimpleUserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [blocking, setBlocking] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando usuários...');
      
      // Busca TODOS os usuários diretamente
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro:', error);
        toast.error('Erro ao carregar usuários: ' + error.message);
        return;
      }
      
      console.log(`✅ ${data?.length || 0} usuários carregados`);
      setUsers(data || []);
    } catch (error: any) {
      console.error('🚨 Erro crítico:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      setApproving(userId);
      console.log('✅ Aprovando usuário:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('Usuário aprovado!');
      loadUsers(); // Recarrega a lista
    } catch (error: any) {
      console.error('❌ Erro ao aprovar:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      setApproving(null);
    }
  };

  const toggleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    try {
      setBlocking(userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: !currentlyBlocked,
          blocked_at: currentlyBlocked ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(`Usuário ${currentlyBlocked ? 'desbloqueado' : 'bloqueado'}!`);
      loadUsers();
    } catch (error: any) {
      console.error('❌ Erro:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      setBlocking(null);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <Card variant="elevated">
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-wine-light" />
            Gerenciamento de Usuários
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role || 'user'}
                    </Badge>
                    <Badge variant={user.is_approved ? 'success' : 'outline'}>
                      {user.is_approved ? 'Aprovado' : 'Pendente'}
                    </Badge>
                    {user.is_blocked && (
                      <Badge variant="destructive">Bloqueado</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!user.is_approved && !user.is_blocked && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => approveUser(user.id)}
                      disabled={approving === user.id}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {approving === user.id ? 'Aprovando...' : 'Aprovar'}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant={user.is_blocked ? "outline" : "destructive"}
                    onClick={() => toggleBlockUser(user.id, user.is_blocked)}
                    disabled={blocking === user.id}
                  >
                    <ShieldOff className="h-4 w-4 mr-1" />
                    {blocking === user.id ? '...' : user.is_blocked ? 'Desbloquear' : 'Bloquear'}
                  </Button>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-muted-foreground">
                Criado em: {new Date(user.created_at).toLocaleString('pt-BR')}
                {user.approved_at && ` • Aprovado em: ${new Date(user.approved_at).toLocaleString('pt-BR')}`}
              </div>
            </div>
          ))}
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        )}
        
        {/* Estatísticas */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {users.filter(u => !u.is_approved && !u.is_blocked).length}
              </p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.is_approved && !u.is_blocked).length}
              </p>
              <p className="text-sm text-muted-foreground">Aprovados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {users.filter(u => u.is_blocked).length}
              </p>
              <p className="text-sm text-muted-foreground">Bloqueados</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}