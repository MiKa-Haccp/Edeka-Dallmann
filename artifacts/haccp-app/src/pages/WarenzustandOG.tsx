import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  Salad, ChevronLeft, ChevronRight, Loader2, Check,
  X, Printer, Lock,
} from "lucide-react";
import { getBavarianHolidays, getHolidayName } from "@/utils/holidays";

const BASE = import.meta.env.VITE_API_URL || "/api";

const SLOTS = [
  { key: "s1", label: "06:00 – 09:00", startHour: 6  },
  { key: "s2", label: "09:00 – 12:00", startHour: 9  },
  { key: "s3", label: "12:00 – 15:00", startHour: 12 },
  { key: "s4", label: "15:00 – 18:00", startHour: 15 },
  { key: "s5", label: "18:00 – Ladenschluss", startHour: 18 },
];

const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

type CheckEntry = {
  id: number;
  day: number;
  slot: string;
  kuerzel: string;
  userId: number | null;
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getWeekday(year: number, month: number, day: number) {
  return WOCHENTAGE[new Date(year, month - 1, day).getDay()];
}

function isToday(year: number, month: number, day: number) {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day;
}

function isPast(year: number, month: number, day: number) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(year, month - 1, day);
  return d < now;
}

// ===== PIN MODAL (ohne Doppelbestätigung) =====
function PinModal({
  onConfirm, onClose, day, slot,
}: {
  onConfirm: (kuerzel: string, userId: number | null) => void;
  onClose: () => void;
  day: number;
  slot: { key: string; label: string };
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    let confirmed = false;
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, tenantId: 1 }),
      });
      const data = await res.json();
      if (data.valid) {
        confirmed = true;
        onConfirm(data.initials, data.userId);
      } else {
        setError("PIN ungültig.");
      }
    } catch {
      setError("Verbindungsfehler.");
    } finally {
      if (!confirmed) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Zeitslot abzeichnen</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Tag {day} &mdash; {slot.label}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">PIN eingeben</label>
          <input
            type="password"
            inputMode="numeric"
            className="w-full border border-border rounded-lg px-3 py-3 text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="&#9679;&#9679;&#9679;&#9679;"
            value={pin}
            maxLength={6}
            autoFocus
            onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={e => e.key === "Enter" && pin.length >= 4 && handleVerify()}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <X className="w-3 h-3" />{error}
          </p>
        )}
        <button
          onClick={handleVerify}
          disabled={loading || pin.length < 4}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#2d5aa0] transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Abzeichnen
        </button>
      </div>
    </div>
  );
}

// ===== HAUPTSEITE =====
export default function WarenzustandOG() {
  const { selectedMarketId, selectedMarketName, adminSession } = useAppStore();
  const isAdmin = !!adminSession;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [entries, setEntries] = useState<CheckEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCell, setActiveCell] = useState<{ day: number; slot: typeof SLOTS[0] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Refs für Scroll-Management
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRowRef = useRef<HTMLTableRowElement>(null);
  const hasAutoScrolled = useRef(false);

  const totalDays = daysInMonth(year, month);
  const holidays = useMemo(() => getBavarianHolidays(year), [year]);
  const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

  const dateStr = (day: number) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isDayHoliday = (day: number) => holidays.has(dateStr(day));
  const holidayLabel = (day: number) => getHolidayName(dateStr(day), year);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/warencheck-og?marketId=${selectedMarketId}&year=${year}&month=${month}`);
      const data = await res.json();
      setEntries(data);
      setInitialLoadDone(true);
    } catch {
      setEntries([]);
      setInitialLoadDone(true);
    } finally {
      setLoading(false);
    }
  }, [selectedMarketId, year, month]);

  useEffect(() => { load(); }, [load]);

  // Auto-Scroll zu heute nach erstem Laden
  useEffect(() => {
    if (initialLoadDone && !hasAutoScrolled.current) {
      const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
      if (isCurrentMonth && todayRowRef.current && scrollRef.current) {
        hasAutoScrolled.current = true;
        requestAnimationFrame(() => {
          todayRowRef.current?.scrollIntoView({ block: "start" });
        });
      }
    }
  }, [initialLoadDone, month, year]);

  const getEntry = (day: number, slotKey: string) =>
    entries.find(e => e.day === day && e.slot === slotKey) ?? null;

  const handleSign = async (kuerzel: string, userId: number | null) => {
    if (!activeCell || !selectedMarketId) return;
    // Scroll-Position speichern
    const savedScroll = scrollRef.current?.scrollTop ?? 0;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/warencheck-og`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId,
          year, month,
          day: activeCell.day,
          slot: activeCell.slot.key,
          kuerzel, userId,
        }),
      });
      if (res.ok) {
        setActiveCell(null);
        await load();
        // Scroll-Position wiederherstellen
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = savedScroll;
        });
        window.dispatchEvent(new CustomEvent("warenzustand-og-updated"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const savedScroll = scrollRef.current?.scrollTop ?? 0;
    setDeletingId(id);
    try {
      await fetch(`${BASE}/warencheck-og/${id}`, { method: "DELETE" });
      await load();
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = savedScroll;
      });
      window.dispatchEvent(new CustomEvent("warenzustand-og-updated"));
    } finally {
      setDeletingId(null);
    }
  };

  const prevMonth = () => {
    hasAutoScrolled.current = false;
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    hasAutoScrolled.current = false;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const todayCheckedCount = entries.filter(
    e => e.day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()
  ).length;
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-4 pb-10">

        {/* HEADER */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                <Salad className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">2.1 Warenzustand Obst & Gemüse</h1>
                <p className="text-xs text-muted-foreground mt-0.5">EDEKA Formblatt 3.7 &mdash; Kontrolle je Zeitfenster</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                <Printer className="w-4 h-4" /> Drucken
              </button>
            </div>
          </div>

          {/* Monats-Navigation + Tagesfortschritt */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/60">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{MONTH_NAMES[month - 1]} {year}</p>
              {selectedMarketName && <p className="text-xs text-muted-foreground">Markt: {selectedMarketName}</p>}
              {isCurrentMonth && (
                <p className="text-xs mt-1">
                  <span className="text-muted-foreground">Heute ({now.getDate()}. {MONTH_NAMES[month - 1]}): </span>
                  <span className={`font-bold ${todayCheckedCount === SLOTS.length ? "text-green-600" : todayCheckedCount > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                    {todayCheckedCount} / {SLOTS.length} abgezeichnet
                  </span>
                </p>
              )}
            </div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABELLE */}
        {!selectedMarketId ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <p className="text-muted-foreground">Bitte wählen Sie einen Markt aus.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Scrollbarer Container mit Sticky-Header */}
            <div
              ref={scrollRef}
              className="overflow-auto"
              style={{ maxHeight: "calc(100vh - 260px)" }}
            >
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-[#1a3a6b] text-white">
                    <th className="px-3 py-3 text-left font-semibold text-xs w-16 sticky left-0 top-0 bg-[#1a3a6b] z-30">Tag</th>
                    <th className="px-2 py-2 text-center font-semibold text-xs w-10 opacity-70">Wt</th>
                    {SLOTS.map(s => (
                      <th key={s.key} className="px-2 py-3 text-center font-semibold text-xs min-w-[110px]">
                        {s.label}
                      </th>
                    ))}
                    <th className="px-2 py-3 text-center font-semibold text-xs w-16 opacity-70">Erl.</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                    const today = isToday(year, month, day);
                    const past = isPast(year, month, day);
                    const wd = getWeekday(year, month, day);
                    const isSunday = wd === "So";
                    const isSaturday = wd === "Sa";
                    const isHoliday = isDayHoliday(day);
                    const isClosed = isSunday || isHoliday;
                    const holidayName = isHoliday ? holidayLabel(day) : null;
                    const dayEntries = entries.filter(e => e.day === day);
                    const complete = !isClosed && dayEntries.length === SLOTS.length;
                    const partial = !isClosed && dayEntries.length > 0 && !complete;

                    return (
                      <tr
                        key={day}
                        ref={today ? todayRowRef : undefined}
                        className={[
                          "border-t border-border/40 transition-colors",
                          isClosed ? "bg-slate-100/80 opacity-60" : "",
                          !isClosed && today ? "bg-green-50/70 border-l-4 border-l-green-500" : "",
                          !isClosed && !today && past && !complete && partial ? "bg-amber-50/30" : "",
                          !isClosed && !today && past && !complete && !partial && day < now.getDate() - 1 ? "bg-red-50/20" : "",
                          !isClosed && !today && !past ? "bg-white" : "",
                          isSaturday && !today && !isHoliday ? "bg-slate-50/60" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        <td className="px-3 py-2 sticky left-0 bg-inherit z-10">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-bold tabular-nums ${today ? "text-green-700" : isClosed ? "text-slate-400" : "text-foreground"}`}>
                              {String(day).padStart(2, "0")}
                            </span>
                            {today && <span className="text-[9px] font-bold bg-green-500 text-white px-1 rounded-full">HEUTE</span>}
                            {isHoliday && !isSunday && <span className="text-[9px] font-bold bg-amber-400 text-white px-1 rounded-full">FT</span>}
                          </div>
                        </td>
                        <td className={`px-2 py-2 text-center text-xs font-medium ${isClosed ? "text-slate-400" : isSaturday ? "text-blue-500" : "text-muted-foreground"}`}>
                          {wd}
                        </td>
                        {isClosed ? (
                          <td colSpan={SLOTS.length + 1} className="px-3 py-2 text-center text-xs text-slate-400 italic">
                            {isSunday && !isHoliday ? "Geschlossen" : holidayName ?? "Feiertag"}
                          </td>
                        ) : (
                          <>
                            {SLOTS.map(slot => {
                              const entry = getEntry(day, slot.key);
                              const isFutureDay = !today && !past;
                              const isSlotFuture = today && slot.startHour > now.getHours();
                              const isLocked = isFutureDay || isSlotFuture;
                              return (
                                <td key={slot.key} className="px-1.5 py-1.5 text-center">
                                  {entry ? (
                                    <div className="relative group inline-flex">
                                      <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-100 border border-green-300 text-green-800 text-xs font-mono font-bold">
                                        <Check className="w-3 h-3 text-green-600 shrink-0" />
                                        {entry.kuerzel}
                                      </div>
                                      {isAdmin && (
                                        <button
                                          onClick={() => handleDelete(entry.id)}
                                          disabled={deletingId === entry.id}
                                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                                        >
                                          {deletingId === entry.id ? (
                                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                          ) : (
                                            <X className="w-2.5 h-2.5" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  ) : isLocked ? (
                                    <div className="w-full min-w-[70px] py-1.5 flex items-center justify-center">
                                      <Lock className="w-3 h-3 text-slate-300" />
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setActiveCell({ day, slot })}
                                      className={[
                                        "w-full min-w-[70px] py-1.5 rounded-lg border text-xs font-medium transition-all",
                                        today
                                          ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                                          : "border-dashed border-red-200 bg-red-50/40 text-red-400 hover:bg-red-50",
                                      ].join(" ")}
                                    >
                                      +
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-2 py-2 text-center">
                              {complete ? (
                                <span className="inline-flex w-6 h-6 rounded-full bg-green-500 items-center justify-center">
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </span>
                              ) : dayEntries.length > 0 ? (
                                <span className="text-xs font-bold text-amber-600">{dayEntries.length}/{SLOTS.length}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground/30">—</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legende */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 bg-green-100 border border-green-300 rounded inline-block" /> Abgezeichnet</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 bg-green-50 border-l-2 border-green-500 rounded inline-block" /> Heute</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 bg-amber-50 border border-dashed border-amber-200 rounded inline-block" /> Teilweise</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 bg-red-50/40 border border-dashed border-red-200 rounded inline-block" /> Offen (Vergangenheit)</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 bg-slate-50 border border-border rounded inline-block" /> Wochenende</span>
        </div>

        {/* PIN MODAL */}
        {activeCell && (
          <PinModal
            day={activeCell.day}
            slot={activeCell.slot}
            onConfirm={handleSign}
            onClose={() => setActiveCell(null)}
          />
        )}

        {saving && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-2xl">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm font-medium">Wird gespeichert...</span>
            </div>
          </div>
        )}

        {/* DRUCK-STYLES */}
        <style>{`
          @media print {
            body > *:not(#og-print-root) { display: none !important; }
            .max-w-6xl { max-width: 100% !important; }
            button { display: none !important; }
            @page { margin: 8mm; size: A4 landscape; }
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
