import { useState } from "react";
import {
  Package,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts, PRODUCT_CATEGORIES } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStock";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Estoque() {
  const { data: products = [], isLoading } = useProducts();
  const { data: movements = [] } = useStockMovements(10);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = products.reduce((sum, item) => sum + item.stock_quantity, 0);
  const lowStockItems = products.filter((item) => item.stock_quantity <= item.min_stock).length;
  const totalValue = products.reduce((sum, item) => sum + item.stock_quantity * item.cost_price, 0);

  const getCategoryLabel = (category: string) => {
    return PRODUCT_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Controle de Estoque</h1>
          <p className="text-muted-foreground">Gerencie entradas, saídas e inventário</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-wine/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-wine-light" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{totalItems.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold">{lowStockItems} produtos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor em Estoque</p>
                <p className="text-2xl font-bold">R$ {totalValue.toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produtos Ativos</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Produtos em Estoque</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{getCategoryLabel(item.category)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.location || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.stock_quantity}</span>
                          <span className="text-xs text-muted-foreground">/ min {item.min_stock}</span>
                        </div>
                        <Progress value={Math.min(100, (item.stock_quantity / Math.max(item.min_stock * 3, 1)) * 100)} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.stock_quantity <= item.min_stock ? (
                        <Badge variant="destructive">Baixo</Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-wine-light" />
              Movimentações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Sem movimentações</p>
            ) : (
              <div className="space-y-4">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      movement.type === "entrada" ? "bg-success/20 text-success" : 
                      movement.type === "saida" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                    }`}>
                      {movement.type === "entrada" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{(movement as any).products?.name || "Produto"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(movement.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <span className={`font-semibold ${movement.type === "entrada" ? "text-success" : "text-destructive"}`}>
                      {movement.type === "entrada" ? "+" : "-"}{movement.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
