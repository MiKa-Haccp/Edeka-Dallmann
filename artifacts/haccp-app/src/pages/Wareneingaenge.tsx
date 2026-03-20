import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ClipboardList, ChevronLeft, ChevronRight, Loader2, Check, X,
  Lock, Thermometer, AlertTriangle, Trash2, Plus, Settings2,
  ChevronDown, ChevronUp, Printer, Package, Snowflake, Flame, RefreshCw,
} from "lucide-react";
import { getBavarianHolidays, getHolidayName } from "@/utils/holidays";

const BASE = import.meta.env.VITE_API_URL || "/api";

// ============================================================
// MASTER CRITERIA LIST
// ============================================================
type CriterionType = "check" | "temp";
interface CriterionDef {
  key: string;
  label: string;
  type: CriterionType;
  note?: string;
  group: string;
  maxVal?: number;
  minVal?: number;
}

const ALL_CRITERIA: CriterionDef[] = [
  { key: "hygiene",          label: "Hygiene LKW / Fahrer i.O.",                   type: "check", note: "entfaellt bei Nachtanlieferung", group: "Allgemein" },
  { key: "etikettierung",    label: "Etikettierung / Verpackung i.O.",              type: "check", group: "Allgemein" },
  { key: "qualitaet",        label: "Qualitaet / Aussehen i.O.",                    type: "check", group: "Allgemein" },
  { key: "mhd",              label: "MHD / Verbrauchsdatum i.O.",                   type: "check", group: "Allgemein" },
  { key: "rindfleisch",      label: "Rindfleischetikettierung i.O.",                type: "check", group: "Rindfleisch" },
  { key: "kistenetikett",    label: "Kistenetikett i.O. (Sorte/Herkunft/Klasse)",   type: "check", group: "Obst & Gemuese" },
  { key: "qs_biosiegel",     label: "Bayerisches Biosiegel geprueft i.O.",           type: "check", group: "QS-Systeme" },
  { key: "qs_by",            label: "Geprueft. Qualitaet BY geprueft i.O.",          type: "check", group: "QS-Systeme" },
  { key: "qs_qs",            label: "QS - Qualitaet u. Sicherheit i.O.",             type: "check", group: "QS-Systeme" },
  { key: "bio_zertifikat",   label: "Bio: Zertifikat Lieferant geprueft",            type: "check", group: "Bio-Ware" },
  { key: "bio_kennz",        label: "Bio: Kennzeichnung Ware geprueft",              type: "check", group: "Bio-Ware" },
  { key: "bio_warenbegleit", label: "Bio: Angaben Warenbegleitpapiere",              type: "check", group: "Bio-Ware" },
  { key: "bio_geliefert",    label: "Bio: Gelieferte Ware = bestellte Ware",         type: "check", group: "Bio-Ware" },
  { key: "bio_kennz_stimmt", label: "Bio: Kennzeichnung stimmt mit Lieferschein",   type: "check", group: "Bio-Ware" },
  { key: "bio_vermischung",  label: "Bio: keine Vermischung mit konv. Ware",         type: "check", group: "Bio-Ware" },
  { key: "temp_arznei",        label: "Temperatur Arzneimittel (15-25 C)",                 type: "temp", minVal: 15, maxVal: 25, group: "Temperatur" },
  { key: "temp_kuehl_molkerei",label: "Temperatur Molkerei / Feinkost / Convenience (max. +7 C)",  type: "temp", maxVal: 7,  group: "Temperatur" },
  { key: "temp_kuehl_og",      label: "Temperatur Gemuese / Obstsalate / Keime (max. +7 C)",       type: "temp", maxVal: 7,  group: "Temperatur" },
  { key: "temp_tk",            label: "Temperatur Tiefkuehlware (max. -18 C)",                      type: "temp", maxVal: -18, group: "Temperatur" },
  { key: "temp_hackfleisch",   label: "Temperatur SB-Hackfleisch (max. +2 C)",                     type: "temp", maxVal: 2,  group: "Temperatur" },
  { key: "temp_innereien",     label: "Temperatur Innereien (max. +3 C)",                           type: "temp", maxVal: 3,  group: "Temperatur" },
  { key: "temp_gefluegel",     label: "Temperatur Gefluegel / Farmwild (max. +4 C)",                type: "temp", maxVal: 4,  group: "Temperatur" },
  { key: "temp_fleisch",       label: "Temperatur sonstiges Fleisch (max. +7 C)",                   type: "temp", maxVal: 7,  group: "Temperatur" },
  { key: "temp_frischfisch",   label: "Temperatur Frischfisch (max. +2 C)",                         type: "temp", maxVal: 2,  group: "Temperatur" },
  { key: "temp_fischverarbeit",label: "Temperatur verarbeitete Fischerzeugnisse (max. +7 C)",       type: "temp", maxVal: 7,  group: "Temperatur" },
  { key: "temp_muscheln",      label: "Temperatur Muscheln lebend (max. +10 C)",                    type: "temp", maxVal: 10, group: "Temperatur" },
];

const CRITERIA_BY_KEY = new Map(ALL_CRITERIA.map(c => [c.key, c]));
const CRITERIA_GROUPS = Array.from(new Set(ALL_CRITERIA.map(c => c.group)));

const STATUS_OPTIONS = [
  { value: "io",         label: "i.O.",   color: "bg-green-500 text-white", border: "border-green-500" },
  { value: "abweichung", label: "A",      color: "bg-red-500 text-white",   border: "border-red-500" },
  { value: "entfaellt",  label: "entf.",  color: "bg-gray-300 text-gray-600", border: "border-gray-300" },
];

// ============================================================
// TYPES
// ============================================================
interface WEType {
  id: number;
  name: string;
  beschreibung: string | null;
  wareArt: string;
  criteriaConfig: Record<string, boolean>;
  sortOrder: number;
}

interface WEEntry {
  id: number;
  day: number;
  criteriaValues: Record<string, string>;
  kuerzel: string;
  notizen: string | null;
}

// ============================================================
// HELPERS
// ============================================================
const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getWd(y: number, m: number, d: number) { return WOCHENTAGE[new Date(y, m - 1, d).getDay()]; }
function isSun(y: number, m: number, d: number) { return new Date(y, m - 1, d).getDay() === 0; }
function isFuture(y: number, m: number, d: number) {
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return new Date(y, m - 1, d) > n;
}
function isToday(y: number, m: number, d: number) {
  const n = new Date();
  return n.getFullYear() === y && n.getMonth() + 1 === m && n.getDate() === d;
}
function isTempOk(c: CriterionDef, val: string): boolean {
  const num = parseFloat(val);
  if (isNaN(num)) return true;
  if (c.minVal !== undefined && num < c.minVal) return false;
  if (c.maxVal !== undefined && num > c.maxVal) return false;
  return true;
}
function wareArtIcon(art: string) {
  if (art === "tk") return <Snowflake className="w-3 h-3" />;
  if (art === "kuehl") return <Thermometer className="w-3 h-3" />;
  return <Package className="w-3 h-3" />;
}
function wareArtLabel(art: string) {
  if (art === "tk") return "Tiefkühlware";
  if (art === "kuehl") return "Kühlware";
  return "Ungekühlt";
}

function getEnabledCriteria(type: WEType): CriterionDef[] {
  return ALL_CRITERIA.filter(c => type.criteriaConfig[c.key]);
}

function entryStatus(entry: WEEntry | undefined, enabledCriteria: CriterionDef[]): "full" | "partial" | "abweichung" | "none" {
  if (!entry) return "none";
  const vals = entry.criteriaValues;
  if (Object.keys(vals).length === 0) return "none";
  const hasAbweichung = enabledCriteria.some(c => vals[c.key] === "abweichung");
  if (hasAbweichung) return "abweichung";
  const hasTemp = enabledCriteria.filter(c => c.type === "temp");
  const tempBad = hasTemp.some(c => {
    const v = vals[c.key];
    return v && !isTempOk(c, v);
  });
  if (tempBad) return "abweichung";
  const checkCriteria = enabledCriteria.filter(c => c.type === "check");
  const filled = checkCriteria.filter(c => vals[c.key]);
  if (filled.length < checkCriteria.length) return "partial";
  return "full";
}

// ============================================================
// PIN MODAL
// ============================================================
function PinStep({
  onIdentified,
  onClose,
  title,
}: {
  onIdentified: (id: { name: string; userId: number; kuerzel: string }) => void;
  onClose: () => void;
  title: string;
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verify = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, tenantId: 1 }),
      });
      const data = await res.json();
      if (data.valid) onIdentified({ name: data.userName, userId: data.userId, kuerzel: data.initials });
      else setError("PIN ungueltig.");
    } catch { setError("Verbindungsfehler."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <input
        type="password" inputMode="numeric"
        className="w-full border border-border rounded-lg px-3 py-3 text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30"
        placeholder="&#9679;&#9679;&#9679;&#9679;" value={pin} maxLength={6} autoFocus
        onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
        onKeyDown={e => e.key === "Enter" && pin.length >= 4 && verify()}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button onClick={verify} disabled={loading || pin.length < 4}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} PIN pruefen
      </button>
    </div>
  );
}

// ============================================================
// ENTRY MODAL
// ============================================================
function EntryModal({
  day, year, month, typeName, enabledCriteria, existing, onSave, onDelete, onClose,
}: {
  day: number; year: number; month: number; typeName: string;
  enabledCriteria: CriterionDef[];
  existing: WEEntry | null;
  onSave: (vals: Record<string, string>, kuerzel: string, userId: number | null, notizen: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"pin" | "form">(existing ? "form" : "pin");
  const [identified, setIdentified] = useState<{ name: string; userId: number; kuerzel: string } | null>(
    existing ? { name: existing.kuerzel, userId: 0, kuerzel: existing.kuerzel } : null
  );
  const [vals, setVals] = useState<Record<string, string>>(existing?.criteriaValues ?? {});
  const [notizen, setNotizen] = useState(existing?.notizen ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const wd = getWd(year, month, day);
  const set = (k: string, v: string) => setVals(prev => ({ ...prev, [k]: v }));
  const toggle = (k: string, v: string) => setVals(prev => ({ ...prev, [k]: prev[k] === v ? "" : v }));
  const hasAbw = enabledCriteria.some(c => vals[c.key] === "abweichung");
  const hasBadTemp = enabledCriteria.filter(c => c.type === "temp").some(c => {
    const v = vals[c.key]; return v && !isTempOk(c, v);
  });

  const grouped = CRITERIA_GROUPS.map(g => ({
    group: g,
    items: enabledCriteria.filter(c => c.group === g),
  })).filter(g => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">{typeName}</h2>
            <p className="text-xs text-muted-foreground">{wd}, {String(day).padStart(2,"0")}.{String(month).padStart(2,"0")}.{year}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          {step === "pin" && (
            <PinStep
              title="PIN eingeben um den Wareneingang abzuzeichnen"
              onIdentified={id => { setIdentified(id); setStep("form"); }}
              onClose={onClose}
            />
          )}
          {step === "form" && identified && (
            <>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-800">{identified.name}</p>
                  <p className="text-xs text-green-600">Kuerzel: <span className="font-mono font-bold">{identified.kuerzel}</span></p>
                </div>
              </div>

              {grouped.map(({ group, items }) => (
                <div key={group} className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/40 pb-1">{group}</p>
                  {items.map(c => (
                    <div key={c.key}>
                      {c.type === "check" ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium leading-snug">{c.label}</p>
                            {c.note && <p className="text-[10px] text-muted-foreground">{c.note}</p>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {STATUS_OPTIONS.map(opt => (
                              <button key={opt.value}
                                onClick={() => toggle(c.key, opt.value)}
                                className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                                  vals[c.key] === opt.value ? opt.color + " " + opt.border + " scale-105" : "bg-white border-border text-muted-foreground hover:border-primary/40"
                                }`}
                              >{opt.label}</button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium leading-snug">{c.label}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number" step="0.1"
                              className={`w-20 border rounded-lg px-2 py-1 text-xs font-mono text-center focus:outline-none focus:ring-2 ${
                                vals[c.key] && !isTempOk(c, vals[c.key])
                                  ? "border-red-400 bg-red-50 focus:ring-red-300"
                                  : "border-border focus:ring-primary/30"
                              }`}
                              placeholder="°C"
                              value={vals[c.key] ?? ""}
                              onChange={e => set(c.key, e.target.value)}
                            />
                            {vals[c.key] && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                isTempOk(c, vals[c.key]) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}>
                                {isTempOk(c, vals[c.key]) ? "i.O." : "!"}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {(hasAbw || hasBadTemp) && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Massnahmen / Notizen (Abweichung)
                  </label>
                  <textarea
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[72px] resize-none"
                    placeholder="Massnahmen, Termin und Verantwortlicher eintragen..."
                    value={notizen}
                    onChange={e => setNotizen(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {existing && onDelete && !confirmDel && (
                  <button onClick={() => setConfirmDel(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" /> Loeschen
                  </button>
                )}
                {confirmDel && (
                  <button onClick={async () => { setSaving(true); await onDelete!(); setSaving(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5" /> Sicher loeschen</>}
                  </button>
                )}
                <button onClick={async () => { setSaving(true); await onSave(vals, identified.kuerzel, identified.userId, notizen); setSaving(false); }}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50">
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
// MONTHLY VIEW (per type)
// ============================================================
function MonthlyView({ type, year, month }: { type: WEType; year: number; month: number }) {
  const { selectedMarketId } = useAppStore();
  const [entries, setEntries] = useState<WEEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const holidays = useMemo(() => getBavarianHolidays(year), [year]);

  const enabledCriteria = useMemo(() => getEnabledCriteria(type), [type]);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/wareneingang-entries?marketId=${selectedMarketId}&typeId=${type.id}&year=${year}&month=${month}`);
      setEntries(await res.json());
    } finally { setLoading(false); }
  }, [selectedMarketId, type.id, year, month]);

  useEffect(() => { load(); }, [load]);

  const entryByDay = useMemo(() => new Map(entries.map(e => [e.day, e])), [entries]);
  const days = daysInMonth(year, month);

  const totalWorking = Array.from({ length: days }, (_, i) => i + 1).filter(d => {
    const n = new Date(); n.setHours(0, 0, 0, 0);
    const date = new Date(year, month - 1, d);
    const ds = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return date <= n && !isSun(year, month, d) && !holidays.has(ds);
  }).length;

  const completedDays = entries.filter(e => entryStatus(e, enabledCriteria) === "full").length;
  const progress = totalWorking > 0 ? Math.round((completedDays / totalWorking) * 100) : 0;

  const activeEntry = activeDay != null ? (entryByDay.get(activeDay) ?? null) : null;

  const handleSave = async (vals: Record<string, string>, kuerzel: string, userId: number | null, notizen: string) => {
    if (!selectedMarketId || activeDay == null) return;
    await fetch(`${BASE}/wareneingang-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: selectedMarketId, typeId: type.id, year, month, day: activeDay, criteriaValues: vals, kuerzel, userId, notizen }),
    });
    setActiveDay(null);
    await load();
  };

  const handleDelete = async () => {
    if (!activeEntry) return;
    await fetch(`${BASE}/wareneingang-entries/${activeEntry.id}`, { method: "DELETE" });
    setActiveDay(null);
    await load();
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-white rounded-xl border border-border/60 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Fortschritt {new Date(year, month-1).toLocaleDateString("de-DE", { month:"long" })} {year}</span>
          <span className="font-bold">{completedDays} / {totalWorking} Tage vollstaendig</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: progress >= 100 ? "#22c55e" : progress >= 70 ? "#f59e0b" : "#ef4444" }} />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a3a6b]/5 border-b border-border/60">
                <th className="px-3 py-2.5 text-left font-semibold text-[#1a3a6b] w-10">Tag</th>
                <th className="px-2 py-2.5 text-left font-semibold text-[#1a3a6b] w-10">WT</th>
                <th className="px-3 py-2.5 text-left font-semibold text-[#1a3a6b]">Status</th>
                <th className="px-2 py-2.5 text-center font-semibold text-[#1a3a6b]">Kuerzel</th>
                <th className="px-2 py-2.5 text-center font-semibold text-[#1a3a6b] w-24">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: days }, (_, i) => i + 1).map(day => {
                const wd = getWd(year, month, day);
                const ds = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const isHoliday = holidays.has(ds);
                const closed = isSun(year, month, day) || isHoliday;
                const future = isFuture(year, month, day);
                const today = isToday(year, month, day);
                const e = entryByDay.get(day);
                const st = entryStatus(e, enabledCriteria);

                return (
                  <tr key={day} className={`border-b border-border/30 transition-colors ${
                    closed ? "bg-gray-50/80 opacity-50" : today ? "bg-blue-50/30" : "hover:bg-muted/10"
                  }`}>
                    <td className={`px-3 py-2 font-bold ${today ? "text-blue-700" : "text-foreground"}`}>{day}</td>
                    <td className={`px-2 py-2 font-medium ${wd === "So" ? "text-red-500" : "text-muted-foreground"}`}>{wd}</td>
                    <td className="px-3 py-2">
                      {closed ? (
                        <span className="text-[10px] text-muted-foreground">{isHoliday ? getHolidayName(ds, year)?.slice(0,16) : "Sonntag"}</span>
                      ) : st === "full" ? (
                        <span className="inline-flex items-center gap-1 text-green-700 font-medium"><Check className="w-3.5 h-3.5" /> Vollstaendig i.O.</span>
                      ) : st === "abweichung" ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> Abweichung</span>
                      ) : st === "partial" ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">Unvollstaendig</span>
                      ) : future ? (
                        <span className="text-muted-foreground/40">—</span>
                      ) : (
                        <span className="text-muted-foreground/50 text-[11px]">Kein Eintrag</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center font-mono text-[11px] font-bold text-muted-foreground">
                      {e?.kuerzel ?? ""}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {!closed && !future && (
                        <button onClick={() => setActiveDay(day)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            st === "full" ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : st === "abweichung" ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : st === "partial" ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-[#1a3a6b]/10 text-[#1a3a6b] hover:bg-[#1a3a6b]/20"
                          }`}>
                          {e ? "Bearb." : "Eintrag"}
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

      {activeDay !== null && (
        <EntryModal
          day={activeDay} year={year} month={month}
          typeName={type.name} enabledCriteria={enabledCriteria}
          existing={activeEntry}
          onSave={handleSave}
          onDelete={activeEntry ? handleDelete : undefined}
          onClose={() => setActiveDay(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// ADMIN VIEW
// ============================================================
function AdminView({ types, onRefresh }: { types: WEType[]; onRefresh: () => void }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWareArt, setNewWareArt] = useState("kuehl");
  const [showAdd, setShowAdd] = useState(false);

  const toggleCriterion = async (type: WEType, key: string) => {
    const updated = { ...type.criteriaConfig, [key]: !type.criteriaConfig[key] };
    if (!updated[key]) delete updated[key];
    setSaving(true);
    await fetch(`${BASE}/wareneingang-types/${type.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: type.name, beschreibung: type.beschreibung, wareArt: type.wareArt, criteriaConfig: updated, sortOrder: type.sortOrder }),
    });
    onRefresh();
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Diesen Wareneingangstyp wirklich loeschen? Bestehende Eintraege bleiben erhalten.")) return;
    await fetch(`${BASE}/wareneingang-types/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await fetch(`${BASE}/wareneingang-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), wareArt: newWareArt, criteriaConfig: { hygiene: true, etikettierung: true, qualitaet: true, mhd: true } }),
    });
    setNewName(""); setShowAdd(false);
    onRefresh();
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Wareneingangstypen verwalten</p>
        <button onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold hover:bg-[#2d5aa0] transition-colors">
          <Plus className="w-3.5 h-3.5" /> Neuer Typ
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-border/60 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Neuen Typ anlegen</p>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Name (z.B. MoPro, TK Edeka...)"
              value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <select
              className="border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={newWareArt} onChange={e => setNewWareArt(e.target.value)}
            >
              <option value="kuehl">Kuehlware</option>
              <option value="tk">Tiefkuehlware</option>
              <option value="ungekuehlt">Ungekuehlt</option>
            </select>
          </div>
          <p className="text-[11px] text-muted-foreground">Standardkritierien: Hygiene, Etikettierung, Qualitaet, MHD. Nach dem Anlegen koennen weitere Kriterien aktiviert werden.</p>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted">Abbrechen</button>
            <button onClick={handleAdd} disabled={!newName.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Anlegen
            </button>
          </div>
        </div>
      )}

      {types.map(type => {
        const expanded = expandedId === type.id;
        const enabledCount = Object.keys(type.criteriaConfig).filter(k => type.criteriaConfig[k]).length;
        return (
          <div key={type.id} className="bg-white rounded-xl border border-border/60 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">{wareArtIcon(type.wareArt)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{type.name}</p>
                <p className="text-xs text-muted-foreground">{wareArtLabel(type.wareArt)} &middot; {enabledCount} Kriterien aktiv</p>
              </div>
              <button onClick={() => setExpandedId(expanded ? null : type.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors">
                <Settings2 className="w-3.5 h-3.5" />
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button onClick={() => handleDelete(type.id)}
                className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {expanded && (
              <div className="border-t border-border/60 bg-muted/20 p-4 space-y-4">
                {saving && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Speichern...</div>}
                {CRITERIA_GROUPS.map(group => (
                  <div key={group} className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{group}</p>
                    {ALL_CRITERIA.filter(c => c.group === group).map(c => (
                      <label key={c.key} className="flex items-center gap-2.5 cursor-pointer group">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          type.criteriaConfig[c.key] ? "bg-[#1a3a6b] border-[#1a3a6b]" : "border-border bg-white"
                        }`} onClick={() => toggleCriterion(type, c.key)}>
                          {type.criteriaConfig[c.key] && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-xs group-hover:text-foreground text-muted-foreground transition-colors">{c.label}</span>
                        {c.type === "temp" && <span className="text-[10px] text-muted-foreground/60">(Temperaturfeld)</span>}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function Wareneingaenge() {
  const { adminSession } = useAppStore();
  const isAdmin = !!adminSession;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [types, setTypes] = useState<WEType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [activeTypeId, setActiveTypeId] = useState<number | "admin">("admin");

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const res = await fetch(`${BASE}/wareneingang-types`);
      const data: WEType[] = await res.json();
      setTypes(data);
      if (activeTypeId === "admin" || (typeof activeTypeId === "number" && !data.find(t => t.id === activeTypeId))) {
        if (data.length > 0) setActiveTypeId(data[0].id);
      }
    } finally { setLoadingTypes(false); }
  }, []);

  useEffect(() => { loadTypes(); }, [loadTypes]);

  const activeType = typeof activeTypeId === "number" ? types.find(t => t.id === activeTypeId) : null;

  const prevMonth = () => { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); };

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
              <h1 className="text-xl font-bold">2.5 Wareneingaenge</h1>
              <p className="text-sm text-muted-foreground">Wareneingangskontrolle – alle Lieferanten</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTypeId !== "admin" && (
              <>
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm font-semibold min-w-[110px] text-center">
                  {new Date(year, month-1).toLocaleDateString("de-DE", { month:"long" })} {year}
                </span>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
                <button onClick={() => window.print()} className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted">
                  <Printer className="w-3.5 h-3.5" /> Drucken
                </button>
              </>
            )}
          </div>
        </div>

        {/* TAB BAR */}
        {loadingTypes ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
              {types.map(type => (
                <button
                  key={type.id}
                  onClick={() => setActiveTypeId(type.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    activeTypeId === type.id
                      ? "bg-[#1a3a6b] text-white shadow-md"
                      : "bg-white border border-border text-muted-foreground hover:border-[#1a3a6b]/40 hover:text-foreground"
                  }`}
                >
                  <span className="opacity-70">{wareArtIcon(type.wareArt)}</span>
                  {type.name}
                </button>
              ))}
              {isAdmin && (
                <button
                  onClick={() => setActiveTypeId("admin")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    activeTypeId === "admin"
                      ? "bg-amber-500 text-white shadow-md"
                      : "bg-white border border-border text-muted-foreground hover:border-amber-400 hover:text-foreground"
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" /> Verwaltung
                </button>
              )}
              <button onClick={loadTypes} className="p-2 rounded-xl bg-white border border-border text-muted-foreground hover:bg-muted transition-colors shrink-0" title="Neu laden">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CONTENT */}
            {activeTypeId === "admin" && isAdmin ? (
              <AdminView types={types} onRefresh={loadTypes} />
            ) : activeType ? (
              <MonthlyView key={`${activeType.id}-${year}-${month}`} type={activeType} year={year} month={month} />
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">Kein Typ ausgewaehlt</div>
            )}
          </>
        )}

        {/* FOOTER */}
        <p className="text-xs text-muted-foreground/60">
          Bei festgestellten Abweichungen (A) sind Massnahmen, Termin und Umsetzung zu dokumentieren.
          Beachten Sie stets die Temperaturvorgaben des Herstellers auf dem Produkt.
        </p>
      </div>
    </AppLayout>
  );
}
