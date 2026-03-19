import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

// Bereinigt localStorage-Entwürfe die Bild-Daten enthalten (verhindert Screenshot-Flash beim Start)
function cleanupImageDrafts() {
  const DRAFT_KEYS = ["haccp-pfm-draft-v1", "haccp-probe-draft-v1"];
  for (const key of DRAFT_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      if (raw.includes("data:image") || raw.includes("data:application/pdf") || raw.length > 100_000) {
        const parsed = JSON.parse(raw);
        const form = parsed?.form || parsed;
        const cleaned = JSON.parse(JSON.stringify(form, (_, v) =>
          typeof v === "string" && (v.startsWith("data:image") || v.startsWith("data:application/pdf")) ? null : v
        ));
        if (parsed?.form !== undefined) {
          localStorage.setItem(key, JSON.stringify({ ...parsed, form: cleaned }));
        } else {
          localStorage.setItem(key, JSON.stringify(cleaned));
        }
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}

import Dashboard from "./pages/Dashboard";
import SectionDetail from "./pages/SectionDetail";
import CategoryView from "./pages/CategoryView";
import Responsibilities from "./pages/Responsibilities";
import UserRegistry from "./pages/UserRegistry";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminUserManagement from "./pages/AdminUserManagement";
import TrainingBesprechung from "./pages/TrainingBesprechung";
import InfoDocumentation from "./pages/InfoDocumentation";
import AnnualCleaningPlan from "./pages/AnnualCleaningPlan";
import Betriebsbegehung from "./pages/Betriebsbegehung";
import Produktfehlermeldung from "./pages/Produktfehlermeldung";
import HinweisschildGesperrteWare from "./pages/HinweisschildGesperrteWare";
import Probeentnahme from "./pages/Probeentnahme";
import AntiVektorZugang from "./pages/AntiVektorZugang";
import Gesundheitszeugnisse from "./pages/Gesundheitszeugnisse";
import ArzneimittelSachkunde from "./pages/ArzneimittelSachkunde";
import Bescheinigungen from "./pages/Bescheinigungen";
import Kontrollberichte from "./pages/Kontrollberichte";
import Mitarbeiterverwaltung from "./pages/Mitarbeiterverwaltung";
import MitarbeiterListe from "./pages/MitarbeiterListe";
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
      <Route path="/annual-cleaning-plan" component={AnnualCleaningPlan} />
      <Route path="/betriebsbegehung" component={Betriebsbegehung} />
      <Route path="/produktfehlermeldung" component={Produktfehlermeldung} />
      <Route path="/hinweisschild-gesperrte-ware" component={HinweisschildGesperrteWare} />
      <Route path="/probeentnahme" component={Probeentnahme} />
      <Route path="/besprechungsprotokoll" component={TrainingBesprechung} />
      <Route path="/anti-vektor-zugang" component={AntiVektorZugang} />
      <Route path="/gesundheitszeugnisse" component={Gesundheitszeugnisse} />
      <Route path="/arzneimittel-sachkunde" component={ArzneimittelSachkunde} />
      <Route path="/bescheinigungen" component={Bescheinigungen} />
      <Route path="/kontrollberichte" component={Kontrollberichte} />
      <Route path="/mitarbeiterverwaltung" component={Mitarbeiterverwaltung} />
      <Route path="/mitarbeiter-liste" component={MitarbeiterListe} />
      <Route path="/training-records" component={TrainingBesprechung} />
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
  useEffect(() => { cleanupImageDrafts(); }, []);

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
