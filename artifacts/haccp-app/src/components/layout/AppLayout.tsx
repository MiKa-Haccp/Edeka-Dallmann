import { ReactNode, useState, useEffect, useRef } from "react";
import { Header } from "./Header";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { WareSidebar, WareMobileSidebar } from "./WareSidebar";
import { TodoSidebar, TodoMobileSidebar, TODO_PATHS } from "./TodoSidebar";
import { motion } from "framer-motion";
import { MarktwahlScreen } from "@/components/MarktwahlScreen";
import { GeraetSperrScreen } from "@/components/GeraetSperrScreen";
import { useAppStore } from "@/store/use-app-store";
import { useMarketsWithCache } from "@/hooks/useMarketsWithCache";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useBookingAutoReturn } from "@/hooks/useBookingAutoReturn";
import { useLocation } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

const HACCP_SIDEBAR_PATHS = [
  "/responsibilities", "/mitarbeiter-liste",
  "/info-documentation", "/training-records", "/annual-cleaning-plan",
  "/betriebsbegehung", "/hinweisschild-gesperrte-ware", "/produktfehlermeldung",
  "/probeentnahme", "/anti-vektor-zugang", "/bescheinigungen", "/kontrollberichte",
  "/warencheck-og", "/reinigung-taeglich", "/carrier-portal",
  "/haccp", "/wareneingaenge", "/metzgerei-wareneingaenge", "/reinigungsplan-metzgerei", "/oeffnung-salate", "/kaesetheke-kontrolle", "/semmelliste", "/eingefrorenes-fleisch", "/rezepturen", "/gq-begehung", "/abteilungsfremde-personen",
  "/marktplan",
  "/section/", "/category/", "/we-", "/besprechungsprotokoll",
  "/gesundheitszeugnisse", "/temp-lager-kontrolle", "/rindfleisch-etikettierung",
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
  const {
    selectedMarketId, deviceAuthorized, deviceToken,
    setDeviceToken, setDeviceAuthorized, setSelectedMarketId,
    adminSession, _hasHydrated, setBetriebsstartByMarket,
  } = useAppStore();
  const { data: rawMarkets } = useMarketsWithCache();

  // Betriebsstart-Daten aus markets in den Store laden
  useEffect(() => {
    if (!rawMarkets) return;
    const map: Record<number, string | null> = {};
    rawMarkets.forEach((m: any) => { map[m.id] = m.betriebsstart ?? null; });
    setBetriebsstartByMarket(map);
  }, [rawMarkets, setBetriebsstartByMarket]);
  const { isWare, isHaccp, isTodo, hasSidebar } = useActiveSidebar();

  // Verifikations-State: "waiting" (auf Hydration warten), "verifying", "done"
  const [verifyState, setVerifyState] = useState<"waiting" | "verifying" | "done">("waiting");
  const verifiedTokenRef = useRef<string | null>(null);
  // Verhindert doppelten GPS-Reset in derselben Session
  const gpsResetDoneRef = useRef(false);

  useAutoLogout();
  useBookingAutoReturn();

  useEffect(() => {
    // Warten bis Zustand aus localStorage vollständig geladen ist
    if (!_hasHydrated) return;

    // Kein Token → sofort fertig
    if (!deviceToken) {
      setDeviceAuthorized(false);
      setVerifyState("done");
      return;
    }

    // Token wurde bereits in dieser Session geprüft → nicht erneut prüfen
    if (verifiedTokenRef.current === deviceToken) {
      setVerifyState("done");
      return;
    }

    // Token bei jedem App-Start gegen die Datenbank prüfen (Server ist Single Source of Truth)
    setVerifyState("verifying");
    verifiedTokenRef.current = deviceToken;

    fetch(`${BASE}/device/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: deviceToken }),
    })
      .then((r) => {
        // Server nicht erreichbar (5xx, Neustart) → Gerät autorisiert lassen
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data?.valid) {
          setDeviceAuthorized(true);
        } else {
          // Server kennt dieses Gerät nicht → Token löschen, Registrierung anfordern
          setDeviceToken(null);
          verifiedTokenRef.current = null;
          setDeviceAuthorized(false);
        }
      })
      .catch(() => {
        // Netzwerkfehler oder Server temporär nicht erreichbar → Gerät autorisiert lassen
        setDeviceAuthorized(true);
      })
      .finally(() => {
        setVerifyState("done");
      });
  }, [_hasHydrated, deviceToken, setDeviceToken, setDeviceAuthorized]);

  // GPS-Pflicht: Bei jedem App-Start Markt zurücksetzen wenn kein Admin angemeldet ist
  // → MarktwahlScreen erscheint und erzwingt Standort-/GPS-Prüfung
  useEffect(() => {
    if (verifyState !== "done") return;
    if (!deviceAuthorized) return;
    if (gpsResetDoneRef.current) return;
    gpsResetDoneRef.current = true;

    if (!adminSession) {
      setSelectedMarketId(null);
    }
  }, [verifyState, deviceAuthorized, adminSession, setSelectedMarketId]);

  // Auf Hydration oder Verifikation warten → Ladeanimation
  if (!_hasHydrated || verifyState === "waiting" || verifyState === "verifying") {
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

  // MarktwahlScreen immer zeigen wenn kein Markt ausgewählt ist (inkl. während Ladezeit)
  const showMarktwahlScreen = !selectedMarketId;

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
