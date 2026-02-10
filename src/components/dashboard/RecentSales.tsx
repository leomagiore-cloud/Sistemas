// src/components/dashboard/RecentSales.tsx - Versão mais limpa
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, CreditCard, Banknote, Smartphone, Wallet, User, Package } from "lucide-react";
import { useRecentSales } from "@/hooks/useSales";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mapeamento de ícones de pagamento
const paymentIcons = {
  dinheiro: Banknote,
  pix: Smartphone,
  credito: CreditCard,
  debito: CreditCard,
  vale: Wallet,
};

// Tradução dos métodos de pagamento
const paymentLabels = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  credito: "Crédito",
  debito: "Débito",
  vale: "Vale",
};

// Formatar hora
const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: ptBR });
  } catch {
    return "--:--";
  }
};

// Formatar nome do cliente (abreviar se for muito longo)
const formatCustomerName = (name: string | null) => {
  if (!name) return "Consumidor Final";
  
  // Se o nome for muito longo, abrevia
  if (name.length > 15) {
    return name.substring(0, 15) + "...";
  }
  
  return name;
};

export function RecentSales() {
  const { data: sales = [], isLoading, error } = useRecentSales(5);

  if (error) {
    console.error("Erro ao carregar vendas recentes:", error);
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-wine-light" />
          Vendas Recentes
          {isLoading && (
            <span className="text-xs text-muted-foreground font-normal ml-2">
              Carregando...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Skeleton loader
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : sales.length === 0 ? (
          // Estado vazio
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhuma venda recente</p>
            <p className="text-sm text-muted-foreground mt-1">
              As vendas aparecerão aqui
            </p>
          </div>
        ) : (
          // Lista de vendas - Layout limpo
          <div className="space-y-3">
            {sales.map((sale) => {
              const PaymentIcon = paymentIcons[sale.payment_method as keyof typeof paymentIcons] || CreditCard;
              const paymentLabel = paymentLabels[sale.payment_method as keyof typeof paymentLabels] || sale.payment_method;
              
              // Contar itens
              const itemCount = sale.sale_items?.length || 0;
              const customerName = formatCustomerName(sale.customers?.name || null);
              
              return (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  {/* Lado esquerdo: Cliente e informações */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-wine/20 flex-shrink-0">
                      <ShoppingCart className="h-5 w-5 text-wine-light" />
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate" title={sale.customers?.name || "Consumidor Final"}>
                          {customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Package className="h-3 w-3 flex-shrink-0" />
                        <span>{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{formatTime(sale.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lado direito: Pagamento e valor */}
                  <div className="flex flex-col items-end gap-1 pl-2">
                    <div className="flex items-center gap-1">
                      <PaymentIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">{paymentLabel}</span>
                    </div>
                    <span className="font-semibold text-gold whitespace-nowrap text-sm">
                      R$ {sale.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}