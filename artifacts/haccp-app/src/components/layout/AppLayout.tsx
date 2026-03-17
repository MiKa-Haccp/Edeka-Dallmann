import { ReactNode, useState } from "react";
import { Header } from "./Header";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { motion } from "framer-motion";

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onMenuToggle={() => setMobileMenuOpen(true)} />
      <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex flex-1 w-full">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden relative min-w-0">
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
