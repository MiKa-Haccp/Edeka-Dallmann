import { useState, useEffect, useCallback, useRef } from "react";
import { useFilePaste } from "@/hooks/useFileUpload";
import { buildFileFormData } from "@/lib/apiUpload";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { MitarbeiterSuchInput } from "@/components/MitarbeiterSuchInput";
import { PdfEmbed } from "@/lib/pdf";
import { ClickableImage } from "@/lib/lightbox";
import {
  ChevronLeft,
  Pill, Plus, Loader2, Save, X, Camera, FileText,
  ChevronDown, ChevronUp, Trash2, AlertCircle,
  CheckCircle2, Clock,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

interface Eintrag {
  id: number;
  tenantId: number;
  mitarbeiterName: string;
  zertifikatBezeichnung: string;
  ausstellungsDatum: string;
  gueltigBis: string;
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

function getStatus(z: Eintrag) {
  if (!z.gueltigBis) return "ok";
  const d = new Date(z.gueltigBis);
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
function EintragForm({ onSave, onCancel }: {
  onSave: (fields: Partial<Eintrag>, file?: File) => Promise<void>;
  onCancel: () => void;
}) {
  const [mitarbeiterName, setMitarbeiterName] = useState("");
  const [bezeichnung, setBezeichnung] = useState("");
  const [ausstellungsDatum, setAusstellungsDatum] = useState("");
  const [gueltigBis, setGueltigBis] = useState("");
  const [dokument, setDokument] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [notizen, setNotizen] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setProcessing(true);
    try {
      const isPdfFile = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdfFile) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target!.result as string);
          reader.onerror = () => reject(new Error("Fehler beim Lesen der Datei"));
          reader.readAsDataURL(file);
        });
        setDokument(dataUrl);
        setPendingFile(file);
      } else {
        setDokument(await compressImage(file));
        setPendingFile(null);
      }
    } finally { setProcessing(false); }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await processFile(file);
  };

  useFilePaste(processFile);

  const isPdf = dokument.startsWith("data:application/pdf");

  const handleSubmit = async () => {
    if (!mitarbeiterName.trim()) return;
    setSaving(true);
    try {
      const baseFields = {
        mitarbeiterName: mitarbeiterName.trim(), zertifikatBezeichnung: bezeichnung.trim(),
        ausstellungsDatum, gueltigBis, notizen: notizen.trim(),
      };
      if (pendingFile) {
        await onSave(baseFields, pendingFile);
      } else {
        await onSave({ ...baseFields, dokumentBase64: dokument });
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-[#1a3a6b]/5 border border-[#1a3a6b]/15 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-bold text-[#1a3a6b]">Sachkundenachweis hinzufügen</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MitarbeiterSuchInput value={mitarbeiterName} onChange={setMitarbeiterName} required />
        <FInput label="Zertifikat / Schulungsbezeichnung" value={bezeichnung} onChange={setBezeichnung} placeholder="z.B. Sachkunde freiverkäufliche AM" />
        <FInput label="Ausstellungsdatum" value={ausstellungsDatum} onChange={setAusstellungsDatum} type="date" />
        <FInput label="Gültig bis / Nächste Schulung" value={gueltigBis} onChange={setGueltigBis} type="date" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notizen</label>
        <input
          value={notizen} onChange={(e) => setNotizen(e.target.value)}
          placeholder="Optionale Anmerkungen"
          className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
        />
      </div>

      {/* Dokument Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Dokument (Foto, Screenshot oder PDF)
        </label>
        {dokument ? (
          <div className="relative">
            {isPdf ? (
              <PdfEmbed dataUrl={dokument} editable onClear={() => setDokument("")} height="240px" />
            ) : (
              <div className="relative">
                <ClickableImage src={dokument} alt="Sachkundenachweis" className="w-full max-h-64 object-contain rounded-xl border border-border/60" />
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
            <p className="col-span-2 text-center text-[10px] text-muted-foreground">oder Strg+V zum Einfügen aus der Zwischenablage</p>
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

// ===== EINTRAG KARTE =====
function EintragKarte({ z, onDelete, isAdmin }: { z: Eintrag; onDelete: () => void; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = getStatus(z);
  const isPdf = z.dokumentBase64?.startsWith("data:application/pdf");

  const borderColor = status === "abgelaufen" ? "border-red-200" : status === "bald" ? "border-amber-200" : "border-border/50";
  const iconBg = status === "abgelaufen" ? "bg-red-100" : status === "bald" ? "bg-amber-100" : "bg-[#1a3a6b]/10";
  const iconColor = status === "abgelaufen" ? "text-red-500" : status === "bald" ? "text-amber-500" : "text-[#1a3a6b]";

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-colors ${borderColor}`}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Pill className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{z.mitarbeiterName}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {z.zertifikatBezeichnung || "Sachkundenachweis freiverkäufliche Arzneimittel"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {z.gueltigBis && <StatusBadge status={status} />}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/30">
          {/* Daten */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            {z.ausstellungsDatum && (
              <div className="bg-muted/30 rounded-xl px-3 py-2">
                <p className="text-xs text-muted-foreground">Ausgestellt</p>
                <p className="text-sm font-bold">{new Date(z.ausstellungsDatum).toLocaleDateString("de-DE")}</p>
              </div>
            )}
            {z.gueltigBis && (
              <div className={`rounded-xl px-3 py-2 ${status === "abgelaufen" ? "bg-red-50" : status === "bald" ? "bg-amber-50" : "bg-green-50"}`}>
                <p className={`text-xs ${status === "abgelaufen" ? "text-red-500" : status === "bald" ? "text-amber-600" : "text-green-600"}`}>
                  {status === "abgelaufen" ? "Abgelaufen am" : "Gültig bis"}
                </p>
                <p className={`text-sm font-bold ${status === "abgelaufen" ? "text-red-700" : status === "bald" ? "text-amber-700" : "text-green-700"}`}>
                  {new Date(z.gueltigBis).toLocaleDateString("de-DE")}
                </p>
              </div>
            )}
          </div>

          {/* Dokument */}
          {z.dokumentBase64 ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dokument</p>
              {isPdf ? (
                <PdfEmbed dataUrl={z.dokumentBase64} height="320px" />
              ) : (
                <ClickableImage src={z.dokumentBase64} alt="Sachkundenachweis" className="w-full max-h-80 object-contain rounded-xl border border-border/40" />
              )}
            </div>
          ) : (
            <div>
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

          <p className="text-xs text-muted-foreground">Hinzugefügt: {new Date(z.createdAt).toLocaleDateString("de-DE")}</p>

          {isAdmin && (
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
export default function ArzneimittelSachkunde() {
  const { adminSession, selectedMarketId, hasPermission } = useAppStore();
  const canDelete = hasPermission("entries.delete");

  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedMarketId
        ? `${BASE}/arzneimittel-sachkunde?tenantId=1&marketId=${selectedMarketId}`
        : `${BASE}/arzneimittel-sachkunde?tenantId=1`;
      const res = await fetch(url);
      setEintraege(await res.json());
    } finally { setLoading(false); }
  }, [selectedMarketId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (fields: Partial<Eintrag>, file?: File) => {
    const { dokumentBase64, ...restFields } = fields;
    let res: Response;
    if (file) {
      res = await fetch(`${BASE}/arzneimittel-sachkunde`, {
        method: "POST",
        body: buildFileFormData({ tenantId: 1, marketId: selectedMarketId || 1, ...restFields }, file),
      });
    } else {
      res = await fetch(`${BASE}/arzneimittel-sachkunde`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: 1, marketId: selectedMarketId || 1, ...fields }),
      });
    }
    const neu = await res.json();
    setEintraege((p) => [...p, neu].sort((a, b) => a.mitarbeiterName.localeCompare(b.mitarbeiterName)));
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/arzneimittel-sachkunde/${id}`, { method: "DELETE" });
    setEintraege((p) => p.filter((z) => z.id !== id));
  };

  const abgelaufen = eintraege.filter((z) => getStatus(z) === "abgelaufen").length;
  const bald = eintraege.filter((z) => getStatus(z) === "bald").length;

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
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Sachkundenachweis Arzneimittel</h1>
                <p className="text-white/70 text-sm">Schulungen &amp; Nachweise der Mitarbeiter</p>
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

        {/* Warnkacheln */}
        {eintraege.length > 0 && (abgelaufen > 0 || bald > 0) && (
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
          <EintragForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        )}

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : eintraege.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-border/60">
            <Pill className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Noch keine Nachweise hinterlegt</p>
            <p className="text-xs text-muted-foreground mt-1">Klicken Sie auf "Hinzufügen"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {eintraege.map((z) => (
              <EintragKarte
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
            <strong>Hinweis §50 AMG:</strong> Freiverkäufliche Arzneimittel dürfen im
            Einzelhandel nur durch Personen verkauft werden, die sachkundig im Sinne
            des Arzneimittelgesetzes sind. Der Nachweis der Sachkunde ist durch eine
            entsprechende Schulungsbescheinigung zu erbringen und aufzubewahren.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
