import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  Truck,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { StockAlerts } from "@/components/dashboard/StockAlerts";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { useSalesStats, useSales } from "@/hooks/useSales";
import { useProducts, useLowStockProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useDeliveryStats } from "@/hooks/useDeliveries";

export default function Dashboard() {
  const { data: salesStats } = useSalesStats();
  const { data: products } = useProducts();
  const { data: lowStockProducts } = useLowStockProducts();
  const { data: customers } = useCustomers();
  const { data: deliveryStats } = useDeliveryStats();

  const totalStock = products?.reduce((sum, p) => sum + p.stock_quantity, 0) || 0;
  const lowStockCount = lowStockProducts?.length || 0;

  const { data: sales = [] } = useSales();

// Calcular estatísticas de cancelamentos
const cancelledSales = sales.filter(s => s.status === 'cancelada').length;
const cancelledRevenue = sales.filter(s => s.status === 'cancelada').reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio em tempo real
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Vendas Hoje"
          value={`R$ ${(salesStats?.todayTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={`${salesStats?.todayCount || 0} pedidos`}
          changeType="neutral"
          icon={DollarSign}
          variant="wine"
        />
        <MetricCard
          title="Pedidos"
          value={String(salesStats?.todayCount || 0)}
          change="hoje"
          changeType="neutral"
          icon={ShoppingCart}
        />
        <MetricCard
          title="Ticket Médio"
          value={`R$ ${(salesStats?.avgTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change="esta semana"
          changeType="neutral"
          icon={TrendingUp}
          variant="gold"
        />
        <MetricCard
          title="Estoque"
          value={totalStock.toLocaleString()}
          change={lowStockCount > 0 ? `${lowStockCount} alertas` : "OK"}
          changeType={lowStockCount > 0 ? "negative" : "positive"}
          icon={Package}
        />
        <MetricCard
          title="Clientes"
          value={String(customers?.length || 0)}
          change="cadastrados"
          changeType="neutral"
          icon={Users}
        />
        <MetricCard
          title="Entregas"
          value={String((deliveryStats?.pending || 0) + (deliveryStats?.preparing || 0) + (deliveryStats?.inRoute || 0))}
          change="em andamento"
          changeType="neutral"
          icon={Truck}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SalesChart />
        <CategoryChart />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TopProducts />
        <RecentSales />
        <StockAlerts />
      </div>
    </div>
  );
}
