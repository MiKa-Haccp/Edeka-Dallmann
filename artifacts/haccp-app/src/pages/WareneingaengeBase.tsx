import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ClipboardList, ChevronLeft, ChevronRight, Loader2, Check, X,
  Lock, Thermometer, AlertTriangle, Trash2, Plus, Settings2,
  ChevronDown, ChevronUp, Printer, Package, Snowflake,
  PenLine, CalendarDays, Archive, CircleCheck, CircleX,
  CircleMinus, Circle, Info, TriangleAlert, Fish,
} from "lucide-react";
import { getBavarianHolidays, getHolidayName } from "@/utils/holidays";

const BASE = import.meta.env.VITE_API_URL || "/api";
const MARKET_NAMES: Record<number, string> = { 1: "Leeder", 2: "Buching", 3: "MOD" };
const WD_SHORT = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const WD_FULL  = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
const MONTHS_DE = ["","Januar","Februar","Maerz","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

// ── KRITERIEN ─────────────────────────────────────────────────
type CrType = "check" | "temp" | "fisch_mhd_list" | "nemat_list";
export interface CritDef { key: string; label: string; short: string; type: CrType; note?: string; group: string; maxVal?: number; minVal?: number; options?: string[]; }

// ── FISCH-MHD LISTE ───────────────────────────────────────────
type FischMhdRow = { art: string; mhd: string };
function parseFischMhd(val: string | undefined): FischMhdRow[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}
function FischMhdList({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const rows = parseFischMhd(value);
  const update = (next: FischMhdRow[]) => onChange(JSON.stringify(next));
  const add = () => update([...rows, { art: "", mhd: "" }]);
  const remove = (i: number) => update(rows.filter((_, idx) => idx !== i));
  const set = (i: number, field: keyof FischMhdRow, v: string) => {
    const next = rows.map((r, idx) => idx === i ? { ...r, [field]: v } : r);
    update(next);
  };
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Fischart / Artikel"
            value={row.art}
            onChange={e => set(i, "art", e.target.value)}
            className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <input
            type="date"
            value={row.mhd}
            onChange={e => set(i, "mhd", e.target.value)}
            className="border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 w-36"
          />
          <button onClick={() => remove(i)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-primary font-semibold px-2.5 py-1.5 rounded-lg border border-dashed border-primary/40 hover:bg-primary/5 transition-colors">
        <Plus className="w-3 h-3" /> Fisch hinzufuegen
      </button>
    </div>
  );
}

// ── NEMATODEN-KONTROLLE LISTE ──────────────────────────────────
type NematRow = { art: string; custom?: string };
function parseNemat(val: string | undefined): NematRow[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}
const NEMAT_OPTIONS = [
  "Rotbarschfilet","Seelachsfilet","Kabeljaufilet","Steinbuttfilet",
  "Schellfischfilet","Schwarzes Heilbuttfilet","Lachsfilet","Schollenfilet",
  "Sonstiges (freitext)",
];
function NematList({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const rows = parseNemat(value);
  const update = (next: NematRow[]) => onChange(JSON.stringify(next));
  const add = () => update([...rows, { art: "", custom: "" }]);
  const remove = (i: number) => update(rows.filter((_, idx) => idx !== i));
  const set = (i: number, field: keyof NematRow, v: string) => {
    const next = rows.map((r, idx) => idx === i ? { ...r, [field]: v } : r);
    update(next);
  };
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex gap-2 items-center">
            <select
              value={row.art}
              onChange={e => set(i, "art", e.target.value)}
              className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
            >
              <option value="">-- Fischart waehlen --</option>
              {NEMAT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <button onClick={() => remove(i)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {row.art === "Sonstiges (freitext)" && (
            <input
              type="text"
              placeholder="Fischart eingeben..."
              value={row.custom ?? ""}
              onChange={e => set(i, "custom", e.target.value)}
              className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 ml-0"
            />
          )}
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold px-2.5 py-1.5 rounded-lg border border-dashed border-blue-300 hover:bg-blue-50 transition-colors">
        <Plus className="w-3 h-3" /> Nematodenkontrolle hinzufuegen
      </button>
    </div>
  );
}

// ── SECTION CONFIG VIA CONTEXT ─────────────────────────────────
export interface WEBaseConfig {
  section: string;
  pageTitle: string;
  pageSubtitle: string;
  allCrit: CritDef[];
  updateEvent: string;
}

const WEConfigContext = createContext<WEBaseConfig>(null!);
const useWEConfig = () => useContext(WEConfigContext);

// ── TYPES ─────────────────────────────────────────────────────
interface WEType { id:number; name:string; beschreibung:string|null; wareArt:string; criteriaConfig:Record<string,boolean>; sortOrder:number; liefertage:number[]; liefertageAusnahmen:Record<string,string>; section:string; }
interface WEEntry { id:number; day:number; criteriaValues:Record<string,string>; kuerzel:string; notizen:string|null; }

// ── HELPERS ───────────────────────────────────────────────────
function daysInMonth(y:number,m:number){return new Date(y,m,0).getDate();}
function getWd(y:number,m:number,d:number){return WD_SHORT[new Date(y,m-1,d).getDay()];}
function getWdNum(y:number,m:number,d:number){return new Date(y,m-1,d).getDay();}
function isSun(y:number,m:number,d:number){return new Date(y,m-1,d).getDay()===0;}
function isFuture(y:number,m:number,d:number){const n=new Date();n.setHours(0,0,0,0);return new Date(y,m-1,d)>n;}
function isToday(y:number,m:number,d:number){const n=new Date();return n.getFullYear()===y&&n.getMonth()+1===m&&n.getDate()===d;}
function isTempOk(c:CritDef,val:string){const n=parseFloat(val);if(isNaN(n))return true;if(c.minVal!==undefined&&n<c.minVal)return false;if(c.maxVal!==undefined&&n>c.maxVal)return false;return true;}
function getEnabled(t:WEType,allCrit:CritDef[]){return allCrit.filter(c=>t.criteriaConfig[c.key]);}
function wareIcon(a:string,cls="w-3 h-3"){
  if(a==="tk")return<Snowflake className={cls}/>;
  if(a==="kuehl")return<Thermometer className={cls}/>;
  if(a==="fisch"||a==="msc_fisch")return<Fish className={cls}/>;
  return<Package className={cls}/>;
}
function dateStr(y:number,m:number,d:number){return`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}

function buildDefaultVals(type:WEType,allCrit:CritDef[]):Record<string,string>{
  const v:Record<string,string>={};
  getEnabled(type,allCrit).forEach(c=>{if(c.type==="check")v[c.key]="io";});
  return v;
}

const STATUS_OPTS = [
  { v:"io",         l:"i.O.",  cls:"bg-green-500 text-white border-green-500" },
  { v:"abweichung", l:"A",     cls:"bg-red-500 text-white border-red-500" },
  { v:"entfaellt",  l:"entf.", cls:"bg-gray-200 text-gray-600 border-gray-300" },
];

type EntryStatus="full"|"abweichung"|"partial"|"none"|"ausgefallen";
function entryStatus(e:WEEntry|undefined,enabled:CritDef[]):EntryStatus{
  if(!e||Object.keys(e.criteriaValues).length===0)return"none";
  const v=e.criteriaValues;
  if(v._ausgefallen==="ja")return"ausgefallen";
  const badTemp=enabled.filter(c=>c.type==="temp").some(c=>v[c.key]&&!isTempOk(c,v[c.key]));
  const hasAbw=enabled.some(c=>v[c.key]==="abweichung");
  if(hasAbw||badTemp)return"abweichung";
  const checks=enabled.filter(c=>c.type==="check");
  if(checks.some(c=>!v[c.key]))return"partial";
  return"full";
}

type Lieferstatus="erwartet"|"kein_liefertag"|"unbekannt";
function getLieferstatus(type:WEType,y:number,m:number,d:number,holidays:Set<string>):Lieferstatus{
  const ds=dateStr(y,m,d);
  if(type.liefertageAusnahmen?.[ds]==="liefertag")return"erwartet";
  if(type.liefertageAusnahmen?.[ds]==="kein_liefertag")return"kein_liefertag";
  if(isSun(y,m,d)||holidays.has(ds))return"kein_liefertag";
  if(!type.liefertage||type.liefertage.length===0)return"unbekannt";
  return type.liefertage.includes(getWdNum(y,m,d))?"erwartet":"kein_liefertag";
}

type TrafficColor="green"|"yellow"|"red"|"gray"|"future"|"neutral";
function getTrafficColor(e:WEEntry|undefined,type:WEType,y:number,m:number,d:number,holidays:Set<string>,allCrit:CritDef[]):TrafficColor{
  if(isFuture(y,m,d))return"future";
  const enabled=getEnabled(type,allCrit);
  const st=entryStatus(e,enabled);
  if(st==="ausgefallen")return"green";
  const ls=getLieferstatus(type,y,m,d,holidays);
  if(ls==="erwartet"){if(st==="none")return"red";if(st==="abweichung"||st==="partial")return"yellow";return"green";}
  if(ls==="kein_liefertag")return"gray";
  if(st==="none")return"neutral";if(st==="abweichung")return"yellow";if(st==="full")return"green";return"neutral";
}

const TC_STRIPE:Record<TrafficColor,string>={
  green:"bg-green-500",yellow:"bg-amber-400",red:"bg-red-500",
  gray:"bg-gray-200",future:"bg-blue-200",neutral:"bg-gray-300",
};
const TC_BG:Record<TrafficColor,string>={
  green:"bg-green-50 border-green-100",yellow:"bg-amber-50 border-amber-100",
  red:"bg-red-50 border-red-100",gray:"bg-gray-50 border-gray-100",
  future:"bg-blue-50/30 border-blue-100/30",neutral:"bg-white border-border/40",
};

// ── PRINT ─────────────────────────────────────────────────────
function generatePrintWindow(type:WEType,entries:WEEntry[],year:number,month:number,marketId:number,holidays:Set<string>,allCrit:CritDef[]){
  const marketName=MARKET_NAMES[marketId]??`Markt ${marketId}`;
  const enabled=getEnabled(type,allCrit);
  const checkCrit=enabled.filter(c=>c.type==="check");
  const tempCrit=enabled.filter(c=>c.type==="temp");
  const days=daysInMonth(year,month);
  const byDay=new Map(entries.map(e=>[e.day,e]));
  const lieferInfo=type.liefertage.length>0?`Liefertage: ${type.liefertage.map(d=>WD_FULL[d]).join(", ")}`:"Liefertage: nicht konfiguriert";
  const rows=Array.from({length:days},(_,i)=>i+1).map(day=>{
    const ds=dateStr(year,month,day);const isHol=holidays.has(ds);
    const wd=WD_SHORT[new Date(year,month-1,day).getDay()];
    const closed=isSun(year,month,day)||isHol;
    const ls=getLieferstatus(type,year,month,day,holidays);
    const e=byDay.get(day);const v=e?.criteriaValues??{};const st=entryStatus(e,enabled);
    const ampel=closed?"#d1d5db":ls==="erwartet"?(st==="full"?"#22c55e":st==="none"?"#ef4444":"#f59e0b"):"#e5e7eb";
    const critCells=checkCrit.map(c=>{const val=v[c.key];if(closed||ls==="kein_liefertag")return`<td style="background:#f9fafb;color:#9ca3af;text-align:center;border:1px solid #e5e7eb">-</td>`;if(!val)return`<td style="text-align:center;border:1px solid #e5e7eb"></td>`;const icon=val==="io"?"<b style='color:#16a34a'>&#10003;</b>":val==="abweichung"?"<b style='color:#dc2626'>A</b>":"<span style='color:#9ca3af'>-</span>";return`<td style="text-align:center;border:1px solid #e5e7eb">${icon}</td>`;}).join("");
    const tempCell=tempCrit.map(c=>{const val=v[c.key];if(!val)return`<span style="color:#9ca3af">-</span>`;const ok=isTempOk(c,val);return`<span style="font-family:monospace;color:${ok?"#16a34a":"#dc2626"}">${parseFloat(val).toFixed(1)}C</span>`;}).join(" | ");
    const rowBg=closed?"#f9fafb":ls==="erwartet"&&st==="none"&&!isFuture(year,month,day)?"#fef2f2":"white";
    return`<tr style="background:${rowBg}"><td style="border:1px solid #e5e7eb;padding:3px 6px;text-align:center"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${ampel};vertical-align:middle"></span></td><td style="border:1px solid #e5e7eb;padding:3px 6px;font-weight:600;text-align:center">${day}</td><td style="border:1px solid #e5e7eb;padding:3px 6px;text-align:center;color:${wd==="So"?"#ef4444":"#374151"}">${wd}</td>${critCells}<td style="border:1px solid #e5e7eb;padding:3px 6px;text-align:center;font-size:11px">${tempCrit.length?tempCell:"-"}</td><td style="border:1px solid #e5e7eb;padding:3px 6px;text-align:center;font-family:monospace;font-size:11px;font-weight:700">${e?.kuerzel??""}</td><td style="border:1px solid #e5e7eb;padding:3px 6px;font-size:11px;color:#ef4444">${e?.notizen??""}</td></tr>`;
  }).join("");
  const critHeaders=checkCrit.map(c=>`<th style="border:1px solid #e5e7eb;padding:3px 4px;font-size:10px;writing-mode:vertical-lr;transform:rotate(180deg);height:80px;text-align:left">${c.short}</th>`).join("");
  const html=`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>HACCP Wareneingang</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:20px}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:2px solid #1a3a6b;padding-bottom:10px}.header h1{font-size:15px;color:#1a3a6b;font-weight:800}.meta{font-size:11px;text-align:right}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#1a3a6b;color:white;padding:4px 6px;border:1px solid #1a3a6b;font-size:11px}tr:nth-child(even) td{background:#f8fafc}.legend{margin-top:16px;font-size:10px;color:#6b7280;display:flex;gap:20px;flex-wrap:wrap}.footer{margin-top:24px;display:flex;gap:40px}.sig{flex:1;border-top:1px solid #374151;padding-top:4px;font-size:10px;color:#6b7280}@media print{body{padding:10px}@page{margin:1cm;size:A4 landscape}}</style></head><body><div class="header"><div><h1>EDEKA DALLMANN - Wareneingangs-Kontrollbogen</h1><p>Markt: <b>${marketName}</b> | Lieferant: <b>${type.name}</b></p><p style="margin-top:4px">${lieferInfo}</p></div><div class="meta"><div style="font-size:13px;font-weight:800;color:#1a3a6b">${MONTHS_DE[month]} ${year}</div><div style="margin-top:4px">Erstellt: ${new Date().toLocaleDateString("de-DE")}</div></div></div><table><thead><tr><th style="width:16px"></th><th>Tag</th><th>WT</th>${critHeaders}<th>Temperatur</th><th>Kuerzel</th><th>Massnahmen/Notizen</th></tr></thead><tbody>${rows}</tbody></table><div class="legend"><span><b style="color:#22c55e">&#10003;</b> i.O. = in Ordnung</span><span><b style="color:#dc2626">A</b> = Abweichung</span><span>- = entfaellt / kein Liefertag</span></div><div class="footer"><div class="sig">Datum / Unterschrift verantwortliche Person: _____________________</div><div class="sig">Datum / Unterschrift Kontrollperson: _____________________</div></div><script>window.onload=function(){window.print()}<\/script></body></html>`;
  const win=window.open("","_blank");if(win){win.document.write(html);win.document.close();}
}

// ── PIN MODAL ─────────────────────────────────────────────────
function PinModal({ onConfirm, onCancel }: { onConfirm:(id:{name:string;userId:number;kuerzel:string})=>void; onCancel:()=>void; }) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const verify = async () => {
    setError(""); setLoading(true);
    try {
      const r = await fetch(`${BASE}/users/verify-pin`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({pin,tenantId:1}) });
      const d = await r.json();
      if (d.valid) onConfirm({ name:d.userName, userId:d.userId, kuerzel:d.initials });
      else setError("PIN ungueltig.");
    } catch { setError("Verbindungsfehler."); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[#1a3a6b]/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-[#1a3a6b]" />
          </div>
          <p className="font-bold text-base">PIN bestaetigen</p>
          <p className="text-xs text-muted-foreground mt-1">Bitte PIN eingeben um den Eintrag zu speichern</p>
        </div>
        <input type="password" inputMode="numeric"
          className="w-full border-2 border-border rounded-xl px-3 py-3 text-center text-2xl tracking-[0.8em] focus:outline-none focus:border-[#1a3a6b]/50"
          placeholder="&#9679;&#9679;&#9679;&#9679;" value={pin} maxLength={6} autoFocus
          onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={e => e.key==="Enter" && pin.length>=4 && verify()} />
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-muted">Abbrechen</button>
          <button onClick={verify} disabled={loading||pin.length<4}
            className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>} Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DAY DETAIL MODAL ──────────────────────────────────────────
function DayDetailModal({ day, year, month, type, entry, onClose, onEdit }: {
  day:number; year:number; month:number; type:WEType; entry:WEEntry; onClose:()=>void; onEdit:()=>void;
}) {
  const { allCrit } = useWEConfig();
  const enabled=getEnabled(type,allCrit);
  const v=entry.criteriaValues;
  const checkCrit=enabled.filter(c=>c.type==="check");
  const tempCrit=enabled.filter(c=>c.type==="temp");
  const st=entryStatus(entry,enabled);
  const wd=getWd(year,month,day);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border/60 px-5 py-4 rounded-t-2xl flex items-start justify-between">
          <div>
            <p className="font-bold text-base">{wd}, {String(day).padStart(2,"0")}.{String(month).padStart(2,"0")}.{year}</p>
            <p className="text-xs text-muted-foreground">{type.name}</p>
            <span className={`text-xs font-semibold mt-0.5 inline-block ${st==="full"?"text-green-600":st==="ausgefallen"?"text-gray-500":st==="abweichung"?"text-red-600":"text-amber-600"}`}>
              {st==="full"?"Vollstaendig":st==="ausgefallen"?"Lieferung ausgefallen":st==="abweichung"?"Abweichung":st==="partial"?"Teilweise":"Kein Eintrag"}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-[#1a3a6b] flex items-center justify-center text-white text-xs font-bold shrink-0">{entry.kuerzel}</div>
            Abgezeichnet von: <b>{entry.kuerzel}</b>
          </div>
          {checkCrit.length>0&&(
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kriterien</p>
              {checkCrit.map(c=>{const val=v[c.key];return(
                <div key={c.key} className="flex items-center gap-2">
                  {val==="io"?<CircleCheck className="w-4 h-4 text-green-500 shrink-0"/>:val==="abweichung"?<CircleX className="w-4 h-4 text-red-500 shrink-0"/>:val==="entfaellt"?<CircleMinus className="w-4 h-4 text-gray-300 shrink-0"/>:<Circle className="w-4 h-4 text-gray-200 shrink-0"/>}
                  <span className={`text-xs flex-1 ${!val?"text-muted-foreground/40":""}`}>{c.label}</span>
                  <span className={`text-[10px] font-bold shrink-0 ${val==="io"?"text-green-600":val==="abweichung"?"text-red-600":"text-gray-400"}`}>
                    {val==="io"?"i.O.":val==="abweichung"?"A":val==="entfaellt"?"entf.":"--"}
                  </span>
                </div>
              );})}
            </div>
          )}
          {tempCrit.length>0&&(
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Temperatur</p>
              {tempCrit.map(c=>{const val=v[c.key];const ok=!val||isTempOk(c,val);return(
                <div key={c.key} className="flex items-center gap-2">
                  <Thermometer className={`w-4 h-4 shrink-0 ${ok?"text-green-500":"text-red-500"}`}/>
                  <span className="text-xs flex-1">{c.label}</span>
                  <span className={`font-mono font-bold text-sm ${val?(ok?"text-green-700":"text-red-600"):"text-gray-300"}`}>
                    {val?`${parseFloat(val).toFixed(1)} C`:"--"}
                  </span>
                </div>
              );})}
            </div>
          )}
          {enabled.filter(c=>c.type==="fisch_mhd_list").map(c=>{
            const rows=parseFischMhd(v[c.key]);
            if(rows.length===0)return null;
            return(
              <div key={c.key} className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Fish className="w-3 h-3"/>Fisch / MHD</p>
                {rows.map((r,i)=>(
                  <div key={i} className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                    <Fish className="w-3 h-3 text-blue-400 shrink-0"/>
                    <span className="flex-1 font-medium">{r.art||"(kein Name)"}</span>
                    {r.mhd&&<span className="font-mono text-blue-700 shrink-0">MHD: {new Date(r.mhd+"T00:00:00").toLocaleDateString("de-DE")}</span>}
                  </div>
                ))}
              </div>
            );
          })}
          {enabled.filter(c=>c.type==="nemat_list").map(c=>{
            const rows=parseNemat(v[c.key]);
            if(rows.length===0)return null;
            return(
              <div key={c.key} className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nematodenkontrolle</p>
                {rows.map((r,i)=>(
                  <div key={i} className="flex items-center gap-2 text-xs bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                    <CircleCheck className="w-3 h-3 text-purple-400 shrink-0"/>
                    <span className="font-medium">{r.art==="Sonstiges (freitext)"?(r.custom||"Sonstiges"):r.art}</span>
                  </div>
                ))}
              </div>
            );
          })}
          {v._ausgefallen==="ja"&&(
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 flex items-center gap-2">
              <CircleMinus className="w-4 h-4 text-gray-500 shrink-0"/>
              <p className="text-sm font-semibold text-gray-700">Lieferung ausgefallen / verschoben</p>
            </div>
          )}
          {entry.notizen&&(
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Massnahmen / Notizen</p>
              <p className="text-xs text-amber-900">{entry.notizen}</p>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-border/60 px-5 py-3 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-border text-sm hover:bg-muted">Schliessen</button>
          <button onClick={onEdit} className="flex-1 py-2 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold flex items-center justify-center gap-1.5">
            <PenLine className="w-3.5 h-3.5"/> Bearbeiten
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DAY FORM VIEW ─────────────────────────────────────────────
function DayFormView({ day, year, month, type, existingEntry, onSaved, onDelete, onMonthView }: {
  day:number; year:number; month:number; type:WEType; existingEntry:WEEntry|null;
  onSaved:()=>void; onDelete?:()=>Promise<void>; onMonthView:()=>void;
}) {
  const { selectedMarketId } = useAppStore();
  const { allCrit, updateEvent } = useWEConfig();
  const enabled = useMemo(()=>getEnabled(type,allCrit),[type,allCrit]);
  const critGroups = useMemo(()=>Array.from(new Set(allCrit.map(c=>c.group))),[allCrit]);
  const initAusgefallen = existingEntry?.criteriaValues?._ausgefallen==="ja";
  const [vals, setVals]       = useState<Record<string,string>>(existingEntry?.criteriaValues ?? buildDefaultVals(type,allCrit));
  const [notizen, setNotizen]   = useState(existingEntry?.notizen??"");
  const [ausgefallen, setAusgefallen] = useState(initAusgefallen);
  const [saving, setSaving]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [showPin, setShowPin]   = useState(false);

  useEffect(()=>{
    const isAusf = existingEntry?.criteriaValues?._ausgefallen==="ja";
    setVals(existingEntry?.criteriaValues ?? buildDefaultVals(type,allCrit));
    setNotizen(existingEntry?.notizen??"");
    setAusgefallen(isAusf);
    setConfirmDel(false);
  },[existingEntry,type.id,day]);

  const [showValidation, setShowValidation] = useState(false);
  const toggle=(k:string,v:string)=>setVals(p=>({...p,[k]:p[k]===v?"":v}));
  const setVal=(k:string,v:string)=>setVals(p=>({...p,[k]:v}));
  const hasAbw=!ausgefallen&&enabled.some(c=>vals[c.key]==="abweichung");
  const badTemp=!ausgefallen&&enabled.filter(c=>c.type==="temp").some(c=>vals[c.key]&&!isTempOk(c,vals[c.key]));
  const missingTemps=ausgefallen?[]:enabled.filter(c=>c.type==="temp").filter(c=>!vals[c.key]);
  const hasMissingTemps=missingTemps.length>0;
  const grouped=critGroups.map(g=>({group:g,items:enabled.filter(c=>c.group===g)})).filter(g=>g.items.length>0);

  const doSave = async (id:{name:string;userId:number;kuerzel:string}) => {
    if(!selectedMarketId)return;
    setSaving(true); setShowPin(false);
    const finalVals = ausgefallen ? {_ausgefallen:"ja"} : vals;
    try {
      await fetch(`${BASE}/wareneingang-entries`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({marketId:selectedMarketId,typeId:type.id,year,month,day,criteriaValues:finalVals,kuerzel:id.kuerzel,userId:id.userId,notizen:ausgefallen?"":notizen})});
      window.dispatchEvent(new Event(updateEvent));
      onSaved();
    } finally{setSaving(false);}
  };

  const wd=getWd(year,month,day);

  return (
    <div className="space-y-5">
      {showPin&&<PinModal onConfirm={doSave} onCancel={()=>setShowPin(false)}/>}
      <div className="flex items-center justify-between bg-white rounded-xl border border-border/60 px-4 py-3">
        <div>
          <p className="text-base font-bold">{wd}, {String(day).padStart(2,"0")}.{String(month).padStart(2,"0")}.{year}</p>
          <p className="text-xs text-muted-foreground">{type.name} &mdash; Wareneingang</p>
        </div>
        <button onClick={onMonthView} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5"/> Monatsansicht
        </button>
      </div>

      <div className={`bg-white rounded-xl border border-border/60 p-5 space-y-5 ${ausgefallen?"opacity-50 pointer-events-none":""}`}>
        {grouped.map(({group,items})=>(
          <div key={group} className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1">{group}</p>
            {items.map(c=>(
              <div key={c.key}>
                {c.type==="check"?(
                  <div className="flex items-start gap-2">
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm leading-snug">{c.label}</p>
                      {c.note&&<p className="text-[11px] text-muted-foreground">{c.note}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {STATUS_OPTS.map(o=>(
                        <button key={o.v} onClick={()=>toggle(c.key,o.v)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${vals[c.key]===o.v?o.cls+" scale-105":"bg-white border-border text-muted-foreground hover:border-primary/40"}`}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                ):c.type==="fisch_mhd_list"?(
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Fish className="w-3.5 h-3.5 text-blue-500"/>
                      {c.label}
                    </p>
                    {c.note&&<p className="text-[11px] text-muted-foreground">{c.note}</p>}
                    <FischMhdList value={vals[c.key]??""} onChange={v=>setVal(c.key,v)}/>
                  </div>
                ):c.type==="nemat_list"?(
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <CircleCheck className="w-3.5 h-3.5 text-blue-500"/>
                      {c.label}
                    </p>
                    {c.note&&<p className="text-[11px] text-muted-foreground">{c.note}</p>}
                    <NematList value={vals[c.key]??""} onChange={v=>setVal(c.key,v)}/>
                  </div>
                ):(
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-sm">
                        {c.label}
                        <span className="text-red-500 ml-0.5 font-bold">*</span>
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input type="number" step="0.1"
                          className={`w-20 border-2 rounded-lg px-2 py-1.5 text-sm font-mono text-center focus:outline-none transition-colors ${
                            vals[c.key]&&!isTempOk(c,vals[c.key])
                              ? "border-red-400 bg-red-50 focus:border-red-400"
                              : showValidation&&!vals[c.key]
                                ? "border-red-400 bg-red-50 focus:border-red-400"
                                : "border-border focus:border-primary/50"
                          }`}
                          placeholder="°C" value={vals[c.key]??""} onChange={e=>setVal(c.key,e.target.value)}/>
                        <span className="text-xs text-muted-foreground">°C</span>
                        {vals[c.key]&&<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isTempOk(c,vals[c.key])?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{isTempOk(c,vals[c.key])?"i.O.":"!"}</span>}
                      </div>
                    </div>
                    {vals[c.key]&&!isTempOk(c,vals[c.key])&&(
                      <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                        <TriangleAlert className="w-3.5 h-3.5 shrink-0"/>
                        Temperaturgrenzwert ueberschritten!{c.maxVal!==undefined&&c.minVal===undefined?` Erlaubt: max. ${c.maxVal} C`:c.minVal!==undefined&&c.maxVal!==undefined?` Erlaubt: ${c.minVal}–${c.maxVal} C`:""} – Massnahme erforderlich.
                      </div>
                    )}
                    {showValidation&&!vals[c.key]&&(
                      <p className="text-[11px] text-red-500 font-semibold pl-0.5">Pflichtfeld – bitte Temperatur eintragen.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {(hasAbw||badTemp)&&(
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500"/> Massnahmen / Notizen
            </label>
            <textarea className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none min-h-[72px] resize-none"
              placeholder="Massnahmen, Termin und Verantwortlicher..." value={notizen} onChange={e=>setNotizen(e.target.value)}/>
          </div>
        )}
      </div>

      <div
        onClick={()=>setAusgefallen(a=>!a)}
        className={`cursor-pointer rounded-xl border-2 px-4 py-3.5 flex items-center gap-3 transition-all select-none ${ausgefallen?"bg-gray-100 border-gray-400":"bg-white border-dashed border-gray-300 hover:border-gray-400"}`}>
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${ausgefallen?"bg-gray-500 border-gray-500":"border-gray-400 bg-white"}`}>
          {ausgefallen&&<Check className="w-3.5 h-3.5 text-white"/>}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-bold ${ausgefallen?"text-gray-700":"text-gray-500"}`}>Lieferung ausgefallen / verschoben</p>
          <p className="text-xs text-gray-400">Kein Liefertag wegen Ausfall, Verschiebung oder Sonderregelung. Eintrag wird trotzdem als erledigt markiert.</p>
        </div>
        {ausgefallen&&<span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 shrink-0">aktiv</span>}
      </div>

      <div className="flex gap-2">
        <button onClick={onMonthView} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">
          <CalendarDays className="w-4 h-4"/> Monatsansicht
        </button>
        {existingEntry&&onDelete&&!confirmDel&&(
          <button onClick={()=>setConfirmDel(true)} className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4"/>
          </button>
        )}
        {confirmDel&&(
          <button onClick={async()=>{setSaving(true);await onDelete!();setSaving(false);}} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-bold">
            {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<><Trash2 className="w-4 h-4"/>Loeschen</>}
          </button>
        )}
        {showValidation&&hasMissingTemps&&!ausgefallen&&(
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500"/>
            Alle Temperaturfelder sind Pflichtfelder. Bitte alle Temperaturen eintragen.
          </div>
        )}
        <button onClick={()=>{if(hasMissingTemps&&!ausgefallen){setShowValidation(true);}else{setShowPin(true);}}} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#2d5aa0]">
          {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}
          {existingEntry?"Aktualisieren":"Eintrag speichern"}
        </button>
      </div>
    </div>
  );
}

// ── MONTHLY VIEW ───────────────────────────────────────────────
function MonthlyTableView({ type, year, month, entries, loading, onEditDay, onTodayEntry }: {
  type:WEType; year:number; month:number; entries:WEEntry[]; loading:boolean;
  onEditDay:(day:number)=>void; onTodayEntry:()=>void;
}) {
  const { allCrit } = useWEConfig();
  const holidays   = useMemo(()=>getBavarianHolidays(year),[year]);
  const enabled    = useMemo(()=>getEnabled(type,allCrit),[type,allCrit]);
  const tempCrit   = enabled.filter(c=>c.type==="temp");
  const checkCrit  = enabled.filter(c=>c.type==="check");
  const days       = daysInMonth(year,month);
  const byDay      = useMemo(()=>new Map(entries.map(e=>[e.day,e])),[entries]);
  const [detailDay,setDetailDay] = useState<number|null>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  const now    = new Date();
  const todayDay=now.getDate(), todayMonth=now.getMonth()+1, todayYear=now.getFullYear();
  const isCurrentMonth=year===todayYear&&month===todayMonth;

  useEffect(()=>{
    if(isCurrentMonth&&!loading&&todayRef.current){
      setTimeout(()=>todayRef.current?.scrollIntoView({block:"center",behavior:"smooth"}),150);
    }
  },[type.id,year,month,loading,isCurrentMonth]);

  const deliveryDays=Array.from({length:days},(_,i)=>i+1).filter(d=>{
    const n=new Date();n.setHours(0,0,0,0);
    return getLieferstatus(type,year,month,d,holidays)==="erwartet"&&new Date(year,month-1,d)<=n;
  });
  const completedDays=deliveryDays.filter(d=>{const e=byDay.get(d);return entryStatus(e,enabled)==="full";}).length;
  const ausgefallenDays=deliveryDays.filter(d=>{const e=byDay.get(d);return entryStatus(e,enabled)==="ausgefallen";}).length;
  const effectiveDone=completedDays+ausgefallenDays;
  const progress=deliveryDays.length>0?Math.round((effectiveDone/deliveryDays.length)*100):0;
  const hasLiefertage=type.liefertage&&type.liefertage.length>0;
  const detailEntry=detailDay!==null?byDay.get(detailDay):undefined;

  function statusLabel(e:WEEntry|undefined,tc:TrafficColor,ls:Lieferstatus,future:boolean):React.ReactNode{
    if(future)return<span className="text-muted-foreground/30 text-xs">--</span>;
    if(ls==="kein_liefertag")return<span className="text-muted-foreground/50 text-xs">kein Liefertag</span>;
    if(!e)return<span className="text-red-500 text-xs font-semibold flex items-center gap-1"><TriangleAlert className="w-3 h-3"/>Eintrag fehlt</span>;
    const st=entryStatus(e,enabled);
    if(st==="ausgefallen")return<span className="text-gray-500 text-xs font-semibold flex items-center gap-1"><CircleMinus className="w-3 h-3"/>Lieferung ausgefallen</span>;
    const total=checkCrit.length;
    const ok=checkCrit.filter(c=>e.criteriaValues[c.key]==="io").length;
    const checkAbw=checkCrit.filter(c=>e.criteriaValues[c.key]==="abweichung").length;
    const tempAbw=enabled.filter(c=>c.type==="temp").filter(c=>e.criteriaValues[c.key]&&!isTempOk(c,e.criteriaValues[c.key])).length;
    const abw=checkAbw+tempAbw;
    if(st==="full")return<span className="text-green-700 text-xs font-semibold flex items-center gap-1"><Check className="w-3 h-3"/>{total>0?`${ok}/${total} Krit. i.O.`:"Vollstaendig"}</span>;
    if(st==="abweichung")return<span className="text-red-600 text-xs font-semibold flex items-center gap-1"><TriangleAlert className="w-3 h-3"/>{abw} Abweichung{abw!==1?"en":""}{e.notizen?" Notiz":""}</span>;
    return<span className="text-amber-600 text-xs font-semibold">{ok}/{total} eingetragen</span>;
  }

  return(
    <div className="space-y-3">
      {loading?(
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground"/></div>
      ):(
        <div className="space-y-1.5">
          {Array.from({length:days},(_,i)=>i+1).map(day=>{
            const wd=getWd(year,month,day);
            const ds=dateStr(year,month,day);
            const isHol=holidays.has(ds);
            const today=isToday(year,month,day);
            const future=isFuture(year,month,day);
            const ls=getLieferstatus(type,year,month,day,holidays);
            const e=byDay.get(day);
            const tc=getTrafficColor(e,type,year,month,day,holidays,allCrit);
            const v=e?.criteriaValues??{};
            const isClosed=isSun(year,month,day)||isHol;

            if(isClosed){
              return(
                <div key={day} className="flex items-center gap-3 px-3 py-1.5 rounded-lg opacity-30">
                  <div className="w-1 h-5 rounded-full bg-gray-200 shrink-0"/>
                  <span className={`text-xs font-bold w-6 text-center ${wd==="So"?"text-red-400":"text-muted-foreground"}`}>{String(day).padStart(2,"0")}</span>
                  <span className="text-xs text-muted-foreground">{wd}</span>
                  {isHol&&<span className="text-[10px] text-muted-foreground ml-1">{getHolidayName(ds,year)}</span>}
                </div>
              );
            }

            return(
              <div key={day} ref={today?todayRef:undefined}
                className={`flex items-center gap-0 rounded-xl border overflow-hidden transition-shadow hover:shadow-sm ${TC_BG[tc]} ${today?"ring-2 ring-blue-400/40":""}`}>
                <div className={`w-1.5 self-stretch shrink-0 ${TC_STRIPE[tc]}`}/>
                <div className="flex items-center gap-2.5 px-3 py-2.5 w-20 shrink-0">
                  <div className="text-center">
                    <p className={`text-base font-bold leading-none ${today?"text-blue-700":""}`}>{String(day).padStart(2,"0")}</p>
                    <p className={`text-[10px] font-medium mt-0.5 ${wd==="So"?"text-red-400":"text-muted-foreground"}`}>{wd}</p>
                  </div>
                </div>
                <div className="flex-1 px-2 py-2.5 min-w-0">
                  {statusLabel(e,tc,ls,future)}
                  {e&&tempCrit.length>0&&(
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {tempCrit.map(c=>{const val=v[c.key];if(!val)return null;const ok=isTempOk(c,val);return(
                        <span key={c.key} title={c.label}
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${ok?"bg-green-100 text-green-800":"bg-red-100 text-red-700"}`}>
                          {c.short}: {parseFloat(val).toFixed(1)}C
                        </span>
                      );})}
                    </div>
                  )}
                </div>
                {e&&(
                  <div className="px-2 shrink-0">
                    <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg">{e.kuerzel}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 pr-2 shrink-0">
                  {e&&(
                    <button onClick={()=>setDetailDay(day)} title="Details anzeigen"
                      className="p-1.5 rounded-lg hover:bg-white/60 text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="w-4 h-4"/>
                    </button>
                  )}
                  {!future&&ls!=="kein_liefertag"&&(
                    <button onClick={()=>onEditDay(day)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors shrink-0 ${
                        tc==="green"?"bg-green-500/15 text-green-700 hover:bg-green-500/25"
                        :tc==="yellow"?"bg-amber-400/15 text-amber-700 hover:bg-amber-400/25"
                        :tc==="red"?"bg-red-500/20 text-red-700 hover:bg-red-500/30 font-extrabold"
                        :"bg-[#1a3a6b]/10 text-[#1a3a6b] hover:bg-[#1a3a6b]/20"
                      }`}>
                      {e?"Bearb.":"+ Eintrag"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailDay!==null&&detailEntry&&(
        <DayDetailModal day={detailDay} year={year} month={month} type={type} entry={detailEntry}
          onClose={()=>setDetailDay(null)} onEdit={()=>{onEditDay(detailDay);setDetailDay(null);}}/>
      )}
      <p className="text-[10px] text-muted-foreground/50 px-1">Bei Abweichungen (A) sind Massnahmen, Termin und Umsetzung zu dokumentieren.</p>
    </div>
  );
}

// ── ADMIN VIEW ────────────────────────────────────────────────
function AdminView({ marketId, types, onRefresh, onDirtyChange }: {
  marketId:number; types:WEType[]; onRefresh:()=>void; onDirtyChange:(dirty:boolean)=>void;
}) {
  const { allCrit, section } = useWEConfig();
  const critGroups = useMemo(()=>Array.from(new Set(allCrit.map(c=>c.group))),[allCrit]);

  const [local, setLocal] = useState<Record<number,WEType>>(()=>Object.fromEntries(types.map(t=>[t.id,{...t,liefertage:[...t.liefertage],liefertageAusnahmen:{...t.liefertageAusnahmen},criteriaConfig:{...t.criteriaConfig}}])));
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [expandedId,setExpandedId]=useState<number|null>(null);
  const [saving,setSaving]=useState(false);
  const [newName,setNewName]=useState("");
  const [newWareArt,setNewWareArt]=useState(()=>section==="metzgerei"?"fisch":"kuehl");
  const [showAdd,setShowAdd]=useState(false);
  const [archiving,setArchiving]=useState(false);
  const [archiveYear,setArchiveYear]=useState(new Date().getFullYear()-1);
  const [ausnDate,setAusnDate]=useState<Record<number,string>>({});
  const [ausnVal,setAusnVal]=useState<Record<number,string>>({});

  useEffect(()=>{
    setLocal(Object.fromEntries(types.map(t=>[t.id,{...t,liefertage:[...t.liefertage],liefertageAusnahmen:{...t.liefertageAusnahmen},criteriaConfig:{...t.criteriaConfig}}])));
    setDirtyIds(new Set());
    onDirtyChange(false);
  },[types]);

  const markDirty=(id:number)=>{
    setDirtyIds(prev=>{const s=new Set(prev);s.add(id);return s;});
    onDirtyChange(true);
  };
  const updateLocal=(id:number,patch:Partial<WEType>)=>{
    setLocal(p=>({...p,[id]:{...p[id],...patch}}));
    markDirty(id);
  };

  const toggleCrit=(type:WEType,key:string)=>{const c={...local[type.id].criteriaConfig};if(c[key])delete c[key];else c[key]=true;updateLocal(type.id,{criteriaConfig:c});};
  const toggleLiefertag=(id:number,wd:number)=>{const lt=[...(local[id].liefertage??[])];const idx=lt.indexOf(wd);if(idx>-1)lt.splice(idx,1);else lt.push(wd);lt.sort((a,b)=>a-b);updateLocal(id,{liefertage:lt});};
  const addAusnahme=(id:number,dateVal:string,val:string)=>{if(!dateVal)return;const aus={...(local[id].liefertageAusnahmen??{}),[dateVal]:val};updateLocal(id,{liefertageAusnahmen:aus});};
  const removeAusnahme=(id:number,dateVal:string)=>{const aus={...(local[id].liefertageAusnahmen??{})};delete aus[dateVal];updateLocal(id,{liefertageAusnahmen:aus});};

  const handleSaveAll=async()=>{
    if(dirtyIds.size===0)return;
    setSaving(true);
    for(const id of Array.from(dirtyIds)){
      const t=local[id];
      await fetch(`${BASE}/wareneingang-types/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name:t.name,wareArt:t.wareArt,criteriaConfig:t.criteriaConfig,liefertage:t.liefertage,liefertageAusnahmen:t.liefertageAusnahmen})});
    }
    setSaving(false);
    onRefresh();
  };

  const handleDiscard=()=>{
    setLocal(Object.fromEntries(types.map(t=>[t.id,{...t,liefertage:[...t.liefertage],liefertageAusnahmen:{...t.liefertageAusnahmen},criteriaConfig:{...t.criteriaConfig}}])));
    setDirtyIds(new Set());
    onDirtyChange(false);
  };

  const getDefaultCritForWareArt=(wa:string):Record<string,boolean>=>{
    if(wa==="fisch")return{fisch_geruch:true,fisch_kiemen:true,fisch_augen:true,fisch_haut:true,fisch_konsistenz:true,fisch_herkunft:true,etikettierung:true,mhd:true,temp_frischfisch:true};
    if(wa==="msc_fisch")return{fisch_geruch:true,fisch_kiemen:true,fisch_augen:true,fisch_haut:true,fisch_konsistenz:true,fisch_herkunft:true,etikettierung:true,mhd:true,temp_frischfisch:true,fisch_msc_zertifikat:true,fisch_msc_kennz:true,fisch_msc_coc:true,fisch_msc_geliefert:true};
    return{hygiene:true,etikettierung:true,qualitaet:true,mhd:true};
  };

  const handleDelete=async(id:number)=>{if(!confirm("Diesen Lieferanten loeschen?"))return;await fetch(`${BASE}/wareneingang-types/${id}`,{method:"DELETE"});onRefresh();};
  const handleAdd=async()=>{
    if(!newName.trim())return;
    setSaving(true);
    await fetch(`${BASE}/wareneingang-types`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newName.trim(),wareArt:newWareArt,marketId,section,criteriaConfig:getDefaultCritForWareArt(newWareArt),liefertage:[],liefertageAusnahmen:{}})});
    setNewName("");setShowAdd(false);onRefresh();setSaving(false);
  };
  const handleArchive=async()=>{setArchiving(true);for(const t of types){await fetch(`${BASE}/wareneingang-archiv`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({marketId,typeId:t.id,year:archiveYear})});}setArchiving(false);alert(`Jahresarchiv ${archiveYear} erstellt.`);};

  const isDirty=dirtyIds.size>0;

  // WareArt-Optionen je nach Section
  const wareArtOptions = section==="metzgerei"
    ? [{v:"fisch",l:"Frischfisch"},{v:"msc_fisch",l:"MSC-Fisch"},{v:"kuehl",l:"Kuehlware (Fleisch)"},{v:"tk",l:"Tiefkuehl"}]
    : [{v:"kuehl",l:"Kuehlware"},{v:"tk",l:"Tiefkuehl"},{v:"ungekuehlt",l:"Ungekuehlt"}];

  return(
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div><p className="text-sm font-bold">Lieferanten fuer diesen Markt</p><p className="text-xs text-muted-foreground">Aenderungen werden erst nach "Speichern" uebernommen.</p></div>
        <div className="flex items-center gap-2">
          {isDirty&&(
            <button onClick={handleDiscard} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted text-muted-foreground">
              <X className="w-3.5 h-3.5"/> Verwerfen
            </button>
          )}
          <button onClick={handleSaveAll} disabled={!isDirty||saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isDirty?"bg-green-600 text-white hover:bg-green-700":"bg-muted text-muted-foreground cursor-not-allowed"}`}>
            {saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Check className="w-3.5 h-3.5"/>}
            Speichern {isDirty&&`(${dirtyIds.size} Aenderung${dirtyIds.size>1?"en":""})`}
          </button>
          <button onClick={()=>setShowAdd(s=>!s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold">
            <Plus className="w-3.5 h-3.5"/> Neuer Lieferant
          </button>
        </div>
      </div>

      {isDirty&&(
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0"/>
          <p className="text-xs text-amber-800 font-medium">Es gibt ungespeicherte Aenderungen. Bitte auf "Speichern" klicken.</p>
        </div>
      )}

      {showAdd&&(
        <div className="bg-white rounded-xl border border-border/60 p-4 space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase">Neuen Lieferanten anlegen</p>
          <div className="flex gap-2">
            <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Name..." value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()}/>
            <select className="border border-border rounded-lg px-2 py-2 text-sm" value={newWareArt} onChange={e=>setNewWareArt(e.target.value)}>
              {wareArtOptions.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setShowAdd(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted">Abbrechen</button>
            <button onClick={handleAdd} disabled={!newName.trim()||saving} className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold disabled:opacity-50">
              {saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Plus className="w-3.5 h-3.5"/>} Anlegen
            </button>
          </div>
        </div>
      )}

      {types.map(origType=>{
        const type=local[origType.id]??origType;
        const expanded=expandedId===type.id;
        const dirty=dirtyIds.has(type.id);
        return(
          <div key={type.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${dirty?"border-amber-300 ring-1 ring-amber-200":"border-border/60"}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-muted-foreground">{wareIcon(type.wareArt)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{type.name}</p>
                  {dirty&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">geaendert</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {type.liefertage?.length>0?type.liefertage.map(d=>WD_SHORT[d]).join(", "):"Liefertage: nicht konfiguriert"}
                  &nbsp;&middot;&nbsp;{Object.keys(type.criteriaConfig).filter(k=>type.criteriaConfig[k]).length} Kriterien
                </p>
              </div>
              <button onClick={()=>setExpandedId(expanded?null:type.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted">
                <Settings2 className="w-3.5 h-3.5"/>{expanded?<ChevronUp className="w-3 h-3"/>:<ChevronDown className="w-3 h-3"/>}
              </button>
              <button onClick={()=>handleDelete(type.id)} className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5"/></button>
            </div>
            {expanded&&(
              <div className="border-t border-border/60 bg-muted/10 p-4 space-y-5">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Liefertage (Wochentage)</p>
                  <div className="flex gap-2 flex-wrap">
                    {[1,2,3,4,5,6].map(wd=>(
                      <button key={wd} onClick={()=>toggleLiefertag(type.id,wd)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${(type.liefertage??[]).includes(wd)?"bg-[#1a3a6b] text-white border-[#1a3a6b]":"bg-white border-border text-muted-foreground hover:border-[#1a3a6b]/40"}`}>
                        {WD_SHORT[wd]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ausnahmen</p>
                  {Object.entries(type.liefertageAusnahmen??{}).map(([ds,val])=>(
                    <div key={ds} className="flex items-center gap-2 text-xs">
                      <span className="font-mono">{ds.split("-").reverse().join(".")}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${val==="liefertag"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>
                        {val==="liefertag"?"Liefertag (Ausnahme)":"Kein Liefertag"}
                      </span>
                      <button onClick={()=>removeAusnahme(type.id,ds)} className="ml-auto p-1 rounded hover:bg-red-50 text-red-400"><X className="w-3 h-3"/></button>
                    </div>
                  ))}
                  <div className="flex gap-2 items-center mt-1">
                    <input type="date" className="border border-border rounded-lg px-2 py-1 text-xs focus:outline-none"
                      value={ausnDate[type.id]??""} onChange={e=>setAusnDate(p=>({...p,[type.id]:e.target.value}))}/>
                    <select className="border border-border rounded-lg px-2 py-1 text-xs"
                      value={ausnVal[type.id]??"kein_liefertag"} onChange={e=>setAusnVal(p=>({...p,[type.id]:e.target.value}))}>
                      <option value="kein_liefertag">Kein Liefertag</option><option value="liefertag">Liefertag (Ausnahme)</option>
                    </select>
                    <button onClick={()=>{addAusnahme(type.id,ausnDate[type.id]??"",ausnVal[type.id]??"kein_liefertag");setAusnDate(p=>({...p,[type.id]:""}));}} disabled={!ausnDate[type.id]}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold disabled:opacity-40">
                      <Plus className="w-3 h-3"/> Hinzufuegen
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kriterien</p>
                  {critGroups.map(g=>(
                    <div key={g} className="space-y-1.5">
                      <p className="text-[9px] font-semibold text-muted-foreground/70 uppercase">{g}</p>
                      {allCrit.filter(c=>c.group===g).map(c=>(
                        <label key={c.key} className="flex items-center gap-2.5 cursor-pointer group" onClick={()=>toggleCrit(type,c.key)}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${type.criteriaConfig[c.key]?"bg-[#1a3a6b] border-[#1a3a6b]":"border-border bg-white"}`}>
                            {type.criteriaConfig[c.key]&&<Check className="w-2.5 h-2.5 text-white"/>}
                          </div>
                          <span className="text-xs text-muted-foreground group-hover:text-foreground">{c.label}</span>
                          {c.type==="temp"&&<Thermometer className="w-3 h-3 text-muted-foreground/40 shrink-0"/>}
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

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2"><Archive className="w-4 h-4 text-amber-600"/><p className="text-sm font-bold text-amber-800">Jahresarchiv</p></div>
        <p className="text-xs text-amber-700">Archiviert alle Eintraege als unveraenderliche Kopie fuer spaetere Kontrollen.</p>
        <div className="flex items-center gap-2">
          <select className="border border-amber-300 rounded-lg px-2 py-1.5 text-sm bg-white" value={archiveYear} onChange={e=>setArchiveYear(Number(e.target.value))}>
            {[-1,-2,-3].map(d=><option key={d} value={new Date().getFullYear()+d}>{new Date().getFullYear()+d}</option>)}
          </select>
          <button onClick={handleArchive} disabled={archiving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold disabled:opacity-50 hover:bg-amber-700">
            {archiving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Archive className="w-3.5 h-3.5"/>} Jahresarchiv erstellen
          </button>
        </div>
      </div>

      {isDirty&&(
        <div className="sticky bottom-4 flex gap-2 justify-end">
          <div className="bg-white border border-amber-300 shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-3">
            <span className="text-xs font-medium text-amber-700">{dirtyIds.size} Lieferant{dirtyIds.size>1?"en":""} geaendert</span>
            <button onClick={handleDiscard} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted">Verwerfen</button>
            <button onClick={handleSaveAll} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-50">
              {saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Check className="w-3.5 h-3.5"/>} Jetzt speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB STATUS DOT ────────────────────────────────────────────
type TodaySummaryRow = { type_id:number; liefertage:number[]|null; liefertage_ausnahmen:Record<string,string>|null; criteria_values:Record<string,string>|null; };

function tabTrafficColor(row:TodaySummaryRow|undefined,holidays:Set<string>):TrafficColor|null {
  if(!row)return null;
  const now=new Date();
  const wd=now.getDay();
  const ds=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const lt=row.liefertage??[];
  const aus=row.liefertage_ausnahmen??{};
  const isLiefertag=aus[ds]==="liefertag"?true:aus[ds]==="kein_liefertag"?false:lt.includes(wd);
  if(!isLiefertag||lt.length===0)return null;
  if(!row.criteria_values||Object.keys(row.criteria_values).length===0)return"red";
  if(row.criteria_values._ausgefallen==="ja")return"green";
  return"green";
}

// ── MAIN CONTENT ───────────────────────────────────────────────
function WareneingaengeContent() {
  const { section, pageTitle, pageSubtitle, allCrit } = useWEConfig();
  const { adminSession, selectedMarketId } = useAppStore();
  const isAdmin=!!adminSession;
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth()+1);
  const [types,setTypes]=useState<WEType[]>([]);
  const [loadingTypes,setLoadingTypes]=useState(true);
  const [activeTypeId,setActiveTypeId]=useState<number|"admin"|null>(null);
  const [entries,setEntries]=useState<WEEntry[]>([]);
  const [loadingEntries,setLoadingEntries]=useState(false);
  const [viewMode,setViewMode]=useState<"form"|"month">("form");
  const [selectedDay,setSelectedDay]=useState<number>(now.getDate());
  const [todaySummary,setTodaySummary]=useState<TodaySummaryRow[]>([]);
  const [adminIsDirty,setAdminIsDirty]=useState(false);
  const holidays=useMemo(()=>getBavarianHolidays(year),[year]);

  const loadTodaySummary=useCallback(async()=>{
    if(!selectedMarketId)return;
    try{const r=await fetch(`${BASE}/wareneingang-today-summary?marketId=${selectedMarketId}&section=${section}`);setTodaySummary(await r.json());}catch{}
  },[selectedMarketId,section]);

  const loadTypes=useCallback(async()=>{
    if(!selectedMarketId)return;
    setLoadingTypes(true);
    try{
      const res=await fetch(`${BASE}/wareneingang-types?marketId=${selectedMarketId}&section=${section}`);
      const data:WEType[]=await res.json();
      setTypes(data);
      if(typeof activeTypeId!=="number"||!data.find(t=>t.id===activeTypeId)){
        if(data.length>0)await activateTypeInternal(data[0],now.getFullYear(),now.getMonth()+1,selectedMarketId);
      }
    }finally{setLoadingTypes(false);}
    await loadTodaySummary();
  },[selectedMarketId,section]);

  useEffect(()=>{loadTypes();},[loadTypes]);

  const loadEntries=useCallback(async(typeId:number,y:number,m:number)=>{
    if(!selectedMarketId)return;
    setLoadingEntries(true);
    try{const res=await fetch(`${BASE}/wareneingang-entries?marketId=${selectedMarketId}&typeId=${typeId}&year=${y}&month=${m}`);setEntries(await res.json());}
    finally{setLoadingEntries(false);}
  },[selectedMarketId]);

  useEffect(()=>{if(typeof activeTypeId==="number")loadEntries(activeTypeId,year,month);},[activeTypeId,year,month,loadEntries]);

  const activateTypeInternal=async(type:WEType,y:number,m:number,mktId:number)=>{
    setActiveTypeId(type.id);
    const today=now.getDate(),tm=now.getMonth()+1,ty=now.getFullYear();
    setSelectedDay(today);
    if(y===ty&&m===tm){
      const res=await fetch(`${BASE}/wareneingang-entries/day?marketId=${mktId}&typeId=${type.id}&year=${y}&month=${m}&day=${today}`);
      const entry=await res.json();
      setViewMode(entry?"month":"form");
    }else{setViewMode("month");}
  };

  const handleTabClick=async(type:WEType)=>{
    if(!selectedMarketId)return;
    if(activeTypeId==="admin"&&adminIsDirty){
      if(!confirm("Es gibt ungespeicherte Aenderungen in der Verwaltung. Trotzdem wechseln?"))return;
      setAdminIsDirty(false);
    }
    setEntries([]);
    await activateTypeInternal(type,year,month,selectedMarketId);
    await loadEntries(type.id,year,month);
  };

  const activeType=typeof activeTypeId==="number"?types.find(t=>t.id===activeTypeId):null;
  const byDay=useMemo(()=>new Map(entries.map(e=>[e.day,e])),[entries]);
  const activeEntry=activeType?(byDay.get(selectedDay)??null):null;
  const summaryByTypeId=useMemo(()=>new Map(todaySummary.map(r=>[Number(r.type_id),r])),[todaySummary]);

  const handleSaved=async()=>{
    if(typeof activeTypeId!=="number")return;
    await loadEntries(activeTypeId,year,month);
    await loadTodaySummary();
    setViewMode("month");
  };
  const handleDelete=async()=>{
    if(!activeEntry)return;
    await fetch(`${BASE}/wareneingang-entries/${activeEntry.id}`,{method:"DELETE"});
    await loadEntries(activeTypeId as number,year,month);
    setViewMode("month");
  };

  const prevMonth=()=>{if(month===1){setYear(y=>y-1);setMonth(12);}else setMonth(m=>m-1);};
  const nextMonth=()=>{if(month===12){setYear(y=>y+1);setMonth(1);}else setMonth(m=>m+1);};

  const TC_DOT:Record<TrafficColor,string>={green:"bg-green-500",yellow:"bg-amber-400",red:"bg-red-500 animate-pulse",gray:"bg-gray-300",future:"bg-blue-300",neutral:"bg-gray-300"};

  return(
    <AppLayout>
      <div className="space-y-4 pb-10">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5"/>
            </Link>
            <div className="p-2.5 rounded-xl bg-[#1a3a6b]/10 shrink-0"><ClipboardList className="w-6 h-6 text-[#1a3a6b]"/></div>
            <div>
              <h1 className="text-xl font-bold">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground">{pageSubtitle}</p>
            </div>
          </div>
          {viewMode==="month"&&activeTypeId!=="admin"&&activeType&&(
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft className="w-4 h-4"/></button>
              <span className="text-sm font-semibold min-w-[100px] text-center">{new Date(year,month-1).toLocaleDateString("de-DE",{month:"long"})} {year}</span>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted"><ChevronRight className="w-4 h-4"/></button>
              <button onClick={()=>generatePrintWindow(activeType,entries,year,month,selectedMarketId!,holidays,allCrit)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted">
                <Printer className="w-3.5 h-3.5"/> PDF / Drucken
              </button>
            </div>
          )}
        </div>

        {loadingTypes?(
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground"/></div>
        ):(
          <>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {types.map(type=>{
                const row=summaryByTypeId.get(type.id);
                const tc=tabTrafficColor(row,holidays);
                return(
                  <button key={type.id} onClick={()=>handleTabClick(type)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${activeTypeId===type.id?"bg-[#1a3a6b] text-white shadow-md":"bg-white border border-border text-muted-foreground hover:border-[#1a3a6b]/40 hover:text-foreground"}`}>
                    <span className="opacity-70">{wareIcon(type.wareArt)}</span>
                    {type.name}
                    {tc&&<span className={`w-2 h-2 rounded-full shrink-0 ${TC_DOT[tc]} ${activeTypeId===type.id?"opacity-100":"opacity-80"}`}/>}
                  </button>
                );
              })}
              {isAdmin&&(
                <button onClick={()=>setActiveTypeId("admin")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ml-1 ${activeTypeId==="admin"?"bg-amber-500 text-white shadow-md":"bg-white border border-dashed border-amber-400 text-amber-600 hover:bg-amber-50"}`}>
                  <Settings2 className="w-3.5 h-3.5"/> Verwaltung
                  {adminIsDirty&&activeTypeId!=="admin"&&<span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"/>}
                </button>
              )}
            </div>

            {activeTypeId==="admin"&&isAdmin&&selectedMarketId?(
              <AdminView marketId={selectedMarketId} types={types} onRefresh={loadTypes} onDirtyChange={setAdminIsDirty}/>
            ):activeType?(
              viewMode==="form"?(
                <DayFormView key={`${activeType.id}-${selectedDay}`}
                  day={selectedDay} year={year} month={month}
                  type={activeType} existingEntry={activeEntry}
                  onSaved={handleSaved}
                  onDelete={activeEntry?handleDelete:undefined}
                  onMonthView={()=>setViewMode("month")}/>
              ):(
                <MonthlyTableView type={activeType} year={year} month={month}
                  entries={entries} loading={loadingEntries}
                  onEditDay={day=>{setSelectedDay(day);setViewMode("form");}}
                  onTodayEntry={()=>{setSelectedDay(now.getDate());setViewMode("form");}}/>
              )
            ):(
              <div className="text-center py-12 text-muted-foreground text-sm">Kein Lieferant ausgewaehlt.</div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

// ── EXPORT: Wrapper that provides config context ───────────────
export default function WareneingaengeBase({ config }: { config: WEBaseConfig }) {
  return (
    <WEConfigContext.Provider value={config}>
      <WareneingaengeContent />
    </WEConfigContext.Provider>
  );
}
