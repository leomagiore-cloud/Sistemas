import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wine, Beer, GlassWater, Package, DollarSign } from "lucide-react";
import { useTopProducts } from "@/hooks/useTopProducts";
import { Skeleton } from "@/components/ui/skeleton";

// Mapeamento de ícones por categoria
const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
    'vinho_tinto': Wine,
    'vinho_branco': Wine,
    'vinho_rose': Wine,
    'espumante': Wine,
    'cerveja': Beer,
    'whisky': GlassWater,
    'vodka': GlassWater,
    'gin': GlassWater,
    'refrigerante': GlassWater,
    'agua': GlassWater,
    'energetico': GlassWater,
  };
  return icons[category] || Package;
};

// Traduzir categoria
const translateCategory = (category: string) => {
  const categories: Record<string, string> = {
    'vinho_tinto': 'Vinho Tinto',
    'vinho_branco': 'Vinho Branco',
    'vinho_rose': 'Vinho Rosé',
    'espumante': 'Espumante',
    'cerveja': 'Cerveja',
    'whisky': 'Whisky',
    'vodka': 'Vodka',
    'gin': 'Gin',
    'refrigerante': 'Refrigerante',
    'agua': 'Água',
    'energetico': 'Energético',
  };
  return categories[category] || category;
};

export function TopProducts() {
  const { data: topProducts = [], isLoading, error } = useTopProducts(5);

  if (error) {
    console.error("Erro ao carregar top produtos:", error);
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-wine-light" />
          Top Produtos
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
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          // Estado vazio
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhuma venda registrada ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Os produtos mais vendidos aparecerão aqui
            </p>
          </div>
        ) : (
          // Lista de produtos
          <div className="space-y-4">
            {topProducts.map((product, index) => {
              const IconComponent = getCategoryIcon(product.category);
              const categoryLabel = translateCategory(product.category);
              
              return (
                <div
                  key={product.product_id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-wine/20 text-wine-light font-display font-bold">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.product_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <IconComponent className="h-3 w-3" />
                        {categoryLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {product.unit_price?.toFixed(2) || "0.00"} un
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground mb-1">
                        {product.total_quantity} un
                      </span>
                      <p className="font-semibold text-gold">
                        R$ {product.total_revenue?.toLocaleString("pt-BR", { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        }) || "0.00"}
                      </p>
                    </div>
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