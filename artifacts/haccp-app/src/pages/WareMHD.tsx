import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  CalendarCheck, ChevronLeft, CheckCircle2, X, Info, Pencil, Plus, Trash2, LayoutGrid, List, PenLine,
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

interface Bereich { id:number; zone:string|null; farbe:string|null; name:string; beschreibung:string|null; intervallTage:number; reduzierungTage:number; entnahmeTage:number; sortOrder:number; aktiv:boolean; }
interface Kontrolle { id:number; bereichId:number; datum:string; kuerzel:string|null; bemerkung:string|null; createdAt:string; }
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
  heute:       {fill:"#bbf7d0",stroke:"#16a34a",text:"#15803d",label:"Heute OK",    dot:"#16a34a",pri:0},
  ok:          {fill:"#dcfce7",stroke:"#86efac",text:"#4b5563",label:"Im Intervall", dot:"#4ade80",pri:1},
  bald:        {fill:"#fef9c3",stroke:"#facc15",text:"#854d0e",label:"Bald faellig", dot:"#eab308",pri:2},
  faellig:     {fill:"#fed7aa",stroke:"#f97316",text:"#9a3412",label:"Faellig",      dot:"#f97316",pri:3},
  ueberfaellig:{fill:"#fecaca",stroke:"#ef4444",text:"#991b1b",label:"Ueberfaellig",dot:"#ef4444",pri:4},
  nie:         {fill:"#fca5a5",stroke:"#dc2626",text:"#7f1d1d",label:"Nie geprueft",dot:"#dc2626",pri:5},
};

// ── DEMO: Meter-genaue Regalreihen ────────────────────────────────────────
// Jede Reihe definiert Position + Anzahl Meter
// Die Meter werden als Zellen gerendert, jede Zelle = 1 Bereich
interface ShelfRow {
  label: string;
  zone: string;
  meters: number;
  x: number; y: number;
  direction: "h"|"v";
  cellW: number; cellH: number;
  gap: number;
  color: string;
  labelPos: { x:number; y:number };
}

const DEMO_ROWS: ShelfRow[] = [
  // Kühlwand oben (horizontal, 5 Meter)
  { label:"Kuehlwand", zone:"Kuehlwand", meters:5,
    x:50, y:20, direction:"h", cellW:120, cellH:50, gap:4, color:"#0891b2",
    labelPos:{x:350,y:40} },
  // Regal 1 (horizontal, 10 Meter — Doppelgondel)
  { label:"Regal 1 · 10 Regalmeter", zone:"Regal 1", meters:10,
    x:50, y:110, direction:"h", cellW:65, cellH:65, gap:3, color:"#dc2626",
    labelPos:{x:400,y:130} },
  // Regal 2 (horizontal, 8 Meter — Kühlregal blau)
  { label:"Regal 2 · 8 Regalmeter", zone:"Regal 2", meters:8,
    x:50, y:230, direction:"h", cellW:80, cellH:65, gap:3, color:"#1d4ed8",
    labelPos:{x:370,y:250} },
];

interface EditFS { name:string; beschreibung:string; zone:string; intervallTage:number; reduzierungTage:number; entnahmeTage:number; }

export default function WareMHD() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = !!adminSession;
  const today = todayIso();

  const [bereiche, setBereiche]     = useState<Bereich[]>([]);
  const [kontrollen, setKontrollen] = useState<Kontrolle[]>([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState<"plan"|"liste">("plan");
  const [hoverId, setHoverId]       = useState<number|null>(null);
  const [marking, setMarking]       = useState<number|null>(null);
  const [markK, setMarkK]           = useState("");
  const [markB, setMarkB]           = useState("");
  const [editingId, setEditingId]   = useState<number|null>(null);
  const [editState, setEditState]   = useState<EditFS>({name:"",beschreibung:"",zone:"",intervallTage:1,reduzierungTage:3,entnahmeTage:1});
  const [editSaving, setEditSaving] = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [newState, setNewState]     = useState<EditFS>({name:"",beschreibung:"",zone:"",intervallTage:1,reduzierungTage:3,entnahmeTage:1});
  const [newSaving, setNewSaving]   = useState(false);

  const loadB = useCallback(async()=>{if(!selectedMarketId)return; const r=await fetch(`${BASE}/ware-mhd-bereiche?marketId=${selectedMarketId}`); setBereiche(await r.json());}, [selectedMarketId]);
  const loadK = useCallback(async()=>{if(!selectedMarketId)return; try{const r=await fetch(`${BASE}/ware-mhd-kontrollen?marketId=${selectedMarketId}`);setKontrollen(await r.json());}finally{setLoading(false);}}, [selectedMarketId]);
  useEffect(()=>{loadB();loadK();},[loadB,loadK]);

  const latM = useMemo(()=>{const m=new Map<number,Kontrolle>();for(const k of kontrollen){const e=m.get(k.bereichId);if(!e||k.datum>e.datum)m.set(k.bereichId,k);}return m;},[kontrollen]);
  const todayS = useMemo(()=>new Set(kontrollen.filter(k=>k.datum===today).map(k=>k.bereichId)),[kontrollen,today]);

  // Group bereiche by zone (for mapping to shelf rows)
  const byZone = useMemo(()=>{
    const m = new Map<string,Bereich[]>();
    for(const b of bereiche){
      const z=b.zone||""; if(!m.has(z))m.set(z,[]); m.get(z)!.push(b);
    }
    for(const arr of m.values()) arr.sort((a,b)=>a.sortOrder-b.sortOrder);
    return m;
  },[bereiche]);

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
  const markedBer = bereiche.find(b=>b.id===marking);
  const editBer = bereiche.find(b=>b.id===editingId);
  const hoverBer = hoverId!==null?bereiche.find(b=>b.id===hoverId):null;

  // Calculate SVG viewBox height dynamically
  const svgH = 340;
  const svgW = 750;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/ware" className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"><ChevronLeft className="w-5 h-5"/></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">MHD Kontrolle</h1>
            <p className="text-sm text-muted-foreground">Jeden Regalmeter einzeln anklicken</p>
          </div>
          <div className="flex gap-1.5">
            <Link href="/ladenplan-builder"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-bold border border-amber-300 transition-colors">
              <PenLine className="w-4 h-4"/> Plan bearbeiten
            </Link>
            <button onClick={()=>setView("plan")} className={`p-2 rounded-xl ${view==="plan"?"bg-[#1a3a6b] text-white":"bg-secondary text-muted-foreground"}`}><LayoutGrid className="w-4 h-4"/></button>
            <button onClick={()=>setView("liste")} className={`p-2 rounded-xl ${view==="liste"?"bg-[#1a3a6b] text-white":"bg-secondary text-muted-foreground"}`}><List className="w-4 h-4"/></button>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm px-4 py-3">
          <div className="flex flex-wrap gap-4 items-center">
            <SB c="#16a34a" v={stats.ok} l="Aktuell"/><SB c="#eab308" v={stats.w} l="Bald faellig"/><SB c="#f97316" v={stats.d} l="Ueberfaellig"/><SB c="#dc2626" v={stats.n} l="Nie geprueft" p/>
            <div className="ml-auto text-sm text-muted-foreground"><span className="font-bold text-foreground">{todayS.size}</span>/{stats.t} heute</div>
          </div>
          {stats.t>0&&<div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden flex">
            <div className="h-full bg-green-500" style={{width:`${(stats.ok/stats.t)*100}%`}}/>
            <div className="h-full bg-yellow-400" style={{width:`${(stats.w/stats.t)*100}%`}}/>
            <div className="h-full bg-red-500" style={{width:`${((stats.d+stats.n)/stats.t)*100}%`}}/>
          </div>}
        </div>

        {/* ═══ PLAN VIEW ═══════════════════════════════════════════════════ */}
        {view==="plan"&&(
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-3 overflow-x-auto">
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 px-1">
              {(Object.entries(ST) as [SC,typeof ST[SC]][]).map(([k,v])=>(
                <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-3 rounded-sm border" style={{background:v.fill,borderColor:v.stroke}}/>{v.label}
                </span>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">Lade...</div>
            ) : (
              <div className="relative">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{minWidth:500,maxWidth:900,borderRadius:10,background:"#fafafa",border:"1px solid #e5e7eb"}}>
                  {/* Background */}
                  <rect x="0" y="0" width={svgW} height={svgH} rx="8" fill="none" stroke="#94a3b8" strokeWidth="1.5"/>

                  {/* Render each shelf row */}
                  {DEMO_ROWS.map((row,ri)=>{
                    const items = byZone.get(row.zone) || [];
                    return (
                      <g key={ri}>
                        {/* Row label */}
                        <text x={row.labelPos.x} y={row.labelPos.y} fontSize="10" fill={row.color} fontWeight="700" dominantBaseline="middle">
                          {row.label}
                        </text>
                        {/* Shelf outline (decorative gondola) */}
                        <rect
                          x={row.x-3} y={row.y-3}
                          width={row.direction==="h" ? row.meters*(row.cellW+row.gap)+3 : row.cellW+6}
                          height={row.direction==="h" ? row.cellH+6 : row.meters*(row.cellH+row.gap)+3}
                          rx="5" fill="none" stroke={row.color} strokeWidth="1" strokeDasharray="4,3" opacity="0.35"
                        />
                        {/* Individual meter cells */}
                        {items.slice(0,row.meters).map((b,mi)=>{
                          const cx = row.direction==="h" ? row.x + mi*(row.cellW+row.gap) : row.x;
                          const cy = row.direction==="h" ? row.y : row.y + mi*(row.cellH+row.gap);
                          const st = calcSt(b, latM.get(b.id), today);
                          const m  = ST[st];
                          const isHov = hoverId===b.id;
                          const done  = todayS.has(b.id);

                          return (
                            <g key={b.id}
                              style={{cursor:"pointer"}}
                              onMouseEnter={()=>setHoverId(b.id)}
                              onMouseLeave={()=>setHoverId(null)}
                              onClick={()=>handleToggle(b)}>
                              {/* Cell rect */}
                              <rect
                                x={cx} y={cy} width={row.cellW} height={row.cellH} rx="4"
                                fill={isHov ? m.stroke : m.fill}
                                stroke={m.stroke}
                                strokeWidth={isHov?2.5:1.5}
                                style={{transition:"all 0.12s"}}
                              />
                              {/* Status dot */}
                              <circle cx={cx+9} cy={cy+9} r="4"
                                fill={m.dot} stroke="white" strokeWidth="1"
                                className={st==="ueberfaellig"||st==="nie"?"animate-pulse":""}
                              />
                              {/* Checkmark */}
                              {done && <text x={cx+row.cellW-9} y={cy+14} textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="bold">✓</text>}
                              {/* Meter number */}
                              <text x={cx+row.cellW/2} y={cy+row.cellH/2+2} textAnchor="middle" fontSize="14" fontWeight="700"
                                fill={isHov?"white":m.text} style={{pointerEvents:"none"}}>
                                {mi+1}
                              </text>
                              {/* Name below number */}
                              <text x={cx+row.cellW/2} y={cy+row.cellH/2+14} textAnchor="middle" fontSize="7"
                                fill={isHov?"white":"#9ca3af"} style={{pointerEvents:"none"}}>
                                {b.beschreibung || b.name.split(" ").pop()}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* Demo label */}
                  <text x={svgW/2} y={svgH-10} textAnchor="middle" fontSize="9" fill="#94a3b8">DEMO — Regalmeter-Ansicht</text>
                </svg>

                {/* Hover tooltip */}
                {hoverBer && (
                  <div className="absolute top-2 right-2 bg-white border border-border/60 rounded-xl shadow-lg p-3 z-10 min-w-44 pointer-events-none">
                    <p className="font-bold text-sm text-foreground">{hoverBer.name}</p>
                    {hoverBer.beschreibung && <p className="text-xs text-muted-foreground">{hoverBer.beschreibung}</p>}
                    <p className="text-xs text-muted-foreground mb-1">{hoverBer.zone}</p>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{background:ST[calcSt(hoverBer,latM.get(hoverBer.id),today)].dot}}/>
                      <span className="text-xs font-semibold" style={{color:ST[calcSt(hoverBer,latM.get(hoverBer.id),today)].text}}>
                        {ST[calcSt(hoverBer,latM.get(hoverBer.id),today)].label}
                      </span>
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

        {/* ═══ LIST VIEW ═══════════════════════════════════════════════════ */}
        {view==="liste"&&(
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden divide-y divide-border/40">
            {bereiche.slice().sort((a,b)=>{const pa=ST[calcSt(a,latM.get(a.id),today)].pri;const pb=ST[calcSt(b,latM.get(b.id),today)].pri;return pb-pa||a.sortOrder-b.sortOrder;}).map(b=>{
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
        {isAdmin&&<div className="space-y-3">
          <button onClick={()=>setShowNew(!showNew)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold"><Plus className="w-4 h-4"/>Neuer Bereich</button>
          {showNew&&<div className="bg-white rounded-2xl border-2 border-[#1a3a6b]/20 shadow-sm p-5 space-y-3">
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
          </div>}
        </div>}

        {/* Mark Dialog */}
        {marking!==null&&markedBer&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <div><h3 className="font-bold">{markedBer.name}</h3><p className="text-xs text-muted-foreground">{markedBer.zone}</p></div>
                <button onClick={()=>setMarking(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4"/></button>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs space-y-1">
                <p className="font-bold text-blue-800 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/>MHD-Regeln</p>
                <p>Intervall: alle <strong>{markedBer.intervallTage}d</strong></p>
                <p className="text-amber-700">Reduzierung: &lt;{markedBer.reduzierungTage}d MHD</p>
                <p className="text-red-700">Entnahme: &lt;{markedBer.entnahmeTage}d MHD</p>
              </div>
              <input type="text" placeholder="Kuerzel (optional)" maxLength={5} value={markK} onChange={e=>setMarkK(e.target.value)} className="w-full text-sm border rounded-xl px-3 py-2.5 uppercase"/>
              <textarea rows={2} placeholder="Bemerkung (optional)" value={markB} onChange={e=>setMarkB(e.target.value)} className="w-full text-sm border rounded-xl px-3 py-2.5 resize-none"/>
              <div className="flex gap-3">
                <button onClick={()=>setMarking(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-muted-foreground">Abbrechen</button>
                <button onClick={handleMark} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm"><CalendarCheck className="w-4 h-4"/>Kontrolliert</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        {editingId!==null&&editBer&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-bold">Bearbeiten</h3><button onClick={()=>setEditingId(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4"/></button></div>
              <input value={editState.name} onChange={e=>setEditState(p=>({...p,name:e.target.value}))} className="w-full text-sm border rounded-xl px-3 py-2.5" placeholder="Name"/>
              <input placeholder="Beschreibung" value={editState.beschreibung} onChange={e=>setEditState(p=>({...p,beschreibung:e.target.value}))} className="w-full text-sm border rounded-xl px-3 py-2.5"/>
              <IF state={editState} onChange={setEditState}/>
              <div className="flex gap-3">
                <button onClick={()=>setEditingId(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-muted-foreground">Abbrechen</button>
                <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50">{editSaving?"...":"Speichern"}</button>
              </div>
              <button onClick={()=>{if(confirm("Loeschen?"))delB(editingId);}} className="w-full py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 border border-red-200 flex items-center justify-center gap-1.5"><Trash2 className="w-3.5 h-3.5"/>Loeschen</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function SB({c,v,l,p}:{c:string;v:number;l:string;p?:boolean}){return<div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${p&&v>0?"animate-pulse":""}`} style={{background:c}}/><span className="font-bold text-foreground">{v}</span><span className="text-xs text-muted-foreground">{l}</span></div>;}
function IF({state,onChange}:{state:{intervallTage:number;reduzierungTage:number;entnahmeTage:number};onChange:(s:any)=>void}){return<div className="grid grid-cols-3 gap-2">
  <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Intervall</label><input type="number" min={1} value={state.intervallTage} onChange={e=>onChange({...state,intervallTage:Number(e.target.value)})} className="w-full border rounded-xl px-2 py-2 text-sm text-center"/></div>
  <div><label className="block text-xs font-semibold text-amber-600 mb-1">Reduz. (d)</label><input type="number" min={0} value={state.reduzierungTage} onChange={e=>onChange({...state,reduzierungTage:Number(e.target.value)})} className="w-full border border-amber-200 rounded-xl px-2 py-2 text-sm bg-amber-50 text-center"/></div>
  <div><label className="block text-xs font-semibold text-red-600 mb-1">Entnahme</label><input type="number" min={0} value={state.entnahmeTage} onChange={e=>onChange({...state,entnahmeTage:Number(e.target.value)})} className="w-full border border-red-200 rounded-xl px-2 py-2 text-sm bg-red-50 text-center"/></div>
</div>;}
