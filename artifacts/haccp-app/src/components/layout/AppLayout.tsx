import { ReactNode, useState, useEffect, useRef } from "react";
import { Header } from "./Header";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { WareSidebar, WareMobileSidebar } from "./WareSidebar";
import { TodoSidebar, TodoMobileSidebar, TODO_PATHS } from "./TodoSidebar";
import { motion } from "framer-motion";
import { MarktwahlScreen } from "@/components/MarktwahlScreen";
import { GeraetSperrScreen } from "@/components/GeraetSperrScreen";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useBookingAutoReturn } from "@/hooks/useBookingAutoReturn";
import { useLocation } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

const HACCP_SIDEBAR_PATHS = [
  "/responsibilities",
  "/info-documentation", "/training-records", "/annual-cleaning-plan",
  "/betriebsbegehung", "/hinweisschild-gesperrte-ware", "/produktfehlermeldung",
  "/probeentnahme", "/anti-vektor-zugang", "/bescheinigungen", "/kontrollberichte",
  "/warencheck-og", "/reinigung-taeglich", "/carrier-portal",
  "/haccp", "/wareneingaenge", "/metzgerei-wareneingaenge", "/reinigungsplan-metzgerei", "/oeffnung-salate", "/kaesetheke-kontrolle", "/semmelliste", "/eingefrorenes-fleisch", "/rezepturen", "/gq-begehung", "/abteilungsfremde-personen",
  "/marktplan",
  "/section/", "/category/", "/we-", "/besprechungsprotokoll",
  "/gesundheitszeugnisse",
];

function useActiveSidebar() {
  const [location] = useLocation();
  const isWare = location === "/ware" || location.startsWith("/ware-");
  const isTodo = TODO_PATHS.some(p => location === p);
  const isHaccp = !isWare && !isTodo && HACCP_SIDEBAR_PATHS.some((p) => location.startsWith(p));
  return { isWare, isHaccp, isTodo, hasSidebar: isWare || isHaccp || isTodo };
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedMarketId, deviceAuthorized, deviceToken, setDeviceToken, setDeviceAuthorized } = useAppStore();
  const { data: rawMarkets, isLoading: marketsLoading, isError: marketsError } = useListMarkets();
  const { isWare, isHaccp, isTodo, hasSidebar } = useActiveSidebar();

  // Gerät-Verifizierung läuft noch (null = unbekannt, true/false = abgeschlossen)
  const [deviceVerifying, setDeviceVerifying] = useState(true);
  const verifiedRef = useRef(false);

  useAutoLogout();
  useBookingAutoReturn();

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    if (!deviceToken) {
      setDeviceAuthorized(false);
      setDeviceVerifying(false);
      return;
    }

    fetch(`${BASE}/device/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: deviceToken }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data?.valid) {
          setDeviceToken(null);
          setDeviceAuthorized(false);
        } else {
          setDeviceAuthorized(true);
        }
      })
      .catch(() => {
        // Bei Netzwerkfehler: autorisiert lassen damit Offline-Nutzung möglich bleibt
        setDeviceAuthorized(true);
      })
      .finally(() => {
        setDeviceVerifying(false);
      });
  }, [deviceToken, setDeviceToken, setDeviceAuthorized]);

  // Gerät noch nicht verifiziert → nichts anzeigen (verhindert kurzes Flackern)
  if (deviceVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Gerät nicht autorisiert → nur Registrierungsscreen, kein Header/Layout
  if (!deviceAuthorized) {
    return <GeraetSperrScreen />;
  }

  // Marktdaten: sicher als Array normalisieren
  const markets = Array.isArray(rawMarkets) ? rawMarkets : [];

  // Märkte werden noch geladen oder konnten nicht geladen werden → kein Markt wählbar
  const marketsReady = !marketsLoading && !marketsError && markets.length > 0;
  const showMarktwahlScreen = marketsReady && !selectedMarketId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showMarktwahlScreen && <MarktwahlScreen />}

      <Header onMenuToggle={hasSidebar ? () => setMobileMenuOpen(true) : undefined} />

      {isHaccp && <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />}
      {isWare && <WareMobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />}
      {isTodo && <TodoMobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />}

      <div className="flex flex-1 w-full min-h-0">
        {isHaccp && <Sidebar />}
        {isWare && <WareSidebar />}
        {isTodo && <TodoSidebar />}
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
