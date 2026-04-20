import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ChevronLeft, ChevronRight, Loader2, Check, X, Lock,
  Thermometer, ClipboardList, Printer, Trash2, AlertTriangle,
} from "lucide-react";
import { getBavarianHolidays, getHolidayName } from "@/utils/holidays";

const BASE = import.meta.env.VITE_API_URL || "/api";

const CRITERIA: { key: string; label: string; note?: string }[] = [
  { key: "hygiene",       label: "Hygiene LKW / Fahrer i.O.",          note: "entfällt bei Nachtanlieferung" },
  { key: "etikettierung", label: "Etikettierung / Verpackung i.O." },
  { key: "qualitaet",     label: "Qualität / Aussehen i.O." },
  { key: "mhd",           label: "MHD / Verbrauchsdatum i.O." },
  { key: "kistenetikett", label: "Kistenetikett vorhanden und i.O.",    note: "Sorte / Herkunft / Klassenangabe" },
  { key: "qsBiosiegel",   label: "Bayerisches Biosiegel geprüft i.O." },
  { key: "qsBy",          label: "Geprüft. Qualität BY i.O." },
  { key: "qsQs",          label: "QS - Qualität u. Sicherheit i.O." },
];

const STATUS_OPTIONS = [
  { value: "io",          label: "i.O.",    color: "bg-green-500 text-white" },
  { value: "abweichung",  label: "A",       color: "bg-red-500 text-white" },
  { value: "entfaellt",   label: "entf.",   color: "bg-gray-200 text-gray-500" },
];

const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate(); }
function getWeekday(year: number, month: number, day: number) { return WOCHENTAGE[new Date(year, month - 1, day).getDay()]; }
function isSunday(year: number, month: number, day: number) { return new Date(year, month - 1, day).getDay() === 0; }
function isFutureDay(year: number, month: number, day: number) {
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return new Date(year, month - 1, day) > n;
}
function isToday(year: number, month: number, day: number) {
  const n = new Date();
  return n.getFullYear() === year && n.getMonth() + 1 === month && n.getDate() === day;
}

type Entry = {
  id: number;
  day: number;
  hygiene: string | null;
  etikettierung: string | null;
  qualitaet: string | null;
  mhd: string | null;
  kistenetikett: string | null;
  qsBiosiegel: string | null;
  qsBy: string | null;
  qsQs: string | null;
  tempCelsius: string | null;
  kuerzel: string;
  notizen: string | null;
};

function StatusBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground/30 text-xs">—</span>;
  const opt = STATUS_OPTIONS.find(o => o.value === value);
  if (!opt) return null;
  if (value === "io") return <span className="inline-flex w-5 h-5 rounded-full bg-green-500 items-center justify-center"><Check className="w-3 h-3 text-white" /></span>;
  if (value === "abweichung") return <span className="inline-flex w-5 h-5 rounded-full bg-red-500 items-center justify-center font-bold text-white text-[10px]">A</span>;
  return <span className="text-xs text-muted-foreground">entf.</span>;
}

// ============================================================
// PIN + ENTRY MODAL
// ============================================================
type EntryForm = {
  hygiene: string; etikettierung: string; qualitaet: string; mhd: string;
  kistenetikett: string; qsBiosiegel: string; qsBy: string; qsQs: string;
  tempCelsius: string; notizen: string;
};

function EntryModal({
  day, year, month, existing, onSave, onDelete, onClose,
}: {
  day: number;
  year: number;
  month: number;
  existing: Entry | null;
  onSave: (form: EntryForm, kuerzel: string, userId: number | null) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"pin" | "form">(existing ? "form" : "pin");
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  const [identified, setIdentified] = useState<{ name: string; userId: number; kuerzel: string } | null>(
    existing ? { name: existing.kuerzel, userId: 0, kuerzel: existing.kuerzel } : null
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<EntryForm>({
    hygiene:       existing?.hygiene       ?? "",
    etikettierung: existing?.etikettierung ?? "",
    qualitaet:     existing?.qualitaet     ?? "",
    mhd:           existing?.mhd           ?? "",
    kistenetikett: existing?.kistenetikett ?? "",
    qsBiosiegel:   existing?.qsBiosiegel   ?? "",
    qsBy:          existing?.qsBy          ?? "",
    qsQs:          existing?.qsQs          ?? "",
    tempCelsius:   existing?.tempCelsius   ?? "",
    notizen:       existing?.notizen       ?? "",
  });

  const weekday = getWeekday(year, month, day);

  const handleVerifyPin = async () => {
    setPinError(""); setPinLoading(true);
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, tenantId: 1 }),
      });
      const data = await res.json();
      if (data.valid) {
        setIdentified({ name: data.userName, userId: data.userId, kuerzel: data.initials });
        setStep("form");
      } else { setPinError("PIN ungültig."); }
    } catch { setPinError("Verbindungsfehler."); }
    finally { setPinLoading(false); }
  };

  const handleSave = async () => {
    if (!identified) return;
    setSaving(true);
    try { await onSave(form, identified.kuerzel, identified.userId); }
    finally { setSaving(false); }
  };

  const set = (key: keyof EntryForm, val: string) => setForm(f => ({ ...f, [key]: val }));

  const tempNum = parseFloat(form.tempCelsius);
  const tempOk = isNaN(tempNum) || tempNum <= 7;

  const hasAbweichung = CRITERIA.some(c => form[c.key as keyof EntryForm] === "abweichung");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">WE Obst und Gemüse</h2>
            <p className="text-xs text-muted-foreground">{weekday}, {day.toString().padStart(2, "0")}.{month.toString().padStart(2, "0")}.{year}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* STEP 1: PIN */}
          {step === "pin" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">PIN eingeben</label>
                <input
                  type="password" inputMode="numeric"
                  className="w-full border border-border rounded-lg px-3 py-3 text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="&#9679;&#9679;&#9679;&#9679;" value={pin} maxLength={6} autoFocus
                  onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={e => e.key === "Enter" && pin.length >= 4 && handleVerifyPin()}
                />
              </div>
              {pinError && <p className="text-xs text-red-500 flex items-center gap-1.5"><X className="w-3 h-3" />{pinError}</p>}
              <button
                onClick={handleVerifyPin} disabled={pinLoading || pin.length < 4}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#2d5aa0] transition-colors"
              >
                {pinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                PIN prüfen
              </button>
            </div>
          )}

          {/* STEP 2: FORM */}
          {step === "form" && identified && (
            <>
              {/* Identified user */}
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-800">{identified.name}</p>
                  <p className="text-xs text-green-600">Kürzel: <span className="font-mono font-bold">{identified.kuerzel}</span></p>
                </div>
              </div>

              {/* Criteria */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prüfkriterien</p>
                {CRITERIA.map(c => (
                  <div key={c.key} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{c.label}</p>
                      {c.note && <p className="text-[10px] text-muted-foreground">{c.note}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => set(c.key as keyof EntryForm, form[c.key as keyof EntryForm] === opt.value ? "" : opt.value)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                            form[c.key as keyof EntryForm] === opt.value
                              ? opt.color + " border-transparent scale-105"
                              : "bg-white border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Temperature */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5" />
                  Temperatur Obst/Gemüse (max. +7 C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" step="0.1"
                    className={`w-28 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 ${
                      !tempOk ? "border-red-400 focus:ring-red-300 bg-red-50" : "border-border focus:ring-primary/30"
                    }`}
                    placeholder="z.B. 4.5"
                    value={form.tempCelsius}
                    onChange={e => set("tempCelsius", e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">°C</span>
                  {!isNaN(tempNum) && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tempOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {tempOk ? "i.O." : "ZU WARM!"}
                    </span>
                  )}
                </div>
              </div>

              {/* Notes (required when deviation) */}
              {hasAbweichung && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Massnahmen / Notizen (bei Abweichung)
                  </label>
                  <textarea
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[72px] resize-none"
                    placeholder="Massnahmen, Termin und Verantwortlicher eintragen..."
                    value={form.notizen}
                    onChange={e => set("notizen", e.target.value)}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {existing && onDelete && !confirmDelete && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Loeschen
                  </button>
                )}
                {confirmDelete && (
                  <button
                    onClick={async () => { setSaving(true); await onDelete!(); setSaving(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5" /> Sicher loeschen</>}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#2d5aa0] transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {existing ? "Aktualisieren" : "Eintrag speichern"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function WEObstGemuese() {
  const { selectedMarketId } = useAppStore();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const holidays = getBavarianHolidays(year); // Set<string>

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/wareneingang-og?marketId=${selectedMarketId}&year=${year}&month=${month}`);
      setEntries(await res.json());
    } finally { setLoading(false); }
  }, [selectedMarketId, year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); };

  const days = daysInMonth(year, month);
  const entryByDay = new Map(entries.map(e => [e.day, e]));

  const activeEntry = activeDay != null ? (entryByDay.get(activeDay) ?? null) : null;

  const handleSave = async (form: EntryForm, kuerzel: string, userId: number | null) => {
    if (!selectedMarketId || activeDay == null) return;
    await fetch(`${BASE}/wareneingang-og`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: selectedMarketId, year, month, day: activeDay, ...form, kuerzel, userId }),
    });
    setActiveDay(null);
    await load();
  };

  const handleDelete = async () => {
    if (!activeEntry) return;
    await fetch(`${BASE}/wareneingang-og/${activeEntry.id}`, { method: "DELETE" });
    setActiveDay(null);
    await load();
  };

  const completedDays = entries.filter(e => {
    const filled = CRITERIA.filter(c => e[c.key as keyof Entry]);
    return filled.length >= CRITERIA.length && e.tempCelsius;
  }).length;

  const totalWorking = Array.from({ length: days }, (_, i) => i + 1).filter(d => {
    const n = new Date(); n.setHours(0, 0, 0, 0);
    const date = new Date(year, month - 1, d);
    return date <= n && !isSunday(year, month, d) && !holidays.has(`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
  }).length;

  const progress = totalWorking > 0 ? Math.round((completedDays / totalWorking) * 100) : 0;

  function dayStatus(e: Entry | undefined): "full" | "partial" | "abweichung" | "none" {
    if (!e) return "none";
    if (CRITERIA.some(c => e[c.key as keyof Entry] === "abweichung")) return "abweichung";
    const filled = CRITERIA.filter(c => e[c.key as keyof Entry]);
    return filled.length >= CRITERIA.length ? "full" : "partial";
  }

  return (
    <AppLayout>
      <div className="space-y-5 pb-10">
        {/* HEADER */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1a3a6b]/10">
              <ClipboardList className="w-6 h-6 text-[#1a3a6b]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">2.5 WE Obst und Gemuese</h1>
              <p className="text-sm text-muted-foreground">Wareneingangskontrolle – {new Date(year, month-1).toLocaleDateString("de-DE", { month:"long", year:"numeric" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-semibold min-w-[110px] text-center">
              {new Date(year, month-1).toLocaleDateString("de-DE", { month:"long" })} {year}
            </span>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => window.print()} className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors">
              <Printer className="w-3.5 h-3.5" /> Drucken
            </button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="bg-white rounded-xl border border-border/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Monatlicher Fortschritt</span>
            <span className="font-bold text-foreground">{completedDays} / {totalWorking} Tage vollstaendig</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: progress >= 100 ? "#22c55e" : progress >= 70 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{progress}%</p>
        </div>

        {/* LEGEND */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Vollstaendig i.O.</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />Unvollstaendig</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Abweichung</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-muted inline-block" />Kein Eintrag</span>
        </div>

        {/* MAIN TABLE */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="bg-white rounded-xl border border-border/60 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#1a3a6b]/5 border-b border-border/60">
                  <th className="px-3 py-2.5 text-left font-semibold text-[#1a3a6b] w-10">Tag</th>
                  <th className="px-2 py-2.5 text-left font-semibold text-[#1a3a6b] w-10">WT</th>
                  {CRITERIA.map(c => (
                    <th key={c.key} className="px-1.5 py-2.5 text-center font-semibold text-[#1a3a6b] min-w-[52px] max-w-[72px] leading-tight">
                      <span className="block truncate" title={c.label}>
                        {c.label.replace("i.O.", "").replace("vorhanden und", "").trim().split(" ").slice(0,2).join(" ")}
                      </span>
                    </th>
                  ))}
                  <th className="px-1.5 py-2.5 text-center font-semibold text-[#1a3a6b]">Temp.</th>
                  <th className="px-2 py-2.5 text-center font-semibold text-[#1a3a6b]">Kuerzel</th>
                  <th className="px-2 py-2.5 text-center font-semibold text-[#1a3a6b] w-16">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: days }, (_, i) => i + 1).map(day => {
                  const wd = getWeekday(year, month, day);
                  const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const isHoliday = holidays.has(dateStr);
                  const closed = isSunday(year, month, day) || isHoliday;
                  const future = isFutureDay(year, month, day);
                  const today = isToday(year, month, day);
                  const e = entryByDay.get(day);
                  const st = dayStatus(e);

                  const rowBg = closed
                    ? "bg-gray-50/80 opacity-60"
                    : today
                    ? "bg-blue-50/40"
                    : "";

                  return (
                    <tr key={day} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${rowBg}`}>
                      <td className="px-3 py-2 font-bold text-foreground">{day}</td>
                      <td className={`px-2 py-2 font-medium ${wd === "So" ? "text-red-500" : "text-muted-foreground"}`}>{wd}</td>

                      {CRITERIA.map(c => (
                        <td key={c.key} className="px-1.5 py-2 text-center">
                          {e ? <StatusBadge value={e[c.key as keyof Entry] as string | null} /> : <span className="text-muted-foreground/20">—</span>}
                        </td>
                      ))}

                      {/* Temperature */}
                      <td className="px-1.5 py-2 text-center">
                        {e?.tempCelsius ? (
                          <span className={`font-mono font-bold text-xs ${parseFloat(e.tempCelsius) > 7 ? "text-red-600" : "text-green-700"}`}>
                            {parseFloat(e.tempCelsius).toFixed(1)}°
                          </span>
                        ) : <span className="text-muted-foreground/20">—</span>}
                      </td>

                      {/* Kürzel */}
                      <td className="px-2 py-2 text-center font-mono text-[11px] font-bold text-muted-foreground">
                        {e?.kuerzel ?? ""}
                      </td>

                      {/* Action */}
                      <td className="px-2 py-2 text-center">
                        {closed ? (
                          <span className="text-[10px] text-muted-foreground/50">{isHoliday ? getHolidayName(dateStr, year)?.slice(0,6) : "So"}</span>
                        ) : future ? (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        ) : (
                          <button
                            onClick={() => setActiveDay(day)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                              st === "full" ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : st === "abweichung" ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : st === "partial" ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-[#1a3a6b]/10 text-[#1a3a6b] hover:bg-[#1a3a6b]/20"
                            }`}
                          >
                            {e ? "Bearbeiten" : "Eintragen"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER NOTE */}
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          Bei festgestellten Abweichungen (A) sind Massnahmen, Termin und Umsetzung mit Unterschrift des
          Verantwortlichen zu dokumentieren. Beachten Sie stets die Temperaturvorgaben des Herstellers.
        </p>
      </div>

      {activeDay !== null && (
        <EntryModal
          day={activeDay}
          year={year}
          month={month}
          existing={activeEntry}
          onSave={handleSave}
          onDelete={activeEntry ? handleDelete : undefined}
          onClose={() => setActiveDay(null)}
        />
      )}
    </AppLayout>
  );
}
