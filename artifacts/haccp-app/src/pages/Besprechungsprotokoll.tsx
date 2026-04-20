import { useState, useEffect, useCallback, useRef, Fragment, type ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import {
  ChevronLeft, Save, Plus, Trash2, Loader2, Check, X,
  Users, ClipboardList, KeyRound, UserCheck, Printer, AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { UnterschriftPad } from "@/components/UnterschriftPad";
import ReactDOM from "react-dom";

const BASE = import.meta.env.VITE_API_URL || "/api";

interface Protokoll {
  id: number;
  tenantId: number;
  datum: string;
  leiterName: string;
  unterschriftLeiterDigital: string;
  thema: string;
  createdAt: string;
  updatedAt: string;
}

interface Teilnehmer {
  id: number;
  protokollId: number;
  nameManuel: string | null;
  userId: number | null;
  bestaetigterName: string | null;
  bestaetigt: boolean;
  bestaetigtAm: string | null;
  reihenfolge: number;
}

function SCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FInput({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b]/40 transition-all"
      />
    </div>
  );
}

// ===== DRUCKKOMPONENTE (portal in body) =====
function PrintProtokoll({ protokoll, teilnehmer }: { protokoll: Protokoll; teilnehmer: Teilnehmer[] }) {
  const confirmed = teilnehmer.filter((t) => t.bestaetigt || t.nameManuel);
  const rows = Array.from({ length: Math.max(10, confirmed.length + 2) });

  return ReactDOM.createPortal(
    <div id="bespr-print-root" style={{ display: "none", fontFamily: "Arial, sans-serif", color: "#000", padding: "8mm" }}>
      {/* Header */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: "top", width: "60%" }}>
              <div style={{ background: "#4a7ab5", color: "#fff", fontWeight: "bold", fontSize: 13, padding: "4px 8px", display: "inline-block", marginBottom: 6 }}>
                BESPRECHUNGSPROTOKOLL
              </div>
              <div style={{ fontSize: 10, marginBottom: 4 }}>
                <strong>Datum:</strong> {protokoll.datum || "___________________"}
              </div>
              <div style={{ fontSize: 10, marginBottom: 2 }}>
                <strong>Leiter der Besprechung:</strong>
              </div>
              <div style={{ borderBottom: "1px solid #333", width: 220, marginBottom: 2, minHeight: 24, display: "flex", alignItems: "flex-end" }}>
                {protokoll.leiterName && <span style={{ fontSize: 10, paddingBottom: 2 }}>{protokoll.leiterName}</span>}
              </div>
              <div style={{ fontSize: 8, color: "#666", marginBottom: 8, paddingLeft: 4 }}>Name</div>
              {protokoll.unterschriftLeiterDigital ? (
                <div>
                  <img src={protokoll.unterschriftLeiterDigital} alt="Unterschrift" style={{ height: 40, maxWidth: 200 }} />
                </div>
              ) : (
                <div style={{ borderBottom: "1px solid #333", width: 220, minHeight: 32, marginBottom: 2 }} />
              )}
              <div style={{ fontSize: 8, color: "#666", paddingLeft: 4 }}>Unterschrift</div>
            </td>
            <td style={{ verticalAlign: "top", width: "35%", paddingLeft: 12 }}>
              <div style={{ border: "1px solid #333", padding: 8, minHeight: 80, fontSize: 10 }}>
                <strong>Marktstempel:</strong>
              </div>
            </td>
            <td style={{ verticalAlign: "top", width: "5%", textAlign: "right", fontSize: 9 }}>
              <div style={{ width: 40, height: 40, border: "2px solid #f0a500", background: "#f0a500", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontWeight: "bold", fontSize: 11 }}>E</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Thema */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12, border: "1px solid #4a7ab5" }}>
        <thead>
          <tr style={{ background: "#4a7ab5" }}>
            <th style={{ color: "#fff", fontSize: 11, padding: "5px 8px", textAlign: "center", fontWeight: "bold" }}>
              Thema der Besprechung
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: 8, minHeight: 160, fontSize: 10, verticalAlign: "top", whiteSpace: "pre-wrap", height: 160 }}>
              {protokoll.thema || ""}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Teilnehmer-Tabelle */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #4a7ab5" }}>
        <thead>
          <tr style={{ background: "#4a7ab5" }}>
            <th style={{ color: "#fff", fontSize: 11, padding: "5px 8px", textAlign: "center", fontWeight: "bold", width: "45%" }}>
              Name des Teilnehmers
            </th>
            <th style={{ color: "#fff", fontSize: 11, padding: "5px 8px", textAlign: "center", fontWeight: "bold", width: "55%", borderLeft: "1px solid rgba(255,255,255,0.3)" }}>
              Unterschrift des Teilnehmers
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((_, i) => {
            const t = confirmed[i];
            return (
              <tr key={i} style={{ borderTop: "1px solid #ccc" }}>
                <td style={{ padding: "6px 8px", fontSize: 10, borderRight: "1px solid #ccc", height: 28 }}>
                  {t ? (t.bestaetigterName || t.nameManuel || "") : ""}
                </td>
                <td style={{ padding: "6px 8px", fontSize: 9, color: "#888", height: 28 }}>
                  {t?.bestaetigt
                    ? <span style={{ color: "#16a34a", fontSize: 9 }}>
                        ✓ Per PIN bestätigt {t.bestaetigtAm ? `(${new Date(t.bestaetigtAm).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })})` : ""}
                      </span>
                    : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 8, color: "#888" }}>
        <span>09/2024</span>
        <span>Qualitätssicherungs-Handbuch Einzelhandel – Südbayern</span>
        <span>Seite 1 von 1</span>
      </div>
    </div>,
    document.body
  );
}

// ===== PIN MODAL =====
function PinModal({
  teilnehmer,
  onSuccess,
  onClose,
  protokollId,
}: {
  teilnehmer: Teilnehmer;
  onSuccess: (updated: Teilnehmer, name: string) => void;
  onClose: () => void;
  protokollId: number;
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const handleSubmit = async () => {
    if (!pin.trim()) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`${BASE}/besprechungsprotokoll/${protokollId}/teilnehmer/${teilnehmer.id}/pin-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim(), tenantId: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ungültiger PIN");
        setPin("");
        inputRef.current?.focus();
      } else {
        setSuccess(data.userName);
        setTimeout(() => onSuccess(data.teilnehmer, data.userName), 1200);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#1a3a6b]/10 rounded-xl flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-[#1a3a6b]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">PIN Bestätigung</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {teilnehmer.nameManuel
                ? <><strong>{teilnehmer.nameManuel}</strong> — bitte PIN eingeben</>
                : "Bitte persönlichen PIN eingeben"}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-base font-bold text-green-700">Willkommen, {success}!</p>
            <p className="text-xs text-muted-foreground">Anwesenheit wurde bestätigt.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PIN eingeben</label>
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••"
                className="px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-xl text-center font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 focus:border-[#1a3a6b]/50 transition-all"
                maxLength={8}
              />
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !pin}
              className="w-full py-3 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Anwesenheit bestätigen"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ===== HAUPTSEITE =====
export default function Besprechungsprotokoll({ noLayout }: { noLayout?: boolean } = {}) {
  const { adminSession, selectedMarketId, hasPermission } = useAppStore();
  const canDelete = hasPermission("entries.delete");
  const Wrap = noLayout ? Fragment : AppLayout;

  const [view, setView] = useState<"list" | "form">("list");
  const [protokolle, setProtokolle] = useState<Protokoll[]>([]);
  const [current, setCurrent] = useState<Protokoll | null>(null);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [datum, setDatum] = useState(new Date().toLocaleDateString("de-DE"));
  const [leiterName, setLeiterName] = useState("");
  const [thema, setThema] = useState("");
  const [unterschrift, setUnterschrift] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [neuerName, setNeuerName] = useState("");
  const [pinTarget, setPinTarget] = useState<Teilnehmer | null>(null);
  const [addingTeilnehmer, setAddingTeilnehmer] = useState(false);
  const [schnellPin, setSchnellPin] = useState("");
  const [schnellLoading, setSchnellLoading] = useState(false);
  const [schnellError, setSchnellError] = useState("");
  const schnellRef = useRef<HTMLInputElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const loadProtokolle = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedMarketId
        ? `${BASE}/besprechungsprotokoll?tenantId=1&marketId=${selectedMarketId}`
        : `${BASE}/besprechungsprotokoll?tenantId=1`;
      const res = await fetch(url);
      setProtokolle(await res.json());
    } finally { setLoading(false); }
  }, [selectedMarketId]);

  useEffect(() => { loadProtokolle(); }, [loadProtokolle]);

  const loadTeilnehmer = useCallback(async (protokollId: number) => {
    const res = await fetch(`${BASE}/besprechungsprotokoll/${protokollId}/teilnehmer`);
    setTeilnehmer(await res.json());
  }, []);

  const handleNew = () => {
    setCurrent(null);
    setDatum(new Date().toLocaleDateString("de-DE"));
    setLeiterName(""); setThema(""); setUnterschrift("");
    setTeilnehmer([]);
    setView("form"); setSaved(false);
  };

  const handleOpen = (p: Protokoll) => {
    setCurrent(p);
    setDatum(p.datum || ""); setLeiterName(p.leiterName || "");
    setThema(p.thema || ""); setUnterschrift(p.unterschriftLeiterDigital || "");
    loadTeilnehmer(p.id);
    setView("form"); setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { tenantId: 1, marketId: selectedMarketId || 1, datum, leiterName, thema, unterschriftLeiterDigital: unterschrift };
      let data: Protokoll;
      if (current) {
        const res = await fetch(`${BASE}/besprechungsprotokoll/${current.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        data = await res.json();
      } else {
        const res = await fetch(`${BASE}/besprechungsprotokoll`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        data = await res.json();
      }
      setCurrent(data);
      await loadProtokolle();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!current) return;
    await fetch(`${BASE}/besprechungsprotokoll/${current.id}`, { method: "DELETE" });
    setDeleteConfirm(false); setView("list"); setCurrent(null);
    await loadProtokolle();
  };

  // Teilnehmer manuell hinzufügen
  const handleAddTeilnehmer = async () => {
    if (!current || !neuerName.trim()) return;
    setAddingTeilnehmer(true);
    try {
      const res = await fetch(`${BASE}/besprechungsprotokoll/${current.id}/teilnehmer`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameManuel: neuerName.trim(), reihenfolge: teilnehmer.length }),
      });
      const neu = await res.json();
      setTeilnehmer((p) => [...p, neu]);
      setNeuerName("");
    } finally { setAddingTeilnehmer(false); }
  };

  // Teilnehmer löschen
  const handleDeleteTeilnehmer = async (t: Teilnehmer) => {
    if (!current) return;
    await fetch(`${BASE}/besprechungsprotokoll/${current.id}/teilnehmer/${t.id}`, { method: "DELETE" });
    setTeilnehmer((p) => p.filter((x) => x.id !== t.id));
  };

  // PIN über Schnell-Feld (ohne vorher Name): Teilnehmer direkt per PIN anmelden
  const handleSchnellPin = async () => {
    if (!current || !schnellPin.trim()) return;
    setSchnellLoading(true); setSchnellError("");
    try {
      // Temporären Teilnehmer anlegen und dann sofort via PIN bestätigen
      const addRes = await fetch(`${BASE}/besprechungsprotokoll/${current.id}/teilnehmer`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameManuel: null, reihenfolge: teilnehmer.length }),
      });
      const neu: Teilnehmer = await addRes.json();

      const verifyRes = await fetch(`${BASE}/besprechungsprotokoll/${current.id}/teilnehmer/${neu.id}/pin-verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: schnellPin.trim(), tenantId: 1 }),
      });
      const data = await verifyRes.json();

      if (!verifyRes.ok) {
        // PIN ungültig → temporären Teilnehmer wieder löschen
        await fetch(`${BASE}/besprechungsprotokoll/${current.id}/teilnehmer/${neu.id}`, { method: "DELETE" });
        setSchnellError(data.error || "Ungültiger PIN");
        setSchnellPin("");
        schnellRef.current?.focus();
      } else {
        setTeilnehmer((p) => [...p, data.teilnehmer]);
        setSchnellPin("");
        setSchnellError("");
        schnellRef.current?.focus();
      }
    } finally { setSchnellLoading(false); }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const confirmedCount = teilnehmer.filter((t) => t.bestaetigt).length;

  return (
    <Wrap>
      <div className="max-w-3xl mx-auto space-y-4 pb-10">

        {/* Header – nur wenn keine Tab-Einbettung */}
        {!noLayout && (
          <PageHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link href="/" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                  <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Besprechungsprotokoll</h1>
                  <p className="text-sm text-white/70">Teilnehmerbestätigung per PIN</p>
                </div>
              </div>
              {view === "list" && (
                <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-bold transition-colors shrink-0">
                  <Plus className="w-4 h-4" /> Neue Besprechung
                </button>
              )}
            </div>
          </PageHeader>
        )}

        {/* Toolbar bei Tab-Einbettung */}
        {noLayout && view === "list" && (
          <div className="flex justify-end">
            <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-[#1a3a6b] hover:bg-[#2d5aa0] text-white rounded-xl text-sm font-bold transition-colors">
              <Plus className="w-4 h-4" /> Neue Besprechung
            </button>
          </div>
        )}

        {/* LIST VIEW */}
        {view === "list" && (
          loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : protokolle.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Noch keine Besprechungen dokumentiert</p>
              <p className="text-xs text-muted-foreground mt-1">Erstellen Sie das erste Protokoll</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              {protokolle.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => handleOpen(p)}
                  className={`w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors flex items-center gap-4 ${i > 0 ? "border-t border-border/30" : ""}`}
                >
                  <div className="w-10 h-10 bg-[#1a3a6b]/10 rounded-xl flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-[#1a3a6b]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{p.datum}</span>
                      {p.leiterName && <span className="text-xs text-muted-foreground">— {p.leiterName}</span>}
                    </div>
                    {p.thema && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.thema}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-semibold">—</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                </button>
              ))}
            </div>
          )
        )}

        {/* FORM VIEW */}
        {view === "form" && (
          <>
            {/* Nav */}
            <div className="flex items-center justify-between">
              <button onClick={() => setView("list")} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" /> Zurück zur Übersicht
              </button>
              <span className="text-xs text-muted-foreground font-medium">
                {current ? `Protokoll #${current.id}` : "Neue Besprechung"}
              </span>
            </div>

            {/* Protokoll-Info */}
            <SCard title="Protokollkopf" icon={<ClipboardList className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FInput label="Datum" value={datum} onChange={setDatum} />
                <FInput label="Leiter der Besprechung" value={leiterName} onChange={setLeiterName} placeholder="Name des Marktleiters" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Thema der Besprechung</label>
                <textarea
                  value={thema} onChange={(e) => setThema(e.target.value)} rows={6}
                  placeholder="Besprechungsthema, Agenda, wichtige Punkte..."
                  className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b]/40 transition-all resize-none"
                />
              </div>
              <UnterschriftPad
                label="Unterschrift Leiter der Besprechung"
                value={unterschrift}
                onChange={setUnterschrift}
                height={130}
              />
            </SCard>

            {/* Teilnehmer-Verwaltung */}
            <SCard title="Teilnehmer & Anwesenheitsbestätigung" icon={<Users className="w-4 h-4" />}>

              {!current ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center">
                  Bitte zuerst das Protokoll speichern, um Teilnehmer zu erfassen.
                </div>
              ) : (
                <>
                  {/* Schnell-PIN Feld (Hauptfunktion) */}
                  <div className="bg-[#1a3a6b]/5 border border-[#1a3a6b]/20 rounded-2xl p-5">
                    <p className="text-sm font-bold text-[#1a3a6b] mb-1 flex items-center gap-2">
                      <KeyRound className="w-4 h-4" /> Anwesenheit per PIN bestätigen
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Tablet weitergeben — jeder Teilnehmer gibt seinen persönlichen PIN ein
                    </p>
                    <div className="flex gap-2">
                      <input
                        ref={schnellRef}
                        type="password"
                        inputMode="numeric"
                        value={schnellPin}
                        onChange={(e) => { setSchnellPin(e.target.value); setSchnellError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSchnellPin()}
                        placeholder="PIN eingeben"
                        maxLength={8}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-[#1a3a6b]/20 bg-white text-xl text-center font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 focus:border-[#1a3a6b]/50 transition-all"
                      />
                      <button
                        onClick={handleSchnellPin}
                        disabled={schnellLoading || !schnellPin}
                        className="px-5 py-3 bg-[#1a3a6b] text-white rounded-xl font-bold text-sm hover:bg-[#2d5aa0] disabled:opacity-40 transition-colors"
                      >
                        {schnellLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                    </div>
                    {schnellError && (
                      <div className="flex items-center gap-2 text-red-600 text-xs font-medium mt-2">
                        <AlertCircle className="w-3.5 h-3.5" /> {schnellError}
                      </div>
                    )}
                  </div>

                  {/* Teilnehmerliste */}
                  {teilnehmer.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Teilnehmer ({teilnehmer.length})
                        </p>
                        <span className="text-xs font-bold text-green-600">
                          {confirmedCount} / {teilnehmer.length} bestätigt
                        </span>
                      </div>
                      {teilnehmer.map((t) => (
                        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                          t.bestaetigt
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-border/40"
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            t.bestaetigt ? "bg-green-100" : "bg-muted/40"
                          }`}>
                            {t.bestaetigt
                              ? <UserCheck className="w-4 h-4 text-green-600" />
                              : <Users className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${t.bestaetigt ? "text-green-700" : "text-foreground"}`}>
                              {t.bestaetigterName || t.nameManuel || "Unbekannt"}
                            </p>
                            {t.bestaetigt && t.bestaetigtAm && (
                              <p className="text-xs text-green-600">
                                Bestätigt {new Date(t.bestaetigtAm).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                              </p>
                            )}
                            {!t.bestaetigt && (
                              <p className="text-xs text-muted-foreground">Ausstehend</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!t.bestaetigt && (
                              <button
                                onClick={() => setPinTarget(t)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#1a3a6b]/10 text-[#1a3a6b] rounded-lg text-xs font-bold hover:bg-[#1a3a6b]/20 transition-colors"
                              >
                                <KeyRound className="w-3 h-3" /> PIN
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTeilnehmer(t)}
                              className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Manuell hinzufügen */}
                  <div className="border-t border-border/30 pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Manuell hinzufügen (ohne PIN)
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={neuerName}
                        onChange={(e) => setNeuerName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTeilnehmer()}
                        placeholder="Name des Teilnehmers"
                        className="flex-1 px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b]/40 transition-all"
                      />
                      <button
                        onClick={handleAddTeilnehmer}
                        disabled={!neuerName.trim() || addingTeilnehmer}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Hinzufügen
                      </button>
                    </div>
                  </div>
                </>
              )}
            </SCard>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button onClick={() => setView("list")} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" /> Zurück
              </button>
              <div className="flex-1" />

              {current && (
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#1a3a6b]/30 text-[#1a3a6b] rounded-xl text-sm font-semibold hover:bg-[#1a3a6b]/5 transition-colors"
                >
                  <Printer className="w-4 h-4" /> Drucken
                </button>
              )}

              {canDelete && current && !deleteConfirm && (
                <button onClick={() => setDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                  <Trash2 className="w-4 h-4" /> Löschen
                </button>
              )}
              {deleteConfirm && (
                <>
                  <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold">
                    <Trash2 className="w-4 h-4" /> Sicher löschen
                  </button>
                  <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground">
                    Abbrechen
                  </button>
                </>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  saved ? "bg-green-600 text-white" : "bg-[#1a3a6b] text-white hover:bg-[#2d5aa0]"
                }`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? "Speichert…" : saved ? "Gespeichert" : current ? "Speichern" : "Protokoll anlegen"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* PIN-Modal */}
      {pinTarget && current && (
        <PinModal
          teilnehmer={pinTarget}
          protokollId={current.id}
          onSuccess={(updated, name) => {
            setTeilnehmer((p) => p.map((t) => t.id === updated.id ? updated : t));
            setPinTarget(null);
          }}
          onClose={() => setPinTarget(null)}
        />
      )}

      {/* Print document portal */}
      {current && (
        <PrintProtokoll protokoll={{ ...current, datum, leiterName, thema, unterschriftLeiterDigital: unterschrift }} teilnehmer={teilnehmer} />
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#bespr-print-root) { display: none !important; }
          #bespr-print-root { display: block !important; position: static !important; }
          @page { margin: 10mm; size: A4 portrait; }
        }
      `}</style>
    </Wrap>
  );
}
