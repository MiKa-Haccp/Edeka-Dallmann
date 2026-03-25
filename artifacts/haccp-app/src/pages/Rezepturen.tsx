import { useState, useRef, useCallback, useEffect } from "react";
import { ChefHat, Search, Plus, X, Upload, ChevronDown, ChevronUp, Trash2, Edit2, Check, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface Kategorie { id: number; name: string; sort_order: number; }
interface Rezeptur {
  id: number; kategorie_id: number | null; kategorie_name: string | null;
  name: string; plu: string | null; naehrwerte: string | null;
  zutaten_text: string | null; zutatenverzeichnis: string | null;
  allergene: string | null; allergene_spuren: string | null;
  herstellungsablauf: string | null; bild_dateiname: string | null;
  rezeptur_datum: string | null; ersetzt_datum: string | null;
}

function useKategorien() {
  const [data, setData] = useState<Kategorie[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/rezepturen/kategorien`);
      if (r.ok) setData(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

function useRezepturen(kategorieId: number | null) {
  const [data, setData] = useState<Rezeptur[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = kategorieId
        ? `${API}/rezepturen?kategorieId=${kategorieId}`
        : `${API}/rezepturen`;
      const r = await fetch(url);
      if (r.ok) setData(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [kategorieId]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

function RezepturBild({ dateiname }: { dateiname: string | null }) {
  const [err, setErr] = useState(false);
  if (!dateiname || err) {
    return (
      <div className="w-full h-full bg-amber-50 flex items-center justify-center">
        <ChefHat className="w-14 h-14 text-amber-200" />
      </div>
    );
  }
  return (
    <img
      src={`${import.meta.env.BASE_URL}rezepturen/${encodeURIComponent(dateiname)}`}
      alt=""
      onError={() => setErr(true)}
      className="w-full h-full object-cover object-top"
    />
  );
}

function DetailModal({ r, onClose, onDelete }: {
  r: Rezeptur; onClose: () => void; onDelete: () => void;
}) {
  const [tab, setTab] = useState<"zutaten"|"naehrwerte"|"herstellung">("zutaten");
  const [delConfirm, setDelConfirm] = useState(false);

  const handleDelete = async () => {
    await fetch(`${API}/rezepturen/${r.id}`, { method: "DELETE" });
    onDelete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {r.bild_dateiname && (
          <div className="h-48 flex-shrink-0 overflow-hidden">
            <img
              src={`${import.meta.env.BASE_URL}rezepturen/${encodeURIComponent(r.bild_dateiname)}`}
              alt={r.name}
              className="w-full h-full object-cover object-top"
            />
          </div>
        )}
        <div className="flex items-start justify-between p-5 pb-3 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{r.name}</h2>
            <div className="flex gap-2 mt-1 flex-wrap">
              {r.kategorie_name && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {r.kategorie_name}
                </span>
              )}
              {r.plu && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  PLU: {r.plu}
                </span>
              )}
              {r.rezeptur_datum && (
                <span className="text-xs text-gray-400">
                  {new Date(r.rezeptur_datum).toLocaleDateString("de-DE")}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-5 flex-shrink-0">
          {(["zutaten","naehrwerte","herstellung"] as const).map(t => {
            const labels = { zutaten: "Zutaten", naehrwerte: "Naehrwerte", herstellung: "Herstellung" };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-700 leading-relaxed">
          {tab === "zutaten" && (
            <div className="space-y-4">
              {r.zutaten_text && <div className="whitespace-pre-wrap">{r.zutaten_text}</div>}
              {r.zutatenverzeichnis && (
                <div>
                  <div className="font-semibold text-gray-500 mb-1 text-xs uppercase tracking-wide">Zutatenverzeichnis</div>
                  <div className="whitespace-pre-wrap text-gray-600">{r.zutatenverzeichnis}</div>
                </div>
              )}
              {r.allergene && (
                <div>
                  <div className="font-semibold text-amber-600 mb-1 text-xs uppercase tracking-wide">Allergene</div>
                  <div className="whitespace-pre-wrap">{r.allergene}</div>
                </div>
              )}
              {r.allergene_spuren && (
                <div>
                  <div className="font-semibold text-gray-400 mb-1 text-xs uppercase tracking-wide">Spuren von</div>
                  <div className="whitespace-pre-wrap text-gray-500">{r.allergene_spuren}</div>
                </div>
              )}
              {!r.zutaten_text && !r.zutatenverzeichnis && !r.allergene && (
                <p className="text-gray-400 italic">Keine Angaben hinterlegt.</p>
              )}
            </div>
          )}
          {tab === "naehrwerte" && (
            r.naehrwerte
              ? <div className="whitespace-pre-wrap">{r.naehrwerte}</div>
              : <p className="text-gray-400 italic">Keine Naehrwerte hinterlegt.</p>
          )}
          {tab === "herstellung" && (
            r.herstellungsablauf
              ? <div className="whitespace-pre-wrap">{r.herstellungsablauf}</div>
              : <p className="text-gray-400 italic">Kein Herstellungsablauf hinterlegt.</p>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-3 flex justify-between flex-shrink-0">
          {delConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Wirklich loeschen?</span>
              <button onClick={handleDelete} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg font-medium">Ja</button>
              <button onClick={() => setDelConfirm(false)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg">Abbrechen</button>
            </div>
          ) : (
            <button onClick={() => setDelConfirm(true)} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Loeschen
            </button>
          )}
          <button onClick={onClose} className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg font-medium hover:bg-gray-200">
            Schliessen
          </button>
        </div>
      </div>
    </div>
  );
}

interface FormData {
  name: string; kategorieId: string; plu: string;
  naehrwerte: string; zutatenText: string; zutatenverzeichnis: string;
  allergene: string; allergeneSpuren: string; herstellungsablauf: string;
  rezepturDatum: string;
}

function NeuAnlegenModal({ kategorien, onClose, onSaved, defaultKategorieId }: {
  kategorien: Kategorie[]; onClose: () => void; onSaved: () => void; defaultKategorieId?: number | null;
}) {
  const [form, setForm] = useState<FormData>({
    name: "",
    kategorieId: defaultKategorieId ? String(defaultKategorieId) : (kategorien[0]?.id ? String(kategorien[0].id) : ""),
    plu: "", naehrwerte: "", zutatenText: "", zutatenverzeichnis: "",
    allergene: "", allergeneSpuren: "", herstellungsablauf: "", rezepturDatum: "",
  });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFile = (file: File) => {
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = e => setFotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name ist erforderlich."); return; }
    setSaving(true);
    setError("");
    try {
      let bildDateiname: string | null = null;
      if (fotoFile) {
        const fd = new FormData();
        fd.append("foto", fotoFile);
        const up = await fetch(`${API}/rezepturen/upload`, { method: "POST", body: fd });
        if (up.ok) {
          const j = await up.json();
          bildDateiname = j.dateiname;
        }
      }
      await fetch(`${API}/rezepturen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategorieId: form.kategorieId ? Number(form.kategorieId) : null,
          name: form.name.trim(),
          plu: form.plu || null,
          naehrwerte: form.naehrwerte || null,
          zutatenText: form.zutatenText || null,
          zutatenverzeichnis: form.zutatenverzeichnis || null,
          allergene: form.allergene || null,
          allergeneSpuren: form.allergeneSpuren || null,
          herstellungsablauf: form.herstellungsablauf || null,
          bildDateiname,
          rezepturDatum: form.rezepturDatum || null,
        }),
      });
      onSaved();
      onClose();
    } catch {
      setError("Fehler beim Speichern.");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Neue Rezeptur anlegen</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="z.B. Kraeuterbratwurst"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
            <select
              value={form.kategorieId}
              onChange={set("kategorieId")}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">-- Keine Kategorie --</option>
              {kategorien.map(k => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto</label>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors"
            >
              {fotoPreview ? (
                <div className="relative w-full">
                  <img src={fotoPreview} alt="Vorschau" className="w-full h-40 object-cover rounded-xl object-top" />
                  <button
                    onClick={e => { e.stopPropagation(); setFotoFile(null); setFotoPreview(null); }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-300" />
                  <span className="text-sm text-gray-400 text-center">
                    Foto hierher ziehen oder tippen zum Auswaehlen
                  </span>
                  <span className="text-xs text-gray-300">JPG, PNG, WEBP bis 20 MB</span>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          <button
            onClick={() => setShowDetails(v => !v)}
            className="flex items-center gap-2 text-sm text-amber-600 font-medium hover:text-amber-700"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? "Weitere Details ausblenden" : "Weitere Details hinzufuegen (optional)"}
          </button>

          {showDetails && (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PLU / Artikelnummer</label>
                <input type="text" value={form.plu} onChange={set("plu")}
                  placeholder="z.B. 1234" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zutaten</label>
                <textarea value={form.zutatenText} onChange={set("zutatenText")} rows={3}
                  placeholder="Zutaten und Mengen..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zutatenverzeichnis (fuer Etikett)</label>
                <textarea value={form.zutatenverzeichnis} onChange={set("zutatenverzeichnis")} rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergene</label>
                <textarea value={form.allergene} onChange={set("allergene")} rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spuren von Allergenen</label>
                <textarea value={form.allergeneSpuren} onChange={set("allergeneSpuren")} rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naehrwerte</label>
                <textarea value={form.naehrwerte} onChange={set("naehrwerte")} rows={4}
                  placeholder="Energie: ..., Fett: ..., Kohlenhydrate: ..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Herstellungsablauf</label>
                <textarea value={form.herstellungsablauf} onChange={set("herstellungsablauf")} rows={5}
                  placeholder="1. Fleisch wolfen...&#10;2. Gewuerze untermischen..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rezepturdatum</label>
                <input type="date" value={form.rezepturDatum} onChange={set("rezepturDatum")}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="border-t border-gray-100 px-5 py-3 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NeueKategorieModal({ onClose, onSaved }: { onClose: () => void; onSaved: (k: Kategorie) => void; }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Name ist erforderlich."); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/rezepturen/kategorien`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (r.ok) { onSaved(await r.json()); onClose(); }
      else setError("Fehler beim Anlegen.");
    } catch { setError("Netzwerkfehler."); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Neue Kategorie anlegen</h2>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="z.B. Saucen und Marinaden"
          autoFocus
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Abbrechen</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
            {saving ? "..." : "Anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Rezepturen() {
  const [, navigate] = useLocation();
  const { data: kategorien, loading: katLoading, reload: reloadKat } = useKategorien();
  const [activeKatId, setActiveKatId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const { data: allRezepturen, loading: rezLoading, reload: reloadRez } = useRezepturen(activeKatId);
  const [selected, setSelected] = useState<Rezeptur | null>(null);
  const [showNeu, setShowNeu] = useState(false);
  const [showNeueKat, setShowNeueKat] = useState(false);
  const [editingKatId, setEditingKatId] = useState<number | null>(null);
  const [editingKatName, setEditingKatName] = useState("");

  const rezepturen = search
    ? allRezepturen.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : allRezepturen;

  const handleKatAdded = (k: Kategorie) => {
    reloadKat();
    setActiveKatId(k.id);
  };

  const startEditKat = (k: Kategorie, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingKatId(k.id);
    setEditingKatName(k.name);
  };

  const saveEditKat = async () => {
    if (!editingKatName.trim() || !editingKatId) return;
    await fetch(`${API}/rezepturen/kategorien/${editingKatId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingKatName.trim() }),
    });
    setEditingKatId(null);
    reloadKat();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
          title="Zurück"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">3.7 Eigenherstellung / Rezepturen</h1>
          <p className="text-xs text-gray-500">Rezepturuebersicht</p>
        </div>
        <button
          onClick={() => setShowNeu(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Neu anlegen
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rezeptur suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveKatId(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeKatId === null
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50"
          }`}
        >
          Alle ({rezLoading ? "..." : allRezepturen.length})
        </button>

        {kategorien.map(k => {
          const isActive = activeKatId === k.id;
          const isEditing = editingKatId === k.id;
          return (
            <div
              key={k.id}
              className={`flex-shrink-0 flex items-center gap-1 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50"
              }`}
              onClick={() => !isEditing && setActiveKatId(k.id)}
            >
              {isEditing ? (
                <div className="flex items-center gap-1 px-3 py-2" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={editingKatName}
                    onChange={e => setEditingKatName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveEditKat(); if (e.key === "Escape") setEditingKatId(null); }}
                    className="w-28 text-sm bg-transparent border-b border-white/60 focus:outline-none"
                  />
                  <button onClick={saveEditKat} className="p-0.5 hover:opacity-70"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingKatId(null)} className="p-0.5 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-4 py-2">
                  <span>{k.name}</span>
                  <button
                    onClick={e => startEditKat(k, e)}
                    className={`ml-0.5 p-0.5 rounded hover:bg-black/10 ${isActive ? "text-white/70" : "text-gray-400"}`}
                    title="Umbenennen"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={() => setShowNeueKat(true)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-amber-600 border-2 border-dashed border-amber-200 hover:bg-amber-50 hover:border-amber-400 transition-colors"
        >
          <Plus className="w-4 h-4" /> Kategorie
        </button>
      </div>

      {rezLoading || katLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
              <div className="h-44 bg-gray-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 animate-pulse rounded" />
                <div className="h-3 w-2/3 bg-gray-100 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : rezepturen.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ChefHat className="w-14 h-14 mx-auto mb-3 opacity-25" />
          <p className="text-base font-medium">Keine Rezepturen gefunden.</p>
          <p className="text-sm mt-1">
            {search ? `Keine Treffer fuer "${search}"` : "Lege die erste Rezeptur an."}
          </p>
          {!search && (
            <button onClick={() => setShowNeu(true)} className="mt-5 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600">
              Erste Rezeptur anlegen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {rezepturen.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all text-left group"
            >
              <div className="h-44 overflow-hidden bg-amber-50">
                <RezepturBild dateiname={r.bild_dateiname} />
              </div>
              <div className="p-3">
                <div className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-amber-700 transition-colors line-clamp-2">
                  {r.name}
                </div>
                {r.kategorie_name && (
                  <div className="text-xs text-amber-600 font-medium mt-1">{r.kategorie_name}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal r={selected} onClose={() => setSelected(null)} onDelete={reloadRez} />
      )}
      {showNeu && (
        <NeuAnlegenModal
          kategorien={kategorien}
          defaultKategorieId={activeKatId}
          onClose={() => setShowNeu(false)}
          onSaved={reloadRez}
        />
      )}
      {showNeueKat && (
        <NeueKategorieModal onClose={() => setShowNeueKat(false)} onSaved={handleKatAdded} />
      )}
    </div>
  );
}
