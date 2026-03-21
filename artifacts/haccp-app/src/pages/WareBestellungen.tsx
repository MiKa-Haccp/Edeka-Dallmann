import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ShoppingCart, Plus, Trash2, Check, ChevronLeft,
  Settings, X, CheckCircle2, Circle, Clock,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

interface Rayon { id: number; name: string; beschreibung: string | null; farbe: string | null; sortOrder: number; aktiv: boolean; }
interface Bestellung { id: number; rayonId: number; datum: string; kuerzel: string | null; anmerkung: string | null; createdAt: string; }

const FARBEN = ["#1a3a6b","#059669","#d97706","#dc2626","#7c3aed","#0891b2","#be185d","#374151"];

export default function WareBestellungen() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = !!adminSession;
  const [datum, setDatum] = useState(todayIso());
  const [rayons, setRayons] = useState<Rayon[]>([]);
  const [bestellungen, setBestellungen] = useState<Bestellung[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"dashboard"|"admin">("dashboard");

  // Admin form
  const [newName, setNewName] = useState("");
  const [newBeschr, setNewBeschr] = useState("");
  const [newFarbe, setNewFarbe] = useState(FARBEN[0]);
  const [saving, setSaving] = useState(false);

  // Mark dialog
  const [marking, setMarking] = useState<number|null>(null);
  const [markKuerzel, setMarkKuerzel] = useState("");
  const [markAnmerkung, setMarkAnmerkung] = useState("");

  const loadRayons = useCallback(async () => {
    if (!selectedMarketId) return;
    const r = await fetch(`${BASE}/ware-rayons?marketId=${selectedMarketId}`);
    setRayons(await r.json());
  }, [selectedMarketId]);

  const loadBestellungen = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/ware-bestellungen?marketId=${selectedMarketId}&datum=${datum}`);
      setBestellungen(await r.json());
    } finally { setLoading(false); }
  }, [selectedMarketId, datum]);

  useEffect(() => { loadRayons(); }, [loadRayons]);
  useEffect(() => { loadBestellungen(); }, [loadBestellungen]);

  const bestelltMap = new Map(bestellungen.map(b => [b.rayonId, b]));

  const handleToggle = async (rayon: Rayon) => {
    const existing = bestelltMap.get(rayon.id);
    if (existing) {
      await fetch(`${BASE}/ware-bestellungen`, { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ marketId: selectedMarketId, rayonId: rayon.id, datum }) });
      await loadBestellungen();
    } else {
      setMarking(rayon.id);
    }
  };

  const handleMark = async () => {
    if (!marking) return;
    await fetch(`${BASE}/ware-bestellungen`, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ marketId: selectedMarketId, rayonId: marking, datum, kuerzel: markKuerzel.trim().toUpperCase() || null, anmerkung: markAnmerkung.trim() || null }) });
    setMarking(null); setMarkKuerzel(""); setMarkAnmerkung("");
    await loadBestellungen();
  };

  const handleAddRayon = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/ware-rayons`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ marketId: selectedMarketId, name: newName.trim(), beschreibung: newBeschr.trim() || null, farbe: newFarbe, sortOrder: rayons.length + 1 }) });
      setNewName(""); setNewBeschr(""); setNewFarbe(FARBEN[0]);
      await loadRayons();
    } finally { setSaving(false); }
  };

  const handleDeleteRayon = async (id: number) => {
    await fetch(`${BASE}/ware-rayons/${id}`, { method:"DELETE" });
    await loadRayons();
  };

  const bestellt = rayons.filter(r => bestelltMap.has(r.id)).length;
  const gesamt   = rayons.length;
  const alleDone = gesamt > 0 && bestellt === gesamt;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/ware" className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Bestellungen</h1>
            <p className="text-sm text-muted-foreground">Marktubersicht Rayons</p>
          </div>
          {isAdmin && (
            <button onClick={() => setTab(t => t === "admin" ? "dashboard" : "admin")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${tab==="admin" ? "bg-[#1a3a6b] text-white" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>
              <Settings className="w-4 h-4" /> {tab==="admin" ? "Fertig" : "Verwaltung"}
            </button>
          )}
        </div>

        {/* Admin-Tab */}
        {tab === "admin" && (
          <div className="bg-white rounded-2xl border-2 border-[#1a3a6b]/20 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-foreground">Rayons verwalten</h2>
            <div className="space-y-2">
              {rayons.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: r.farbe || "#1a3a6b" }} />
                  <span className="flex-1 font-medium text-sm">{r.name}</span>
                  {r.beschreibung && <span className="text-xs text-muted-foreground">{r.beschreibung}</span>}
                  <button onClick={() => handleDeleteRayon(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {rayons.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Noch keine Rayons angelegt</p>}
            </div>
            <div className="border-t border-border/60 pt-4 space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground">Neuer Rayon</h3>
              <input type="text" placeholder="Name des Rayons *" value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <input type="text" placeholder="Beschreibung (optional)" value={newBeschr} onChange={e => setNewBeschr(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <div className="flex gap-2 flex-wrap">
                {FARBEN.map(f => (
                  <button key={f} onClick={() => setNewFarbe(f)}
                    className={`w-7 h-7 rounded-full transition-transform ${newFarbe === f ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                    style={{ background: f }} />
                ))}
              </div>
              <button onClick={handleAddRayon} disabled={saving || !newName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                <Plus className="w-4 h-4" /> Rayon hinzufugen
              </button>
            </div>
          </div>
        )}

        {/* Datum + Fortschritt */}
        {tab === "dashboard" && (
          <>
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <input type="date" value={datum} max={todayIso()} onChange={e => setDatum(e.target.value)}
                  className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${alleDone ? "text-green-600" : "text-foreground"}`}>{bestellt}/{gesamt}</div>
                    <div className="text-xs text-muted-foreground">Rayons bestellt</div>
                  </div>
                  {alleDone && <CheckCircle2 className="w-8 h-8 text-green-500" />}
                </div>
              </div>
              {gesamt > 0 && (
                <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(bestellt/gesamt)*100}%` }} />
                </div>
              )}
            </div>

            {/* Rayon-Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-secondary/50 rounded-2xl animate-pulse" />)}
              </div>
            ) : rayons.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-10 text-center">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">Noch keine Rayons konfiguriert</p>
                {isAdmin && <p className="text-xs text-muted-foreground mt-1">Rayons im Verwaltungsbereich anlegen</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {rayons.map(rayon => {
                  const b = bestelltMap.get(rayon.id);
                  const done = !!b;
                  const zeit = b ? new Date(b.createdAt).toLocaleTimeString("de-DE", { hour:"2-digit", minute:"2-digit" }) : null;
                  return (
                    <button key={rayon.id} onClick={() => handleToggle(rayon)}
                      className={`group relative text-left rounded-2xl border-2 p-4 transition-all duration-200 shadow-sm hover:shadow-md ${done ? "border-green-400/60 bg-green-50" : "border-border/60 bg-white hover:border-gray-300"}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-3 h-3 rounded-full mt-1" style={{ background: rayon.farbe || "#1a3a6b" }} />
                        {done ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground/60" />}
                      </div>
                      <p className="font-bold text-sm text-foreground leading-tight">{rayon.name}</p>
                      {done ? (
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                          <Clock className="w-3 h-3" /> {zeit}{b?.kuerzel ? ` · ${b.kuerzel}` : ""}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">Zum Abhaken tippen</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Marking Dialog */}
        {marking !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">{rayons.find(r => r.id === marking)?.name}</h3>
                <button onClick={() => { setMarking(null); setMarkKuerzel(""); setMarkAnmerkung(""); }}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input type="text" placeholder="Kuerzel (optional)" maxLength={5} value={markKuerzel} onChange={e => setMarkKuerzel(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase" />
              <textarea rows={2} placeholder="Anmerkung (optional)" value={markAnmerkung} onChange={e => setMarkAnmerkung(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
              <div className="flex gap-3">
                <button onClick={() => { setMarking(null); setMarkKuerzel(""); setMarkAnmerkung(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary">Abbrechen</button>
                <button onClick={handleMark}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm">
                  <Check className="w-4 h-4" /> Bestellt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
