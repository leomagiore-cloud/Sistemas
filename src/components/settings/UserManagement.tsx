import { useState } from 'react';
import {
  Users,
  Shield,
  Check,
  X,
  Ban,
  UserCheck,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useAllProfiles,
  useApproveUser,
  useBlockUser,
  useUnblockUser,
  useRevokeApproval,
} from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const { data: profiles = [], isLoading, refetch } = useAllProfiles();
  const approveUser = useApproveUser();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const revokeApproval = useRevokeApproval();

  const [searchQuery, setSearchQuery] = useState('');
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');

  // Filter out current user - cannot manage own account
  const managedProfiles = profiles.filter(p => p.id !== currentUser?.id);

  const filteredProfiles = managedProfiles.filter(
    (profile) =>
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = managedProfiles.filter(p => !p.is_approved && !p.is_blocked).length;
  const approvedCount = managedProfiles.filter(p => p.is_approved && !p.is_blocked).length;
  const blockedCount = managedProfiles.filter(p => p.is_blocked).length;

  const handleBlock = (userId: string) => {
    setSelectedUser(userId);
    setBlockReason('');
    setBlockDialogOpen(true);
  };

  const confirmBlock = async () => {
    if (selectedUser) {
      await blockUser.mutateAsync({ userId: selectedUser, reason: blockReason });
      setBlockDialogOpen(false);
      setSelectedUser(null);
      setBlockReason('');
    }
  };

  const getStatusBadge = (profile: typeof profiles[0]) => {
    if (profile.is_blocked) {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    if (profile.is_approved) {
      return <Badge className="bg-success/20 text-success border-success/30">Aprovado</Badge>;
    }
    return <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">Pendente</Badge>;
  };

  if (isLoading) {
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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aprovados</p>
              <p className="text-2xl font-bold">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <Ban className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bloqueados</p>
              <p className="text-2xl font-bold">{blockedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-wine-light" />
            Gerenciar Usuários
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Users */}
          <div className="space-y-3">
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-wine/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-wine-light" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {profile.full_name || 'Sem nome'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{profile.phone || 'Sem telefone'}</span>
                        <span>•</span>
                        <span>
                          Criado em{' '}
                          {format(new Date(profile.created_at), "dd 'de' MMM", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      {profile.is_blocked && profile.blocked_reason && (
                        <p className="text-xs text-destructive mt-1">
                          Motivo: {profile.blocked_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(profile)}
                    
                    <div className="flex gap-1">
                      {!profile.is_approved && !profile.is_blocked && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-success hover:text-success hover:bg-success/10"
                            onClick={() => approveUser.mutate(profile.id)}
                            disabled={approveUser.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleBlock(profile.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Recusar
                          </Button>
                        </>
                      )}
                      
                      {profile.is_approved && !profile.is_blocked && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => revokeApproval.mutate(profile.id)}
                            disabled={revokeApproval.isPending}
                          >
                            Revogar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleBlock(profile.id)}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Bloquear
                          </Button>
                        </>
                      )}
                      
                      {profile.is_blocked && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-success hover:text-success hover:bg-success/10"
                          onClick={() => unblockUser.mutate(profile.id)}
                          disabled={unblockUser.isPending}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Desbloquear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Usuário</DialogTitle>
            <DialogDescription>
              O usuário não poderá acessar o sistema enquanto estiver bloqueado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Pagamento não efetuado"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBlock}
              disabled={blockUser.isPending}
            >
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
