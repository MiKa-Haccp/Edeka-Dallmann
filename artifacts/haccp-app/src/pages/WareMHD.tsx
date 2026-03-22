import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  CalendarCheck, ChevronLeft, CheckCircle2, AlertTriangle,
  Clock, X, Info, Pencil, Check, Plus, Trash2, LayoutGrid, List,
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
  if (daysSince <= b.intervallTage)            return "ok";
  if (daysSince <= b.intervallTage * 1.5)      return "bald";
  if (daysSince <= b.intervallTage * 2.5)      return "faellig";
  return "ueberfaellig";
}

const STATUS: Record<StatusCode, { fill: string; stroke: string; text: string; label: string; dot: string; priority: number }> = {
  heute:        { fill:"#dcfce7", stroke:"#16a34a", text:"#15803d", label:"Heute OK",       dot:"#16a34a", priority:0 },
  ok:           { fill:"#f0fdf4", stroke:"#86efac", text:"#4b5563", label:"Im Intervall",    dot:"#4ade80", priority:1 },
  bald:         { fill:"#fefce8", stroke:"#fde047", text:"#854d0e", label:"Bald faellig",    dot:"#facc15", priority:2 },
  faellig:      { fill:"#fff7ed", stroke:"#fb923c", text:"#9a3412", label:"Faellig",         dot:"#f97316", priority:3 },
  ueberfaellig: { fill:"#fef2f2", stroke:"#f87171", text:"#991b1b", label:"Ueberfaellig",   dot:"#ef4444", priority:4 },
  nie:          { fill:"#fef2f2", stroke:"#dc2626", text:"#7f1d1d", label:"Nie geprueft",    dot:"#dc2626", priority:5 },
};

// ─── SVG floor plan shape definitions ───────────────────────────────────────
// Each shape maps to a Bereich by zone+sortOrder match
// rect: { x, y, w, h, label, angle? }
// Coordinates for viewBox="0 0 900 540"

interface ShapeDef { zoneKey: string; nameMatch: string; x: number; y: number; w: number; h: number; labelX?: number; labelY?: number; rotate?: number }

const SHAPES: ShapeDef[] = [
  // ── GETRÄNKEMARKT (left strip, x=5-188) ──────────────────────────────────
  { zoneKey:"Getraenkemarkt", nameMatch:"KVR",        x:5,   y:5,   w:183, h:48 },
  { zoneKey:"Getraenkemarkt", nameMatch:"Regal 1",    x:5,   y:62,  w:183, h:62 },
  { zoneKey:"Getraenkemarkt", nameMatch:"Regal 2",    x:5,   y:133, w:183, h:62 },
  { zoneKey:"Getraenkemarkt", nameMatch:"Regal 3",    x:5,   y:204, w:183, h:62 },
  { zoneKey:"Getraenkemarkt", nameMatch:"Regal 4",    x:5,   y:275, w:183, h:62 },
  { zoneKey:"Getraenkemarkt", nameMatch:"Regal 5",    x:5,   y:346, w:183, h:62 },
  { zoneKey:"Getraenkemarkt", nameMatch:"Regal 6",    x:5,   y:417, w:183, h:62 },

  // ── KÜHLREGAL WAND (top horizontal strip, x=202-800) ─────────────────────
  { zoneKey:"Kuehlregal Wand", nameMatch:"Joghurt",    x:202, y:5,  w:82, h:55 },
  { zoneKey:"Kuehlregal Wand", nameMatch:"Milch",      x:289, y:5,  w:82, h:55 },
  { zoneKey:"Kuehlregal Wand", nameMatch:"Kaese SB",   x:376, y:5,  w:82, h:55 },
  { zoneKey:"Kuehlregal Wand", nameMatch:"Frischkaese",x:463, y:5,  w:82, h:55 },
  { zoneKey:"Kuehlregal Wand", nameMatch:"Convenience",x:550, y:5,  w:82, h:55 },
  { zoneKey:"Kuehlregal Wand", nameMatch:"Wurst",      x:637, y:5,  w:82, h:55 },
  { zoneKey:"Kuehlregal Wand", nameMatch:"Fleisch",    x:724, y:5,  w:76, h:55 },

  // ── OBST & GEMÜSE (center-left, below separator) ─────────────────────────
  { zoneKey:"Obst & Gemuese", nameMatch:"Obst SB",    x:202, y:72, w:88, h:100 },
  { zoneKey:"Obst & Gemuese", nameMatch:"Gemuese",    x:296, y:72, w:88, h:100 },
  { zoneKey:"Obst & Gemuese", nameMatch:"Salate",     x:202, y:178, w:88, h:65 },

  // ── FEINKOST BEDIENUNG (center-left) ─────────────────────────────────────
  { zoneKey:"Feinkost Bedienung", nameMatch:"Kaese",   x:202, y:255, w:140, h:62 },
  { zoneKey:"Feinkost Bedienung", nameMatch:"Wurst",   x:202, y:323, w:140, h:62 },
  { zoneKey:"Feinkost Bedienung", nameMatch:"SB",      x:348, y:255, w:100, h:62 },
  { zoneKey:"Feinkost Bedienung", nameMatch:"Torti",   x:348, y:323, w:100, h:62 },

  // ── BACKWAREN (center-left, lower) ───────────────────────────────────────
  { zoneKey:"Backwaren", nameMatch:"Backshop",         x:202, y:398, w:120, h:65 },
  { zoneKey:"Backwaren", nameMatch:"Brot",             x:202, y:468, w:120, h:60 },
  { zoneKey:"Backwaren", nameMatch:"Feingebaeck",      x:202, y:533, w:120, h:0 }, // hidden — out of viewbox, will use below

  // ── TK INSELN (horizontal, center-right) ─────────────────────────────────
  { zoneKey:"Tiefkuehlung", nameMatch:"TK Insel 1",   x:460, y:255, w:290, h:40 },
  { zoneKey:"Tiefkuehlung", nameMatch:"TK Insel 2",   x:460, y:305, w:290, h:40 },
  { zoneKey:"Tiefkuehlung", nameMatch:"TK Insel 3",   x:460, y:355, w:290, h:40 },
];

// Fix Backwaren - replace the hidden one with proper position
const SHAPES_FINAL = SHAPES.map(s => {
  if (s.zoneKey === "Backwaren" && s.nameMatch === "Feingebaeck")
    return { ...s, x:328, y:398, w:120, h:65 };
  return s;
});

export default function WareMHD() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = !!adminSession;
  const today = todayIso();

  const [bereiche, setBereiche]   = useState<Bereich[]>([]);
  const [kontrollen, setKontrollen] = useState<Kontrolle[]>([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState<"plan"|"liste">("plan");

  // Tooltip/hover
  const [hoverId, setHoverId] = useState<number|null>(null);

  // Marking
  const [marking, setMarking]         = useState<number|null>(null);
  const [markKuerzel, setMarkKuerzel] = useState("");
  const [markBemerkung, setMarkBemerkung] = useState("");

  // Inline edit
  const [editingId, setEditingId]   = useState<number|null>(null);
  const [editState, setEditState]   = useState<EditFormState>({ name:"", beschreibung:"", zone:"", intervallTage:1, reduzierungTage:3, entnahmeTage:1 });
  const [editSaving, setEditSaving] = useState(false);

  // New bereich
  const [showNew, setShowNew]   = useState(false);
  const [newState, setNewState] = useState<EditFormState>({ name:"", beschreibung:"", zone:"", intervallTage:1, reduzierungTage:3, entnahmeTage:1 });
  const [newSaving, setNewSaving] = useState(false);

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

  // Match bereiche to SVG shapes by zone + partial name match
  const shapeBereichMap = useMemo(() => {
    const map = new Map<number, Bereich>(); // shapeIndex -> bereich
    const used = new Set<number>();
    SHAPES_FINAL.forEach((shape, si) => {
      const zone = shape.zoneKey;
      const nameHint = shape.nameMatch.toLowerCase();
      const candidates = bereiche.filter(b =>
        b.zone === zone && !used.has(b.id) &&
        (b.name.toLowerCase().includes(nameHint) || nameHint.includes(b.name.toLowerCase().split(" ")[0].toLowerCase()))
      );
      // Sort by sort_order to ensure stable matching
      candidates.sort((a, b) => a.sortOrder - b.sortOrder);
      if (candidates.length > 0) {
        map.set(si, candidates[0]);
        used.add(candidates[0].id);
      }
    });
    return map;
  }, [bereiche]);

  // Unmapped bereiche (shown in list below plan)
  const mappedIds = useMemo(() => new Set(Array.from(shapeBereichMap.values()).map(b => b.id)), [shapeBereichMap]);
  const unmappedBereiche = useMemo(() => bereiche.filter(b => !mappedIds.has(b.id)), [bereiche, mappedIds]);

  const stats = useMemo(() => {
    let ok=0, warning=0, danger=0, none=0;
    for (const b of bereiche) {
      const s = calcStatus(b, latestMap.get(b.id), today);
      if (s==="heute"||s==="ok") ok++;
      else if (s==="bald") warning++;
      else if (s==="faellig"||s==="ueberfaellig") danger++;
      else none++;
    }
    return { ok, warning, danger, none, gesamt: bereiche.length };
  }, [bereiche, latestMap, today]);

  const handleToggle = async (b: Bereich) => {
    if (todaySet.has(b.id)) {
      await fetch(`${BASE}/ware-mhd-kontrollen`, { method:"DELETE", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ marketId: selectedMarketId, bereichId: b.id, datum: today }) });
      await loadKontrollen();
    } else {
      setMarking(b.id); setMarkKuerzel(""); setMarkBemerkung("");
    }
  };

  const handleMark = async () => {
    if (!marking) return;
    await fetch(`${BASE}/ware-mhd-kontrollen`, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ marketId: selectedMarketId, bereichId: marking, datum: today,
        kuerzel: markKuerzel.trim().toUpperCase()||null, bemerkung: markBemerkung.trim()||null }) });
    setMarking(null);
    await loadKontrollen();
  };

  const startEdit = (b: Bereich) => {
    setEditingId(b.id);
    setEditState({ name:b.name, beschreibung:b.beschreibung||"", zone:b.zone||"", intervallTage:b.intervallTage, reduzierungTage:b.reduzierungTage, entnahmeTage:b.entnahmeTage });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditSaving(true);
    try {
      await fetch(`${BASE}/ware-mhd-bereiche/${editingId}`, { method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...editState, beschreibung:editState.beschreibung.trim()||null, zone:editState.zone.trim()||null }) });
      setEditingId(null);
      await loadBereiche();
    } finally { setEditSaving(false); }
  };

  const deleteBereich = async (id: number) => {
    await fetch(`${BASE}/ware-mhd-bereiche/${id}`, { method:"DELETE" });
    setEditingId(null);
    await loadBereiche();
  };

  const saveNew = async () => {
    if (!newState.name.trim()) return;
    setNewSaving(true);
    try {
      await fetch(`${BASE}/ware-mhd-bereiche`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ marketId:selectedMarketId, ...newState, beschreibung:newState.beschreibung.trim()||null, zone:newState.zone.trim()||null, sortOrder:bereiche.length+10 }) });
      setShowNew(false); setNewState({ name:"", beschreibung:"", zone:"", intervallTage:1, reduzierungTage:3, entnahmeTage:1 });
      await loadBereiche();
    } finally { setNewSaving(false); }
  };

  const allZones = useMemo(() => Array.from(new Set(bereiche.map(b=>b.zone||""))).filter(Boolean).sort(), [bereiche]);
  const markedBereich   = bereiche.find(b => b.id === marking);
  const hoverBereich    = hoverId !== null ? bereiche.find(b => b.id === hoverId) : undefined;
  const editBereich     = bereiche.find(b => b.id === editingId);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/ware" className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">MHD Kontrolle — Leeder</h1>
            <p className="text-sm text-muted-foreground">Interaktiver Ladenplan — Regalmeter anklicken zum Kontrollieren</p>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setView("plan")}
              className={`p-2 rounded-xl transition-colors ${view==="plan"?"bg-[#1a3a6b] text-white":"bg-secondary text-muted-foreground"}`}>
              <LayoutGrid className="w-4 h-4"/>
            </button>
            <button onClick={()=>setView("liste")}
              className={`p-2 rounded-xl transition-colors ${view==="liste"?"bg-[#1a3a6b] text-white":"bg-secondary text-muted-foreground"}`}>
              <List className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm px-5 py-3 flex flex-wrap gap-4 items-center">
          <StatBadge fill="#16a34a" value={stats.ok}      label="Aktuell" />
          <StatBadge fill="#facc15" value={stats.warning}  label="Bald faellig" />
          <StatBadge fill="#f97316" value={stats.danger}   label="Ueberfaellig" />
          <StatBadge fill="#dc2626" value={stats.none}     label="Nie geprueft" pulse />
          <div className="ml-auto text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{todaySet.size}</span>/{stats.gesamt} heute kontrolliert
          </div>
        </div>

        {/* ── FLOOR PLAN VIEW ─────────────────────────────────────────────── */}
        {view === "plan" && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-3 overflow-x-auto">

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 px-1">
              {(Object.entries(STATUS) as [StatusCode, typeof STATUS[StatusCode]][]).map(([k,v])=>(
                <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-3 rounded-sm border flex-shrink-0" style={{background:v.fill, borderColor:v.stroke}}/>
                  {v.label}
                </span>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm animate-pulse">Lade Ladenplan...</div>
            ) : (
              <div className="relative">
                {/* SVG Floor Plan */}
                <svg
                  viewBox="0 0 810 540"
                  className="w-full"
                  style={{ minWidth: 600, maxWidth: 900, border:"1px solid #e5e7eb", borderRadius:12, background:"#f9fafb" }}
                >
                  {/* ── Background zones ───────────────────────────────── */}
                  {/* Getränkemarkt background */}
                  <rect x="3" y="3" width="187" height="530" rx="6" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1.5"/>
                  <text x="96" y="492" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="bold">GETRAENKEMARKT</text>

                  {/* Main SB-Markt background */}
                  <rect x="196" y="3" width="608" height="530" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>

                  {/* Kühlregal zone label */}
                  <text x="462" y="21" textAnchor="middle" fontSize="9" fill="#0891b2" fontWeight="bold" letterSpacing="1">HAUPTKUHLREGAL (12,58 m)</text>

                  {/* Dry goods aisles (decorative) — center right */}
                  {[460,495,530,565,600,635,670,705].map((x,i)=>(
                    <rect key={i} x={x} y={72} width="28" height="240" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8"/>
                  ))}
                  <text x="613" y="200" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="500">Trocken</text>
                  <text x="613" y="212" textAnchor="middle" fontSize="9" fill="#94a3b8">sortiment</text>

                  {/* Kasse (decorative) */}
                  <rect x="330" y="455" width="120" height="70" rx="8" fill="#fef9c3" stroke="#fde047" strokeWidth="1.5"/>
                  <text x="390" y="488" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="bold">KASSE</text>
                  <text x="390" y="502" textAnchor="middle" fontSize="9" fill="#92400e">Zahlbereich</text>

                  {/* Personal/Buero (decorative, top right) */}
                  <rect x="740" y="3" width="67" height="65" rx="4" fill="#f0fdf4" stroke="#86efac" strokeWidth="1"/>
                  <text x="773" y="33" textAnchor="middle" fontSize="8" fill="#15803d">Personal</text>
                  <text x="773" y="45" textAnchor="middle" fontSize="8" fill="#15803d">Buero</text>

                  {/* Wall separator between Getränkemarkt and main */}
                  <rect x="192" y="3" width="6" height="530" rx="0" fill="#9ca3af"/>

                  {/* ── CLICKABLE SHELF SHAPES ─────────────────────────── */}
                  {SHAPES_FINAL.map((shape, si) => {
                    const bereich = shapeBereichMap.get(si);
                    if (!bereich || shape.w === 0 || shape.h === 0) return null;
                    const st     = calcStatus(bereich, latestMap.get(bereich.id), today);
                    const meta   = STATUS[st];
                    const isDone = todaySet.has(bereich.id);
                    const isHov  = hoverId === bereich.id;
                    const cx     = shape.x + shape.w / 2;
                    const cy     = shape.y + shape.h / 2;
                    const fontSize = shape.w > 70 ? 9 : 8;
                    const shortName = bereich.name.length > 18 ? bereich.name.substring(0,16)+"…" : bereich.name;
                    return (
                      <g key={si} style={{cursor:"pointer"}}
                        onMouseEnter={()=>setHoverId(bereich.id)}
                        onMouseLeave={()=>setHoverId(null)}
                        onClick={()=>handleToggle(bereich)}>
                        <rect
                          x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx="4"
                          fill={isHov ? meta.stroke : meta.fill}
                          stroke={meta.stroke}
                          strokeWidth={isHov ? 2.5 : 1.5}
                          opacity={isHov ? 0.95 : 1}
                          style={{transition:"all 0.12s"}}
                        />
                        {/* Status indicator dot */}
                        <circle cx={shape.x+8} cy={shape.y+8} r="4"
                          fill={meta.dot}
                          stroke="white" strokeWidth="1"
                          className={st==="ueberfaellig"||st==="nie" ? "animate-pulse" : ""}
                        />
                        {/* Done checkmark */}
                        {isDone && (
                          <text x={shape.x+shape.w-9} y={shape.y+12} textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">✓</text>
                        )}
                        {/* Name label */}
                        <text x={cx} y={cy + (shape.h > 45 ? -3 : 2)} textAnchor="middle" fontSize={fontSize} fill={isHov ? "white" : meta.text} fontWeight="600" style={{pointerEvents:"none"}}>
                          {shortName}
                        </text>
                        {/* Sub-line: Intervall + last check */}
                        {shape.h > 45 && (
                          <text x={cx} y={cy+12} textAnchor="middle" fontSize={7.5} fill={isHov ? "white" : "#6b7280"} style={{pointerEvents:"none"}}>
                            {latestMap.get(bereich.id) ? dateLabel(latestMap.get(bereich.id)!.datum) : "Nie geprueft"} · {bereich.intervallTage}d
                          </text>
                        )}
                        {/* MHD rules line */}
                        {shape.h > 55 && (
                          <text x={cx} y={cy+24} textAnchor="middle" fontSize={7} fill={isHov ? "white" : "#9ca3af"} style={{pointerEvents:"none"}}>
                            Reduz.&lt;{bereich.reduzierungTage}d · Entnahme&lt;{bereich.entnahmeTage}d
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* ── NORTH ARROW / compass ───────────────────────────── */}
                  <text x="790" y="530" fontSize="8" fill="#9ca3af" textAnchor="end">Ladenplan Leeder</text>
                </svg>

                {/* Hover tooltip */}
                {hoverBereich && (
                  <div className="absolute top-2 right-2 bg-white border border-border/60 rounded-xl shadow-lg p-3 z-10 min-w-48 pointer-events-none">
                    <p className="font-bold text-sm text-foreground">{hoverBereich.name}</p>
                    <p className="text-xs text-muted-foreground mb-1">{hoverBereich.zone}</p>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full" style={{background: STATUS[calcStatus(hoverBereich, latestMap.get(hoverBereich.id), today)].dot}}/>
                      <span className="text-xs font-semibold" style={{color: STATUS[calcStatus(hoverBereich, latestMap.get(hoverBereich.id), today)].text}}>
                        {STATUS[calcStatus(hoverBereich, latestMap.get(hoverBereich.id), today)].label}
                      </span>
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="text-muted-foreground">
                        Letzte Pruefung: <span className="font-medium text-foreground">
                          {latestMap.get(hoverBereich.id) ? `${dateLabel(latestMap.get(hoverBereich.id)!.datum)}${latestMap.get(hoverBereich.id)!.kuerzel ? ` · ${latestMap.get(hoverBereich.id)!.kuerzel}` : ""}` : "Noch nie"}
                        </span>
                      </p>
                      <p className="text-amber-600">Reduzierung ab &lt;{hoverBereich.reduzierungTage}d MHD</p>
                      <p className="text-red-600">Entnahme ab &lt;{hoverBereich.entnahmeTage}d MHD</p>
                    </div>
                    <p className="text-xs text-blue-500 mt-1.5 font-medium">Anklicken zum Kontrollieren</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── LIST VIEW ──────────────────────────────────────────────────── */}
        {view === "liste" && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="divide-y divide-border/40">
              {bereiche.slice().sort((a,b) => {
                const pa = STATUS[calcStatus(a, latestMap.get(a.id), today)].priority;
                const pb = STATUS[calcStatus(b, latestMap.get(b.id), today)].priority;
                return pb - pa || a.sortOrder - b.sortOrder;
              }).map(b => {
                const st   = calcStatus(b, latestMap.get(b.id), today);
                const meta = STATUS[st];
                const lat  = latestMap.get(b.id);
                return (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3" style={{background: meta.fill}}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background: meta.dot}}/>
                    <div className="w-1 h-7 rounded-full flex-shrink-0" style={{background: b.farbe || "#1a3a6b"}}/>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.zone} · Reduz.&lt;{b.reduzierungTage}d · Entnahme&lt;{b.entnahmeTage}d MHD</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold" style={{color: meta.text}}>{meta.label}</p>
                      {lat ? <p className="text-xs text-muted-foreground">{dateLabel(lat.datum)}{lat.kuerzel?` · ${lat.kuerzel}`:""}</p>
                            : <p className="text-xs text-red-500">Nie geprueft</p>}
                    </div>
                    <button onClick={()=>handleToggle(b)}
                      className="flex-shrink-0 p-2 rounded-xl border transition-colors"
                      style={todaySet.has(b.id) ? {background:"#16a34a", borderColor:"#16a34a"} : {background:"white", borderColor:"#e5e7eb"}}>
                      {todaySet.has(b.id) ? <CheckCircle2 className="w-4 h-4 text-white"/> : <CalendarCheck className="w-4 h-4 text-gray-400"/>}
                    </button>
                    {isAdmin && (
                      <button onClick={()=>startEdit(b)} className="flex-shrink-0 p-2 rounded-xl hover:bg-secondary text-muted-foreground">
                        <Pencil className="w-4 h-4"/>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="space-y-3">
            <button onClick={()=>setShowNew(!showNew)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 text-white text-sm font-bold">
              <Plus className="w-4 h-4"/> Neuer Regalbereich
            </button>
            {showNew && (
              <div className="bg-white rounded-2xl border-2 border-[#1a3a6b]/20 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-sm">Neuer Regalbereich</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Name *" value={newState.name} onChange={e=>setNewState(p=>({...p,name:e.target.value}))}
                    className="text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"/>
                  <select value={newState.zone} onChange={e=>setNewState(p=>({...p,zone:e.target.value}))}
                    className="text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="">Zone wahlen...</option>
                    {allZones.map(z=><option key={z} value={z}>{z}</option>)}
                  </select>
                  <input placeholder="Beschreibung" value={newState.beschreibung} onChange={e=>setNewState(p=>({...p,beschreibung:e.target.value}))}
                    className="col-span-2 text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"/>
                </div>
                <IntervalFields state={newState} onChange={setNewState}/>
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

        {/* ── MARK DIALOG ─────────────────────────────────────────────────── */}
        {marking !== null && markedBereich && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">{markedBereich.name}</h3>
                  <p className="text-xs text-muted-foreground">{markedBereich.zone}</p>
                </div>
                <button onClick={()=>setMarking(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                  <X className="w-4 h-4"/>
                </button>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs space-y-1">
                <p className="font-bold text-blue-800 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> MHD-Regeln</p>
                <p className="text-muted-foreground">Intervall: alle <strong>{markedBereich.intervallTage} Tag(e)</strong></p>
                <p className="text-amber-700">Preisreduzierung: MHD-Rest &lt; <strong>{markedBereich.reduzierungTage} Tag(e)</strong></p>
                <p className="text-red-700">Entnahme/Entsorgung: MHD-Rest &lt; <strong>{markedBereich.entnahmeTage} Tag(e)</strong></p>
              </div>
              <input type="text" placeholder="Kuerzel (optional)" maxLength={5} value={markKuerzel}
                onChange={e=>setMarkKuerzel(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"/>
              <textarea rows={2} placeholder="Bemerkung (z.B. Artikel reduziert, MHD-Ware entnommen)" value={markBemerkung}
                onChange={e=>setMarkBemerkung(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"/>
              <div className="flex gap-3">
                <button onClick={()=>setMarking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground">Abbrechen</button>
                <button onClick={handleMark}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm">
                  <CalendarCheck className="w-4 h-4"/> Kontrolliert
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT DIALOG ─────────────────────────────────────────────────── */}
        {editingId !== null && editBereich && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Bearbeiten</h3>
                <button onClick={()=>setEditingId(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                  <X className="w-4 h-4"/>
                </button>
              </div>
              <input value={editState.name} onChange={e=>setEditState(p=>({...p,name:e.target.value}))}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"/>
              <input placeholder="Beschreibung" value={editState.beschreibung} onChange={e=>setEditState(p=>({...p,beschreibung:e.target.value}))}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"/>
              <IntervalFields state={editState} onChange={setEditState}/>
              <div className="flex gap-3">
                <button onClick={()=>setEditingId(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground">Abbrechen</button>
                <button onClick={saveEdit} disabled={editSaving}
                  className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50">
                  {editSaving?"...":"Speichern"}
                </button>
              </div>
              <button onClick={()=>{ if(confirm("Bereich loeschen?")) deleteBereich(editingId); }}
                className="w-full py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 border border-red-200 flex items-center justify-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5"/> Bereich loeschen
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/* ── Types ──────────────────────────────────────────────────────────────── */
interface EditFormState { name: string; beschreibung: string; zone: string; intervallTage: number; reduzierungTage: number; entnahmeTage: number; }

/* ── Sub-components ─────────────────────────────────────────────────────── */
function StatBadge({ fill, value, label, pulse }: { fill: string; value: number; label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${pulse && value>0 ? "animate-pulse" : ""}`} style={{background:fill}}/>
      <span className="font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function IntervalFields({ state, onChange }: { state: EditFormState; onChange: (s: EditFormState) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Intervall (d)</label>
        <input type="number" min={1} value={state.intervallTage}
          onChange={e=>onChange({...state, intervallTage:Number(e.target.value)})}
          className="w-full border border-border rounded-xl px-2 py-2 text-sm bg-white focus:outline-none text-center"/>
      </div>
      <div>
        <label className="block text-xs font-semibold text-amber-600 mb-1">Reduz. (d)</label>
        <input type="number" min={0} value={state.reduzierungTage}
          onChange={e=>onChange({...state, reduzierungTage:Number(e.target.value)})}
          className="w-full border border-amber-200 rounded-xl px-2 py-2 text-sm bg-amber-50 focus:outline-none text-center"/>
      </div>
      <div>
        <label className="block text-xs font-semibold text-red-600 mb-1">Entnahme (d)</label>
        <input type="number" min={0} value={state.entnahmeTage}
          onChange={e=>onChange({...state, entnahmeTage:Number(e.target.value)})}
          className="w-full border border-red-200 rounded-xl px-2 py-2 text-sm bg-red-50 focus:outline-none text-center"/>
      </div>
    </div>
  );
}
