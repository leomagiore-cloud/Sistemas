import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Store,
  Bell,
  Shield,
  Palette,
  Database,
  CreditCard,
  HelpCircle,
  ChevronRight,
  Users,
  RefreshCw,
  Plus,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SimpleUserManager } from "@/components/admin/SimpleUserManager";
import { useStores } from "@/hooks/useStores";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProfile } from "@/hooks/useProfile";

const settingsSections = [
  { id: "store", label: "Adega", icon: Store, description: "Configurações da adega atual", role: "user" },
  { id: "users", label: "Usuários", icon: Users, description: "Aprovar e gerenciar usuários", role: "admin" },
  { id: "profile", label: "Perfil", icon: User, description: "Suas informações pessoais", role: "user" },
  { id: "notifications", label: "Notificações", icon: Bell, description: "Preferências de alertas", role: "user" },
  { id: "security", label: "Segurança", icon: Shield, description: "Senha e autenticação", role: "user" },
  { id: "appearance", label: "Aparência", icon: Palette, description: "Tema e personalização", role: "user" },
  { id: "integrations", label: "Integrações", icon: Database, description: "APIs e conexões externas", role: "admin" },
  { id: "billing", label: "Faturamento", icon: CreditCard, description: "Plano e pagamentos", role: "admin" },
  { id: "help", label: "Ajuda", icon: HelpCircle, description: "Suporte e documentação", role: "user" },
];

function CreateStoreDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { createStore } = useStores();
  const [newStoreName, setNewStoreName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newStoreName.trim()) {
      toast.error('Digite um nome para a adega');
      return;
    }
    
    setIsCreating(true);
    try {
      await createStore(newStoreName.trim());
      setNewStoreName('');
      onOpenChange(false);
      toast.success('Adega criada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao criar adega: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Adega</DialogTitle>
          <DialogDescription>
            Dê um nome para sua adega. Você poderá configurar os detalhes depois.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newStoreName">Nome da Adega</Label>
            <Input
              id="newStoreName"
              placeholder="Ex: Adega Central"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="wine" onClick={handleCreate} disabled={isCreating || !newStoreName.trim()}>
            {isCreating ? 'Criando...' : 'Criar Adega'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StoreSettingsForm() {
  const { currentStore, currentStoreRole, updateStore, isLoading, stores } = useStores();
  const { isAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
    open_time: "09:00",
    close_time: "22:00",
    dark_mode: true,
    sound_notifications: true,
    auto_backup: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentStore) {
      // ✅ CORREÇÃO: Garanta que campos booleanos sejam booleanos
      setFormData({
        name: currentStore.name || "",
        cnpj: currentStore.cnpj || "",
        phone: currentStore.phone || "",
        email: currentStore.email || "",
        address: currentStore.address || "",
        open_time: currentStore.open_time || "09:00",
        close_time: currentStore.close_time || "22:00",
        // ✅ CONVERTE para booleano se necessário
        dark_mode: Boolean(currentStore.dark_mode ?? true),
        sound_notifications: Boolean(currentStore.sound_notifications ?? true),
        auto_backup: Boolean(currentStore.auto_backup ?? true),
      });
    }
  }, [currentStore]);

  const handleSave = async () => {
    if (!currentStore) return;
    
    setSaving(true);
    try {
      // ✅ CORREÇÃO: Garanta que todos os campos booleanos sejam booleanos
      const dataToSave = {
        id: currentStore.id,
        name: formData.name,
        cnpj: formData.cnpj,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        open_time: formData.open_time,
        close_time: formData.close_time,
        dark_mode: Boolean(formData.dark_mode),
        sound_notifications: Boolean(formData.sound_notifications),
        auto_backup: Boolean(formData.auto_backup),
      };
      
      console.log('📤 Salvando dados:', dataToSave);
      await updateStore(dataToSave);
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const canEdit = isAdmin || currentStoreRole === 'proprietario' || currentStoreRole === 'gerente' || currentStoreRole === 'seller';

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  // Show create store option if no stores exist
  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="font-medium mb-2">Nenhuma adega encontrada</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Crie sua primeira adega para começar
        </p>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <Card variant="elevated">
        <CardContent className="p-8 text-center">
          <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-medium mb-2">Nenhuma adega selecionada</h3>
          <p className="text-sm text-muted-foreground">
            Selecione uma adega no menu superior.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-wine-light" />
          Configurações da Adega: {currentStore.name}
          {!canEdit && (
            <Badge variant="outline" className="ml-2">
              Somente leitura
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Gerencie as informações e preferências desta adega
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canEdit && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Você tem permissão apenas para visualizar estas configurações.
              </p>
            </div>
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="storeName">Nome da Adega</Label>
            <Input 
              id="storeName" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome da sua adega"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input 
              id="cnpj" 
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input 
              id="phone" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 0000-0000"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contato@suaadega.com"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, número - Bairro - Cidade/UF"
              disabled={!canEdit}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-4">Horário de Funcionamento</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="openTime">Abertura</Label>
              <Input 
                id="openTime" 
                type="time" 
                value={formData.open_time}
                onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closeTime">Fechamento</Label>
              <Input 
                id="closeTime" 
                type="time" 
                value={formData.close_time}
                onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-4">Preferências</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Modo escuro</p>
                <p className="text-sm text-muted-foreground">
                  Usar tema escuro na interface
                </p>
              </div>
              <Switch 
                checked={formData.dark_mode}
                onCheckedChange={(checked) => setFormData({ ...formData, dark_mode: checked })}
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificações sonoras</p>
                <p className="text-sm text-muted-foreground">
                  Tocar som ao receber novas vendas
                </p>
              </div>
              <Switch 
                checked={formData.sound_notifications}
                onCheckedChange={(checked) => setFormData({ ...formData, sound_notifications: checked })}
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Backup automático</p>
                <p className="text-sm text-muted-foreground">
                  Fazer backup diário dos dados
                </p>
              </div>
              <Switch 
                checked={formData.auto_backup}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_backup: checked })}
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end gap-3">
            <Button 
              variant="wine" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileSettingsForm() {
  const { data: profile, isLoading } = useProfile();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['profile', profile.id] });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Carregando perfil...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-wine-light" />
          Informações Pessoais
          <Badge variant="outline" className="ml-2">
            {isAdmin ? "Administrador" : "Usuário"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input 
              id="fullName" 
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userPhone">Telefone</Label>
            <Input 
              id="userPhone" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userEmail">E-mail</Label>
            <Input 
              id="userEmail" 
              value={profile?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userRole">Função</Label>
            <Input 
              id="userRole" 
              value={isAdmin ? "Administrador" : "Usuário"}
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        {!isAdmin && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Para alterar sua função ou acessar configurações administrativas,
                entre em contato com um administrador do sistema.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button 
            variant="wine" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RestrictedAccessCard({ requiredRole }: { requiredRole: string }) {
  return (
    <Card variant="elevated" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      <CardContent className="p-8 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-amber-600 dark:text-amber-400" />
        <h3 className="font-medium mb-2 text-amber-800 dark:text-amber-300">
          Acesso Restrito
        </h3>
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
          Esta seção requer permissões de {requiredRole === 'admin' ? 'administrador' : requiredRole}.
        </p>
        <p className="text-xs text-amber-500 dark:text-amber-500">
          Entre em contato com o administrador do sistema para obter acesso.
        </p>
      </CardContent>
    </Card>
  );
}

export default function Configuracoes() {
  const { stores } = useStores();
  const { isAdmin, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState("store");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredSections = settingsSections.filter(section => {
    if (section.role === 'admin' && !isAdmin) {
      return false;
    }
    return true;
  });

  const renderContent = () => {
    const section = settingsSections.find(s => s.id === activeSection);
    
    if (section?.role === 'admin' && !isAdmin) {
      return <RestrictedAccessCard requiredRole={section.role} />;
    }

    switch (activeSection) {
      case "users":
        return isAdmin ? <SimpleUserManager /> : <RestrictedAccessCard requiredRole="admin" />;
      case "store":
        return (
          <div className="space-y-6">
            <StoreSettingsForm />
            {/* Botão de criar adega */}
            <Card variant="elevated" className="border-dashed">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-wine/20 flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-6 w-6 text-wine-light" />
                </div>
                <h3 className="font-medium mb-2">Criar Nova Adega</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione uma nova adega para gerenciar
                </p>
                <Button 
                  variant="wine" 
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Adega
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case "profile":
        return <ProfileSettingsForm />;
      default:
        return (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-2">Em desenvolvimento</h3>
              <p className="text-sm text-muted-foreground">
                Esta seção será implementada em breve.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-wine" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
          {!isAdmin && (
            <span className="ml-2 text-sm text-amber-600 dark:text-amber-400">
              (Acesso limitado)
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Settings Menu */}
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="space-y-1">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    activeSection === section.id
                      ? "bg-wine/20 text-wine-light"
                      : "hover:bg-secondary"
                  } ${section.role === 'admin' ? 'relative' : ''}`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    activeSection === section.id
                      ? "bg-wine/30"
                      : "bg-wine/20"
                  }`}>
                    <section.icon className="h-5 w-5 text-wine-light" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{section.label}</p>
                      {section.role === 'admin' && (
                        <Badge variant="outline" className="h-4 px-1 text-[10px]">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${
                    activeSection === section.id ? "text-wine-light" : "text-muted-foreground"
                  }`} />
                </button>
              ))}
            </div>

            {!isAdmin && filteredSections.length < settingsSections.length && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Algumas seções exigem permissões de administrador</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>

      {/* Diálogo de criação de adega */}
      <CreateStoreDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}