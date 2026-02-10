// src/App.tsx - VERSÃO CORRIGIDA
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { StoreProvider } from "@/hooks/useStores";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StoreRoute } from "@/components/StoreRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Catalogo from "./pages/Catalogo";
import PDV from "./pages/PDV";
import Estoque from "./pages/Estoque";
import Vendas from "./pages/Vendas";
import Financeiro from "./pages/Financeiro";
import Clientes from "./pages/Clientes";
import Delivery from "./pages/Delivery";
import Notificacoes from "./pages/Notificacoes";
import Configuracoes from "./pages/Configuracoes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// IMPORTES DIRETOS - NÃO USE require()
import SelectStore from "./pages/SelectStore";
import CreateStore from "./pages/CreateStore";
import CreateFirstStore from "./pages/CreateFirstStore";
import StoreSettings from "./pages/StoreSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StoreProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/select-store" element={<SelectStore />} />
                <Route path="/stores/create" element={<CreateStore />} />
                <Route path="/stores/create-first" element={<CreateFirstStore />} />
                
                <Route element={<StoreRoute />}>
                  <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
                  <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                  <Route path="/catalogo" element={<AppLayout><Catalogo /></AppLayout>} />
                  <Route path="/catalogo/:category" element={<AppLayout><Catalogo /></AppLayout>} />
                  <Route path="/pdv" element={<AppLayout><PDV /></AppLayout>} />
                  <Route path="/estoque" element={<AppLayout><Estoque /></AppLayout>} />
                  <Route path="/vendas" element={<AppLayout><Vendas /></AppLayout>} />
                  <Route path="/financeiro" element={<AppLayout><Financeiro /></AppLayout>} />
                  <Route path="/clientes" element={<AppLayout><Clientes /></AppLayout>} />
                  <Route path="/delivery" element={<AppLayout><Delivery /></AppLayout>} />
                  <Route path="/notificacoes" element={<AppLayout><Notificacoes /></AppLayout>} />
                  <Route path="/configuracoes" element={<AppLayout><Configuracoes /></AppLayout>} />
                  <Route path="/stores/:storeId/settings" element={<AppLayout><StoreSettings /></AppLayout>} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StoreProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;