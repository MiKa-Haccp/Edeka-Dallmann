import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import {
  ClipboardCheck, ChevronLeft, ChevronRight, Check, X,
  CheckCircle2, AlertTriangle, MinusCircle, Loader2, Lock, Save,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

type CheckStatus = "io" | "nichtIo" | "";

interface CheckItem {
  id: string;
  text: string;
  abhilfe?: string;
  rindfleisch?: boolean;
}

interface CheckData {
  [id: string]: { status: CheckStatus; abhilfe: string };
}

const CHECK_ITEMS: CheckItem[] = [
  { id: "1", text: "Alle Lieferanten sind Teilnehmer am GQ-Programm (Teilnahmebestätigungen liegen ausnahmslos vor)." },
  { id: "2", text: "GQ-Frischeartikel werden ausschließlich über einen GQ-Lieferanten bezogen." },
  { id: "3", text: "Der Eingang der Waren wird dokumentiert." },
  { id: "4", text: "Gesetzliche Angaben werden auf Richtigkeit und Vollständigkeit überprüft." },
  { id: "5", text: "Frischeartikel, deren Auslobung nicht den geforderten Angaben entspricht, werden zurückgewiesen." },
  { id: "6", text: "GQ-Ware wird getrennt von anderer Ware gehandhabt / gelagert / portioniert." },
  { id: "7", text: "Zu jeder Zeit ist eine Etikettierung der Ware in Kühl- und Vorbereitungsräumen gegeben." },
  { id: "8", text: "Eine Vermischung der Chargen ist ausgeschlossen." },
  { id: "9", text: "Bei dezentraler Verpackung werden die Öffnungsdaten nach den Vorgaben dokumentiert." },
  { id: "10", text: "Die vorgegebenen Angaben der Originaletiketten werden nachvollziehbar auf die SB-Etiketten übertragen." },
  { id: "11", text: "Ein Abgleich von Wareneingang und Warenausgang liegt dokumentiert vor (Begleitpapier)." },
  { id: "12", text: "Alle relevanten Dokumente (z.B. Begleitpapiere) werden für zwei Jahre in der Verkaufsstelle aufbewahrt." },
  { id: "13", text: "Alle Dokumente sind so aufbewahrt und gekennzeichnet, dass jederzeit eine Überprüfung möglich ist." },
  { id: "14", text: "Die Auslobung der GQ-Waren ist in der Verkaufsstelle so angebracht, dass diese für den Kunden sichtbar ist." },
  { id: "15", text: "Personal hat Kenntnis über die aktuelle Etikettierungsverordnung / Konzeptvorgaben und ist vertraut mit deren Umsetzung." },
  { id: "16", text: "Vorgaben des Infektionsschutzgesetzes und der allgemeinen Hygiene werden eingehalten." },
  { id: "R1", text: "Es werden ausschließlich Tageschargen gebildet.", rindfleisch: true },
  { id: "R2", text: "Es werden keine Angaben auf die Etiketten aufgebracht, die nicht von der BLE für das verwendete System genehmigt wurden.", rindfleisch: true },
  { id: "R3", text: "Zu jeder Zeit ist eine Zuordnung der Ware in der Bedientheke zu einem Etikett an der Pinwand gegeben.", rindfleisch: true },
];

function emptyCheckData(): CheckData {
  const d: CheckData = {};
  for (const item of CHECK_ITEMS) d[item.id] = { status: "", abhilfe: "" };
  return d;
}

function getQuartalRange(year: number, q: number): { start: Date; end: Date } {
  const starts = [[1, 1], [4, 1], [7, 1], [10, 1]];
  const ends   = [[3, 31], [6, 30], [9, 30], [12, 31]];
  const [sm, sd] = starts[q - 1];
  const [em, ed] = ends[q - 1];
  return {
    start: new Date(year, sm - 1, sd),
    end:   new Date(year, em - 1, ed, 23, 59, 59),
  };
}

function currentQuartal() {
  const now = new Date();
  const m = now.getMonth() + 1;
  return m <= 3 ? 1 : m <= 6 ? 2 : m <= 9 ? 3 : 4;
}

type Eintrag = {
  id: number;
  quartal: number;
  year: number;
  durchgefuehrtAm: string | null;
  durchgefuehrtVon: string | null;
  kuerzel: string | null;
  checkData: CheckData | null;
};

function PinStep({
  onVerified, onBack, loading, setLoading,
}: {
  onVerified: (name: string, userId: number, kuerzel: string) => void;
  onBack: () => void; loading: boolean; setLoading: (v: boolean) => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const verify = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, tenantId: 1 }),
      });
      const data = await res.json();
      if (data.valid) onVerified(data.userName, data.userId, data.initials);
      else setError("PIN ungueltig.");
    } catch { setError("Verbindungsfehler."); }
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">PIN eingeben zur Bestaetigung</p>
      </div>
      <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN" value={pin}
        onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
        onKeyDown={e => e.key === "Enter" && pin.length >= 3 && verify()}
        className="w-full border rounded-lg px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Zurueck</button>
        <button onClick={verify} disabled={pin.length < 3 || loading}
          className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Bestaetigen
        </button>
      </div>
    </div>
  );
}

function CheckRow({
  item, value, onChange, readOnly,
}: {
  item: CheckItem;
  value: { status: CheckStatus; abhilfe: string };
  onChange?: (v: { status: CheckStatus; abhilfe: string }) => void;
  readOnly?: boolean;
}) {
  const isIo = value.status === "io";
  const isNichtIo = value.status === "nichtIo";
  return (
    <div className={[
      "border rounded-xl p-3 sm:p-4 transition-colors",
      isNichtIo ? "border-red-200 bg-red-50" : isIo ? "border-green-200 bg-green-50" : "border-border bg-white",
    ].join(" ")}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 mt-0.5">{item.id}</span>
        <p className="flex-1 text-sm text-gray-800 leading-snug">{item.text}</p>
        {!readOnly ? (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onChange?.({ ...value, status: isIo ? "" : "io" })}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                isIo ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-600 border-gray-300 hover:bg-green-50",
              ].join(" ")}>
              <Check className="w-3.5 h-3.5" /> i.O.
            </button>
            <button
              onClick={() => onChange?.({ ...value, status: isNichtIo ? "" : "nichtIo" })}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                isNichtIo ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-600 border-gray-300 hover:bg-red-50",
              ].join(" ")}>
              <X className="w-3.5 h-3.5" /> nicht i.O.
            </button>
          </div>
        ) : (
          <span className={[
            "flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg",
            isIo ? "bg-green-100 text-green-700" : isNichtIo ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500",
          ].join(" ")}>
            {isIo ? <><CheckCircle2 className="w-3.5 h-3.5" />i.O.</> : isNichtIo ? <><AlertTriangle className="w-3.5 h-3.5" />nicht i.O.</> : <><MinusCircle className="w-3.5 h-3.5" />offen</>}
          </span>
        )}
      </div>
      {isNichtIo && (
        <div className="mt-2 ml-9">
          {readOnly ? (
            value.abhilfe ? <p className="text-xs text-red-700 bg-red-100 rounded-lg px-3 py-2">{value.abhilfe}</p> : null
          ) : (
            <textarea
              placeholder="Abhilfe / Massnahmen..."
              value={value.abhilfe}
              onChange={e => onChange?.({ ...value, abhilfe: e.target.value })}
              rows={2}
              className="w-full border border-red-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function GQBegehung() {
  const { selectedMarketId } = useAppStore();
  const { data: markets } = useListMarkets();
  const marktName = markets?.find((m: { id: number }) => m.id === selectedMarketId)?.name ?? "";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [quartal, setQuartal] = useState(currentQuartal());

  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [loading, setLoading] = useState(false);

  const [checkData, setCheckData] = useState<CheckData>(emptyCheckData());
  const [durchgefuehrtAm, setDurchgefuehrtAm] = useState(() => now.toISOString().slice(0, 10));
  const [showPin, setShowPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [identified, setIdentified] = useState<{ name: string; userId: number; kuerzel: string } | null>(null);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/gq-begehung?tenantId=1&marketId=${selectedMarketId}&year=${year}&quartal=${quartal}`);
      const data = await r.json();
      setEintraege(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedMarketId, year, quartal]);

  useEffect(() => { load(); }, [load]);

  const existing = eintraege.find(e => e.year === year && e.quartal === quartal) ?? null;

  const handleSetItem = (id: string, val: { status: CheckStatus; abhilfe: string }) => {
    setCheckData(prev => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async () => {
    if (!identified || !selectedMarketId) return;
    setSaving(true);
    try {
      const body = {
        tenantId: 1,
        marketId: selectedMarketId,
        quartal,
        year,
        durchgefuehrtAm,
        durchgefuehrtVon: identified.name,
        kuerzel: identified.kuerzel,
        checkData,
      };
      if (existing) {
        await fetch(`${BASE}/gq-begehung/${existing.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        await fetch(`${BASE}/gq-begehung`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      }
      window.dispatchEvent(new Event("gq-begehung-updated"));
      setShowPin(false);
      setIdentified(null);
      load();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!existing || !window.confirm("Eintrag wirklich loeschen?")) return;
    await fetch(`${BASE}/gq-begehung/${existing.id}`, { method: "DELETE" });
    window.dispatchEvent(new Event("gq-begehung-updated"));
    setCheckData(emptyCheckData());
    load();
  };

  const startEdit = () => {
    if (existing?.checkData) setCheckData(existing.checkData as CheckData);
    else setCheckData(emptyCheckData());
    if (existing?.durchgefuehrtAm) setDurchgefuehrtAm(existing.durchgefuehrtAm);
    setShowPin(false);
    setIdentified(null);
  };

  const prevQ = () => {
    if (quartal === 1) { setYear(y => y - 1); setQuartal(4); }
    else setQuartal(q => q - 1);
  };
  const nextQ = () => {
    if (quartal === 4) { setYear(y => y + 1); setQuartal(1); }
    else setQuartal(q => q + 1);
  };

  const isCurrentQ = year === now.getFullYear() && quartal === currentQuartal();
  const { end: qEnd } = getQuartalRange(year, quartal);
  const daysLeft = Math.ceil((qEnd.getTime() - now.getTime()) / 86400000);

  const allAnswered = CHECK_ITEMS.every(item => checkData[item.id]?.status !== "");
  const nichtIoCount = CHECK_ITEMS.filter(item => checkData[item.id]?.status === "nichtIo").length;

  const mainItems = CHECK_ITEMS.filter(i => !i.rindfleisch);
  const rindfleischItems = CHECK_ITEMS.filter(i => i.rindfleisch);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">3.8 GQ-Betriebsbegehung</h1>
            <p className="text-xs text-gray-500">GQ-Frischeartikel und Rindfleischetikettierung – quartalsweise</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button onClick={prevQ} className="w-9 h-9 rounded-xl border bg-white hover:bg-gray-50 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-base font-bold text-gray-900">Q{quartal} / {year}</span>
            {isCurrentQ && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">aktuelles Quartal</span>}
          </div>
          <button onClick={nextQ} className="w-9 h-9 rounded-xl border bg-white hover:bg-gray-50 flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : existing && !identified ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-800 text-sm">Begehung durchgefuehrt</p>
                <p className="text-xs text-green-700 mt-0.5">
                  {existing.durchgefuehrtAm ? new Date(existing.durchgefuehrtAm).toLocaleDateString("de-DE") : "–"}
                  {existing.durchgefuehrtVon ? ` · ${existing.durchgefuehrtVon} (${existing.kuerzel ?? ""})` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={startEdit} className="text-xs bg-white border rounded-lg px-3 py-1.5 hover:bg-gray-50 font-medium">
                  Bearbeiten
                </button>
                <button onClick={handleDelete} className="text-xs bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-100 font-medium">
                  Loeschen
                </button>
              </div>
            </div>

            {existing.checkData && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Allgemeine Kontrollpunkte</h3>
                  {mainItems.map(item => (
                    <CheckRow key={item.id} item={item} value={(existing.checkData as CheckData)[item.id] ?? { status: "", abhilfe: "" }} readOnly />
                  ))}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Zusaetzlich fuer GQ-Rindfleisch</h3>
                  {rindfleischItems.map(item => (
                    <CheckRow key={item.id} item={item} value={(existing.checkData as CheckData)[item.id] ?? { status: "", abhilfe: "" }} readOnly />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {isCurrentQ && !existing && daysLeft <= 14 && daysLeft >= 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2 text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                Noch {daysLeft} {daysLeft === 1 ? "Tag" : "Tage"} bis zum Quartalsende – Begehung noch ausstehend.
              </div>
            )}

            <div className="rounded-xl bg-white border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Allgemeine Angaben</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Quartal</label>
                  <div className="border rounded-lg px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50">Q{quartal} / {year}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Markt</label>
                  <div className="border rounded-lg px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50">{marktName || "–"}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Durchgefuehrt am</label>
                  <input type="date" value={durchgefuehrtAm} onChange={e => setDurchgefuehrtAm(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                {identified && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Durchgefuehrt von</label>
                    <div className="border rounded-lg px-3 py-2 text-sm font-medium text-green-700 bg-green-50">{identified.name} ({identified.kuerzel})</div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Allgemeine Kontrollpunkte</h3>
              {mainItems.map(item => (
                <CheckRow key={item.id} item={item} value={checkData[item.id] ?? { status: "", abhilfe: "" }}
                  onChange={v => handleSetItem(item.id, v)} />
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Zusaetzlich fuer GQ-Rindfleisch</h3>
              {rindfleischItems.map(item => (
                <CheckRow key={item.id} item={item} value={checkData[item.id] ?? { status: "", abhilfe: "" }}
                  onChange={v => handleSetItem(item.id, v)} />
              ))}
            </div>

            {nichtIoCount > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                <span className="font-semibold">{nichtIoCount} Punkt{nichtIoCount !== 1 ? "e" : ""} mit Maengeln</span> – bitte Abhilfe/Massnahmen eintragen.
              </div>
            )}

            <div className="pt-2">
              {!identified ? (
                <button onClick={() => setShowPin(true)}
                  className="w-full bg-primary text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-primary/90 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" /> PIN eingeben und speichern
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={saving}
                  className="w-full bg-green-600 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Begehung speichern
                </button>
              )}
            </div>
          </div>
        )}

        {showPin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <PinStep
                onVerified={(name, userId, kuerzel) => { setIdentified({ name, userId, kuerzel }); setShowPin(false); }}
                onBack={() => setShowPin(false)}
                loading={pinLoading}
                setLoading={setPinLoading}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
