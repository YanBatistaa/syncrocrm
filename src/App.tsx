import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import Index    from "@/pages/Index";
import Login    from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Leads    from "@/pages/Leads";
import Projetos from "@/pages/Projetos";
import Workflow from "@/pages/Workflow";
import Config   from "@/pages/Config";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PWAInstallBanner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
              <Route index element={<Index />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="leads"     element={<Leads />} />
              <Route path="projetos"  element={<Projetos />} />
              <Route path="workflow"  element={<Workflow />} />
              <Route path="config"    element={<Config />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
