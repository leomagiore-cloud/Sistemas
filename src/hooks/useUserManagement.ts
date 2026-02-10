// src/components/settings/UserManagement.tsx - VERSÃO SIMPLIFICADA PARA TESTE
import { useState } from "react";
import { Users, Check, X, Shield, ShieldOff, Search, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  useAllProfiles, 
  useApproveUser, 
  useBlockUser, 
  useUnblockUser 
} from "@/hooks/useProfile";

export function UserManagement() {
  const { data: profiles = [], isLoading, error } = useAllProfiles();
  const approveUser = useApproveUser();
  const blockUser = useBlockUser();
  const unblockUser = useBlockUser(); // Nota: usando blockUser para simplificar
  
  const [searchTerm, setSearchTerm] = useState("");

  // DEBUG
  console.log('👑 [UserManagement] Debug:', {
    profilesCount: profiles.length,
    isLoading,
    error: error?.message,
    profiles: profiles.map(p => ({
      id: p.id.substring(0, 8) + '...',
      email: p.email,
      is_approved: p.is_approved,
      role: p.role
    }))
  });

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="elevated" className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <h3 className="font-medium mb-2 text-red-800">Erro ao carregar usuários</h3>
          <p className="text-sm text-red-600 mb-4">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  // Filtrar por busca
  const filteredProfiles = profiles.filter(profile => 
    !searchTerm ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-wine-light" />
          Gerenciamento de Usuários
        </CardTitle>
        <CardDescription>
          Total de usuários: {profiles.length} • Pendentes: {profiles.filter(p => !p.is_approved && !p.is_blocked).length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{profile.full_name || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {profile.is_blocked ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldOff className="h-3 w-3" />
                          Bloqueado
                        </Badge>
                      ) : profile.is_approved ? (
                        <Badge variant="success" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Aprovado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={profile.role === 'admin' ? "default" : "secondary"}>
                        {profile.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!profile.is_approved && !profile.is_blocked && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => approveUser.mutate(profile.id)}
                            disabled={approveUser.isPending}
                          >
                            <Check className="h-4 w-4 mr-1 text-green-600" />
                            Aprovar
                          </Button>
                        )}
                        
                        {!profile.is_blocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => blockUser.mutate({ 
                              userId: profile.id, 
                              reason: 'Bloqueado por admin' 
                            })}
                            disabled={blockUser.isPending}
                          >
                            <ShieldOff className="h-4 w-4 mr-1 text-red-600" />
                            Bloquear
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => unblockUser.mutate(profile.id)}
                            disabled={unblockUser.isPending}
                          >
                            <Shield className="h-4 w-4 mr-1 text-blue-600" />
                            Desbloquear
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Estatísticas */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{profiles.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-amber-600">
                {profiles.filter(p => !p.is_approved && !p.is_blocked).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Aprovados</p>
              <p className="text-2xl font-bold text-green-600">
                {profiles.filter(p => p.is_approved && !p.is_blocked).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Bloqueados</p>
              <p className="text-2xl font-bold text-red-600">
                {profiles.filter(p => p.is_blocked).length}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}