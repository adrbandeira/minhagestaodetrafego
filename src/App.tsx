import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ReviewsPage from "@/pages/ReviewsPage";
import TasksPage from "@/pages/TasksPage";
import ClientProfile from "@/pages/ClientProfile";
import ClientList from "@/pages/ClientList";
import NewClient from "@/pages/NewClient";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StoreProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/revisoes" element={<ReviewsPage />} />
              <Route path="/tarefas" element={<TasksPage />} />
              <Route path="/cliente/:id" element={<ClientProfile />} />
              <Route path="/clientes/:type" element={<ClientList />} />
              <Route path="/clientes/novo" element={<NewClient />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
