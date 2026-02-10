// ProtectedRoute.tsx - CORRIGIDO
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, ShieldX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-wine" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se perfil não existe, redireciona para login
  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  // User blocked
  if (profile.is_blocked || profile.status_text === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card variant="elevated" className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Acesso Bloqueado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sua conta foi bloqueada pelo administrador.
            </p>
            {profile.blocked_reason && (
              <p className="text-sm text-muted-foreground">
                Motivo: {profile.blocked_reason}
              </p>
            )}
            <Button variant="outline" onClick={() => signOut()} className="w-full">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not approved - verifica AMBOS os campos
  const isPending = 
    !profile.is_approved && 
    profile.status_text !== 'active' &&
    profile.role !== 'admin'; // Admins não precisam de aprovação

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card variant="elevated" className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-warning animate-spin" />
            </div>
            <CardTitle>Aguardando Aprovação</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sua conta foi criada com sucesso e está aguardando aprovação do administrador.
            </p>
            <Button variant="outline" onClick={() => signOut()} className="w-full">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ EVERYTHING OK → allow access
  return <>{children}</>;
}