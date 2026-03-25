import { useState, useEffect, useMemo } from "react";
import { Search, X, ChefHat, Info, Utensils, ClipboardList } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface Kategorie {
  id: number;
  name: string;
  sort_order: number;
}

interface Rezeptur {
  id: number;
  kategorie_id: number | null;
  kategorie_name: string | null;
  name: string;
  plu: string | null;
  naehrwerte: string | null;
  zutaten_text: string | null;
  zutatenverzeichnis: string | null;
  allergene: string | null;
  allergene_spuren: string | null;
  herstellungsablauf: string | null;
  bild_dateiname: string | null;
  rezeptur_datum: string | null;
  ersetzt_datum: string | null;
  sort_order: number;
}

function RezepturBild({ dateiname, name }: { dateiname: string | null; name: string }) {
  const [error, setError] = useState(false);
  if (!dateiname || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <ChefHat className="h-12 w-12 text-amber-300" />
      </div>
    );
  }
  return (
    <img
      src={`${import.meta.env.BASE_URL}rezepturen/${encodeURIComponent(dateiname)}`}
      alt={name}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
}

function NaehrwerteTabelle({ text }: { text: string }) {
  const lines = text.split("\n").filter(l => l.trim());
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          const label = line.substring(0, colonIdx).trim();
          const value = line.substring(colonIdx + 1).trim();
          return (
            <div key={i} className="flex justify-between text-sm py-0.5 border-b border-gray-100 last:border-0">
              <span className="text-gray-600">{label}</span>
              <span className="font-medium text-gray-900">{value}</span>
            </div>
          );
        }
        return <div key={i} className="text-sm text-gray-700 font-medium">{line}</div>;
      })}
    </div>
  );
}

function HerstellungSchritte({ text }: { text: string }) {
  const steps = text.split("\n").filter(l => l.trim());
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
            {i + 1}
          </span>
          <span className="text-gray-700 leading-relaxed pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function ZutatenListe({ text }: { text: string }) {
  const items = text.split("\n").filter(l => l.trim());
  const half = Math.ceil(items.length / 2);
  const col1 = items.slice(0, half);
  const col2 = items.slice(half);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
      {[...col1, ...col2].map((item, i) => (
        <div key={i} className="flex items-start gap-2 text-sm py-0.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
          <span className="text-gray-700">{item}</span>
        </div>
      ))}
    </div>
  );
}

function DetailModal({ rezeptur, onClose }: { rezeptur: Rezeptur; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"zutaten" | "naehrwerte" | "herstellung">("zutaten");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const tabs = [
    { key: "zutaten" as const, label: "Zutaten", icon: Utensils, show: !!rezeptur.zutaten_text },
    { key: "naehrwerte" as const, label: "Naehrwerte", icon: Info, show: !!rezeptur.naehrwerte },
    { key: "herstellung" as const, label: "Herstellung", icon: ClipboardList, show: !!rezeptur.herstellungsablauf },
  ].filter(t => t.show);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-56 sm:h-72 flex-shrink-0">
          <RezepturBild dateiname={rezeptur.bild_dateiname} name={rezeptur.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              {rezeptur.kategorie_name && (
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  {rezeptur.kategorie_name}
                </span>
              )}
              {rezeptur.plu && (
                <span className="text-xs text-white/70">PLU: {rezeptur.plu}</span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">{rezeptur.name}</h2>
            {rezeptur.rezeptur_datum && (
              <p className="text-xs text-white/60 mt-1">
                Stand: {new Date(rezeptur.rezeptur_datum).toLocaleDateString("de-DE")}
              </p>
            )}
          </div>
        </div>

        {tabs.length > 0 && (
          <div className="flex border-b border-gray-200 px-4 flex-shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "zutaten" && rezeptur.zutaten_text && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Zutaten</h3>
              <ZutatenListe text={rezeptur.zutaten_text} />
              {rezeptur.zutatenverzeichnis && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Zutatenverzeichnis</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{rezeptur.zutatenverzeichnis}</p>
                </div>
              )}
              {(rezeptur.allergene || rezeptur.allergene_spuren) && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {rezeptur.allergene && (
                    <div>
                      <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Allergene: </span>
                      <span className="text-sm text-gray-700">{rezeptur.allergene}</span>
                    </div>
                  )}
                  {rezeptur.allergene_spuren && (
                    <div>
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Spuren: </span>
                      <span className="text-sm text-gray-700">{rezeptur.allergene_spuren}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "naehrwerte" && rezeptur.naehrwerte && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Naehrwerte</h3>
              <NaehrwerteTabelle text={rezeptur.naehrwerte} />
            </div>
          )}

          {activeTab === "herstellung" && rezeptur.herstellungsablauf && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Herstellungsablauf</h3>
              <HerstellungSchritte text={rezeptur.herstellungsablauf} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RezepturKarte({ rezeptur, onClick }: { rezeptur: Rezeptur; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-amber-300 transition-all duration-200 text-left w-full"
    >
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-300">
          <RezepturBild dateiname={rezeptur.bild_dateiname} name={rezeptur.name} />
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{rezeptur.name}</h3>
        {rezeptur.kategorie_name && (
          <p className="text-xs text-amber-600 mt-0.5">{rezeptur.kategorie_name}</p>
        )}
        {rezeptur.plu && (
          <p className="text-xs text-gray-400 mt-0.5">PLU: {rezeptur.plu}</p>
        )}
      </div>
    </button>
  );
}

export default function Rezepturen() {
  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [rezepturen, setRezepturen] = useState<Rezeptur[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKategorieId, setSelectedKategorieId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [detailRezeptur, setDetailRezeptur] = useState<Rezeptur | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [katRes, rezRes] = await Promise.all([
          fetch(`${API}/rezepturen/kategorien`),
          fetch(`${API}/rezepturen`),
        ]);
        const katData = await katRes.json();
        const rezData = await rezRes.json();
        setKategorien(katData);
        setRezepturen(rezData);
        if (katData.length > 0) setSelectedKategorieId(null);
      } catch (e) {
        console.error("Fehler beim Laden der Rezepturen", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = rezepturen;
    if (selectedKategorieId !== null) {
      list = list.filter(r => r.kategorie_id === selectedKategorieId);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(s) ||
        (r.plu ?? "").toLowerCase().includes(s) ||
        (r.zutaten_text ?? "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [rezepturen, selectedKategorieId, search]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-amber-100">
          <ChefHat className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">3.7 Rezepturen</h1>
          <p className="text-sm text-gray-500">Eigenherstellung - Rezepturuebersicht</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rezeptur suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>
        {kategorien.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedKategorieId(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedKategorieId === null
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-amber-300"
              }`}
            >
              Alle ({rezepturen.length})
            </button>
            {kategorien.map(k => (
              <button
                key={k.id}
                onClick={() => setSelectedKategorieId(k.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedKategorieId === k.id
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-amber-300"
                }`}
              >
                {k.name} ({rezepturen.filter(r => r.kategorie_id === k.id).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-gray-200 rounded-xl mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mt-1" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Keine Rezepturen gefunden</p>
          {search && (
            <button onClick={() => setSearch("")} className="mt-2 text-sm text-amber-600 hover:underline">
              Suche zuruecksetzen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map(r => (
            <RezepturKarte key={r.id} rezeptur={r} onClick={() => setDetailRezeptur(r)} />
          ))}
        </div>
      )}

      {detailRezeptur && (
        <DetailModal rezeptur={detailRezeptur} onClose={() => setDetailRezeptur(null)} />
      )}
    </div>
  );
}
