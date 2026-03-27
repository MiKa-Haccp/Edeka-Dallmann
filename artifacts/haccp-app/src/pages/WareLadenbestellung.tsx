import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { Link } from "wouter";
import {
  ChevronLeft, Plus, Pencil, Check, X,
  GripVertical, Loader2, ChevronRight,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";
const CANVAS_W = 1200;
const CANVAS_H = 700;
const GRID = 20;
const MIN_W = 80;
const MIN_H = 60;

const snap = (v: number) => Math.round(v / GRID) * GRID;

const FARBEN = [
  "#1a3a6b","#059669","#d97706","#dc2626","#7c3aed",
  "#0891b2","#be185d","#374151","#065f46","#92400e",
];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function isoToDE(iso: string) {
  const [y,m,d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

interface Gebiet {
  id: number; market_id: number; tenant_id: number;
  name: string; farbe: string;
  x: number; y: number; w: number; h: number;
  sort_order: number;
}
interface Bestellung {
  id: number; gebiet_id: number; datum: string;
  kuerzel: string | null; anmerkung: string | null; created_at: string;
}

// ─── lighter version of a hex color for background ──────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}
function lightBg(hex: string) {
  const { r,g,b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},0.12)`;
}
function borderColor(hex: string) {
  const { r,g,b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},0.6)`;
}

export default function WareLadenbestellung() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = !!adminSession;

  const [datum, setDatum] = useState(todayIso());
  const [gebiete, setGebiete] = useState<Gebiet[]>([]);
  const [bestellungen, setBestellungen] = useState<Bestellung[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addFarbe, setAddFarbe] = useState(FARBEN[0]);
  const [adding, setAdding] = useState(false);

  // Order modal
  const [orderGebiet, setOrderGebiet] = useState<Gebiet | null>(null);
  const [orderKuerzel, setOrderKuerzel] = useState("");
  const [orderAnmerkung, setOrderAnmerkung] = useState("");
  const [ordering, setOrdering] = useState(false);

  // Drag / resize state (refs to avoid stale closures)
  const dragRef = useRef<{
    id: number; type: "move" | "resize";
    startX: number; startY: number;
    origX: number; origY: number; origW: number; origH: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadGebiete = useCallback(async () => {
    if (!selectedMarketId) return;
    const r = await fetch(`${BASE}/laden-bestellgebiete?marketId=${selectedMarketId}&tenantId=1`);
    setGebiete(await r.json());
  }, [selectedMarketId]);

  const loadBestellungen = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/laden-bestellungen?marketId=${selectedMarketId}&tenantId=1&datum=${datum}`);
      setBestellungen(await r.json());
    } finally { setLoading(false); }
  }, [selectedMarketId, datum]);

  useEffect(() => { loadGebiete(); }, [loadGebiete]);
  useEffect(() => { loadBestellungen(); }, [loadBestellungen]);

  // ── Canvas mouse events ───────────────────────────────────────────────────
  const getCanvasPos = (e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { cx: 0, cy: 0 };
    return {
      cx: (e.clientX - rect.left) / canvasScale,
      cy: (e.clientY - rect.top)  / canvasScale,
    };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    const dr = dragRef.current;
    if (!dr) return;
    const { cx, cy } = getCanvasPos(e);
    const dx = cx - dr.startX;
    const dy = cy - dr.startY;

    setGebiete(prev => prev.map(g => {
      if (g.id !== dr.id) return g;
      if (dr.type === "move") {
        return {
          ...g,
          x: Math.max(0, Math.min(CANVAS_W - g.w, snap(dr.origX + dx))),
          y: Math.max(0, Math.min(CANVAS_H - g.h, snap(dr.origY + dy))),
        };
      } else {
        return {
          ...g,
          w: Math.max(MIN_W, Math.min(CANVAS_W - g.x, snap(dr.origW + dx))),
          h: Math.max(MIN_H, Math.min(CANVAS_H - g.y, snap(dr.origH + dy))),
        };
      }
    }));
  }, [canvasScale]);

  const onMouseUp = useCallback(async () => {
    const dr = dragRef.current;
    if (!dr) return;
    dragRef.current = null;
    const g = gebiete.find(g => g.id === dr.id);
    if (!g) return;
    await fetch(`${BASE}/laden-bestellgebiete/${dr.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x: g.x, y: g.y, w: g.w, h: g.h }),
    });
  }, [gebiete]);

  useEffect(() => {
    if (!editMode) return;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [editMode, onMouseMove, onMouseUp]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const startDrag = (e: React.MouseEvent, id: number, type: "move" | "resize") => {
    e.preventDefault();
    e.stopPropagation();
    const g = gebiete.find(g => g.id === id)!;
    const { cx, cy } = getCanvasPos(e);
    dragRef.current = { id, type, startX: cx, startY: cy, origX: g.x, origY: g.y, origW: g.w, origH: g.h };
  };

  const handleAddGebiet = async () => {
    if (!addName.trim() || !selectedMarketId) return;
    setAdding(true);
    try {
      const nextX = snap(Math.min((gebiete.length % 4) * 220, CANVAS_W - 200));
      const nextY = snap(Math.floor(gebiete.length / 4) * 140);
      await fetch(`${BASE}/laden-bestellgebiete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId, tenantId: 1,
          name: addName.trim(), farbe: addFarbe,
          x: nextX, y: nextY, w: 200, h: 120,
        }),
      });
      setAddName(""); setAddFarbe(FARBEN[0]); setShowAdd(false);
      await loadGebiete();
    } finally { setAdding(false); }
  };

  const handleDeleteGebiet = async (id: number) => {
    await fetch(`${BASE}/laden-bestellgebiete/${id}`, { method: "DELETE" });
    await loadGebiete();
    await loadBestellungen();
  };

  const handleRename = async (id: number, name: string) => {
    await fetch(`${BASE}/laden-bestellgebiete/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await loadGebiete();
  };

  const openOrderModal = (g: Gebiet) => {
    if (editMode) return;
    const existing = bestellungen.find(b => b.gebiet_id === g.id);
    if (existing) {
      // unmark
      if (confirm(`Bestellung für "${g.name}" aufheben?`)) {
        fetch(`${BASE}/laden-bestellungen/${existing.id}`, { method: "DELETE" })
          .then(() => loadBestellungen());
      }
    } else {
      setOrderGebiet(g);
      setOrderKuerzel("");
      setOrderAnmerkung("");
    }
  };

  const handleOrder = async () => {
    if (!orderGebiet || !selectedMarketId) return;
    setOrdering(true);
    try {
      await fetch(`${BASE}/laden-bestellungen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId, tenantId: 1,
          gebietId: orderGebiet.id, datum,
          kuerzel: orderKuerzel.trim().toUpperCase() || null,
          anmerkung: orderAnmerkung.trim() || null,
        }),
      });
      setOrderGebiet(null);
      await loadBestellungen();
    } finally { setOrdering(false); }
  };

  // ── Canvas scale ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const availW = el.clientWidth - 4;
      setCanvasScale(Math.min(1, availW / CANVAS_W));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const bestellMap = new Map(bestellungen.map(b => [b.gebiet_id, b]));
  const orderedCount = bestellungen.length;
  const totalCount = gebiete.length;

  // ── Inline rename state ───────────────────────────────────────────────────
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameVal, setRenameVal] = useState("");

  return (
    <AppLayout>
      <div className="max-w-full space-y-4 pb-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/ware-bestellungen" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">Ladenbestellung</h1>
            <p className="text-sm text-muted-foreground">Bestellgebiete markieren</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                editMode
                  ? "bg-amber-500 text-white shadow-md"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              <Pencil className="w-4 h-4" />
              {editMode ? "Bearbeiten aktiv" : "Bearbeiten"}
            </button>
          )}
        </div>

        {/* Status + Date bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
              totalCount > 0 && orderedCount === totalCount
                ? "bg-green-100 text-green-700"
                : orderedCount > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : `${orderedCount} / ${totalCount} bestellt`}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setDatum(d => addDays(d,-1))}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
              className="text-sm px-3 py-1.5 border border-border/60 rounded-xl bg-white font-medium text-center" />
            <button onClick={() => setDatum(d => addDays(d,1))}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edit toolbar */}
        {editMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3">
            <p className="text-sm text-amber-700 font-medium">
              ✏️ Bearbeitungsmodus — Gebiete verschieben und skalieren
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5aa0] transition-colors"
            >
              <Plus className="w-4 h-4" /> Gebiet hinzufügen
            </button>
          </div>
        )}

        {/* No market */}
        {!selectedMarketId && (
          <div className="bg-white rounded-2xl border border-border/60 p-10 text-center text-muted-foreground text-sm">
            Bitte oben einen Markt auswählen.
          </div>
        )}

        {/* Canvas */}
        {selectedMarketId && (
          <div ref={wrapRef} className="w-full overflow-x-auto">
            <div
              style={{ width: CANVAS_W * canvasScale, height: CANVAS_H * canvasScale, position: "relative" }}
              className="mx-auto"
            >
              <div
                ref={canvasRef}
                style={{
                  width: CANVAS_W,
                  height: CANVAS_H,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: "top left",
                  position: "relative",
                  background: editMode
                    ? "radial-gradient(circle, #cbd5e1 1px, transparent 1px)"
                    : "#f8fafc",
                  backgroundSize: editMode ? `${GRID}px ${GRID}px` : undefined,
                  borderRadius: 16,
                  border: "1.5px solid #e2e8f0",
                  overflow: "hidden",
                }}
              >
                {gebiete.length === 0 && !editMode && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <p className="text-sm">Noch keine Bestellgebiete angelegt.</p>
                    {isAdmin && (
                      <button onClick={() => { setEditMode(true); setShowAdd(true); }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5aa0]">
                        <Plus className="w-4 h-4" /> Erstes Gebiet anlegen
                      </button>
                    )}
                  </div>
                )}

                {gebiete.map(g => {
                  const bestellt = bestellMap.get(g.id);
                  const isOrdered = !!bestellt;

                  if (editMode) {
                    return (
                      <div
                        key={g.id}
                        style={{
                          position: "absolute",
                          left: g.x, top: g.y, width: g.w, height: g.h,
                          background: lightBg(g.farbe),
                          border: `2px dashed ${borderColor(g.farbe)}`,
                          borderRadius: 12,
                          cursor: "grab",
                          userSelect: "none",
                          boxSizing: "border-box",
                        }}
                        onMouseDown={e => startDrag(e, g.id, "move")}
                      >
                        {/* Delete */}
                        <button
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); handleDeleteGebiet(g.id); }}
                          style={{ position:"absolute", top:4, right:4,
                            background:"#dc2626", color:"white", border:"none",
                            borderRadius:6, width:22, height:22, cursor:"pointer",
                            display:"flex", alignItems:"center", justifyContent:"center" }}
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {/* Name (click to rename) */}
                        <div
                          style={{
                            padding:"6px 28px 4px 8px",
                            display:"flex", flexDirection:"column", height:"100%",
                            justifyContent:"flex-start",
                          }}
                        >
                          {renamingId === g.id ? (
                            <div onMouseDown={e => e.stopPropagation()} style={{ display:"flex", gap:4 }}>
                              <input
                                autoFocus
                                value={renameVal}
                                onChange={e => setRenameVal(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") {
                                    handleRename(g.id, renameVal); setRenamingId(null);
                                  }
                                  if (e.key === "Escape") setRenamingId(null);
                                }}
                                style={{
                                  width:"100%", border:"1px solid "+g.farbe,
                                  borderRadius:6, padding:"2px 4px",
                                  fontSize:13, fontWeight:600, color:g.farbe,
                                  background:"white",
                                }}
                              />
                              <button onMouseDown={e => e.stopPropagation()} onClick={() => { handleRename(g.id, renameVal); setRenamingId(null); }}
                                style={{ background:g.farbe, color:"white", border:"none", borderRadius:6, padding:"2px 6px", cursor:"pointer", fontSize:12 }}>
                                ✓
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={e => { e.stopPropagation(); setRenamingId(g.id); setRenameVal(g.name); }}
                              style={{ fontSize:13, fontWeight:700, color:g.farbe, cursor:"text", lineHeight:1.3 }}
                              title="Klicken zum Umbenennen"
                            >
                              {g.name}
                            </span>
                          )}
                          <span style={{ fontSize:11, color:g.farbe, opacity:0.7, marginTop:2 }}>
                            {g.w}×{g.h}px
                          </span>
                        </div>

                        {/* Resize handle (bottom-right) */}
                        <div
                          onMouseDown={e => startDrag(e, g.id, "resize")}
                          style={{
                            position:"absolute", bottom:4, right:4,
                            width:16, height:16, cursor:"nwse-resize",
                            background:g.farbe, borderRadius:4, opacity:0.8,
                            display:"flex", alignItems:"center", justifyContent:"center",
                          }}
                        >
                          <GripVertical className="w-2.5 h-2.5" style={{ color:"white" }} />
                        </div>
                      </div>
                    );
                  }

                  // Use mode
                  return (
                    <button
                      key={g.id}
                      onClick={() => openOrderModal(g)}
                      style={{
                        position:"absolute", left:g.x, top:g.y, width:g.w, height:g.h,
                        background: isOrdered ? g.farbe : lightBg(g.farbe),
                        border: `2px solid ${isOrdered ? g.farbe : borderColor(g.farbe)}`,
                        borderRadius:12,
                        cursor:"pointer",
                        display:"flex", flexDirection:"column",
                        alignItems:"center", justifyContent:"center",
                        gap:4, padding:8,
                        transition:"all 0.15s",
                        boxSizing:"border-box",
                      }}
                    >
                      {isOrdered && (
                        <div style={{
                          position:"absolute", top:6, right:8,
                          background:"rgba(255,255,255,0.3)", borderRadius:8,
                          padding:"2px 6px", fontSize:11, color:"white", fontWeight:700,
                        }}>
                          ✓
                        </div>
                      )}
                      <span style={{
                        fontSize: g.w < 120 ? 12 : 14, fontWeight:700,
                        color: isOrdered ? "white" : g.farbe,
                        textAlign:"center", lineHeight:1.3,
                        wordBreak:"break-word",
                      }}>
                        {g.name}
                      </span>
                      {isOrdered && (
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.9)", fontWeight:600 }}>
                          {bestellt.kuerzel ? bestellt.kuerzel : "Bestellt"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Zoom controls */}
        {selectedMarketId && gebiete.length > 0 && (
          <div className="flex justify-end gap-2">
            <button onClick={() => setCanvasScale(s => Math.max(0.3, +(s - 0.1).toFixed(1)))}
              className="px-3 py-1.5 text-xs bg-white border border-border/60 rounded-lg hover:bg-secondary text-muted-foreground">
              −
            </button>
            <button onClick={() => setCanvasScale(1)}
              className="px-3 py-1.5 text-xs bg-white border border-border/60 rounded-lg hover:bg-secondary text-muted-foreground min-w-[56px] text-center">
              {Math.round(canvasScale * 100)}%
            </button>
            <button onClick={() => setCanvasScale(s => Math.min(2, +(s + 0.1).toFixed(1)))}
              className="px-3 py-1.5 text-xs bg-white border border-border/60 rounded-lg hover:bg-secondary text-muted-foreground">
              +
            </button>
          </div>
        )}

      </div>

      {/* ── Add Gebiet Modal ──────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h2 className="text-base font-bold">Bestellgebiet hinzufügen</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
                <input
                  autoFocus
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddGebiet()}
                  placeholder="z.B. Trockenwaren, Kühltheke..."
                  className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Farbe</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {FARBEN.map(f => (
                    <button
                      key={f} onClick={() => setAddFarbe(f)}
                      style={{ background: f, width: 28, height: 28, borderRadius: 8,
                        border: addFarbe === f ? "3px solid #fff" : "2px solid rgba(0,0,0,0.1)",
                        outline: addFarbe === f ? `2px solid ${f}` : "none",
                        cursor: "pointer" }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 px-4 py-2.5 border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground">
                Abbrechen
              </button>
              <button onClick={handleAddGebiet} disabled={!addName.trim() || adding}
                className="flex-1 px-4 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-50">
                {adding ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Hinzufügen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Modal ───────────────────────────────────────────────────────── */}
      {orderGebiet && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                style={{ background: lightBg(orderGebiet.farbe), border: `2px solid ${borderColor(orderGebiet.farbe)}` }}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                <Check className="w-5 h-5" style={{ color: orderGebiet.farbe }} />
              </div>
              <div>
                <h2 className="text-base font-bold">{orderGebiet.name}</h2>
                <p className="text-xs text-muted-foreground">{isoToDE(datum)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kürzel (optional)</label>
                <input
                  autoFocus
                  value={orderKuerzel}
                  onChange={e => setOrderKuerzel(e.target.value.toUpperCase().slice(0, 4))}
                  onKeyDown={e => e.key === "Enter" && handleOrder()}
                  placeholder="z.B. MK"
                  className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Anmerkung (optional)</label>
                <input
                  value={orderAnmerkung}
                  onChange={e => setOrderAnmerkung(e.target.value)}
                  placeholder="z.B. Fehlmenge gemeldet..."
                  className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setOrderGebiet(null)}
                className="flex-1 px-4 py-2.5 border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground">
                Abbrechen
              </button>
              <button onClick={handleOrder} disabled={ordering}
                style={{ background: orderGebiet.farbe }}
                className="flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-bold disabled:opacity-60 transition-opacity">
                {ordering ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "✓ Bestellt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
