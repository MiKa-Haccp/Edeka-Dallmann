import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "wouter";
import { Truck, List, ShoppingBag, ChevronLeft } from "lucide-react";
import WareStreckenUebersicht from "./WareStreckenUebersicht";
import WareStreckenBestellung from "./WareStreckenBestellung";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabKey = "uebersicht" | "bestellung";

const TABS: { key: TabKey; icon: React.ElementType; label: string }[] = [
  { key: "uebersicht", icon: List, label: "Streckenlieferanten" },
  { key: "bestellung", icon: ShoppingBag, label: "Bestellung" },
];

export default function WareStreckenbestellungHub() {
  const [activeTab, setActiveTab] = useState<TabKey>("uebersicht");

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-5 px-4 py-6">

        {/* Header */}
        <PageHeader className="from-[#c73d00] to-[#f94d00]">
          <div className="flex items-center gap-3">
            <Link href="/ware-bestellungen" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Streckenbestellung</h1>
              <p className="text-white/70 text-sm">Übersicht und Bestellung für Streckenlieferanten</p>
            </div>
          </div>
        </PageHeader>

        {/* Tabs + Inhalt */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="flex overflow-x-auto border-b border-border">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeTab === tab.key
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "uebersicht" && <WareStreckenUebersicht noLayout />}
            {activeTab === "bestellung" && <WareStreckenBestellung noLayout />}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
