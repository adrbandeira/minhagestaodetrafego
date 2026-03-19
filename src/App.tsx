import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StoreProvider } from "@/lib/store";
import { ThemeProvider } from "@/hooks/useTheme";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ReviewsPage from "@/pages/ReviewsPage";
import TasksPage from "@/pages/TasksPage";
import ClientProfile from "@/pages/ClientProfile";
import ClientList from "@/pages/ClientList";
import NewClient from "@/pages/NewClient";
import AdminPanel from "@/pages/AdminPanel";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import MonthlyReport from "@/pages/MonthlyReport";
import WalletBalance from "@/pages/WalletBalance";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
    <Route path="/revisoes" element={<ProtectedRoute><AppLayout><ReviewsPage /></AppLayout></ProtectedRoute>} />
    <Route path="/tarefas" element={<ProtectedRoute><AppLayout><TasksPage /></AppLayout></ProtectedRoute>} />
    <Route path="/cliente/:id" element={<ProtectedRoute><AppLayout><ClientProfile /></AppLayout></ProtectedRoute>} />
    <Route path="/clientes/:type" element={<ProtectedRoute><AppLayout><ClientList /></AppLayout></ProtectedRoute>} />
    <Route path="/clientes/novo" element={<ProtectedRoute><AppLayout><NewClient /></AppLayout></ProtectedRoute>} />
    <Route path="/relatorio" element={<ProtectedRoute><AppLayout><MonthlyReport /></AppLayout></ProtectedRoute>} />
    <Route path="/saldo/:type" element={<ProtectedRoute><AppLayout><WalletBalance /></AppLayout></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute adminOnly><AppLayout><AdminPanel /></AppLayout></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <StoreProvider>
              <AppRoutes />
            </StoreProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
