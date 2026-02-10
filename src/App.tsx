import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { StoreProvider } from "@/hooks/useStores";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout><Dashboard /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/catalogo" element={
                <ProtectedRoute>
                  <AppLayout><Catalogo /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/catalogo/:category" element={
                <ProtectedRoute>
                  <AppLayout><Catalogo /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/pdv" element={
                <ProtectedRoute>
                  <AppLayout><PDV /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/estoque" element={
                <ProtectedRoute>
                  <AppLayout><Estoque /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/vendas" element={
                <ProtectedRoute>
                  <AppLayout><Vendas /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/financeiro" element={
                <ProtectedRoute>
                  <AppLayout><Financeiro /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/clientes" element={
                <ProtectedRoute>
                  <AppLayout><Clientes /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/delivery" element={
                <ProtectedRoute>
                  <AppLayout><Delivery /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/notificacoes" element={
                <ProtectedRoute>
                  <AppLayout><Notificacoes /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <AppLayout><Configuracoes /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StoreProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

function AuthDebug() {
  const { user, isAdmin } = useAuth();
  const { data: profile } = useProfile();
  
  useEffect(() => {
    console.log('=== AUTH DEBUG ===');
    console.log('User ID:', user?.id);
    console.log('isAdmin:', isAdmin);
    console.log('Profile:', profile ? {
      id: profile.id,
      role: profile.role,
      is_approved: profile.is_approved,
      is_blocked: profile.is_blocked
    } : null);
    console.log('=== FIM DEBUG ===');
  }, [user, isAdmin, profile]);
  
  return null;
}