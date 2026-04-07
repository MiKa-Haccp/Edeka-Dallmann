import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  ChevronLeft, ChevronRight, Loader2, Check, Lock, Camera,
  Plus, Trash2, Image as ImageIcon, X, Tag,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";
const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}
function formatDate(s: string) {
  if (!s) return "—";
  const [y,m,d] = s.split("-");
  return `${d}.${m}.${y}`;
}

type Eintrag = {
  id: number; market_id: number; datum: string; kategorie: string|null;
  name_unterschrift: string|null; kuerzel: string|null; created_at: string;
  has_foto1: boolean; has_foto2: boolean; has_foto3: boolean; has_foto4: boolean;
};
type FullEintrag = Eintrag & { foto1: string|null; foto2: string|null; foto3: string|null; foto4: string|null; };

function PinStep({ onVerified, onBack, loading, setLoading }: {
  onVerified: (name: string, userId: number, kuerzel: string) => void;
  onBack: () => void; loading: boolean; setLoading: (v: boolean) => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const verify = useCallback(async (code: string) => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: code, tenantId: 1 })
      });
      const data = await res.json();
      if (data.valid) onVerified(data.userName, data.userId, data.initials);
      else { setError("PIN ungültig."); setPin(""); }
    } catch { setError("Verbindungsfehler."); }
    finally { setLoading(false); }
  }, [onVerified, setLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(val);
    if (val.length === 4) verify(val);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-[#c73d00]/10 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-6 h-6 text-[#c73d00]"/>
        </div>
        <p className="text-sm font-medium">4-stelligen persönlichen Code eingeben</p>
        <p className="text-xs text-muted-foreground mt-1">Wird automatisch gespeichert</p>
      </div>
      <input type="password" inputMode="numeric" maxLength={4} placeholder="• • • •" value={pin}
        onChange={handleChange}
        className="w-full border rounded-lg px-3 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#c73d00]" autoFocus/>
      {loading && <div className="flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#c73d00]"/></div>}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <button onClick={onBack} className="w-full border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Zurück</button>
    </div>
  );
}

export default function RindfleischEtikettierung() {
  const { selectedMarketId } = useAppStore();
  const { data: markets } = useListMarkets();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [loading, setLoading]     = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [viewEntry, setViewEntry]   = useState<FullEintrag|null>(null);
  const [loadingView, setLoadingView] = useState(false);

  // Form state
  const [datum, setDatum]         = useState(todayStr);
  const [kategorie, setKategorie] = useState<"gq"|"kalb"|null>(null);
  const [fotoBase64, setFotoBase64] = useState<string|null>(null);
  const [formStep, setFormStep]   = useState<"form"|"pin">("form");
  const [saving, setSaving]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const market = markets?.find((m: any) => m.id === selectedMarketId);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/rindfleisch-etiketten?marketId=${selectedMarketId}&year=${year}&month=${month}`);
      setEintraege(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedMarketId, year, month]);

  useEffect(() => { load(); }, [load]);

  function prevMonth() { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); }

  async function loadView(id: number) {
    setLoadingView(true);
    try {
      const r = await fetch(`${BASE}/rindfleisch-etiketten/${id}`);
      setViewEntry(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoadingView(false); }
  }

  async function saveEintrag(kuerzel: string, userId: number, nameUnterschrift: string) {
    if (!selectedMarketId) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/rindfleisch-etiketten`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId, datum,
          kategorie: kategorie === "gq" ? "GQ-Rindfleisch" : kategorie === "kalb" ? "Kalbfleisch" : null,
          foto1: fotoBase64 || null,
          foto2: null, foto3: null, foto4: null,
          nameUnterschrift, kuerzel, userId,
        })
      });
      await load();
      setShowCreate(false);
      resetForm();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  function resetForm() {
    setDatum(todayStr());
    setKategorie(null);
    setFotoBase64(null);
    setFormStep("form");
  }

  async function deleteEintrag(id: number) {
    if (!confirm("Eintrag wirklich löschen?")) return;
    await fetch(`${BASE}/rindfleisch-etiketten/${id}`, { method: "DELETE" });
    load();
  }

  const handleFotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) setFotoBase64(ev.target.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/category/3" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5"/>
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Tag className="w-5 h-5"/>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold leading-tight">3.10 Rindfleischetikettierung</h1>
              <p className="text-white/70 text-sm">{market?.name ?? ""}</p>
            </div>
          </div>
        </PageHeader>

        <div className="space-y-4">

          {/* Monatsnavigation */}
          <div className="flex items-center justify-between bg-white rounded-xl border shadow-sm p-3">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary"><ChevronLeft className="w-5 h-5"/></button>
            <div className="text-center">
              <div className="font-semibold">{MONTH_NAMES[month-1]} {year}</div>
              <div className="text-xs text-muted-foreground">{eintraege.length} Eintrag{eintraege.length !== 1 ? "e" : ""}</div>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary"><ChevronRight className="w-5 h-5"/></button>
          </div>

          {/* Neuer Eintrag */}
          <button onClick={() => { resetForm(); setShowCreate(true); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#c73d00]/30 text-[#c73d00] hover:bg-[#c73d00]/5 hover:border-[#c73d00] transition-all font-medium text-sm">
            <Plus className="w-4 h-4"/>Neuen Etiketten-Eintrag anlegen
          </button>

          {/* Liste */}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#c73d00]"/></div>
          ) : eintraege.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Keine Einträge für {MONTH_NAMES[month-1]} {year}
            </div>
          ) : (
            <div className="space-y-3">
              {eintraege.map(e => (
                <div key={e.id} className="bg-white rounded-xl border shadow-sm p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{formatDate(e.datum)}</div>
                        {e.kategorie && <div className="text-xs text-muted-foreground mt-0.5">{e.kategorie}</div>}
                        <div className="flex items-center gap-2 mt-1.5">
                          {e.has_foto1 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-2 py-0.5">
                              <ImageIcon className="w-3 h-3"/>Foto vorhanden
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Kein Foto</span>
                          )}
                          {e.kuerzel && (
                            <span className="text-xs text-muted-foreground font-mono">{e.kuerzel}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => loadView(e.id)}
                        className="px-3 py-1.5 rounded-lg hover:bg-blue-50 text-blue-600 text-xs border border-blue-200 font-medium">
                        Ansicht
                      </button>
                      <button onClick={() => deleteEintrag(e.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail-Ansicht */}
        {(viewEntry || loadingView) && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <div className="font-semibold">{viewEntry ? formatDate(viewEntry.datum) : ""}</div>
                  <div className="text-xs text-muted-foreground">{viewEntry?.kategorie || ""}</div>
                </div>
                <button onClick={() => setViewEntry(null)} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-4 space-y-3">
                {loadingView && <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}
                {viewEntry && !loadingView && (
                  <>
                    {viewEntry.foto1 && (
                      <div className="rounded-xl overflow-hidden border">
                        <img src={viewEntry.foto1} alt="Etikett-Foto" className="w-full object-contain max-h-80"/>
                      </div>
                    )}
                    {!viewEntry.foto1 && (
                      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                        <ImageIcon className="w-6 h-6 mr-2"/>Kein Foto vorhanden
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground space-y-1 pt-1 border-t">
                      {viewEntry.kuerzel && <div>Kürzel: <span className="font-mono font-medium">{viewEntry.kuerzel}</span></div>}
                      {viewEntry.name_unterschrift && <div>Unterschrift: {viewEntry.name_unterschrift}</div>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Erstell-Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="font-semibold">Neuer Etikett-Eintrag</div>
                <button onClick={() => { setShowCreate(false); resetForm(); }} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-4">
                {formStep === "form" && (
                  <div className="space-y-5">
                    {/* Abverkaufsdatum */}
                    <div>
                      <label className="text-sm font-semibold block mb-1">Abverkaufsdatum</label>
                      <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c73d00]"/>
                    </div>

                    {/* Kategorie */}
                    <div>
                      <label className="text-sm font-semibold block mb-2">Kategorie</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setKategorie("gq")}
                          className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${kategorie === "gq" ? "border-[#c73d00] bg-orange-50 text-[#c73d00]" : "border-gray-200 hover:border-orange-300"}`}>
                          GQ-Rindfleisch
                        </button>
                        <button onClick={() => setKategorie("kalb")}
                          className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${kategorie === "kalb" ? "border-[#c73d00] bg-orange-50 text-[#c73d00]" : "border-gray-200 hover:border-orange-300"}`}>
                          Kalbfleisch
                        </button>
                      </div>
                    </div>

                    {/* Einzelnes Foto */}
                    <div>
                      <label className="text-sm font-semibold block mb-2">Etikett-Foto</label>
                      <input ref={fileRef} type="file" accept="image/*" capture="environment"
                        className="hidden" onChange={handleFotoFile}/>
                      {fotoBase64 ? (
                        <div className="relative rounded-xl overflow-hidden border-2 border-green-300">
                          <img src={fotoBase64} alt="Etikett" className="w-full object-contain max-h-48"/>
                          <button onClick={() => setFotoBase64(null)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-red-600">
                            <X className="w-4 h-4"/>
                          </button>
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3"/>Foto aufgenommen
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => fileRef.current?.click()}
                          className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-[#c73d00] hover:bg-orange-50/40 flex flex-col items-center justify-center gap-2 transition-all">
                          <Camera className="w-8 h-8 text-muted-foreground"/>
                          <span className="text-sm text-muted-foreground">Etikett fotografieren</span>
                          <span className="text-xs text-muted-foreground/60">Auspackdatum muss sichtbar sein</span>
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { setShowCreate(false); resetForm(); }}
                        className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
                      <button disabled={!datum}
                        onClick={() => setFormStep("pin")}
                        className="flex-1 bg-[#c73d00] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#c73d00]/90 disabled:opacity-50">
                        Weiter
                      </button>
                    </div>
                  </div>
                )}
                {formStep === "pin" && (
                  <PinStep
                    onVerified={(name, userId, kuerzel) => saveEintrag(kuerzel, userId, name)}
                    onBack={() => setFormStep("form")}
                    loading={saving} setLoading={setSaving}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
