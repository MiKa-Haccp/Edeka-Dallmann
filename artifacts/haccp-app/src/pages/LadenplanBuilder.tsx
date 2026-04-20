import { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft, Trash2, Copy, RotateCcw, Save, Download,
  Grid3X3, Type, Minus, ZoomIn, ZoomOut, Move,
} from "lucide-react";

// ─── Grid constants ──────────────────────────────────────────────────────────
const GRID   = 20;           // px per grid unit
const snap   = (v: number) => Math.round(v / GRID) * GRID;
const CANVAS_W = 1600;
const CANVAS_H = 1000;

// ─── Item types ───────────────────────────────────────────────────────────────
type ItemType = "regal" | "kuehl" | "tk" | "wand" | "label" | "freiraum";

interface ItemDef {
  type: ItemType;
  label: string;
  defaultW: number;   // in px (multiple of GRID)
  defaultH: number;
  fill: string;
  stroke: string;
  textColor: string;
  emoji: string;
}

const ITEM_DEFS: ItemDef[] = [
  { type:"regal",    label:"Regal 1m",    defaultW:60,  defaultH:25, fill:"#fee2e2", stroke:"#dc2626", textColor:"#991b1b", emoji:"🔴" },
  { type:"kuehl",    label:"Kuehlregal 1m",defaultW:60, defaultH:25, fill:"#dbeafe", stroke:"#2563eb", textColor:"#1e3a8a", emoji:"🔵" },
  { type:"tk",       label:"TK-Insel 1m", defaultW:60,  defaultH:25, fill:"#ede9fe", stroke:"#7c3aed", textColor:"#4c1d95", emoji:"🟣" },
  { type:"wand",     label:"Wand / Mauer",defaultW:100, defaultH:15, fill:"#374151", stroke:"#111827", textColor:"#f9fafb", emoji:"⬛" },
  { type:"label",    label:"Beschriftung",defaultW:120, defaultH:30, fill:"#f0fdf4", stroke:"#16a34a", textColor:"#15803d", emoji:"🏷️" },
  { type:"freiraum", label:"Freiraum",    defaultW:80,  defaultH:40, fill:"#f8fafc", stroke:"#cbd5e1", textColor:"#94a3b8", emoji:"⬜" },
];

const getDef = (type: ItemType) => ITEM_DEFS.find(d => d.type === type)!;

// ─── Data ────────────────────────────────────────────────────────────────────
interface PlacedItem {
  id: string;
  type: ItemType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: 0 | 90;
}

const LS_KEY = "haccp-ladenplan-v1";

function loadFromStorage(): PlacedItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function uid() {
  return Math.random().toString(36).substring(2, 10);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function LadenplanBuilder() {
  const [items, setItems]       = useState<PlacedItem[]>(loadFromStorage);
  const [selected, setSelected] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<string>("");
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom]         = useState(1);
  const [saved, setSaved]       = useState(false);

  const canvasRef  = useRef<HTMLDivElement>(null);
  const dragItem   = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const paletteDrag = useRef<ItemType | null>(null);
  const [, navigate] = useLocation();

  // ── Persist on change ────────────────────────────────────────────────────
  const saveNow = useCallback(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [items]);

  // ── Selected item data ───────────────────────────────────────────────────
  const selectedItem = items.find(i => i.id === selected) || null;

  useEffect(() => {
    if (selectedItem) setEditLabel(selectedItem.label);
  }, [selected]);

  // ── Canvas coords helper ─────────────────────────────────────────────────
  const canvasCoords = (e: { clientX: number; clientY: number }) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: snap((e.clientX - rect.left) / zoom),
      y: snap((e.clientY - rect.top) / zoom),
    };
  };

  // ── Palette drag start ───────────────────────────────────────────────────
  const handlePaletteDragStart = (type: ItemType) => {
    paletteDrag.current = type;
  };

  // ── Canvas drop from palette ─────────────────────────────────────────────
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!paletteDrag.current) return;
    const def = getDef(paletteDrag.current);
    const { x, y } = canvasCoords(e);
    const newItem: PlacedItem = {
      id: uid(),
      type: paletteDrag.current,
      label: def.label,
      x: Math.max(0, x - def.defaultW / 2),
      y: Math.max(0, y - def.defaultH / 2),
      w: def.defaultW,
      h: def.defaultH,
      rotation: 0,
    };
    setItems(prev => [...prev, newItem]);
    setSelected(newItem.id);
    paletteDrag.current = null;
  };

  // ── Item mouse-drag (move) ───────────────────────────────────────────────
  const handleItemMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelected(id);
    const item = items.find(i => i.id === id);
    if (!item) return;
    dragItem.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: item.x,
      origY: item.y,
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragItem.current) return;
      const dx = (e.clientX - dragItem.current.startX) / zoom;
      const dy = (e.clientY - dragItem.current.startY) / zoom;
      const nx = snap(dragItem.current.origX + dx);
      const ny = snap(dragItem.current.origY + dy);
      setItems(prev => prev.map(i =>
        i.id === dragItem.current!.id
          ? { ...i, x: Math.max(0, nx), y: Math.max(0, ny) }
          : i
      ));
    };
    const onUp = () => { dragItem.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [zoom]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const duplicateSelected = () => {
    if (!selectedItem) return;
    const newItem: PlacedItem = {
      ...selectedItem,
      id: uid(),
      x: selectedItem.x + GRID * 2,
      y: selectedItem.y + GRID * 2,
    };
    setItems(prev => [...prev, newItem]);
    setSelected(newItem.id);
  };

  const deleteSelected = () => {
    if (!selected) return;
    setItems(prev => prev.filter(i => i.id !== selected));
    setSelected(null);
  };

  const rotateSelected = () => {
    if (!selected) return;
    setItems(prev => prev.map(i =>
      i.id === selected
        ? { ...i, rotation: i.rotation === 0 ? 90 : 0, w: i.h, h: i.w }
        : i
    ));
  };

  const applyLabel = () => {
    if (!selected) return;
    setItems(prev => prev.map(i => i.id === selected ? { ...i, label: editLabel } : i));
  };

  const clearAll = () => {
    if (!confirm("Alle Elemente löschen?")) return;
    setItems([]); setSelected(null);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ladenplan.json"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selected) deleteSelected();
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); duplicateSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveNow(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, selectedItem, items, saveNow]);

  return (
    <AppLayout>
      <div className="max-w-none -mx-4 -mt-4 h-[calc(100vh-64px)] flex flex-col">

        {/* ── Top bar ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-border/60 shadow-sm flex-shrink-0">
          <Link href="/ware-mhd" className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
            <ChevronLeft className="w-5 h-5"/>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Ladenplan-Editor</h1>
            <p className="text-xs text-muted-foreground">Elemente aus der Palette ziehen, auf dem Plan platzieren</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-xl transition-colors text-sm flex items-center gap-1.5 ${showGrid ? "bg-[#1a3a6b] text-white" : "bg-secondary text-muted-foreground"}`}>
              <Grid3X3 className="w-4 h-4"/><span className="hidden sm:inline">Raster</span>
            </button>
            <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(1)))} className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-border"><ZoomOut className="w-4 h-4"/></button>
            <span className="text-xs font-bold text-muted-foreground w-9 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))} className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-border"><ZoomIn className="w-4 h-4"/></button>
            <button onClick={clearAll} className="p-2 rounded-xl bg-secondary hover:bg-red-100 text-muted-foreground hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
            <button onClick={exportJSON} className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-border"><Download className="w-4 h-4"/></button>
            <button onClick={saveNow}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors ${saved ? "bg-green-500 text-white" : "bg-[#1a3a6b] text-white hover:bg-[#1a3a6b]/90"}`}>
              <Save className="w-4 h-4"/>{saved ? "Gespeichert!" : "Speichern"}
            </button>
          </div>
        </div>

        {/* ── Main layout ────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* ── Left palette ───────────────────────────────────────── */}
          <div className="w-48 flex-shrink-0 bg-white border-r border-border/60 p-3 overflow-y-auto space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Bausteine</p>
            <p className="text-xs text-muted-foreground leading-tight mb-2">Ziehe Elemente auf die Zeichenflaechc</p>
            {ITEM_DEFS.map(def => (
              <div key={def.type}
                draggable
                onDragStart={() => handlePaletteDragStart(def.type)}
                className="flex items-center gap-2 p-2 rounded-xl border cursor-grab active:cursor-grabbing hover:shadow-sm transition-all select-none"
                style={{ background: def.fill, borderColor: def.stroke }}>
                <span className="text-base leading-none">{def.emoji}</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: def.textColor }}>{def.label}</p>
                  <p className="text-xs text-muted-foreground">{def.defaultW}×{def.defaultH}px</p>
                </div>
              </div>
            ))}

            <div className="border-t border-border/60 pt-3 mt-3 space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tastenkuerzel</p>
              <p className="text-xs text-muted-foreground">Del — Loeschen</p>
              <p className="text-xs text-muted-foreground">Strg+D — Duplizieren</p>
              <p className="text-xs text-muted-foreground">Strg+S — Speichern</p>
            </div>

            <div className="border-t border-border/60 pt-3 mt-2">
              <p className="text-xs text-muted-foreground">{items.length} Elemente auf dem Plan</p>
            </div>
          </div>

          {/* ── Canvas ─────────────────────────────────────────────── */}
          <div className="flex-1 overflow-auto bg-slate-100 cursor-crosshair"
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
            <div
              style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom, position: "relative", transformOrigin: "top left" }}>
              {/* Canvas inner (transformed) */}
              <div
                ref={canvasRef}
                style={{
                  width: CANVAS_W, height: CANVAS_H,
                  position: "relative",
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  background: "white",
                  backgroundImage: showGrid
                    ? `repeating-linear-gradient(0deg,transparent,transparent ${GRID-1}px,#e2e8f0 ${GRID-1}px,#e2e8f0 ${GRID}px),
                       repeating-linear-gradient(90deg,transparent,transparent ${GRID-1}px,#e2e8f0 ${GRID-1}px,#e2e8f0 ${GRID}px)`
                    : "none",
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleCanvasDrop}
                onClick={() => setSelected(null)}
              >
                {/* Compass label */}
                <div className="absolute bottom-2 right-3 text-xs text-slate-300 font-medium pointer-events-none select-none">
                  Ladenplan — EDEKA DALLMANN Leeder
                </div>

                {/* Placed items */}
                {items.map(item => {
                  const def = getDef(item.type);
                  const isSel = item.id === selected;
                  return (
                    <div
                      key={item.id}
                      onMouseDown={(e) => handleItemMouseDown(e, item.id)}
                      style={{
                        position: "absolute",
                        left: item.x,
                        top: item.y,
                        width: item.w,
                        height: item.h,
                        background: def.fill,
                        border: `${isSel ? 2.5 : 1.5}px solid ${isSel ? "#f59e0b" : def.stroke}`,
                        borderRadius: 4,
                        cursor: "grab",
                        userSelect: "none",
                        boxShadow: isSel ? "0 0 0 3px rgba(245,158,11,0.3)" : "none",
                        zIndex: isSel ? 100 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          fontSize: Math.min(item.h * 0.45, item.w * 0.13, 11),
                          fontWeight: 700,
                          color: def.textColor,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "95%",
                          textAlign: "center",
                          pointerEvents: "none",
                          lineHeight: 1.1,
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right panel (selected item) ─────────────────────────── */}
          <div className="w-52 flex-shrink-0 bg-white border-l border-border/60 p-3 overflow-y-auto">
            {selectedItem ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ausgewahlt</p>
                <div className="p-2 rounded-xl border text-xs" style={{ background: getDef(selectedItem.type).fill, borderColor: getDef(selectedItem.type).stroke }}>
                  <p className="font-bold" style={{ color: getDef(selectedItem.type).textColor }}>{getDef(selectedItem.type).label}</p>
                  <p className="text-muted-foreground">Position: {selectedItem.x}/{selectedItem.y}</p>
                  <p className="text-muted-foreground">Groesse: {selectedItem.w}×{selectedItem.h}px</p>
                </div>

                {/* Label edit */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Beschriftung</label>
                  <div className="flex gap-1">
                    <input
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") applyLabel(); }}
                      className="flex-1 text-xs border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                      placeholder="Name..."
                    />
                    <button onClick={applyLabel} className="px-2 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-white">
                      <Check size={12}/>
                    </button>
                  </div>
                </div>

                {/* Size adjust */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Breite (px)</label>
                  <div className="flex gap-1 items-center">
                    <button onClick={() => setItems(prev => prev.map(i => i.id===selected ? {...i, w: Math.max(GRID, i.w - GRID)} : i))}
                      className="px-2 py-1 rounded-lg bg-secondary text-sm font-bold">−</button>
                    <span className="text-xs font-mono text-center flex-1">{selectedItem.w}</span>
                    <button onClick={() => setItems(prev => prev.map(i => i.id===selected ? {...i, w: i.w + GRID} : i))}
                      className="px-2 py-1 rounded-lg bg-secondary text-sm font-bold">+</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Hoehe (px)</label>
                  <div className="flex gap-1 items-center">
                    <button onClick={() => setItems(prev => prev.map(i => i.id===selected ? {...i, h: Math.max(GRID, i.h - GRID)} : i))}
                      className="px-2 py-1 rounded-lg bg-secondary text-sm font-bold">−</button>
                    <span className="text-xs font-mono text-center flex-1">{selectedItem.h}</span>
                    <button onClick={() => setItems(prev => prev.map(i => i.id===selected ? {...i, h: i.h + GRID} : i))}
                      className="px-2 py-1 rounded-lg bg-secondary text-sm font-bold">+</button>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <button onClick={duplicateSelected}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-secondary hover:bg-border text-sm font-semibold text-foreground">
                    <Copy className="w-4 h-4"/> Duplizieren
                  </button>
                  <button onClick={rotateSelected}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-secondary hover:bg-border text-sm font-semibold text-foreground">
                    <RotateCcw className="w-4 h-4"/> Drehen
                  </button>
                  <button onClick={deleteSelected}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-sm font-semibold text-red-600">
                    <Trash2 className="w-4 h-4"/> Loeschen
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Eigenschaften</p>
                <div className="text-center py-8">
                  <Move className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2"/>
                  <p className="text-xs text-muted-foreground">Element anklicken zum Bearbeiten</p>
                </div>
                <div className="border-t border-border/60 pt-3 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">Anleitung</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">1. Element aus der linken Palette auf die Zeichenflaeche ziehen</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">2. Auf dem Plan verschieben</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">3. Anklicken → Groesse, Name, Duplizieren</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">4. Speichern wenn fertig</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Check({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
