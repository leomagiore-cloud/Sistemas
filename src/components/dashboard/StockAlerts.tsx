import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, ArrowRight } from "lucide-react";
import { useLowStockProducts } from "@/hooks/useProducts";

export function StockAlerts() {
  const { data: lowStockProducts = [], isLoading } = useLowStockProducts();

  const alerts = lowStockProducts.slice(0, 5).map((product) => ({
    id: product.id,
    type: "stock" as const,
    title: "Estoque Baixo",
    product: product.name,
    detail: `Apenas ${product.stock_quantity} unidades (mín: ${product.min_stock})`,
    severity: product.stock_quantity <= product.min_stock / 2 ? "high" : "medium",
  }));

  return (
    <Card variant="elevated">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alertas
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-wine-light" asChild>
          <Link to="/estoque">
            Ver todos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-wine"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum alerta de estoque</p>
            <p className="text-xs">Todos os produtos estão OK</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    alert.severity === "high"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-warning/20 text-warning"
                  }`}
                >
                  <Package className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{alert.title}</span>
                    <Badge
                      variant={alert.severity === "high" ? "destructive" : "outline"}
                      className="text-xs"
                    >
                      {alert.severity === "high" ? "Urgente" : "Atenção"}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{alert.product}</p>
                  <p className="text-xs text-muted-foreground">{alert.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
