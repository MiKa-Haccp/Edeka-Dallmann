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

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedMarketId, deviceAuthorized } = useAppStore();
  const { isLoading: marketsLoading } = useListMarkets();

  useAutoLogout();
  useBookingAutoReturn();

  const showGeraetSperre = !deviceAuthorized;
  const showMarktwahlScreen = deviceAuthorized && !marketsLoading && !selectedMarketId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showGeraetSperre && <GeraetSperrScreen />}
      {showMarktwahlScreen && <MarktwahlScreen />}
      <Header onMenuToggle={() => setMobileMenuOpen(true)} />
      <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex flex-1 w-full min-h-0">
        <Sidebar />
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
