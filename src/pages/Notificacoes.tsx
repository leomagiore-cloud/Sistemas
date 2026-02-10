import { useState } from "react";
import {
  Bell,
  Settings,
  MessageSquare,
  Package,
  Clock,
  DollarSign,
  ShoppingCart,
  Smartphone,
  Check,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotifications } from "@/hooks/useNotifications";

const alertSettings = [
  { id: "stock_low", label: "Estoque abaixo do mínimo", enabled: true },
  { id: "expiry_near", label: "Produtos próximos da validade", enabled: true },
  { id: "daily_report", label: "Relatório diário de vendas (22h)", enabled: true },
  { id: "new_orders", label: "Novos pedidos recebidos", enabled: true },
  { id: "large_transactions", label: "Movimentações acima de R$ 5.000", enabled: false },
  { id: "delivery_status", label: "Status de entregas", enabled: true },
];

const typeIcons = {
  stock: Package,
  expiry: Clock,
  sale: ShoppingCart,
  financial: DollarSign,
  delivery: Smartphone,
};

const typeColors = {
  stock: "bg-destructive/20 text-destructive",
  expiry: "bg-warning/20 text-warning",
  sale: "bg-success/20 text-success",
  financial: "bg-gold/20 text-gold",
  delivery: "bg-wine/20 text-wine-light",
};

export default function Notificacoes() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [settings, setSettings] = useState(alertSettings);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie alertas e notificações via WhatsApp
          </p>
        </div>
        <Button variant="wine" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Configurar WhatsApp
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notifications List */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-wine-light" />
              Notificações Recentes
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} novas
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação no momento</p>
                <p className="text-sm">Você será notificado sobre estoque baixo e outras atividades</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const Icon = typeIcons[notification.type as keyof typeof typeIcons];
                  const colorClass = typeColors[notification.type as keyof typeof typeColors];

                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                        notification.read
                          ? "bg-secondary/30"
                          : "bg-secondary/70 border border-wine/20"
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{notification.title}</p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-wine" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Panel */}
        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-wine-light" />
                Configurações de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between"
                  >
                    <Label
                      htmlFor={setting.id}
                      className="text-sm cursor-pointer"
                    >
                      {setting.label}
                    </Label>
                    <Switch
                      id={setting.id}
                      checked={setting.enabled}
                      onCheckedChange={() => toggleSetting(setting.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant="wine">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                WhatsApp Business
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm opacity-80">
                Receba alertas automaticamente no seu WhatsApp
              </p>
              <div className="space-y-2">
                <Label htmlFor="phone">Número do WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="+55 (11) 99999-9999"
                  className="bg-background/50"
                />
              </div>
              <Button variant="gold" className="w-full">
                Conectar WhatsApp
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
