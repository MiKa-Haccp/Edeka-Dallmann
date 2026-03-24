import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  Salad, ChevronLeft, ChevronRight, Loader2, Check,
  X, Printer, Lock, Plus, TrendingUp, Package,
} from "lucide-react";
import { getBavarianHolidays, getHolidayName } from "@/utils/holidays";

const BASE = import.meta.env.VITE_API_URL || "/api";

const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTH_NAMES = ["Januar","Februar","Maerz","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

type SalateEntry = {
  id: number;
  day: number;
  artikelBezeichnung: string;
  verbrauchsdatum: string | null;
  eigenherstellung: boolean;
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
  return new Date(year, month - 1, day) < now;
}

// ===== EINTRAG MODAL =====
function EintragModal({
  onConfirm,
  onClose,
  day,
  year,
  month,
}: {
  onConfirm: (data: { artikelBezeichnung: string; verbrauchsdatum: string; eigenherstellung: boolean; kuerzel: string; userId: number | null }) => void;
  onClose: () => void;
  day: number;
  year: number;
  month: number;
}) {
  const [step, setStep] = useState<"form" | "pin">("form");
  const [artikel, setArtikel] = useState("");
  const [verbrauch, setVerbrauch] = useState("");
  const [eigenherstellung, setEigenherstellung] = useState(false);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [identified, setIdentified] = useState<{ name: string; userId: number; kuerzel: string } | null>(null);

  const handleVerifyPin = async () => {
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

  const handleConfirm = () => {
    if (identified) {
      onConfirm({
        artikelBezeichnung: artikel.trim(),
        verbrauchsdatum: verbrauch,
        eigenherstellung,
        kuerzel: identified.kuerzel,
        userId: identified.userId,
      });
    }
  };

  const wd = WOCHENTAGE[new Date(year, month - 1, day).getDay()];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Oeffnung / Eigenherstellung</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {wd}, {String(day).padStart(2, "0")}. {MONTH_NAMES[month - 1]} {year}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "form" ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Artikel-Bezeichnung *</label>
              <input
                type="text"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="z.B. Salatbar Mischsalat 5 kg"
                value={artikel}
                autoFocus
                onChange={e => setArtikel(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Verbrauchsdatum / MHD</label>
              <input
                type="date"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={verbrauch}
                onChange={e => setVerbrauch(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Eigenherstellung?</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEigenherstellung(true)}
                  className={[
                    "flex-1 py-2 rounded-lg border text-sm font-bold transition-all",
                    eigenherstellung
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-border text-muted-foreground hover:border-green-300",
                  ].join(" ")}
                >
                  Ja
                </button>
                <button
                  onClick={() => setEigenherstellung(false)}
                  className={[
                    "flex-1 py-2 rounded-lg border text-sm font-bold transition-all",
                    !eigenherstellung
                      ? "bg-slate-500 border-slate-500 text-white"
                      : "border-border text-muted-foreground hover:border-slate-300",
                  ].join(" ")}
                >
                  Nein
                </button>
              </div>
            </div>
            <button
              onClick={() => setStep("pin")}
              disabled={!artikel.trim()}
              className="w-full py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#2d5aa0] transition-colors"
            >
              Weiter zur PIN-Eingabe
            </button>
          </div>
        ) : !identified ? (
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-border text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium">Artikel:</span> {artikel}</p>
              {verbrauch && <p><span className="font-medium">MHD:</span> {new Date(verbrauch + "T00:00:00").toLocaleDateString("de-DE")}</p>}
              <p><span className="font-medium">Eigenherst.:</span> {eigenherstellung ? "Ja" : "Nein"}</p>
            </div>
            <button onClick={() => setStep("form")} className="text-xs text-primary hover:underline">
              Zurueck zur Eingabe
            </button>
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
                onKeyDown={e => e.key === "Enter" && pin.length >= 4 && handleVerifyPin()}
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <X className="w-3 h-3" />{error}
              </p>
            )}
            <button
              onClick={handleVerifyPin}
              disabled={loading || pin.length < 4}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#2d5aa0] transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              PIN pruefen
            </button>
          </div>
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
              onClick={handleConfirm}
              className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Eintrag speichern
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== HAUPTSEITE =====
export default function OeffnungSalate() {
  const { selectedMarketId, selectedMarketName, adminSession } = useAppStore();
  const isAdmin = !!adminSession;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [entries, setEntries] = useState<SalateEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const totalDays = daysInMonth(year, month);
  const holidays = useMemo(() => getBavarianHolidays(year), [year]);

  const dateStr = (day: number) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isDayHoliday = (day: number) => holidays.has(dateStr(day));
  const holidayLabel = (day: number) => getHolidayName(dateStr(day), year);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/oeffnung-salate?marketId=${selectedMarketId}&year=${year}&month=${month}`);
      const data = await res.json();
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMarketId, year, month]);

  useEffect(() => { load(); }, [load]);

  const dayEntries = (day: number) => entries.filter(e => e.day === day);

  const handleSave = async (data: { artikelBezeichnung: string; verbrauchsdatum: string; eigenherstellung: boolean; kuerzel: string; userId: number | null }) => {
    if (activeDay === null || !selectedMarketId) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/oeffnung-salate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId,
          year, month,
          day: activeDay,
          ...data,
        }),
      });
      if (res.ok) {
        setActiveDay(null);
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`${BASE}/oeffnung-salate/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const totalEntries = entries.length;
  const todayCount = entries.filter(e => e.day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()).length;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-4 pb-10">

        {/* HEADER */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">3.3 Oeffnung Salate</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  EDEKA Formblatt 3.18 &mdash; Eigenherstellung / Oeffnen von Gastro-Packungen
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <Printer className="w-4 h-4" /> Drucken
            </button>
          </div>

          {/* Monats-Navigation */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/60">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{MONTH_NAMES[month - 1]} {year}</p>
              {selectedMarketName && <p className="text-xs text-muted-foreground">Markt: {selectedMarketName}</p>}
            </div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Statistik */}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {totalEntries} Eintrag{totalEntries !== 1 ? "e" : ""} diesen Monat
            </span>
            {month === now.getMonth() + 1 && year === now.getFullYear() && (
              <span className={`font-bold ${todayCount > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                Heute: {todayCount} Eintrag{todayCount !== 1 ? "e" : ""}
              </span>
            )}
          </div>
        </div>

        {/* TABELLE */}
        {!selectedMarketId ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <p className="text-muted-foreground">Bitte waehlen Sie einen Markt aus.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1a3a6b] text-white">
                    <th className="px-3 py-3 text-left font-semibold text-xs w-20 sticky left-0 bg-[#1a3a6b] z-10">Tag</th>
                    <th className="px-2 py-2 text-center font-semibold text-xs w-10 opacity-70">Wt</th>
                    <th className="px-3 py-3 text-left font-semibold text-xs">Eintraege (Artikel / MHD / Eigenherst. / Kuerzel)</th>
                    <th className="px-3 py-3 text-center font-semibold text-xs w-20">Aktion</th>
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
                    const de = dayEntries(day);
                    const isFuture = !today && !past;

                    return (
                      <tr
                        key={day}
                        className={[
                          "border-t border-border/40 transition-colors align-top",
                          isClosed ? "bg-slate-100/80 opacity-60" : "",
                          !isClosed && today ? "bg-amber-50/70 border-l-4 border-l-amber-500" : "",
                          !isClosed && !today && de.length > 0 ? "bg-green-50/30" : "",
                          isSaturday && !today && !isHoliday ? "bg-slate-50/60" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        {/* Tag-Spalte */}
                        <td className="px-3 py-2.5 sticky left-0 bg-inherit z-10">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-bold tabular-nums ${today ? "text-amber-700" : isClosed ? "text-slate-400" : "text-foreground"}`}>
                              {String(day).padStart(2, "0")}
                            </span>
                            {today && <span className="text-[9px] font-bold bg-amber-500 text-white px-1 rounded-full">HEUTE</span>}
                            {isHoliday && !isSunday && <span className="text-[9px] font-bold bg-amber-400 text-white px-1 rounded-full">FT</span>}
                          </div>
                        </td>

                        {/* Wochentag */}
                        <td className={`px-2 py-2.5 text-center text-xs font-medium ${isClosed ? "text-slate-400" : isSaturday ? "text-blue-500" : "text-muted-foreground"}`}>
                          {wd}
                        </td>

                        {/* Eintraege */}
                        {isClosed ? (
                          <td colSpan={2} className="px-3 py-2.5 text-center text-xs text-slate-400 italic">
                            {isSunday && !isHoliday ? "Geschlossen" : holidayName ?? "Feiertag"}
                          </td>
                        ) : (
                          <>
                            <td className="px-2 py-1.5">
                              <div className="flex flex-wrap gap-1.5 py-1">
                                {de.length === 0 && (
                                  <span className="text-xs text-muted-foreground/40 italic">Kein Eintrag</span>
                                )}
                                {de.map(entry => (
                                  <div key={entry.id} className="relative group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                                    <Package className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span className="font-medium max-w-[140px] truncate" title={entry.artikelBezeichnung}>
                                      {entry.artikelBezeichnung}
                                    </span>
                                    {entry.verbrauchsdatum && (
                                      <span className="text-amber-600 font-mono">
                                        {new Date(entry.verbrauchsdatum + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                                      </span>
                                    )}
                                    <span className={`px-1 rounded text-[10px] font-bold ${entry.eigenherstellung ? "bg-green-200 text-green-800" : "bg-slate-200 text-slate-700"}`}>
                                      {entry.eigenherstellung ? "EH" : "GP"}
                                    </span>
                                    <span className="font-mono font-bold text-amber-700">{entry.kuerzel}</span>
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
                                ))}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              {isFuture ? (
                                <div className="flex justify-center">
                                  <Lock className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                              ) : (
                                <button
                                  onClick={() => setActiveDay(day)}
                                  disabled={saving}
                                  className={[
                                    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all",
                                    today
                                      ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                      : "border-dashed border-amber-200 bg-amber-50/30 text-amber-400 hover:bg-amber-50",
                                  ].join(" ")}
                                >
                                  <Plus className="w-3 h-3" /> Neu
                                </button>
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

        {/* LEGENDE */}
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Legende</p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="px-1 rounded text-[10px] font-bold bg-green-200 text-green-800">EH</span>
              Eigenherstellung
            </span>
            <span className="flex items-center gap-1.5">
              <span className="px-1 rounded text-[10px] font-bold bg-slate-200 text-slate-700">GP</span>
              Gastro-Packung geoeffnet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-amber-700">MHD</span>
              = Verbrauchsdatum / Mindesthaltbarkeitsdatum
            </span>
          </div>
        </div>

        {/* PRINT STYLES */}
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { font-size: 10px; }
          }
        `}</style>
      </div>

      {activeDay !== null && (
        <EintragModal
          day={activeDay}
          year={year}
          month={month}
          onClose={() => setActiveDay(null)}
          onConfirm={handleSave}
        />
      )}
    </AppLayout>
  );
}
