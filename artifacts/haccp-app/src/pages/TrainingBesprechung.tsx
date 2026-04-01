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
        <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] rounded-2xl p-5 sm:p-6 text-white shadow-lg mb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">1.4 Schulung & Besprechungsprotokoll</h1>
          </div>
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
