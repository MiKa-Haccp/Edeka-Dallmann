import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  Thermometer, ChevronLeft, ChevronRight, Loader2, Check,
  X, Printer, Lock, Plus, Trash2, Wind, Flame, Snowflake,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

const WOCHENTAGE = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const MONTH_NAMES = ["Januar","Februar","Maerz","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

type KontrolleArt = "reifeschrank" | "kaesekühlschrank" | "heisse_theke";

type KontrolleEntry = {
  id: number;
  day: number;
  kontrolle_art: KontrolleArt;
  produkt: string | null;
  temperatur: string | null;
  luftfeuchtigkeit: string | null;
  kern_temp_garen: string | null;
  temp_heisshalten: string | null;
  massnahme: string | null;
  kuerzel: string;
};

const HEISSE_THEKE_PRODUKTE = [
  "Geflügel",
  "Hackbraten",
  "Fleischpflanzerl",
  "Leberkäse",
  "Schweinebraten",
  "Kasselerbraten",
  "Fisch",
  "Sonstiges",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function getWeekday(year: number, month: number, day: number) {
  return WOCHENTAGE[new Date(year, month - 1, day).getDay()];
}
function isWeekend(year: number, month: number, day: number) {
  const wd = new Date(year, month - 1, day).getDay();
  return wd === 0 || wd === 6;
}
function isFuture(year: number, month: number, day: number) {
  const now = new Date();
  now.setHours(0,0,0,0);
  return new Date(year, month - 1, day) > now;
}
function isToday(year: number, month: number, day: number) {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day;
}

// Temperatur-Validierung
function tempStatus(val: string | null, art: KontrolleArt): "ok" | "warn" | "none" {
  if (!val) return "none";
  const n = parseFloat(val.replace(",","."));
  if (isNaN(n)) return "none";
  if (art === "reifeschrank") return (n >= 1 && n <= 3) ? "ok" : "warn";
  if (art === "kaesekühlschrank") return n <= 7 ? "ok" : "warn";
  return "none";
}
function humidityStatus(val: string | null): "ok" | "warn" | "none" {
  if (!val) return "none";
  const n = parseFloat(val.replace(",","."));
  if (isNaN(n)) return "none";
  return (n >= 75 && n <= 85) ? "ok" : "warn";
}
function garenStatus(val: string | null, produkt: string | null): "ok" | "warn" | "none" {
  if (!val) return "none";
  const n = parseFloat(val.replace(",","."));
  if (isNaN(n)) return "none";
  const minTemp = produkt === "Fisch" ? 60 : 72;
  return n >= minTemp ? "ok" : "warn";
}
function heisshaltenStatus(val: string | null): "ok" | "warn" | "none" {
  if (!val) return "none";
  const n = parseFloat(val.replace(",","."));
  if (isNaN(n)) return "none";
  return n >= 60 ? "ok" : "warn";
}

function TempBadge({ val, status }: { val: string | null; status: "ok" | "warn" | "none" }) {
  if (!val) return <span className="text-muted-foreground/40">—</span>;
  return (
    <span className={`font-mono font-semibold text-sm ${status === "ok" ? "text-green-600" : status === "warn" ? "text-red-600" : "text-foreground"}`}>
      {val}°C
    </span>
  );
}

// ===== PIN-Verifikation =====
function PinStep({
  onVerified, onBack, loading, setLoading,
}: {
  onVerified: (name: string, userId: number, kuerzel: string) => void;
  onBack: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, tenantId: 1 }),
      });
      const data = await res.json();
      if (data.valid) {
        onVerified(data.userName, data.userId, data.initials);
      } else {
        setError("PIN ungueltig.");
      }
    } catch {
      setError("Verbindungsfehler.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">PIN eingeben zur Bestaetigung</p>
      </div>
      <input
        type="password"
        inputMode="numeric"
        maxLength={6}
        placeholder="PIN"
        value={pin}
        onChange={e => setPin(e.target.value.replace(/\D/g,""))}
        onKeyDown={e => e.key === "Enter" && pin.length >= 3 && verify()}
        className="w-full border rounded-lg px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
        autoFocus
      />
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">
          Zurueck
        </button>
        <button
          onClick={verify}
          disabled={pin.length < 3 || loading}
          className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Bestaetigen
        </button>
      </div>
    </div>
  );
}

// ===== MODAL: Reifeschrank / Käsekühlschrank =====
function TempModal({
  art, day, year, month, onConfirm, onClose,
}: {
  art: "reifeschrank" | "kaesekühlschrank";
  day: number; year: number; month: number;
  onConfirm: (data: { temperatur: string; luftfeuchtigkeit?: string; massnahme: string; kuerzel: string; userId: number | null }) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"form"|"pin">("form");
  const [temp, setTemp] = useState("");
  const [feuchte, setFeuchte] = useState("");
  const [massnahme, setMassnahme] = useState("");
  const [loading, setLoading] = useState(false);
  const [identified, setIdentified] = useState<{ name: string; userId: number; kuerzel: string } | null>(null);

  const artLabel = art === "reifeschrank" ? "Reifeschrank" : "Kaesekühlschrank";
  const tempSpec = art === "reifeschrank" ? "Soll: 2°C (±1°C)" : "Soll: max. 7°C";

  const tStatus = tempStatus(temp, art);
  const hStatus = humidityStatus(feuchte);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{artLabel} – {day < 10 ? "0"+day : day}.{month < 10 ? "0"+month : month}.{year}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {step === "form" ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Temperatur (°C) <span className="text-muted-foreground/60 font-normal">{tempSpec}</span></label>
              <div className="relative">
                <input
                  type="text" inputMode="decimal"
                  placeholder="z.B. 2,1"
                  value={temp}
                  onChange={e => setTemp(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${tStatus==="warn"?"border-red-400 bg-red-50":tStatus==="ok"?"border-green-400 bg-green-50":""}`}
                />
                {tStatus !== "none" && (
                  <span className={`absolute right-2 top-2 text-xs font-medium ${tStatus==="ok"?"text-green-600":"text-red-600"}`}>
                    {tStatus==="ok" ? "i.O." : "ABWEICHUNG"}
                  </span>
                )}
              </div>
            </div>

            {art === "reifeschrank" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Luftfeuchtigkeit (% rH) <span className="text-muted-foreground/60 font-normal">Soll: 75–85%</span></label>
                <div className="relative">
                  <input
                    type="text" inputMode="decimal"
                    placeholder="z.B. 80,0"
                    value={feuchte}
                    onChange={e => setFeuchte(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${hStatus==="warn"?"border-red-400 bg-red-50":hStatus==="ok"?"border-green-400 bg-green-50":""}`}
                  />
                  {hStatus !== "none" && (
                    <span className={`absolute right-2 top-2 text-xs font-medium ${hStatus==="ok"?"text-green-600":"text-red-600"}`}>
                      {hStatus==="ok" ? "i.O." : "ABWEICHUNG"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {(tStatus === "warn" || hStatus === "warn") && (
              <div>
                <label className="text-xs font-medium text-red-600 mb-1 block">Massnahme bei Abweichung <span className="text-red-400">*</span></label>
                <textarea
                  rows={2}
                  placeholder="Getroffene Massnahme beschreiben..."
                  value={massnahme}
                  onChange={e => setMassnahme(e.target.value)}
                  className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
            )}
            {(tStatus !== "warn" && hStatus !== "warn") && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Massnahme (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Ggf. Massnahme beschreiben..."
                  value={massnahme}
                  onChange={e => setMassnahme(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
              <button
                onClick={() => setStep("pin")}
                disabled={!temp || ((tStatus==="warn"||hStatus==="warn") && !massnahme.trim())}
                className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                Weiter
              </button>
            </div>
          </div>
        ) : identified ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium">{identified.name}</p>
            <div className="flex gap-2">
              <button onClick={() => { setIdentified(null); setStep("pin"); }} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Zurueck</button>
              <button
                onClick={() => onConfirm({ temperatur: temp, ...(art==="reifeschrank" ? { luftfeuchtigkeit: feuchte } : {}), massnahme, kuerzel: identified.kuerzel, userId: identified.userId })}
                className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700"
              >
                Speichern
              </button>
            </div>
          </div>
        ) : (
          <PinStep
            onVerified={(name, userId, kuerzel) => setIdentified({ name, userId, kuerzel })}
            onBack={() => setStep("form")}
            loading={loading}
            setLoading={setLoading}
          />
        )}
      </div>
    </div>
  );
}

// ===== MODAL: Heiße Theke =====
function HeisseThekeModal({
  day, year, month, onConfirm, onClose,
}: {
  day: number; year: number; month: number;
  onConfirm: (data: { produkt: string; kernTempGaren: string; tempHeisshalten: string; massnahme: string; kuerzel: string; userId: number | null }) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"form"|"pin">("form");
  const [produkt, setProdukt] = useState("");
  const [customProdukt, setCustomProdukt] = useState("");
  const [garenTemp, setGarenTemp] = useState("");
  const [heissTemp, setHeissTemp] = useState("");
  const [massnahme, setMassnahme] = useState("");
  const [loading, setLoading] = useState(false);
  const [identified, setIdentified] = useState<{ name: string; userId: number; kuerzel: string } | null>(null);

  const finalProdukt = produkt === "Sonstiges" ? customProdukt : produkt;
  const gStatus = garenStatus(garenTemp, produkt);
  const hStatus = heisshaltenStatus(heissTemp);
  const hasWarn = gStatus === "warn" || hStatus === "warn";
  const minGarenTemp = produkt === "Fisch" ? "60°C" : "72°C";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Heisse Theke – {day < 10 ? "0"+day : day}.{month < 10 ? "0"+month : month}.{year}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {step === "form" ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Produkt</label>
              <select
                value={produkt}
                onChange={e => { setProdukt(e.target.value); setCustomProdukt(""); }}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="">Produkt waehlen...</option>
                {HEISSE_THEKE_PRODUKTE.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {produkt === "Sonstiges" && (
                <input
                  type="text"
                  placeholder="Produktbezeichnung eingeben..."
                  value={customProdukt}
                  onChange={e => setCustomProdukt(e.target.value)}
                  className="mt-2 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Kerntemperatur Garen (°C) <span className="text-muted-foreground/60 font-normal">Soll: mind. {minGarenTemp || "72°C"}</span>
              </label>
              <div className="relative">
                <input
                  type="text" inputMode="decimal"
                  placeholder="z.B. 75,0"
                  value={garenTemp}
                  onChange={e => setGarenTemp(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${gStatus==="warn"?"border-red-400 bg-red-50":gStatus==="ok"?"border-green-400 bg-green-50":""}`}
                />
                {gStatus !== "none" && (
                  <span className={`absolute right-2 top-2 text-xs font-medium ${gStatus==="ok"?"text-green-600":"text-red-600"}`}>
                    {gStatus==="ok" ? "i.O." : "ABWEICHUNG"}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Temperatur Heisshalten (°C) <span className="text-muted-foreground/60 font-normal">Soll: mind. 60°C, max. 3 Std.</span>
              </label>
              <div className="relative">
                <input
                  type="text" inputMode="decimal"
                  placeholder="z.B. 65,0"
                  value={heissTemp}
                  onChange={e => setHeissTemp(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${hStatus==="warn"?"border-red-400 bg-red-50":hStatus==="ok"?"border-green-400 bg-green-50":""}`}
                />
                {hStatus !== "none" && (
                  <span className={`absolute right-2 top-2 text-xs font-medium ${hStatus==="ok"?"text-green-600":"text-red-600"}`}>
                    {hStatus==="ok" ? "i.O." : "ABWEICHUNG"}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className={`text-xs font-medium mb-1 block ${hasWarn ? "text-red-600" : "text-muted-foreground"}`}>
                Massnahme {hasWarn ? <span className="text-red-400">* (Abweichung!)</span> : "(optional)"}
              </label>
              <textarea
                rows={2}
                placeholder={hasWarn ? "Getroffene Massnahme beschreiben..." : "Ggf. Massnahme beschreiben..."}
                value={massnahme}
                onChange={e => setMassnahme(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${hasWarn ? "border-red-300 focus:ring-red-400" : "focus:ring-primary"}`}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
              <button
                onClick={() => setStep("pin")}
                disabled={!finalProdukt.trim() || !garenTemp || !heissTemp || (hasWarn && !massnahme.trim())}
                className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                Weiter
              </button>
            </div>
          </div>
        ) : identified ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium">{identified.name}</p>
            <div className="flex gap-2">
              <button onClick={() => { setIdentified(null); setStep("pin"); }} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Zurueck</button>
              <button
                onClick={() => onConfirm({ produkt: finalProdukt, kernTempGaren: garenTemp, tempHeisshalten: heissTemp, massnahme, kuerzel: identified.kuerzel, userId: identified.userId })}
                className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700"
              >
                Speichern
              </button>
            </div>
          </div>
        ) : (
          <PinStep
            onVerified={(name, userId, kuerzel) => setIdentified({ name, userId, kuerzel })}
            onBack={() => setStep("form")}
            loading={loading}
            setLoading={setLoading}
          />
        )}
      </div>
    </div>
  );
}

// ===== TAB: Reifeschrank / Käsekühlschrank =====
function TempTab({
  art, entries, year, month, marketId, onSaved, onDeleted, adminSession,
}: {
  art: "reifeschrank" | "kaesekühlschrank";
  entries: KontrolleEntry[];
  year: number; month: number; marketId: number;
  onSaved: () => void;
  onDeleted: (id: number) => void;
  adminSession: boolean;
}) {
  const [modal, setModal] = useState<number | null>(null);

  const days = daysInMonth(year, month);
  const byDay = useMemo(() => {
    const m: Record<number, KontrolleEntry[]> = {};
    for (const e of entries) {
      if (!m[e.day]) m[e.day] = [];
      m[e.day].push(e);
    }
    return m;
  }, [entries]);

  const tempSpec = art === "reifeschrank" ? "Soll: 2°C (±1°C)" : "Soll: max. 7°C";

  const handleSave = async (day: number, data: { temperatur: string; luftfeuchtigkeit?: string; massnahme: string; kuerzel: string; userId: number | null }) => {
    await fetch(`${BASE}/kaesetheke-kontrolle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketId, year, month, day,
        kontrolleArt: art,
        temperatur: data.temperatur,
        luftfeuchtigkeit: data.luftfeuchtigkeit || null,
        massnahme: data.massnahme,
        kuerzel: data.kuerzel,
        userId: data.userId,
      }),
    });
    setModal(null);
    onSaved();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/kaesetheke-kontrolle/${id}`, { method: "DELETE" });
    onDeleted(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        <Thermometer className="w-3.5 h-3.5 shrink-0" />
        <span>{tempSpec}{art === "reifeschrank" ? " | Luftfeuchtigkeit: 75–85% rH" : ""} | Auf einen Tag tippen um Temperatur einzutragen.</span>
      </div>
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left px-3 py-2.5 font-semibold text-xs text-muted-foreground w-16">Tag</th>
              <th className="text-left px-2 py-2.5 font-semibold text-xs text-muted-foreground w-8">WT</th>
              <th className="text-left px-3 py-2.5 font-semibold text-xs text-muted-foreground">Temp.</th>
              {art === "reifeschrank" && <th className="text-left px-3 py-2.5 font-semibold text-xs text-muted-foreground">Feuchte</th>}
              <th className="text-left px-3 py-2.5 font-semibold text-xs text-muted-foreground hidden md:table-cell">Massnahme</th>
              <th className="text-left px-3 py-2.5 font-semibold text-xs text-muted-foreground w-16">Kürzel</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: days }, (_, i) => i + 1).map(day => {
              const dayEntries = byDay[day] || [];
              const latestEntry = dayEntries[dayEntries.length - 1] || null;
              const wt = getWeekday(year, month, day);
              const future = isFuture(year, month, day);
              const today = isToday(year, month, day);
              const weekend = isWeekend(year, month, day);
              const tStatus = tempStatus(latestEntry?.temperatur ?? null, art);
              const hStatus = humidityStatus(latestEntry?.luftfeuchtigkeit ?? null);
              const hasWarn = tStatus === "warn" || hStatus === "warn";
              const clickable = !future;

              return (
                <tr
                  key={day}
                  onClick={() => clickable && setModal(day)}
                  className={[
                    "border-b last:border-0 transition-colors",
                    today ? "bg-blue-50/70" : weekend ? "bg-muted/20" : "",
                    hasWarn ? "bg-red-50/50" : "",
                    clickable ? "cursor-pointer hover:bg-primary/5 active:bg-primary/10" : "opacity-40",
                  ].filter(Boolean).join(" ")}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-base">{String(day).padStart(2,"0")}</span>
                      {today && <span className="text-[10px] font-semibold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full">HEUTE</span>}
                      {!latestEntry && clickable && (
                        <span className="text-[10px] text-primary/50 hidden sm:inline">+ Eintragen</span>
                      )}
                    </div>
                  </td>
                  <td className={`px-2 py-3 text-xs font-medium ${weekend ? "text-red-500" : "text-muted-foreground"}`}>{wt}</td>
                  <td className="px-3 py-3">
                    {latestEntry?.temperatur ? (
                      <TempBadge val={latestEntry.temperatur} status={tStatus} />
                    ) : clickable ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary/40 font-medium border border-dashed border-primary/20 rounded px-2 py-0.5">
                        <Plus className="w-3 h-3" /> Temp.
                      </span>
                    ) : <span className="text-muted-foreground/30 text-xs">—</span>}
                  </td>
                  {art === "reifeschrank" && (
                    <td className="px-3 py-3">
                      {latestEntry?.luftfeuchtigkeit ? (
                        <span className={`font-mono font-semibold text-sm ${hStatus==="ok"?"text-green-600":hStatus==="warn"?"text-red-600":"text-foreground"}`}>
                          {latestEntry.luftfeuchtigkeit}%
                        </span>
                      ) : <span className="text-muted-foreground/30 text-xs">—</span>}
                    </td>
                  )}
                  <td className="px-3 py-3 max-w-[200px] hidden md:table-cell">
                    {latestEntry?.massnahme ? (
                      <span className={`text-xs truncate block ${hasWarn ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{latestEntry.massnahme}</span>
                    ) : <span className="text-muted-foreground/30 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {latestEntry ? (
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded">{latestEntry.kuerzel}</span>
                      ) : <span className="text-muted-foreground/30 text-xs">—</span>}
                      {adminSession && latestEntry && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(latestEntry.id); }}
                          className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Loeschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal !== null && (
        <TempModal
          art={art}
          day={modal} year={year} month={month}
          onConfirm={(data) => handleSave(modal, data)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ===== TAB: Heiße Theke =====
function HeisseThekeTab({
  entries, year, month, marketId, onSaved, onDeleted, adminSession,
}: {
  entries: KontrolleEntry[];
  year: number; month: number; marketId: number;
  onSaved: () => void;
  onDeleted: (id: number) => void;
  adminSession: boolean;
}) {
  const [modal, setModal] = useState<number | null>(null);

  const days = daysInMonth(year, month);
  const byDay = useMemo(() => {
    const m: Record<number, KontrolleEntry[]> = {};
    for (const e of entries) {
      if (!m[e.day]) m[e.day] = [];
      m[e.day].push(e);
    }
    return m;
  }, [entries]);

  const handleSave = async (day: number, data: { produkt: string; kernTempGaren: string; tempHeisshalten: string; massnahme: string; kuerzel: string; userId: number | null }) => {
    await fetch(`${BASE}/kaesetheke-kontrolle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketId, year, month, day,
        kontrolleArt: "heisse_theke",
        produkt: data.produkt,
        kernTempGaren: data.kernTempGaren,
        tempHeisshalten: data.tempHeisshalten,
        massnahme: data.massnahme,
        kuerzel: data.kuerzel,
        userId: data.userId,
      }),
    });
    setModal(null);
    onSaved();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/kaesetheke-kontrolle/${id}`, { method: "DELETE" });
    onDeleted(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        <Flame className="w-3.5 h-3.5 shrink-0 text-orange-500" />
        <span><strong>Garen:</strong> mind. +72°C (Fisch: +60°C) | <strong>Heisshalten:</strong> mind. 60°C, max. 3 Std.</span>
      </div>

      <div className="space-y-2">
        {Array.from({ length: days }, (_, i) => i + 1).map(day => {
          const dayEntries = byDay[day] || [];
          const wt = getWeekday(year, month, day);
          const future = isFuture(year, month, day);
          const today = isToday(year, month, day);
          const weekend = isWeekend(year, month, day);

          if (future && dayEntries.length === 0) return null;

          return (
            <div
              key={day}
              className={[
                "border rounded-xl overflow-hidden",
                today ? "border-blue-200 shadow-sm" : "",
                weekend && !today ? "bg-muted/20" : "",
              ].filter(Boolean).join(" ")}
            >
              {/* Tages-Header */}
              <div className={`flex items-center justify-between px-4 py-2.5 ${today ? "bg-blue-50" : "bg-muted/30"} border-b`}>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base">{String(day).padStart(2,"0")}.</span>
                  <span className={`text-sm font-medium ${weekend ? "text-red-500" : "text-muted-foreground"}`}>{wt}</span>
                  {today && <span className="text-[10px] font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">HEUTE</span>}
                  {dayEntries.length > 0 && (
                    <span className="text-xs text-muted-foreground">{dayEntries.length} Produkt{dayEntries.length !== 1 ? "e" : ""}</span>
                  )}
                </div>
                {!future && (
                  <button
                    onClick={() => setModal(day)}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Produkt eintragen
                  </button>
                )}
              </div>

              {/* Produkt-Eintraege */}
              {dayEntries.length > 0 ? (
                <div className="divide-y">
                  {dayEntries.map(entry => {
                    const gStatus = garenStatus(entry.kern_temp_garen, entry.produkt);
                    const hStatus = heisshaltenStatus(entry.temp_heisshalten);
                    const hasWarn = gStatus === "warn" || hStatus === "warn";
                    return (
                      <div key={entry.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 ${hasWarn ? "bg-red-50/60" : ""}`}>
                        <span className="font-semibold text-sm w-32 truncate">{entry.produkt}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Garen:</span>
                          <TempBadge val={entry.kern_temp_garen} status={gStatus} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Heisshalten:</span>
                          <TempBadge val={entry.temp_heisshalten} status={hStatus} />
                        </div>
                        {entry.massnahme && (
                          <span className={`text-xs flex-1 min-w-0 truncate ${hasWarn ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            {entry.massnahme}
                          </span>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded">{entry.kuerzel}</span>
                          {adminSession && (
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Loeschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  onClick={() => !future && setModal(day)}
                  className={`px-4 py-3 text-sm text-muted-foreground/60 text-center ${!future ? "cursor-pointer hover:bg-primary/5 hover:text-primary/70" : ""}`}
                >
                  {!future ? "Tippen um erstes Produkt einzutragen" : "Keine Eintraege"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal !== null && (
        <HeisseThekeModal
          day={modal} year={year} month={month}
          onConfirm={(data) => handleSave(modal, data)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ===== HAUPTSEITE =====
type Tab = "reifeschrank" | "kaesekühlschrank" | "heisse_theke";

export default function KaesethekeKontrolle() {
  const { selectedMarketId, selectedMarketName, adminSession } = useAppStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [tab, setTab] = useState<Tab>("reifeschrank");
  const [entries, setEntries] = useState<KontrolleEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const marketId = selectedMarketId ?? 0;

  const fetchEntries = useCallback(async () => {
    if (!marketId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/kaesetheke-kontrolle?marketId=${marketId}&year=${year}&month=${month}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [marketId, year, month]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const filteredEntries = useMemo(() => entries.filter(e => e.kontrolle_art === tab), [entries, tab]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDeleted = (id: number) => setEntries(prev => prev.filter(e => e.id !== id));

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "reifeschrank", label: "Reifeschrank", icon: <Wind className="w-4 h-4" /> },
    { key: "kaesekühlschrank", label: "Kaesekühlschrank", icon: <Snowflake className="w-4 h-4" /> },
    { key: "heisse_theke", label: "Heisse Theke", icon: <Flame className="w-4 h-4" /> },
  ];

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="w-6 h-6 text-primary" />
              <h1 className="text-xl md:text-2xl font-bold">3.4 Kaesetheke und Reifeschrank</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Temperaturkontrolle Reifeschrank (FB 9.5) | Kaesekühlschrank | Heisse Theke (FB 9.7)
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 hover:bg-secondary transition-colors shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Drucken</span>
          </button>
        </div>

        {/* Monatsnavigation */}
        <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="font-bold text-lg">{MONTH_NAMES[month - 1]} {year}</div>
            {selectedMarketName && <div className="text-xs text-muted-foreground">{selectedMarketName}</div>}
          </div>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Inhalt */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !marketId ? (
          <div className="text-center py-16 text-muted-foreground">Bitte einen Markt auswaehlen.</div>
        ) : (
          <>
            {tab !== "heisse_theke" ? (
              <TempTab
                art={tab as "reifeschrank" | "kaesekühlschrank"}
                entries={filteredEntries}
                year={year} month={month} marketId={marketId}
                onSaved={fetchEntries}
                onDeleted={handleDeleted}
                adminSession={!!adminSession}
              />
            ) : (
              <HeisseThekeTab
                entries={filteredEntries}
                year={year} month={month} marketId={marketId}
                onSaved={fetchEntries}
                onDeleted={handleDeleted}
                adminSession={!!adminSession}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
