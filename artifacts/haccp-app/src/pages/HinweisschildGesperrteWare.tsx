import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Printer, ChevronLeft } from "lucide-react";

export default function HinweisschildGesperrteWare() {
  const [datum, setDatum] = useState("");
  const [durch, setDurch] = useState("");

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = datum
    ? new Date(datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  return (
    <AppLayout>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #hinweisschild-print, #hinweisschild-print * { visibility: visible !important; }
          #hinweisschild-print { 
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 24mm 20mm !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>

      <div className="max-w-4xl space-y-4 pb-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Hinweisschild gesperrte Ware</h1>
        </div>
        <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] rounded-2xl p-5 md:p-7 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-blue-200 font-medium tracking-wide uppercase">Sektion 1.7</p>
              <h1 className="text-xl md:text-2xl font-bold">Hinweisschild gesperrte Ware</h1>
            </div>
          </div>
          <p className="text-blue-100 text-sm mt-3">Füllen Sie die Felder aus und drucken Sie das Schild mit einem Klick.</p>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
          <h2 className="font-semibold text-sm text-foreground mb-4">Angaben für das Schild</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Datum (am)</label>
              <input
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Gesperrt durch</label>
              <input
                type="text"
                value={durch}
                onChange={(e) => setDurch(e.target.value)}
                placeholder="Name / Kürzel"
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#1a3a6b]/90 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Schild drucken
          </button>
        </div>

        <div id="hinweisschild-print" className="bg-white rounded-2xl border-2 border-border shadow-sm overflow-hidden" style={{ aspectRatio: "1.414 / 1" }}>
          <div className="flex flex-col h-full p-6 sm:p-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="inline-flex items-center gap-2 text-[#4a90c4] text-xs font-bold uppercase tracking-wider">
                  <span className="bg-[#4a90c4] text-white text-xs font-bold px-1.5 py-0.5 rounded">1.7</span>
                  Hinweisschild gesperrte Ware
                </span>
              </div>
              <img
                src={import.meta.env.BASE_URL + "dallmann-logo.png"}
                alt="DALLMANN EDEKA"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-6 sm:mb-10">
                <h1 className="text-6xl sm:text-8xl md:text-9xl font-black text-black tracking-tight leading-none">
                  GESPERRT!
                </h1>
                <div className="border-b-4 border-black mt-2 sm:mt-3"></div>
              </div>

              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-10">
                <div className="flex items-end gap-4">
                  <span className="text-2xl sm:text-3xl font-normal text-black whitespace-nowrap">am:</span>
                  <div className="flex-1 border-b border-gray-400 pb-1 text-2xl sm:text-3xl text-black min-h-[2.5rem]">
                    {formattedDate}
                  </div>
                </div>
                <div className="flex items-end gap-4">
                  <span className="text-2xl sm:text-3xl font-normal text-black whitespace-nowrap">durch:</span>
                  <div className="flex-1 border-b border-gray-400 pb-1 text-2xl sm:text-3xl text-black min-h-[2.5rem]">
                    {durch}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-black tracking-tight text-center leading-none">
                  - STEHEN LASSEN! -
                </h2>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
              <span>DALLMANN EDEKA · HACCP Management</span>
              <span>Qualitätssicherungs-Handbuch Einzelhandel</span>
              <span>Seite 1 von 1</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
