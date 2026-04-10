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
  HeartPulse, Pill, ShieldCheck, Flame, FileText,
  Plus, Loader2, Save, X, Camera, ChevronDown, ChevronUp,
  Trash2, AlertCircle, CheckCircle2, Clock, Pencil,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

type Kategorie = "gesundheitszeugnis" | "arzneimittel" | "ersthelfer" | "brandschutz" | "sonstige";

interface Bescheinigung {
  id: number;
  tenantId: number;
  kategorie: Kategorie;
  mitarbeiterName: string;
  bezeichnung: string;
  ausstellungsDatum: string;
  gueltigBis: string;
  dokumentBase64: string;
  notizen: string;
  createdAt: string;
}

// ===== TAB-KONFIGURATION =====
const TABS: {
  key: Kategorie;
  label: string;
  kurzLabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  bezeichnungPlaceholder: string;
  hinweis?: string;
}[] = [
  {
    key: "gesundheitszeugnis",
    label: "Gesundheitszeugnisse",
    kurzLabel: "Gesundheit",
    icon: <HeartPulse className="w-4 h-4" />,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    bezeichnungPlaceholder: "z.B. §43 IfSG Erstbelehrung",
    hinweis: "§43 IfSG: Erstbelehrung durch das Gesundheitsamt bei Einstellung, jährliche Folgebelehrungen durch den Arbeitgeber.",
  },
  {
    key: "arzneimittel",
    label: "Sachkundenachweise freiverkäufliche Arzneimittel",
    kurzLabel: "Arzneimittel",
    icon: <Pill className="w-4 h-4" />,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    bezeichnungPlaceholder: "z.B. Sachkunde freiverkäufliche Arzneimittel",
    hinweis: "§50 AMG: Sachkundenachweis erforderlich für den Verkauf freiverkäuflicher Arzneimittel im Einzelhandel.",
  },
  {
    key: "ersthelfer",
    label: "Ersthelferbescheinigungen",
    kurzLabel: "Ersthelfer",
    icon: <ShieldCheck className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    bezeichnungPlaceholder: "z.B. Erste-Hilfe-Kurs 9 UE",
    hinweis: "DGUV Vorschrift 1: Ersthelfer-Ausbildung ist alle 2 Jahre aufzufrischen. Anzahl abhängig von Betriebsgröße.",
  },
  {
    key: "brandschutz",
    label: "Brandschutzbescheinigungen",
    kurzLabel: "Brandschutz",
    icon: <Flame className="w-4 h-4" />,
    color: "text-[#1a3a6b]",
    bgColor: "bg-[#1a3a6b]/5",
    borderColor: "border-[#1a3a6b]/20",
    bezeichnungPlaceholder: "z.B. Brandschutzhelfer-Schulung",
    hinweis: "ASR A2.2: Brandschutzhelfer müssen regelmäßig geschult werden. Empfehlung: alle 3–5 Jahre.",
  },
  {
    key: "sonstige",
    label: "Sonstige Zeugnisse",
    kurzLabel: "Sonstige",
    icon: <FileText className="w-4 h-4" />,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    bezeichnungPlaceholder: "Bezeichnung des Zeugnisses / der Bescheinigung",
    hinweis: undefined,
  },
];

// ===== HILFSFUNKTIONEN =====
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

function getStatus(gueltigBis: string | null) {
  if (!gueltigBis) return "ok";
  const d = new Date(gueltigBis);
  if (d < new Date()) return "abgelaufen";
  if (d < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)) return "bald";
  return "ok";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "abgelaufen") return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1 whitespace-nowrap">
      <AlertCircle className="w-3 h-3" /> Abgelaufen
    </span>
  );
  if (status === "bald") return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1 whitespace-nowrap">
      <Clock className="w-3 h-3" /> Bald fällig
    </span>
  );
  return null;
}

// ===== FORMULAR =====
function BescheinigungForm({ kategorie, onSave, onCancel }: {
  kategorie: Kategorie;
  onSave: (fields: Partial<Bescheinigung>, file?: File) => Promise<void>;
  onCancel: () => void;
}) {
  const tab = TABS.find((t) => t.key === kategorie)!;
  const [mitarbeiterName, setMitarbeiterName] = useState("");
  const [bezeichnung, setBezeichnung] = useState("");
  const [ausstellungsDatum, setAusstellungsDatum] = useState("");
  const [gueltigBis, setGueltigBis] = useState("");
  const [dokument, setDokument] = useState("");
  const [dokFileName, setDokFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [notizen, setNotizen] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setProcessing(true);
    try {
      const isPdfFile = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdfFile) {
        setDokFileName(file.name);
        setDokument(await readFileAsDataURL(file));
        setPendingFile(file);
      } else {
        setDokFileName("");
        setDokument(await compressImage(file));
        setPendingFile(null);
      }
    } catch { /* ignore */ } finally { setProcessing(false); }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  useFilePaste(processFile);

  const isPdf = dokument.startsWith("data:application/pdf");

  const handleSubmit = async () => {
    if (!mitarbeiterName.trim() || processing) return;
    setSaving(true);
    try {
      const baseFields = { kategorie, mitarbeiterName: mitarbeiterName.trim(), bezeichnung: bezeichnung.trim(), ausstellungsDatum, gueltigBis, notizen: notizen.trim() };
      if (pendingFile) {
        await onSave(baseFields, pendingFile);
      } else {
        await onSave({ ...baseFields, dokumentBase64: dokument });
      }
    } finally { setSaving(false); }
  };

  return (
    <div
      className="bg-[#1a3a6b]/5 border border-[#1a3a6b]/20 rounded-2xl p-5 space-y-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <p className="text-sm font-bold text-[#1a3a6b]">Neuer Eintrag — {tab.label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MitarbeiterSuchInput
          value={mitarbeiterName}
          onChange={setMitarbeiterName}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bezeichnung</label>
          <input value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} placeholder={tab.bezeichnungPlaceholder}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ausstellungsdatum</label>
          <input type="date" value={ausstellungsDatum} onChange={(e) => setAusstellungsDatum(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gültig bis / Nächste Schulung</label>
          <input type="date" value={gueltigBis} onChange={(e) => setGueltigBis(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notizen</label>
        <input value={notizen} onChange={(e) => setNotizen(e.target.value)} placeholder="Optionale Anmerkungen"
          className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
      </div>

      {/* Dokument Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dokument (Foto, Screenshot oder PDF)</label>
        {dokument ? (
          isPdf ? (
            <PdfEmbed dataUrl={dokument} editable fileName={dokFileName} onClear={() => { setDokument(""); setDokFileName(""); setPendingFile(null); }} height="240px" />
          ) : (
            <div className="relative">
              <ClickableImage src={dokument} alt="Dokument" className="w-full max-h-56 object-contain rounded-xl border border-border/60" />
              <button onClick={() => setDokument("")} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`grid grid-cols-2 gap-2 p-1 rounded-xl transition-colors ${dragOver ? "bg-[#1a3a6b]/10 ring-2 ring-[#1a3a6b]/30" : ""}`}
          >
            <button onClick={() => fotoRef.current?.click()} disabled={processing}
              className="flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed border-[#1a3a6b]/25 rounded-xl text-[#1a3a6b] hover:bg-white/60 hover:border-[#1a3a6b]/40 transition-colors disabled:opacity-50">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              <span className="text-xs font-semibold text-center leading-tight">Foto /<br />Screenshot</span>
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={processing}
              className="flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed border-[#1a3a6b]/25 rounded-xl text-[#1a3a6b] hover:bg-white/60 hover:border-[#1a3a6b]/40 transition-colors disabled:opacity-50">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              <span className="text-xs font-semibold text-center leading-tight">PDF /<br />Datei</span>
            </button>
            {dragOver ? (
              <div className="col-span-2 text-center text-xs text-[#1a3a6b] font-semibold py-1">Datei hier ablegen</div>
            ) : (
              <p className="col-span-2 text-center text-[10px] text-muted-foreground">oder Strg+V zum Einfügen aus der Zwischenablage</p>
            )}
          </div>
        )}
        <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />
      </div>

      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={saving || processing || !mitarbeiterName.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-40 transition-colors">
          {saving || processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {processing ? "Dokument wird geladen…" : "Speichern"}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ===== EINTRAG KARTE =====
function BescheinigungKarte({ z, tab, onDelete, isAdmin, onUpdate }: {
  z: Bescheinigung; tab: typeof TABS[0]; onDelete: () => void; isAdmin: boolean;
  onUpdate: (fields: Partial<Bescheinigung>, file?: File) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editDok, setEditDok] = useState("");
  const [editPendingFile, setEditPendingFile] = useState<File | null>(null);
  const [editNotizen, setEditNotizen] = useState("");
  const [editBezeichnung, setEditBezeichnung] = useState("");
  const [editAusstellungsDatum, setEditAusstellungsDatum] = useState("");
  const [editGueltigBis, setEditGueltigBis] = useState("");
  const [editProcessing, setEditProcessing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);
  const editFotoRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setEditDok(z.dokumentBase64 || "");
    setEditPendingFile(null);
    setEditNotizen(z.notizen || "");
    setEditBezeichnung(z.bezeichnung || "");
    setEditAusstellungsDatum(z.ausstellungsDatum || "");
    setEditGueltigBis(z.gueltigBis || "");
    setEditMode(true);
  };

  const handleEditFile = async (file: File) => {
    setEditProcessing(true);
    try {
      const isPdfFile = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdfFile) {
        setEditDok(await readFileAsDataURL(file));
        setEditPendingFile(file);
      } else {
        setEditDok(await compressImage(file));
        setEditPendingFile(null);
      }
    } catch { /* ignore */ } finally { setEditProcessing(false); }
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      const payload: Partial<Bescheinigung> = {
        notizen: editNotizen, bezeichnung: editBezeichnung,
        ausstellungsDatum: editAusstellungsDatum, gueltigBis: editGueltigBis,
      };
      if (editPendingFile) {
        await onUpdate(payload, editPendingFile);
      } else if (editDok !== (z.dokumentBase64 || "")) {
        await onUpdate({ ...payload, dokumentBase64: editDok });
      } else {
        await onUpdate(payload);
      }
      setEditMode(false);
    } finally { setEditSaving(false); }
  };

  const status = getStatus(z.gueltigBis);
  const isPdf = z.dokumentBase64?.startsWith("data:application/pdf");

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden ${status === "abgelaufen" ? "border-red-200" : status === "bald" ? "border-amber-200" : "border-border/40"}`}>
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status === "abgelaufen" ? "bg-red-100" : status === "bald" ? "bg-amber-100" : tab.bgColor}`}>
          <span className={status === "abgelaufen" ? "text-red-500" : status === "bald" ? "text-amber-500" : tab.color}>{tab.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{z.mitarbeiterName}</p>
          {z.bezeichnung && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{z.bezeichnung}</p>}
          {z.gueltigBis && !z.bezeichnung && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Gültig bis {new Date(z.gueltigBis).toLocaleDateString("de-DE")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {z.gueltigBis && <StatusBadge status={status} />}
          {z.gueltigBis && status === "ok" && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3" /> {new Date(z.gueltigBis).toLocaleDateString("de-DE")}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4">
          {editMode ? (
            /* ---- EDIT MODUS ---- */
            <div
              className="space-y-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleEditFile(f); }}
            >
              <p className="text-sm font-bold text-[#1a3a6b]">Eintrag bearbeiten</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bezeichnung</label>
                  <input value={editBezeichnung} onChange={(e) => setEditBezeichnung(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ausstellungsdatum</label>
                  <input type="date" value={editAusstellungsDatum} onChange={(e) => setEditAusstellungsDatum(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gültig bis / Nächste Schulung</label>
                  <input type="date" value={editGueltigBis} onChange={(e) => setEditGueltigBis(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notizen</label>
                  <input value={editNotizen} onChange={(e) => setEditNotizen(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
              </div>
              {/* Dokument Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dokument (Foto, Screenshot oder PDF)</label>
                {editDok ? (
                  editDok.startsWith("data:application/pdf") ? (
                    <PdfEmbed dataUrl={editDok} editable onClear={() => setEditDok("")} height="240px" />
                  ) : (
                    <div className="relative">
                      <img src={editDok} alt="Dokument" className="w-full max-h-48 object-contain rounded-xl border border-border/40" />
                      <button onClick={() => setEditDok("")} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => editFotoRef.current?.click()} disabled={editProcessing}
                      className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-dashed border-[#1a3a6b]/25 rounded-xl text-[#1a3a6b] hover:bg-[#1a3a6b]/5 transition-colors disabled:opacity-50">
                      {editProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                      <span className="text-xs font-semibold">Foto / Screenshot</span>
                    </button>
                    <button onClick={() => editFileRef.current?.click()} disabled={editProcessing}
                      className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-dashed border-red-200 rounded-xl text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                      <FileText className="w-5 h-5" />
                      <span className="text-xs font-semibold">PDF-Datei</span>
                    </button>
                  </div>
                )}
                <input ref={editFotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleEditFile(f); }} />
                <input ref={editFileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleEditFile(f); }} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleEditSave} disabled={editSaving || editProcessing}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-40 transition-colors">
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Speichern
                </button>
                <button onClick={() => setEditMode(false)} className="px-4 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Abbrechen</button>
              </div>
            </div>
          ) : (
            /* ---- ANSICHT MODUS ---- */
            <>
              <div className="grid grid-cols-2 gap-3">
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
              {z.dokumentBase64 ? (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dokument</p>
                  {isPdf ? (
                    <PdfEmbed dataUrl={z.dokumentBase64} height="320px" />
                  ) : (
                    <ClickableImage src={z.dokumentBase64} alt="Dokument" className="w-full max-h-80 object-contain rounded-xl border border-border/40" />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-3">
                  <Camera className="w-4 h-4" /> Kein Dokument hinterlegt
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
                <div className="flex gap-2">
                  <button onClick={startEdit} className="flex items-center gap-2 px-3 py-2 bg-[#1a3a6b]/10 text-[#1a3a6b] border border-[#1a3a6b]/20 rounded-xl text-xs font-bold hover:bg-[#1a3a6b]/15 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Bearbeiten
                  </button>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ===== HAUPTSEITE =====
export default function Bescheinigungen() {
  const { adminSession, selectedMarketId, hasPermission } = useAppStore();
  const canDelete = hasPermission("entries.delete");

  const [aktiveTab, setAktiveTab] = useState<Kategorie>("gesundheitszeugnis");
  const [daten, setDaten] = useState<Record<Kategorie, Bescheinigung[]>>({
    gesundheitszeugnis: [], arzneimittel: [], ersthelfer: [], brandschutz: [], sonstige: [],
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadKategorie = useCallback(async (k: Kategorie) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/bescheinigungen?tenantId=1&kategorie=${k}${selectedMarketId ? `&marketId=${selectedMarketId}` : ""}`);
      const rows = await res.json();
      setDaten((p) => ({ ...p, [k]: rows }));
    } finally { setLoading(false); }
  }, [selectedMarketId]);

  useEffect(() => { loadKategorie(aktiveTab); }, [aktiveTab, loadKategorie]);

  const handleTabChange = (k: Kategorie) => {
    setAktiveTab(k);
    setShowForm(false);
  };

  const handleSave = async (fields: Partial<Bescheinigung>, file?: File) => {
    const { dokumentBase64, ...restFields } = fields;
    let res: Response;
    if (file) {
      res = await fetch(`${BASE}/bescheinigungen`, {
        method: "POST",
        body: buildFileFormData({ tenantId: 1, marketId: selectedMarketId || null, ...restFields }, file),
      });
    } else {
      res = await fetch(`${BASE}/bescheinigungen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: 1, marketId: selectedMarketId || null, ...fields }),
      });
    }
    const neu = await res.json();
    setDaten((p) => ({
      ...p,
      [aktiveTab]: [...p[aktiveTab], neu].sort((a, b) => a.mitarbeiterName.localeCompare(b.mitarbeiterName)),
    }));
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/bescheinigungen/${id}`, { method: "DELETE" });
    setDaten((p) => ({ ...p, [aktiveTab]: p[aktiveTab].filter((z) => z.id !== id) }));
  };

  const handleUpdate = async (id: number, fields: Partial<Bescheinigung>, file?: File) => {
    const { dokumentBase64, ...restFields } = fields;
    let res: Response;
    if (file) {
      res = await fetch(`${BASE}/bescheinigungen/${id}`, {
        method: "PUT",
        body: buildFileFormData(restFields as Record<string, string | number | null | undefined>, file),
      });
    } else {
      res = await fetch(`${BASE}/bescheinigungen/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
    }
    const updated = await res.json();
    setDaten((p) => ({ ...p, [aktiveTab]: p[aktiveTab].map((z) => z.id === id ? { ...z, ...updated } : z) }));
  };

  const tab = TABS.find((t) => t.key === aktiveTab)!;
  const liste = daten[aktiveTab];
  const abgelaufen = liste.filter((z) => getStatus(z.gueltigBis) === "abgelaufen").length;
  const bald = liste.filter((z) => getStatus(z.gueltigBis) === "bald").length;

  // Gesamte Warnung über alle Kategorien
  const gesamtAbgelaufen = Object.values(daten).flat().filter((z) => getStatus(z.gueltigBis) === "abgelaufen").length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4 pb-10">

        {/* Header */}
        <PageHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/category/1" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="bg-white/15 rounded-xl p-2 shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Bescheinigungen & Nachweise</h1>
                <p className="text-sm text-white/75">Alle mitarbeiterbezogenen Zertifikate und Nachweise</p>
              </div>
            </div>
            {!showForm && (
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/15 text-white rounded-xl text-sm font-bold hover:bg-white/25 transition-colors">
                <Plus className="w-4 h-4" /> Hinzufügen
              </button>
            )}
          </div>
        </PageHeader>

        {/* 5 Kategorie-Tabs (2 Reihen auf Mobil, 1 Reihe Desktop) */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-muted/40 rounded-2xl border border-border/30">
          {TABS.map((t) => {
            const tabDaten = daten[t.key];
            const warn = tabDaten.filter((z) => getStatus(z.gueltigBis) === "abgelaufen").length;
            const isActive = aktiveTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                  isActive ? "bg-white shadow-sm border border-border/40 text-[#1a3a6b]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={isActive ? "text-[#1a3a6b]" : ""}>{t.icon}</span>
                <span className="text-center leading-tight">{t.kurzLabel}</span>
                {warn > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {warn}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Warnkacheln für aktive Kategorie */}
        {(abgelaufen > 0 || bald > 0) && (
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
          <BescheinigungForm
            kategorie={aktiveTab}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : liste.length === 0 ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full text-center py-12 rounded-2xl border-2 border-dashed border-[#1a3a6b]/20 bg-[#1a3a6b]/3 hover:bg-[#1a3a6b]/8 hover:border-[#1a3a6b]/30 transition-colors group"
          >
            <div className="w-12 h-12 bg-[#1a3a6b]/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#1a3a6b]/15 transition-colors">
              <Plus className="w-5 h-5 text-[#1a3a6b]" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Keine {tab.label} hinterlegt</p>
            <p className="text-xs text-[#1a3a6b] font-semibold mt-1">Tippen zum Hinzufügen</p>
          </button>
        ) : (
          <div className="space-y-3">
            {liste.map((z) => (
              <BescheinigungKarte
                key={z.id}
                z={z}
                tab={tab}
                isAdmin={canDelete}
                onDelete={() => handleDelete(z.id)}
                onUpdate={(fields, file) => handleUpdate(z.id, fields, file)}
              />
            ))}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#1a3a6b]/20 rounded-2xl text-sm font-semibold text-[#1a3a6b] hover:bg-[#1a3a6b]/5 hover:border-[#1a3a6b]/30 transition-colors"
              >
                <Plus className="w-4 h-4" /> Weiteren Eintrag hinzufügen
              </button>
            )}
          </div>
        )}

        {/* Gesetzlicher Hinweis */}
        {tab.hinweis && (
          <div className="bg-[#1a3a6b]/5 border border-[#1a3a6b]/15 rounded-2xl p-4">
            <p className="text-xs font-medium leading-relaxed text-[#1a3a6b]">
              <strong>Hinweis:</strong> {tab.hinweis}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
