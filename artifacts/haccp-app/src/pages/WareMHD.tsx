import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  CalendarCheck, Plus, Trash2, ChevronLeft, Settings,
  CheckCircle2, AlertTriangle, Clock, X, Info, SlidersHorizontal,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

interface Bereich {
  id: number; name: string; beschreibung: string | null;
  intervallTage: number; reduzierungTage: number; entnahmeTage: number;
  sortOrder: number; aktiv: boolean;
}
interface Kontrolle {
  id: number; bereichId: number; datum: string;
  kuerzel: string | null; bemerkung: string | null; createdAt: string;
}

type BereichStatus = "ok" | "faellig" | "ueberfaellig" | "unbekannt";

function getStatus(b: Bereich, lastKontrolle: Kontrolle | undefined): BereichStatus {
  if (!lastKontrolle) return "unbekannt";
  const last = new Date(lastKontrolle.datum + "T12:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const daysSince = Math.floor((today.getTime() - last.getTime()) / 86400000);
  if (daysSince < b.intervallTage) return "ok";
  if (daysSince < b.intervallTage * 2) return "faellig";
  return "ueberfaellig";
}

function statusStyle(s: BereichStatus): { card: string; badge: string; label: string } {
  switch(s) {
    case "ok":           return { card: "border-green-300/60 bg-green-50/30", badge: "bg-green-100 text-green-700 border-green-300", label: "Kontrolliert" };
    case "faellig":      return { card: "border-amber-300/60 bg-amber-50/30", badge: "bg-amber-100 text-amber-700 border-amber-300", label: "Faellig" };
    case "ueberfaellig": return { card: "border-red-300/60 bg-red-50/30",     badge: "bg-red-100 text-red-700 border-red-300",       label: "Ueberfaellig" };
    default:             return { card: "border-border/60 bg-white",           badge: "bg-gray-100 text-gray-600 border-gray-200",    label: "Noch nicht geprueft" };
  }
}

export default function WareMHD() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = !!adminSession;
  const [bereiche, setBereiche] = useState<Bereich[]>([]);
  const [kontrollen, setKontrollen] = useState<Kontrolle[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"plan"|"admin">("plan");

  // Marking dialog
  const [marking, setMarking] = useState<number|null>(null);
  const [markKuerzel, setMarkKuerzel] = useState("");
  const [markBemerkung, setMarkBemerkung] = useState("");

  // Admin form
  const [newName, setNewName] = useState("");
  const [newBeschr, setNewBeschr] = useState("");
  const [newIntervall, setNewIntervall] = useState(1);
  const [newReduz, setNewReduz] = useState(3);
  const [newEntnahme, setNewEntnahme] = useState(1);
  const [saving, setSaving] = useState(false);

  const loadBereiche = useCallback(async () => {
    if (!selectedMarketId) return;
    const r = await fetch(`${BASE}/ware-mhd-bereiche?marketId=${selectedMarketId}`);
    setBereiche(await r.json());
  }, [selectedMarketId]);

  const loadKontrollen = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/ware-mhd-kontrollen?marketId=${selectedMarketId}`);
      setKontrollen(await r.json());
    } finally { setLoading(false); }
  }, [selectedMarketId]);

  useEffect(() => { loadBereiche(); loadKontrollen(); }, [loadBereiche, loadKontrollen]);

  // Get latest kontrolle per bereich
  const latestMap = new Map<number, Kontrolle>();
  for (const k of kontrollen) {
    const existing = latestMap.get(k.bereichId);
    if (!existing || k.datum > existing.datum) latestMap.set(k.bereichId, k);
  }

  const todayKontrolledIds = new Set(kontrollen.filter(k => k.datum === todayIso()).map(k => k.bereichId));

  const handleToggle = async (bereich: Bereich) => {
    const today = todayIso();
    if (todayKontrolledIds.has(bereich.id)) {
      // Unmark
      await fetch(`${BASE}/ware-mhd-kontrollen`, { method:"DELETE", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ marketId: selectedMarketId, bereichId: bereich.id, datum: today }) });
      await loadKontrollen();
    } else {
      setMarking(bereich.id);
    }
  };

  const handleMark = async () => {
    if (!marking) return;
    await fetch(`${BASE}/ware-mhd-kontrollen`, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ marketId: selectedMarketId, bereichId: marking, datum: todayIso(),
        kuerzel: markKuerzel.trim().toUpperCase() || null, bemerkung: markBemerkung.trim() || null }) });
    setMarking(null); setMarkKuerzel(""); setMarkBemerkung("");
    await loadKontrollen();
  };

  const handleAddBereich = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/ware-mhd-bereiche`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ marketId: selectedMarketId, name: newName.trim(), beschreibung: newBeschr.trim() || null,
          intervallTage: newIntervall, reduzierungTage: newReduz, entnahmeTage: newEntnahme, sortOrder: bereiche.length+1 }) });
      setNewName(""); setNewBeschr(""); setNewIntervall(1); setNewReduz(3); setNewEntnahme(1);
      await loadBereiche();
    } finally { setSaving(false); }
  };

  const handleDeleteBereich = async (id: number) => {
    await fetch(`${BASE}/ware-mhd-bereiche/${id}`, { method:"DELETE" });
    await loadBereiche();
  };

  const done = bereiche.filter(b => todayKontrolledIds.has(b.id)).length;
  const gesamt = bereiche.length;
  const overdue = bereiche.filter(b => getStatus(b, latestMap.get(b.id)) === "ueberfaellig").length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        <div className="flex items-center gap-3">
          <Link href="/ware" className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">MHD Kontrolle</h1>
            <p className="text-sm text-muted-foreground">Regalmeter-Uberwachung und Qualitassicherung</p>
          </div>
          {isAdmin && (
            <button onClick={() => setTab(t => t==="admin" ? "plan" : "admin")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${tab==="admin" ? "bg-[#1a3a6b] text-white" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>
              <Settings className="w-4 h-4" /> {tab==="admin" ? "Fertig" : "Verwaltung"}
            </button>
          )}
        </div>

        {/* Admin Tab */}
        {tab === "admin" && (
          <div className="bg-white rounded-2xl border-2 border-[#1a3a6b]/20 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-foreground">Regalbereiche verwalten</h2>
            <div className="space-y-2">
              {bereiche.map(b => (
                <div key={b.id} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{b.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Intervall: {b.intervallTage}d | Reduzierung ab: {b.reduzierungTage}d | Entnahme ab: {b.entnahmeTage}d
                    </p>
                  </div>
                  <button onClick={() => handleDeleteBereich(b.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {bereiche.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Noch keine Bereiche angelegt</p>}
            </div>
            <div className="border-t border-border/60 pt-4 space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground">Neuer Regalbereich</h3>
              <input type="text" placeholder="Name des Bereichs / Regalmeters *" value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <input type="text" placeholder="Beschreibung / Lage (optional)" value={newBeschr} onChange={e => setNewBeschr(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Intervall (Tage)</label>
                  <input type="number" min={1} value={newIntervall} onChange={e => setNewIntervall(Number(e.target.value))}
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-center" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-600 mb-1">Reduzierung (Tage)</label>
                  <input type="number" min={0} value={newReduz} onChange={e => setNewReduz(Number(e.target.value))}
                    className="w-full text-sm border border-amber-200 rounded-xl px-3 py-2.5 bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 text-center" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-red-600 mb-1">Entnahme (Tage)</label>
                  <input type="number" min={0} value={newEntnahme} onChange={e => setNewEntnahme(Number(e.target.value))}
                    className="w-full text-sm border border-red-200 rounded-xl px-3 py-2.5 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/40 text-center" />
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl px-3 py-2.5 flex gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-600">
                  Reduzierung = ab wie vielen Tagen vor MHD der Preis reduziert werden soll. Entnahme = ab wie vielen Tagen vor MHD die Ware entnommen werden soll.
                </p>
              </div>
              <button onClick={handleAddBereich} disabled={saving || !newName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                <Plus className="w-4 h-4" /> Bereich hinzufugen
              </button>
            </div>
          </div>
        )}

        {/* Ladenplan / Kontrolle */}
        {tab === "plan" && (
          <>
            {/* Status-Leiste */}
            {gesamt > 0 && (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{done}/{gesamt}</div>
                      <div className="text-xs text-muted-foreground">Heute geprueft</div>
                    </div>
                    {overdue > 0 && (
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">{overdue}</div>
                        <div className="text-xs text-muted-foreground">Uberfaellig</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"/>Kontrolliert</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"/>Faellig</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"/>Uberfaellig</span>
                  </div>
                </div>
                {gesamt > 0 && (
                  <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width:`${(done/gesamt)*100}%` }} />
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map(i=><div key={i} className="h-32 bg-secondary/50 rounded-2xl animate-pulse"/>)}
              </div>
            ) : bereiche.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border/60 p-10 text-center">
                <SlidersHorizontal className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">Noch keine Regalbereiche konfiguriert</p>
                {isAdmin && <p className="text-xs text-muted-foreground mt-1">Im Verwaltungsbereich Regalmeter anlegen</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {bereiche.map(b => {
                  const latest = latestMap.get(b.id);
                  const todayDone = todayKontrolledIds.has(b.id);
                  const st = todayDone ? "ok" : getStatus(b, latest);
                  const { card, badge, label } = statusStyle(st);
                  const lastCheck = latest ? new Date(latest.datum+"T12:00:00").toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit" }) : null;
                  const todayEntry = kontrollen.find(k => k.bereichId === b.id && k.datum === todayIso());
                  return (
                    <button key={b.id} onClick={() => handleToggle(b)}
                      className={`group text-left rounded-2xl border-2 p-4 transition-all duration-200 shadow-sm hover:shadow-md ${card}`}>
                      <div className="flex items-start justify-between mb-2">
                        {st === "ok"           ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        : st === "ueberfaellig" ? <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
                        : st === "faellig"      ? <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        :                         <Clock className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge}`}>{label}</span>
                      </div>
                      <p className="font-bold text-sm text-foreground leading-tight mt-1">{b.name}</p>
                      {b.beschreibung && <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.beschreibung}</p>}
                      <div className="mt-2 space-y-0.5">
                        {lastCheck && <p className="text-xs text-muted-foreground">Letzte Pruefung: {lastCheck}{latest?.kuerzel ? ` (${latest.kuerzel})` : ""}</p>}
                        {todayDone && todayEntry?.kuerzel && <p className="text-xs text-green-600 font-medium">Heute: {todayEntry.kuerzel}</p>}
                        <p className="text-xs text-muted-foreground">
                          <span className="text-amber-600">Reduz. &lt;{b.reduzierungTage}d</span>
                          {" · "}
                          <span className="text-red-600">Entnahme &lt;{b.entnahmeTage}d</span>
                        </p>
                      </div>
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
                <h3 className="font-bold text-foreground">{bereiche.find(b=>b.id===marking)?.name}</h3>
                <button onClick={() => { setMarking(null); setMarkKuerzel(""); setMarkBemerkung(""); }}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <input type="text" placeholder="Kuerzel (optional)" maxLength={5} value={markKuerzel}
                onChange={e => setMarkKuerzel(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase" />
              <textarea rows={2} placeholder="Bemerkung (optional)" value={markBemerkung}
                onChange={e => setMarkBemerkung(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
              <div className="flex gap-3">
                <button onClick={() => { setMarking(null); setMarkKuerzel(""); setMarkBemerkung(""); }}
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
