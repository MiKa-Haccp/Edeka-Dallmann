import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { MitarbeiterSuchInput } from "@/components/MitarbeiterSuchInput";
import {
  ChevronLeft,
  HeartPulse, Plus, Loader2, Save, X, Camera, FileText,
  ChevronDown, ChevronUp, Trash2, ExternalLink, AlertCircle,
  CheckCircle2, Clock,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

interface Gesundheitszeugnis {
  id: number;
  tenantId: number;
  mitarbeiterName: string;
  ausstellungsDatum: string;
  naechstePruefung: string;
  dokumentBase64: string;
  notizen: string;
  createdAt: string;
}

function compressImage(file: File, maxPx = 1400, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width > height) { height = Math.round((height * maxPx) / width); width = maxPx; }
          else { width = Math.round((width * maxPx) / height); height = maxPx; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

// ===== STATUS HILFSFUNKTIONEN =====
function getStatus(z: Gesundheitszeugnis) {
  if (!z.naechstePruefung) return "ok";
  const d = new Date(z.naechstePruefung);
  if (d < new Date()) return "abgelaufen";
  if (d < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)) return "bald";
  return "ok";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "abgelaufen") return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> Abgelaufen
    </span>
  );
  if (status === "bald") return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
      <Clock className="w-3 h-3" /> Bald fällig
    </span>
  );
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" /> Gültig
    </span>
  );
}

// ===== FORMULAR =====
function ZeugnisForm({ onSave, onCancel }: {
  onSave: (fields: Partial<Gesundheitszeugnis>) => Promise<void>;
  onCancel: () => void;
}) {
  const [mitarbeiterName, setMitarbeiterName] = useState("");
  const [ausstellungsDatum, setAusstellungsDatum] = useState("");
  const [naechstePruefung, setNaechstePruefung] = useState("");
  const [dokument, setDokument] = useState("");
  const [notizen, setNotizen] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = (ev) => setDokument(ev.target!.result as string);
        reader.readAsDataURL(file);
      } else {
        setDokument(await compressImage(file));
      }
    } finally { setProcessing(false); e.target.value = ""; }
  };

  const isPdf = dokument.startsWith("data:application/pdf");

  const handleSubmit = async () => {
    if (!mitarbeiterName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        mitarbeiterName: mitarbeiterName.trim(),
        ausstellungsDatum, naechstePruefung,
        dokumentBase64: dokument,
        notizen: notizen.trim(),
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-[#1a3a6b]/5 border border-[#1a3a6b]/15 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-bold text-[#1a3a6b]">Gesundheitszeugnis hinzufügen</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MitarbeiterSuchInput value={mitarbeiterName} onChange={setMitarbeiterName} required />
        <FInput label="Ausstellungsdatum" value={ausstellungsDatum} onChange={setAusstellungsDatum} type="date" />
        <FInput label="Nächste Untersuchung / Ablauf" value={naechstePruefung} onChange={setNaechstePruefung} type="date" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notizen</label>
          <input
            value={notizen} onChange={(e) => setNotizen(e.target.value)}
            placeholder="Optionale Anmerkungen"
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
          />
        </div>
      </div>

      {/* Dokument */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Dokument (Foto, Screenshot oder PDF)
        </label>
        {dokument ? (
          <div className="relative">
            {isPdf ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-700">PDF-Dokument</p>
                  <p className="text-xs text-red-500">Wird gespeichert</p>
                </div>
                <button onClick={() => setDokument("")} className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <img src={dokument} alt="Zeugnis" className="w-full max-h-64 object-contain rounded-xl border border-border/60" />
                <button onClick={() => setDokument("")} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fotoRef.current?.click()}
              disabled={processing}
              className="flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed border-[#1a3a6b]/25 rounded-xl text-[#1a3a6b] hover:bg-[#1a3a6b]/5 hover:border-[#1a3a6b]/40 transition-colors disabled:opacity-50"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              <span className="text-xs font-semibold text-center leading-tight">Foto /<br />Screenshot</span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={processing}
              className="flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed border-red-200 rounded-xl text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs font-semibold text-center leading-tight">PDF-<br />Datei</span>
            </button>
          </div>
        )}
        <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving || !mitarbeiterName.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ===== ZEUGNIS KARTE =====
function ZeugnisKarte({ z, onDelete, isAdmin }: { z: Gesundheitszeugnis; onDelete: () => void; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = getStatus(z);
  const isPdf = z.dokumentBase64?.startsWith("data:application/pdf");

  const borderColor = status === "abgelaufen" ? "border-red-200" : status === "bald" ? "border-amber-200" : "border-border/50";
  const iconBg = status === "abgelaufen" ? "bg-red-100" : status === "bald" ? "bg-amber-100" : "bg-green-100";
  const iconColor = status === "abgelaufen" ? "text-red-500" : status === "bald" ? "text-amber-500" : "text-green-600";

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-colors ${borderColor}`}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <HeartPulse className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{z.mitarbeiterName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {z.ausstellungsDatum
              ? `Ausgestellt: ${new Date(z.ausstellungsDatum).toLocaleDateString("de-DE")}`
              : "Kein Ausstellungsdatum"}
            {z.naechstePruefung && ` · Nächste Prüfung: ${new Date(z.naechstePruefung).toLocaleDateString("de-DE")}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={status} />
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/30">
          {/* Dokument */}
          {z.dokumentBase64 ? (
            <div className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dokument</p>
              {isPdf ? (
                <a
                  href={z.dokumentBase64} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-700">PDF-Dokument anzeigen</p>
                    <p className="text-xs text-red-500">Klicken zum Öffnen</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-red-400 ml-auto" />
                </a>
              ) : (
                <img src={z.dokumentBase64} alt="Gesundheitszeugnis" className="w-full max-h-80 object-contain rounded-xl border border-border/40" />
              )}
            </div>
          ) : (
            <div className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dokument</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-3">
                <Camera className="w-4 h-4" /> Kein Dokument hinterlegt
              </div>
            </div>
          )}

          {z.notizen && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notizen</p>
              <p className="text-sm text-foreground">{z.notizen}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Hinzugefügt: {new Date(z.createdAt).toLocaleDateString("de-DE")}
          </p>

          {canDelete && (
            <div className="flex gap-2 pt-1">
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Löschen
                </button>
              ) : (
                <>
                  <button onClick={onDelete} className="px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Sicher löschen</button>
                  <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 bg-white border border-border/60 rounded-xl text-xs font-semibold text-muted-foreground">Abbrechen</button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== HAUPTSEITE =====
export default function Gesundheitszeugnisse() {
  const { adminSession, selectedMarketId, hasPermission } = useAppStore();
  const canDelete = hasPermission("entries.delete");

  const [zeugnisse, setZeugnisse] = useState<Gesundheitszeugnis[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedMarketId
        ? `${BASE}/gesundheitszeugnisse?tenantId=1&marketId=${selectedMarketId}`
        : `${BASE}/gesundheitszeugnisse?tenantId=1`;
      const res = await fetch(url);
      setZeugnisse(await res.json());
    } finally { setLoading(false); }
  }, [selectedMarketId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (fields: Partial<Gesundheitszeugnis>) => {
    const res = await fetch(`${BASE}/gesundheitszeugnisse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: 1, marketId: selectedMarketId || 1, ...fields }),
    });
    const neu = await res.json();
    setZeugnisse((p) => [...p, neu].sort((a, b) => a.mitarbeiterName.localeCompare(b.mitarbeiterName)));
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/gesundheitszeugnisse/${id}`, { method: "DELETE" });
    setZeugnisse((p) => p.filter((z) => z.id !== id));
  };

  const abgelaufen = zeugnisse.filter((z) => getStatus(z) === "abgelaufen").length;
  const bald = zeugnisse.filter((z) => getStatus(z) === "bald").length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4 pb-10">

        {/* Header */}
        <PageHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">1.12 Gesundheitszeugnisse</h1>
                <p className="text-white/70 text-sm">Nach §43 IfSG — Nachweise der Beschäftigten</p>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-bold transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" /> Hinzufügen
              </button>
            )}
          </div>
        </PageHeader>

        {/* Status-Übersicht */}
        {zeugnisse.length > 0 && (abgelaufen > 0 || bald > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {abgelaufen > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700">{abgelaufen} abgelaufen</p>
                  <p className="text-xs text-red-500">Erneuerung erforderlich</p>
                </div>
              </div>
            )}
            {bald > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-700">{bald} bald fällig</p>
                  <p className="text-xs text-amber-600">Innerhalb 60 Tage</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Formular */}
        {showForm && (
          <ZeugnisForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        )}

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : zeugnisse.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-border/60">
            <HeartPulse className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Noch keine Gesundheitszeugnisse hinterlegt</p>
            <p className="text-xs text-muted-foreground mt-1">Klicken Sie auf "Hinzufügen"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {zeugnisse.map((z) => (
              <ZeugnisKarte
                key={z.id}
                z={z}
                isAdmin={canDelete}
                onDelete={() => handleDelete(z.id)}
              />
            ))}
          </div>
        )}

        {/* Gesetzlicher Hinweis */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-xs text-blue-700 font-medium leading-relaxed">
            <strong>Hinweis §43 IfSG:</strong> Personen, die im Lebensmittelbereich arbeiten,
            benotigen eine Erstbelehrung durch das Gesundheitsamt sowie jahrliche Folgebelehrungen
            durch den Arbeitgeber. Das Gesundheitszeugnis ist bei der Einstellung vorzulegen und
            aufzubewahren.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
