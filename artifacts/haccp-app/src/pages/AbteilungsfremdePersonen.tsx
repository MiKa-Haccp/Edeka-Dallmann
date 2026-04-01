import { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { Users, Plus, Trash2, ChevronLeft, ChevronRight, Loader2, Lock, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_API_URL || "/api";

function PinStep({ onVerified, onBack }: { onVerified: (name: string, userId: number, kuerzel: string) => void; onBack: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const verify = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, tenantId: 1 }),
      });
      const data = await res.json();
      if (data.valid) onVerified(data.userName, data.userId, data.initials);
      else setError("PIN ungültig.");
    } catch { setError("Verbindungsfehler."); }
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">PIN eingeben zur Bestätigung</p>
      </div>
      <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN" value={pin}
        onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
        onKeyDown={e => e.key === "Enter" && pin.length >= 3 && verify()}
        className="w-full text-center text-2xl tracking-[0.5em] border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30" autoFocus />
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 border rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Zurück</button>
        <button onClick={verify} disabled={pin.length < 3 || loading}
          className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />} Bestätigen
        </button>
      </div>
    </div>
  );
}

// ─── Signature Pad ────────────────────────────────────────────────────────────
function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const isEmpty = useRef(true);

  const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (("clientX" in e ? e.clientX : e.clientX) - rect.left) * scaleX,
      y: (("clientY" in e ? e.clientY : e.clientY) - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    drawing.current = true;
    const pos = getPos("touches" in e ? e.touches[0] : e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const pos = getPos("touches" in e ? e.touches[0] : e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    isEmpty.current = false;
    onChange(canvas.toDataURL("image/png"));
  }, [onChange]);

  const endDraw = useCallback(() => { drawing.current = false; }, []);

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isEmpty.current = true;
    onChange(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", endDraw);
    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", endDraw);
      canvas.removeEventListener("mouseleave", endDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", endDraw);
    };
  }, [startDraw, draw, endDraw]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500">Unterschrift der Person</label>
        <button type="button" onClick={clear}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
          <RotateCcw className="w-3 h-3" /> Löschen
        </button>
      </div>
      <div className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 overflow-hidden touch-none select-none">
        <canvas
          ref={canvasRef}
          width={500}
          height={140}
          className="w-full h-[140px] cursor-crosshair"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">Mit Maus oder Finger unterschreiben</p>
    </div>
  );
}

interface Eintrag {
  id: number;
  name: string;
  firma_abteilung: string | null;
  datum: string;
  unterschrift: string | null;
  eingetragen_von: string | null;
  kuerzel: string | null;
}

function AddModal({ marketId, tenantId, onClose }: { marketId: number | null; tenantId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<"form"|"pin">("form");
  const [name, setName] = useState("");
  const [firma, setFirma] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [unterschrift, setUnterschrift] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (user: { name: string; userId: number; kuerzel: string }) => {
      const r = await fetch(`${BASE}/hygienebelehrung-abt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, marketId, name, firmaAbteilung: firma, datum, unterschrift, eingetragenVon: user.name, kuerzel: user.kuerzel }),
      });
      if (!r.ok) throw new Error("Fehler beim Speichern");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hygienebelehrung-abt"] }); onClose(); },
  });

  if (step === "pin") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
          <PinStep onVerified={(n, uid, k) => save.mutate({ name: n, userId: uid, kuerzel: k })} onBack={() => setStep("form")} />
          {save.isError && <p className="text-red-600 text-sm mt-2 text-center">Fehler beim Speichern</p>}
        </div>
      </div>
    );
  }

  const valid = name.trim().length > 0 && datum.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Neuen Eintrag hinzufügen</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="In Druckbuchstaben"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Firma / Abteilung</label>
            <input value={firma} onChange={e => setFirma(e.target.value)}
              placeholder="z.B. Reinigungsfirma Müller"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Datum <span className="text-red-500">*</span></label>
            <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <SignaturePad onChange={setUnterschrift} />
        </div>
        <p className="text-xs text-gray-500 mt-3 bg-blue-50 rounded-lg p-2">
          Die Person bestätigt, über die Personalhygienevorschriften der EDEKA Handelsgesellschaft Südbayern mbH gemäß §&nbsp;43 Abs.&nbsp;1 IfSG aufgeklärt worden zu sein.
        </p>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Abbrechen</button>
          <button onClick={() => setStep("pin")} disabled={!valid}
            className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40 hover:bg-primary/90">
            Weiter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Unterschrift-Zelle in Tabelle ────────────────────────────────────────────
function UnterschriftCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-400">—</span>;
  if (value.startsWith("data:image")) {
    return <img src={value} alt="Unterschrift" className="h-8 max-w-[120px] object-contain" />;
  }
  return <span className="text-gray-600">{value}</span>;
}

export default function AbteilungsfremdePersonen() {
  const { selectedMarketId } = useAppStore();
  const { data: markets } = useListMarkets();
  const qc = useQueryClient();
  const market = markets?.find(m => m.id === selectedMarketId);
  const tenantId = 1;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: eintraege = [], isLoading } = useQuery<Eintrag[]>({
    queryKey: ["hygienebelehrung-abt", selectedMarketId, year],
    queryFn: async () => {
      const p = new URLSearchParams({ tenantId: String(tenantId), year: String(year) });
      if (selectedMarketId) p.set("marketId", String(selectedMarketId));
      const r = await fetch(`${BASE}/hygienebelehrung-abt?${p}`);
      return r.json();
    },
    enabled: true,
  });

  const deleteEintrag = async (id: number) => {
    if (!confirm("Eintrag löschen?")) return;
    setDeleting(id);
    await fetch(`${BASE}/hygienebelehrung-abt/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["hygienebelehrung-abt"] });
    setDeleting(null);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] rounded-2xl p-5 sm:p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0"><Users className="h-6 w-6 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold text-white">3.9 Abteilungsfremde Personen</h1>
              <p className="text-sm text-white/75">{market?.name ?? "Kein Markt gewählt"}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
          Dokumentation der Hygienebelehrung für abteilungsfremde Personen gemäß §&nbsp;43 Abs.&nbsp;1 Infektionsschutzgesetz.
        </div>

        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <button onClick={() => setYear(y => y - 1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-sm font-semibold w-20 text-center">{year}</span>
              <button onClick={() => setYear(y => y + 1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-primary text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Eintrag
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : eintraege.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Keine Einträge für {year}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Firma / Abteilung</th>
                    <th className="text-left px-4 py-3">Datum</th>
                    <th className="text-left px-4 py-3">Unterschrift</th>
                    <th className="text-left px-4 py-3">Eingetragen von</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {eintraege.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{e.name}</td>
                      <td className="px-4 py-3 text-gray-600">{e.firma_abteilung || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{e.datum ? new Date(e.datum).toLocaleDateString("de-DE") : "—"}</td>
                      <td className="px-4 py-3"><UnterschriftCell value={e.unterschrift} /></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{e.eingetragen_von || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteEintrag(e.id)} disabled={deleting === e.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                          {deleting === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddModal marketId={selectedMarketId} tenantId={tenantId} onClose={() => setShowAdd(false)} />}
    </AppLayout>
  );
}
