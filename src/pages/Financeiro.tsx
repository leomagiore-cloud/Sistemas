import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  PieChart,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFinancialTransactions, useFinancialStats } from "@/hooks/useFinancial";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoryLabels: Record<string, string> = {
  venda: "Vendas",
  compra: "Compras",
  despesa: "Despesas",
  outros: "Outros",
};

const paymentLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  credito: "Cartão Crédito",
  debito: "Cartão Débito",
  vale: "Vale",
};

export default function Financeiro() {
  const [period, setPeriod] = useState("month");
  const { data: transactions = [], isLoading } = useFinancialTransactions();
  const { data: stats } = useFinancialStats();

  // Filter transactions by period
  const filteredTransactions = transactions.filter((t) => {
    const date = new Date(t.created_at);
    const now = new Date();
    
    switch (period) {
      case "week":
        return date >= subDays(now, 7);
      case "month":
        return isWithinInterval(date, { 
          start: startOfMonth(now), 
          end: endOfMonth(now) 
        });
      case "quarter":
        return date >= subDays(now, 90);
      case "year":
        return date >= subDays(now, 365);
      default:
        return true;
    }
  });

  // Calculate totals from filtered transactions
  const totalEntradas = filteredTransactions
    .filter((t) => t.type === "entrada")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalSaidas = filteredTransactions
    .filter((t) => t.type === "saida")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const saldo = totalEntradas - totalSaidas;
  const margem = totalEntradas > 0 ? ((saldo / totalEntradas) * 100).toFixed(1) : "0";

  // Generate chart data from real transactions
  const generateChartData = () => {
    const now = new Date();
    const months: { name: string; entradas: number; saidas: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.created_at);
        return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
      });
      
      months.push({
        name: format(date, "MMM", { locale: ptBR }),
        entradas: monthTransactions
          .filter((t) => t.type === "entrada")
          .reduce((sum, t) => sum + Number(t.amount), 0),
        saidas: monthTransactions
          .filter((t) => t.type === "saida")
          .reduce((sum, t) => sum + Number(t.amount), 0),
      });
    }
    
    return months;
  };

  const cashFlowData = generateChartData();

  if (isLoading) {
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
          <h1 className="text-3xl font-display font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Controle de fluxo de caixa e movimentações
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-2xl font-bold text-success">
                  R$ {totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-2xl font-bold text-destructive">
                  R$ {totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="wine">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Saldo</p>
                <p className="text-2xl font-bold">
                  R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-wine-light/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-wine-light" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem</p>
                <p className="text-2xl font-bold text-gold">{margem}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <PieChart className="h-6 w-6 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {cashFlowData.every(d => d.entradas === 0 && d.saidas === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <PieChart className="h-12 w-12 mb-2 opacity-50" />
                  <p>Sem dados para exibir</p>
                  <p className="text-sm">As transações aparecerão aqui</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 18%)" />
                    <XAxis dataKey="name" stroke="hsl(40, 10%, 60%)" fontSize={12} />
                    <YAxis
                      stroke="hsl(40, 10%, 60%)"
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(240, 8%, 10%)",
                        border: "1px solid hsl(240, 6%, 18%)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]}
                    />
                    <Area
                      type="monotone"
                      dataKey="entradas"
                      stroke="hsl(142, 71%, 45%)"
                      strokeWidth={2}
                      fill="url(#colorEntradas)"
                    />
                    <Area
                      type="monotone"
                      dataKey="saidas"
                      stroke="hsl(0, 72%, 51%)"
                      strokeWidth={2}
                      fill="url(#colorSaidas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-wine-light" />
              Resumo por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(
                filteredTransactions.reduce((acc, t) => {
                  const cat = t.category || "outros";
                  if (!acc[cat]) acc[cat] = { entrada: 0, saida: 0 };
                  if (t.type === "entrada") acc[cat].entrada += Number(t.amount);
                  else acc[cat].saida += Number(t.amount);
                  return acc;
                }, {} as Record<string, { entrada: number; saida: number }>)
              ).map(([category, values]) => (
                <div
                  key={category}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm capitalize">
                      {categoryLabels[category] || category}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      {values.entrada > 0 && (
                        <span className="text-success">
                          +R$ {values.entrada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      {values.saida > 0 && (
                        <span className="text-destructive">
                          -R$ {values.saida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma transação no período</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Últimas Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma movimentação registrada</p>
              <p className="text-sm">As transações aparecerão aqui quando realizadas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.slice(0, 20).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            transaction.type === "entrada"
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {transaction.type === "entrada" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <span className="font-medium">{transaction.description || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[transaction.category] || transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {paymentLabels[transaction.payment_method || ""] || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        transaction.type === "entrada"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {transaction.type === "entrada" ? "+" : "-"}R${" "}
                      {Number(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
