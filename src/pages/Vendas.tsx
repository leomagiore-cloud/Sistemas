// pages/Vendas.tsx - VERSÃO COMPLETA COM CANCELAMENTO
import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Download,
  Filter,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  X,
  Search,
  Package,
  Eye,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
// Importação correta:
import { 
  useSales, 
  useCancelSale, 
  type SaleWithItems 
} from '@/hooks/useSales';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const paymentLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  credito: "Cartão Crédito",
  debito: "Cartão Débito",
  vale: "Vale",
};

type DateRange = {
  from: Date | null;
  to: Date | null;
};

// Componente para input de data customizado
const DateInput = ({ 
  value, 
  onChange, 
  placeholder = "dd/mm/aaaa",
  className = "",
  ...props 
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => {
  const formatDateInput = (input: string) => {
    const numbers = input.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    onChange(formatted);
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
};

// Componente para cancelar venda
const CancelSaleDialog = ({ 
  sale, 
  open, 
  onOpenChange,
  onCancelSuccess
}: { 
  sale: SaleWithItems | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onCancelSuccess: () => void;
}) => {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cancelSale = useCancelSale();

  const handleCancel = async () => {
    if (!sale) return;

    const finalReason = reason === "outros" && customReason.trim() 
      ? customReason.trim() 
      : reason;

    if (!finalReason.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }

    if (sale.status === 'cancelada') {
      toast.error("Esta venda já está cancelada");
      return;
    }

    try {
      setIsSubmitting(true);
      await cancelSale.mutateAsync({
        saleId: sale.id,
        reason: finalReason
      });
      
      toast.success("Venda cancelada com sucesso!");
      onCancelSuccess();
      onOpenChange(false);
      setReason("");
      setCustomReason("");
    } catch (error) {
      console.error("Erro ao cancelar venda:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancelar Venda
          </DialogTitle>
          <DialogDescription>
            Venda #{sale?.id.substring(0, 8)} • Total: R$ {sale?.total.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Aviso importante */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Atenção!</p>
                <ul className="text-xs text-destructive/80 space-y-1">
                  <li>• O estoque dos produtos será restaurado automaticamente</li>
                  <li>• Uma transação financeira de saída será registrada</li>
                  <li>• Esta ação não pode ser desfeita</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Motivo do cancelamento */}
          <div className="space-y-3">
            <Label>Motivo do Cancelamento *</Label>
            
            <div className="grid gap-2">
              <Button
                type="button"
                variant={reason === "cancelar_venda" ? "destructive" : "outline"}
                className="justify-start"
                onClick={() => {
                  setReason("cancelar_venda");
                  setCustomReason("");
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelamento de venda
              </Button>
              
              <Button
                type="button"
                variant={reason === "troca_produto" ? "destructive" : "outline"}
                className="justify-start"
                onClick={() => {
                  setReason("troca_produto");
                  setCustomReason("");
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Troca de produto
              </Button>
              
              <Button
                type="button"
                variant={reason === "outros" ? "destructive" : "outline"}
                className="justify-start"
                onClick={() => {
                  setReason("outros");
                  setCustomReason("");
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Outros motivos
              </Button>
            </div>

            {reason === "outros" && (
              <div className="space-y-2">
                <Label htmlFor="custom-reason">Descreva o motivo *</Label>
                <Textarea
                  id="custom-reason"
                  placeholder="Descreva detalhadamente o motivo do cancelamento..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="min-h-[100px] resize-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Resumo dos itens */}
          {sale?.sale_items && sale.sale_items.length > 0 && (
            <div className="border rounded-lg p-3">
              <Label className="text-sm font-medium mb-2 block">Produtos a serem devolvidos:</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sale.sale_items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="truncate">
                      {item.products?.name || `Produto ${index + 1}`}
                    </span>
                    <span className="font-medium">
                      {item.quantity} × R$ {item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setReason("");
              setCustomReason("");
            }}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting || !reason.trim()}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Cancelando...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Confirmar Cancelamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Componente para mostrar detalhes dos produtos
const ProductDetailsDialog = ({ 
  sale, 
  open, 
  onOpenChange,
  onCancelClick
}: { 
  sale: SaleWithItems | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onCancelClick: () => void;
}) => {
  if (!sale) return null;

  const canCancel = sale.status === 'concluida';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Detalhes da Venda #{sale.id.substring(0, 8)}
            {sale.status === 'cancelada' && (
              <Badge variant="destructive" className="ml-2">
                Cancelada
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {format(parseISO(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} • 
            Cliente: {sale.customers?.name || "Consumidor Final"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações da venda */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Total</Label>
              <p className="text-xl font-bold text-gold">R$ {sale.total.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Método de Pagamento</Label>
              <p className="font-medium">{paymentLabels[sale.payment_method || ''] || '-'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Badge 
                variant={
                  sale.status === 'concluida' ? 'default' : 
                  sale.status === 'cancelada' ? 'destructive' : 'secondary'
                }
              >
                {sale.status === 'concluida' ? 'Concluída' : 
                 sale.status === 'cancelada' ? 'Cancelada' : 'Pendente'}
              </Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Itens</Label>
              <p className="font-medium">{sale.sale_items?.length || 0}</p>
            </div>
          </div>

          {/* Tabela de produtos */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.sale_items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.products?.name || "Produto não identificado"}</p>
                        <p className="text-xs text-muted-foreground">Código: {item.product_id?.substring(0, 8)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">R$ {item.price?.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {(item.quantity * item.price).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totais */}
          <div className="flex justify-between items-center border-t pt-4">
            <div>
              <Label className="text-xs text-muted-foreground">Subtotal</Label>
              <p className="text-lg">R$ {sale.subtotal?.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Desconto</Label>
              <p className="text-lg">R$ {sale.discount?.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Total</Label>
              <p className="text-2xl font-bold text-gold">R$ {sale.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Botão de cancelar (se aplicável) */}
          {canCancel && (
            <div className="border-t pt-4">
              <Button
                variant="destructive"
                onClick={() => {
                  onOpenChange(false);
                  onCancelClick();
                }}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar esta venda
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function Vendas() {
  const { data: sales = [], isLoading, refetch } = useSales();
  const [period, setPeriod] = useState("week");
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const canCancelToday = (saleDate: string) => {
    const saleDay = new Date(saleDate);
    const today = new Date();
    return (
      saleDay.getDate() === today.getDate() &&
      saleDay.getMonth() === today.getMonth() &&
      saleDay.getFullYear() === today.getFullYear()
    );
  };

  const parseBrazilianDate = (dateString: string): Date | null => {
    if (!dateString || dateString.length < 8) return null;
    
    try {
      const parts = dateString.split('/');
      if (parts.length !== 3) return null;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      
      if (isValid(date) && 
          date.getDate() === day && 
          date.getMonth() === month && 
          date.getFullYear() === year) {
        return date;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (period === "custom") {
      const fromDate = parseBrazilianDate(dateFromInput);
      const toDate = parseBrazilianDate(dateToInput);
      
      setDateRange({ from: fromDate, to: toDate });
    }
  }, [period, dateFromInput, dateToInput]);

  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    const now = new Date();
    
    if (period === "today") {
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      filtered = filtered.filter(sale => {
        try {
          const saleDate = parseISO(sale.created_at);
          return saleDate >= todayStart && saleDate <= todayEnd;
        } catch {
          return false;
        }
      });
    } else if (period === "week") {
      const weekStart = startOfWeek(now, { locale: ptBR });
      const weekEnd = endOfWeek(now, { locale: ptBR });
      filtered = filtered.filter(sale => {
        try {
          const saleDate = parseISO(sale.created_at);
          return saleDate >= weekStart && saleDate <= weekEnd;
        } catch {
          return false;
        }
      });
    } else if (period === "month") {
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      filtered = filtered.filter(sale => {
        try {
          const saleDate = parseISO(sale.created_at);
          return saleDate >= monthStart && saleDate <= monthEnd;
        } catch {
          return false;
        }
      });
    } else if (period === "custom" && dateRange.from && dateRange.to) {
      const customStart = startOfDay(dateRange.from);
      const customEnd = endOfDay(dateRange.to);
      filtered = filtered.filter(sale => {
        try {
          const saleDate = parseISO(sale.created_at);
          return saleDate >= customStart && saleDate <= customEnd;
        } catch {
          return false;
        }
      });
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter(sale => sale.status === statusFilter);
    }

    // Filtrar por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(sale => {
        const customerName = sale.customers?.name?.toLowerCase() || "";
        const saleId = sale.id?.toLowerCase() || "";
        const fullSaleId = sale.id || "";
        
        const productNames = sale.sale_items?.map(item => 
          item.products?.name?.toLowerCase() || ""
        ).join(" ") || "";
        
        return customerName.includes(term) || 
               saleId.includes(term) ||
               fullSaleId.includes(term) ||
               productNames.includes(term);
      });
    }

    return filtered;
  }, [sales, period, dateRange, searchTerm, statusFilter]);

  const concludedSales = filteredSales.filter(sale => sale.status === 'concluida');
  const totalRevenue = concludedSales.reduce((sum, s) => sum + s.total, 0);
  const totalOrders = concludedSales.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;


  // Estatísticas de cancelamentos
  const cancelledSales = sales.filter(s => s.status === 'cancelada').length;
  const cancelledRevenue = sales.filter(s => s.status === 'cancelada').reduce((sum, s) => sum + s.total, 0);

  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      alert("Não há dados para exportar!");
      return;
    }

    try {
      const exportData = filteredSales.flatMap(sale => {
        const baseInfo = {
          "ID_Venda": sale.id,
          "Data": format(parseISO(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
          "Cliente": sale.customers?.name || "Consumidor Final",
          "Método_Pagamento": paymentLabels[sale.payment_method || ''] || '-',
          "Status": sale.status === 'concluida' ? 'Concluída' : sale.status === 'cancelada' ? 'Cancelada' : 'Pendente',
          "Subtotal": sale.subtotal?.toFixed(2),
          "Desconto": sale.discount?.toFixed(2),
          "Total": sale.total.toFixed(2),
          "Vendedor": sale.seller_id?.substring(0, 8) || '',
          "Loja": sale.store_id?.substring(0, 8) || ''
        };

        if (!sale.sale_items || sale.sale_items.length === 0) {
          return [{
            ...baseInfo,
            "Produto": "N/A",
            "ID_Produto": "N/A",
            "Quantidade": "0",
            "Preco_Unitario": "0.00",
            "Total_Item": "0.00"
          }];
        }

        return sale.sale_items.map(item => ({
          ...baseInfo,
          "Produto": item.products?.name || "Produto não identificado",
          "ID_Produto": item.product_id,
          "Quantidade": item.quantity.toString(),
          "Preco_Unitario": item.price.toFixed(2),
          "Total_Item": (item.quantity * item.price).toFixed(2)
        }));
      });

      const headers = [
        "ID_Venda", "Data", "Cliente", "Produto", "ID_Produto", 
        "Quantidade", "Preco_Unitario", "Total_Item", 
        "Subtotal", "Desconto", "Total", 
        "Método_Pagamento", "Status", "Vendedor", "Loja"
      ];
      
      const csvRows = [
        headers.join(";"),
        ...exportData.map(row => {
          const values = headers.map(header => {
            const value = row[header as keyof typeof row];
            if (typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return `"${value}"`;
          });
          return values.join(";");
        })
      ];

      const csvContent = csvRows.join("\n");
      
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const dateStr = format(new Date(), 'dd-MM-yyyy_HH-mm');
      const fileName = `vendas_detalhadas_${dateStr}.csv`;
      
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      alert("Erro ao exportar os dados. Tente novamente.");
    }
  };

  const clearCustomFilters = () => {
    setDateRange({ from: null, to: null });
    setDateFromInput("");
    setDateToInput("");
    setSearchTerm("");
    setStatusFilter("all");
    if (period === "custom") {
      setPeriod("week");
    }
  };

  const hasActiveFilters = (period === "custom" && (dateRange.from || dateRange.to)) || 
                          searchTerm.trim() !== "" || 
                          statusFilter !== "all";

  const handleCancelSuccess = () => {
    refetch(); // Atualiza a lista de vendas
    setSelectedSale(null);
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
          <h1 className="text-3xl font-display font-bold">Análise de Vendas</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho do seu negócio</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-wine rounded-full"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status da Venda</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="concluida">Concluídas</SelectItem>
                        <SelectItem value="cancelada">Canceladas</SelectItem>
                        <SelectItem value="pendente">Pendentes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="search">Buscar cliente, produto ou ID</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Cliente, produto, ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSearchTerm("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {period === "custom" && (
                    <div className="space-y-2">
                      <Label>Período personalizado</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="from-date" className="text-xs">De</Label>
                          <DateInput
                            id="from-date"
                            value={dateFromInput}
                            onChange={setDateFromInput}
                            placeholder="dd/mm/aaaa"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="to-date" className="text-xs">Até</Label>
                          <DateInput
                            id="to-date"
                            value={dateToInput}
                            onChange={setDateToInput}
                            placeholder="dd/mm/aaaa"
                          />
                        </div>
                      </div>
                      {dateRange.from && dateRange.to && (
                        <div className="text-xs text-muted-foreground pt-2">
                          Período selecionado: {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                        </div>
                      )}
                    </div>
                  )}

                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={clearCustomFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={exportToCSV}
            className="bg-wine hover:bg-wine-dark"
            disabled={filteredSales.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
          <Filter className="h-3 w-3" />
          <span>Filtros ativos:</span>
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Status: {statusFilter === 'concluida' ? 'Concluídas' : 
                       statusFilter === 'cancelada' ? 'Canceladas' : 'Pendentes'}
            </Badge>
          )}
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Busca: "{searchTerm}"
            </Badge>
          )}
          {period === "custom" && dateRange.from && dateRange.to && (
            <Badge variant="secondary" className="text-xs">
              Período: {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
            </Badge>
          )}
          {period === "today" && (
            <Badge variant="secondary" className="text-xs">Hoje</Badge>
          )}
          {period === "week" && (
            <Badge variant="secondary" className="text-xs">Esta Semana</Badge>
          )}
          {period === "month" && (
            <Badge variant="secondary" className="text-xs">Este Mês</Badge>
          )}
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="wine">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-wine-light/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-wine-light" />
              </div>
              <div>
                <p className="text-sm opacity-80">Faturamento</p>
                <p className="text-2xl font-bold">
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pedidos</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">R$ {avgTicket.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Cancelamentos */}
        <Card variant={cancelledSales > 0 ? "destructive" : "elevated"}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${cancelledSales > 0 ? 'bg-destructive/20' : 'bg-muted'}`}>
                <RotateCcw className={`h-6 w-6 ${cancelledSales > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className={`text-sm ${cancelledSales > 0 ? 'text-destructive/80' : 'text-muted-foreground'}`}>
                  Cancelamentos
                </p>
                <p className="text-2xl font-bold">
                  {cancelledSales}
                  {cancelledSales > 0 && (
                    <span className="text-sm font-normal ml-1">
                      (R$ {cancelledRevenue.toFixed(2)})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Vendas */}
      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Vendas {period === "custom" ? "Filtradas" : "Recentes"}
            {hasActiveFilters && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredSales.length} resultados)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {filteredSales.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="h-8"
              >
                <Download className="h-3 w-3 mr-1" />
                Exportar CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-muted-foreground">
                {hasActiveFilters 
                  ? "Nenhuma venda encontrada com os filtros atuais" 
                  : "Nenhuma venda registrada"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearCustomFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Mostrando {filteredSales.length} venda{filteredSales.length !== 1 ? 's' : ''}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead className="w-40">Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="w-40">Produtos</TableHead>
                    <TableHead className="w-28">Pagamento</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-32 text-right">Total</TableHead>
                    <TableHead className="w-32 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => {
                    const productCount = sale.sale_items?.length || 0;
                    const firstProduct = sale.sale_items?.[0]?.products?.name || "";
                    const additionalCount = productCount > 1 ? ` +${productCount - 1}` : "";
                    const canCancel = sale.status === 'concluida';
                    
                    return (
                      <TableRow key={sale.id} className={sale.status === 'cancelada' ? 'opacity-60' : ''}>
                        <TableCell className="font-mono text-xs">
                          {sale.id?.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {format(parseISO(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {sale.customers?.name || "Consumidor Final"}
                            </div>
                            {!sale.customers && (
                              <div className="text-xs text-muted-foreground">Sem cadastro</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium line-clamp-1">
                                {firstProduct || "Nenhum produto"}
                              </p>
                              {productCount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {productCount} item{productCount !== 1 ? 's' : ''}
                                  {additionalCount}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {paymentLabels[sale.payment_method || ''] || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              sale.status === 'concluida' ? 'default' : 
                              sale.status === 'cancelada' ? 'destructive' : 'secondary'
                            }
                          >
                            {sale.status === 'concluida' ? 'Concluída' : 
                             sale.status === 'cancelada' ? 'Cancelada' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-gold">
                          R$ {sale.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSale(sale);
                                setShowDetails(true);
                              }}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {canCancel && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedSale(sale);
                                  setShowCancelDialog(true);
                                }}
                                title="Cancelar venda"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogos */}
      <ProductDetailsDialog 
        sale={selectedSale} 
        open={showDetails} 
        onOpenChange={setShowDetails}
        onCancelClick={() => {
          setShowDetails(false);
          setShowCancelDialog(true);
        }}
      />

      <CancelSaleDialog 
        sale={selectedSale} 
        open={showCancelDialog} 
        onOpenChange={setShowCancelDialog}
        onCancelSuccess={handleCancelSuccess}
      />
    </div>
  );
}