// src/pages/StoreSettings.tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, Unlock, Save, X } from 'lucide-react';
import { useStoreAuth } from '@/hooks/useStoreAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function StoreSettings() {
  const { storeId } = useParams();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const { 
    activeStore, 
    setStorePassword, 
    removeStorePassword 
  } = useStoreAuth();
  const navigate = useNavigate();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (newPassword.length < 4) {
      toast.error('A senha deve ter pelo menos 4 caracteres');
      return;
    }

    setLoading(true);
    try {
      const success = await setStorePassword(newPassword);
      if (success) {
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!window.confirm('Tem certeza que deseja remover a senha desta adega?')) {
      return;
    }

    setLoading(true);
    try {
      const success = await removeStorePassword();
      if (success) {
        toast.success('Senha removida com sucesso');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStore = activeStore?.id === storeId ? activeStore : null;

  if (!currentStore) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Adega não encontrada ou não selecionada</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/select-store')}
              >
                Selecionar Adega
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configurações da Adega</h1>
        <p className="text-muted-foreground mt-2">
          {currentStore.name} • Configurações de segurança e acesso
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Segurança da Adega
            </CardTitle>
            <CardDescription>
              Controle o acesso a esta adega específica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Senha de Acesso</h3>
                  <p className="text-sm text-muted-foreground">
                    Defina uma senha para controlar quem acessa esta adega
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full ${showPasswordForm ? 'bg-blue-100 text-blue-800' : 'bg-muted text-muted-foreground'}`}>
                    <span className="text-xs font-medium">
                      {showPasswordForm ? 'Configurando...' : 'Configurar'}
                    </span>
                  </div>
                </div>
              </div>

              {showPasswordForm ? (
                <form onSubmit={handleSetPassword} className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                      minLength={4}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 4 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite novamente a senha"
                      minLength={4}
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={loading || !newPassword.trim() || newPassword !== confirmPassword}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Salvar Senha'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <Lock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">Senha da Adega</p>
                        <p className="text-sm text-muted-foreground">
                          Funcionários precisarão digitar a senha para acessar
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPasswordForm(true)}
                      >
                        Definir Senha
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePassword}
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    <strong>Importante:</strong> A senha é específica para esta adega. 
                    Funcionários que acessarem de outros dispositivos precisarão digitar a senha.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Informações de Acesso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-1">Sessão Ativa Desde</p>
                  <p className="text-muted-foreground">
                    {new Date(currentStore.sessionStart).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-1">Status</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800">
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                    <span className="text-xs font-medium">Ativa</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Voltar para Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}