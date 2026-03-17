import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "./pages/Dashboard";
import SectionDetail from "./pages/SectionDetail";
import CategoryView from "./pages/CategoryView";
import Responsibilities from "./pages/Responsibilities";
import UserRegistry from "./pages/UserRegistry";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminUserManagement from "./pages/AdminUserManagement";
import TrainingRecords from "./pages/TrainingRecords";
import InfoDocumentation from "./pages/InfoDocumentation";
import { useAutoLogout } from "./hooks/useAutoLogout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/category/:categoryId" component={CategoryView} />
      <Route path="/section/:sectionId" component={SectionDetail} />
      <Route path="/responsibilities" component={Responsibilities} />
      <Route path="/user-registry" component={UserRegistry} />
      <Route path="/info-documentation" component={InfoDocumentation} />
      <Route path="/training-records" component={TrainingRecords} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/register" component={AdminRegister} />
      <Route path="/admin/users" component={AdminUserManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AutoLogoutWrapper({ children }: { children: React.ReactNode }) {
  useAutoLogout();
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AutoLogoutWrapper>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AutoLogoutWrapper>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
