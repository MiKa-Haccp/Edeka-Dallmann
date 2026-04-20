import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import {
  Truck, Plus, Trash2, ChevronLeft, Users, Package,
  Clock, AlertTriangle, FileText,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function calcDauer(beginn: string | null, ende: string | null): string {
  if (!beginn || !ende) return "-";
  const [bh, bm] = beginn.split(":").map(Number);
  const [eh, em] = ende.split(":").map(Number);
  const mins = (eh * 60 + em) - (bh * 60 + bm);
  if (mins <= 0) return "-";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

interface Entry {
  id: number; datum: string; dienstleister: string | null;
  paletten: number | null; personal: number | null;
  beginn: string | null; ende: string | null;
  anmerkungen: string | null; kuerzel: string | null; createdAt: string;
}

const EMPTY = { dienstleister:"", paletten:"", personal:"", beginn:"", ende:"", anmerkungen:"", kuerzel:"" };

export default function WareEinraeumservice() {
  const { selectedMarketId } = useAppStore();
  const [datum, setDatum] = useState(todayIso());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [deletingId, setDeletingId] = useState<number|null>(null);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/ware-einraeumservice?marketId=${selectedMarketId}&datum=${datum}`);
      setEntries(await r.json());
    } finally { setLoading(false); }
  }, [selectedMarketId, datum]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/ware-einraeumservice`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId, datum,
          dienstleister: form.dienstleister.trim() || null,
          paletten: form.paletten ? Number(form.paletten) : null,
          personal: form.personal ? Number(form.personal) : null,
          beginn: form.beginn || null, ende: form.ende || null,
          anmerkungen: form.anmerkungen.trim() || null,
          kuerzel: form.kuerzel.trim().toUpperCase() || null,
        }),
      });
      if (!r.ok) { const e = await r.json().catch(()=>({})); setError(e.error || "Fehler"); return; }
      setForm(EMPTY); setShowForm(false); await load();
    } catch { setError("Verbindungsfehler"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await fetch(`${BASE}/ware-einraeumservice/${id}`, { method:"DELETE" });
    await load(); setDeletingId(null);
  };

  const totalPaletten = entries.reduce((s, e) => s + (e.paletten ?? 0), 0);
  const totalPersonal = entries.length > 0 ? Math.max(...entries.map(e => e.personal ?? 0)) : 0;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        <PageHeader className="from-[#c73d00] to-[#f94d00]">
          <div className="flex items-center gap-3">
            <Link href="/ware" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Einraumservice</h1>
              <p className="text-white/70 text-sm">Leistungsdokumentation externer Dienstleister</p>
            </div>
          </div>
        </PageHeader>

        {/* Datum + Stats */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <input type="date" value={datum} max={todayIso()} onChange={e => setDatum(e.target.value)}
              className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
            {entries.length > 0 && (
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span className="font-bold">{totalPaletten}</span>
                  <span className="text-muted-foreground">Paletten</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="font-bold">{totalPersonal}</span>
                  <span className="text-muted-foreground">Personen</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-sm transition-colors">
            <Plus className="w-5 h-5" /> Einsatz erfassen
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" /> Neuer Einraum-Einsatz
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Dienstleister</label>
                <input type="text" placeholder="z.B. Team Leder" value={form.dienstleister} onChange={e => setForm(p=>({...p, dienstleister:e.target.value}))}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Palettenanzahl</label>
                <input type="number" min={0} placeholder="0" value={form.paletten} onChange={e => setForm(p=>({...p, paletten:e.target.value}))}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Personalstarke</label>
                <input type="number" min={0} placeholder="0" value={form.personal} onChange={e => setForm(p=>({...p, personal:e.target.value}))}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Beginn</label>
                <input type="time" value={form.beginn} onChange={e => setForm(p=>({...p, beginn:e.target.value}))}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Ende</label>
                <input type="time" value={form.ende} onChange={e => setForm(p=>({...p, ende:e.target.value}))}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Kuerzel (optional)</label>
                <input type="text" maxLength={5} placeholder="z.B. MK" value={form.kuerzel} onChange={e => setForm(p=>({...p, kuerzel:e.target.value}))}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Anmerkungen</label>
                <textarea rows={3} placeholder="Besonderheiten, Beschadigungen, Verzogerungen..." value={form.anmerkungen} onChange={e => setForm(p=>({...p, anmerkungen:e.target.value}))}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2.5 border border-red-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); setForm(EMPTY); setError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary">Abbrechen</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold">
                {saving ? "Speichern..." : "Eintrag speichern"}
              </button>
            </div>
          </div>
        )}

        {/* Eintraege */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Eintraege {new Date(datum+"T12:00:00").toLocaleDateString("de-DE", { day:"2-digit", month:"long", year:"numeric" })}
          </h2>
          {loading && <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-24 bg-secondary/50 rounded-2xl animate-pulse"/>)}</div>}
          {!loading && entries.length === 0 && (
            <div className="bg-white rounded-2xl border border-border/60 p-10 text-center">
              <Truck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">Keine Eintraege fur dieses Datum</p>
            </div>
          )}
          {!loading && entries.length > 0 && (
            <div className="space-y-3">
              {entries.map(e => (
                <div key={e.id} className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Truck className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-foreground">{e.dienstleister || "Unbekannter Dienstleister"}</span>
                        {e.kuerzel && <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded border border-border/40">{e.kuerzel}</span>}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {e.paletten != null && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Package className="w-4 h-4 text-orange-400" />
                            <span><span className="font-bold text-foreground">{e.paletten}</span> Paletten</span>
                          </div>
                        )}
                        {e.personal != null && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span><span className="font-bold text-foreground">{e.personal}</span> Personen</span>
                          </div>
                        )}
                        {(e.beginn || e.ende) && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-4 h-4 text-green-400" />
                            <span>{e.beginn || "?"} - {e.ende || "?"} <span className="font-bold text-foreground">({calcDauer(e.beginn, e.ende)})</span></span>
                          </div>
                        )}
                      </div>
                      {e.anmerkungen && <p className="mt-3 text-sm text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2 italic">{e.anmerkungen}</p>}
                    </div>
                    <button onClick={() => handleDelete(e.id)} disabled={deletingId===e.id}
                      className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
