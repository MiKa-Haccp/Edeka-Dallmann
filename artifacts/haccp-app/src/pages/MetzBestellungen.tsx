import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import {
  ShoppingBag, ChevronLeft, ChevronRight, Plus, X, Check,
  Loader2, Phone, User, Package, ClipboardCheck, Trash2,
  CheckCircle2, Clock, AlertCircle, Calendar,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

interface Bestellung {
  id: number;
  tenantId: number;
  marketId: number | null;
  datum: string;
  kundeName: string;
  kundeTelefon: string | null;
  artikel: string;
  menge: string | null;
  notizen: string | null;
  abholdatum: string | null;
  bestelltKuerzel: string | null;
  bestelltUserId: number | null;
  bestelltAm: string | null;
  abgeholtKuerzel: string | null;
  abgeholtUserId: number | null;
  abgeholtAm: string | null;
  createdAt: string;
}

function getStatus(b: Bestellung): "neu" | "bestellt" | "abgeholt" {
  if (b.abgeholtKuerzel) return "abgeholt";
  if (b.bestelltKuerzel) return "bestellt";
  return "neu";
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// ── PIN-Modal ──────────────────────────────────────────────────────────────────
function PinModal({
  label,
  onConfirm,
  onClose,
}: {
  label: string;
  onConfirm: (kuerzel: string, userId: number | null) => void;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const verify = async () => {
    setError(""); setLoading(true);
    try {
      const r = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, tenantId: 1 }),
      });
      const d = await r.json();
      if (d.valid) onConfirm(d.initials, d.userId);
      else setError("PIN ungültig.");
    } catch { setError("Verbindungsfehler."); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">{label}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PIN eingeben</label>
          <input
            ref={inputRef} type="password" value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pin && verify()}
            className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-white text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
            placeholder="••••"
          />
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </div>
        <button
          onClick={verify} disabled={!pin || loading}
          className="w-full py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Bestätigen
        </button>
      </div>
    </div>
  );
}

// ── Neu-Bestellung-Modal ───────────────────────────────────────────────────────
function NeueBestellungModal({
  datum,
  onSave,
  onClose,
}: {
  datum: string;
  onSave: (data: Partial<Bestellung>) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep]               = useState<"form" | "pin">("form");
  const [kundeName, setKundeName]     = useState("");
  const [kundeTelefon, setKundeTelefon] = useState("");
  const [artikel, setArtikel]         = useState("");
  const [menge, setMenge]             = useState("");
  const [notizen, setNotizen]         = useState("");
  const [abholdatum, setAbholdatum]   = useState("");

  const [pin, setPin]       = useState("");
  const [pinErr, setPinErr] = useState("");
  const [saving, setSaving] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  const d = new Date(datum + "T00:00:00");
  const dayLabel = `${String(d.getDate()).padStart(2, "0")}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`;
  const wd = WOCHENTAGE[d.getDay()];

  const goToPin = () => { setStep("pin"); setTimeout(() => pinRef.current?.focus(), 100); };

  const handleSave = async () => {
    setPinErr(""); setSaving(true);
    try {
      const r = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, tenantId: 1 }),
      });
      const d = await r.json();
      if (!d.valid) { setPinErr("PIN ungültig."); setSaving(false); return; }
      await onSave({
        kundeName:    kundeName.trim(),
        kundeTelefon: kundeTelefon.trim() || undefined,
        artikel:      artikel.trim(),
        menge:        menge.trim() || undefined,
        notizen:      notizen.trim() || undefined,
        abholdatum:   abholdatum || null,
      });
    } catch (err) {
      console.error("Speichern fehlgeschlagen:", err);
      setPinErr("Verbindungsfehler beim Speichern.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#1a3a6b]" /> Neue Bestellung
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{wd}, {dayLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {step === "form" ? (
          <>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kundenname *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={kundeName} onChange={(e) => setKundeName(e.target.value)}
                      placeholder="Vor- und Nachname"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefon</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={kundeTelefon} onChange={(e) => setKundeTelefon(e.target.value)}
                      placeholder="Optional"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Menge</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={menge} onChange={(e) => setMenge(e.target.value)}
                      placeholder="z. B. 2 kg"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Was wurde bestellt? *</label>
                <textarea
                  value={artikel} onChange={(e) => setArtikel(e.target.value)}
                  placeholder="Artikel, Sorte, Verarbeitung …"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Abholdatum (geplant)
                </label>
                <input
                  type="date"
                  value={abholdatum}
                  onChange={(e) => setAbholdatum(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interne Notizen</label>
                <input
                  value={notizen} onChange={(e) => setNotizen(e.target.value)}
                  placeholder="Besonderheiten, Wünsche …"
                  className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={goToPin} disabled={!kundeName.trim() || !artikel.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-40 transition-colors"
              >
                <Check className="w-4 h-4" /> Weiter
              </button>
              <button onClick={onClose} className="px-5 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Abbrechen
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-secondary/40 rounded-xl px-4 py-3 text-sm space-y-1">
              <p className="font-semibold">{kundeName}</p>
              <p className="text-muted-foreground text-xs">{artikel}{menge ? ` · ${menge}` : ""}</p>
              {abholdatum && (
                <p className="text-xs text-[#1a3a6b] font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Abholdatum: {formatDate(abholdatum)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PIN zur Bestätigung</label>
              <input
                ref={pinRef} type="password" value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && pin && handleSave()}
                className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-white text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
                placeholder="••••"
              />
              {pinErr && <p className="text-xs text-red-500 text-center">{pinErr}</p>}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave} disabled={!pin || saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-40 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Speichern
              </button>
              <button onClick={() => { setStep("form"); setPin(""); setPinErr(""); }} className="px-5 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Zurück
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Bestellungs-Karte ─────────────────────────────────────────────────────────
function BestellungCard({
  b,
  canDelete,
  onBestellt,
  onAbgeholt,
  onDelete,
}: {
  b: Bestellung;
  canDelete: boolean;
  onBestellt: (b: Bestellung) => void;
  onAbgeholt: (b: Bestellung) => void;
  onDelete: (id: number) => void;
}) {
  const status = getStatus(b);

  const statusConfig = {
    neu:      { bg: "bg-red-50",   border: "border-red-200",   dot: "bg-red-500",   label: "Noch nicht bestellt", icon: <AlertCircle className="w-3 h-3 text-red-500" /> },
    bestellt: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", label: "Bestellt",            icon: <Clock className="w-3 h-3 text-amber-500" /> },
    abgeholt: { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", label: "Abgeholt",            icon: <CheckCircle2 className="w-3 h-3 text-green-600" /> },
  };
  const sc = statusConfig[status];

  return (
    <div className={`rounded-xl border-2 ${sc.border} ${sc.bg} p-3 space-y-2`}>
      {/* Kopf */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate">{b.kundeName}</p>
            {b.kundeTelefon && (
              <a href={`tel:${b.kundeTelefon}`} className="text-xs text-[#2d5aa0] flex items-center gap-1 hover:underline">
                <Phone className="w-3 h-3" />{b.kundeTelefon}
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {sc.icon}
          <span className="text-[10px] font-semibold text-muted-foreground">{sc.label}</span>
        </div>
      </div>

      {/* Artikel */}
      <div className="bg-white/60 rounded-lg px-3 py-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Bestellung</p>
        <p className="text-sm font-medium leading-snug">{b.artikel}</p>
        {b.menge && <p className="text-xs text-muted-foreground mt-0.5">Menge: <strong>{b.menge}</strong></p>}
        {b.abholdatum && (
          <p className="text-xs text-[#1a3a6b] font-semibold mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Abholdatum: {formatDate(b.abholdatum)}
          </p>
        )}
        {b.notizen && <p className="text-xs text-muted-foreground mt-0.5 italic">{b.notizen}</p>}
        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
          Aufgenommen: {new Date(b.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} Uhr
        </p>
      </div>

      {/* Status-Trail */}
      {(b.bestelltKuerzel || b.abgeholtKuerzel) && (
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          {b.bestelltKuerzel && (
            <span className="flex items-center gap-1 bg-white/60 rounded-md px-2 py-0.5 font-medium">
              <Check className="w-2.5 h-2.5 text-amber-500" />
              Bestellt: <strong className="font-mono ml-0.5">{b.bestelltKuerzel}</strong>
              {b.bestelltAm && <span className="ml-1 text-muted-foreground/60">{new Date(b.bestelltAm).toLocaleDateString("de-DE")}</span>}
            </span>
          )}
          {b.abgeholtKuerzel && (
            <span className="flex items-center gap-1 bg-white/60 rounded-md px-2 py-0.5 font-medium">
              <Check className="w-2.5 h-2.5 text-green-600" />
              Abgeholt: <strong className="font-mono ml-0.5">{b.abgeholtKuerzel}</strong>
              {b.abgeholtAm && <span className="ml-1 text-muted-foreground/60">{new Date(b.abgeholtAm).toLocaleDateString("de-DE")}</span>}
            </span>
          )}
        </div>
      )}

      {/* Aktionen */}
      <div className="flex items-center gap-2 pt-0.5">
        {status === "neu" && (
          <button
            onClick={() => onBestellt(b)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5" /> Bestellt ✓
          </button>
        )}
        {status === "bestellt" && (
          <button
            onClick={() => onAbgeholt(b)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Abgeholt ✓
          </button>
        )}
        {status === "abgeholt" && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Erledigt
          </span>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(b.id)}
            className="ml-auto p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Hauptseite ─────────────────────────────────────────────────────────────────
export default function MetzBestellungen() {
  const { selectedMarketId, hasPermission } = useAppStore();
  const canDelete = hasPermission("entries.delete");
  const { data: markets } = useListMarkets({ tenantId: 1 });

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [bestellungen, setBestellungen] = useState<Bestellung[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [pinTarget, setPinTarget] = useState<{ bestellung: Bestellung; action: "bestellt" | "abgeholt" } | null>(null);

  const todayRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(
        `${BASE}/metz-bestellungen?tenantId=1&marketId=${selectedMarketId}&year=${year}&month=${month}`
      );
      setBestellungen(await r.json());
    } finally { setLoading(false); }
  }, [selectedMarketId, year, month]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (year === now.getFullYear() && month === now.getMonth() + 1) {
      setTimeout(() => todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [month, year]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const totalDays = new Date(year, month, 0).getDate();
  const dayBestellungen = (day: number) =>
    bestellungen.filter(b => b.datum === `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);

  const isToday  = (day: number) => year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
  const isFuture = (day: number) => new Date(year, month - 1, day) > new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const getWd    = (day: number) => WOCHENTAGE[new Date(year, month - 1, day).getDay()];

  const handleSave = async (data: Partial<Bestellung>) => {
    if (!activeDay) return;
    const r = await fetch(`${BASE}/metz-bestellungen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: 1, marketId: selectedMarketId, datum: activeDay, ...data }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const neu = await r.json();
    setBestellungen(prev => [...prev, neu]);
    setActiveDay(null);
  };

  const handleBestellt = async (kuerzel: string, userId: number | null) => {
    if (!pinTarget) return;
    const r = await fetch(`${BASE}/metz-bestellungen/${pinTarget.bestellung.id}/bestellt`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kuerzel, userId }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const updated = await r.json();
    setBestellungen(prev => prev.map(b => b.id === updated.id ? updated : b));
    setPinTarget(null);
  };

  const handleAbgeholt = async (kuerzel: string, userId: number | null) => {
    if (!pinTarget) return;
    const r = await fetch(`${BASE}/metz-bestellungen/${pinTarget.bestellung.id}/abgeholt`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kuerzel, userId }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const updated = await r.json();
    setBestellungen(prev => prev.map(b => b.id === updated.id ? updated : b));
    setPinTarget(null);
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/metz-bestellungen/${id}`, { method: "DELETE" });
    setBestellungen(prev => prev.filter(b => b.id !== id));
  };

  const marketName = markets?.find(m => m.id === selectedMarketId)?.name ?? "";

  const totalNeu      = bestellungen.filter(b => getStatus(b) === "neu").length;
  const totalBestellt = bestellungen.filter(b => getStatus(b) === "bestellt").length;
  const totalAbgeholt = bestellungen.filter(b => getStatus(b) === "abgeholt").length;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4 pb-10">

        {/* Header */}
        <PageHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/category/3" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Bestellungen Metzgerei</h1>
                {marketName && <p className="text-sm text-white/70">{marketName}</p>}
              </div>
            </div>
            {/* Ampel-Zusammenfassung */}
            {bestellungen.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {totalNeu > 0 && (
                  <span className="flex items-center gap-1 bg-red-500/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" />{totalNeu} offen
                  </span>
                )}
                {totalBestellt > 0 && (
                  <span className="flex items-center gap-1 bg-amber-400/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />{totalBestellt} bestellt
                  </span>
                )}
                {totalAbgeholt > 0 && (
                  <span className="flex items-center gap-1 bg-green-400/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />{totalAbgeholt} abgeholt
                  </span>
                )}
              </div>
            )}
          </div>
        </PageHeader>

        {!selectedMarketId ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Bitte Markt auswählen.</p>
          </div>
        ) : (
          <>
            {/* Monats-Navigation */}
            <div className="bg-card border border-border/60 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center">
                <p className="font-bold text-lg">{MONATE[month - 1]} {year}</p>
                <p className="text-xs text-muted-foreground">Kundenbestellungen Metzgerei</p>
              </div>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Legende */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground px-1 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Offen (noch nicht bestellt)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Bestellt (warten auf Abholung)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Abgeholt (erledigt)</span>
            </div>

            {/* Lade-Spinner */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                  const wd      = getWd(day);
                  const today   = isToday(day);
                  const future  = isFuture(day);
                  const isSunday = wd === "So";
                  const db      = dayBestellungen(day);
                  const datum   = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                  const hasOffen    = db.some(b => getStatus(b) === "neu");
                  const hasBestellt = db.some(b => getStatus(b) === "bestellt");
                  const allDone     = db.length > 0 && db.every(b => getStatus(b) === "abgeholt");

                  return (
                    <div
                      key={day}
                      ref={today ? todayRef : null}
                      className={[
                        "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
                        today ? "border-amber-400 border-2" : "border-border/60",
                        isSunday ? "opacity-50" : "",
                      ].filter(Boolean).join(" ")}
                    >
                      {/* Tag-Kopf */}
                      <div className={[
                        "flex items-center justify-between px-4 py-3 border-b border-border/40",
                        today ? "bg-amber-50" : isSunday ? "bg-slate-50" : "bg-secondary/20",
                      ].filter(Boolean).join(" ")}>
                        <div className="flex items-center gap-3">
                          <div className="text-center w-10">
                            <p className={`text-xl font-black tabular-nums leading-none ${today ? "text-amber-600" : "text-foreground"}`}>
                              {String(day).padStart(2, "0")}
                            </p>
                            <p className={`text-[10px] font-bold uppercase tracking-wide ${today ? "text-amber-500" : isSunday ? "text-slate-400" : "text-muted-foreground"}`}>{wd}</p>
                          </div>
                          {today && <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">HEUTE</span>}
                          {isSunday && <span className="text-xs text-slate-400 italic">Sonntag</span>}
                          {db.length > 0 && (
                            <div className="flex items-center gap-1">
                              {hasOffen && <span className="w-2 h-2 rounded-full bg-red-500" />}
                              {hasBestellt && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                              {allDone && <span className="w-2 h-2 rounded-full bg-green-500" />}
                              <span className="text-xs text-muted-foreground ml-1">{db.length} Bestellung{db.length !== 1 ? "en" : ""}</span>
                            </div>
                          )}
                        </div>
                        {!isSunday && (
                          <button
                            onClick={() => setActiveDay(datum)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3a6b] hover:bg-[#2d5aa0] text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Bestellung
                          </button>
                        )}
                      </div>

                      {/* Bestellungs-Karten */}
                      {db.length > 0 && (
                        <div className="p-3 grid gap-2 sm:grid-cols-2">
                          {db.map(b => (
                            <BestellungCard
                              key={b.id}
                              b={b}
                              canDelete={canDelete}
                              onBestellt={(b) => setPinTarget({ bestellung: b, action: "bestellt" })}
                              onAbgeholt={(b) => setPinTarget({ bestellung: b, action: "abgeholt" })}
                              onDelete={handleDelete}
                            />
                          ))}
                        </div>
                      )}

                      {db.length === 0 && !isSunday && (
                        <div className="px-4 py-3 text-xs text-muted-foreground/50 italic">
                          Keine Bestellungen
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Neue Bestellung Modal */}
      {activeDay && (
        <NeueBestellungModal
          datum={activeDay}
          onSave={handleSave}
          onClose={() => setActiveDay(null)}
        />
      )}

      {/* PIN-Modal für Bestellt/Abgeholt */}
      {pinTarget && (
        <PinModal
          label={pinTarget.action === "bestellt" ? "Als bestellt abzeichnen" : "Als abgeholt abzeichnen"}
          onConfirm={pinTarget.action === "bestellt" ? handleBestellt : handleAbgeholt}
          onClose={() => setPinTarget(null)}
        />
      )}
    </AppLayout>
  );
}
