import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ChevronLeft, ChevronRight, Check, X, Lock, Loader2,
  ClipboardList, Printer, CalendarDays, ListChecks, Trash2,
} from "lucide-react";
import { Link } from "wouter";
import {
  useMetzgereiReinigungWocheStatus,
  useMetzgereiReinigungJahrStatus,
  type TrafficLight,
} from "@/hooks/useWarenzustandStatus";

const BASE = import.meta.env.VITE_API_URL || "/api";

// ─── Typen ───────────────────────────────────────────────────────────────────
interface CleanItem {
  key: string;
  label: string;
  sublabel?: string;
  tTyp?: "R"|"D"|"R+D";   // täglich
  wTyp?: "R"|"D"|"R+D";   // wöchentlich
  bemerkung?: string;
}
interface Section { id: string; label: string; short: string; items: CleanItem[]; }
interface Entry { id: number; itemKey: string; datum: string; kuerzel: string; }

// ─── Reinigungsplan-Daten (aus Formblatt 3.6-1) ───────────────────────────────
const SECTIONS: Section[] = [
  {
    id: "vorb", label: "Vorbereitungsräume / Produktionsräume", short: "Vorber.",
    items: [
      { key:"vorb_fussboden",  label:"Fußboden, Abflüsse (Gullys)",                tTyp:"R", wTyp:"D",   bemerkung:"Pfützenbildung vermeiden!" },
      { key:"vorb_waende",     label:"Wände (Fliesen), Türen",                     wTyp:"R+D" },
      { key:"vorb_tuergriffe", label:"Türgriffe, Lichtschalter",                   tTyp:"R+D" },
      { key:"vorb_arbeits",
        label:"Arbeitstische, Schneidebretter, Schränke außen,",
        sublabel:"Wannen, Mulden, Behälter (direkter LM-Kontakt), Waschbecken",
        tTyp:"R+D",
        bemerkung:"Alle Flächen regelmäßig zwischenreinigen, Bretter regelmäßig abschleifen" },
      { key:"vorb_messer",     label:"Messer",                                     tTyp:"R+D", bemerkung:"Mehrmals täglich zwischenreinigen" },
      { key:"vorb_geraete",    label:"Sonstige Arbeitsgeräte, Maschinen, Reinigungsgeräte", tTyp:"R+D", bemerkung:"Mehrmals täglich zwischenreinigen" },
      { key:"vorb_backofen",   label:"Backöfen, Warmhaltegeräte",                  tTyp:"R" },
      { key:"vorb_hygiene",    label:"Papier-/Handhygienespender",                 tTyp:"R" },
      { key:"vorb_abfall",     label:"Abfallbehälter",                             tTyp:"R+D", bemerkung:"Täglich entleeren, reinigen und neuen Beutel einspannen" },
      { key:"vorb_fenster",    label:"Fenster",                                    wTyp:"R" },
    ],
  },
  {
    id: "waren", label: "Warenannahme, Betriebsgänge, Lager, Kühl-/TK-Einrichtungen", short: "Lager",
    items: [
      { key:"waren_transport",    label:"Transportmittel (direkter Lebensmittelkontakt)", tTyp:"R+D", bemerkung:"R bzw. D von Transportmitteln mit indirektem LM-Kontakt nach Bedarf" },
      { key:"waren_annahme",      label:"Warenannahme, Betriebsgänge",                     tTyp:"R" },
      { key:"waren_kuehl_boden",  label:"Kühlräume: Fußböden und Abflüsse",               tTyp:"R" },
      { key:"waren_eismaschine",  label:"Eismaschine (Vorratsbehälter)",                   wTyp:"R+D" },
      { key:"waren_kuehl_waende", label:"Kühlräume: Wände (Fliesen)",                      wTyp:"R" },
      { key:"waren_kuehl_regal",  label:"Kühlräume: Regalflächen",                         wTyp:"R" },
    ],
  },
  {
    id: "theke", label: "Theke", short: "Theke",
    items: [
      { key:"theke_fussboden",  label:"Fußboden, Abflüsse (Gullys)",                        tTyp:"R", wTyp:"D" },
      { key:"theke_tueren",     label:"Türen",                                               tTyp:"R" },
      { key:"theke_tuergriffe", label:"Türgriffe, Lichtschalter",                            tTyp:"R+D" },
      { key:"theke_arbeits",    label:"Arbeitstische, Schneidebretter, Schränke, Waschbecken", tTyp:"R+D", bemerkung:"Alle Flächen regelmäßig zwischenreinigen, Bretter abschleifen" },
      { key:"theke_waren",      label:"Warenträger (direkter Kontakt mit unverpackten LM)",  tTyp:"R+D", bemerkung:"z.B. Platten, Schalen, Schüsseln, Thekeneinlegebretter/-bleche" },
      { key:"theke_werkzeuge",  label:"Werkzeuge wie Messer, Gabeln, Schöpflöffel",         tTyp:"R+D", bemerkung:"Mehrmals täglich zwischenreinigen" },
      { key:"theke_hackfleisch",label:"Hackfleischwolf",                                     tTyp:"R+D", bemerkung:"2x täglich (mittags und abends): Gehäuse und Innenbauteile" },
      { key:"theke_warmhalte",  label:"Warmhaltegeräte",                                     tTyp:"R" },
      { key:"theke_waagen",     label:"Waagen, Arbeitsgeräte, Maschinen, Reinigungsgeräte", tTyp:"R+D", bemerkung:"Mehrmals täglich zwischenreinigen" },
      { key:"theke_verkauf",    label:"Verkaufstheke: Glas, Thekenwanne, restliche Flächen", tTyp:"R", wTyp:"D" },
      { key:"theke_fisch",      label:"Fischtheke: Glas, Thekenwannen, restliche Flächen",  tTyp:"R+D" },
      { key:"theke_hygiene",    label:"Papier-/Handhygienespender",                          tTyp:"R" },
      { key:"theke_preise",     label:"Preisschilder, Dekomaterialien",                      tTyp:"R+D", bemerkung:"Kontakt mit offenen Lebensmitteln vermeiden" },
      { key:"theke_abfall",     label:"Abfallbehälter",                                      tTyp:"R+D", bemerkung:"Täglich entleeren und neuen Beutel einspannen" },
      { key:"theke_waende",     label:"Wände (Fliesen), Fenster",                            wTyp:"R" },
      { key:"theke_luefter",    label:"Verkaufstheke: Thekenlüfter",                         wTyp:"R" },
    ],
  },
];

// ─── Jahresplan-Aufgaben ───────────────────────────────────────────────────────
interface JahresItem { key: string; label: string; monate: number[]; typ: string; quartal?: boolean; halbjahr?: boolean; }
const QUARTALE = [
  { label:"Q1", monate:[1,2,3],   color:"bg-sky-50 text-sky-700 border-sky-200" },
  { label:"Q2", monate:[4,5,6],   color:"bg-emerald-50 text-emerald-700 border-emerald-200" },
  { label:"Q3", monate:[7,8,9],   color:"bg-amber-50 text-amber-700 border-amber-200" },
  { label:"Q4", monate:[10,11,12],color:"bg-rose-50 text-rose-700 border-rose-200" },
];
const HALBJAHRE = [
  { label:"H1", short:"1. Halbjahr", monate:[1,2,3,4,5,6],   color:"bg-indigo-50 text-indigo-700 border-indigo-200" },
  { label:"H2", short:"2. Halbjahr", monate:[7,8,9,10,11,12], color:"bg-purple-50 text-purple-700 border-purple-200" },
];
const JAHRES_ITEMS: JahresItem[] = [
  { key:"j_grundrein_kuehl",    label:"Grundreinigung Kühlräume (komplett)",         monate:[3,9],    typ:"R+D", halbjahr:true },
  { key:"j_grundrein_prod",     label:"Grundreinigung Produktionsraum (komplett)",   monate:[3,6,9,12], typ:"R+D", quartal:true },
  { key:"j_grundrein_theke",    label:"Grundreinigung Theke / Thekenbereich",        monate:[3,6,9,12], typ:"R+D", quartal:true },
  { key:"j_schaedling",         label:"Schädlingsbekämpfung / Insektenschutz prüfen",monate:[1,4,7,10], typ:"Kontrolle", quartal:true },
  { key:"j_fettabscheider",     label:"Fettabscheider reinigen / entleeren",         monate:[1,4,7,10], typ:"R", quartal:true },
  { key:"j_kanalisation",       label:"Kanalisation / Abflüsse Hochdruckreinigung",  monate:[4,10],     typ:"R", halbjahr:true },
  { key:"j_maschinen_wartung",  label:"Maschinenwartung / Sicherheitsprüfung",       monate:[1,7],      typ:"Wartung", halbjahr:true },
  { key:"j_kuehl_wartung",      label:"Kühlaggregate prüfen / warten lassen",        monate:[5,11],     typ:"Wartung", halbjahr:true },
  { key:"j_desinfmittel",       label:"Desinfektionsmittel-Konzentration prüfen",    monate:[1,2,3,4,5,6,7,8,9,10,11,12], typ:"Kontrolle" },
  { key:"j_abluft",             label:"Abluftanlage / Filter reinigen",               monate:[1,7],      typ:"R", halbjahr:true },
];
const MONATE = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];

// ─── Datums-Utilities ─────────────────────────────────────────────────────────
function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function todayIso() { return toIso(new Date()); }
function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil((((t.getTime() - ys.getTime()) / 86400000) + 1) / 7);
}
function isoWeekYear(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  return t.getUTCFullYear();
}
function mondayOfWeek(kw: number, year: number): Date {
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - day + 1 + (kw - 1) * 7);
  return monday;
}
function weekDates(kw: number, year: number): Date[] {
  const mon = mondayOfWeek(kw, year);
  return [0,1,2,3,4,5].map(i => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d;
  });
}
const TAGS = ["Mo","Di","Mi","Do","Fr","Sa"];

// ─── Badges ───────────────────────────────────────────────────────────────────
const TYP_STYLE: Record<string,string> = {
  "R":   "bg-red-100 text-red-700 border-red-200",
  "D":   "bg-blue-100 text-blue-700 border-blue-200",
  "R+D": "bg-purple-100 text-purple-700 border-purple-200",
};
function Badge({typ,prefix}:{typ:string;prefix:string}) {
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TYP_STYLE[typ]||"bg-gray-100 text-gray-600"}`}>{prefix}·{typ}</span>;
}

// ─── PIN-Modal ─────────────────────────────────────────────────────────────────
function PinModal({onConfirm,onClose,label}:{
  onConfirm:(kuerzel:string,userId:number|null)=>void;
  onClose:()=>void;
  label:string;
}) {
  const [pin,setPin]     = useState("");
  const [loading,setL]   = useState(false);
  const [error,setErr]   = useState("");
  const [user,setUser]   = useState<{name:string;userId:number;kuerzel:string}|null>(null);

  const verify = async() => {
    setErr(""); setL(true);
    try {
      const r = await fetch(`${BASE}/users/verify-pin`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin,tenantId:1})});
      const d = await r.json();
      if(d.valid) setUser({name:d.userName,userId:d.userId,kuerzel:d.initials});
      else setErr("PIN ungültig.");
    } catch { setErr("Verbindungsfehler."); } finally { setL(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Abzeichnen</h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{label}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4"/></button>
        </div>
        {!user ? (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">PIN eingeben</label>
              <input type="password" inputMode="numeric"
                className="w-full border border-border rounded-lg px-3 py-3 text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="••••" value={pin} maxLength={6} autoFocus
                onChange={e=>setPin(e.target.value.replace(/\D/g,""))}
                onKeyDown={e=>e.key==="Enter"&&pin.length>=4&&verify()}/>
            </div>
            {error&&<p className="text-xs text-red-500 flex items-center gap-1"><X className="w-3 h-3"/>{error}</p>}
            <button onClick={verify} disabled={loading||pin.length<4}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50">
              {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Lock className="w-4 h-4"/>} PIN prüfen
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-white"/>
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">{user.name}</p>
                <p className="text-xs text-green-600">Kürzel: <span className="font-mono font-bold">{user.kuerzel}</span></p>
              </div>
            </div>
            <button onClick={()=>onConfirm(user.kuerzel,user.userId)}
              className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold flex items-center justify-center gap-2">
              <Check className="w-4 h-4"/> Abzeichnen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ampel-Dot ───────────────────────────────────────────────────────────────
function StatusDot({status, active}:{status:TrafficLight; active:boolean}) {
  if(status==="none") return null;
  const col = status==="green"  ? (active?"bg-green-400":"bg-green-500")
            : status==="yellow" ? (active?"bg-amber-300":"bg-amber-400")
            :                     (active?"bg-red-400 animate-pulse":"bg-red-500 animate-pulse");
  return <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col}`}/>;
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────
export default function MetzgereiReinigung() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = !!adminSession;
  const now     = new Date();

  const wocheStatus = useMetzgereiReinigungWocheStatus();
  const jahrStatus  = useMetzgereiReinigungJahrStatus();

  const [tab, setTab]           = useState<"woche"|"jahr">("woche");
  const [activeSection, setAS]  = useState(0);
  const [kw, setKw]             = useState(isoWeek(now));
  const [kwYear, setKwYear]     = useState(isoWeekYear(now));
  const [jwYear, setJwYear]     = useState(now.getFullYear());
  const [entries, setEntries]   = useState<Entry[]>([]);
  const [jEntries, setJEntries] = useState<Entry[]>([]);
  const [loading, setLoading]   = useState(false);
  const [signing, setSigning]   = useState<{itemKey:string;datum:string;label:string}|null>(null);
  const [delId, setDelId]       = useState<number|null>(null);
  const [bulkDate, setBulkDate] = useState<string|null>(null);
  const [bulkLoading, setBulkL] = useState(false);

  const dates    = useMemo(()=>weekDates(kw, kwYear),[kw,kwYear]);
  const vonDate  = useMemo(()=>toIso(dates[0]),[dates]);
  const bisDate  = useMemo(()=>toIso(dates[5]),[dates]);
  const todayStr = todayIso();

  // Wochenplan laden
  const loadWeek = useCallback(async()=>{
    if(!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/metz-reinigung?marketId=${selectedMarketId}&von=${vonDate}&bis=${bisDate}`);
      setEntries(await r.json());
    } finally { setLoading(false); }
  },[selectedMarketId, vonDate, bisDate]);

  // Jahresplan laden
  const loadYear = useCallback(async()=>{
    if(!selectedMarketId) return;
    const von = `${jwYear}-01-01`;
    const bis = `${jwYear}-12-31`;
    const r = await fetch(`${BASE}/metz-reinigung?marketId=${selectedMarketId}&von=${von}&bis=${bis}`);
    setJEntries(await r.json());
  },[selectedMarketId, jwYear]);

  useEffect(()=>{ loadWeek(); },[loadWeek]);
  useEffect(()=>{ if(tab==="jahr") loadYear(); },[tab, loadYear]);

  // Entry-Map: itemKey + datum → entry
  const entryMap = useMemo(()=>{
    const m = new Map<string,Entry>();
    for(const e of entries) m.set(`${e.itemKey}__${e.datum}`, e);
    return m;
  },[entries]);

  const jEntryMap = useMemo(()=>{
    const m = new Map<string,Entry>();
    for(const e of jEntries) m.set(`${e.itemKey}__${e.datum.slice(0,7)}`, e);
    return m;
  },[jEntries]);

  // Statuszählung
  const stats = useMemo(()=>{
    const section = SECTIONS[activeSection];
    const today = dates.find(d=>toIso(d)===todayStr);
    if(!today) return { done:0, total:0 };
    const total = section.items.filter(i=>i.tTyp||i.wTyp).length;
    const done  = section.items.filter(i=>entryMap.has(`${i.key}__${toIso(today)}`)).length;
    return { done, total };
  },[activeSection, dates, entryMap, todayStr]);

  // KW Navigation
  const prevWeek = () => {
    if(kw===1){setKwYear(y=>y-1);setKw(52);}else setKw(k=>k-1);
  };
  const nextWeek = () => {
    const maxKw = isoWeek(new Date(kwYear,11,28));
    if(kw>=maxKw){setKwYear(y=>y+1);setKw(1);}else setKw(k=>k+1);
  };
  const isFuture = (d:Date) => toIso(d) > todayStr;

  const dispatch = () => window.dispatchEvent(new Event("metz-reinigung-updated"));

  const handleSign = async(kuerzel:string, userId:number|null) => {
    if(!signing||!selectedMarketId) return;
    await fetch(`${BASE}/metz-reinigung`,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({marketId:selectedMarketId,itemKey:signing.itemKey,datum:signing.datum,kuerzel,userId})});
    setSigning(null);
    dispatch();
    tab==="woche" ? loadWeek() : loadYear();
  };

  const handleDelete = async(id:number) => {
    await fetch(`${BASE}/metz-reinigung/${id}`,{method:"DELETE"});
    setDelId(null);
    dispatch();
    tab==="woche" ? loadWeek() : loadYear();
  };

  // Alle offenen Positionen aller 3 Bereiche für ein Datum auf einmal abzeichnen
  const handleBulkSign = async(kuerzel:string, userId:number|null) => {
    if(!bulkDate||!selectedMarketId) return;
    setBulkL(true);
    const toPost: {itemKey:string; datum:string}[] = [];
    for(const sec of SECTIONS) {
      for(const item of sec.items) {
        // Nur tägliche Items abzeichnen
        if(item.tTyp && !entryMap.has(`${item.key}__${bulkDate}`)) {
          toPost.push({itemKey:item.key, datum:bulkDate});
        }
      }
    }
    await Promise.all(toPost.map(p=>
      fetch(`${BASE}/metz-reinigung`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({marketId:selectedMarketId,...p,kuerzel,userId})})
    ));
    setBulkDate(null);
    setBulkL(false);
    dispatch();
    loadWeek();
  };

  // Offene tägliche Items pro Tag (alle Bereiche) — für die Schnell-Abzeichen-Leiste
  const dayOpenCounts = useMemo(()=>{
    const map: Record<string,number> = {};
    for(const d of dates) {
      const iso = toIso(d);
      let n = 0;
      for(const sec of SECTIONS)
        for(const item of sec.items)
          if(item.tTyp && !entryMap.has(`${item.key}__${iso}`)) n++;
      map[iso] = n;
    }
    return map;
  },[dates, entryMap]);

  const section = SECTIONS[activeSection];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-4 print:max-w-none print:space-y-2">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 print:hidden">
          <Link href="/metzgerei-wareneingaenge" className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
            <ChevronLeft className="w-5 h-5"/>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Reinigungsplan Metzgerei</h1>
            <p className="text-sm text-muted-foreground">Formblatt 3.6-1 · EDEKA DALLMANN</p>
          </div>
          <button onClick={()=>window.print()} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
            <Printer className="w-5 h-5"/>
          </button>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 print:hidden">
          {([
            {t:"woche", l:"Wochenplan",  status:wocheStatus},
            {t:"jahr",  l:"Jahresplan",  status:jahrStatus},
          ] as {t:"woche"|"jahr"; l:string; status:TrafficLight}[]).map(({t,l,status})=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab===t?"bg-[#1a3a6b] text-white":"bg-white border border-border text-muted-foreground hover:bg-secondary"}`}>
              {t==="woche"?<CalendarDays className="w-4 h-4"/>:<ListChecks className="w-4 h-4"/>}
              {l}
              <StatusDot status={status} active={tab===t}/>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* WOCHENPLAN                                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab==="woche"&&(
          <>
            {/* KW Navigation */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm px-4 py-3 flex items-center gap-3">
              <button onClick={prevWeek} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground print:hidden">
                <ChevronLeft className="w-4 h-4"/>
              </button>
              <div className="flex-1 text-center">
                <p className="font-bold text-lg">KW {kw} / {kwYear}</p>
                <p className="text-xs text-muted-foreground">
                  {dates[0].toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"})} – {dates[5].toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"})}
                </p>
              </div>
              <button onClick={nextWeek} disabled={vonDate>todayStr} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground disabled:opacity-30 print:hidden">
                <ChevronRight className="w-4 h-4"/>
              </button>
              {/* Status */}
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border/60">
                <span className="text-sm font-bold text-foreground">{stats.done}/{stats.total}</span>
                <span className="text-xs text-muted-foreground">heute</span>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 overflow-x-auto print:hidden">
              {SECTIONS.map((s,i)=>(
                <button key={s.id} onClick={()=>setAS(i)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${activeSection===i?"bg-[#b91c1c] text-white":"bg-white border border-border text-muted-foreground hover:bg-secondary"}`}>
                  <ClipboardList className="w-4 h-4"/>{s.short}
                </button>
              ))}
            </div>

            {/* Hinweis */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800">
              <strong>T</strong> = täglich &nbsp;·&nbsp; <strong>W</strong> = wöchentlich &nbsp;·&nbsp;
              <strong>R</strong> = Reinigung &nbsp;·&nbsp; <strong>D</strong> = Desinfektion &nbsp;·&nbsp;
              <strong>R+D</strong> = Reinigung + Desinfektion
              &nbsp;·&nbsp; Die angegebene Häufigkeit ist <u>Mindestanforderung</u>.
            </div>

            {/* Tabelle */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              {/* Section-Titel */}
              <div className="px-4 py-3 bg-[#1a3a6b]/5 border-b border-border/60">
                <p className="font-bold text-sm text-[#1a3a6b]">{section.label}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border/60 bg-secondary/50">
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground w-64">Gegenstand</th>
                      <th className="text-center px-2 py-2.5 text-xs font-bold text-muted-foreground w-24">Häufigkeit</th>
                      {dates.map((d,i)=>{
                        const iso = toIso(d);
                        const isToday = iso===todayStr;
                        const isFut   = isFuture(d);
                        return (
                          <th key={i} className={`text-center px-2 py-2.5 text-xs font-bold w-14 ${isToday?"text-[#1a3a6b] bg-[#1a3a6b]/5":isFut?"text-muted-foreground/40":"text-muted-foreground"}`}>
                            <div>{TAGS[i]}</div>
                            <div className={`text-[11px] font-normal ${isToday?"font-bold":""}`}>
                              {d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"})}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {section.items.map(item=>{
                      const isWonly = !item.tTyp && !!item.wTyp;
                      const weekSigned = dates.some(d=>entryMap.has(`${item.key}__${toIso(d)}`));

                      return (
                        <tr key={item.key} className="hover:bg-secondary/20 transition-colors group">
                          {/* Label */}
                          <td className="px-4 py-2.5 align-top">
                            <p className="font-semibold text-xs text-foreground leading-tight">{item.label}</p>
                            {item.sublabel&&<p className="text-[10px] text-muted-foreground leading-tight">{item.sublabel}</p>}
                            {item.bemerkung&&<p className="text-[10px] text-blue-600 italic leading-tight mt-0.5">{item.bemerkung}</p>}
                          </td>
                          {/* Häufigkeit Badges */}
                          <td className="px-2 py-2.5 align-top">
                            <div className="flex flex-col gap-0.5">
                              {item.tTyp&&<Badge typ={item.tTyp} prefix="T"/>}
                              {item.wTyp&&<Badge typ={item.wTyp} prefix="W"/>}
                              {isWonly&&weekSigned&&(
                                <span className="text-[9px] text-green-600 font-bold">Diese Woche erledigt</span>
                              )}
                            </div>
                          </td>
                          {/* Tageszellen */}
                          {dates.map((d,di)=>{
                            const iso    = toIso(d);
                            const entry  = entryMap.get(`${item.key}__${iso}`);
                            const fut    = isFuture(d);
                            const isToday = iso===todayStr;
                            // Wöchentliche Items: nicht abzeichenbar — nur Statusanzeige im Label
                            if(isWonly) return (
                              <td key={di} className="px-1 py-1.5 text-center align-middle">
                                <div className="w-12 h-9 rounded-lg flex items-center justify-center mx-auto bg-gray-50 border border-dashed border-gray-200 opacity-40">
                                  <span className="text-gray-400 text-[10px]">—</span>
                                </div>
                              </td>
                            );

                            const cellBg = entry
                              ? "bg-green-100 border border-green-300"
                              : isToday
                                ? "bg-blue-50 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                                : fut
                                  ? "bg-gray-50 border border-dashed border-gray-200 opacity-40"
                                  : "bg-red-50 border border-red-200 hover:bg-red-100 cursor-pointer";

                            return (
                              <td key={di} className="px-1 py-1.5 text-center align-middle">
                                <button
                                  disabled={fut||!!entry}
                                  onClick={()=>!fut&&!entry&&setSigning({itemKey:item.key,datum:iso,label:item.label})}
                                  className={`w-12 h-9 rounded-lg text-xs font-bold transition-all ${cellBg} ${entry?"cursor-default":fut?"cursor-not-allowed":"active:scale-95"}`}
                                  title={entry?`${entry.kuerzel} · ${entry.datum}`:undefined}
                                >
                                  {entry ? (
                                    <span className="flex flex-col items-center leading-tight">
                                      <Check className="w-3 h-3 text-green-600"/>
                                      <span className="text-[9px] text-green-700 font-mono">{entry.kuerzel}</span>
                                      {isAdmin&&<span role="button" onPointerDown={e=>{e.stopPropagation();setDelId(entry.id);}}
                                        className="text-[8px] text-red-400 hover:text-red-600 hidden group-hover:block cursor-pointer">✕</span>}
                                    </span>
                                  ) : fut ? null : (
                                    <span className="text-gray-300">+</span>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="print:hidden">
                    <tr className="border-t-2 border-border/60 bg-secondary/20">
                      <td colSpan={2} className="px-4 py-2 text-[10px] text-muted-foreground">
                        T = täglich · W = wöchentlich
                      </td>
                      {dates.map((d)=>{
                        const iso  = toIso(d);
                        const fut  = iso > todayStr;
                        const done = (dayOpenCounts[iso] ?? 0) === 0;
                        return (
                          <td key={iso} className="px-1 py-2 text-center">
                            {done ? (
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mx-auto">
                                <Check className="w-3.5 h-3.5 text-white"/>
                              </div>
                            ) : fut ? (
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mx-auto opacity-30">
                                <Lock className="w-3 h-3 text-muted-foreground"/>
                              </div>
                            ) : (
                              <button
                                onClick={()=>setBulkDate(iso)}
                                className="w-8 h-8 rounded-full bg-[#1a3a6b]/10 text-[#1a3a6b] hover:bg-[#1a3a6b]/20 flex items-center justify-center mx-auto transition-colors active:scale-95">
                                <ListChecks className="w-3.5 h-3.5"/>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="px-4 py-2 bg-secondary/30 border-t border-border/60 text-[10px] text-muted-foreground">
                Zelle anklicken zum Abzeichnen mit PIN · Spalten-Icon = alle Positionen dieses Tages abzeichnen
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* JAHRESPLAN                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab==="jahr"&&(
          <>
            {/* Jahr Navigation */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm px-4 py-3 flex items-center gap-3">
              <button onClick={()=>setJwYear(y=>y-1)} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
                <ChevronLeft className="w-4 h-4"/>
              </button>
              <div className="flex-1 text-center">
                <p className="font-bold text-lg">Jahresplan {jwYear}</p>
                <p className="text-xs text-muted-foreground">Reinigung / Wartung Metzgerei</p>
              </div>
              <button onClick={()=>setJwYear(y=>y+1)} disabled={jwYear>=now.getFullYear()} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground disabled:opacity-30">
                <ChevronRight className="w-4 h-4"/>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-[#1a3a6b]/5 border-b border-border/60">
                <p className="font-bold text-sm text-[#1a3a6b]">Reinigungsplan Jahr {jwYear} — Metzgerei</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[860px]">
                  <thead>
                    {/* Quartal-Zeile */}
                    <tr className="bg-secondary/30">
                      <th rowSpan={2} className="text-left px-4 py-2 text-xs font-bold text-muted-foreground w-72 border-b border-border/60 align-bottom">Aufgabe</th>
                      <th rowSpan={2} className="text-center px-2 py-2 text-xs font-bold text-muted-foreground w-16 border-b border-border/60 align-bottom">Art</th>
                      {QUARTALE.map((q,qi)=>(
                        <th key={q.label} colSpan={3}
                          className={`text-center px-1 py-1.5 text-xs font-extrabold border-b border-border/40 ${qi>0?"border-l border-border/40":""} ${q.color}`}>
                          {q.label}
                        </th>
                      ))}
                    </tr>
                    {/* Monats-Zeile */}
                    <tr className="bg-secondary/50 border-b border-border/60">
                      {MONATE.map((m,mi)=>(
                        <th key={m}
                          className={`text-center px-1 py-1.5 text-[10px] font-bold text-muted-foreground w-[52px] ${mi%3===0&&mi>0?"border-l border-border/40":""}`}>
                          {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {JAHRES_ITEMS.map(item=>(
                      <tr key={item.key} className="hover:bg-secondary/20 group">
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-xs leading-tight">{item.label}</p>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <Badge typ={item.typ} prefix=""/>
                        </td>

                        {/* ── Quartal-Rendering (4 × colspan=3) ── */}
                        {item.quartal ? QUARTALE.map((q,qi)=>{
                          const reqMonth = item.monate.find(m=>q.monate.includes(m));
                          if(!reqMonth) return (
                            <td key={qi} colSpan={3} className={`px-2 py-1.5 text-center ${qi>0?"border-l border-border/20":""}`}>
                              <span className="text-border text-xs">—</span>
                            </td>
                          );
                          const monthKey = `${jwYear}-${String(reqMonth).padStart(2,"0")}`;
                          const entry = jEntryMap.get(`${item.key}__${monthKey}`);
                          const isFut = jwYear > now.getFullYear() || (jwYear===now.getFullYear()&&reqMonth>now.getMonth()+1);
                          const reqLabel = `${MONATE[reqMonth-1]} ${jwYear}`;
                          return (
                            <td key={qi} colSpan={3}
                              className={`px-2 py-1.5 ${qi>0?"border-l border-border/20":""}`}>
                              <button
                                disabled={isFut||!!entry}
                                onClick={()=>!isFut&&!entry&&setSigning({itemKey:item.key,datum:`${jwYear}-${String(reqMonth).padStart(2,"0")}-01`,label:`${item.label} — ${q.label} (${reqLabel})`})}
                                className={`w-full h-10 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border
                                  ${entry
                                    ?"bg-green-100 border-green-300 cursor-default"
                                    :isFut
                                      ?"bg-gray-50 border-dashed border-gray-200 opacity-40 cursor-not-allowed"
                                      :"bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer active:scale-[0.98]"}`}>
                                {entry ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-green-600"/>
                                    <span className="text-[9px] text-green-700 font-mono">{entry.kuerzel}</span>
                                  </>
                                ) : isFut ? (
                                  <span className="text-[9px] text-gray-400">{q.label}</span>
                                ) : (
                                  <>
                                    <span className="text-red-500 font-black text-sm">!</span>
                                    <span className="text-[9px] text-red-400">{reqLabel}</span>
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })

                        /* ── Halbjahr-Rendering (2 × colspan=6) ── */
                        : item.halbjahr ? HALBJAHRE.map((h,hi)=>{
                          const reqMonth = item.monate.find(m=>h.monate.includes(m));
                          if(!reqMonth) return (
                            <td key={hi} colSpan={6} className={`px-2 py-1.5 text-center ${hi>0?"border-l border-border/20":""}`}>
                              <span className="text-border text-xs">—</span>
                            </td>
                          );
                          const monthKey = `${jwYear}-${String(reqMonth).padStart(2,"0")}`;
                          const entry = jEntryMap.get(`${item.key}__${monthKey}`);
                          const isFut = jwYear>now.getFullYear()||(jwYear===now.getFullYear()&&reqMonth>now.getMonth()+1);
                          const reqLabel = `${MONATE[reqMonth-1]} ${jwYear}`;
                          return (
                            <td key={hi} colSpan={6}
                              className={`px-2 py-1.5 ${hi>0?"border-l border-border/20":""}`}>
                              <button
                                disabled={isFut||!!entry}
                                onClick={()=>!isFut&&!entry&&setSigning({itemKey:item.key,datum:`${jwYear}-${String(reqMonth).padStart(2,"0")}-01`,label:`${item.label} — ${h.short} (${reqLabel})`})}
                                className={`w-full h-10 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border
                                  ${entry
                                    ?"bg-green-100 border-green-300 cursor-default"
                                    :isFut
                                      ?"bg-gray-50 border-dashed border-gray-200 opacity-40 cursor-not-allowed"
                                      :"bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer active:scale-[0.98]"}`}>
                                {entry ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-green-600"/>
                                    <span className="text-[9px] text-green-700 font-mono">{entry.kuerzel}</span>
                                    <span className="text-[8px] text-green-600">{h.label}</span>
                                  </>
                                ) : isFut ? (
                                  <span className="text-[10px] text-gray-400 font-semibold">{h.label}</span>
                                ) : (
                                  <>
                                    <span className="text-red-500 font-black text-sm">!</span>
                                    <span className="text-[9px] text-red-400">{reqLabel}</span>
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })

                        /* ── Monats-Rendering (12 × Einzelzellen) ── */
                        : MONATE.map((m,mi)=>{
                          const monthNum  = mi+1;
                          const isReq     = item.monate.includes(monthNum);
                          const monthKey  = `${jwYear}-${String(monthNum).padStart(2,"0")}`;
                          const entry     = jEntryMap.get(`${item.key}__${monthKey}`);
                          const isFut     = jwYear>now.getFullYear()||(jwYear===now.getFullYear()&&monthNum>now.getMonth()+1);
                          return (
                            <td key={mi} className={`px-0.5 py-1.5 text-center ${mi%3===0&&mi>0?"border-l border-border/20":""}`}>
                              {isReq ? (
                                <button
                                  disabled={isFut||!!entry}
                                  onClick={()=>!isFut&&!entry&&setSigning({itemKey:item.key,datum:`${jwYear}-${String(monthNum).padStart(2,"0")}-01`,label:`${item.label} — ${m} ${jwYear}`})}
                                  className={`w-11 h-8 rounded-lg text-xs font-bold transition-all mx-auto flex flex-col items-center justify-center border
                                    ${entry?"bg-green-100 border-green-300 cursor-default":
                                      isFut?"bg-gray-50 border-dashed border-gray-200 opacity-40 cursor-not-allowed":
                                      "bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer active:scale-95"}`}>
                                  {entry ? (
                                    <>
                                      <Check className="w-3 h-3 text-green-600"/>
                                      <span className="text-[8px] text-green-700 font-mono">{entry.kuerzel}</span>
                                    </>
                                  ) : isFut ? null : (
                                    <span className="text-red-400">!</span>
                                  )}
                                </button>
                              ) : (
                                <span className="text-border/60 text-xs">·</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 bg-secondary/30 border-t border-border/60 text-xs text-muted-foreground flex items-center gap-4">
                <span><span className="font-bold text-sky-600">Q1</span>=Jan–Mär &nbsp;<span className="font-bold text-emerald-600">Q2</span>=Apr–Jun &nbsp;<span className="font-bold text-amber-600">Q3</span>=Jul–Sep &nbsp;<span className="font-bold text-rose-600">Q4</span>=Okt–Dez</span>
                <span>·</span>
                <span>Pflichttermine mit PIN abzeichnen · Rot = offen · Grün = erledigt</span>
              </div>
            </div>
          </>
        )}

        {/* PIN Modal — Einzeln */}
        {signing&&<PinModal label={signing.label} onClose={()=>setSigning(null)} onConfirm={handleSign}/>}

        {/* PIN Modal — Tag abzeichnen */}
        {bulkDate&&(
          <PinModal
            label={`Alle ${dayOpenCounts[bulkDate]??0} offenen Positionen — alle Bereiche — ${new Date(bulkDate+"T12:00").toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"2-digit"})}`}
            onClose={()=>setBulkDate(null)}
            onConfirm={handleBulkSign}
          />
        )}

        {/* Confirm Delete */}
        {delId&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs space-y-4">
              <p className="font-bold">Eintrag löschen?</p>
              <div className="flex gap-3">
                <button onClick={()=>setDelId(null)} className="flex-1 py-2.5 rounded-xl border text-sm">Abbrechen</button>
                <button onClick={()=>handleDelete(delId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4"/>Löschen
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
