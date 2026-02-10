import { useState } from "react";
import {
  Truck,
  MapPin,
  Clock,
  Package,
  CheckCircle,
  Phone,
  Navigation,
  RefreshCw,
  ChefHat,
  Route,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useActiveDeliveries,
  useCompletedDeliveries,
  useDeliveryStats,
  useUpdateDeliveryStatus,
} from "@/hooks/useDeliveries";
import type { Database } from "@/integrations/supabase/types";

type DeliveryStatus = Database['public']['Enums']['delivery_status'];

const statusConfig: Record<DeliveryStatus, { label: string; color: string; progress: number }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", progress: 0 },
  preparando: { label: "Preparando", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", progress: 33 },
  em_rota: { label: "Em Entrega", color: "bg-wine/20 text-wine-light border-wine/30", progress: 66 },
  entregue: { label: "Entregue", color: "bg-success/20 text-success border-success/30", progress: 100 },
  cancelado: { label: "Cancelado", color: "bg-destructive/20 text-destructive border-destructive/30", progress: 0 },
};

const nextStatus: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  pendente: 'preparando',
  preparando: 'em_rota',
  em_rota: 'entregue',
};

export default function Delivery() {
  const { data: activeDeliveries = [], isLoading: loadingActive } = useActiveDeliveries();
  const { data: completedDeliveries = [], isLoading: loadingCompleted } = useCompletedDeliveries();
  const { data: stats } = useDeliveryStats();
  const updateStatus = useUpdateDeliveryStatus();

  const handleAdvanceStatus = (id: string, currentStatus: DeliveryStatus) => {
    const next = nextStatus[currentStatus];
    if (next) {
      updateStatus.mutate({ id, status: next });
    }
  };

  const getNextActionLabel = (status: DeliveryStatus) => {
    switch (status) {
      case 'pendente': return 'Iniciar Preparo';
      case 'preparando': return 'Enviar Entrega';
      case 'em_rota': return 'Marcar Entregue';
      default: return null;
    }
  };

  const getNextActionIcon = (status: DeliveryStatus) => {
    switch (status) {
      case 'pendente': return <ChefHat className="h-4 w-4" />;
      case 'preparando': return <Route className="h-4 w-4" />;
      case 'em_rota': return <CheckCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loadingActive) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Delivery</h1>
          <p className="text-muted-foreground">
            Gerencie pedidos e entregas em tempo real
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-wine/20 flex items-center justify-center">
                <Truck className="h-6 w-6 text-wine-light" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entregas Hoje</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">
                  {stats?.avgTimeMinutes ? `${stats.avgTimeMinutes} min` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{stats?.delivered || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">
                  {(stats?.pending || 0) + (stats?.preparing || 0) + (stats?.inRoute || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Deliveries */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-wine-light" />
              Entregas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeDeliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Truck className="h-12 w-12 mb-2 opacity-50" />
                <p>Nenhuma entrega ativa no momento</p>
                <p className="text-sm">As entregas aparecerão aqui quando criadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeDeliveries.map((delivery) => {
                  const config = statusConfig[delivery.status];
                  const customerName = delivery.sales?.customers?.name || 'Cliente não identificado';
                  const customerPhone = delivery.sales?.customers?.phone;
                  const totalItems = delivery.sales?.sale_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  const total = (delivery.sales?.total || 0) + delivery.delivery_fee;

                  return (
                    <div
                      key={delivery.id}
                      className="p-4 rounded-xl bg-secondary/50 border border-border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-wine/20 flex items-center justify-center">
                            <Package className="h-5 w-5 text-wine-light" />
                          </div>
                          <div>
                            <p className="font-medium">{customerName}</p>
                            <p className="text-sm font-mono text-muted-foreground">
                              #{delivery.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {delivery.address}
                          {delivery.neighborhood && `, ${delivery.neighborhood}`}
                          {delivery.city && ` - ${delivery.city}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span>{totalItems} itens</span>
                          <span className="font-semibold text-gold">
                            R$ {total.toFixed(2)}
                          </span>
                          {delivery.delivery_fee > 0 && (
                            <span className="text-muted-foreground text-xs">
                              (taxa: R$ {delivery.delivery_fee.toFixed(2)})
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {customerPhone && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`tel:${customerPhone}`, '_self')}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(delivery.address)}`, '_blank')}
                          >
                            <Navigation className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <Progress value={config.progress} className="h-1.5" />
                      </div>

                      {/* Action button */}
                      {getNextActionLabel(delivery.status) && (
                        <Button
                          variant="wine"
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => handleAdvanceStatus(delivery.id, delivery.status)}
                          disabled={updateStatus.isPending}
                        >
                          {getNextActionIcon(delivery.status)}
                          {getNextActionLabel(delivery.status)}
                        </Button>
                      )}

                      {delivery.notes && (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          Obs: {delivery.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Deliveries */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Concluídas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCompleted ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-wine"></div>
              </div>
            ) : completedDeliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma entrega concluída hoje</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedDeliveries.map((delivery) => {
                  const customerName = delivery.sales?.customers?.name || 'Cliente';
                  const total = (delivery.sales?.total || 0) + delivery.delivery_fee;
                  
                  // Calculate delivery time
                  let deliveryTime = '--';
                  if (delivery.delivered_at) {
                    const created = new Date(delivery.created_at).getTime();
                    const delivered = new Date(delivery.delivered_at).getTime();
                    const minutes = Math.round((delivered - created) / (1000 * 60));
                    deliveryTime = `${minutes} min`;
                  }

                  return (
                    <div
                      key={delivery.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{customerName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>#{delivery.id.slice(0, 8)}</span>
                          <span>•</span>
                          <span>{deliveryTime}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-gold">
                          R$ {total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
