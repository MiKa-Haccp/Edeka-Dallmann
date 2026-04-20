import { useState, useRef } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Printer, ChevronLeft, KeyRound, CheckCircle2, X, Loader2 } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

export default function HinweisschildGesperrteWare() {
  const [datum, setDatum] = useState(() => new Date().toISOString().slice(0, 10));
  const [durch, setDurch] = useState("");
  const [pin, setPin] = useState("");
  const [pinStatus, setPinStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const pinRef = useRef<HTMLInputElement>(null);

  const formattedDate = datum
    ? new Date(datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  async function lookupPin(value: string) {
    if (value.length < 4) return;
    setPinStatus("loading");
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value, tenantId: 1 }),
      });
      const data = await res.json();
      if (data.valid && data.userName) {
        setDurch(data.userName);
        setPinStatus("ok");
      } else {
        setPinStatus("error");
      }
    } catch {
      setPinStatus("error");
    }
  }

  function handlePinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(val);
    setPinStatus("idle");
    if (val.length === 4) lookupPin(val);
  }

  function clearPin() {
    setPin("");
    setPinStatus("idle");
    pinRef.current?.focus();
  }

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
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/category/1" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Hinweisschild gesperrte Ware</h1>
            </div>
          </div>
        </PageHeader>

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

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Gesperrt durch
                </label>
                <input
                  type="text"
                  value={durch}
                  onChange={(e) => { setDurch(e.target.value); if (pinStatus === "ok") setPinStatus("idle"); }}
                  placeholder="Name frei eingeben oder PIN verwenden…"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>PIN (füllt Name aus)</span>
                </div>
                <div className="relative flex-1 max-w-[120px]">
                  <input
                    ref={pinRef}
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={handlePinChange}
                    placeholder="••••"
                    className={`w-full border rounded-xl px-3 py-2 text-sm text-center tracking-widest focus:outline-none focus:ring-2 transition-colors ${
                      pinStatus === "ok"
                        ? "border-green-400 focus:ring-green-200 bg-green-50"
                        : pinStatus === "error"
                        ? "border-red-400 focus:ring-red-200 bg-red-50"
                        : "border-border focus:ring-primary/20 focus:border-primary"
                    }`}
                  />
                </div>
                {pinStatus === "loading" && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />}
                {pinStatus === "ok" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                {pinStatus === "error" && (
                  <span className="flex items-center gap-1 text-xs text-red-500 shrink-0">
                    <X className="w-3.5 h-3.5" /> Ungültig
                  </span>
                )}
                {pin.length > 0 && pinStatus !== "loading" && (
                  <button onClick={clearPin} className="text-xs text-muted-foreground hover:text-foreground underline shrink-0">
                    Löschen
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#1a3a6b]/90 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Schild drucken
          </button>
        </div>

        <div id="hinweisschild-print" className="bg-white rounded-2xl border-2 border-border shadow-sm overflow-hidden" style={{ aspectRatio: "1.414 / 1" }}>
          <div className="flex flex-col h-full p-6 sm:p-10">
            <div className="flex items-start justify-between mb-4">
              <div></div>
              <img
                src={import.meta.env.BASE_URL + "dallmann-logo.png"}
                alt="DALLMANN EDEKA"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-6 sm:mb-10">
                <h1 className="text-6xl sm:text-8xl md:text-9xl font-black text-black tracking-tight leading-none text-center">
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

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
