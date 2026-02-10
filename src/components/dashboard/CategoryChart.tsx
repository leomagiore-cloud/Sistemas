// src/components/dashboard/CategoryChart.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useCategorySales } from "@/hooks/useSales";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart as PieChartIcon } from "lucide-react";

// Cores para as categorias
const CATEGORY_COLORS: Record<string, string> = {
  'vinho_tinto': 'hsl(355, 56%, 32%)',       // Vinho Tinto
  'vinho_branco': 'hsl(42, 50%, 58%)',       // Vinho Branco (dourado)
  'vinho_rose': 'hsl(340, 60%, 55%)',        // Vinho Rosé
  'espumante': 'hsl(280, 50%, 55%)',         // Espumante (roxo)
  'cerveja': 'hsl(30, 70%, 55%)',            // Cerveja (laranja)
  'whisky': 'hsl(20, 60%, 45%)',             // Whisky (âmbar)
  'vodka': 'hsl(200, 50%, 60%)',             // Vodka (azul claro)
  'gin': 'hsl(160, 50%, 50%)',               // Gin (verde menta)
  'refrigerante': 'hsl(190, 60%, 60%)',      // Refrigerante (azul)
  'agua': 'hsl(210, 60%, 70%)',              // Água (azul claro)
  'energetico': 'hsl(350, 70%, 55%)',        // Energético (vermelho)
  'outros': 'hsl(240, 6%, 40%)',             // Outros (cinza)
};

// Tradução das categorias
const CATEGORY_LABELS: Record<string, string> = {
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
  'outros': 'Outros',
};

// Formatar valor para o tooltip
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function CategoryChart() {
  const { data: categoryData = [], isLoading, error } = useCategorySales();

  if (error) {
    console.error("Erro ao carregar dados por categoria:", error);
  }

  // Transformar dados para o gráfico
  const chartData = categoryData.map(item => {
    const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
    const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.outros;
    
    return {
      name: categoryLabel,
      value: item.total_revenue,
      rawValue: item.total_revenue,
      quantity: item.total_quantity,
      color,
      category: item.category
    };
  });

  // Calcular total para porcentagens
  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);

  // Adicionar porcentagem
  const chartDataWithPercentage = chartData.map(item => ({
    ...item,
    percentage: totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0
  }));

  // Ordenar do maior para o menor
  const sortedChartData = [...chartDataWithPercentage].sort((a, b) => b.value - a.value);

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Vendas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Skeleton loader
          <div className="h-[250px] flex items-center justify-center">
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-center">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          </div>
        ) : sortedChartData.length === 0 ? (
          // Estado vazio
          <div className="h-[250px] flex flex-col items-center justify-center">
            <PieChartIcon className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-center mb-2">
              Nenhuma venda por categoria
            </p>
            <p className="text-sm text-muted-foreground text-center">
              As vendas aparecerão distribuídas por categoria
            </p>
          </div>
        ) : (
          // Gráfico com dados reais
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sortedChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  labelLine={false}
                  label={(entry) => `${entry.percentage.toFixed(1)}%`}
                >
                  {sortedChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="hsl(240, 8%, 10%)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(240, 8%, 10%)",
                    border: "1px solid hsl(240, 6%, 18%)",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "hsl(40, 20%, 95%)",
                  }}
                  labelStyle={{ 
                    color: "hsl(40, 20%, 95%)",
                    fontWeight: "bold",
                    marginBottom: "8px"
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    const data = props.payload;
                    return [
                      <>
                        <div className="font-medium">{formatCurrency(value)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {data.quantity} vendas • {data.percentage.toFixed(1)}%
                        </div>
                      </>,
                      name
                    ];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry) => {
                    const data = entry.payload;
                    return (
                      <span className="text-xs text-foreground">
                        {value}
                        <span className="text-muted-foreground ml-1">
                          ({data?.percentage?.toFixed(1) || '0'}%)
                        </span>
                      </span>
                    );
                  }}
                  wrapperStyle={{
                    paddingTop: "16px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}