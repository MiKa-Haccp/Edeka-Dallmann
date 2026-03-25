import { ReactNode, useState } from "react";
import { Header } from "./Header";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { motion } from "framer-motion";
import { MarktwahlScreen } from "@/components/MarktwahlScreen";
import { GeraetSperrScreen } from "@/components/GeraetSperrScreen";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useBookingAutoReturn } from "@/hooks/useBookingAutoReturn";
import { useLocation } from "wouter";

// Pfade auf denen die HACCP-Seitenleiste sichtbar sein soll
// (Dashboard + alle HACCP-Seiten)
const SIDEBAR_PATHS = [
  "/",
  "/responsibilities", "/mitarbeiter-liste", "/mitarbeiterverwaltung",
  "/info-documentation", "/training-records", "/annual-cleaning-plan",
  "/betriebsbegehung", "/hinweisschild-gesperrte-ware", "/produktfehlermeldung",
  "/probeentnahme", "/anti-vektor-zugang", "/bescheinigungen", "/kontrollberichte",
  "/warencheck-og", "/reinigung-taeglich", "/carrier-portal",
  "/wareneingaenge", "/metzgerei-wareneingaenge", "/reinigungsplan-metzgerei", "/oeffnung-salate", "/kaesetheke-kontrolle", "/semmelliste", "/eingefrorenes-fleisch", "/rezepturen", "/gq-begehung",
  "/marktplan",
  "/section/", "/category/", "/we-", "/besprechungsprotokoll",
  "/gesundheitszeugnisse", "/admin/",
];

function useSidebarVisible() {
  const [location] = useLocation();
  if (location === "/") return true;
  return SIDEBAR_PATHS.some((p) => p !== "/" && location.startsWith(p));
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedMarketId, deviceAuthorized } = useAppStore();
  const { isLoading: marketsLoading } = useListMarkets();
  const showSidebar = useSidebarVisible();

  useAutoLogout();
  useBookingAutoReturn();

  const showGeraetSperre = !deviceAuthorized;
  const showMarktwahlScreen = deviceAuthorized && !marketsLoading && !selectedMarketId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showGeraetSperre && <GeraetSperrScreen />}
      {showMarktwahlScreen && <MarktwahlScreen />}
      <Header onMenuToggle={() => setMobileMenuOpen(true)} />
      {showSidebar && (
        <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      )}
      <div className="flex flex-1 w-full min-h-0">
        {showSidebar && <Sidebar />}
        <main className="flex-1 min-w-0 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="p-4 sm:p-6 md:p-8 w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
