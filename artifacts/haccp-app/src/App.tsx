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
import GeraeteVerwaltung from "./pages/GeraeteVerwaltung";
import TrainingBesprechung from "./pages/TrainingBesprechung";
import TrainingRecords from "./pages/TrainingRecords";
import WarenzustandOG from "./pages/WarenzustandOG";
import ReinigungTaeglich from "./pages/ReinigungTaeglich";
import CarrierPortal from "./pages/CarrierPortal";
import WEObstGemuese from "./pages/WEObstGemuese";
import Wareneingaenge from "./pages/Wareneingaenge";
import MetzgereiWareneingaenge from "./pages/MetzgereiWareneingaenge";
import Ware from "./pages/Ware";
import MHDKontrolle from "./pages/MHDKontrolle";
import WareBestellungen from "./pages/WareBestellungen";
import WareBestellungenHub from "./pages/WareBestellungenHub";
import WareLadenbestellung from "./pages/WareLadenbestellung";
import WareStreckenbestellungHub from "./pages/WareStreckenbestellungHub";
import WareStreckenUebersicht from "./pages/WareStreckenUebersicht";
import WareStreckenBestellung from "./pages/WareStreckenBestellung";
import WareEinraeumservice from "./pages/WareEinraeumservice";
import WareMHD from "./pages/WareMHD";
import LadenplanBuilder from "./pages/LadenplanBuilder";
import MarktPlan from "./pages/MarktPlan";
import MetzgereiReinigung from "./pages/MetzgereiReinigung";
import OeffnungSalate from "./pages/OeffnungSalate";
import KaesethekeKontrolle from "./pages/KaesethekeKontrolle";
import SemmelListe from "./pages/SemmelListe";
import EingefrorenesFleisch from "./pages/EingefrorenesFleisch";
import Rezepturen from "./pages/Rezepturen";
import GQBegehung from "./pages/GQBegehung";
import AbteilungsfremdePersonen from "./pages/AbteilungsfremdePersonen";
import HaccpOverview from "./pages/HaccpOverview";
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
import VerwaltungHub from "./pages/VerwaltungHub";
import SystemAdminHub from "./pages/SystemAdminHub";
import EmailEinstellungen from "./pages/EmailEinstellungen";
import RollenKonfiguration from "./pages/RollenKonfiguration";
import BenachrichtigungsEinstellungen from "./pages/BenachrichtigungsEinstellungen";
import SchulungsAnforderungen from "./pages/SchulungsAnforderungen";
import MonatsberichtAdmin from "./pages/MonatsberichtAdmin";
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
      <Route path="/warencheck-og" component={WarenzustandOG} />
      <Route path="/reinigung-taeglich" component={ReinigungTaeglich} />
      <Route path="/carrier-portal" component={CarrierPortal} />
      <Route path="/we-obst-gemuese" component={WEObstGemuese} />
      <Route path="/ware" component={Ware} />
      <Route path="/mhd-kontrolle" component={MHDKontrolle} />
      <Route path="/ware-bestellungen" component={WareBestellungenHub} />
      <Route path="/ware-rayon-bestellungen" component={WareBestellungen} />
      <Route path="/ware-ladenbestellung" component={WareLadenbestellung} />
      <Route path="/ware-streckenbestellung" component={WareStreckenbestellungHub} />
      <Route path="/ware-strecken-uebersicht" component={WareStreckenUebersicht} />
      <Route path="/ware-strecken-bestellung" component={WareStreckenBestellung} />
      <Route path="/ware-einraeumservice" component={WareEinraeumservice} />
      <Route path="/ware-mhd" component={WareMHD} />
      <Route path="/ladenplan-builder" component={LadenplanBuilder} />
      <Route path="/marktplan" component={MarktPlan} />
      <Route path="/wareneingaenge" component={Wareneingaenge} />
      <Route path="/metzgerei-wareneingaenge" component={MetzgereiWareneingaenge} />
      <Route path="/reinigungsplan-metzgerei" component={MetzgereiReinigung} />
      <Route path="/oeffnung-salate" component={OeffnungSalate} />
      <Route path="/kaesetheke-kontrolle" component={KaesethekeKontrolle} />
      <Route path="/semmelliste" component={SemmelListe} />
      <Route path="/eingefrorenes-fleisch" component={EingefrorenesFleisch} />
      <Route path="/rezepturen" component={Rezepturen} />
      <Route path="/gq-begehung" component={GQBegehung} />
      <Route path="/abteilungsfremde-personen" component={AbteilungsfremdePersonen} />
      <Route path="/haccp" component={HaccpOverview} />
      <Route path="/besprechungsprotokoll" component={TrainingBesprechung} />
      <Route path="/anti-vektor-zugang" component={AntiVektorZugang} />
      <Route path="/gesundheitszeugnisse" component={Gesundheitszeugnisse} />
      <Route path="/arzneimittel-sachkunde" component={ArzneimittelSachkunde} />
      <Route path="/bescheinigungen" component={Bescheinigungen} />
      <Route path="/kontrollberichte" component={Kontrollberichte} />
      <Route path="/mitarbeiterverwaltung" component={Mitarbeiterverwaltung} />
      <Route path="/mitarbeiter-liste" component={MitarbeiterListe} />
      <Route path="/verwaltung" component={VerwaltungHub} />
      <Route path="/training-records" component={TrainingRecords} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/register" component={AdminRegister} />
      <Route path="/admin/users" component={AdminUserManagement} />
      <Route path="/admin/geraete" component={GeraeteVerwaltung} />
      <Route path="/admin/system" component={SystemAdminHub} />
      <Route path="/admin/rollen" component={RollenKonfiguration} />
      <Route path="/admin/email" component={EmailEinstellungen} />
      <Route path="/admin/benachrichtigungen" component={BenachrichtigungsEinstellungen} />
      <Route path="/admin/monatsbericht" component={MonatsberichtAdmin} />
      <Route path="/verwaltung/schulungsanforderungen" component={SchulungsAnforderungen} />
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
