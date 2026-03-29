import { ReactNode, useState, useEffect, useRef } from "react";
import { Header } from "./Header";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { WareSidebar, WareMobileSidebar } from "./WareSidebar";
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
  "/responsibilities", "/mitarbeiter-liste", "/mitarbeiterverwaltung",
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
  const isHaccp = !isWare && HACCP_SIDEBAR_PATHS.some((p) => location.startsWith(p));
  return { isWare, isHaccp, hasSidebar: isWare || isHaccp };
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedMarketId, deviceAuthorized, deviceToken, setDeviceToken, setDeviceAuthorized } = useAppStore();
  const { isLoading: marketsLoading } = useListMarkets();
  const { isWare, isHaccp, hasSidebar } = useActiveSidebar();
  const verifiedRef = useRef(false);

  useAutoLogout();
  useBookingAutoReturn();

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    if (!deviceToken) {
      setDeviceAuthorized(false);
      return;
    }

    fetch(`${BASE}/device/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: deviceToken }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.valid) {
          setDeviceToken(null);
          setDeviceAuthorized(false);
        } else {
          setDeviceAuthorized(true);
        }
      })
      .catch(() => {
        setDeviceAuthorized(true);
      });
  }, [deviceToken, setDeviceToken, setDeviceAuthorized]);

  const showGeraetSperre = !deviceAuthorized;
  const showMarktwahlScreen = deviceAuthorized && !marketsLoading && !selectedMarketId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showGeraetSperre && <GeraetSperrScreen />}
      {showMarktwahlScreen && <MarktwahlScreen />}
      <Header onMenuToggle={hasSidebar ? () => setMobileMenuOpen(true) : undefined} />

      {isHaccp && <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />}
      {isWare && <WareMobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />}

      <div className="flex flex-1 w-full min-h-0">
        {isHaccp && <Sidebar />}
        {isWare && <WareSidebar />}
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
