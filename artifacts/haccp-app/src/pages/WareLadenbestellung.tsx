import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link } from "wouter";
import {
  ChevronLeft, Plus, Pencil, Check, X,
  GripVertical, Loader2, ChevronRight, LayoutGrid, List,
  Trash2, CheckCircle2, Circle, Truck, Clock, AlertTriangle, CalendarDays, ShoppingBag,
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
  sortiment: string | null;
  zustaendig: string | null;
  kategorie: string | null;
}
interface Bestellung {
  id: number; gebiet_id: number; datum: string;
  kuerzel: string | null; anmerkung: string | null; created_at: string;
}

interface Lieferplan {
  id: number; market_id: number; tenant_id: number;
  name: string; kategorie: string | null;
  liefertag: number; bestelltag: number | null;
  bestellschluss_uhrzeit: string | null;
  notiz: string | null; sort_order: number;
}

const WTAG_LANG = ["","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const WTAG_KURZ = ["","Mo","Di","Mi","Do","Fr","Sa","So"];

function jsTagToOurs(d: Date): number { const t = d.getDay(); return t === 0 ? 7 : t; }

const KAT_CONFIG: Record<string, { label: string; bg: string; border: string; text: string }> = {
  trocken:   { label: "Trocken",   bg: "bg-amber-50",  border: "border-amber-300", text: "text-amber-800" },
  tk:        { label: "TK",        bg: "bg-blue-50",   border: "border-blue-300",  text: "text-blue-800"  },
  getraenke: { label: "Getränke",  bg: "bg-green-50",  border: "border-green-300", text: "text-green-800" },
  werbeware: { label: "Werbeware", bg: "bg-purple-50", border: "border-purple-300",text: "text-purple-800"},
};
const KAT_DEFAULT = { label: "Sonstige", bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-700" };

function getKat(k: string | null) { return k ? (KAT_CONFIG[k] ?? KAT_DEFAULT) : KAT_DEFAULT; }

interface NextDeadline {
  plan: Lieferplan;
  bestellDate: Date;
  daysUntil: number;
}

function calcNextDeadlines(plaene: Lieferplan[]): NextDeadline[] {
  const now = new Date();
  const todayDow = jsTagToOurs(now);
  const results: NextDeadline[] = [];
  for (const p of plaene) {
    if (!p.bestelltag) continue;
    let diff = (p.bestelltag - todayDow + 7) % 7;
    if (diff === 0 && p.bestellschluss_uhrzeit) {
      const [h, m] = p.bestellschluss_uhrzeit.split(":").map(Number);
      const deadline = new Date(); deadline.setHours(h, m, 0, 0);
      if (now > deadline) diff = 7;
    }
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + diff);
    results.push({ plan: p, bestellDate: d, daysUntil: diff });
  }
  results.sort((a, b) => a.daysUntil - b.daysUntil || a.plan.sort_order - b.plan.sort_order);
  return results;
}

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

  const [activeTab, setActiveTab] = useState<"plan" | "liste" | "lieferplan">("liste");
  const [datum, setDatum] = useState(todayIso());
  const [gebiete, setGebiete] = useState<Gebiet[]>([]);
  const [bestellungen, setBestellungen] = useState<Bestellung[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [lieferplaene, setLieferplaene] = useState<Lieferplan[]>([]);
  const [filterKategorie, setFilterKategorie] = useState<string | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addFarbe, setAddFarbe] = useState(FARBEN[0]);
  const [addSortiment, setAddSortiment] = useState("");
  const [addZustaendig, setAddZustaendig] = useState("");
  const [addKategorie, setAddKategorie] = useState<string>("");
  const [adding, setAdding] = useState(false);

  // Order modal
  const [orderGebiet, setOrderGebiet] = useState<Gebiet | null>(null);
  const [orderKuerzel, setOrderKuerzel] = useState("");
  const [orderAnmerkung, setOrderAnmerkung] = useState("");
  const [ordering, setOrdering] = useState(false);

  // Inline edit for list view (full modal)
  const [editingGebiet, setEditingGebiet] = useState<Gebiet | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortiment, setEditSortiment] = useState("");
  const [editZustaendig, setEditZustaendig] = useState("");
  const [editKategorie, setEditKategorie] = useState("");
  const [editFarbe, setEditFarbe] = useState(FARBEN[0]);
  const [editSaving, setEditSaving] = useState(false);

  // Inline-Bearbeitung Zuständig – State (Callback kommt nach loadGebiete)
  const [inlineZustaendigId, setInlineZustaendigId] = useState<number | null>(null);
  const [inlineZustaendigVal, setInlineZustaendigVal] = useState("");

  // Drag / resize state
  const dragRef = useRef<{
    id: number; type: "move" | "resize";
    startX: number; startY: number;
    origX: number; origY: number; origW: number; origH: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
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

  const loadLieferplaene = useCallback(async () => {
    if (!selectedMarketId) return;
    const r = await fetch(`${BASE}/laden-lieferplaene?marketId=${selectedMarketId}`);
    if (r.ok) setLieferplaene(await r.json());
  }, [selectedMarketId]);

  useEffect(() => { loadGebiete(); }, [loadGebiete]);
  useEffect(() => { loadBestellungen(); }, [loadBestellungen]);
  useEffect(() => { loadLieferplaene(); }, [loadLieferplaene]);

  // Inline-Speichern Zuständig (nach loadGebiete definiert – keine temporal dead zone)
  const saveInlineZustaendig = useCallback(async (id: number, val: string) => {
    setInlineZustaendigId(null);
    await fetch(`${BASE}/laden-bestellgebiete/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zustaendig: val.trim() }),
    });
    await loadGebiete();
  }, [loadGebiete]);

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
        return { ...g,
          x: Math.max(0, Math.min(CANVAS_W - g.w, snap(dr.origX + dx))),
          y: Math.max(0, Math.min(CANVAS_H - g.h, snap(dr.origY + dy))),
        };
      } else {
        return { ...g,
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
          sortiment: addSortiment.trim() || null,
          zustaendig: addZustaendig.trim() || null,
          kategorie: addKategorie || null,
        }),
      });
      setAddName(""); setAddFarbe(FARBEN[0]); setAddSortiment(""); setAddZustaendig(""); setAddKategorie("");
      setShowAdd(false);
      await loadGebiete();
    } finally { setAdding(false); }
  };

  const handleDeleteGebiet = async (id: number) => {
    await fetch(`${BASE}/laden-bestellgebiete/${id}`, { method: "DELETE" });
    await loadGebiete();
    await loadBestellungen();
  };

  const handleSaveEdit = async () => {
    if (!editingGebiet || !editName.trim()) return;
    setEditSaving(true);
    try {
      await fetch(`${BASE}/laden-bestellgebiete/${editingGebiet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          farbe: editFarbe,
          sortiment: editSortiment.trim() || "",
          zustaendig: editZustaendig.trim() || "",
          kategorie: editKategorie || null,
        }),
      });
      setEditingGebiet(null);
      await loadGebiete();
    } finally { setEditSaving(false); }
  };

  const openEditGebiet = (g: Gebiet) => {
    setEditingGebiet(g);
    setEditName(g.name);
    setEditSortiment(g.sortiment ?? "");
    setEditZustaendig(g.zustaendig ?? "");
    setEditKategorie(g.kategorie ?? "");
    setEditFarbe(g.farbe);
  };

  // Plan-Canvas rename
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameVal, setRenameVal] = useState("");
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

  const bestellMap = new Map(bestellungen.map(b => [b.gebiet_id, b]));
  const visibleGebiete = filterKategorie ? gebiete.filter(g => g.kategorie === filterKategorie) : gebiete;
  const orderedCount = visibleGebiete.filter(g => bestellMap.has(g.id)).length;
  const totalCount = visibleGebiete.length;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-full space-y-4 pb-8">

        {/* Header */}
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/ware-bestellungen" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold leading-tight">Ladenbestellung</h1>
              <p className="text-white/70 text-sm">Bestellgebiete markieren</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setEditMode(e => !e)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                  editMode ? "bg-white text-[#1a3a6b]" : "bg-white/15 hover:bg-white/25 text-white"
                }`}
              >
                <Pencil className="w-4 h-4" />
                {editMode ? "Bearbeiten aktiv" : "Bearbeiten"}
              </button>
            )}
          </div>
        </PageHeader>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("liste")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "liste"
                ? "bg-white shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
            Liste
          </button>
          <button
            onClick={() => setActiveTab("plan")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "plan"
                ? "bg-white shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Ladenplan
          </button>
          <button
            onClick={() => setActiveTab("lieferplan")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "lieferplan"
                ? "bg-white shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Truck className="w-4 h-4" />
            Lieferplan
          </button>
        </div>

        {/* Nächste Bestellfristen – immer sichtbar wenn Lieferplan vorhanden */}
        {lieferplaene.length > 0 && activeTab !== "lieferplan" && (() => {
          const deadlines = calcNextDeadlines(lieferplaene).slice(0, 3);
          return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {deadlines.map((d, i) => {
                const kat = getKat(d.plan.kategorie);
                const urgent = d.daysUntil === 0;
                const soon   = d.daysUntil === 1;
                const isActive = filterKategorie === d.plan.kategorie;
                const urgentStyle = urgent
                  ? "border-red-400 bg-red-50 hover:bg-red-100"
                  : soon
                  ? "border-amber-400 bg-amber-50 hover:bg-amber-100"
                  : "border-gray-200 bg-white hover:bg-gray-50";
                const label = d.daysUntil === 0
                  ? "Heute!"
                  : d.daysUntil === 1
                  ? "Morgen"
                  : `in ${d.daysUntil} Tagen`;
                return (
                  <button
                    key={`${d.plan.id}-${i}`}
                    onClick={() => {
                      setFilterKategorie(d.plan.kategorie);
                      setActiveTab("liste");
                    }}
                    className={`border rounded-xl px-3 py-2 flex items-start gap-2.5 text-left w-full transition-colors cursor-pointer ${urgentStyle} ${isActive ? "ring-2 ring-[#1a3a6b]" : ""}`}
                  >
                    {urgent ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-xs font-bold uppercase tracking-wide ${urgent ? "text-red-600" : soon ? "text-amber-600" : "text-gray-500"}`}>
                        Bestellen {label} – {WTAG_KURZ[d.plan.bestelltag!]}
                        {d.plan.bestellschluss_uhrzeit ? ` bis ${d.plan.bestellschluss_uhrzeit}` : ""}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{d.plan.name}</p>
                      <p className="text-xs text-gray-500">
                        Lieferung: <span className="font-medium">{WTAG_LANG[d.plan.liefertag]}</span>
                      </p>
                    </div>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full border font-semibold whitespace-nowrap ${kat.bg} ${kat.border} ${kat.text}`}>
                      {kat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Status + Date bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
            totalCount > 0 && orderedCount === totalCount
              ? "bg-green-100 text-green-700"
              : orderedCount > 0
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-600"
          }`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : `${orderedCount} / ${totalCount} bestellt`}
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
              ✏️ Bearbeitungsmodus
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5aa0] transition-colors"
            >
              <Plus className="w-4 h-4" /> Gebiet hinzufügen
            </button>
          </div>
        )}

        {!selectedMarketId && (
          <div className="bg-white rounded-2xl border border-border/60 p-10 text-center text-muted-foreground text-sm">
            Bitte oben einen Markt auswählen.
          </div>
        )}

        {/* ═══════════════ LISTENANSICHT ═══════════════ */}
        {selectedMarketId && activeTab === "liste" && (
          <>
            {/* Filter-Chip */}
            {filterKategorie && (() => {
              const kat = getKat(filterKategorie);
              return (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Gefiltert:</span>
                  <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${kat.bg} ${kat.border} ${kat.text}`}>
                    {kat.label}
                    <button onClick={() => setFilterKategorie(null)} className="hover:opacity-70 transition-opacity ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({gebiete.filter(g => g.kategorie === filterKategorie).length} Bereiche)
                  </span>
                </div>
              );
            })()}

          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            {gebiete.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                <p className="text-sm">Noch keine Bestellgebiete angelegt.</p>
                {isAdmin && (
                  <button onClick={() => { setEditMode(true); setShowAdd(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5aa0]">
                    <Plus className="w-4 h-4" /> Erstes Gebiet anlegen
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 bg-secondary/30">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-8"></th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Bestellbereich</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Sortiment</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-32">Zuständig</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground w-28">Bestellt</th>
                      {editMode && <th className="w-16 px-2 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleGebiete.map((g, i) => {
                      const bestellt = bestellMap.get(g.id);
                      const isOrdered = !!bestellt;
                      return (
                        <tr
                          key={g.id}
                          className={`border-b border-border/40 transition-colors ${
                            isOrdered ? "bg-green-50/60" : i % 2 === 0 ? "bg-white" : "bg-secondary/10"
                          } ${!editMode ? "hover:bg-secondary/20 cursor-pointer" : ""}`}
                          onClick={() => !editMode && openOrderModal(g)}
                        >
                          {/* Farbindikator */}
                          <td className="px-4 py-3">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ background: g.farbe }}
                            />
                          </td>

                          {/* Name */}
                          <td className="px-4 py-3">
                            <span className="font-semibold text-foreground">{g.name}</span>
                            {g.sortiment && (
                              <p className="text-xs text-muted-foreground mt-0.5 md:hidden">{g.sortiment}</p>
                            )}
                          </td>

                          {/* Sortiment (desktop) */}
                          <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs leading-relaxed">
                            {g.sortiment || <span className="italic opacity-40">—</span>}
                          </td>

                          {/* Zuständig – direkt bearbeitbar für Admins */}
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            {isAdmin && inlineZustaendigId === g.id ? (
                              <input
                                autoFocus
                                value={inlineZustaendigVal}
                                onChange={e => setInlineZustaendigVal(e.target.value)}
                                onBlur={() => saveInlineZustaendig(g.id, inlineZustaendigVal)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") saveInlineZustaendig(g.id, inlineZustaendigVal);
                                  if (e.key === "Escape") setInlineZustaendigId(null);
                                }}
                                className="w-full text-sm border border-[#1a3a6b]/40 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 font-medium"
                                style={{ minWidth: 90 }}
                              />
                            ) : (
                              <button
                                onClick={() => {
                                  if (!isAdmin) return;
                                  setInlineZustaendigId(g.id);
                                  setInlineZustaendigVal(g.zustaendig ?? "");
                                }}
                                className={`text-left font-medium text-sm w-full rounded-lg px-2 py-1 transition-colors ${
                                  isAdmin
                                    ? "hover:bg-[#1a3a6b]/8 cursor-text text-foreground"
                                    : "cursor-default text-foreground"
                                }`}
                                title={isAdmin ? "Klicken zum Bearbeiten" : undefined}
                              >
                                {g.zustaendig || <span className="text-muted-foreground italic text-xs">—</span>}
                              </button>
                            )}
                          </td>

                          {/* Bestellt-Status */}
                          <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                            {isOrdered ? (
                              <button
                                onClick={() => openOrderModal(g)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-colors"
                                title="Bestellung aufheben"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {bestellt.kuerzel || "✓"}
                              </button>
                            ) : (
                              <button
                                onClick={() => openOrderModal(g)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg text-xs font-semibold transition-colors"
                              >
                                <Circle className="w-3.5 h-3.5" />
                                Offen
                              </button>
                            )}
                          </td>

                          {/* Bearbeiten (Admin) */}
                          {editMode && (
                            <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditGebiet(g)}
                                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                  title="Bearbeiten"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`"${g.name}" wirklich löschen?`)) handleDeleteGebiet(g.id);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                                  title="Löschen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
        )}

        {/* ═══════════════ PLANANSICHT ═══════════════ */}
        {selectedMarketId && activeTab === "plan" && (
          <>
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

                          <div style={{ padding:"6px 28px 4px 8px", display:"flex", flexDirection:"column", height:"100%", justifyContent:"flex-start" }}>
                            {renamingId === g.id ? (
                              <div onMouseDown={e => e.stopPropagation()} style={{ display:"flex", gap:4 }}>
                                <input
                                  autoFocus
                                  value={renameVal}
                                  onChange={e => setRenameVal(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") { handleRename(g.id, renameVal); setRenamingId(null); }
                                    if (e.key === "Escape") setRenamingId(null);
                                  }}
                                  style={{ width:"100%", border:"1px solid "+g.farbe, borderRadius:6, padding:"2px 4px", fontSize:13, fontWeight:600, color:g.farbe, background:"white" }}
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
                          }}>✓</div>
                        )}
                        <span style={{
                          fontSize: g.w < 120 ? 12 : 14, fontWeight:700,
                          color: isOrdered ? "white" : g.farbe,
                          textAlign:"center", lineHeight:1.3, wordBreak:"break-word",
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

            {gebiete.length > 0 && (
              <div className="flex justify-end gap-2">
                <button onClick={() => setCanvasScale(s => Math.max(0.3, +(s - 0.1).toFixed(1)))}
                  className="px-3 py-1.5 text-xs bg-white border border-border/60 rounded-lg hover:bg-secondary text-muted-foreground">−</button>
                <button onClick={() => setCanvasScale(1)}
                  className="px-3 py-1.5 text-xs bg-white border border-border/60 rounded-lg hover:bg-secondary text-muted-foreground min-w-[56px] text-center">
                  {Math.round(canvasScale * 100)}%
                </button>
                <button onClick={() => setCanvasScale(s => Math.min(2, +(s + 0.1).toFixed(1)))}
                  className="px-3 py-1.5 text-xs bg-white border border-border/60 rounded-lg hover:bg-secondary text-muted-foreground">+</button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════ LIEFERPLAN-TAB ═══════════════ */}
        {activeTab === "lieferplan" && (
          <div className="space-y-4">
            {lieferplaene.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Kein Lieferplan für diesen Markt hinterlegt.</p>
              </div>
            ) : (
              <>
                {/* Nächste Bestellfristen in kompakter Liste */}
                <div className="bg-white border border-border/60 rounded-2xl overflow-hidden">
                  <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1a3a6b]" />
                    <h2 className="font-bold text-sm text-foreground uppercase tracking-wide">Nächste Bestellfristen</h2>
                  </div>
                  <div className="divide-y divide-border/40">
                    {calcNextDeadlines(lieferplaene).map((nd, i) => {
                      const kat = getKat(nd.plan.kategorie);
                      const urgent = nd.daysUntil === 0;
                      const soon   = nd.daysUntil === 1;
                      const dayLabel = nd.daysUntil === 0 ? "Heute" : nd.daysUntil === 1 ? "Morgen" : WTAG_LANG[nd.plan.bestelltag!];
                      const rowBg = urgent ? "bg-red-50" : soon ? "bg-amber-50" : "bg-white";
                      return (
                        <div key={`nd-${nd.plan.id}-${i}`} className={`px-4 py-3 flex items-center gap-3 ${rowBg}`}>
                          <div className="w-24 shrink-0">
                            <span className={`text-xs font-bold uppercase tracking-wide ${urgent ? "text-red-600" : soon ? "text-amber-600" : "text-gray-500"}`}>
                              {dayLabel}
                            </span>
                            {nd.plan.bestellschluss_uhrzeit && (
                              <span className={`block text-xs ${urgent ? "text-red-500" : "text-gray-400"}`}>
                                bis {nd.plan.bestellschluss_uhrzeit} Uhr
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{nd.plan.name}</p>
                            {nd.plan.notiz && <p className="text-xs text-gray-400 truncate">{nd.plan.notiz}</p>}
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${kat.bg} ${kat.border} ${kat.text}`}>
                              {kat.label}
                            </span>
                            <span className="text-xs text-gray-400">
                              → Lieferung {WTAG_KURZ[nd.plan.liefertag]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Wochenplan nach Liefertag */}
                <div className="bg-white border border-border/60 rounded-2xl overflow-hidden">
                  <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#1a3a6b]" />
                    <h2 className="font-bold text-sm text-foreground uppercase tracking-wide">Wöchentlicher Lieferplan</h2>
                  </div>
                  {[1,2,3,4,5,6,7].map(dow => {
                    const dayPlaene = lieferplaene.filter(p => p.liefertag === dow);
                    if (!dayPlaene.length) return null;
                    const todayDow = jsTagToOurs(new Date());
                    const isToday = dow === todayDow;
                    return (
                      <div key={dow} className={`border-t border-border/40 ${isToday ? "bg-[#1a3a6b]/4" : ""}`}>
                        <div className={`px-4 py-2 flex items-center gap-2 ${isToday ? "bg-[#1a3a6b]/8" : ""}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isToday ? "bg-[#1a3a6b] text-white" : "bg-secondary text-muted-foreground"
                          }`}>
                            {WTAG_KURZ[dow]}
                          </div>
                          <span className={`text-sm font-bold ${isToday ? "text-[#1a3a6b]" : "text-foreground"}`}>
                            {WTAG_LANG[dow]}
                            {isToday && <span className="ml-2 text-[10px] bg-[#1a3a6b] text-white px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">Heute</span>}
                          </span>
                        </div>
                        <div className="px-4 pb-3 space-y-2">
                          {dayPlaene.map(p => {
                            const kat = getKat(p.kategorie);
                            return (
                              <div key={p.id} className={`border rounded-xl p-3 ${kat.bg} ${kat.border}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold uppercase tracking-wide ${kat.bg} ${kat.border} ${kat.text}`}>
                                        {kat.label}
                                      </span>
                                      <span className={`text-sm font-bold ${kat.text}`}>{p.name}</span>
                                    </div>
                                    {p.notiz && (
                                      <p className="text-xs text-gray-500 mt-1">{p.notiz}</p>
                                    )}
                                  </div>
                                  {p.bestelltag ? (
                                    <div className="shrink-0 text-right">
                                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Bestellen bis</p>
                                      <p className="text-sm font-bold text-gray-700">
                                        {WTAG_LANG[p.bestelltag]}
                                        {p.bestellschluss_uhrzeit && (
                                          <span className="text-xs font-semibold text-gray-500"> {p.bestellschluss_uhrzeit} Uhr</span>
                                        )}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="shrink-0 text-right">
                                      <p className="text-xs text-gray-400 italic">Unabhängiger Bestelltag</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Add Gebiet Modal ──────────────────────────────────────────────────── */}
        {showAdd && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
              <h2 className="text-base font-bold">Bestellgebiet hinzufügen</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name <span className="text-red-500">*</span></label>
                  <input
                    autoFocus
                    value={addName}
                    onChange={e => setAddName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddGebiet()}
                    placeholder="z.B. Trockenwaren, Süßwaren..."
                    className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sortiment</label>
                  <textarea
                    value={addSortiment}
                    onChange={e => setAddSortiment(e.target.value)}
                    placeholder="z.B. Chips + Salzgebäck + Süßwaren"
                    rows={2}
                    className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zuständig</label>
                  <input
                    value={addZustaendig}
                    onChange={e => setAddZustaendig(e.target.value)}
                    placeholder="Name des Mitarbeiters"
                    className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lieferkategorie</label>
                  <select
                    value={addKategorie}
                    onChange={e => setAddKategorie(e.target.value)}
                    className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 bg-white"
                  >
                    <option value="">— keine —</option>
                    <option value="trocken">Trocken</option>
                    <option value="tk">TK</option>
                    <option value="getraenke">Getränke</option>
                    <option value="werbeware">Werbeware</option>
                  </select>
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

        {/* ── Edit Gebiet Modal (Liste) ─────────────────────────────────────────── */}
        {editingGebiet && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">Gebiet bearbeiten</h2>
                <button onClick={() => setEditingGebiet(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name <span className="text-red-500">*</span></label>
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sortiment</label>
                  <textarea
                    value={editSortiment}
                    onChange={e => setEditSortiment(e.target.value)}
                    placeholder="z.B. Chips + Salzgebäck + Süßwaren"
                    rows={3}
                    className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zuständig</label>
                  <input
                    value={editZustaendig}
                    onChange={e => setEditZustaendig(e.target.value)}
                    placeholder="Name des Mitarbeiters"
                    className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lieferkategorie</label>
                  <select
                    value={editKategorie}
                    onChange={e => setEditKategorie(e.target.value)}
                    className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 bg-white"
                  >
                    <option value="">— keine —</option>
                    <option value="trocken">Trocken</option>
                    <option value="tk">TK</option>
                    <option value="getraenke">Getränke</option>
                    <option value="werbeware">Werbeware</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Farbe</label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {FARBEN.map(f => (
                      <button
                        key={f} onClick={() => setEditFarbe(f)}
                        style={{ background: f, width: 28, height: 28, borderRadius: 8,
                          border: editFarbe === f ? "3px solid #fff" : "2px solid rgba(0,0,0,0.1)",
                          outline: editFarbe === f ? `2px solid ${f}` : "none",
                          cursor: "pointer" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditingGebiet(null)}
                  className="flex-1 px-4 py-2.5 border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground">
                  Abbrechen
                </button>
                <button onClick={handleSaveEdit} disabled={!editName.trim() || editSaving}
                  className="flex-1 px-4 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-50">
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Speichern"}
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
                  {orderGebiet.sortiment && (
                    <p className="text-xs text-muted-foreground mt-0.5">{orderGebiet.sortiment}</p>
                  )}
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
                    placeholder={orderGebiet.zustaendig ? orderGebiet.zustaendig.slice(0,4).toUpperCase() : "z.B. MK"}
                    className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Anmerkung (optional)</label>
                  <input
                    value={orderAnmerkung}
                    onChange={e => setOrderAnmerkung(e.target.value)}
                    placeholder="z.B. Fehlmenge, Sonderbestellung..."
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
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
                  style={{ background: orderGebiet.farbe }}>
                  {ordering ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Als bestellt markieren"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
