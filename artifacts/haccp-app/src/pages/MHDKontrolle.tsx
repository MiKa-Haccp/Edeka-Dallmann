import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import {
  CalendarDays, Plus, Trash2, Package, AlertTriangle,
  CheckCircle2, ChevronLeft, Clock, Tag, Map as MapIcon,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

const BEREICHE = [
  "Molkerei", "Fleisch & Wurst", "Backwaren", "Feinkost",
  "Tiefkuehl", "Getraenke", "Obst & Gemuese", "Trockensortiment", "Sonstiges",
];

const AKTIONEN: { value: string; label: string; color: string }[] = [
  { value: "geprueft",    label: "Geprueft / noch O.K.",       color: "text-green-600 bg-green-50 border-green-200" },
  { value: "reduziert",   label: "Preis reduziert",             color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "ausgezeichnet", label: "Ausgezeichnet / etikettiert", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "entsorgt",    label: "Entsorgt / entnommen",        color: "text-red-600 bg-red-50 border-red-200" },
];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function daysDiff(mhdIso: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const mhd   = new Date(mhdIso); mhd.setHours(0,0,0,0);
  return Math.round((mhd.getTime() - today.getTime()) / 86400000);
}

function MHDChip({ iso }: { iso: string }) {
  const d = daysDiff(iso);
  const label = new Date(iso).toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric" });
  let cls = "px-2.5 py-1 rounded-full text-xs font-bold border ";
  if (d < 0)       cls += "bg-red-100 text-red-700 border-red-300";
  else if (d === 0) cls += "bg-red-100 text-red-700 border-red-300";
  else if (d <= 2)  cls += "bg-orange-100 text-orange-700 border-orange-300";
  else if (d <= 5)  cls += "bg-amber-100 text-amber-700 border-amber-300";
  else              cls += "bg-gray-100 text-gray-600 border-gray-200";
  const hint = d < 0 ? `Abgelaufen (${Math.abs(d)} Tag${Math.abs(d)===1?"":"e"})` : d === 0 ? "Heute ablaufend" : `Noch ${d} Tag${d===1?"":"e"}`;
  return <span className={cls} title={hint}>{label}</span>;
}

function AktionChip({ value }: { value: string }) {
  const a = AKTIONEN.find(x => x.value === value);
  if (!a) return <span className="text-xs text-muted-foreground">{value}</span>;
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${a.color}`}>{a.label}</span>;
}

interface Entry {
  id: number;
  datum: string;
  bereich: string | null;
  artikel: string;
  mhdDatum: string;
  menge: number;
  aktion: string;
  bemerkung: string | null;
  kuerzel: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  bereich: "",
  artikel: "",
  mhdDatum: "",
  menge: 1,
  aktion: "geprueft",
  bemerkung: "",
  kuerzel: "",
};

export default function MHDKontrolle() {
  const { selectedMarketId } = useAppStore();
  const [datum, setDatum] = useState(todayIso());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/mhd-kontrolle?marketId=${selectedMarketId}&datum=${datum}`);
      const data = await r.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMarketId, datum]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setError(null);
    if (!form.artikel.trim()) { setError("Artikelname erforderlich"); return; }
    if (!form.mhdDatum)       { setError("MHD-Datum erforderlich"); return; }
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/mhd-kontrolle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId,
          datum,
          bereich:  form.bereich || null,
          artikel:  form.artikel.trim(),
          mhdDatum: form.mhdDatum,
          menge:    form.menge,
          aktion:   form.aktion,
          bemerkung: form.bemerkung.trim() || null,
          kuerzel:  form.kuerzel.trim().toUpperCase() || null,
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setError(e.error || "Fehler beim Speichern");
        return;
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`${BASE}/mhd-kontrolle/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  const expiredCount  = entries.filter(e => daysDiff(e.mhdDatum) < 0).length;
  const todayCount    = entries.filter(e => daysDiff(e.mhdDatum) === 0).length;
  const criticalCount = expiredCount + todayCount;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/ware" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">MHD Kontrolle</h1>
              <p className="text-sm text-white/70">Mindesthaltbarkeitsdatum Ueberwachung</p>
            </div>
          </div>
        </PageHeader>

        {/* Marktplan-Shortcut */}
        <Link
          href="/marktplan"
          className="flex items-center gap-3 px-4 py-3 bg-[#1a3a6b]/5 border border-[#1a3a6b]/20 rounded-2xl hover:bg-[#1a3a6b]/10 transition-colors group"
        >
          <div className="p-2 rounded-xl bg-[#1a3a6b] text-white flex-shrink-0">
            <MapIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[#1a3a6b]">Interaktiver Marktplan</div>
            <div className="text-xs text-muted-foreground">Regalmeter mit Hotspots und Kontrollintervallen</div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#1a3a6b] rotate-180 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Datum + Stats */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
              <input
                type="date"
                value={datum}
                max={todayIso()}
                onChange={e => setDatum(e.target.value)}
                className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex gap-3">
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{entries.length}</div>
                <div className="text-xs text-muted-foreground">Eintraege</div>
              </div>
              {criticalCount > 0 && (
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">{criticalCount}</div>
                  <div className="text-xs text-muted-foreground">Kritisch</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Neu-Eintrag Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" /> Neuen Eintrag erfassen
          </button>
        )}

        {/* Formular */}
        {showForm && (
          <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-orange-500" /> Neuer MHD-Eintrag
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bereich */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Bereich</label>
                <select
                  value={form.bereich}
                  onChange={e => setForm(p => ({ ...p, bereich: e.target.value }))}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">-- Bereich waehlen --</option>
                  {BEREICHE.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Kuerzel */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Kuerzel (optional)</label>
                <input
                  type="text"
                  maxLength={5}
                  value={form.kuerzel}
                  onChange={e => setForm(p => ({ ...p, kuerzel: e.target.value }))}
                  placeholder="z.B. MK"
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
                />
              </div>

              {/* Artikel */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Artikel <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.artikel}
                  onChange={e => setForm(p => ({ ...p, artikel: e.target.value }))}
                  placeholder="Artikelbezeichnung / Produktname"
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* MHD Datum */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">MHD-Datum <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.mhdDatum}
                  onChange={e => setForm(p => ({ ...p, mhdDatum: e.target.value }))}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Menge */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Menge</label>
                <input
                  type="number"
                  min={1}
                  value={form.menge}
                  onChange={e => setForm(p => ({ ...p, menge: Math.max(1, Number(e.target.value)) }))}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Aktion */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Massnahme <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {AKTIONEN.map(a => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, aktion: a.value }))}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition-all text-left ${form.aktion === a.value ? a.color + " border-current ring-2 ring-offset-1 ring-current/30" : "border-border/60 text-muted-foreground hover:border-border"}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bemerkung */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Bemerkung (optional)</label>
                <textarea
                  rows={2}
                  value={form.bemerkung}
                  onChange={e => setForm(p => ({ ...p, bemerkung: e.target.value }))}
                  placeholder="Zusaetzliche Informationen..."
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2.5 border border-red-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {saving ? "Speichern..." : "Eintrag speichern"}
              </button>
            </div>
          </div>
        )}

        {/* Eintraege Liste */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Eintraege vom {new Date(datum+"T12:00:00").toLocaleDateString("de-DE", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}
          </h2>

          {loading && (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-20 bg-secondary/50 rounded-2xl animate-pulse" />)}
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-10 text-center">
              <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">Noch keine Einträge für dieses Datum</p>
              <p className="text-xs text-muted-foreground mt-1">Starten Sie mit dem ersten Eintrag.</p>
            </div>
          )}

          {!loading && entries.length > 0 && (
            <div className="space-y-2.5">
              {entries.map(e => {
                const diff = daysDiff(e.mhdDatum);
                const isCritical = diff <= 0;
                return (
                  <div
                    key={e.id}
                    className={`bg-white rounded-2xl border shadow-sm p-4 ${isCritical ? "border-red-200" : "border-border/60"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {isCritical
                            ? <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            : <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          }
                          <span className="font-bold text-foreground truncate">{e.artikel}</span>
                          {e.bereich && (
                            <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground border border-border/40">{e.bereich}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <MHDChip iso={e.mhdDatum} />
                          <AktionChip value={e.aktion} />
                          <span className="text-xs text-muted-foreground">Menge: {e.menge}</span>
                          {e.kuerzel && <span className="text-xs text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">{e.kuerzel}</span>}
                        </div>
                        {e.bemerkung && (
                          <p className="text-xs text-muted-foreground mt-2 italic">{e.bemerkung}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                        title="Eintrag loeschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
