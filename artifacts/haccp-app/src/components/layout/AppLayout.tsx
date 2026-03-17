import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { motion } from "framer-motion";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 max-w-[1600px] mx-auto w-full">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="p-6 md:p-8 w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
