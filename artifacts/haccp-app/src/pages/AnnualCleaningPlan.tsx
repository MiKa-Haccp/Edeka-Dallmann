import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { CheckCircle2, X, Loader2, KeyRound, Check, AlertCircle, ChevronLeft, ChevronRight, Brush } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

type Frequency = "monatlich" | "vierteljährlich" | "halbjährlich" | "jährlich" | "nach Bedarf";

interface CleaningItem {
  key: string;
  name: string;
  frequency: Frequency;
  frequencyNote?: string;
}

interface CleaningArea {
  title: string;
  items: CleaningItem[];
}

const CLEANING_AREAS: CleaningArea[] = [
  {
    title: "Warenannahme, Lager- und Verkaufsräume, Kühl- und Tiefkühleinrichtungen",
    items: [
      { key: "einkaufswagenbox", name: "Einkaufswagenbox", frequency: "monatlich" },
      { key: "rampe_anlieferung", name: "Rampe, Anlieferung, Stellplätze Abfallcontainer", frequency: "monatlich" },
      { key: "boeden_abfluesse", name: "Böden/Abflüsse im Lagerbereich", frequency: "monatlich" },
      { key: "regalboeden_aufsteller", name: "Regalböden, Aufsteller, Preisschilder im Verkaufsbereich", frequency: "monatlich" },
      { key: "umkleideschraenke", name: "Umkleideschränke in Sanitär-/Sozialräume", frequency: "monatlich" },
      { key: "fenster_waende", name: "Fenster, Wände", frequency: "monatlich" },
      { key: "tk_trocken", name: "Tiefkühlräume\n(trockene Reinigung)", frequency: "monatlich" },
      { key: "kuehlraeume", name: "Kühlräume\n(Deckenverdampfer, Wände, Regale, Fußboden, Abflüsse)", frequency: "monatlich" },
      {
        key: "kuehlmoebel_theke",
        name: "Kühlmöbel, Bedientheke inkl. Wanne,\nTiefkühlmöbel, Wandkühlregale",
        frequency: "monatlich",
        frequencyNote: "Monatlich:\nMöbelinnenreinigung\ninkl. Lüftungsgitter\n\n½ Jährlich:\nDesinfektion",
      },
      { key: "decken_lampen", name: "Decken, Lampen, Versorgungsleitungen", frequency: "halbjährlich" },
      { key: "tk_nass", name: "Tiefkühlräume\n(nasse Reinigung nach Abtauen)", frequency: "jährlich" },
    ],
  },
];

function getActiveMonths(frequency: Frequency): number[] {
  switch (frequency) {
    case "monatlich": return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    case "vierteljährlich": return [1, 4, 7, 10];
    case "halbjährlich": return [1, 7];
    case "jährlich": return [1];
    case "nach Bedarf": return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }
}

interface Confirmation {
  id: number;
  itemKey: string;
  year: number;
  month: number;
  initials: string;
  userId: number | null;
  confirmedAt: string;
}

interface PinDialogProps {
  open: boolean;
  onConfirm: (pin: string) => Promise<void>;
  onClose: () => void;
  error: string;
  loading: boolean;
}

function PinDialog({ open, onConfirm, onClose, error, loading }: PinDialogProps) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (open) setPin("");
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (pin.length === 4) await onConfirm(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#1a3a6b] text-white px-5 py-3 flex items-center gap-3">
          <KeyRound className="h-5 w-5" />
          <h3 className="font-bold text-base">Reinigung bestätigen</h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Geben Sie Ihren 4-stelligen PIN ein. Das Kürzel wird automatisch erkannt.
          </p>
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1.5">PIN (4 Ziffern)</label>
            <input
              type="password"
              value={pin}
              autoFocus
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").substring(0, 4))}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
              className="w-full border border-border rounded-xl px-4 py-3 text-center text-lg font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="****"
              maxLength={4}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors">
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || pin.length !== 4}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Bestätigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnualCleaningPlan() {
  const selectedMarket = useAppStore((s) => s.selectedMarket);
  const adminSession = useAppStore((s) => s.adminSession);
  const isAdmin = !!adminSession;

  const [year, setYear] = useState(new Date().getFullYear());
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ itemKey: string; month: number } | null>(null);
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  const fetchConfirmations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/cleaning-plan?tenantId=1&year=${year}`);
      const data = await res.json();
      setConfirmations(data);
    } catch {
      setConfirmations([]);
    } finally {
      setLoading(false);
    }
  }, [year, BASE]);

  useEffect(() => {
    fetchConfirmations();
  }, [fetchConfirmations]);

  const getConfirmation = (itemKey: string, month: number) =>
    confirmations.find((c) => c.itemKey === itemKey && c.month === month);

  const handleCellClick = (itemKey: string, month: number, activeMonths: number[]) => {
    if (!activeMonths.includes(month)) return;
    const existing = getConfirmation(itemKey, month);
    if (existing) {
      if (!isAdmin) return;
      handleRemove(existing.id);
      return;
    }
    setPinError("");
    setDialog({ itemKey, month });
  };

  const handleRemove = async (id: number) => {
    await fetch(`${BASE}/api/cleaning-plan/confirm/${id}`, { method: "DELETE" });
    setConfirmations((prev) => prev.filter((c) => c.id !== id));
  };

  const handlePinConfirm = async (pin: string) => {
    if (!dialog) return;
    setPinLoading(true);
    setPinError("");
    try {
      const res = await fetch(`${BASE}/api/cleaning-plan/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: 1, itemKey: dialog.itemKey, year, month: dialog.month, pin }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfirmations((prev) => [...prev, data]);
        setDialog(null);
      } else {
        const data = await res.json();
        setPinError(data.error || "Fehler beim Bestätigen.");
      }
    } catch {
      setPinError("Verbindungsfehler.");
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-full space-y-4 pb-8">
        <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] rounded-2xl p-5 md:p-7 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brush className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-blue-200 font-medium tracking-wide uppercase">Sektion 1.5</p>
              <h1 className="text-xl md:text-2xl font-bold">Reinigungsplan Jahr</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <span>Bearbeitungszeitraum (Jahr):</span>
              <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                <button onClick={() => setYear(y => y - 1)} className="hover:text-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-white text-base px-2 tabular-nums">{year}</span>
                <button onClick={() => setYear(y => y + 1)} className="hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>Markt:</span>
              <span className="font-semibold text-white">{selectedMarket?.label || "EDEKA Markt"}</span>
            </div>
            <div className="ml-auto text-xs text-blue-200 italic">(Bestätigung durch Namenskürzel)</div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Als Admin können Sie Bestätigungen durch Klick auf ein Kürzel wieder entfernen.</span>
          </div>
        )}

        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#1a3a6b] text-white">
                  <th className="text-left px-3 py-2.5 font-semibold w-[200px] border-r border-white/20">Gegenstand</th>
                  <th className="text-center px-2 py-2.5 font-semibold w-[100px] border-r border-white/20 text-xs">Reinigung</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="text-center py-2.5 font-semibold w-[55px] text-xs border-r border-white/10 last:border-r-0">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={14} className="text-center py-12 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <span className="text-sm">Lade Daten...</span>
                    </td>
                  </tr>
                ) : (
                  CLEANING_AREAS.map((area, aIdx) => (
                    <React.Fragment key={`area-${aIdx}`}>
                      <tr className="bg-[#e8edf5]">
                        <td colSpan={14} className="px-3 py-2 font-bold text-[#1a3a6b] text-xs whitespace-pre-line border-t-2 border-[#1a3a6b]/20">
                          {area.title}
                        </td>
                      </tr>
                      {area.items.map((item, iIdx) => {
                        const activeMonths = getActiveMonths(item.frequency);
                        const isEven = iIdx % 2 === 0;
                        const now = new Date();
                        const currentYear = now.getFullYear();
                        const currentMonth = now.getMonth() + 1;
                        return (
                          <tr key={item.key} className={`border-b border-border/50 ${isEven ? "bg-white" : "bg-secondary/20"} hover:bg-blue-50/30 transition-colors`}>
                            <td className="px-3 py-2 text-foreground border-r border-border/50 text-xs whitespace-pre-line leading-relaxed">{item.name}</td>
                            <td className="px-2 py-2 text-center text-xs text-muted-foreground border-r border-border/50 whitespace-pre-line leading-snug">
                              {item.frequencyNote || item.frequency}
                            </td>
                            {MONTHS.map((_, mIdx) => {
                              const month = mIdx + 1;
                              const isActive = activeMonths.includes(month);
                              const conf = getConfirmation(item.key, month);
                              const isPast = isActive && !conf && (year < currentYear || (year === currentYear && month < currentMonth));
                              const isCurrent = isActive && !conf && year === currentYear && month === currentMonth;
                              return (
                                <td
                                  key={month}
                                  onClick={() => handleCellClick(item.key, month, activeMonths)}
                                  className={`text-center border-r border-border/30 last:border-r-0 py-1 px-0.5 h-10 transition-all
                                    ${isPast ? "bg-red-50 cursor-pointer" : isCurrent ? "bg-amber-50 cursor-pointer" : isActive ? conf ? "cursor-pointer" : "cursor-pointer" : "bg-gray-50/50 cursor-default"}`}
                                >
                                  {conf ? (
                                    <div className={`inline-flex items-center justify-center w-8 h-7 rounded font-bold text-xs font-mono
                                      ${isAdmin ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600 group cursor-pointer" : "bg-green-100 text-green-700"}`}
                                      title={isAdmin ? `${conf.initials} – ${new Date(conf.confirmedAt).toLocaleDateString("de-DE")} (Klicken zum Entfernen)` : `${conf.initials} – ${new Date(conf.confirmedAt).toLocaleDateString("de-DE")}`}
                                    >
                                      <span className="group-hover:hidden">{conf.initials}</span>
                                      <X className="w-3 h-3 hidden group-hover:block" />
                                    </div>
                                  ) : isPast ? (
                                    <div className="inline-flex items-center justify-center w-8 h-7 rounded bg-red-100 border border-red-300 text-red-400 hover:bg-red-200 hover:text-red-600 transition-colors" title="Ausstehend – nicht bestätigt">
                                      <X className="w-3.5 h-3.5" />
                                    </div>
                                  ) : isCurrent ? (
                                    <div className="inline-flex items-center justify-center w-8 h-7 rounded bg-amber-100 border border-amber-400 text-amber-500 hover:bg-amber-200 hover:text-amber-700 transition-colors animate-pulse" title="Aktueller Monat – noch ausstehend">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                  ) : isActive ? (
                                    <div className="inline-flex items-center justify-center w-8 h-7 rounded border border-dashed border-border/40 text-transparent hover:border-green-400 hover:text-green-500 transition-colors">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                  ) : (
                                    <div className="inline-block w-8 h-7 bg-gray-100 rounded opacity-30" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-center">
          <p className="text-sm text-red-700 leading-relaxed">
            Die angegebene Häufigkeit der Reinigungs- und Desinfektionsmaßnahmen muss{" "}
            <span className="font-bold underline">mindestens</span> eingehalten werden.{" "}
            Im Bedarfsfall – bei sichtbaren Verschmutzungen – muss{" "}
            <span className="font-bold underline">häufiger</span> gereinigt werden.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-green-100 rounded flex items-center justify-center text-green-700 font-bold font-mono text-xs">AS</div>
            <span>Bestätigt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-red-100 border border-red-300 rounded flex items-center justify-center text-red-400">
              <X className="w-3 h-3" />
            </div>
            <span>Überfällig – nicht bestätigt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-amber-100 border border-amber-400 rounded flex items-center justify-center text-amber-500">
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <span>Aktueller Monat – ausstehend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded border border-dashed border-border/40" />
            <span>Zukünftig – noch nicht fällig</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-gray-100 rounded opacity-30" />
            <span>Nicht fällig in diesem Monat</span>
          </div>
        </div>
      </div>

      <PinDialog
        open={!!dialog}
        onConfirm={handlePinConfirm}
        onClose={() => setDialog(null)}
        error={pinError}
        loading={pinLoading}
      />
    </AppLayout>
  );
}
