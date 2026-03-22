import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  CalendarCheck, ChevronLeft, CheckCircle2, AlertTriangle,
  Clock, X, Info, Pencil, Check, Plus, Trash2, ChevronDown, ChevronUp,
  LayoutGrid, List,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function dateLabel(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

interface Bereich {
  id: number; zone: string | null; farbe: string | null; name: string;
  beschreibung: string | null; intervallTage: number;
  reduzierungTage: number; entnahmeTage: number; sortOrder: number; aktiv: boolean;
}
interface Kontrolle {
  id: number; bereichId: number; datum: string;
  kuerzel: string | null; bemerkung: string | null; createdAt: string;
}

type StatusCode = "heute" | "ok" | "bald" | "faellig" | "ueberfaellig" | "nie";

function calcStatus(b: Bereich, latestKontrolle: Kontrolle | undefined, today: string): StatusCode {
  if (!latestKontrolle) return "nie";
  if (latestKontrolle.datum === today) return "heute";
  const last = new Date(latestKontrolle.datum + "T12:00:00");
  const now  = new Date(today + "T12:00:00");
  const daysSince = Math.floor((now.getTime() - last.getTime()) / 86400000);
  if (daysSince <= b.intervallTage)              return "ok";
  if (daysSince <= b.intervallTage * 1.5)        return "bald";
  if (daysSince <= b.intervallTage * 2.5)        return "faellig";
  return "ueberfaellig";
}

const STATUS_META: Record<StatusCode, { label: string; cardBg: string; cardBorder: string; badge: string; badgeText: string; dotColor: string; priority: number }> = {
  heute:       { label: "Heute kontrolliert",  cardBg: "bg-green-50",   cardBorder: "border-green-300",  badge: "bg-green-100 border-green-300",   badgeText: "text-green-700",  dotColor: "bg-green-500",  priority: 0 },
  ok:          { label: "Im Intervall",         cardBg: "bg-white",      cardBorder: "border-gray-200",   badge: "bg-gray-100 border-gray-200",     badgeText: "text-gray-500",   dotColor: "bg-green-400",  priority: 1 },
  bald:        { label: "Bald faellig",         cardBg: "bg-yellow-50",  cardBorder: "border-yellow-200", badge: "bg-yellow-100 border-yellow-300", badgeText: "text-yellow-700", dotColor: "bg-yellow-400", priority: 2 },
  faellig:     { label: "Faellig",              cardBg: "bg-orange-50",  cardBorder: "border-orange-300", badge: "bg-orange-100 border-orange-300", badgeText: "text-orange-700", dotColor: "bg-orange-500", priority: 3 },
  ueberfaellig:{ label: "Ueberfaellig",         cardBg: "bg-red-50",     cardBorder: "border-red-300",    badge: "bg-red-100 border-red-300",       badgeText: "text-red-700",    dotColor: "bg-red-500",    priority: 4 },
  nie:         { label: "Nie kontrolliert",     cardBg: "bg-red-50",     cardBorder: "border-red-400",    badge: "bg-red-200 border-red-400",       badgeText: "text-red-800",    dotColor: "bg-red-600",    priority: 5 },
};

// Zone display order
const ZONE_ORDER = ["Obst & Gemuese","Kuehlregal Wand","Feinkost Bedienung","Backwaren","Tiefkuehlung","Getraenkemarkt"];

const ZONE_ICONS: Record<string, string> = {
  "Obst & Gemuese":    "🥦",
  "Kuehlregal Wand":   "🧊",
  "Feinkost Bedienung":"🧀",
  "Backwaren":         "🍞",
  "Tiefkuehlung":      "❄️",
  "Getraenkemarkt":    "🍺",
};

interface EditState { name: string; beschreibung: string; zone: string; intervallTage: number; reduzierungTage: number; entnahmeTage: number; }

export default function WareMHD() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = !!adminSession;
  const today = todayIso();

  const [bereiche, setBereiche] = useState<Bereich[]>([]);
  const [kontrollen, setKontrollen] = useState<Kontrolle[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"plan"|"liste">("plan");
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set());

  // Marking
  const [marking, setMarking] = useState<number|null>(null);
  const [markKuerzel, setMarkKuerzel] = useState("");
  const [markBemerkung, setMarkBemerkung] = useState("");

  // Inline edit
  const [editingId, setEditingId] = useState<number|null>(null);
  const [editState, setEditState] = useState<EditState>({ name:"", beschreibung:"", zone:"", intervallTage:1, reduzierungTage:3, entnahmeTage:1 });
  const [editSaving, setEditSaving] = useState(false);

  // New bereich form
  const [showNew, setShowNew] = useState(false);
  const [newState, setNewState] = useState<EditState>({ name:"", beschreibung:"", zone:"", intervallTage:1, reduzierungTage:3, entnahmeTage:1 });
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

  // Latest kontrolle per bereich (sorted by datum desc)
  const latestMap = useMemo(() => {
    const m = new Map<number, Kontrolle>();
    for (const k of kontrollen) {
      const ex = m.get(k.bereichId);
      if (!ex || k.datum > ex.datum) m.set(k.bereichId, k);
    }
    return m;
  }, [kontrollen]);

  const todaySet = useMemo(() => new Set(kontrollen.filter(k => k.datum === today).map(k => k.bereichId)), [kontrollen, today]);

  // Group bereiche by zone
  const zones = useMemo(() => {
    const zoneMap = new Map<string, Bereich[]>();
    for (const b of bereiche) {
      const z = b.zone || "Sonstiges";
      if (!zoneMap.has(z)) zoneMap.set(z, []);
      zoneMap.get(z)!.push(b);
    }
    // Sort by ZONE_ORDER, then alphabetical
    return Array.from(zoneMap.entries()).sort(([a], [b]) => {
      const ai = ZONE_ORDER.indexOf(a); const bi = ZONE_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1; if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [bereiche]);

  // Stats
  const stats = useMemo(() => {
    let ok=0, warning=0, danger=0, none=0;
    for (const b of bereiche) {
      const s = calcStatus(b, latestMap.get(b.id), today);
      if (s === "heute" || s === "ok") ok++;
      else if (s === "bald") warning++;
      else if (s === "faellig" || s === "ueberfaellig") danger++;
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
        kuerzel: markKuerzel.trim().toUpperCase() || null, bemerkung: markBemerkung.trim() || null }) });
    setMarking(null);
    await loadKontrollen();
  };

  const startEdit = (b: Bereich) => {
    setEditingId(b.id);
    setEditState({ name: b.name, beschreibung: b.beschreibung || "", zone: b.zone || "", intervallTage: b.intervallTage, reduzierungTage: b.reduzierungTage, entnahmeTage: b.entnahmeTage });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditSaving(true);
    try {
      await fetch(`${BASE}/ware-mhd-bereiche/${editingId}`, { method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...editState, beschreibung: editState.beschreibung.trim() || null, zone: editState.zone.trim() || null }) });
      setEditingId(null);
      await loadBereiche();
    } finally { setEditSaving(false); }
  };

  const deleteBereich = async (id: number) => {
    await fetch(`${BASE}/ware-mhd-bereiche/${id}`, { method:"DELETE" });
    await loadBereiche();
  };

  const saveNew = async () => {
    if (!newState.name.trim()) return;
    setNewSaving(true);
    try {
      await fetch(`${BASE}/ware-mhd-bereiche`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ marketId: selectedMarketId, ...newState, beschreibung: newState.beschreibung.trim() || null, zone: newState.zone.trim() || null, sortOrder: bereiche.length + 10 }) });
      setShowNew(false);
      setNewState({ name:"", beschreibung:"", zone:"", intervallTage:1, reduzierungTage:3, entnahmeTage:1 });
      await loadBereiche();
    } finally { setNewSaving(false); }
  };

  const toggleZone = (z: string) => setCollapsedZones(s => { const n = new Set(s); n.has(z) ? n.delete(z) : n.add(z); return n; });

  const markedBereich = bereiche.find(b => b.id === marking);
  const editBereich   = bereiche.find(b => b.id === editingId);

  const allZones = useMemo(() => Array.from(new Set(bereiche.map(b => b.zone || ""))).filter(Boolean).sort(), [bereiche]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href="/ware" className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground mt-1">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">MHD Kontrolle</h1>
            <p className="text-sm text-muted-foreground">Ladenplan Leeder - Regalmeter-Uberwachung</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setView("plan")}
              className={`p-2 rounded-xl text-sm transition-colors ${view==="plan" ? "bg-[#1a3a6b] text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("liste")}
              className={`p-2 rounded-xl text-sm transition-colors ${view==="liste" ? "bg-[#1a3a6b] text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status-Leiste */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <StatBadge color="bg-green-500"  value={stats.ok}      label="Aktuell" />
              <StatBadge color="bg-yellow-400" value={stats.warning}  label="Bald faellig" />
              <StatBadge color="bg-red-500"    value={stats.danger}   label="Ueberfaellig" pulse />
              <StatBadge color="bg-gray-400"   value={stats.none}     label="Nie geprueft" />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{todaySet.size}</span>/{stats.gesamt} heute kontrolliert
            </div>
          </div>
          {stats.gesamt > 0 && (
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden flex gap-0.5">
              <div className="h-full bg-green-500 rounded-l-full transition-all" style={{ width:`${(stats.ok/stats.gesamt)*100}%` }} />
              <div className="h-full bg-yellow-400 transition-all" style={{ width:`${(stats.warning/stats.gesamt)*100}%` }} />
              <div className="h-full bg-red-500 rounded-r-full transition-all" style={{ width:`${((stats.danger+stats.none)/stats.gesamt)*100}%` }} />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {(Object.entries(STATUS_META) as [StatusCode, typeof STATUS_META[StatusCode]][]).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5 text-muted-foreground">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${v.dotColor}`} />
              {v.label}
            </span>
          ))}
        </div>

        {/* Admin: Neuer Bereich */}
        {isAdmin && (
          <div>
            <button onClick={() => setShowNew(!showNew)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 text-white text-sm font-bold transition-colors">
              <Plus className="w-4 h-4" /> Neuer Regalbereich
            </button>
            {showNew && (
              <div className="mt-3 bg-white rounded-2xl border-2 border-[#1a3a6b]/20 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-foreground text-sm">Neuer Regalbereich</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Name *" value={newState.name} onChange={e => setNewState(p=>({...p, name:e.target.value}))}
                    className="text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <select value={newState.zone} onChange={e => setNewState(p=>({...p, zone:e.target.value}))}
                    className="text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="">Zone wahlen...</option>
                    {allZones.map(z => <option key={z} value={z}>{z}</option>)}
                    <option value="__new__">+ Neue Zone</option>
                  </select>
                  {newState.zone === "__new__" && (
                    <input placeholder="Neue Zone eingeben" onChange={e => setNewState(p=>({...p, zone:e.target.value}))}
                      className="text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 sm:col-span-2" />
                  )}
                  <input placeholder="Beschreibung / Lage" value={newState.beschreibung} onChange={e => setNewState(p=>({...p, beschreibung:e.target.value}))}
                    className="text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 sm:col-span-2" />
                </div>
                <IntervalFields state={newState} onChange={setNewState} />
                <div className="flex gap-3">
                  <button onClick={() => { setShowNew(false); setNewState({ name:"", beschreibung:"", zone:"", intervallTage:1, reduzierungTage:3, entnahmeTage:1 }); }}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary">Abbrechen</button>
                  <button onClick={saveNew} disabled={newSaving || !newState.name.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 disabled:opacity-50 text-white text-sm font-bold">
                    {newSaving ? "Speichern..." : "Anlegen"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-secondary/50 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {/* LADENPLAN VIEW */}
        {!loading && view === "plan" && (
          <div className="space-y-4">
            {zones.map(([zone, items]) => {
              const collapsed = collapsedZones.has(zone);
              const zoneFarbe = items[0]?.farbe || "#1a3a6b";
              const zoneOk    = items.filter(b => { const s = calcStatus(b, latestMap.get(b.id), today); return s === "heute" || s === "ok"; }).length;
              const zoneTotal = items.length;
              const zoneHasDanger = items.some(b => { const s = calcStatus(b, latestMap.get(b.id), today); return s === "ueberfaellig" || s === "nie"; });
              const icon = ZONE_ICONS[zone] || "📦";
              return (
                <div key={zone} className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                  {/* Zone Header */}
                  <button onClick={() => toggleZone(zone)}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: zoneFarbe }} />
                    <span className="text-lg">{icon}</span>
                    <span className="font-bold text-foreground text-base flex-1 text-left">{zone}</span>
                    {zoneHasDanger && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                    <span className="text-xs text-muted-foreground">{zoneOk}/{zoneTotal}</span>
                    {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {/* Zone progress bar */}
                  <div className="h-1 mx-5 mb-0 rounded-full overflow-hidden bg-secondary">
                    <div className="h-full transition-all" style={{ width:`${(zoneOk/zoneTotal)*100}%`, background: zoneFarbe }} />
                  </div>

                  {/* Shelf Cards */}
                  {!collapsed && (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map(b => {
                        const latest = latestMap.get(b.id);
                        const st     = calcStatus(b, latest, today);
                        const meta   = STATUS_META[st];
                        const isEditing = editingId === b.id;
                        return (
                          <div key={b.id} className={`rounded-xl border-2 overflow-hidden transition-all ${meta.cardBg} ${meta.cardBorder} ${isEditing ? "ring-2 ring-[#1a3a6b]/30" : ""}`}>
                            {isEditing ? (
                              /* ── Inline Editor ── */
                              <div className="p-4 space-y-3">
                                <p className="text-xs font-bold text-[#1a3a6b] uppercase tracking-wider">Bearbeiten</p>
                                <input value={editState.name} onChange={e => setEditState(p=>({...p, name:e.target.value}))}
                                  className="w-full text-sm border border-border rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40" />
                                <input placeholder="Beschreibung / Lage" value={editState.beschreibung} onChange={e => setEditState(p=>({...p, beschreibung:e.target.value}))}
                                  className="w-full text-sm border border-border rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40" />
                                <IntervalFields state={editState} onChange={setEditState} compact />
                                <div className="flex gap-2">
                                  <button onClick={() => setEditingId(null)}
                                    className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-white">
                                    Abbrechen
                                  </button>
                                  <button onClick={saveEdit} disabled={editSaving}
                                    className="flex-1 py-2 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold disabled:opacity-50">
                                    {editSaving ? "..." : "Speichern"}
                                  </button>
                                </div>
                                <button onClick={() => { if(confirm("Regalbereich loeschen?")) deleteBereich(b.id); setEditingId(null); }}
                                  className="w-full py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 border border-red-200">
                                  Bereich loeschen
                                </button>
                              </div>
                            ) : (
                              /* ── Normal Card ── */
                              <div>
                                {/* Color top bar */}
                                <div className="h-1 w-full" style={{ background: b.farbe || zoneFarbe }} />
                                <div className="p-3">
                                  <div className="flex items-start justify-between gap-1 mb-2">
                                    <p className="font-bold text-sm text-foreground leading-tight flex-1">{b.name}</p>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {(st === "ueberfaellig" || st === "nie")
                                        ? <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                                        : st === "faellig" ? <Clock className="w-4 h-4 text-orange-500" />
                                        : (st === "heute" || st === "ok") ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        : <Clock className="w-4 h-4 text-yellow-500" />}
                                      {isAdmin && (
                                        <button onClick={e => { e.stopPropagation(); startEdit(b); }}
                                          className="p-1 rounded-lg hover:bg-white/70 text-muted-foreground transition-colors">
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {b.beschreibung && <p className="text-xs text-muted-foreground mb-2 leading-tight">{b.beschreibung}</p>}

                                  {/* Status badge */}
                                  <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border mb-2 ${meta.badge} ${meta.badgeText}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${meta.dotColor} ${st === "ueberfaellig" || st === "nie" ? "animate-pulse" : ""}`} />
                                    {meta.label}
                                  </span>

                                  {/* MHD Rules */}
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mt-1 mb-3">
                                    <span className="text-muted-foreground">Intervall: <span className="font-semibold text-foreground">{b.intervallTage}d</span></span>
                                    <span className="text-amber-600">Reduz.: <span className="font-semibold">&lt;{b.reduzierungTage}d MHD</span></span>
                                    <span className="text-red-600">Entnahme: <span className="font-semibold">&lt;{b.entnahmeTage}d MHD</span></span>
                                  </div>

                                  {/* Last check */}
                                  {latest && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                      Letzte Pruefung: <span className="font-medium text-foreground">{dateLabel(latest.datum)}</span>
                                      {latest.kuerzel ? ` · ${latest.kuerzel}` : ""}
                                    </p>
                                  )}
                                  {!latest && <p className="text-xs text-red-500 font-medium mb-2">Noch nie kontrolliert</p>}

                                  {/* Action button */}
                                  <button onClick={() => handleToggle(b)}
                                    className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                      todaySet.has(b.id)
                                        ? "bg-green-500 hover:bg-green-600 text-white"
                                        : "bg-white hover:bg-gray-50 text-foreground border border-gray-200 hover:border-gray-300 shadow-sm"
                                    }`}>
                                    {todaySet.has(b.id) ? (<><Check className="w-3.5 h-3.5" /> Kontrolliert (Rueckgangig)</>)
                                                        : (<><CalendarCheck className="w-3.5 h-3.5" /> Jetzt kontrollieren</>)}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* LISTEN VIEW - sorted by urgency */}
        {!loading && view === "liste" && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="divide-y divide-border/50">
              {bereiche
                .slice()
                .sort((a, b) => {
                  const sa = STATUS_META[calcStatus(a, latestMap.get(a.id), today)].priority;
                  const sb = STATUS_META[calcStatus(b, latestMap.get(b.id), today)].priority;
                  if (sa !== sb) return sb - sa; // highest priority first
                  return a.sortOrder - b.sortOrder;
                })
                .map(b => {
                  const latest = latestMap.get(b.id);
                  const st     = calcStatus(b, latest, today);
                  const meta   = STATUS_META[st];
                  const zoneFarbe = b.farbe || "#1a3a6b";
                  return (
                    <div key={b.id} className={`flex items-center gap-3 px-5 py-3.5 ${meta.cardBg}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dotColor} ${st === "ueberfaellig" || st === "nie" ? "animate-pulse" : ""}`} />
                      <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: zoneFarbe }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.zone} · Reduz. &lt;{b.reduzierungTage}d · Entnahme &lt;{b.entnahmeTage}d</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className={`text-xs font-bold ${meta.badgeText}`}>{meta.label}</p>
                        {latest && <p className="text-xs text-muted-foreground">{dateLabel(latest.datum)}{latest.kuerzel ? ` · ${latest.kuerzel}` : ""}</p>}
                        {!latest && <p className="text-xs text-red-500">Nie geprueft</p>}
                      </div>
                      <button onClick={() => handleToggle(b)}
                        className={`flex-shrink-0 p-2 rounded-xl transition-colors ${todaySet.has(b.id) ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-muted-foreground hover:text-foreground"}`}>
                        {todaySet.has(b.id) ? <CheckCircle2 className="w-4 h-4" /> : <CalendarCheck className="w-4 h-4" />}
                      </button>
                      {isAdmin && (
                        <button onClick={() => startEdit(b)}
                          className="flex-shrink-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Edit Dialog (for list view) */}
        {editingId !== null && view === "liste" && editBereich && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Bearbeiten</h3>
                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <input value={editState.name} onChange={e => setEditState(p=>({...p, name:e.target.value}))}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <input placeholder="Beschreibung" value={editState.beschreibung} onChange={e => setEditState(p=>({...p, beschreibung:e.target.value}))}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <IntervalFields state={editState} onChange={setEditState} />
              <div className="flex gap-3">
                <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground">Abbrechen</button>
                <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50">
                  {editSaving ? "..." : "Speichern"}
                </button>
              </div>
              <button onClick={() => { if(confirm("Loeschen?")) deleteBereich(editingId!); setEditingId(null); }}
                className="w-full py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 border border-red-200">
                <Trash2 className="w-4 h-4 inline mr-1" /> Bereich loeschen
              </button>
            </div>
          </div>
        )}

        {/* Mark Dialog */}
        {marking !== null && markedBereich && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">{markedBereich.name}</h3>
                  <p className="text-xs text-muted-foreground">{markedBereich.zone}</p>
                </div>
                <button onClick={() => setMarking(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>

              {/* MHD-Regeln als Erinnerung */}
              <div className="bg-blue-50 rounded-xl p-3 space-y-1 text-xs">
                <p className="font-bold text-blue-800 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> MHD-Regeln fur diesen Bereich</p>
                <p className="text-blue-700">Kontrollintervall: alle <strong>{markedBereich.intervallTage} Tag(e)</strong></p>
                <p className="text-amber-700">Preisreduzierung: bei MHD-Rest &lt; <strong>{markedBereich.reduzierungTage} Tag(e)</strong></p>
                <p className="text-red-700">Entnahme/Entsorgung: bei MHD-Rest &lt; <strong>{markedBereich.entnahmeTage} Tag(e)</strong></p>
              </div>

              <input type="text" placeholder="Kuerzel (optional)" maxLength={5} value={markKuerzel}
                onChange={e => setMarkKuerzel(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase" />
              <textarea rows={2} placeholder="Bemerkung (optional, z.B. Ware reduziert, Artikel entnommen)" value={markBemerkung}
                onChange={e => setMarkBemerkung(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
              <div className="flex gap-3">
                <button onClick={() => setMarking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary">Abbrechen</button>
                <button onClick={handleMark}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm">
                  <CalendarCheck className="w-4 h-4" /> Kontrolliert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function StatBadge({ color, value, label, pulse }: { color: string; value: number; label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${color} ${pulse && value > 0 ? "animate-pulse" : ""}`} />
      <span className="font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function IntervalFields({
  state, onChange, compact,
}: { state: EditState; onChange: (s: EditState) => void; compact?: boolean }) {
  return (
    <div className={`grid grid-cols-3 gap-2 ${compact ? "" : "mt-1"}`}>
      <div>
        <label className={`block font-semibold text-muted-foreground mb-1 ${compact ? "text-xs" : "text-xs"}`}>Intervall (Tage)</label>
        <input type="number" min={1} value={state.intervallTage}
          onChange={e => onChange({...state, intervallTage: Number(e.target.value)})}
          className={`w-full border border-border rounded-${compact?"lg":"xl"} px-2 py-${compact?"1.5":"2.5"} text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-center`} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-amber-600 mb-1">Reduzierung (Tage)</label>
        <input type="number" min={0} value={state.reduzierungTage}
          onChange={e => onChange({...state, reduzierungTage: Number(e.target.value)})}
          className={`w-full border border-amber-200 rounded-${compact?"lg":"xl"} px-2 py-${compact?"1.5":"2.5"} text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 text-center`} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-red-600 mb-1">Entnahme (Tage)</label>
        <input type="number" min={0} value={state.entnahmeTage}
          onChange={e => onChange({...state, entnahmeTage: Number(e.target.value)})}
          className={`w-full border border-red-200 rounded-${compact?"lg":"xl"} px-2 py-${compact?"1.5":"2.5"} text-sm bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/40 text-center`} />
      </div>
    </div>
  );
}
