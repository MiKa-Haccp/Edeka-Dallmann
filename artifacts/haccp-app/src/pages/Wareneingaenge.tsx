import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ClipboardList, ChevronLeft, ChevronRight, Loader2, Check, X,
  Lock, Thermometer, AlertTriangle, Trash2, Plus, Settings2,
  ChevronDown, ChevronUp, Printer, Package, Snowflake, PenLine,
  CalendarDays, FileText, Archive, CircleCheck, CircleX,
  CircleMinus, Circle, Info,
} from "lucide-react";
import { getBavarianHolidays, getHolidayName } from "@/utils/holidays";

const BASE = import.meta.env.VITE_API_URL || "/api";
const MARKET_NAMES: Record<number, string> = { 1: "Leeder", 2: "Buching", 3: "MOD" };
const WD_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const WD_FULL  = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONTHS_DE = ["", "Januar","Februar","Maerz","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

// ── KRITERIEN ────────────────────────────────────────────────
type CrType = "check" | "temp";
interface CritDef { key: string; label: string; short: string; type: CrType; note?: string; group: string; maxVal?: number; minVal?: number; }

const ALL_CRIT: CritDef[] = [
  { key:"hygiene",           short:"Hygiene",    label:"Hygiene LKW / Fahrer i.O.",                          type:"check", note:"entfaellt bei Nachtanlieferung", group:"Allgemein" },
  { key:"etikettierung",     short:"Etikett.",   label:"Etikettierung / Verpackung i.O.",                    type:"check", group:"Allgemein" },
  { key:"qualitaet",         short:"Qualitaet",  label:"Qualitaet / Aussehen i.O.",                          type:"check", group:"Allgemein" },
  { key:"mhd",               short:"MHD",        label:"MHD / Verbrauchsdatum i.O.",                         type:"check", group:"Allgemein" },
  { key:"rindfleisch",       short:"Rindfleisch",label:"Rindfleischetikettierung i.O.",                      type:"check", group:"Rindfleisch" },
  { key:"kistenetikett",     short:"Kiste",      label:"Kistenetikett vorhanden i.O.",                       type:"check", group:"Obst & Gemuese" },
  { key:"qs_biosiegel",      short:"Biosiegel",  label:"Bayerisches Biosiegel geprueft i.O.",                type:"check", group:"QS-Systeme" },
  { key:"qs_by",             short:"QS-BY",      label:"Geprueft. Qualitaet BY geprueft i.O.",               type:"check", group:"QS-Systeme" },
  { key:"qs_qs",             short:"QS",         label:"QS - Qualitaet u. Sicherheit i.O.",                  type:"check", group:"QS-Systeme" },
  { key:"bio_zertifikat",    short:"Bio-Zert.",  label:"Bio: Zertifikat Lieferant geprueft",                 type:"check", group:"Bio-Ware" },
  { key:"bio_kennz",         short:"Bio-Kennz.", label:"Bio: Kennzeichnung Ware geprueft",                   type:"check", group:"Bio-Ware" },
  { key:"bio_warenbegleit",  short:"Bio-WB",     label:"Bio: Angaben Warenbegleitpapiere",                   type:"check", group:"Bio-Ware" },
  { key:"bio_geliefert",     short:"Bio-Lief.",  label:"Bio: Gelieferte Ware = bestellte Ware",              type:"check", group:"Bio-Ware" },
  { key:"bio_kennz_stimmt",  short:"Bio-LS",     label:"Bio: Kennzeichnung stimmt mit Lieferschein",         type:"check", group:"Bio-Ware" },
  { key:"bio_vermischung",   short:"Bio-Mix",    label:"Bio: keine Vermischung mit konv. Ware",              type:"check", group:"Bio-Ware" },
  { key:"temp_arznei",         short:"Arznei",     label:"Temp. Arzneimittel (15-25 C)",                        type:"temp", minVal:15, maxVal:25, group:"Temperatur" },
  { key:"temp_kuehl_molkerei", short:"Molkerei",   label:"Temp. Molkerei / Feinkost (max. +7 C)",              type:"temp", maxVal:7,  group:"Temperatur" },
  { key:"temp_kuehl_og",       short:"OG-Temp",    label:"Temp. Gemuese / Obstsalate (max. +7 C)",             type:"temp", maxVal:7,  group:"Temperatur" },
  { key:"temp_tk",             short:"TK",          label:"Temp. Tiefkuehlware (max. -18 C)",                   type:"temp", maxVal:-18, group:"Temperatur" },
  { key:"temp_hackfleisch",    short:"Hackfl.",    label:"Temp. SB-Hackfleisch (max. +2 C)",                   type:"temp", maxVal:2,  group:"Temperatur" },
  { key:"temp_innereien",      short:"Innereien",  label:"Temp. Innereien (max. +3 C)",                        type:"temp", maxVal:3,  group:"Temperatur" },
  { key:"temp_gefluegel",      short:"Gefluegel",  label:"Temp. Gefluegel / Farmwild (max. +4 C)",             type:"temp", maxVal:4,  group:"Temperatur" },
  { key:"temp_fleisch",        short:"Fleisch",    label:"Temp. sonstiges Fleisch (max. +7 C)",                type:"temp", maxVal:7,  group:"Temperatur" },
  { key:"temp_frischfisch",    short:"Frischfisch",label:"Temp. Frischfisch (max. +2 C)",                      type:"temp", maxVal:2,  group:"Temperatur" },
  { key:"temp_fischverarbeit", short:"Fisch-V.",   label:"Temp. verarbeitete Fischerzeugnisse (max. +7 C)",    type:"temp", maxVal:7,  group:"Temperatur" },
  { key:"temp_muscheln",       short:"Muscheln",   label:"Temp. Muscheln lebend (max. +10 C)",                 type:"temp", maxVal:10, group:"Temperatur" },
];
const CRIT_MAP = new Map(ALL_CRIT.map(c => [c.key, c]));
const CRIT_GROUPS = Array.from(new Set(ALL_CRIT.map(c => c.group)));
const STATUS_OPTS = [
  { v:"io",         l:"i.O.",  cls:"bg-green-500 text-white border-green-500" },
  { v:"abweichung", l:"A",     cls:"bg-red-500 text-white border-red-500" },
  { v:"entfaellt",  l:"entf.", cls:"bg-gray-200 text-gray-600 border-gray-300" },
];

// ── INTERFACES ────────────────────────────────────────────────
interface WEType {
  id: number; name: string; beschreibung: string | null;
  wareArt: string; criteriaConfig: Record<string, boolean>; sortOrder: number;
  liefertage: number[];
  liefertageAusnahmen: Record<string, string>;
}
interface WEEntry {
  id: number; day: number;
  criteriaValues: Record<string, string>;
  kuerzel: string; notizen: string | null;
}

// ── HELPERS ───────────────────────────────────────────────────
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getWd(y: number, m: number, d: number) { return WD_SHORT[new Date(y, m-1, d).getDay()]; }
function getWdNum(y: number, m: number, d: number) { return new Date(y, m-1, d).getDay(); }
function isSun(y: number, m: number, d: number) { return new Date(y, m-1, d).getDay() === 0; }
function isFuture(y: number, m: number, d: number) {
  const n = new Date(); n.setHours(0,0,0,0);
  return new Date(y, m-1, d) > n;
}
function isToday(y: number, m: number, d: number) {
  const n = new Date(); return n.getFullYear()===y && n.getMonth()+1===m && n.getDate()===d;
}
function isTempOk(c: CritDef, val: string) {
  const n = parseFloat(val); if (isNaN(n)) return true;
  if (c.minVal !== undefined && n < c.minVal) return false;
  if (c.maxVal !== undefined && n > c.maxVal) return false;
  return true;
}
function getEnabled(t: WEType) { return ALL_CRIT.filter(c => t.criteriaConfig[c.key]); }
function wareIcon(a: string, cls = "w-3 h-3") {
  if (a === "tk") return <Snowflake className={cls} />;
  if (a === "kuehl") return <Thermometer className={cls} />;
  return <Package className={cls} />;
}
function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

type EntryStatus = "full" | "abweichung" | "partial" | "none";
function entryStatus(e: WEEntry | undefined, enabled: CritDef[]): EntryStatus {
  if (!e || Object.keys(e.criteriaValues).length === 0) return "none";
  const v = e.criteriaValues;
  const hasAbw = enabled.some(c => v[c.key] === "abweichung");
  const badTemp = enabled.filter(c => c.type === "temp").some(c => v[c.key] && !isTempOk(c, v[c.key]));
  if (hasAbw || badTemp) return "abweichung";
  const checks = enabled.filter(c => c.type === "check");
  if (checks.some(c => !v[c.key])) return "partial";
  return "full";
}

// Liefertag-Status for a specific day
type Lieferstatus = "erwartet" | "kein_liefertag" | "unbekannt";
function getLieferstatus(type: WEType, y: number, m: number, d: number, holidays: Set<string>): Lieferstatus {
  const ds = dateStr(y, m, d);
  if (type.liefertageAusnahmen?.[ds] === "liefertag") return "erwartet";
  if (type.liefertageAusnahmen?.[ds] === "kein_liefertag") return "kein_liefertag";
  if (isSun(y, m, d) || holidays.has(ds)) return "kein_liefertag";
  if (!type.liefertage || type.liefertage.length === 0) return "unbekannt";
  return type.liefertage.includes(getWdNum(y, m, d)) ? "erwartet" : "kein_liefertag";
}

type TrafficColor = "green" | "yellow" | "red" | "gray" | "future" | "neutral";
function getTrafficColor(
  e: WEEntry | undefined, type: WEType, y: number, m: number, d: number, holidays: Set<string>
): TrafficColor {
  if (isFuture(y, m, d)) return "future";
  const ls = getLieferstatus(type, y, m, d, holidays);
  const enabled = getEnabled(type);
  const st = entryStatus(e, enabled);
  if (ls === "erwartet") {
    if (st === "none") return "red";
    if (st === "abweichung") return "yellow";
    if (st === "partial") return "yellow";
    return "green";
  }
  if (ls === "kein_liefertag") return "gray";
  // unbekannt (no liefertage configured)
  if (st === "none") return "neutral";
  if (st === "abweichung") return "yellow";
  if (st === "full") return "green";
  return "neutral";
}

function TrafficDot({ color, size = "md" }: { color: TrafficColor; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const map: Record<TrafficColor, string> = {
    green:   "bg-green-500",
    yellow:  "bg-amber-400",
    red:     "bg-red-500 animate-pulse",
    gray:    "bg-gray-200",
    future:  "bg-blue-200",
    neutral: "bg-gray-300",
  };
  return <span className={`inline-block rounded-full shrink-0 ${sz} ${map[color]}`} />;
}

// ── PRINT HELPER ──────────────────────────────────────────────
function generatePrintWindow(
  type: WEType, entries: WEEntry[], year: number, month: number,
  marketId: number, holidays: Set<string>
) {
  const marketName = MARKET_NAMES[marketId] ?? `Markt ${marketId}`;
  const enabled = getEnabled(type);
  const checkCrit = enabled.filter(c => c.type === "check");
  const tempCrit  = enabled.filter(c => c.type === "temp");
  const days = daysInMonth(year, month);
  const entryByDay = new Map(entries.map(e => [e.day, e]));

  const rows = Array.from({ length: days }, (_, i) => i + 1).map(day => {
    const ds = dateStr(year, month, day);
    const isHol = holidays.has(ds);
    const wd = WD_SHORT[new Date(year, month-1, day).getDay()];
    const closed = isSun(year, month, day) || isHol;
    const ls = getLieferstatus(type, year, month, day, holidays);
    const e = entryByDay.get(day);
    const v = e?.criteriaValues ?? {};
    const st = entryStatus(e, enabled);

    const ampel = closed ? "#ccc" : ls === "erwartet"
      ? (st === "full" ? "#22c55e" : st === "none" ? "#ef4444" : "#f59e0b")
      : "#e5e7eb";

    const critCells = checkCrit.map(c => {
      const val = v[c.key];
      if (closed || ls === "kein_liefertag") return `<td style="background:#f9fafb;color:#9ca3af;text-align:center;border:1px solid #e5e7eb">–</td>`;
      if (!val) return `<td style="text-align:center;border:1px solid #e5e7eb"></td>`;
      const icon = val === "io" ? "<b style='color:#16a34a'>&#10003;</b>" : val === "abweichung" ? "<b style='color:#dc2626'>A</b>" : "<span style='color:#9ca3af'>–</span>";
      return `<td style="text-align:center;border:1px solid #e5e7eb">${icon}</td>`;
    }).join("");

    const tempCell = tempCrit.map(c => {
      const val = v[c.key];
      if (!val) return `<span style="color:#9ca3af">—</span>`;
      const ok = isTempOk(c, val);
      return `<span style="font-family:monospace;color:${ok?"#16a34a":"#dc2626"}">${parseFloat(val).toFixed(1)}°C</span>`;
    }).join(" | ");

    const rowBg = closed ? "#f9fafb" : ls === "erwartet" && st === "none" && !isFuture(year, month, day) ? "#fef2f2" : "white";

    return `<tr style="background:${rowBg}">
      <td style="border:1px solid #e5e7eb;padding:3px 6px;text-align:center">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${ampel};vertical-align:middle"></span>
      </td>
      <td style="border:1px solid #e5e7eb;padding:3px 6px;font-weight:600;text-align:center">${day}</td>
      <td style="border:1px solid #e5e7eb;padding:3px 6px;text-align:center;color:${wd==='So'?'#ef4444':'#374151'}">${wd}</td>
      ${critCells}
      <td style="border:1px solid #e5e7eb;padding:3px 6px;text-align:center;font-size:11px">${tempCrit.length ? tempCell : "–"}</td>
      <td style="border:1px solid #e5e7eb;padding:3px 6px;text-align:center;font-family:monospace;font-size:11px;font-weight:700">${e?.kuerzel ?? ""}</td>
      <td style="border:1px solid #e5e7eb;padding:3px 6px;font-size:11px;color:#ef4444">${(e?.notizen ?? "")}</td>
    </tr>`;
  }).join("");

  const critHeaders = checkCrit.map(c =>
    `<th style="border:1px solid #e5e7eb;padding:3px 4px;font-size:10px;writing-mode:vertical-lr;transform:rotate(180deg);height:80px;text-align:left">${c.short}</th>`
  ).join("");

  const lieferInfo = type.liefertage.length > 0
    ? `Liefertage: ${type.liefertage.map(d => WD_FULL[d]).join(", ")}`
    : "Liefertage: nicht konfiguriert";

  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<title>HACCP Wareneingang – ${type.name} – ${MONTHS_DE[month]} ${year}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: white; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #1a3a6b; padding-bottom: 10px; }
  .header h1 { font-size: 15px; color: #1a3a6b; font-weight: 800; }
  .header p { font-size: 11px; color: #6b7280; margin-top: 3px; }
  .meta { font-size: 11px; color: #374151; text-align: right; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #1a3a6b; color: white; padding: 4px 6px; border: 1px solid #1a3a6b; font-size: 11px; }
  tr:nth-child(even) td { background-color: #f8fafc; }
  .legend { margin-top: 16px; font-size: 10px; color: #6b7280; display: flex; gap: 20px; flex-wrap: wrap; }
  .footer { margin-top: 24px; display: flex; gap: 40px; }
  .sig { flex: 1; border-top: 1px solid #374151; padding-top: 4px; font-size: 10px; color: #6b7280; }
  @media print { body { padding: 10px; } @page { margin: 1cm; size: A4 landscape; } }
</style></head><body>
<div class="header">
  <div>
    <h1>EDEKA DALLMANN &ndash; Wareneingangs-Kontrollbogen</h1>
    <p>Markt: <b>${marketName}</b> &nbsp;|&nbsp; Lieferant: <b>${type.name}</b> &nbsp;|&nbsp; ${type.wareArt === "tk" ? "Tiefkuehlware" : type.wareArt === "kuehl" ? "Kuehlware" : "Ungekuehlte Ware"}</p>
    <p style="margin-top:4px">${lieferInfo}</p>
  </div>
  <div class="meta">
    <div style="font-size:13px;font-weight:800;color:#1a3a6b">${MONTHS_DE[month]} ${year}</div>
    <div style="margin-top:4px">Erstellt: ${new Date().toLocaleDateString("de-DE")}</div>
  </div>
</div>
<table>
  <thead>
    <tr>
      <th style="width:16px"></th>
      <th>Tag</th>
      <th>WT</th>
      ${critHeaders}
      <th>Temperatur</th>
      <th>Kuerzel</th>
      <th>Massnahmen / Notizen</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="legend">
  <span><b style="color:#22c55e">&#10003;</b> i.O. = in Ordnung</span>
  <span><b style="color:#dc2626">A</b> = Abweichung (Massnahmen erforderlich)</span>
  <span>– = entfaellt / kein Liefertag</span>
  <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#22c55e;vertical-align:middle"></span> vollstaendig</span>
  <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#f59e0b;vertical-align:middle"></span> Abweichung</span>
  <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#ef4444;vertical-align:middle"></span> nicht eingetragen (Liefertag)</span>
</div>
<div class="footer">
  <div class="sig">Datum / Unterschrift verantwortliche Person: _____________________</div>
  <div class="sig">Datum / Unterschrift Kontrollperson: _____________________</div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

// ── PIN STEP ─────────────────────────────────────────────────
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
        onKeyDown={e => e.key === "Enter" && pin.length >= 4 && verify()} />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button onClick={verify} disabled={loading || pin.length < 4}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} PIN pruefen
      </button>
    </div>
  );
}

// ── DAY DETAIL MODAL ──────────────────────────────────────────
function DayDetailModal({
  day, year, month, type, entry, onClose, onEdit
}: {
  day: number; year: number; month: number;
  type: WEType; entry: WEEntry; onClose: () => void; onEdit: () => void;
}) {
  const enabled = getEnabled(type);
  const v = entry.criteriaValues;
  const checkCrit = enabled.filter(c => c.type === "check");
  const tempCrit  = enabled.filter(c => c.type === "temp");
  const wd = getWd(year, month, day);
  const st = entryStatus(entry, enabled);
  const stCls = st==="full"?"text-green-600":st==="abweichung"?"text-red-600":"text-amber-600";
  const stLabel = st==="full"?"Vollstaendig":st==="abweichung"?"Abweichung":st==="partial"?"Teilweise eingetragen":"Kein Eintrag";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border/60 px-5 py-4 rounded-t-2xl flex items-start justify-between">
          <div>
            <p className="font-bold text-base">{wd}, {String(day).padStart(2,"0")}.{String(month).padStart(2,"0")}.{year}</p>
            <p className="text-xs text-muted-foreground">{type.name}</p>
            <p className={`text-xs font-semibold mt-0.5 ${stCls}`}>{stLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Kuerzel */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1a3a6b] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {entry.kuerzel}
            </div>
            <span className="text-sm">Abgezeichnet von: <b>{entry.kuerzel}</b></span>
          </div>

          {/* Check criteria */}
          {checkCrit.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kriterien</p>
              {checkCrit.map(c => {
                const val = v[c.key];
                return (
                  <div key={c.key} className="flex items-center gap-2">
                    {val === "io"         ? <CircleCheck className="w-4 h-4 text-green-500 shrink-0" /> :
                     val === "abweichung" ? <CircleX className="w-4 h-4 text-red-500 shrink-0" /> :
                     val === "entfaellt"  ? <CircleMinus className="w-4 h-4 text-gray-300 shrink-0" /> :
                                           <Circle className="w-4 h-4 text-gray-200 shrink-0" />}
                    <span className={`text-xs ${!val ? "text-muted-foreground/40" : ""}`}>{c.label}</span>
                    <span className={`ml-auto text-[10px] font-bold shrink-0 ${
                      val==="io" ? "text-green-600" : val==="abweichung" ? "text-red-600" : "text-gray-400"
                    }`}>
                      {val === "io" ? "i.O." : val === "abweichung" ? "A" : val === "entfaellt" ? "entf." : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Temperature */}
          {tempCrit.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Temperatur</p>
              {tempCrit.map(c => {
                const val = v[c.key];
                const ok = !val || isTempOk(c, val);
                return (
                  <div key={c.key} className="flex items-center gap-2">
                    <Thermometer className={`w-4 h-4 shrink-0 ${ok ? "text-green-500" : "text-red-500"}`} />
                    <span className="text-xs flex-1">{c.label}</span>
                    <span className={`font-mono font-bold text-sm ${val ? (ok ? "text-green-700" : "text-red-600") : "text-gray-300"}`}>
                      {val ? `${parseFloat(val).toFixed(1)} °C` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notes */}
          {entry.notizen && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Massnahmen / Notizen</p>
              <p className="text-xs text-amber-900">{entry.notizen}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-border/60 px-5 py-3 rounded-b-2xl flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-border text-sm hover:bg-muted">Schliessen</button>
          <button onClick={onEdit} className="flex-1 py-2 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold hover:bg-[#2d5aa0] flex items-center justify-center gap-1.5">
            <PenLine className="w-3.5 h-3.5" /> Bearbeiten
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DAY FORM VIEW (inline) ────────────────────────────────────
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

  useEffect(() => {
    setVals(existingEntry?.criteriaValues ?? {});
    setNotizen(existingEntry?.notizen ?? "");
    if (existingEntry) setIdentified({ name: existingEntry.kuerzel, userId: 0, kuerzel: existingEntry.kuerzel });
    else setIdentified(null);
  }, [existingEntry, type.id, day]);

  const toggle = (k: string, v: string) => setVals(p => ({ ...p, [k]: p[k] === v ? "" : v }));
  const setVal  = (k: string, v: string) => setVals(p => ({ ...p, [k]: v }));
  const hasAbw  = enabled.some(c => vals[c.key] === "abweichung");
  const badTemp = enabled.filter(c => c.type === "temp").some(c => vals[c.key] && !isTempOk(c, vals[c.key]));
  const grouped = CRIT_GROUPS.map(g => ({ group: g, items: enabled.filter(c => c.group === g) })).filter(g => g.items.length > 0);

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

      {!identified ? (
        <div className="bg-white rounded-xl border border-border/60 p-5"><PinStep onDone={setIdentified} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-border/60 p-5 space-y-5">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-800">{identified.name}</p>
              <p className="text-xs text-green-600">Kuerzel: <span className="font-mono font-bold">{identified.kuerzel}</span></p>
            </div>
            {existingEntry && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Bearbeitung</span>}
          </div>

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
                      <div className="flex gap-1 shrink-0">
                        {STATUS_OPTS.map(o => (
                          <button key={o.v} onClick={() => toggle(c.key, o.v)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                              vals[c.key] === o.v ? o.cls + " scale-105" : "bg-white border-border text-muted-foreground hover:border-primary/40"
                            }`}>{o.l}</button>
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
                          onChange={e => setVal(c.key, e.target.value)} />
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

          {(hasAbw || badTemp) && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Massnahmen / Notizen
              </label>
              <textarea className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[72px] resize-none"
                placeholder="Massnahmen, Termin und Verantwortlicher..." value={notizen}
                onChange={e => setNotizen(e.target.value)} />
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border/40">
            <button onClick={onMonthView}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              <CalendarDays className="w-4 h-4" /> Monatsansicht
            </button>
            {existingEntry && onDelete && !confirmDel && (
              <button onClick={() => setConfirmDel(true)}
                className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50">
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
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#2d5aa0]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {existingEntry ? "Aktualisieren" : "Eintrag speichern"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MONTHLY TABLE VIEW ────────────────────────────────────────
function MonthlyTableView({
  type, year, month, entries, loading, onEditDay, onTodayEntry,
}: {
  type: WEType; year: number; month: number;
  entries: WEEntry[]; loading: boolean;
  onEditDay: (day: number) => void;
  onTodayEntry: () => void;
}) {
  const holidays = useMemo(() => getBavarianHolidays(year), [year]);
  const enabled  = useMemo(() => getEnabled(type), [type]);
  const tempCrit = enabled.filter(c => c.type === "temp");
  const days     = daysInMonth(year, month);
  const entryByDay = useMemo(() => new Map(entries.map(e => [e.day, e])), [entries]);
  const [detailDay, setDetailDay] = useState<number | null>(null);

  const todayDay = new Date().getDate();
  const todayMonth = new Date().getMonth() + 1;
  const todayYear  = new Date().getFullYear();
  const isCurrentMonth = year === todayYear && month === todayMonth;

  const deliveryDays = Array.from({ length: days }, (_, i) => i + 1).filter(d => {
    const ls = getLieferstatus(type, year, month, d, holidays);
    const n  = new Date(); n.setHours(0,0,0,0);
    return ls === "erwartet" && new Date(year, month-1, d) <= n;
  });
  const completedDays = deliveryDays.filter(d => {
    const e = entryByDay.get(d);
    return entryStatus(e, enabled) === "full";
  }).length;
  const progress = deliveryDays.length > 0 ? Math.round((completedDays / deliveryDays.length) * 100) : 0;
  const hasLiefertage = type.liefertage && type.liefertage.length > 0;

  const detailEntry = detailDay !== null ? entryByDay.get(detailDay) : null;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-border/60 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs">
            <span className="text-muted-foreground">Liefertage erledigt: </span>
            <span className="font-bold">{completedDays} / {deliveryDays.length} ({progress}%)</span>
            {!hasLiefertage && <span className="ml-2 text-amber-600 text-[10px]">&#x26A0; Liefertage nicht konfiguriert</span>}
          </div>
          {isCurrentMonth && !entryByDay.has(todayDay) &&
            getLieferstatus(type, year, month, todayDay, holidays) === "erwartet" && (
            <button onClick={onTodayEntry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold hover:bg-[#2d5aa0] shrink-0">
              <PenLine className="w-3.5 h-3.5" /> Heute eintragen
            </button>
          )}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: progress >= 100 ? "#22c55e" : progress >= 70 ? "#f59e0b" : "#ef4444" }} />
        </div>
      </div>

      {/* Ampel legend */}
      <div className="flex items-center gap-4 px-1 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><TrafficDot color="green" size="sm" /> Vollstaendig</span>
        <span className="flex items-center gap-1"><TrafficDot color="yellow" size="sm" /> Abweichung</span>
        <span className="flex items-center gap-1"><TrafficDot color="red" size="sm" /> Fehlt (Liefertag)</span>
        <span className="flex items-center gap-1"><TrafficDot color="gray" size="sm" /> Kein Liefertag</span>
        <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Zeile anklicken = Details</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a3a6b]/5 border-b border-border/60">
                <th className="px-2 py-2.5 w-5"></th>
                <th className="px-2 py-2.5 text-left font-semibold text-[#1a3a6b] w-8">Tag</th>
                <th className="px-1 py-2.5 text-left font-semibold text-[#1a3a6b] w-7">WT</th>
                {tempCrit.length > 0 && <th className="px-2 py-2.5 text-center font-semibold text-[#1a3a6b]">Temp.</th>}
                <th className="px-2 py-2.5 text-center font-semibold text-[#1a3a6b]">Kuerz.</th>
                <th className="px-2 py-2.5 text-center font-semibold text-[#1a3a6b] w-16">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: days }, (_, i) => i + 1).map(day => {
                const wd   = getWd(year, month, day);
                const ds   = dateStr(year, month, day);
                const isHol = holidays.has(ds);
                const today = isToday(year, month, day);
                const future = isFuture(year, month, day);
                const ls   = getLieferstatus(type, year, month, day, holidays);
                const e    = entryByDay.get(day);
                const tc   = getTrafficColor(e, type, year, month, day, holidays);
                const v    = e?.criteriaValues ?? {};
                const clickable = !future && e;

                return (
                  <tr key={day}
                    className={`border-b border-border/20 transition-colors ${
                      today ? "bg-blue-50/50" : ls === "kein_liefertag" ? "opacity-50 bg-gray-50/50" : ""
                    } ${clickable ? "cursor-pointer hover:bg-muted/20" : ""}`}
                    onClick={() => clickable && setDetailDay(day)}
                  >
                    <td className="px-2 py-1.5 text-center">
                      <TrafficDot color={tc} />
                    </td>
                    <td className={`px-2 py-1.5 font-bold ${today ? "text-blue-700" : ""}`}>
                      {String(day).padStart(2,"0")}
                    </td>
                    <td className={`px-1 py-1.5 font-medium ${wd === "So" ? "text-red-400" : "text-muted-foreground"}`}>{wd}</td>

                    {tempCrit.length > 0 && (
                      <td className="px-2 py-1.5 text-center">
                        {e ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {tempCrit.map(c => {
                              const val = v[c.key];
                              if (!val) return null;
                              const ok = isTempOk(c, val);
                              return (
                                <span key={c.key} title={c.short}
                                  className={`font-mono font-bold text-[11px] ${ok ? "text-green-700" : "text-red-600"}`}>
                                  {parseFloat(val).toFixed(1)}°
                                </span>
                              );
                            })}
                          </div>
                        ) : <span className="text-muted-foreground/25">—</span>}
                      </td>
                    )}

                    <td className="px-2 py-1.5 text-center font-mono text-[11px] font-bold text-muted-foreground">
                      {e?.kuerzel ?? ""}
                    </td>

                    <td className="px-2 py-1.5 text-center" onClick={ev => ev.stopPropagation()}>
                      {!future && ls !== "kein_liefertag" && (
                        <button onClick={() => onEditDay(day)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                            tc === "green"  ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : tc === "yellow" ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : tc === "red"    ? "bg-red-100 text-red-700 hover:bg-red-200"
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

      {/* Detail modal */}
      {detailDay !== null && detailEntry && (
        <DayDetailModal
          day={detailDay} year={year} month={month} type={type} entry={detailEntry}
          onClose={() => setDetailDay(null)}
          onEdit={() => { onEditDay(detailDay); setDetailDay(null); }}
        />
      )}

      <p className="text-[10px] text-muted-foreground/50 px-1">
        Bei Abweichungen (A) sind Massnahmen, Termin und Umsetzung zu dokumentieren.
      </p>
    </div>
  );
}

// ── ADMIN VIEW ────────────────────────────────────────────────
function AdminView({ marketId, types, onRefresh }: { marketId: number; types: WEType[]; onRefresh: () => void }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWareArt, setNewWareArt] = useState("kuehl");
  const [showAdd, setShowAdd] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveYear, setArchiveYear] = useState(new Date().getFullYear() - 1);

  const savePatch = async (type: WEType, patch: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`${BASE}/wareneingang-types/${type.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: type.name, wareArt: type.wareArt, criteriaConfig: type.criteriaConfig,
        liefertage: type.liefertage, liefertageAusnahmen: type.liefertageAusnahmen, ...patch
      }),
    });
    onRefresh(); setSaving(false);
  };

  const toggleCrit = (type: WEType, key: string) => {
    const c = { ...type.criteriaConfig };
    if (c[key]) delete c[key]; else c[key] = true;
    savePatch(type, { criteriaConfig: c });
  };

  const toggleLiefertag = (type: WEType, wd: number) => {
    const lt = [...(type.liefertage ?? [])];
    const idx = lt.indexOf(wd);
    if (idx > -1) lt.splice(idx, 1); else lt.push(wd);
    lt.sort((a,b)=>a-b);
    savePatch(type, { liefertage: lt });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Diesen Lieferanten loeschen?\nBestehende Eintraege bleiben in der Dokumentation erhalten.")) return;
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
        liefertage: [], liefertageAusnahmen: {},
      }),
    });
    setNewName(""); setShowAdd(false); onRefresh(); setSaving(false);
  };

  const handleArchive = async () => {
    setArchiving(true);
    for (const t of types) {
      await fetch(`${BASE}/wareneingang-archiv`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId, typeId: t.id, year: archiveYear }),
      });
    }
    setArchiving(false);
    alert(`Jahresarchiv ${archiveYear} fuer alle Lieferanten wurde erstellt.`);
  };

  // Ausnahmen helpers
  const addAusnahme = (type: WEType, dateVal: string, val: string) => {
    if (!dateVal) return;
    const aus = { ...(type.liefertageAusnahmen ?? {}), [dateVal]: val };
    savePatch(type, { liefertageAusnahmen: aus });
  };
  const removeAusnahme = (type: WEType, dateVal: string) => {
    const aus = { ...(type.liefertageAusnahmen ?? {}) };
    delete aus[dateVal];
    savePatch(type, { liefertageAusnahmen: aus });
  };

  return (
    <div className="space-y-4">
      {/* Add new */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Lieferanten fuer diesen Markt</p>
          <p className="text-xs text-muted-foreground">Aenderungen gelten nur fuer diesen Markt.</p>
        </div>
        <button onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold hover:bg-[#2d5aa0]">
          <Plus className="w-3.5 h-3.5" /> Neuer Lieferant
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-border/60 p-4 space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Neuen Lieferanten anlegen</p>
          <div className="flex gap-2">
            <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
              placeholder="Name (z.B. Bauer Sepp...)" value={newName}
              onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} />
            <select className="border border-border rounded-lg px-2 py-2 text-sm"
              value={newWareArt} onChange={e => setNewWareArt(e.target.value)}>
              <option value="kuehl">Kuehlware</option>
              <option value="tk">Tiefkuehl</option>
              <option value="ungekuehlt">Ungekuehlt</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted">Abbrechen</button>
            <button onClick={handleAdd} disabled={!newName.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Anlegen
            </button>
          </div>
        </div>
      )}

      {/* Type list */}
      {types.map(type => {
        const expanded = expandedId === type.id;
        const [newAusnahmeDate, setNewAusnahmeDate] = useState("");
        const [newAusnahmeVal, setNewAusnahmeVal] = useState("kein_liefertag");

        return (
          <div key={type.id} className="bg-white rounded-xl border border-border/60 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-muted-foreground">{wareIcon(type.wareArt)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{type.name}</p>
                <p className="text-xs text-muted-foreground">
                  {type.liefertage?.length > 0
                    ? type.liefertage.map(d => WD_SHORT[d]).join(", ")
                    : "Liefertage: nicht konfiguriert"}
                  &nbsp;&middot;&nbsp;
                  {Object.keys(type.criteriaConfig).filter(k => type.criteriaConfig[k]).length} Kriterien
                </p>
              </div>
              <button onClick={() => setExpandedId(expanded ? null : type.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted">
                <Settings2 className="w-3.5 h-3.5" />
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button onClick={() => handleDelete(type.id)}
                className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50" title="Loeschen">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {expanded && (
              <div className="border-t border-border/60 bg-muted/10 p-4 space-y-5">
                {saving && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Speichern...</p>}

                {/* Liefertage */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Liefertage (Wochentage)</p>
                  <div className="flex gap-2 flex-wrap">
                    {[1,2,3,4,5,6].map(wd => (
                      <button key={wd} onClick={() => toggleLiefertag(type, wd)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                          (type.liefertage ?? []).includes(wd)
                            ? "bg-[#1a3a6b] text-white border-[#1a3a6b]"
                            : "bg-white border-border text-muted-foreground hover:border-[#1a3a6b]/40"
                        }`}>
                        {WD_SHORT[wd]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ausnahmen */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ausnahmen (einzelne Tage)</p>
                  {Object.entries(type.liefertageAusnahmen ?? {}).map(([ds, val]) => (
                    <div key={ds} className="flex items-center gap-2 text-xs">
                      <span className="font-mono">{ds.split("-").reverse().join(".")}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        val === "liefertag" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {val === "liefertag" ? "Liefertag (Ausnahme)" : "Kein Liefertag"}
                      </span>
                      <button onClick={() => removeAusnahme(type, ds)} className="ml-auto p-1 rounded hover:bg-red-50 text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 items-center mt-1">
                    <input type="date" className="border border-border rounded-lg px-2 py-1 text-xs focus:outline-none"
                      value={newAusnahmeDate} onChange={e => setNewAusnahmeDate(e.target.value)} />
                    <select className="border border-border rounded-lg px-2 py-1 text-xs"
                      value={newAusnahmeVal} onChange={e => setNewAusnahmeVal(e.target.value)}>
                      <option value="kein_liefertag">Kein Liefertag</option>
                      <option value="liefertag">Liefertag (Ausnahme)</option>
                    </select>
                    <button onClick={() => { addAusnahme(type, newAusnahmeDate, newAusnahmeVal); setNewAusnahmeDate(""); }}
                      disabled={!newAusnahmeDate}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold disabled:opacity-40">
                      <Plus className="w-3 h-3" /> Hinzufuegen
                    </button>
                  </div>
                </div>

                {/* Kriterien */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kriterien</p>
                  {CRIT_GROUPS.map(g => (
                    <div key={g} className="space-y-1.5">
                      <p className="text-[9px] font-semibold text-muted-foreground/70 uppercase">{g}</p>
                      {ALL_CRIT.filter(c => c.group === g).map(c => (
                        <label key={c.key} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => toggleCrit(type, c.key)}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            type.criteriaConfig[c.key] ? "bg-[#1a3a6b] border-[#1a3a6b]" : "border-border bg-white"
                          }`}>
                            {type.criteriaConfig[c.key] && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-xs text-muted-foreground group-hover:text-foreground">{c.label}</span>
                          {c.type === "temp" && <Thermometer className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Jahresarchiv */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 mt-2">
        <div className="flex items-center gap-2">
          <Archive className="w-4 h-4 text-amber-600" />
          <p className="text-sm font-bold text-amber-800">Jahresarchiv</p>
        </div>
        <p className="text-xs text-amber-700">Archiviert alle Eintraege des Jahres als unveraenderliche Kopie fuer spaetere Kontrollen.</p>
        <div className="flex items-center gap-2">
          <select className="border border-amber-300 rounded-lg px-2 py-1.5 text-sm bg-white"
            value={archiveYear} onChange={e => setArchiveYear(Number(e.target.value))}>
            {[-1, -2, -3].map(d => (
              <option key={d} value={new Date().getFullYear() + d}>{new Date().getFullYear() + d}</option>
            ))}
          </select>
          <button onClick={handleArchive} disabled={archiving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold disabled:opacity-50 hover:bg-amber-700">
            {archiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
            Jahresarchiv erstellen
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function Wareneingaenge() {
  const { adminSession, selectedMarketId } = useAppStore();
  const isAdmin = !!adminSession;
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [types, setTypes] = useState<WEType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [activeTypeId, setActiveTypeId] = useState<number | "admin" | null>(null);
  const [entries, setEntries]           = useState<WEEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [viewMode, setViewMode]         = useState<"form" | "month">("form");
  const [selectedDay, setSelectedDay]   = useState<number>(now.getDate());
  const holidays = useMemo(() => getBavarianHolidays(year), [year]);

  const loadTypes = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoadingTypes(true);
    try {
      const res  = await fetch(`${BASE}/wareneingang-types?marketId=${selectedMarketId}`);
      const data: WEType[] = await res.json();
      setTypes(data);
      if (typeof activeTypeId !== "number" || !data.find(t => t.id === activeTypeId)) {
        if (data.length > 0) {
          await activateTypeInternal(data[0], now.getFullYear(), now.getMonth()+1, selectedMarketId);
        }
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

  const activateTypeInternal = async (type: WEType, y: number, m: number, mktId: number) => {
    setActiveTypeId(type.id);
    const today = now.getDate();
    const tm = now.getMonth()+1, ty = now.getFullYear();
    setSelectedDay(today);
    if (y === ty && m === tm) {
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
    await activateTypeInternal(type, year, month, selectedMarketId);
    await loadEntries(type.id, year, month);
  };

  const activeType   = typeof activeTypeId === "number" ? types.find(t => t.id === activeTypeId) : null;
  const entryByDay   = useMemo(() => new Map(entries.map(e => [e.day, e])), [entries]);
  const activeEntry  = activeType ? (entryByDay.get(selectedDay) ?? null) : null;

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

  const prevMonth = () => { if (month===1){setYear(y=>y-1);setMonth(12);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setYear(y=>y+1);setMonth(1);}else setMonth(m=>m+1); };

  return (
    <AppLayout>
      <div className="space-y-4 pb-10">
        {/* Header */}
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
          {viewMode === "month" && activeTypeId !== "admin" && activeType && (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-semibold min-w-[100px] text-center">
                {new Date(year, month-1).toLocaleDateString("de-DE",{month:"long"})} {year}
              </span>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => generatePrintWindow(activeType, entries, year, month, selectedMarketId!, holidays)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted">
                <Printer className="w-3.5 h-3.5" /> PDF / Drucken
              </button>
            </div>
          )}
        </div>

        {/* Tab bar */}
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

            {/* Content */}
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
