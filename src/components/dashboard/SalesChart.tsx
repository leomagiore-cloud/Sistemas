// src/components/dashboard/SalesChart.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { useSalesChartData } from "@/hooks/useSales";
import { Skeleton } from "@/components/ui/skeleton";

type Period = "daily" | "weekly" | "monthly";

// Formatar valor para o tooltip
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function SalesChart() {
  const [period, setPeriod] = useState<Period>("daily");
  const { data: chartData = [], isLoading, error } = useSalesChartData(period);

  if (error) {
    console.error("Erro ao carregar gráfico de vendas:", error);
  }

  // Se não houver dados, mostra uma mensagem
  const noData = !isLoading && chartData.length === 0;

  return (
    <Card variant="elevated" className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Evolução de Vendas</CardTitle>
        <div className="flex gap-1">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "wine" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === "daily" ? "Diário" : p === "weekly" ? "Semanal" : "Mensal"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Skeleton loader
          <div className="h-[300px] flex items-center justify-center">
            <div className="space-y-4 w-full">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ) : noData ? (
          // Estado vazio
          <div className="h-[300px] flex flex-col items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Nenhum dado de vendas disponível</p>
              <p className="text-sm text-muted-foreground">
                Faça vendas para ver a evolução aqui
              </p>
            </div>
          </div>
        ) : (
          // Gráfico com dados reais
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(355, 56%, 32%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(355, 56%, 32%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 18%)" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(40, 10%, 60%)"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(40, 10%, 60%)"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => {
                    if (value >= 1000) {
                      return `R$ ${(value / 1000).toFixed(0)}k`;
                    }
                    return `R$ ${value}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(240, 8%, 10%)",
                    border: "1px solid hsl(240, 6%, 18%)",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                  labelStyle={{ 
                    color: "hsl(40, 20%, 95%)",
                    fontWeight: "bold",
                    marginBottom: "8px"
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Vendas"]}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="vendas"
                  stroke="hsl(355, 56%, 45%)"
                  strokeWidth={2}
                  fill="url(#colorVendas)"
                  name="Vendas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}