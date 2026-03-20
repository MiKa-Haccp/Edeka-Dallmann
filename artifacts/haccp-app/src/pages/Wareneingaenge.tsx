import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ClipboardList, ChevronLeft, ChevronRight, Loader2, Check, X,
  Lock, Thermometer, AlertTriangle, Trash2, Plus, Settings2,
  ChevronDown, ChevronUp, Printer, Package, Snowflake, LayoutList,
  PenLine, RefreshCw, CalendarDays,
} from "lucide-react";
import { getBavarianHolidays, getHolidayName } from "@/utils/holidays";

const BASE = import.meta.env.VITE_API_URL || "/api";

// ────────────────────────────────────────────────────────────
// MASTER CRITERIA LIST
// ────────────────────────────────────────────────────────────
type CriterionType = "check" | "temp";
interface CriterionDef {
  key: string; label: string; shortLabel: string;
  type: CriterionType; note?: string; group: string;
  maxVal?: number; minVal?: number;
}

const ALL_CRITERIA: CriterionDef[] = [
  { key: "hygiene",           shortLabel: "Hygiene",    label: "Hygiene LKW / Fahrer i.O.",                          type: "check", note: "entfaellt bei Nachtanlieferung", group: "Allgemein" },
  { key: "etikettierung",     shortLabel: "Etikett.",   label: "Etikettierung / Verpackung i.O.",                    type: "check", group: "Allgemein" },
  { key: "qualitaet",         shortLabel: "Qualitaet",  label: "Qualitaet / Aussehen i.O.",                          type: "check", group: "Allgemein" },
  { key: "mhd",               shortLabel: "MHD",        label: "MHD / Verbrauchsdatum i.O.",                         type: "check", group: "Allgemein" },
  { key: "rindfleisch",       shortLabel: "Rindfleisch",label: "Rindfleischetikettierung i.O.",                      type: "check", group: "Rindfleisch" },
  { key: "kistenetikett",     shortLabel: "Kiste",      label: "Kistenetikett vorhanden i.O. (Sorte/Herkunft/Kl.)", type: "check", group: "Obst & Gemuese" },
  { key: "qs_biosiegel",      shortLabel: "Biosiegel",  label: "Bayerisches Biosiegel geprueft i.O.",                type: "check", group: "QS-Systeme" },
  { key: "qs_by",             shortLabel: "QS-BY",      label: "Geprueft. Qualitaet BY geprueft i.O.",               type: "check", group: "QS-Systeme" },
  { key: "qs_qs",             shortLabel: "QS",         label: "QS - Qualitaet u. Sicherheit i.O.",                  type: "check", group: "QS-Systeme" },
  { key: "bio_zertifikat",    shortLabel: "Bio-Zert.",  label: "Bio: Zertifikat Lieferant geprueft",                 type: "check", group: "Bio-Ware" },
  { key: "bio_kennz",         shortLabel: "Bio-Kennz.", label: "Bio: Kennzeichnung Ware geprueft",                   type: "check", group: "Bio-Ware" },
  { key: "bio_warenbegleit",  shortLabel: "Bio-WB",     label: "Bio: Angaben Warenbegleitpapiere",                   type: "check", group: "Bio-Ware" },
  { key: "bio_geliefert",     shortLabel: "Bio-Lief.",  label: "Bio: Gelieferte Ware = bestellte Ware",              type: "check", group: "Bio-Ware" },
  { key: "bio_kennz_stimmt",  shortLabel: "Bio-LS",     label: "Bio: Kennzeichnung stimmt mit Lieferschein",         type: "check", group: "Bio-Ware" },
  { key: "bio_vermischung",   shortLabel: "Bio-Mix",    label: "Bio: keine Vermischung mit konv. Ware",              type: "check", group: "Bio-Ware" },
  { key: "temp_arznei",         shortLabel: "Arznei",     label: "Temp. Arzneimittel (15–25 C)",                       type: "temp", minVal: 15, maxVal: 25, group: "Temperatur" },
  { key: "temp_kuehl_molkerei", shortLabel: "Molkerei",   label: "Temp. Molkerei / Feinkost / Convenience (max. +7 C)",type: "temp", maxVal: 7,  group: "Temperatur" },
  { key: "temp_kuehl_og",       shortLabel: "OG-Temp",    label: "Temp. Gemuese / Obstsalate / Keime (max. +7 C)",     type: "temp", maxVal: 7,  group: "Temperatur" },
  { key: "temp_tk",             shortLabel: "TK",          label: "Temp. Tiefkuehlware (max. -18 C)",                   type: "temp", maxVal: -18, group: "Temperatur" },
  { key: "temp_hackfleisch",    shortLabel: "Hackfl.",    label: "Temp. SB-Hackfleisch (max. +2 C)",                   type: "temp", maxVal: 2,  group: "Temperatur" },
  { key: "temp_innereien",      shortLabel: "Innereien",  label: "Temp. Innereien (max. +3 C)",                        type: "temp", maxVal: 3,  group: "Temperatur" },
  { key: "temp_gefluegel",      shortLabel: "Gefluegel",  label: "Temp. Gefluegel / Farmwild (max. +4 C)",             type: "temp", maxVal: 4,  group: "Temperatur" },
  { key: "temp_fleisch",        shortLabel: "Fleisch",    label: "Temp. sonstiges Fleisch (max. +7 C)",                type: "temp", maxVal: 7,  group: "Temperatur" },
  { key: "temp_frischfisch",    shortLabel: "Frischfisch",label: "Temp. Frischfisch (max. +2 C)",                      type: "temp", maxVal: 2,  group: "Temperatur" },
  { key: "temp_fischverarbeit", shortLabel: "Fisch-V.",   label: "Temp. verarbeitete Fischerzeugnisse (max. +7 C)",    type: "temp", maxVal: 7,  group: "Temperatur" },
  { key: "temp_muscheln",       shortLabel: "Muscheln",   label: "Temp. Muscheln lebend (max. +10 C)",                 type: "temp", maxVal: 10, group: "Temperatur" },
];

const CRITERIA_BY_KEY = new Map(ALL_CRITERIA.map(c => [c.key, c]));
const CRITERIA_GROUPS = Array.from(new Set(ALL_CRITERIA.map(c => c.group)));

const STATUS_OPTS = [
  { value: "io",         label: "i.O.",  cls: "bg-green-500 text-white border-green-500" },
  { value: "abweichung", label: "A",     cls: "bg-red-500 text-white border-red-500" },
  { value: "entfaellt",  label: "entf.", cls: "bg-gray-200 text-gray-600 border-gray-300" },
];

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────
interface WEType {
  id: number; name: string; beschreibung: string | null;
  wareArt: string; criteriaConfig: Record<string, boolean>; sortOrder: number;
}
interface WEEntry {
  id: number; day: number;
  criteriaValues: Record<string, string>;
  kuerzel: string; notizen: string | null;
}

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────
const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getWd(y: number, m: number, d: number) { return WD[new Date(y, m - 1, d).getDay()]; }
function isSun(y: number, m: number, d: number) { return new Date(y, m - 1, d).getDay() === 0; }
function isFuture(y: number, m: number, d: number) {
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return new Date(y, m - 1, d) > n;
}
function isToday(y: number, m: number, d: number) {
  const n = new Date();
  return n.getFullYear() === y && n.getMonth() + 1 === m && n.getDate() === d;
}
function isTempOk(c: CriterionDef, val: string) {
  const n = parseFloat(val); if (isNaN(n)) return true;
  if (c.minVal !== undefined && n < c.minVal) return false;
  if (c.maxVal !== undefined && n > c.maxVal) return false;
  return true;
}
function getEnabled(t: WEType) { return ALL_CRITERIA.filter(c => t.criteriaConfig[c.key]); }
function wareIcon(a: string) {
  if (a === "tk") return <Snowflake className="w-3 h-3" />;
  if (a === "kuehl") return <Thermometer className="w-3 h-3" />;
  return <Package className="w-3 h-3" />;
}

function entryStatus(e: WEEntry | undefined, enabled: CriterionDef[]): "full" | "abweichung" | "partial" | "none" {
  if (!e || Object.keys(e.criteriaValues).length === 0) return "none";
  const v = e.criteriaValues;
  const hasAbw = enabled.some(c => v[c.key] === "abweichung");
  const badTemp = enabled.filter(c => c.type === "temp").some(c => v[c.key] && !isTempOk(c, v[c.key]));
  if (hasAbw || badTemp) return "abweichung";
  const checks = enabled.filter(c => c.type === "check");
  if (checks.some(c => !v[c.key])) return "partial";
  return "full";
}

function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

// ────────────────────────────────────────────────────────────
// PIN STEP (inline)
// ────────────────────────────────────────────────────────────
function PinStep({ onDone }: { onDone: (id: { name: string; userId: number; kuerzel: string }) => void }) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const verify = async () => {
    setError(""); setLoading(true);
    try {
      const r = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, tenantId: 1 }),
      });
      const d = await r.json();
      if (d.valid) onDone({ name: d.userName, userId: d.userId, kuerzel: d.initials });
      else setError("PIN ungueltig.");
    } catch { setError("Verbindungsfehler."); }
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-3 max-w-xs">
      <label className="text-xs font-medium text-muted-foreground block">PIN eingeben um abzuzeichnen</label>
      <input type="password" inputMode="numeric"
        className="w-full border border-border rounded-xl px-3 py-3 text-center text-xl tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-primary/30"
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

// ────────────────────────────────────────────────────────────
// DAY FORM VIEW (inline, full page section)
// ────────────────────────────────────────────────────────────
function DayFormView({
  day, year, month, type, existingEntry, onSaved, onDelete, onMonthView,
}: {
  day: number; year: number; month: number;
  type: WEType; existingEntry: WEEntry | null;
  onSaved: () => void; onDelete?: () => Promise<void>;
  onMonthView: () => void;
}) {
  const { selectedMarketId } = useAppStore();
  const enabled = useMemo(() => getEnabled(type), [type]);
  const [identified, setIdentified] = useState<{ name: string; userId: number; kuerzel: string } | null>(null);
  const [vals, setVals] = useState<Record<string, string>>(existingEntry?.criteriaValues ?? {});
  const [notizen, setNotizen] = useState(existingEntry?.notizen ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  // Reset when entry/type changes
  useEffect(() => {
    setVals(existingEntry?.criteriaValues ?? {});
    setNotizen(existingEntry?.notizen ?? "");
    if (existingEntry) setIdentified({ name: existingEntry.kuerzel, userId: 0, kuerzel: existingEntry.kuerzel });
    else setIdentified(null);
  }, [existingEntry, type.id]);

  const toggle = (k: string, v: string) => setVals(p => ({ ...p, [k]: p[k] === v ? "" : v }));
  const setVal = (k: string, v: string) => setVals(p => ({ ...p, [k]: v }));
  const hasAbw = enabled.some(c => vals[c.key] === "abweichung");
  const hasBadTemp = enabled.filter(c => c.type === "temp").some(c => vals[c.key] && !isTempOk(c, vals[c.key]));

  const grouped = CRITERIA_GROUPS.map(g => ({
    group: g, items: enabled.filter(c => c.group === g),
  })).filter(g => g.items.length > 0);

  const handleSave = async () => {
    if (!identified || !selectedMarketId) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/wareneingang-entries`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId, typeId: type.id, year, month, day,
          criteriaValues: vals, kuerzel: identified.kuerzel, userId: identified.userId, notizen,
        }),
      });
      onSaved();
    } finally { setSaving(false); }
  };

  const wd = getWd(year, month, day);

  return (
    <div className="space-y-5">
      {/* Day header */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-border/60 px-4 py-3">
        <div>
          <p className="text-base font-bold">{wd}, {String(day).padStart(2,"0")}.{String(month).padStart(2,"0")}.{year}</p>
          <p className="text-xs text-muted-foreground">{type.name} &mdash; Wareneingang</p>
        </div>
        <button onClick={onMonthView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" /> Monatsansicht
        </button>
      </div>

      {/* PIN or form */}
      {!identified ? (
        <div className="bg-white rounded-xl border border-border/60 p-5">
          <PinStep onDone={setIdentified} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border/60 p-5 space-y-5">
          {/* Identified */}
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-800">{identified.name}</p>
              <p className="text-xs text-green-600">Kuerzel: <span className="font-mono font-bold">{identified.kuerzel}</span></p>
            </div>
            {existingEntry && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Bearbeitung</span>
            )}
          </div>

          {/* Criteria grouped */}
          {grouped.map(({ group, items }) => (
            <div key={group} className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1">{group}</p>
              {items.map(c => (
                <div key={c.key}>
                  {c.type === "check" ? (
                    <div className="flex items-start gap-2">
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm leading-snug">{c.label}</p>
                        {c.note && <p className="text-[11px] text-muted-foreground">{c.note}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0 pt-0.5">
                        {STATUS_OPTS.map(o => (
                          <button key={o.value} onClick={() => toggle(c.key, o.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                              vals[c.key] === o.value ? o.cls + " scale-105" : "bg-white border-border text-muted-foreground hover:border-primary/40"
                            }`}>
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-sm">{c.label}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input type="number" step="0.1"
                          className={`w-20 border-2 rounded-lg px-2 py-1.5 text-sm font-mono text-center focus:outline-none ${
                            vals[c.key] && !isTempOk(c, vals[c.key])
                              ? "border-red-400 bg-red-50" : "border-border focus:border-primary/50"
                          }`}
                          placeholder="°C" value={vals[c.key] ?? ""}
                          onChange={e => setVal(c.key, e.target.value)}
                        />
                        <span className="text-xs text-muted-foreground">°C</span>
                        {vals[c.key] && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isTempOk(c, vals[c.key]) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>{isTempOk(c, vals[c.key]) ? "i.O." : "!"}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Notes on deviation */}
          {(hasAbw || hasBadTemp) && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Massnahmen / Notizen (Abweichung)
              </label>
              <textarea
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[72px] resize-none"
                placeholder="Massnahmen, Termin und Verantwortlicher..." value={notizen}
                onChange={e => setNotizen(e.target.value)}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-border/40">
            <button onClick={onMonthView}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              <CalendarDays className="w-4 h-4" /> Monatsansicht
            </button>
            {existingEntry && onDelete && !confirmDel && (
              <button onClick={() => setConfirmDel(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {confirmDel && (
              <button onClick={async () => { setSaving(true); await onDelete!(); setSaving(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Sicher loeschen</>}
              </button>
            )}
            <button onClick={handleSave} disabled={saving || !identified}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#2d5aa0] transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {existingEntry ? "Aktualisieren" : "Eintrag speichern"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MONTHLY TABLE VIEW
// ────────────────────────────────────────────────────────────
function MonthlyTableView({
  type, year, month, entries, loading,
  onEditDay, onTodayEntry,
}: {
  type: WEType; year: number; month: number;
  entries: WEEntry[]; loading: boolean;
  onEditDay: (day: number) => void;
  onTodayEntry: () => void;
}) {
  const holidays = useMemo(() => getBavarianHolidays(year), [year]);
  const enabled = useMemo(() => getEnabled(type), [type]);
  const checkCriteria = enabled.filter(c => c.type === "check");
  const tempCriteria = enabled.filter(c => c.type === "temp");
  const days = daysInMonth(year, month);
  const entryByDay = useMemo(() => new Map(entries.map(e => [e.day, e])), [entries]);

  const totalWorking = Array.from({ length: days }, (_, i) => i + 1).filter(d => {
    const n = new Date(); n.setHours(0, 0, 0, 0);
    const ds = dateStr(year, month, d);
    return new Date(year, month - 1, d) <= n && !isSun(year, month, d) && !holidays.has(ds);
  }).length;
  const completedDays = entries.filter(e => entryStatus(e, enabled) === "full").length;
  const progress = totalWorking > 0 ? Math.round((completedDays / totalWorking) * 100) : 0;

  const todayDay = new Date().getDate();
  const todayMonth = new Date().getMonth() + 1;
  const todayYear = new Date().getFullYear();
  const isCurrentMonth = year === todayYear && month === todayMonth;

  return (
    <div className="space-y-4">
      {/* Progress + today button */}
      <div className="bg-white rounded-xl border border-border/60 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between flex-1 text-xs">
            <span className="text-muted-foreground">Fortschritt {new Date(year, month-1).toLocaleDateString("de-DE",{month:"long"})} {year}</span>
            <span className="font-bold">{completedDays} / {totalWorking} Tage vollstaendig ({progress}%)</span>
          </div>
          {isCurrentMonth && !entryByDay.has(todayDay) && !isSun(year, month, todayDay) && !holidays.has(dateStr(year, month, todayDay)) && (
            <button onClick={onTodayEntry}
              className="ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold hover:bg-[#2d5aa0] transition-colors shrink-0">
              <PenLine className="w-3.5 h-3.5" /> Heute eintragen
            </button>
          )}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: progress >= 100 ? "#22c55e" : progress >= 70 ? "#f59e0b" : "#ef4444" }} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-border/60 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a3a6b]/5 border-b border-border/60">
                <th className="px-3 py-2.5 text-left font-semibold text-[#1a3a6b] w-10">Tag</th>
                <th className="px-2 py-2.5 text-left font-semibold text-[#1a3a6b] w-8">WT</th>
                <th className="px-3 py-2.5 text-left font-semibold text-[#1a3a6b]">Kriterien</th>
                {tempCriteria.length > 0 && (
                  <th className="px-2 py-2.5 text-center font-semibold text-[#1a3a6b]">Temp.</th>
                )}
                <th className="px-2 py-2.5 text-center font-semibold text-[#1a3a6b]">Kuerzel</th>
                <th className="px-2 py-2.5 text-center font-semibold text-[#1a3a6b] w-20">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: days }, (_, i) => i + 1).map(day => {
                const wd = getWd(year, month, day);
                const ds = dateStr(year, month, day);
                const isHoliday = holidays.has(ds);
                const closed = isSun(year, month, day) || isHoliday;
                const future = isFuture(year, month, day);
                const today = isToday(year, month, day);
                const e = entryByDay.get(day);
                const st = entryStatus(e, enabled);
                const v = e?.criteriaValues ?? {};

                return (
                  <tr key={day} className={`border-b border-border/30 transition-colors ${
                    closed ? "opacity-40 bg-gray-50" : today ? "bg-blue-50/30" : "hover:bg-muted/10"
                  }`}>
                    <td className={`px-3 py-2 font-bold ${today ? "text-blue-700" : ""}`}>{day}</td>
                    <td className={`px-2 py-2 font-medium ${wd === "So" ? "text-red-500" : "text-muted-foreground"}`}>{wd}</td>

                    {/* Criteria dots */}
                    <td className="px-3 py-2">
                      {closed ? (
                        <span className="text-[10px] text-muted-foreground">{isHoliday ? getHolidayName(ds, year)?.slice(0,18) : "Sonntag"}</span>
                      ) : future ? (
                        <span className="text-muted-foreground/30">—</span>
                      ) : e ? (
                        <div className="flex flex-wrap gap-1">
                          {checkCriteria.map(c => {
                            const val = v[c.key];
                            return (
                              <span key={c.key} title={c.shortLabel}
                                className={`inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold border ${
                                  val === "io" ? "bg-green-500 text-white border-green-500"
                                  : val === "abweichung" ? "bg-red-500 text-white border-red-500"
                                  : val === "entfaellt" ? "bg-gray-100 text-gray-400 border-gray-200"
                                  : "bg-white text-gray-300 border-gray-200"
                                }`}>
                                {val === "io" ? <Check className="w-3 h-3" /> : val === "abweichung" ? "A" : val === "entfaellt" ? "–" : "?"}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/50">Kein Eintrag</span>
                      )}
                    </td>

                    {/* Temperature */}
                    {tempCriteria.length > 0 && (
                      <td className="px-2 py-2 text-center">
                        {e ? (
                          <div className="flex flex-col gap-0.5">
                            {tempCriteria.map(c => {
                              const val = v[c.key];
                              if (!val) return null;
                              const ok = isTempOk(c, val);
                              return (
                                <span key={c.key} title={c.shortLabel}
                                  className={`font-mono font-bold text-[11px] ${ok ? "text-green-700" : "text-red-600"}`}>
                                  {parseFloat(val).toFixed(1)}°
                                </span>
                              );
                            })}
                          </div>
                        ) : <span className="text-muted-foreground/20">—</span>}
                      </td>
                    )}

                    <td className="px-2 py-2 text-center font-mono text-[11px] font-bold text-muted-foreground">
                      {e?.kuerzel ?? ""}
                    </td>

                    <td className="px-2 py-2 text-center">
                      {!closed && !future && (
                        <button onClick={() => onEditDay(day)}
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
      <p className="text-xs text-muted-foreground/60">
        Bei Abweichungen (A) sind Massnahmen, Termin und Umsetzung zu dokumentieren.
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// ADMIN VIEW
// ────────────────────────────────────────────────────────────
function AdminView({ marketId, types, onRefresh }: { marketId: number; types: WEType[]; onRefresh: () => void }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWareArt, setNewWareArt] = useState("kuehl");
  const [showAdd, setShowAdd] = useState(false);

  const save = async (type: WEType, patch: Partial<WEType>) => {
    setSaving(true);
    await fetch(`${BASE}/wareneingang-types/${type.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: type.name, beschreibung: type.beschreibung, wareArt: type.wareArt, criteriaConfig: type.criteriaConfig, sortOrder: type.sortOrder, ...patch }),
    });
    onRefresh(); setSaving(false);
  };

  const toggleCrit = (type: WEType, key: string) => {
    const updated = { ...type.criteriaConfig };
    if (updated[key]) delete updated[key]; else updated[key] = true;
    save(type, { criteriaConfig: updated });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Diesen Lieferanten fuer diesen Markt loeschen?\nBestehende Eintraege bleiben in der Dokumentation erhalten.")) return;
    await fetch(`${BASE}/wareneingang-types/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await fetch(`${BASE}/wareneingang-types`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(), wareArt: newWareArt, marketId,
        criteriaConfig: { hygiene: true, etikettierung: true, qualitaet: true, mhd: true },
      }),
    });
    setNewName(""); setShowAdd(false); onRefresh(); setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Lieferanten fuer diesen Markt</p>
          <p className="text-xs text-muted-foreground">Hinzufuegen, konfigurieren oder entfernen. Aenderungen gelten nur fuer diesen Markt.</p>
        </div>
        <button onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold hover:bg-[#2d5aa0] transition-colors">
          <Plus className="w-3.5 h-3.5" /> Neuer Lieferant
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-border/60 p-4 space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Neuen Lieferanten anlegen</p>
          <div className="flex gap-2">
            <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Name (z.B. Bauer Sepp, Edeka Frozen...)" value={newName}
              onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} />
            <select className="border border-border rounded-lg px-2 py-2 text-sm focus:outline-none"
              value={newWareArt} onChange={e => setNewWareArt(e.target.value)}>
              <option value="kuehl">Kuehlware</option>
              <option value="tk">Tiefkuehl</option>
              <option value="ungekuehlt">Ungekuehlt</option>
            </select>
          </div>
          <p className="text-[11px] text-muted-foreground">Grundkrit.: Hygiene, Etikettierung, Qualitaet, MHD. Weitere danach aktivierbar.</p>
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
        const n = Object.keys(type.criteriaConfig).filter(k => type.criteriaConfig[k]).length;
        return (
          <div key={type.id} className="bg-white rounded-xl border border-border/60 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-muted-foreground">{wareIcon(type.wareArt)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{type.name}</p>
                <p className="text-xs text-muted-foreground">
                  {type.wareArt === "tk" ? "Tiefkuehl" : type.wareArt === "kuehl" ? "Kuehlware" : "Ungekuehlt"}
                  &nbsp;&middot;&nbsp;{n} Kriterien aktiv
                </p>
              </div>
              <button onClick={() => setExpandedId(expanded ? null : type.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors">
                <Settings2 className="w-3.5 h-3.5" />
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button onClick={() => handleDelete(type.id)}
                className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors" title="Lieferanten entfernen">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {expanded && (
              <div className="border-t border-border/60 bg-muted/10 p-4 space-y-4">
                {saving && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Speichern...</p>}
                {CRITERIA_GROUPS.map(g => (
                  <div key={g} className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{g}</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {ALL_CRITERIA.filter(c => c.group === g).map(c => (
                        <label key={c.key} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => toggleCrit(type, c.key)}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                            type.criteriaConfig[c.key] ? "bg-[#1a3a6b] border-[#1a3a6b]" : "border-border bg-white"
                          }`}>
                            {type.criteriaConfig[c.key] && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{c.label}</span>
                          {c.type === "temp" && <Thermometer className="w-3 h-3 text-muted-foreground/50 shrink-0" />}
                        </label>
                      ))}
                    </div>
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

// ────────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────────
export default function Wareneingaenge() {
  const { adminSession, selectedMarketId } = useAppStore();
  const isAdmin = !!adminSession;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [types, setTypes] = useState<WEType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [activeTypeId, setActiveTypeId] = useState<number | "admin" | null>(null);

  // Per-type: all entries for the month
  const [entries, setEntries] = useState<WEEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // View mode per tab
  const [viewMode, setViewMode] = useState<"form" | "month">("form");
  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());

  const loadTypes = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoadingTypes(true);
    try {
      const res = await fetch(`${BASE}/wareneingang-types?marketId=${selectedMarketId}`);
      const data: WEType[] = await res.json();
      setTypes(data);
      if (typeof activeTypeId !== "number" || !data.find(t => t.id === activeTypeId)) {
        if (data.length > 0) activateType(data[0], now.getFullYear(), now.getMonth() + 1, selectedMarketId, data);
      }
    } finally { setLoadingTypes(false); }
  }, [selectedMarketId]);

  useEffect(() => { loadTypes(); }, [loadTypes]);

  const loadEntries = useCallback(async (typeId: number, y: number, m: number) => {
    if (!selectedMarketId) return;
    setLoadingEntries(true);
    try {
      const res = await fetch(`${BASE}/wareneingang-entries?marketId=${selectedMarketId}&typeId=${typeId}&year=${y}&month=${m}`);
      setEntries(await res.json());
    } finally { setLoadingEntries(false); }
  }, [selectedMarketId]);

  useEffect(() => {
    if (typeof activeTypeId === "number") loadEntries(activeTypeId, year, month);
  }, [activeTypeId, year, month, loadEntries]);

  // When activating a type: check if today has an entry → set view mode
  const activateType = async (type: WEType, y: number, m: number, mktId: number, allTypes?: WEType[]) => {
    setActiveTypeId(type.id);
    if (allTypes) setTypes(allTypes);
    const today = now.getDate();
    const todayMonth = now.getMonth() + 1;
    const todayYear = now.getFullYear();
    setSelectedDay(today);
    // Check if current month = today's month
    if (y === todayYear && m === todayMonth) {
      const res = await fetch(`${BASE}/wareneingang-entries/day?marketId=${mktId}&typeId=${type.id}&year=${y}&month=${m}&day=${today}`);
      const entry = await res.json();
      setViewMode(entry ? "month" : "form");
    } else {
      setViewMode("month");
    }
  };

  const handleTabClick = async (type: WEType) => {
    if (!selectedMarketId) return;
    setEntries([]);
    await activateType(type, year, month, selectedMarketId);
    await loadEntries(type.id, year, month);
  };

  const activeType = typeof activeTypeId === "number" ? types.find(t => t.id === activeTypeId) : null;
  const entryByDay = useMemo(() => new Map(entries.map(e => [e.day, e])), [entries]);
  const activeEntry = activeType ? (entryByDay.get(selectedDay) ?? null) : null;
  const enabled = useMemo(() => activeType ? getEnabled(activeType) : [], [activeType]);

  const handleSaved = async () => {
    if (typeof activeTypeId !== "number") return;
    await loadEntries(activeTypeId, year, month);
    setViewMode("month");
  };

  const handleDelete = async () => {
    if (!activeEntry) return;
    await fetch(`${BASE}/wareneingang-entries/${activeEntry.id}`, { method: "DELETE" });
    await loadEntries(activeTypeId as number, year, month);
    setViewMode("month");
  };

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
          {viewMode === "month" && activeTypeId !== "admin" && (
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-semibold min-w-[110px] text-center">
                {new Date(year, month-1).toLocaleDateString("de-DE",{month:"long"})} {year}
              </span>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => window.print()} className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted">
                <Printer className="w-3.5 h-3.5" /> Drucken
              </button>
            </div>
          )}
        </div>

        {/* TAB BAR */}
        {loadingTypes ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {types.map(type => (
                <button key={type.id} onClick={() => handleTabClick(type)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    activeTypeId === type.id
                      ? "bg-[#1a3a6b] text-white shadow-md"
                      : "bg-white border border-border text-muted-foreground hover:border-[#1a3a6b]/40 hover:text-foreground"
                  }`}>
                  <span className="opacity-70">{wareIcon(type.wareArt)}</span>
                  {type.name}
                </button>
              ))}
              {isAdmin && (
                <button onClick={() => setActiveTypeId("admin")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ml-1 ${
                    activeTypeId === "admin"
                      ? "bg-amber-500 text-white shadow-md"
                      : "bg-white border border-dashed border-amber-400 text-amber-600 hover:bg-amber-50"
                  }`}>
                  <Settings2 className="w-3.5 h-3.5" /> Verwaltung
                </button>
              )}
            </div>

            {/* CONTENT */}
            {activeTypeId === "admin" && isAdmin && selectedMarketId ? (
              <AdminView marketId={selectedMarketId} types={types} onRefresh={loadTypes} />
            ) : activeType ? (
              viewMode === "form" ? (
                <DayFormView
                  key={`${activeType.id}-${selectedDay}`}
                  day={selectedDay} year={year} month={month}
                  type={activeType} existingEntry={activeEntry}
                  onSaved={handleSaved}
                  onDelete={activeEntry ? handleDelete : undefined}
                  onMonthView={() => setViewMode("month")}
                />
              ) : (
                <MonthlyTableView
                  type={activeType} year={year} month={month}
                  entries={entries} loading={loadingEntries}
                  onEditDay={day => { setSelectedDay(day); setViewMode("form"); }}
                  onTodayEntry={() => { setSelectedDay(now.getDate()); setViewMode("form"); }}
                />
              )
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">Kein Lieferant ausgewaehlt.</div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
