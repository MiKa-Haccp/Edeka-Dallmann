import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  CalendarCheck, ChevronLeft, CheckCircle2, X, Info, Pencil, Plus, Trash2,
  LayoutGrid, List, RefreshCw, AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function dateLabel(iso: string) {
  return new Date(iso+"T12:00:00").toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"});
}

interface Bereich {
  id:number; zone:string|null; farbe:string|null; name:string;
  beschreibung:string|null; intervallTage:number; reduzierungTage:number;
  entnahmeTage:number; sortOrder:number; aktiv:boolean;
}
interface Kontrolle {
  id:number; bereichId:number; datum:string;
  kuerzel:string|null; bemerkung:string|null; createdAt:string;
}
type SC = "heute"|"ok"|"bald"|"faellig"|"ueberfaellig"|"nie";

function calcSt(b:Bereich, lat:Kontrolle|undefined, today:string): SC {
  if(!lat) return "nie";
  if(lat.datum===today) return "heute";
  const ds=Math.floor((new Date(today+"T12:00:00").getTime()-new Date(lat.datum+"T12:00:00").getTime())/86400000);
  if(ds<=b.intervallTage) return "ok";
  if(ds<=b.intervallTage*1.5) return "bald";
  if(ds<=b.intervallTage*2.5) return "faellig";
  return "ueberfaellig";
}

const ST: Record<SC,{fill:string;stroke:string;text:string;label:string;dot:string;pri:number}> = {
  heute:        {fill:"#bbf7d0",stroke:"#16a34a",text:"#15803d",label:"Heute OK",      dot:"#16a34a",pri:0},
  ok:           {fill:"#dcfce7",stroke:"#86efac",text:"#4b5563",label:"Im Intervall",  dot:"#4ade80",pri:1},
  bald:         {fill:"#fef9c3",stroke:"#facc15",text:"#854d0e",label:"Bald faellig",  dot:"#eab308",pri:2},
  faellig:      {fill:"#fed7aa",stroke:"#f97316",text:"#9a3412",label:"Faellig",       dot:"#f97316",pri:3},
  ueberfaellig: {fill:"#fecaca",stroke:"#ef4444",text:"#991b1b",label:"Ueberfaellig", dot:"#ef4444",pri:4},
  nie:          {fill:"#fca5a5",stroke:"#dc2626",text:"#7f1d1d",label:"Nie geprueft",  dot:"#dc2626",pri:5},
};

// Default-Farben pro Typ (wenn Status noch nicht bekannt / kein Bereich)
const TYPE_COLORS = {
  kuehl:   {fill:"#dbeafe",stroke:"#93c5fd",text:"#1e40af"},
  regal:   {fill:"#f1f5f9",stroke:"#94a3b8",text:"#334155"},
  tk:      {fill:"#ede9fe",stroke:"#c4b5fd",text:"#4c1d95"},
};

// ─── Ladenplan Leeder ─────────────────────────────────────────────────────────
interface PlanZone {
  name: string;
  x: number; y: number; w: number; h: number;
  type: "kuehl"|"regal"|"tk";
  rotateText?: boolean;
  rx?: number;
}

// SVG ViewBox: 0 0 1380 750
const VW = 1380;
const VH = 750;

// Getränkemarkt (links): x 0-245
// Gelbe Trennlinie: x 245-260
// Hauptmarkt: x 260-1380

const PLAN_ZONES: PlanZone[] = [
  // ── Getränkemarkt (links, 6 KR-Reihen) ──────────────────────────────────
  { name:"KR Getränke 1", x:14, y:68,  w:222, h:46, type:"kuehl", rx:5 },
  { name:"KR Getränke 2", x:14, y:140, w:222, h:46, type:"kuehl", rx:5 },
  { name:"KR Getränke 3", x:14, y:212, w:222, h:46, type:"kuehl", rx:5 },
  { name:"KR Getränke 4", x:14, y:284, w:222, h:46, type:"kuehl", rx:5 },
  { name:"KR Getränke 5", x:14, y:356, w:222, h:46, type:"kuehl", rx:5 },
  { name:"KR Getränke 6", x:14, y:428, w:222, h:46, type:"kuehl", rx:5 },

  // ── Meges Kühlregal (oben rechts, 12,55 m) ────────────────────────────
  { name:"Meges Kühlregal", x:658, y:12, w:707, h:38, type:"kuehl", rx:4 },

  // ── Sonderregale (oben Mitte) ─────────────────────────────────────────
  { name:"Sonderregal A", x:275, y:68, w:78, h:68, type:"regal", rx:4 },
  { name:"Sonderregal B", x:368, y:68, w:78, h:68, type:"regal", rx:4 },

  // ── TK-Inseln (3x horizontal, Mitte-links) ────────────────────────────
  { name:"TK-Insel 1", x:275, y:190, w:318, h:55, type:"tk", rx:5 },
  { name:"TK-Insel 2", x:275, y:297, w:318, h:55, type:"tk", rx:5 },
  { name:"TK-Insel 3", x:275, y:404, w:318, h:55, type:"tk", rx:5 },

  // ── Rechte Regalreihen (9 vertikale Spalten) ──────────────────────────
  // Spalte 1: x=660 → Regal 1
  { name:"Regal 1",     x:660, y:65, w:48, h:538, type:"regal", rotateText:true, rx:3 },
  // Spalte 2: x=720 → Regal 2
  { name:"Regal 2",     x:720, y:65, w:48, h:538, type:"regal", rotateText:true, rx:3 },
  // Spalte 3: x=780 → Kühlregal 1
  { name:"Kühlregal 1", x:780, y:65, w:48, h:538, type:"kuehl", rotateText:true, rx:3 },
  // Spalte 4: x=840 → Regal 3
  { name:"Regal 3",     x:840, y:65, w:48, h:538, type:"regal", rotateText:true, rx:3 },
  // Spalte 5: x=900 → Regal 4
  { name:"Regal 4",     x:900, y:65, w:48, h:538, type:"regal", rotateText:true, rx:3 },
  // Spalte 6: x=960 → Kühlregal 2
  { name:"Kühlregal 2", x:960, y:65, w:48, h:538, type:"kuehl", rotateText:true, rx:3 },
  // Spalte 7: x=1020 → Regal 5
  { name:"Regal 5",     x:1020, y:65, w:48, h:538, type:"regal", rotateText:true, rx:3 },
  // Spalte 8: x=1080 → Regal 6
  { name:"Regal 6",     x:1080, y:65, w:48, h:538, type:"regal", rotateText:true, rx:3 },
  // Spalte 9: x=1140 → Kühlregal 3 (Wurst/Käse/Fleisch)
  { name:"Kühlregal 3", x:1140, y:65, w:48, h:538, type:"kuehl", rotateText:true, rx:3 },

  // ── BB Wurst Kühlregal (unten rechts, 8,00 m) ─────────────────────────
  { name:"BB Wurst Kühlregal", x:1205, y:65, w:162, h:538, type:"kuehl", rotateText:true, rx:3 },

  // ── Kühlregal Kasse (unten Mitte) ────────────────────────────────────
  { name:"Kühlregal Kasse", x:275, y:690, w:188, h:33, type:"kuehl", rx:4 },
];

interface EditFS { name:string; beschreibung:string; zone:string; intervallTage:number; reduzierungTage:number; entnahmeTage:number; }

// ─── Component ────────────────────────────────────────────────────────────────
export default function WareMHD() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = !!adminSession;
  const today = todayIso();

  const [bereiche, setBereiche]     = useState<Bereich[]>([]);
  const [kontrollen, setKontrollen] = useState<Kontrolle[]>([]);
  const [loading, setLoading]       = useState(true);
  const [seeding, setSeeding]       = useState(false);
  const [view, setView]             = useState<"plan"|"liste">("plan");
  const [hoverId, setHoverId]       = useState<string|null>(null);
  const [marking, setMarking]       = useState<number|null>(null);
  const [markK, setMarkK]           = useState("");
  const [markB, setMarkB]           = useState("");
  const [editingId, setEditingId]   = useState<number|null>(null);
  const [editState, setEditState]   = useState<EditFS>({name:"",beschreibung:"",zone:"",intervallTage:1,reduzierungTage:3,entnahmeTage:1});
  const [editSaving, setEditSaving] = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [newState, setNewState]     = useState<EditFS>({name:"",beschreibung:"",zone:"",intervallTage:1,reduzierungTage:3,entnahmeTage:1});
  const [newSaving, setNewSaving]   = useState(false);

  const loadB = useCallback(async()=>{
    if(!selectedMarketId)return;
    const r=await fetch(`${BASE}/ware-mhd-bereiche?marketId=${selectedMarketId}`);
    setBereiche(await r.json());
  },[selectedMarketId]);

  const loadK = useCallback(async()=>{
    if(!selectedMarketId)return;
    try{const r=await fetch(`${BASE}/ware-mhd-kontrollen?marketId=${selectedMarketId}`);setKontrollen(await r.json());}
    finally{setLoading(false);}
  },[selectedMarketId]);

  useEffect(()=>{loadB();loadK();},[loadB,loadK]);

  // Auto-seed wenn keine Bereiche vorhanden
  useEffect(()=>{
    if(!loading && bereiche.length===0 && selectedMarketId){
      handleSeed();
    }
  },[loading, bereiche.length, selectedMarketId]);

  const handleSeed = async() => {
    if(!selectedMarketId)return;
    setSeeding(true);
    try{
      await fetch(`${BASE}/ware-mhd-seed`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({marketId:selectedMarketId})});
      await loadB();
    }finally{setSeeding(false);}
  };

  // Map name → Bereich
  const byName = useMemo(()=>{
    const m=new Map<string,Bereich>();
    for(const b of bereiche) m.set(b.name,b);
    return m;
  },[bereiche]);

  const latM = useMemo(()=>{
    const m=new Map<number,Kontrolle>();
    for(const k of kontrollen){const e=m.get(k.bereichId);if(!e||k.datum>e.datum)m.set(k.bereichId,k);}
    return m;
  },[kontrollen]);

  const todayS = useMemo(()=>new Set(kontrollen.filter(k=>k.datum===today).map(k=>k.bereichId)),[kontrollen,today]);

  const stats = useMemo(()=>{
    let ok=0,w=0,d=0,n=0;
    for(const b of bereiche){const s=calcSt(b,latM.get(b.id),today);if(s==="heute"||s==="ok")ok++;else if(s==="bald")w++;else if(s==="faellig"||s==="ueberfaellig")d++;else n++;}
    return {ok,w,d,n,t:bereiche.length};
  },[bereiche,latM,today]);

  const handleToggle = async(b:Bereich)=>{
    if(todayS.has(b.id)){
      await fetch(`${BASE}/ware-mhd-kontrollen`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({marketId:selectedMarketId,bereichId:b.id,datum:today})});
      await loadK();
    } else { setMarking(b.id);setMarkK("");setMarkB(""); }
  };
  const handleMark = async()=>{
    if(!marking)return;
    await fetch(`${BASE}/ware-mhd-kontrollen`,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({marketId:selectedMarketId,bereichId:marking,datum:today,kuerzel:markK.trim().toUpperCase()||null,bemerkung:markB.trim()||null})});
    setMarking(null);await loadK();
  };
  const startEdit=(b:Bereich)=>{setEditingId(b.id);setEditState({name:b.name,beschreibung:b.beschreibung||"",zone:b.zone||"",intervallTage:b.intervallTage,reduzierungTage:b.reduzierungTage,entnahmeTage:b.entnahmeTage});};
  const saveEdit=async()=>{if(!editingId)return;setEditSaving(true);try{await fetch(`${BASE}/ware-mhd-bereiche/${editingId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...editState,beschreibung:editState.beschreibung.trim()||null,zone:editState.zone.trim()||null})});setEditingId(null);await loadB();}finally{setEditSaving(false);}};
  const delB=async(id:number)=>{await fetch(`${BASE}/ware-mhd-bereiche/${id}`,{method:"DELETE"});setEditingId(null);await loadB();};
  const saveNew=async()=>{if(!newState.name.trim())return;setNewSaving(true);try{await fetch(`${BASE}/ware-mhd-bereiche`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({marketId:selectedMarketId,...newState,beschreibung:newState.beschreibung.trim()||null,zone:newState.zone.trim()||null,sortOrder:bereiche.length+10})});setShowNew(false);setNewState({name:"",beschreibung:"",zone:"",intervallTage:1,reduzierungTage:3,entnahmeTage:1});await loadB();}finally{setNewSaving(false);}};

  const allZones = useMemo(()=>Array.from(new Set(bereiche.map(b=>b.zone||""))).filter(Boolean).sort(),[bereiche]);
  const markedBer  = bereiche.find(b=>b.id===marking);
  const editBer    = bereiche.find(b=>b.id===editingId);
  const hoverZone  = hoverId ? PLAN_ZONES.find(z=>z.name===hoverId) : null;
  const hoverBer   = hoverId ? byName.get(hoverId) : null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/ware" className="p-2 rounded-xl hover:bg-secondary text-muted-foreground"><ChevronLeft className="w-5 h-5"/></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">MHD Kontrolle — Leeder</h1>
            <p className="text-sm text-muted-foreground">Bereich im Plan anklicken zum Kontrollieren</p>
          </div>
          <div className="flex gap-1.5">
            {isAdmin && (
              <button onClick={handleSeed} disabled={seeding}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-bold border border-amber-300 disabled:opacity-60">
                <RefreshCw className={`w-4 h-4 ${seeding?"animate-spin":""}`}/>Neu laden
              </button>
            )}
            <button onClick={()=>setView("plan")} className={`p-2 rounded-xl ${view==="plan"?"bg-[#1a3a6b] text-white":"bg-secondary text-muted-foreground"}`}><LayoutGrid className="w-4 h-4"/></button>
            <button onClick={()=>setView("liste")} className={`p-2 rounded-xl ${view==="liste"?"bg-[#1a3a6b] text-white":"bg-secondary text-muted-foreground"}`}><List className="w-4 h-4"/></button>
          </div>
        </div>

        {/* Status-Leiste */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm px-4 py-3">
          <div className="flex flex-wrap gap-4 items-center">
            <SB c="#16a34a" v={stats.ok}  l="Aktuell"/>
            <SB c="#eab308" v={stats.w}   l="Bald faellig"/>
            <SB c="#f97316" v={stats.d}   l="Ueberfaellig"/>
            <SB c="#dc2626" v={stats.n}   l="Nie geprueft" p/>
            <div className="ml-auto text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{todayS.size}</span>/{stats.t} heute
            </div>
          </div>
          {stats.t>0&&(
            <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500 transition-all" style={{width:`${(stats.ok/stats.t)*100}%`}}/>
              <div className="h-full bg-yellow-400 transition-all" style={{width:`${(stats.w/stats.t)*100}%`}}/>
              <div className="h-full bg-red-500 transition-all" style={{width:`${((stats.d+stats.n)/stats.t)*100}%`}}/>
            </div>
          )}
        </div>

        {/* ═══ PLAN VIEW ═══════════════════════════════════════════════════════ */}
        {view==="plan"&&(
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-3">
            {/* Legende */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 px-1">
              {(Object.entries(ST) as [SC,typeof ST[SC]][]).map(([k,v])=>(
                <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-3 rounded-sm border" style={{background:v.fill,borderColor:v.stroke}}/>{v.label}
                </span>
              ))}
            </div>

            {loading||seeding ? (
              <div className="flex items-center justify-center h-80 text-muted-foreground animate-pulse">
                {seeding?"Initialisiere Plan...":"Lade..."}
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <svg
                  viewBox={`0 0 ${VW} ${VH}`}
                  className="w-full"
                  style={{minWidth:700,maxWidth:1380,borderRadius:10,background:"#f8fafc",border:"1px solid #e2e8f0"}}
                >
                  {/* ── Store-Umrandung ──────────────────────────────────────── */}
                  <rect x="1" y="1" width={VW-2} height={VH-2} rx="6" fill="none" stroke="#64748b" strokeWidth="2"/>

                  {/* ── Getränkemarkt Hintergrund ────────────────────────────── */}
                  <rect x="0" y="0" width="248" height={VH} rx="6" fill="#fef2f2" opacity="0.6"/>
                  <text x="124" y="28" textAnchor="middle" fontSize="9" fill="#b91c1c" fontWeight="700">KR Getränke</text>
                  <text x="124" y="40" textAnchor="middle" fontSize="8" fill="#b91c1c" opacity="0.7">Getränkemarkt</text>

                  {/* ── Gelbe Trennlinie ─────────────────────────────────────── */}
                  <rect x="248" y="0" width="14" height={VH} fill="#fde047" opacity="0.85"/>

                  {/* ── Hauptmarkt Hintergrund ───────────────────────────────── */}
                  <rect x="262" y="0" width={VW-263} height={VH} fill="#f8fafc"/>

                  {/* ── Meges Beschriftung ───────────────────────────────────── */}
                  <text x="1012" y="10" textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="700">Meges Kühlregal · 12,55 m</text>

                  {/* ── TK-Insel Beschriftungen ──────────────────────────────── */}
                  <text x="595" y="185" textAnchor="middle" fontSize="8" fill="#6d28d9">TK-Insel · 9,80 m</text>
                  <text x="595" y="292" textAnchor="middle" fontSize="8" fill="#6d28d9">TK-Insel · 9,80 m</text>
                  <text x="595" y="399" textAnchor="middle" fontSize="8" fill="#6d28d9">TK-Insel · 9,80 m</text>

                  {/* ── Dekorative Service-Elemente (nicht interaktiv) ───────── */}
                  {/* Kassenbereich */}
                  <rect x="275" y="570" width="250" height="90" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,3"/>
                  <text x="400" y="620" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="700">Kassen</text>
                  {/* Käsegondeln / Servicetheke */}
                  <rect x="460" y="540" width="165" height="55" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5"/>
                  <text x="542" y="571" textAnchor="middle" fontSize="9" fill="#92400e" fontWeight="700">Käsegondeln</text>
                  {/* Zeitschriften */}
                  <rect x="460" y="490" width="95" height="38" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1"/>
                  <text x="507" y="513" textAnchor="middle" fontSize="8" fill="#64748b">Zeitschriften</text>
                  {/* Aktion */}
                  <rect x="460" y="470" width="95" height="12" rx="2" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="5,3"/>
                  {/* Kartoffelregal */}
                  <rect x="460" y="415" width="75" height="38" rx="4" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1"/>
                  <text x="497" y="438" textAnchor="middle" fontSize="8" fill="#713f12">Kartoffel</text>
                  {/* Aktionsbereich Mitte-rechts */}
                  <rect x="620" y="600" width="295" height="90" rx="6" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" strokeDasharray="5,3"/>
                  <text x="767" y="650" textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="600">Aktion</text>

                  {/* ── Bereichs-Beschriftungen rechte Regale ───────────────── */}
                  <text x="684" y="617" textAnchor="middle" fontSize="7.5" fill="#64748b">Wurst</text>
                  <text x="684" y="627" textAnchor="middle" fontSize="7.5" fill="#64748b">5,10m</text>
                  <text x="744" y="617" textAnchor="middle" fontSize="7.5" fill="#64748b">Wurst</text>
                  <text x="744" y="627" textAnchor="middle" fontSize="7.5" fill="#64748b">5,70m</text>
                  <text x="804" y="617" textAnchor="middle" fontSize="7.5" fill="#1d4ed8">Käse</text>
                  <text x="804" y="627" textAnchor="middle" fontSize="7.5" fill="#1d4ed8">5,10m</text>
                  <text x="864" y="617" textAnchor="middle" fontSize="7.5" fill="#64748b">Fleisch</text>
                  <text x="864" y="627" textAnchor="middle" fontSize="7.5" fill="#64748b">5,70m</text>
                  <text x="1284" y="617" textAnchor="middle" fontSize="7.5" fill="#b91c1c">BB Wurst</text>
                  <text x="1284" y="627" textAnchor="middle" fontSize="7.5" fill="#b91c1c">KR 8,00m</text>

                  {/* ── Schreinerei Vermerk ──────────────────────────────────── */}
                  <text x="1360" y="300" textAnchor="end" fontSize="7" fill="#94a3b8" transform="rotate(-90,1360,300)">Schreinerei</text>

                  {/* ── Interaktive Plan-Zonen ───────────────────────────────── */}
                  {PLAN_ZONES.map((zone)=>{
                    const b   = byName.get(zone.name);
                    const st  = b ? calcSt(b, latM.get(b.id), today) : null;
                    const m   = st ? ST[st] : null;
                    const def = TYPE_COLORS[zone.type];
                    const hov = hoverId===zone.name;
                    const done = b ? todayS.has(b.id) : false;

                    const fill   = m ? (hov ? m.stroke : m.fill) : (hov ? def.stroke : def.fill);
                    const stroke = m ? m.stroke : def.stroke;
                    const txtCol = m ? (hov ? "white" : m.text) : (hov ? "white" : def.text);

                    return (
                      <g key={zone.name}
                        style={{cursor: b ? "pointer" : "default"}}
                        onMouseEnter={()=>setHoverId(zone.name)}
                        onMouseLeave={()=>setHoverId(null)}
                        onClick={()=>{ if(b) handleToggle(b); }}>
                        <rect
                          x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                          rx={zone.rx??4}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={hov?2.5:1.5}
                          style={{transition:"all 0.12s"}}
                        />
                        {/* Status-Punkt (oben links) */}
                        {b && (
                          <circle
                            cx={zone.x+8} cy={zone.y+8} r="4.5"
                            fill={m?.dot ?? def.stroke}
                            stroke="white" strokeWidth="1"
                          />
                        )}
                        {/* Häkchen bei heute erledigt */}
                        {done && !zone.rotateText && (
                          <text x={zone.x+zone.w-8} y={zone.y+14}
                            textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="bold">
                            ✓
                          </text>
                        )}
                        {/* Label */}
                        {zone.rotateText ? (
                          <text
                            transform={`translate(${zone.x+zone.w/2} ${zone.y+zone.h/2}) rotate(-90)`}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize="10" fontWeight="700" fill={txtCol}
                            style={{pointerEvents:"none"}}>
                            {zone.name}{done?" ✓":""}
                          </text>
                        ) : (
                          <text
                            x={zone.x+zone.w/2} y={zone.y+zone.h/2+4}
                            textAnchor="middle" fontSize="10" fontWeight="700"
                            fill={txtCol} style={{pointerEvents:"none"}}>
                            {zone.name}{done?" ✓":""}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Wasserzeichen */}
                  <text x={VW/2} y={VH-6} textAnchor="middle" fontSize="8" fill="#94a3b8">
                    EDEKA DALLMANN · Leeder
                  </text>
                </svg>

                {/* Hover-Tooltip */}
                {hoverBer && (
                  <div className="absolute top-14 right-3 bg-white border border-border/60 rounded-xl shadow-lg p-3 z-10 min-w-44 pointer-events-none">
                    <p className="font-bold text-sm text-foreground">{hoverBer.name}</p>
                    {hoverBer.zone&&<p className="text-xs text-muted-foreground mb-1">{hoverBer.zone}</p>}
                    <div className="flex items-center gap-1.5 mb-1">
                      {(() => {
                        const st = calcSt(hoverBer, latM.get(hoverBer.id), today);
                        return <>
                          <span className="w-2 h-2 rounded-full" style={{background:ST[st].dot}}/>
                          <span className="text-xs font-semibold" style={{color:ST[st].text}}>{ST[st].label}</span>
                        </>;
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {latM.get(hoverBer.id) ? `Zuletzt: ${dateLabel(latM.get(hoverBer.id)!.datum)}${latM.get(hoverBer.id)!.kuerzel?` (${latM.get(hoverBer.id)!.kuerzel})`:""}`:"Noch nie kontrolliert"}
                    </p>
                    <p className="text-xs text-blue-500 mt-1 font-medium">Anklicken zum Kontrollieren</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ LIST VIEW ════════════════════════════════════════════════════════ */}
        {view==="liste"&&(
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden divide-y divide-border/40">
            {bereiche.slice().sort((a,b)=>{
              const pa=ST[calcSt(a,latM.get(a.id),today)].pri;
              const pb=ST[calcSt(b,latM.get(b.id),today)].pri;
              return pb-pa||a.sortOrder-b.sortOrder;
            }).map(b=>{
              const st=calcSt(b,latM.get(b.id),today);const m=ST[st];const lat=latM.get(b.id);
              return(
                <div key={b.id} className="flex items-center gap-3 px-4 py-3" style={{background:m.fill}}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:m.dot}}/>
                  <div className="w-1 h-7 rounded-full flex-shrink-0" style={{background:b.farbe||"#1a3a6b"}}/>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.zone}{b.beschreibung?` · ${b.beschreibung}`:""}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{color:m.text}}>{m.label}</p>
                    {lat?<p className="text-xs text-muted-foreground">{dateLabel(lat.datum)}{lat.kuerzel?` · ${lat.kuerzel}`:""}</p>:<p className="text-xs text-red-500">Nie</p>}
                  </div>
                  <button onClick={()=>handleToggle(b)} className="flex-shrink-0 p-2 rounded-xl border"
                    style={todayS.has(b.id)?{background:"#16a34a",borderColor:"#16a34a"}:{background:"white",borderColor:"#e5e7eb"}}>
                    {todayS.has(b.id)?<CheckCircle2 className="w-4 h-4 text-white"/>:<CalendarCheck className="w-4 h-4 text-gray-400"/>}
                  </button>
                  {isAdmin&&<button onClick={()=>startEdit(b)} className="flex-shrink-0 p-2 rounded-xl hover:bg-white/60 text-muted-foreground"><Pencil className="w-4 h-4"/></button>}
                </div>
              );
            })}
          </div>
        )}

        {/* Admin */}
        {isAdmin&&(
          <div className="space-y-3">
            <div className="flex gap-2">
              <button onClick={()=>setShowNew(!showNew)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold">
                <Plus className="w-4 h-4"/>Neuer Bereich
              </button>
              <button onClick={handleSeed} disabled={seeding}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 text-sm font-bold disabled:opacity-60">
                <AlertTriangle className="w-4 h-4"/>Plan zurücksetzen (Leeder)
              </button>
            </div>
            {showNew&&(
              <div className="bg-white rounded-2xl border-2 border-[#1a3a6b]/20 shadow-sm p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Name *" value={newState.name} onChange={e=>setNewState(p=>({...p,name:e.target.value}))} className="text-sm border border-border rounded-xl px-3 py-2.5"/>
                  <select value={newState.zone} onChange={e=>setNewState(p=>({...p,zone:e.target.value}))} className="text-sm border border-border rounded-xl px-3 py-2.5">
                    <option value="">Zone...</option>{allZones.map(z=><option key={z} value={z}>{z}</option>)}
                  </select>
                  <input placeholder="Beschreibung" value={newState.beschreibung} onChange={e=>setNewState(p=>({...p,beschreibung:e.target.value}))} className="col-span-2 text-sm border border-border rounded-xl px-3 py-2.5"/>
                </div>
                <IF state={newState} onChange={setNewState}/>
                <div className="flex gap-3">
                  <button onClick={()=>setShowNew(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-muted-foreground">Abbrechen</button>
                  <button onClick={saveNew} disabled={newSaving||!newState.name.trim()} className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50">{newSaving?"...":"Anlegen"}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mark Dialog */}
        {marking!==null&&markedBer&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <div><h3 className="font-bold text-lg">{markedBer.name}</h3><p className="text-xs text-muted-foreground">{markedBer.zone}</p></div>
                <button onClick={()=>setMarking(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4"/></button>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs space-y-1">
                <p className="font-bold text-blue-800 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/>MHD-Regeln</p>
                <p>Intervall: alle <strong>{markedBer.intervallTage}d</strong></p>
                <p className="text-amber-700">Reduzierung: &lt;{markedBer.reduzierungTage}d MHD</p>
                <p className="text-red-700">Entnahme: &lt;{markedBer.entnahmeTage}d MHD</p>
              </div>
              <input type="text" placeholder="Kuerzel (optional)" maxLength={5} value={markK} onChange={e=>setMarkK(e.target.value)}
                className="w-full text-sm border rounded-xl px-3 py-2.5 uppercase"/>
              <textarea rows={2} placeholder="Bemerkung (optional)" value={markB} onChange={e=>setMarkB(e.target.value)}
                className="w-full text-sm border rounded-xl px-3 py-2.5 resize-none"/>
              <div className="flex gap-3">
                <button onClick={()=>setMarking(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-muted-foreground">Abbrechen</button>
                <button onClick={handleMark} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm">
                  <CalendarCheck className="w-4 h-4"/>Kontrolliert
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        {editingId!==null&&editBer&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Bearbeiten</h3>
                <button onClick={()=>setEditingId(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4"/></button>
              </div>
              <input value={editState.name} onChange={e=>setEditState(p=>({...p,name:e.target.value}))} className="w-full text-sm border rounded-xl px-3 py-2.5" placeholder="Name"/>
              <input placeholder="Beschreibung" value={editState.beschreibung} onChange={e=>setEditState(p=>({...p,beschreibung:e.target.value}))} className="w-full text-sm border rounded-xl px-3 py-2.5"/>
              <IF state={editState} onChange={setEditState}/>
              <div className="flex gap-3">
                <button onClick={()=>setEditingId(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-muted-foreground">Abbrechen</button>
                <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold">{editSaving?"...":"Speichern"}</button>
              </div>
              <button onClick={()=>delB(editBer.id)} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50">
                <Trash2 className="w-4 h-4"/>Bereich loeschen
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── Sub-Komponenten ────────────────────────────────────────────────────────────
function SB({c,v,l,p}:{c:string;v:number;l:string;p?:boolean}) {
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <span className={`w-2.5 h-2.5 rounded-full${p?" animate-pulse":""}`} style={{background:c}}/>
      <strong className="text-foreground">{v}</strong>
      <span className="text-muted-foreground">{l}</span>
    </span>
  );
}

function IF({state,onChange}:{state:{intervallTage:number;reduzierungTage:number;entnahmeTage:number};onChange:(fn:(p:any)=>any)=>void}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {([["Intervall (Tage)","intervallTage"],["Reduzierung (Tage)","reduzierungTage"],["Entnahme (Tage)","entnahmeTage"]] as [string,string][]).map(([lbl,key])=>(
        <div key={key}>
          <label className="block text-xs text-muted-foreground mb-1">{lbl}</label>
          <input type="number" min={1} value={(state as any)[key]} onChange={e=>onChange(p=>({...p,[key]:Number(e.target.value)}))}
            className="w-full text-sm border border-border rounded-xl px-2 py-2 text-center"/>
        </div>
      ))}
    </div>
  );
}
