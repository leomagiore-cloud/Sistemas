import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wine,
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  Truck,
  Bell,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GlassWater,
  IceCream,
  Gift,
  Cigarette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Catálogo",
    icon: Wine,
    path: "/catalogo",
    children: [
      { title: "Vinhos", icon: Wine, path: "/catalogo/vinhos" },
      { title: "Cervejas", icon: GlassWater, path: "/catalogo/cervejas" },
      { title: "Destilados", icon: GlassWater, path: "/catalogo/destilados" },
      { title: "Gelo & Carvão", icon: IceCream, path: "/catalogo/gelo" },
      { title: "Narguilé", icon: Cigarette, path: "/catalogo/narguile" },
      { title: "Combos", icon: Gift, path: "/catalogo/combos" },
    ],
  },
  {
    title: "PDV",
    icon: ShoppingCart,
    path: "/pdv",
  },
  {
    title: "Estoque",
    icon: Package,
    path: "/estoque",
  },
  {
    title: "Vendas",
    icon: BarChart3,
    path: "/vendas",
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    path: "/financeiro",
  },
  {
    title: "Clientes",
    icon: Users,
    path: "/clientes",
  },
  {
    title: "Delivery",
    icon: Truck,
    path: "/delivery",
  },
  {
    title: "Notificações",
    icon: Bell,
    path: "/notificacoes",
  },
  {
    title: "Configurações",
    icon: Settings,
    path: "/configuracoes",
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: typeof menuItems[0]) => {
    if (item.children) {
      return item.children.some((child) => location.pathname === child.path);
    }
    return location.pathname === item.path;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-wine to-wine-dark shadow-wine">
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold text-foreground">
                Magic AI
              </span>
              <span className="text-xs text-muted-foreground">
                Gestão de Adegas
              </span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 overflow-y-auto h-[calc(100vh-5rem)]">
        {menuItems.map((item) => (
          <div key={item.title}>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.path}
                    className={cn(
                      "flex h-11 w-full items-center justify-center rounded-lg transition-all duration-200",
                      isParentActive(item)
                        ? "bg-wine/20 text-wine-light"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                {item.children ? (
                  <button
                    onClick={() =>
                      setExpandedItem(
                        expandedItem === item.title ? null : item.title
                      )
                    }
                    className={cn(
                      "flex h-11 w-full items-center gap-3 rounded-lg px-3 transition-all duration-200",
                      isParentActive(item)
                        ? "bg-wine/20 text-wine-light"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left text-sm font-medium">
                      {item.title}
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        expandedItem === item.title && "rotate-90"
                      )}
                    />
                  </button>
                ) : (
                  <NavLink
                    to={item.path}
                    className={cn(
                      "flex h-11 w-full items-center gap-3 rounded-lg px-3 transition-all duration-200",
                      isActive(item.path)
                        ? "bg-wine/20 text-wine-light"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </NavLink>
                )}

                {/* Submenu */}
                {item.children && expandedItem === item.title && (
                  <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-border pl-3">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={cn(
                          "flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-all duration-200",
                          isActive(child.path)
                            ? "bg-wine/15 text-wine-light"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        <span>{child.title}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
