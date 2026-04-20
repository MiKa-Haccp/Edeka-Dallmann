import { useState, useEffect, useCallback, useRef } from "react";
import { useFilePaste } from "@/hooks/useFileUpload";
import { buildFileFormData } from "@/lib/apiUpload";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import {
  ChevronLeft,
  ExternalLink, Shield, Award, Loader2, Save, Check,
  Plus, Trash2, Eye, EyeOff, Camera, X, ChevronDown, ChevronUp, Pencil,
  FileText,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

type Tab = "zugang" | "zertifikate";

interface Zugangsdaten {
  id: number | null;
  tenantId: number;
  websiteUrl: string;
  benutzername: string;
  passwort: string;
  rufnummer: string;
  notizen: string;
}

interface Zertifikat {
  id: number;
  tenantId: number;
  prueferName: string;
  zertifikatBezeichnung: string;
  gueltigBis: string;
  fotoBase64: string;
  notizen: string;
  createdAt: string;
}

// Bild komprimieren (max 1400px, JPEG 80%)
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
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

function FInput({ label, value, onChange, type = "text", placeholder = "", disabled = false }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b]/40 transition-all disabled:bg-muted/30 disabled:text-muted-foreground"
      />
    </div>
  );
}

// ===== ZERTIFIKAT-FORMULAR =====
function ZertifikatForm({ onSave, onCancel }: { onSave: (z: Partial<Zertifikat>, file?: File) => Promise<void>; onCancel: () => void }) {
  const [prueferName, setPrueferName] = useState("");
  const [bezeichnung, setBezeichnung] = useState("");
  const [gueltigBis, setGueltigBis] = useState("");
  const [datei, setDatei] = useState("");          // base64 (Bild oder PDF)
  const [dateiName, setDateiName] = useState("");  // Dateiname für PDF-Anzeige
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [notizen, setNotizen] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setProcessing(true);
    try {
      const isPdfFile = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdfFile) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target!.result as string);
          reader.onerror = () => reject(new Error("Fehler beim Lesen"));
          reader.readAsDataURL(file);
        });
        setDatei(dataUrl);
        setDateiName(file.name);
        setPendingFile(file);
      } else {
        setDatei(await compressImage(file));
        setDateiName(file.name);
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

  const [dragOver, setDragOver] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  useFilePaste(processFile);

  const isPdf = datei.startsWith("data:application/pdf");

  const handleSubmit = async () => {
    if (!prueferName.trim()) return;
    setSaving(true);
    try {
      const baseFields = {
        prueferName: prueferName.trim(), zertifikatBezeichnung: bezeichnung.trim(),
        gueltigBis: gueltigBis.trim(), notizen: notizen.trim(),
      };
      if (pendingFile) {
        await onSave(baseFields, pendingFile);
      } else {
        await onSave({ ...baseFields, fotoBase64: datei });
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-[#1a3a6b]/5 border border-[#1a3a6b]/15 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-bold text-[#1a3a6b]">Neuen Sachkundenachweis hinzufügen</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FInput label="Name des Prüfers / Schädlingsbekämpfers *" value={prueferName} onChange={setPrueferName} placeholder="Vor- und Nachname" />
        <FInput label="Zertifikat-Bezeichnung" value={bezeichnung} onChange={setBezeichnung} placeholder="z.B. Sachkundenachweis §10 TierSchG" />
        <FInput label="Gültig bis" value={gueltigBis} onChange={setGueltigBis} type="date" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notizen</label>
          <input
            value={notizen} onChange={(e) => setNotizen(e.target.value)}
            placeholder="Optionale Anmerkungen"
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
          />
        </div>
      </div>

      {/* Dokument Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Dokument (Foto, Screenshot oder PDF)
        </label>

        {datei ? (
          <div className="relative">
            {isPdf ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-700 truncate">{dateiName || "Dokument.pdf"}</p>
                  <p className="text-xs text-red-500">PDF-Datei</p>
                </div>
                <button
                  onClick={() => { setDatei(""); setDateiName(""); }}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <img src={datei} alt="Nachweis" className="w-full max-h-64 object-contain rounded-xl border border-border/60" />
                <button
                  onClick={() => { setDatei(""); setDateiName(""); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`grid grid-cols-2 gap-2 p-1 rounded-xl transition-colors ${dragOver ? "bg-[#1a3a6b]/10 ring-2 ring-[#1a3a6b]/30" : ""}`}
          >
            <button
              onClick={() => fotoRef.current?.click()}
              disabled={processing}
              className="flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed border-[#1a3a6b]/25 rounded-xl text-sm font-semibold text-[#1a3a6b] hover:bg-[#1a3a6b]/5 hover:border-[#1a3a6b]/40 transition-colors disabled:opacity-50"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              <span className="text-xs text-center leading-tight">Foto /<br />Screenshot</span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={processing}
              className="flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed border-red-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs text-center leading-tight">PDF-<br />Datei</span>
            </button>
            {dragOver ? (
              <div className="col-span-2 text-center text-xs text-[#1a3a6b] font-semibold py-1">Datei hier ablegen</div>
            ) : (
              <p className="col-span-2 text-center text-[10px] text-muted-foreground">oder Strg+V zum Einfügen aus der Zwischenablage</p>
            )}
          </div>
        )}

        {/* Versteckte Inputs */}
        <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving || !prueferName.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ===== ZERTIFIKAT KARTE =====
function ZertifikatKarte({ z, onDelete, isAdmin }: { z: Zertifikat; onDelete: () => void; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isExpired = z.gueltigBis && new Date(z.gueltigBis) < new Date();
  const expiresSoon = z.gueltigBis && !isExpired && new Date(z.gueltigBis) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-colors ${isExpired ? "border-red-200" : expiresSoon ? "border-amber-200" : "border-border/50"}`}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isExpired ? "bg-red-100" : expiresSoon ? "bg-amber-100" : "bg-green-100"
        }`}>
          <Award className={`w-5 h-5 ${isExpired ? "text-red-500" : expiresSoon ? "text-amber-500" : "text-green-600"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{z.prueferName}</p>
          {z.zertifikatBezeichnung && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{z.zertifikatBezeichnung}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {z.gueltigBis && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isExpired ? "bg-red-100 text-red-600" : expiresSoon ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
            }`}>
              {isExpired ? "Abgelaufen" : `bis ${new Date(z.gueltigBis).toLocaleDateString("de-DE")}`}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/30">
          {z.fotoBase64 && (
            <div className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dokument</p>
              {z.fotoBase64.startsWith("data:application/pdf") ? (
                <a
                  href={z.fotoBase64}
                  target="_blank"
                  rel="noopener noreferrer"
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
                <img src={z.fotoBase64} alt="Nachweis" className="w-full max-h-80 object-contain rounded-xl border border-border/40" />
              )}
            </div>
          )}
          {z.notizen && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notizen</p>
              <p className="text-sm text-foreground">{z.notizen}</p>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Hinzugefügt: {new Date(z.createdAt).toLocaleDateString("de-DE")}
          </div>
          {isAdmin && (
            <div className="flex gap-2 pt-1">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                >
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
export default function AntiVektorZugang() {
  const { adminSession, selectedMarketId, hasPermission } = useAppStore();
  const canDelete = hasPermission("entries.delete");

  const [tab, setTab] = useState<Tab>("zugang");
  const [zugangsdaten, setZugangsdaten] = useState<Zugangsdaten>({
    id: null, tenantId: 1,
    websiteUrl: "https://www.av-ods.de",
    benutzername: "", passwort: "", rufnummer: "", notizen: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [savingZugang, setSavingZugang] = useState(false);
  const [savedZugang, setSavedZugang] = useState(false);

  const [zertifikate, setZertifikate] = useState<Zertifikat[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loadingZ, setLoadingZ] = useState(false);

  const loadZugangsdaten = useCallback(async () => {
    const url = selectedMarketId
      ? `${BASE}/anti-vektor/zugangsdaten?tenantId=1&marketId=${selectedMarketId}`
      : `${BASE}/anti-vektor/zugangsdaten?tenantId=1`;
    const res = await fetch(url);
    setZugangsdaten(await res.json());
  }, [selectedMarketId]);

  const loadZertifikate = useCallback(async () => {
    setLoadingZ(true);
    try {
      const url = selectedMarketId
        ? `${BASE}/anti-vektor/zertifikate?tenantId=1&marketId=${selectedMarketId}`
        : `${BASE}/anti-vektor/zertifikate?tenantId=1`;
      const res = await fetch(url);
      setZertifikate(await res.json());
    } finally { setLoadingZ(false); }
  }, [selectedMarketId]);

  useEffect(() => { loadZugangsdaten(); loadZertifikate(); }, [loadZugangsdaten, loadZertifikate]);

  const handleSaveZugang = async () => {
    setSavingZugang(true);
    try {
      const res = await fetch(`${BASE}/anti-vektor/zugangsdaten`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: 1, marketId: selectedMarketId || 1, ...zugangsdaten }),
      });
      setZugangsdaten(await res.json());
      setSavedZugang(true);
      setEditMode(false);
      setTimeout(() => setSavedZugang(false), 3000);
    } finally { setSavingZugang(false); }
  };

  const handleSaveZertifikat = async (fields: Partial<Zertifikat>, file?: File) => {
    const { fotoBase64, ...restFields } = fields;
    let res: Response;
    if (file) {
      res = await fetch(`${BASE}/anti-vektor/zertifikate`, {
        method: "POST",
        body: buildFileFormData({ tenantId: 1, marketId: selectedMarketId || 1, ...restFields }, file),
      });
    } else {
      res = await fetch(`${BASE}/anti-vektor/zertifikate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: 1, marketId: selectedMarketId || 1, ...fields }),
      });
    }
    const neu = await res.json();
    setZertifikate((p) => [...p, neu]);
    setShowForm(false);
  };

  const handleDeleteZertifikat = async (id: number) => {
    await fetch(`${BASE}/anti-vektor/zertifikate/${id}`, { method: "DELETE" });
    setZertifikate((p) => p.filter((z) => z.id !== id));
  };

  const expiredCount = zertifikate.filter((z) => z.gueltigBis && new Date(z.gueltigBis) < new Date()).length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4 pb-10">

        {/* Header */}
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/category/1" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Anti-Vektor Zugang</h1>
              <p className="text-sm text-white/70">Schädlingsbekämpfung — Zugangsdaten & Sachkundenachweise</p>
            </div>
          </div>
        </PageHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-2xl border border-border/30">
          <button
            onClick={() => setTab("zugang")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "zugang" ? "bg-white shadow-sm text-[#1a3a6b] border border-border/40" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            Zugangsdaten
          </button>
          <button
            onClick={() => setTab("zertifikate")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "zertifikate" ? "bg-white shadow-sm text-[#1a3a6b] border border-border/40" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="w-4 h-4" />
            Sachkundenachweise
            {expiredCount > 0 && (
              <span className="ml-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {expiredCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB: ZUGANGSDATEN */}
        {tab === "zugang" && (
          <>
            {/* Protokollierungs-Link */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <ExternalLink className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">Online-Protokollierung Schädlingsbekämpfung</p>
                  <h2 className="text-lg font-bold mb-3 text-[#1a3a6b]">AV-ODS Portal</h2>
                  <a
                    href={zugangsdaten.websiteUrl || "https://www.av-ods.de"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-blue-200 text-[#1a3a6b] rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {zugangsdaten.websiteUrl || "www.av-ods.de"} aufrufen
                  </a>
                </div>
              </div>
            </div>

            {/* Zugangsdaten Card */}
            <SCard title="Login-Daten" icon={<Shield className="w-4 h-4" />}>
              <div className="space-y-4">
                {/* Benutzername */}
                <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 rounded-xl">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28 shrink-0">Benutzername</span>
                  {editMode ? (
                    <input
                      value={zugangsdaten.benutzername} onChange={(e) => setZugangsdaten((p) => ({ ...p, benutzername: e.target.value }))}
                      placeholder="Benutzername"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                    />
                  ) : (
                    <span className="text-sm font-bold text-foreground">{zugangsdaten.benutzername || "—"}</span>
                  )}
                </div>

                {/* Passwort */}
                <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 rounded-xl">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28 shrink-0">Passwort</span>
                  {editMode ? (
                    <input
                      value={zugangsdaten.passwort} onChange={(e) => setZugangsdaten((p) => ({ ...p, passwort: e.target.value }))}
                      placeholder="Passwort"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                    />
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-mono font-bold text-foreground">
                        {showPassword ? (zugangsdaten.passwort || "—") : (zugangsdaten.passwort ? "••••••••••" : "—")}
                      </span>
                      {zugangsdaten.passwort && (
                        <button onClick={() => setShowPassword((p) => !p)} className="text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Rufnummer */}
                <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 rounded-xl">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28 shrink-0">Rufnummer</span>
                  {editMode ? (
                    <input
                      value={zugangsdaten.rufnummer} onChange={(e) => setZugangsdaten((p) => ({ ...p, rufnummer: e.target.value }))}
                      placeholder="Telefonnummer"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                    />
                  ) : (
                    <a href={`tel:${zugangsdaten.rufnummer}`} className={`text-sm font-bold ${zugangsdaten.rufnummer ? "text-[#1a3a6b] hover:underline" : "text-foreground"}`}>
                      {zugangsdaten.rufnummer || "—"}
                    </a>
                  )}
                </div>

                {/* Website URL (nur im Editiermodus) */}
                {editMode && (
                  <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 rounded-xl">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28 shrink-0">Website-URL</span>
                    <input
                      value={zugangsdaten.websiteUrl} onChange={(e) => setZugangsdaten((p) => ({ ...p, websiteUrl: e.target.value }))}
                      placeholder="https://www.av-ods.de"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                    />
                  </div>
                )}

                {/* Notizen */}
                {(zugangsdaten.notizen || editMode) && (
                  <div className="flex flex-col gap-2 px-4 py-3 bg-muted/30 rounded-xl">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notizen</span>
                    {editMode ? (
                      <textarea
                        value={zugangsdaten.notizen} onChange={(e) => setZugangsdaten((p) => ({ ...p, notizen: e.target.value }))}
                        placeholder="Weitere Hinweise..."
                        rows={2}
                        className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-foreground">{zugangsdaten.notizen}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Edit / Save Actions */}
              {canDelete && (
                <div className="flex gap-3 pt-2">
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a6b]/10 text-[#1a3a6b] rounded-xl text-sm font-bold hover:bg-[#1a3a6b]/15 transition-colors"
                    >
                      <Pencil className="w-4 h-4" /> Bearbeiten
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveZugang}
                        disabled={savingZugang}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          savedZugang ? "bg-green-600 text-white" : "bg-[#1a3a6b] text-white hover:bg-[#2d5aa0]"
                        }`}
                      >
                        {savingZugang ? <Loader2 className="w-4 h-4 animate-spin" /> : savedZugang ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {savingZugang ? "Speichert..." : savedZugang ? "Gespeichert" : "Speichern"}
                      </button>
                      <button
                        onClick={() => { setEditMode(false); loadZugangsdaten(); }}
                        className="px-4 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Abbrechen
                      </button>
                    </>
                  )}
                </div>
              )}
            </SCard>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm text-amber-800 font-medium">
                Diese Zugangsdaten sind vertraulich. Nur berechtigte Mitarbeiter mit Administratorrechten
                konnen diese Daten einsehen und bearbeiten.
              </p>
            </div>
          </>
        )}

        {/* TAB: ZERTIFIKATE */}
        {tab === "zertifikate" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {zertifikate.length === 0
                  ? "Noch keine Nachweise hinterlegt"
                  : `${zertifikate.length} Nachweis${zertifikate.length !== 1 ? "e" : ""} gespeichert`}
              </p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Nachweis hinzufügen
                </button>
              )}
            </div>

            {showForm && (
              <ZertifikatForm
                onSave={handleSaveZertifikat}
                onCancel={() => setShowForm(false)}
              />
            )}

            {loadingZ ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : zertifikate.length === 0 ? (
              <div className="text-center py-16">
                <Award className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Keine Sachkundenachweise hinterlegt</p>
                <p className="text-xs text-muted-foreground mt-1">Klicken Sie auf "Nachweis hinzufügen"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {zertifikate.map((z) => (
                  <ZertifikatKarte
                    key={z.id}
                    z={z}
                    isAdmin={canDelete}
                    onDelete={() => handleDeleteZertifikat(z.id)}
                  />
                ))}
              </div>
            )}

            {expiredCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-sm text-red-700 font-semibold">
                  {expiredCount} Nachweis{expiredCount !== 1 ? "e sind" : " ist"} abgelaufen.
                  Bitte erneuern Sie die entsprechenden Sachkundenachweise.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
