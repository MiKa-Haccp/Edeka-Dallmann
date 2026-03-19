import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ClipboardCheck, ChevronLeft, ChevronRight, Loader2, Check,
  X, Printer, Lock, TrendingUp,
} from "lucide-react";
import { getBavarianHolidays, getHolidayName } from "@/utils/holidays";

const BASE = import.meta.env.VITE_API_URL || "/api";

const AREAS = [
  { key: "boeden",   short: "Böden",     label: "Böden und Abflüsse" },
  { key: "waende",   short: "Wände",     label: "Wände und Fenster" },
  { key: "decken",   short: "Decken",    label: "Decken, Lampen und Versorgungsleitungen" },
  { key: "abfall",   short: "Abfall",    label: "Abfallbehälter" },
  { key: "regal",    short: "Regal",     label: "Regalböden, Aufsteller, Preisschilder" },
  { key: "leeraut",  short: "Leeraut.",  label: "Leergutautomaten" },
  { key: "geraete",  short: "Geräte",   label: "Arbeitsgeräte, Tische, Bretter" },
  { key: "wasser",   short: "Wasser",    label: "Trinkwasserspender, Kaffeemaschinen" },
  { key: "umkleide", short: "Umkleide", label: "Umkleideschränke" },
  { key: "sanitaer", short: "Sanitär",  label: "Handwaschbecken, Toiletten, Seifenspender" },
  { key: "rampen",   short: "Rampen",   label: "Rampen, Anlieferungsbereiche" },
  { key: "wagen",    short: "EKW-Box",  label: "Einkaufswagenbox" },
];

const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

type CheckEntry = {
  id: number;
  day: number;
  area: string;
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
  const n = new Date();
  return n.getFullYear() === year && n.getMonth() + 1 === month && n.getDate() === day;
}
function isPast(year: number, month: number, day: number) {
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return new Date(year, month - 1, day) < n;
}

// ===== PIN MODAL =====
function PinModal({
  onConfirm, onClose, day, area,
}: {
  onConfirm: (kuerzel: string, userId: number | null) => void;
  onClose: () => void;
  day: number;
  area: typeof AREAS[0];
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [identified, setIdentified] = useState<{ name: string; userId: number; kuerzel: string } | null>(null);

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, tenantId: 1 }),
      });
      const data = await res.json();
      if (data.valid) {
        setIdentified({ name: data.userName, userId: data.userId, kuerzel: data.initials });
      } else {
        setError("PIN ungueltig.");
      }
    } catch {
      setError("Verbindungsfehler.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Bereich abzeichnen</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Tag {day} &mdash; {area.label}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!identified ? (
          <>
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              PIN pruefen
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">{identified.name}</p>
                <p className="text-xs text-green-600">Kuerzel: <span className="font-mono font-bold">{identified.kuerzel}</span></p>
              </div>
            </div>
            <button
              onClick={() => onConfirm(identified.kuerzel, identified.userId)}
              className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Abzeichnen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== HAUPTSEITE =====
export default function ReinigungTaeglich() {
  const { selectedMarketId, selectedMarketName, adminSession } = useAppStore();
  const isAdmin = !!adminSession;

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [entries, setEntries]     = useState<CheckEntry[]>([]);
  const [loading, setLoading]     = useState(false);
  const [activeCell, setActiveCell] = useState<{ day: number; area: typeof AREAS[0] } | null>(null);
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const totalDays = daysInMonth(year, month);
  const holidays  = useMemo(() => getBavarianHolidays(year), [year]);
  const dateStr   = (day: number) => `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const isDayHoliday = (day: number) => holidays.has(dateStr(day));
  const holidayLabel = (day: number) => getHolidayName(dateStr(day), year);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/reinigung-taeglich?marketId=${selectedMarketId}&year=${year}&month=${month}`);
      const data = await res.json();
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMarketId, year, month]);

  useEffect(() => { load(); }, [load]);

  const getEntry = (day: number, areaKey: string) =>
    entries.find(e => e.day === day && e.area === areaKey) ?? null;

  const handleSign = async (kuerzel: string, userId: number | null) => {
    if (!activeCell || !selectedMarketId) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/reinigung-taeglich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId,
          year, month,
          day: activeCell.day,
          area: activeCell.area.key,
          kuerzel, userId,
        }),
      });
      if (res.ok) {
        setActiveCell(null);
        await load();
        window.dispatchEvent(new CustomEvent("reinigung-taeglich-updated"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`${BASE}/reinigung-taeglich/${id}`, { method: "DELETE" });
      await load();
      window.dispatchEvent(new CustomEvent("reinigung-taeglich-updated"));
    } finally {
      setDeletingId(null);
    }
  };

  const prevMonth = () => { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); };

  const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

  const closedDays = Array.from({ length: totalDays }, (_, i) => i+1)
    .filter(d => getWeekday(year, month, d) === "So" || isDayHoliday(d)).length;
  const openDays   = totalDays - closedDays;
  const totalSlots = openDays * AREAS.length;
  const filledSlots = entries.filter(e => getWeekday(year, month, e.day) !== "So" && !isDayHoliday(e.day)).length;
  const pct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  const todayDone = entries.filter(e =>
    e.day === now.getDate() && month === now.getMonth()+1 && year === now.getFullYear()
  ).length;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-4 pb-10">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1a3a6b]/10">
              <ClipboardCheck className="w-6 h-6 text-[#1a3a6b]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">2.2 Reinigungsdokumentation</h1>
              <p className="text-sm text-muted-foreground">{selectedMarketName || "Kein Markt"} &mdash; tägliche Kontrolle</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Printer className="w-4 h-4" /> Drucken
          </button>
        </div>

        {/* MONATSNAVIGATION + FORTSCHRITT */}
        <div className="bg-white rounded-xl border border-border/60 p-4 flex flex-col sm:flex-row sm:items-center gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-base font-bold min-w-[160px] text-center text-foreground">
              {MONTH_NAMES[month-1]} {year}
            </span>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Monatsfortschritt</span>
              <span className="font-bold text-foreground">{filledSlots} / {totalSlots} ({pct}%)</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          {month === now.getMonth()+1 && year === now.getFullYear() && (
            <div className={`text-xs font-bold px-3 py-1.5 rounded-full ${todayDone === AREAS.length ? "bg-green-100 text-green-700" : todayDone > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
              Heute: {todayDone}/{AREAS.length}
            </div>
          )}
        </div>

        {/* TABELLE */}
        <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto haccp-table-container">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1a3a6b] text-white">
                    <th className="px-3 py-3 text-left text-xs font-bold sticky left-0 bg-[#1a3a6b] z-10 min-w-[48px]">Tag</th>
                    <th className="px-2 py-3 text-center text-xs font-bold min-w-[36px]">WT</th>
                    {AREAS.map(a => (
                      <th key={a.key} title={a.label} className="px-1.5 py-3 text-center text-xs font-bold min-w-[62px] whitespace-nowrap">
                        {a.short}
                      </th>
                    ))}
                    <th className="px-2 py-3 text-center text-xs font-bold min-w-[40px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: totalDays }, (_, i) => i+1).map(day => {
                    const today    = isToday(year, month, day);
                    const past     = isPast(year, month, day);
                    const wd       = getWeekday(year, month, day);
                    const isSunday = wd === "So";
                    const isSat    = wd === "Sa";
                    const isHoliday = isDayHoliday(day);
                    const isClosed  = isSunday || isHoliday;
                    const hName     = isHoliday ? holidayLabel(day) : null;
                    const dayEntries = entries.filter(e => e.day === day);
                    const complete   = !isClosed && dayEntries.length === AREAS.length;
                    const partial    = !isClosed && dayEntries.length > 0 && !complete;
                    const isFuture   = !today && !past;

                    return (
                      <tr
                        key={day}
                        className={[
                          "border-t border-border/40 transition-colors",
                          isClosed  ? "bg-slate-100/80 opacity-60" : "",
                          !isClosed && today  ? "bg-green-50/70 border-l-4 border-l-green-500" : "",
                          !isClosed && !today && past && partial ? "bg-amber-50/30" : "",
                          !isClosed && !today && past && !partial && !complete && day < now.getDate()-1 ? "bg-red-50/20" : "",
                          !isClosed && !today && !past ? "bg-white" : "",
                          isSat && !today && !isHoliday ? "bg-slate-50/60" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        {/* Tag */}
                        <td className="px-3 py-1.5 sticky left-0 bg-inherit z-10">
                          <div className="flex items-center gap-1">
                            <span className={`text-sm font-bold tabular-nums ${today ? "text-green-700" : isClosed ? "text-slate-400" : "text-foreground"}`}>
                              {String(day).padStart(2,"0")}
                            </span>
                            {today && <span className="text-[8px] font-bold bg-green-500 text-white px-1 rounded-full leading-4">HEUTE</span>}
                            {isHoliday && !isSunday && <span className="text-[8px] font-bold bg-amber-400 text-white px-1 rounded-full leading-4">FT</span>}
                          </div>
                        </td>
                        {/* Wochentag */}
                        <td className={`px-2 py-1.5 text-center text-xs font-medium ${isClosed ? "text-slate-400" : isSat ? "text-blue-500" : "text-muted-foreground"}`}>
                          {wd}
                        </td>

                        {isClosed ? (
                          <td colSpan={AREAS.length+1} className="px-3 py-1.5 text-center text-xs text-slate-400 italic">
                            {isSunday && !isHoliday ? "Geschlossen" : hName ?? "Feiertag"}
                          </td>
                        ) : (
                          <>
                            {AREAS.map(area => {
                              const entry   = getEntry(day, area.key);
                              const locked  = isFuture;
                              return (
                                <td key={area.key} className="px-1 py-1.5 text-center">
                                  {entry ? (
                                    <div className="relative group inline-flex">
                                      <div className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-green-100 border border-green-300 text-green-800 text-xs font-mono font-bold">
                                        <Check className="w-2.5 h-2.5 text-green-600 shrink-0" />
                                        {entry.kuerzel}
                                      </div>
                                      {isAdmin && (
                                        <button
                                          onClick={() => handleDelete(entry.id)}
                                          disabled={deletingId === entry.id}
                                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                                        >
                                          {deletingId === entry.id
                                            ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                            : <X className="w-2.5 h-2.5" />}
                                        </button>
                                      )}
                                    </div>
                                  ) : locked ? (
                                    <div className="flex items-center justify-center py-1">
                                      <Lock className="w-3 h-3 text-slate-300" />
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setActiveCell({ day, area })}
                                      title={area.label}
                                      className={[
                                        "w-full min-w-[52px] py-1 rounded-lg border text-xs font-medium transition-all",
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
                            {/* Status-Spalte */}
                            <td className="px-1.5 py-1.5 text-center">
                              {complete ? (
                                <span className="inline-flex w-5 h-5 rounded-full bg-green-500 items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </span>
                              ) : dayEntries.length > 0 ? (
                                <span className="text-[10px] font-bold text-amber-600">{dayEntries.length}/{AREAS.length}</span>
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
          )}
        </div>

        {/* LEGENDE */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground print:hidden">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Alle Bereiche erledigt</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Teilweise erledigt</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300 inline-block" /> Nicht erforderlich (Feiertag/So)</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Noch nicht freigegeben</span>
        </div>

        <p className="text-xs text-muted-foreground/60 print:hidden">
          Im Bedarfsfall muss ueber die normalen Reinigungsintervalle hinaus haeufiger gereinigt bzw. desinfiziert werden.
        </p>
      </div>

      {/* PIN MODAL */}
      {activeCell && (
        <PinModal
          day={activeCell.day}
          area={activeCell.area}
          onConfirm={handleSign}
          onClose={() => setActiveCell(null)}
        />
      )}
      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}
    </AppLayout>
  );
}
