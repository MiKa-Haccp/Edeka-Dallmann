import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { GraduationCap, ClipboardList, ChevronLeft } from "lucide-react";
import TrainingRecords from "./TrainingRecords";
import Besprechungsprotokoll from "./Besprechungsprotokoll";

type Tab = "schulung" | "besprechung";

export default function TrainingBesprechung() {
  const [aktiveTab, setAktiveTab] = useState<Tab>("schulung");

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">1.4 Schulung & Besprechungsprotokoll</h1>
        </div>
      </div>
      {/* Tab-Leiste */}
      <div className="max-w-5xl mx-auto mb-4">
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/40 rounded-2xl border border-border/30">
          <button
            onClick={() => setAktiveTab("schulung")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              aktiveTab === "schulung"
                ? "bg-white shadow-sm border border-border/40 text-[#1a3a6b]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            1.4 Schulungsnachweise
          </button>
          <button
            onClick={() => setAktiveTab("besprechung")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              aktiveTab === "besprechung"
                ? "bg-white shadow-sm border border-border/40 text-[#1a3a6b]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            1.10 Besprechungsprotokoll
          </button>
        </div>
      </div>

      {aktiveTab === "schulung" && <TrainingRecords noLayout />}
      {aktiveTab === "besprechung" && <Besprechungsprotokoll noLayout />}
    </AppLayout>
  );
}
