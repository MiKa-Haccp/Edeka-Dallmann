import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  CalendarCheck, ChevronLeft, CheckCircle2, AlertTriangle,
  Clock, X, Info, Pencil, Plus, Trash2, LayoutGrid, List,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function dateLabel(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit" });
}

interface Bereich {
  id: number; zone: string|null; farbe: string|null; name: string;
  beschreibung: string|null; intervallTage: number;
  reduzierungTage: number; entnahmeTage: number; sortOrder: number; aktiv: boolean;
}
interface Kontrolle {
  id: number; bereichId: number; datum: string;
  kuerzel: string|null; bemerkung: string|null; createdAt: string;
}
type StatusCode = "heute"|"ok"|"bald"|"faellig"|"ueberfaellig"|"nie";

function calcStatus(b: Bereich, latest: Kontrolle|undefined, today: string): StatusCode {
  if (!latest) return "nie";
  if (latest.datum === today) return "heute";
  const daysSince = Math.floor((new Date(today+"T12:00:00").getTime() - new Date(latest.datum+"T12:00:00").getTime()) / 86400000);
  if (daysSince <= b.intervallTage) return "ok";
  if (daysSince <= b.intervallTage * 1.5) return "bald";
  if (daysSince <= b.intervallTage * 2.5) return "faellig";
  return "ueberfaellig";
}

const ST: Record<StatusCode, { fill: string; stroke: string; text: string; label: string; dot: string; pri: number }> = {
  heute:        { fill:"#bbf7d0", stroke:"#16a34a", text:"#15803d", label:"Heute OK",     dot:"#16a34a", pri:0 },
  ok:           { fill:"#dcfce7", stroke:"#86efac", text:"#4b5563", label:"Im Intervall",  dot:"#4ade80", pri:1 },
  bald:         { fill:"#fef9c3", stroke:"#facc15", text:"#854d0e", label:"Bald faellig",  dot:"#eab308", pri:2 },
  faellig:      { fill:"#fed7aa", stroke:"#f97316", text:"#9a3412", label:"Faellig",       dot:"#f97316", pri:3 },
  ueberfaellig: { fill:"#fecaca", stroke:"#ef4444", text:"#991b1b", label:"Ueberfaellig", dot:"#ef4444", pri:4 },
  nie:          { fill:"#fca5a5", stroke:"#dc2626", text:"#7f1d1d", label:"Nie geprueft", dot:"#dc2626", pri:5 },
};

// ── SVG FLOOR PLAN SHAPES ──────────────────────────────────────────────────
// Each shape: clickable area + visual rects (double-gondola pairs)
// Coordinates in viewBox 0 0 1000 660
interface FloorShape {
  name: string; // must match DB bereich.name exactly
  cx: number; cy: number; cw: number; ch: number; // clickable area
  rects: Array<{ x:number; y:number; w:number; h:number }>; // visual rects
}

const FLOOR: FloorShape[] = [
  // ── GETRÄNKEMARKT ─────────────────────────────────────────────────────
  { name:"KVR Getraenke",
    cx:8, cy:8, cw:82, ch:85,
    rects:[{x:8,y:8,w:82,h:85}] },
  { name:"GM Regal 1",
    cx:10, cy:110, cw:218, ch:42,
    rects:[{x:10,y:110,w:218,h:18},{x:10,y:134,w:218,h:18}] },
  { name:"GM Regal 2",
    cx:10, cy:170, cw:218, ch:42,
    rects:[{x:10,y:170,w:218,h:18},{x:10,y:194,w:218,h:18}] },
  { name:"GM Regal 3",
    cx:10, cy:230, cw:218, ch:42,
    rects:[{x:10,y:230,w:218,h:18},{x:10,y:254,w:218,h:18}] },
  { name:"GM Regal 4",
    cx:10, cy:290, cw:218, ch:42,
    rects:[{x:10,y:290,w:218,h:18},{x:10,y:314,w:218,h:18}] },
  { name:"GM Regal 5",
    cx:10, cy:350, cw:218, ch:42,
    rects:[{x:10,y:350,w:218,h:18},{x:10,y:374,w:218,h:18}] },
  { name:"GM Regal 6",
    cx:10, cy:410, cw:218, ch:42,
    rects:[{x:10,y:410,w:218,h:18},{x:10,y:434,w:218,h:18}] },

  // ── KÜHLWAND (top of SB-Markt, horizontal, 5 sections) ───────────────
  { name:"Kuehlwand 1",
    cx:258, cy:8, cw:125, ch:42,
    rects:[{x:258,y:8,w:125,h:42}] },
  { name:"Kuehlwand 2",
    cx:388, cy:8, cw:125, ch:42,
    rects:[{x:388,y:8,w:125,h:42}] },
  { name:"Kuehlwand 3",
    cx:518, cy:8, cw:125, ch:42,
    rects:[{x:518,y:8,w:125,h:42}] },
  { name:"Kuehlwand 4",
    cx:648, cy:8, cw:125, ch:42,
    rects:[{x:648,y:8,w:125,h:42}] },
  { name:"Kuehlwand 5",
    cx:778, cy:8, cw:108, ch:42,
    rects:[{x:778,y:8,w:108,h:42}] },

  // ── TK INSELN (horizontal, 3 islands) ─────────────────────────────────
  { name:"TK Insel 1",
    cx:300, cy:132, cw:262, ch:35,
    rects:[{x:300,y:132,w:262,h:14},{x:300,y:153,w:262,h:14}] },
  { name:"TK Insel 2",
    cx:300, cy:188, cw:262, ch:35,
    rects:[{x:300,y:188,w:262,h:14},{x:300,y:209,w:262,h:14}] },
  { name:"TK Insel 3",
    cx:300, cy:244, cw:262, ch:35,
    rects:[{x:300,y:244,w:262,h:14},{x:300,y:265,w:262,h:14}] },

  // ── REGALGÄNGE vertikal (8 aisles, pairs) ─────────────────────────────
  { name:"Regal A",
    cx:585, cy:62, cw:32, ch:310,
    rects:[{x:585,y:62,w:13,h:310},{x:604,y:62,w:13,h:310}] },
  { name:"Regal B",
    cx:630, cy:62, cw:32, ch:310,
    rects:[{x:630,y:62,w:13,h:310},{x:649,y:62,w:13,h:310}] },
  { name:"Regal C",
    cx:675, cy:62, cw:32, ch:310,
    rects:[{x:675,y:62,w:13,h:310},{x:694,y:62,w:13,h:310}] },
  { name:"Regal D",
    cx:720, cy:62, cw:32, ch:310,
    rects:[{x:720,y:62,w:13,h:310},{x:739,y:62,w:13,h:310}] },
  { name:"Regal E",
    cx:765, cy:62, cw:32, ch:310,
    rects:[{x:765,y:62,w:13,h:310},{x:784,y:62,w:13,h:310}] },
  { name:"Regal F",
    cx:810, cy:62, cw:32, ch:310,
    rects:[{x:810,y:62,w:13,h:310},{x:829,y:62,w:13,h:310}] },
  { name:"Regal G",
    cx:855, cy:62, cw:32, ch:310,
    rects:[{x:855,y:62,w:13,h:310},{x:874,y:62,w:13,h:310}] },
  { name:"Regal H",
    cx:900, cy:62, cw:32, ch:310,
    rects:[{x:900,y:62,w:13,h:310},{x:919,y:62,w:13,h:310}] },

  // ── BEDIENUNGSTHEKE (curved counter area) ─────────────────────────────
  { name:"Bedienungstheke",
    cx:290, cy:390, cw:210, ch:70,
    rects:[{x:290,y:390,w:210,h:70}] },

  // ── EINGANGSBEREICH / UNTEN ───────────────────────────────────────────
  { name:"Gemuese / Obst",
    cx:258, cy:560, cw:115, ch:85,
    rects:[{x:258,y:560,w:115,h:85}] },
  { name:"Kuehlregal Eingang",
    cx:400, cy:615, cw:120, ch:30,
    rects:[{x:400,y:615,w:120,h:30}] },
  { name:"Tortibar",
    cx:530, cy:615, cw:170, ch:30,
    rects:[{x:530,y:615,w:170,h:30}] },
  { name:"SB Wurst KR",
    cx:810, cy:500, cw:130, ch:30,
    rects:[{x:810,y:500,w:130,h:30}] },
];

interface EditFormState { name: string; beschreibung: string; zone: string; intervallTage: number; reduzierungTage: number; entnahmeTage: number; }

export default function WareMHD() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = !!adminSession;
  const today = todayIso();

  const [bereiche, setBereiche]       = useState<Bereich[]>([]);
  const [kontrollen, setKontrollen]   = useState<Kontrolle[]>([]);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState<"plan"|"liste">("plan");
  const [hoverId, setHoverId]         = useState<number|null>(null);
  const [marking, setMarking]         = useState<number|null>(null);
  const [markKuerzel, setMarkKuerzel] = useState("");
  const [markBem, setMarkBem]         = useState("");
  const [editingId, setEditingId]     = useState<number|null>(null);
  const [editState, setEditState]     = useState<EditFormState>({ name:"", beschreibung:"", zone:"", intervallTage:1, reduzierungTage:3, entnahmeTage:1 });
  const [editSaving, setEditSaving]   = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [newState, setNewState]       = useState<EditFormState>({ name:"", beschreibung:"", zone:"", intervallTage:1, reduzierungTage:3, entnahmeTage:1 });
  const [newSaving, setNewSaving]     = useState(false);

  const loadBereiche = useCallback(async () => {
    if (!selectedMarketId) return;
    const r = await fetch(`${BASE}/ware-mhd-bereiche?marketId=${selectedMarketId}`);
    setBereiche(await r.json());
  }, [selectedMarketId]);

  const loadKontrollen = useCallback(async () => {
    if (!selectedMarketId) return;
    try {
      const r = await fetch(`${BASE}/ware-mhd-kontrollen?marketId=${selectedMarketId}`);
      setKontrollen(await r.json());
    } finally { setLoading(false); }
  }, [selectedMarketId]);

  useEffect(() => { loadBereiche(); loadKontrollen(); }, [loadBereiche, loadKontrollen]);

  const latestMap = useMemo(() => {
    const m = new Map<number, Kontrolle>();
    for (const k of kontrollen) {
      const ex = m.get(k.bereichId);
      if (!ex || k.datum > ex.datum) m.set(k.bereichId, k);
    }
    return m;
  }, [kontrollen]);

  const todaySet = useMemo(() => new Set(kontrollen.filter(k => k.datum === today).map(k => k.bereichId)), [kontrollen, today]);

  // Map floor shapes to DB bereiche by exact name
  const bereichByName = useMemo(() => {
    const m = new Map<string, Bereich>();
    for (const b of bereiche) m.set(b.name, b);
    return m;
  }, [bereiche]);

  const stats = useMemo(() => {
    let ok=0, warn=0, danger=0, none=0;
    for (const b of bereiche) {
      const s = calcStatus(b, latestMap.get(b.id), today);
      if (s==="heute"||s==="ok") ok++; else if (s==="bald") warn++;
      else if (s==="faellig"||s==="ueberfaellig") danger++; else none++;
    }
    return { ok, warn, danger, none, total: bereiche.length };
  }, [bereiche, latestMap, today]);

  const handleToggle = async (b: Bereich) => {
    if (todaySet.has(b.id)) {
      await fetch(`${BASE}/ware-mhd-kontrollen`, { method:"DELETE", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ marketId: selectedMarketId, bereichId: b.id, datum: today }) });
      await loadKontrollen();
    } else {
      setMarking(b.id); setMarkKuerzel(""); setMarkBem("");
    }
  };

  const handleMark = async () => {
    if (!marking) return;
    await fetch(`${BASE}/ware-mhd-kontrollen`, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ marketId:selectedMarketId, bereichId:marking, datum:today,
        kuerzel:markKuerzel.trim().toUpperCase()||null, bemerkung:markBem.trim()||null }) });
    setMarking(null); await loadKontrollen();
  };

  const startEdit = (b: Bereich) => {
    setEditingId(b.id);
    setEditState({ name:b.name, beschreibung:b.beschreibung||"", zone:b.zone||"", intervallTage:b.intervallTage, reduzierungTage:b.reduzierungTage, entnahmeTage:b.entnahmeTage });
  };

  const saveEdit = async () => {
    if (!editingId) return; setEditSaving(true);
    try {
      await fetch(`${BASE}/ware-mhd-bereiche/${editingId}`, { method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...editState, beschreibung:editState.beschreibung.trim()||null, zone:editState.zone.trim()||null }) });
      setEditingId(null); await loadBereiche();
    } finally { setEditSaving(false); }
  };

  const deleteBereich = async (id: number) => {
    await fetch(`${BASE}/ware-mhd-bereiche/${id}`, { method:"DELETE" }); setEditingId(null); await loadBereiche();
  };

  const saveNew = async () => {
    if (!newState.name.trim()) return; setNewSaving(true);
    try {
      await fetch(`${BASE}/ware-mhd-bereiche`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ marketId:selectedMarketId, ...newState, beschreibung:newState.beschreibung.trim()||null, zone:newState.zone.trim()||null, sortOrder:bereiche.length+10 }) });
      setShowNew(false); setNewState({ name:"", beschreibung:"", zone:"", intervallTage:1, reduzierungTage:3, entnahmeTage:1 }); await loadBereiche();
    } finally { setNewSaving(false); }
  };

  const allZones = useMemo(() => Array.from(new Set(bereiche.map(b=>b.zone||""))).filter(Boolean).sort(), [bereiche]);
  const markedB = bereiche.find(b => b.id === marking);
  const editB   = bereiche.find(b => b.id === editingId);
  const hoverB  = hoverId !== null ? bereiche.find(b => b.id === hoverId) : null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/ware" className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <ChevronLeft className="w-5 h-5"/>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">MHD Kontrolle</h1>
            <p className="text-sm text-muted-foreground">Interaktiver Ladenplan — Regalmeter anklicken</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={()=>setView("plan")} className={`p-2 rounded-xl transition-colors ${view==="plan"?"bg-[#1a3a6b] text-white":"bg-secondary text-muted-foreground"}`}>
              <LayoutGrid className="w-4 h-4"/></button>
            <button onClick={()=>setView("liste")} className={`p-2 rounded-xl transition-colors ${view==="liste"?"bg-[#1a3a6b] text-white":"bg-secondary text-muted-foreground"}`}>
              <List className="w-4 h-4"/></button>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm px-4 py-3">
          <div className="flex flex-wrap gap-4 items-center">
            <SBadge c="#16a34a" v={stats.ok} l="Aktuell"/>
            <SBadge c="#eab308" v={stats.warn} l="Bald faellig"/>
            <SBadge c="#f97316" v={stats.danger} l="Ueberfaellig"/>
            <SBadge c="#dc2626" v={stats.none} l="Nie geprueft" p/>
            <div className="ml-auto text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{todaySet.size}</span>/{stats.total} heute
            </div>
          </div>
          {stats.total > 0 && (
            <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500 transition-all" style={{width:`${(stats.ok/stats.total)*100}%`}}/>
              <div className="h-full bg-yellow-400 transition-all" style={{width:`${(stats.warn/stats.total)*100}%`}}/>
              <div className="h-full bg-red-500 transition-all" style={{width:`${((stats.danger+stats.none)/stats.total)*100}%`}}/>
            </div>
          )}
        </div>

        {/* ═══ PLAN VIEW ═══════════════════════════════════════════════════ */}
        {view === "plan" && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-3 overflow-x-auto">
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 px-1">
              {(Object.entries(ST) as [StatusCode,typeof ST[StatusCode]][]).map(([k,v])=>(
                <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-3 rounded-sm border" style={{background:v.fill,borderColor:v.stroke}}/>{v.label}
                </span>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">Lade Ladenplan...</div>
            ) : (
              <div className="relative">
                <svg viewBox="0 0 1000 660" className="w-full" style={{minWidth:560,maxWidth:1000,borderRadius:10,background:"#fafafa",border:"1px solid #e5e7eb"}}>
                  {/* ── STORE OUTLINE ─────────────────────────────── */}
                  <rect x="0" y="0" width="1000" height="660" rx="8" fill="none" stroke="#94a3b8" strokeWidth="2"/>

                  {/* ── GETRÄNKEMARKT background ──────────────────── */}
                  <rect x="3" y="3" width="235" height="654" rx="6" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1"/>
                  <text x="120" y="500" textAnchor="middle" fontSize="9" fill="#b91c1c" fontWeight="700" letterSpacing="0.8">GETRAENKEMARKT</text>
                  <text x="120" y="514" textAnchor="middle" fontSize="8" fill="#dc2626">366,44 m2</text>

                  {/* Pack/Lager decorative */}
                  <rect x="8" y="570" width="55" height="35" rx="3" fill="#fef2f2" stroke="#e5e7eb" strokeWidth="0.8"/>
                  <text x="35" y="590" textAnchor="middle" fontSize="6" fill="#9ca3af">Pack/Lager</text>

                  {/* ── SEPARATOR WALL ────────────────────────────── */}
                  <rect x="240" y="3" width="7" height="654" fill="#9ca3af"/>
                  {/* Door opening */}
                  <rect x="240" y="480" width="7" height="65" fill="#fafafa"/>
                  <line x1="240" y1="480" x2="247" y2="480" stroke="#9ca3af" strokeWidth="1.5"/>
                  <line x1="240" y1="545" x2="247" y2="545" stroke="#9ca3af" strokeWidth="1.5"/>

                  {/* ── SB-MARKT background ───────────────────────── */}
                  <rect x="250" y="3" width="747" height="654" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
                  <text x="530" y="78" textAnchor="middle" fontSize="8" fill="#94a3b8">Verkaufsbereich SB-Markt</text>

                  {/* Kühlwand label */}
                  <text x="530" y="22" textAnchor="middle" fontSize="7" fill="#0891b2" fontWeight="600" letterSpacing="0.5">HAUPTKUHLREGAL 12,585 m</text>

                  {/* ── DECORATIVE ELEMENTS ───────────────────────── */}
                  {/* Personal/Buero top-right */}
                  <rect x="908" y="8" width="85" height="60" rx="4" fill="#f0fdf4" stroke="#a7f3d0" strokeWidth="0.8"/>
                  <text x="950" y="36" textAnchor="middle" fontSize="7" fill="#047857">Personal</text>
                  <text x="950" y="48" textAnchor="middle" fontSize="7" fill="#047857">Buero</text>

                  {/* Schnellbäcker area (center bottom) */}
                  <rect x="430" y="430" width="110" height="55" rx="6" fill="#fef3c7" stroke="#fde68a" strokeWidth="0.8"/>
                  <text x="485" y="460" textAnchor="middle" fontSize="7" fill="#92400e">Schnellbaecker</text>

                  {/* Aktion area */}
                  <rect x="300" y="95" width="80" height="28" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5"/>
                  <text x="340" y="113" textAnchor="middle" fontSize="7" fill="#94a3b8">Aktion</text>

                  {/* Zeitschriften */}
                  <rect x="568" y="530" width="50" height="22" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5"/>
                  <text x="593" y="544" textAnchor="middle" fontSize="6" fill="#94a3b8">Zeitschr.</text>

                  {/* Kasse checkouts */}
                  {[0,1,2].map(i=>(
                    <rect key={`kasse${i}`} x={380+i*55} y={520} width={45} height={80} rx="3" fill="#fffbeb" stroke="#fde68a" strokeWidth="0.8"/>
                  ))}
                  <text x="435" y="565" textAnchor="middle" fontSize="8" fill="#92400e" fontWeight="600">KASSE</text>

                  {/* ── CLICKABLE SHELVES ─────────────────────────── */}
                  {FLOOR.map((shape, si) => {
                    const b = bereichByName.get(shape.name);
                    if (!b) return null;
                    const st = calcStatus(b, latestMap.get(b.id), today);
                    const m  = ST[st];
                    const isHov = hoverId === b.id;
                    const done  = todaySet.has(b.id);
                    const midX  = shape.cx + shape.cw/2;
                    const midY  = shape.cy + shape.ch/2;

                    return (
                      <g key={si}
                        style={{cursor:"pointer"}}
                        onMouseEnter={()=>setHoverId(b.id)}
                        onMouseLeave={()=>setHoverId(null)}
                        onClick={()=>handleToggle(b)}>
                        {/* Visual rects (gondola pairs) */}
                        {shape.rects.map((r,ri)=>(
                          <rect key={ri} x={r.x} y={r.y} width={r.w} height={r.h} rx="2.5"
                            fill={isHov ? m.stroke : m.fill}
                            stroke={m.stroke}
                            strokeWidth={isHov ? 2.2 : 1.2}
                            style={{transition:"all 0.1s"}}/>
                        ))}
                        {/* Invisible click area (covers entire shape) */}
                        <rect x={shape.cx} y={shape.cy} width={shape.cw} height={shape.ch} rx="2" fill="transparent"/>
                        {/* Status dot */}
                        <circle cx={shape.cx+7} cy={shape.cy+7} r="3.5"
                          fill={m.dot} stroke="white" strokeWidth="1"
                          className={st==="ueberfaellig"||st==="nie"?"animate-pulse":""}/>
                        {/* Checkmark if done today */}
                        {done && <text x={shape.cx+shape.cw-8} y={shape.cy+12} textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">✓</text>}
                        {/* Name label — only if enough space */}
                        {(shape.ch >= 30 && shape.cw >= 40) && (
                          <text x={midX} y={midY + (shape.ch>50?-2:2)} textAnchor="middle"
                            fontSize={shape.cw > 90 ? 9 : 7.5}
                            fill={isHov?"white":m.text}
                            fontWeight="600"
                            style={{pointerEvents:"none"}}>
                            {b.name.length > 20 ? b.name.substring(0,18)+"..." : b.name}
                          </text>
                        )}
                        {/* Vertical labels for tall narrow rects (Regalgänge) */}
                        {shape.ch > 100 && shape.cw < 40 && (
                          <text x={midX} y={midY}
                            textAnchor="middle" fontSize="8"
                            fill={isHov?"white":m.text}
                            fontWeight="600"
                            transform={`rotate(-90,${midX},${midY})`}
                            style={{pointerEvents:"none"}}>
                            {b.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Hover tooltip */}
                {hoverB && (
                  <div className="absolute top-2 right-2 bg-white border border-border/60 rounded-xl shadow-lg p-3 z-10 min-w-48 pointer-events-none">
                    <p className="font-bold text-sm text-foreground">{hoverB.name}</p>
                    {hoverB.beschreibung && <p className="text-xs text-muted-foreground">{hoverB.beschreibung}</p>}
                    <p className="text-xs text-muted-foreground mb-1">{hoverB.zone}</p>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full" style={{background:ST[calcStatus(hoverB, latestMap.get(hoverB.id), today)].dot}}/>
                      <span className="text-xs font-semibold" style={{color:ST[calcStatus(hoverB, latestMap.get(hoverB.id), today)].text}}>
                        {ST[calcStatus(hoverB, latestMap.get(hoverB.id), today)].label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {latestMap.get(hoverB.id) ? `Letzte Pruefung: ${dateLabel(latestMap.get(hoverB.id)!.datum)}${latestMap.get(hoverB.id)!.kuerzel ? ` (${latestMap.get(hoverB.id)!.kuerzel})` : ""}` : "Noch nie kontrolliert"}
                    </p>
                    <div className="text-xs mt-1 space-y-0.5">
                      <p>Intervall: <span className="font-semibold">{hoverB.intervallTage}d</span></p>
                      <p className="text-amber-600">Reduzierung: &lt;{hoverB.reduzierungTage}d MHD</p>
                      <p className="text-red-600">Entnahme: &lt;{hoverB.entnahmeTage}d MHD</p>
                    </div>
                    <p className="text-xs text-blue-500 mt-1.5 font-medium">Anklicken zum Kontrollieren</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ LIST VIEW ═══════════════════════════════════════════════════ */}
        {view === "liste" && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden divide-y divide-border/40">
            {bereiche.slice().sort((a,b) => {
              const pa = ST[calcStatus(a,latestMap.get(a.id),today)].pri;
              const pb = ST[calcStatus(b,latestMap.get(b.id),today)].pri;
              return pb-pa || a.sortOrder-b.sortOrder;
            }).map(b => {
              const st=calcStatus(b,latestMap.get(b.id),today); const m=ST[st]; const lat=latestMap.get(b.id);
              return (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3" style={{background:m.fill}}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:m.dot}}/>
                  <div className="w-1 h-7 rounded-full flex-shrink-0" style={{background:b.farbe||"#1a3a6b"}}/>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.zone}{b.beschreibung ? ` · ${b.beschreibung}` : ""}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{color:m.text}}>{m.label}</p>
                    {lat ? <p className="text-xs text-muted-foreground">{dateLabel(lat.datum)}{lat.kuerzel?` · ${lat.kuerzel}`:""}</p>
                          : <p className="text-xs text-red-500">Nie geprueft</p>}
                  </div>
                  <button onClick={()=>handleToggle(b)} className="flex-shrink-0 p-2 rounded-xl border transition-colors"
                    style={todaySet.has(b.id)?{background:"#16a34a",borderColor:"#16a34a"}:{background:"white",borderColor:"#e5e7eb"}}>
                    {todaySet.has(b.id)?<CheckCircle2 className="w-4 h-4 text-white"/>:<CalendarCheck className="w-4 h-4 text-gray-400"/>}
                  </button>
                  {isAdmin && <button onClick={()=>startEdit(b)} className="flex-shrink-0 p-2 rounded-xl hover:bg-white/60 text-muted-foreground"><Pencil className="w-4 h-4"/></button>}
                </div>
              );
            })}
          </div>
        )}

        {/* Admin: Neuer Bereich */}
        {isAdmin && (
          <div className="space-y-3">
            <button onClick={()=>setShowNew(!showNew)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 text-white text-sm font-bold">
              <Plus className="w-4 h-4"/> Neuer Regalbereich
            </button>
            {showNew && (
              <div className="bg-white rounded-2xl border-2 border-[#1a3a6b]/20 shadow-sm p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Name *" value={newState.name} onChange={e=>setNewState(p=>({...p,name:e.target.value}))}
                    className="text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"/>
                  <select value={newState.zone} onChange={e=>setNewState(p=>({...p,zone:e.target.value}))}
                    className="text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="">Zone wahlen...</option>
                    {allZones.map(z=><option key={z} value={z}>{z}</option>)}
                  </select>
                  <input placeholder="Beschreibung (optional)" value={newState.beschreibung} onChange={e=>setNewState(p=>({...p,beschreibung:e.target.value}))}
                    className="col-span-2 text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"/>
                </div>
                <IntFields state={newState} onChange={setNewState}/>
                <div className="flex gap-3">
                  <button onClick={()=>setShowNew(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground">Abbrechen</button>
                  <button onClick={saveNew} disabled={newSaving||!newState.name.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50">
                    {newSaving?"Speichern...":"Anlegen"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MARK DIALOG */}
        {marking!==null && markedB && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <div><h3 className="font-bold text-foreground">{markedB.name}</h3>
                  <p className="text-xs text-muted-foreground">{markedB.zone}{markedB.beschreibung ? ` · ${markedB.beschreibung}` : ""}</p></div>
                <button onClick={()=>setMarking(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4"/></button>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs space-y-1">
                <p className="font-bold text-blue-800 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> MHD-Regeln</p>
                <p className="text-muted-foreground">Intervall: alle <strong>{markedB.intervallTage} Tag(e)</strong></p>
                <p className="text-amber-700">Reduzierung: MHD &lt; <strong>{markedB.reduzierungTage} Tag(e)</strong></p>
                <p className="text-red-700">Entnahme: MHD &lt; <strong>{markedB.entnahmeTage} Tag(e)</strong></p>
              </div>
              <input type="text" placeholder="Kuerzel (optional)" maxLength={5} value={markKuerzel}
                onChange={e=>setMarkKuerzel(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"/>
              <textarea rows={2} placeholder="Bemerkung (optional)" value={markBem} onChange={e=>setMarkBem(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"/>
              <div className="flex gap-3">
                <button onClick={()=>setMarking(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground">Abbrechen</button>
                <button onClick={handleMark}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm">
                  <CalendarCheck className="w-4 h-4"/> Kontrolliert
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT DIALOG */}
        {editingId!==null && editB && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Bearbeiten</h3>
                <button onClick={()=>setEditingId(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4"/></button>
              </div>
              <input value={editState.name} onChange={e=>setEditState(p=>({...p,name:e.target.value}))}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Name"/>
              <input placeholder="Beschreibung (optional)" value={editState.beschreibung} onChange={e=>setEditState(p=>({...p,beschreibung:e.target.value}))}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"/>
              <IntFields state={editState} onChange={setEditState}/>
              <div className="flex gap-3">
                <button onClick={()=>setEditingId(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground">Abbrechen</button>
                <button onClick={saveEdit} disabled={editSaving}
                  className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50">{editSaving?"...":"Speichern"}</button>
              </div>
              <button onClick={()=>{if(confirm("Bereich loeschen?"))deleteBereich(editingId);}}
                className="w-full py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 border border-red-200 flex items-center justify-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5"/> Loeschen
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function SBadge({c,v,l,p}:{c:string;v:number;l:string;p?:boolean}) {
  return <div className="flex items-center gap-2">
    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${p&&v>0?"animate-pulse":""}`} style={{background:c}}/>
    <span className="font-bold text-foreground">{v}</span>
    <span className="text-xs text-muted-foreground">{l}</span>
  </div>;
}

function IntFields({state,onChange}:{state:{intervallTage:number;reduzierungTage:number;entnahmeTage:number};onChange:(s:any)=>void}) {
  return <div className="grid grid-cols-3 gap-2">
    <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Intervall (d)</label>
      <input type="number" min={1} value={state.intervallTage} onChange={e=>onChange({...state,intervallTage:Number(e.target.value)})}
        className="w-full border border-border rounded-xl px-2 py-2 text-sm bg-white focus:outline-none text-center"/></div>
    <div><label className="block text-xs font-semibold text-amber-600 mb-1">Reduz. (d)</label>
      <input type="number" min={0} value={state.reduzierungTage} onChange={e=>onChange({...state,reduzierungTage:Number(e.target.value)})}
        className="w-full border border-amber-200 rounded-xl px-2 py-2 text-sm bg-amber-50 focus:outline-none text-center"/></div>
    <div><label className="block text-xs font-semibold text-red-600 mb-1">Entnahme (d)</label>
      <input type="number" min={0} value={state.entnahmeTage} onChange={e=>onChange({...state,entnahmeTage:Number(e.target.value)})}
        className="w-full border border-red-200 rounded-xl px-2 py-2 text-sm bg-red-50 focus:outline-none text-center"/></div>
  </div>;
}
