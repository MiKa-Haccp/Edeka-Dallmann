import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import {
  ClipboardCheck, ShieldCheck, Leaf, FileText,
  Plus, Loader2, Save, X, Camera, ChevronDown, ChevronUp,
  Trash2, ExternalLink, AlertCircle, CheckCircle2, Clock,
  Building2, CalendarCheck, ThumbsUp, ThumbsDown, AlertTriangle,
  ChevronLeft, ChevronRight, Upload, Pencil, Trash, KeyRound,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

type Kategorie = "lebensmittelkontrolle" | "tuev" | "bio" | "sonstige";
type Ergebnis = "bestanden" | "bestanden_mit_auflagen" | "nicht_bestanden" | "";

interface Kontrollbericht {
  id: number;
  tenantId: number;
  kategorie: Kategorie;
  bezeichnung: string;
  kontrollstelle: string;
  kontrollDatum: string;
  gueltigBis: string;
  ergebnis: Ergebnis;
  dokumentBase64: string;
  notizen: string;
  createdAt: string;
}

interface Massnahme {
  nr: string;
  massnahme: string;
  durchgefuehrtVon: string;
}

interface TuevJahresbericht {
  id?: number;
  tenantId?: number;
  year: number;
  zertifikateDokument?: string;
  zertifikateNotizen?: string;
  pruefungenDokument?: string;
  pruefungenNotizen?: string;
  aktionsplanFoto?: string;
  aktionsplanMassnahmen?: string;
  nachbesserungName?: string;
  nachbesserungDatum?: string;
  nachbesserungUnterschrift?: string;
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
  kontrollstelleBeispiel: string;
  bezeichnungPlaceholder: string;
  hinweis?: string;
}[] = [
  {
    key: "lebensmittelkontrolle",
    label: "Lebensmittelkontrolle",
    kurzLabel: "LM-Kontrolle",
    icon: <ClipboardCheck className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    kontrollstelleBeispiel: "z.B. Veterinäramt / Lebensmittelkontrolle",
    bezeichnungPlaceholder: "z.B. Jahresbegehung, Nachkontrolle",
    hinweis: "LFGB / VO (EG) 882/2004: Regelmäßige amtliche Lebensmittelkontrollen durch die zuständige Behörde. Berichte aufbewahren.",
  },
  {
    key: "tuev",
    label: "TÜV",
    kurzLabel: "TÜV",
    icon: <ShieldCheck className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    kontrollstelleBeispiel: "z.B. TÜV Süd / TÜV Nord / DEKRA",
    bezeichnungPlaceholder: "z.B. ISO 22000, HACCP-Zertifizierung",
    hinweis: "TÜV-Zertifikate belegen die Konformität mit Qualitäts- und Sicherheitsstandards. Ablaufdatum im Blick behalten.",
  },
  {
    key: "bio",
    label: "Bio-Kontrollberichte",
    kurzLabel: "Bio",
    icon: <Leaf className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    kontrollstelleBeispiel: "z.B. Bioland, Naturland, DE-ÖKO-001",
    bezeichnungPlaceholder: "z.B. Jahreskontrolle Bio-Sortiment",
    hinweis: "EU-Bio-Verordnung (EG) 834/2007: Jährliche Kontrolle durch zugelassene Kontrollstellen erforderlich. Zertifikat sichern.",
  },
  {
    key: "sonstige",
    label: "Sonstige Kontrollen",
    kurzLabel: "Sonstige",
    icon: <FileText className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    kontrollstelleBeispiel: "z.B. Interne Revision, Brandschutzbehörde",
    bezeichnungPlaceholder: "Bezeichnung des Berichts / der Prüfung",
    hinweis: undefined,
  },
];

const ERGEBNIS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  bestanden: { label: "Bestanden", icon: <ThumbsUp className="w-3 h-3" />, color: "text-green-700", bg: "bg-green-100" },
  bestanden_mit_auflagen: { label: "Mit Auflagen", icon: <AlertTriangle className="w-3 h-3" />, color: "text-amber-700", bg: "bg-amber-100" },
  nicht_bestanden: { label: "Nicht bestanden", icon: <ThumbsDown className="w-3 h-3" />, color: "text-red-700", bg: "bg-red-100" },
};

// ===== HILFSFUNKTIONEN =====
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

// ===== JAHRWAHL =====
function JahrWahl({ year, onChange }: { year: number; onChange: (y: number) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white/15 rounded-xl px-1 py-1 border border-white/20">
      <button
        onClick={() => onChange(year - 1)}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="font-bold text-sm text-white px-2 min-w-[3rem] text-center">{year}</span>
      <button
        onClick={() => onChange(year + 1)}
        disabled={year >= new Date().getFullYear()}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ===== DOKUMENT UPLOAD CARD =====
function DokumentCard({
  label, dokument, notizen, onDokument, onNotizen, onClear, notizenPlaceholder, disabled,
}: {
  label: string;
  dokument: string;
  notizen: string;
  onDokument: (v: string) => void;
  onNotizen: (v: string) => void;
  onClear: () => void;
  notizenPlaceholder: string;
  disabled?: boolean;
}) {
  const [processing, setProcessing] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isPdf = dokument.startsWith("data:application/pdf");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = (ev) => onDokument(ev.target!.result as string);
        reader.readAsDataURL(file);
      } else {
        onDokument(await compressImage(file));
      }
    } finally { setProcessing(false); e.target.value = ""; }
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="bg-[#1a3a6b]/5 border-b border-border/40 px-5 py-3">
        <h3 className="font-semibold text-sm text-[#1a3a6b]">{label}</h3>
      </div>
      <div className="p-5 space-y-4">
        {dokument ? (
          <div className="relative">
            {isPdf ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-700">PDF-Dokument</p>
                  <a href={dokument} target="_blank" rel="noopener noreferrer" className="text-xs text-red-500 flex items-center gap-1 hover:underline">
                    <ExternalLink className="w-3 h-3" /> Öffnen
                  </a>
                </div>
                {!disabled && (
                  <button onClick={onClear} className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <img src={dokument} alt={label} className="w-full max-h-48 object-contain rounded-xl border border-border/40" />
                {!disabled && (
                  <button onClick={onClear} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          !disabled && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => fotoRef.current?.click()} disabled={processing}
                className="flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed border-[#1a3a6b]/25 rounded-xl text-[#1a3a6b] hover:bg-[#1a3a6b]/5 hover:border-[#1a3a6b]/40 transition-colors disabled:opacity-50">
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                <span className="text-xs font-semibold text-center leading-tight">Foto /<br />Screenshot</span>
              </button>
              <button onClick={() => fileRef.current?.click()} disabled={processing}
                className="flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed border-red-200 rounded-xl text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50">
                <Upload className="w-5 h-5" />
                <span className="text-xs font-semibold text-center leading-tight">PDF-<br />Datei</span>
              </button>
            </div>
          )
        )}
        <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Notizen</label>
          <textarea
            value={notizen}
            onChange={(e) => onNotizen(e.target.value)}
            placeholder={notizenPlaceholder}
            rows={2}
            disabled={disabled}
            className="w-full px-3 py-2 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all resize-none disabled:bg-muted/30 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}

// ===== AKTIONSPLAN CARD =====
function AktionsplanCard({
  foto, massnahmen, onFoto, onMassnahmen, onFotoClear, disabled,
}: {
  foto: string;
  massnahmen: Massnahme[];
  onFoto: (v: string) => void;
  onMassnahmen: (v: Massnahme[]) => void;
  onFotoClear: () => void;
  disabled?: boolean;
}) {
  const [processing, setProcessing] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try { onFoto(await compressImage(file)); }
    finally { setProcessing(false); e.target.value = ""; }
  };

  const addRow = () => {
    const last = massnahmen[massnahmen.length - 1];
    const lastNr = last ? last.nr : "1.0";
    const parts = lastNr.split(".");
    const next = `${parts[0]}.${Number(parts[1] || 0) + 1}`;
    onMassnahmen([...massnahmen, { nr: next, massnahme: "", durchgefuehrtVon: "" }]);
  };

  const updateRow = (i: number, field: keyof Massnahme, value: string) => {
    const updated = massnahmen.map((m, idx) => idx === i ? { ...m, [field]: value } : m);
    onMassnahmen(updated);
  };

  const removeRow = (i: number) => {
    onMassnahmen(massnahmen.filter((_, idx) => idx !== i));
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="bg-[#1a3a6b]/5 border-b border-border/40 px-5 py-3">
        <h3 className="font-semibold text-sm text-[#1a3a6b]">Aktionsplan</h3>
      </div>
      <div className="p-5 space-y-4">
        {/* Foto */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Kontrollbericht (Foto)</label>
          {foto ? (
            <div className="relative">
              <img src={foto} alt="Aktionsplan" className="w-full max-h-48 object-contain rounded-xl border border-border/40" />
              {!disabled && (
                <button onClick={onFotoClear} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            !disabled && (
              <button onClick={() => fotoRef.current?.click()} disabled={processing}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-[#1a3a6b]/25 rounded-xl text-[#1a3a6b] hover:bg-[#1a3a6b]/5 hover:border-[#1a3a6b]/40 transition-colors disabled:opacity-50">
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                <span className="text-sm font-semibold">Foto des Kontrollberichts</span>
              </button>
            )
          )}
          <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        {/* Maßnahmen-Tabelle */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Erforderliche Nachbesserungen</label>
          {massnahmen.length === 0 && !disabled && (
            <p className="text-xs text-muted-foreground mb-2">Noch keine Maßnahmen eingetragen.</p>
          )}
          {massnahmen.length > 0 && (
            <div className="space-y-2 mb-3">
              {/* Header */}
              <div className="grid grid-cols-[3rem_1fr_1fr_2rem] gap-2 px-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nr.</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Maßnahme</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Durchgeführt von</span>
                <span />
              </div>
              {massnahmen.map((m, i) => (
                <div key={i} className="grid grid-cols-[3rem_1fr_1fr_2rem] gap-2 items-center bg-muted/20 rounded-xl px-2 py-2">
                  <input
                    value={m.nr}
                    onChange={(e) => updateRow(i, "nr", e.target.value)}
                    disabled={disabled}
                    className="text-xs font-bold text-center border border-border/60 rounded-lg px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a3a6b]/20 disabled:bg-transparent disabled:border-transparent"
                    placeholder="1.1"
                  />
                  <input
                    value={m.massnahme}
                    onChange={(e) => updateRow(i, "massnahme", e.target.value)}
                    disabled={disabled}
                    className="text-sm border border-border/60 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a3a6b]/20 w-full disabled:bg-transparent disabled:border-transparent"
                    placeholder="Beschreibung der Maßnahme"
                  />
                  <input
                    value={m.durchgefuehrtVon}
                    onChange={(e) => updateRow(i, "durchgefuehrtVon", e.target.value)}
                    disabled={disabled}
                    className="text-sm border border-border/60 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a3a6b]/20 w-full disabled:bg-transparent disabled:border-transparent"
                    placeholder="Name"
                  />
                  {!disabled && (
                    <button onClick={() => removeRow(i)} className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {!disabled && (
            <button onClick={addRow}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#1a3a6b]/30 rounded-xl text-xs font-semibold text-[#1a3a6b] hover:bg-[#1a3a6b]/5 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Maßnahme hinzufügen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== TÜV PANEL =====
function TuevPanel({ year }: { year: number }) {
  const { selectedMarketId } = useAppStore();
  const [daten, setDaten] = useState<TuevJahresbericht | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [zertDok, setZertDok] = useState("");
  const [zertNotizen, setZertNotizen] = useState("");
  const [pruefDok, setPruefDok] = useState("");
  const [pruefNotizen, setPruefNotizen] = useState("");
  const [aktFoto, setAktFoto] = useState("");
  const [massnahmen, setMassnahmen] = useState<Massnahme[]>([]);
  const [nachbesserungName, setNachbesserungName] = useState("");
  const [nachbesserungDatum, setNachbesserungDatum] = useState("");
  const [nachbesserungUnterschrift, setNachbesserungUnterschrift] = useState("");
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const mktParam = selectedMarketId ? `&marketId=${selectedMarketId}` : "";
      const res = await fetch(`${BASE}/tuev-jahresbericht?tenantId=1&year=${year}${mktParam}`);
      const data = await res.json();
      setDaten(data);
      if (data) {
        setZertDok(data.zertifikateDokument || "");
        setZertNotizen(data.zertifikateNotizen || "");
        setPruefDok(data.pruefungenDokument || "");
        setPruefNotizen(data.pruefungenNotizen || "");
        setAktFoto(data.aktionsplanFoto || "");
        setNachbesserungName(data.nachbesserungName || "");
        setNachbesserungDatum(data.nachbesserungDatum || "");
        setNachbesserungUnterschrift(data.nachbesserungUnterschrift || "");
        try {
          setMassnahmen(data.aktionsplanMassnahmen ? JSON.parse(data.aktionsplanMassnahmen) : []);
        } catch { setMassnahmen([]); }
      } else {
        setZertDok(""); setZertNotizen("");
        setPruefDok(""); setPruefNotizen("");
        setAktFoto(""); setMassnahmen([]);
        setNachbesserungName(""); setNachbesserungDatum(""); setNachbesserungUnterschrift("");
      }
    } finally { setLoading(false); }
  }, [year, selectedMarketId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${BASE}/tuev-jahresbericht`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: 1, marketId: selectedMarketId || 1, year,
          zertifikateDokument: zertDok,
          zertifikateNotizen: zertNotizen,
          pruefungenDokument: pruefDok,
          pruefungenNotizen: pruefNotizen,
          aktionsplanFoto: aktFoto,
          aktionsplanMassnahmen: JSON.stringify(massnahmen),
          nachbesserungName,
          nachbesserungDatum,
          nachbesserungUnterschrift,
        }),
      });
      await loadData();
      setEditMode(false);
    } finally { setSaving(false); }
  };

  const handlePinSign = async () => {
    if (pinValue.length !== 4) return;
    setPinLoading(true);
    setPinError("");
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue, tenantId: 1 }),
      });
      if (res.status === 409) { setPinError("PIN mehrfach vergeben – bitte Admin kontaktieren."); return; }
      const data = await res.json();
      if (!data.valid) { setPinError("Ungültige PIN. Kein Mitarbeiter gefunden."); return; }
      setNachbesserungUnterschrift(data.userName || "");
      setPinDialogOpen(false);
      setPinValue("");
      setPinError("");
    } finally { setPinLoading(false); }
  };

  const handleEdit = () => setEditMode(true);
  const handleAbbrechen = () => {
    loadData();
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isEmpty = !daten && !editMode;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isEmpty ? `Noch kein TÜV-Bericht für ${year}` : `TÜV-Jahresbericht ${year}`}
        </p>
        <div className="flex gap-2">
          {!editMode ? (
            <button onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] transition-colors">
              <Pencil className="w-4 h-4" /> {daten ? "Bearbeiten" : "Eintragen"}
            </button>
          ) : (
            <>
              <button onClick={handleAbbrechen}
                className="px-4 py-2 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Abbrechen
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-40 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Speichern
              </button>
            </>
          )}
        </div>
      </div>

      {(daten || editMode) ? (
        <div className="space-y-4">
          <DokumentCard
            label="TÜV Zertifikate"
            dokument={zertDok}
            notizen={zertNotizen}
            onDokument={setZertDok}
            onNotizen={setZertNotizen}
            onClear={() => setZertDok("")}
            notizenPlaceholder="Zertifikat-Nummer, Gültigkeitsdatum, Ausstellungsorganisation..."
            disabled={!editMode}
          />
          <DokumentCard
            label="TÜV Prüfungen"
            dokument={pruefDok}
            notizen={pruefNotizen}
            onDokument={setPruefDok}
            onNotizen={setPruefNotizen}
            onClear={() => setPruefDok("")}
            notizenPlaceholder="Prüfbereich, Ergebnis, Prüfer, Datum der nächsten Prüfung..."
            disabled={!editMode}
          />
          <AktionsplanCard
            foto={aktFoto}
            massnahmen={massnahmen}
            onFoto={setAktFoto}
            onMassnahmen={setMassnahmen}
            onFotoClear={() => setAktFoto("")}
            disabled={!editMode}
          />

          {/* Bestätigung Betriebsleitung */}
          {(massnahmen.length > 0 || aktFoto) && (
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              <div className="bg-[#1a3a6b] text-white px-5 py-3">
                <h3 className="font-bold text-sm">Bestätigung der Maßnahmenumsetzung – Betriebsleitung</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground mb-4">
                  Die Betriebsleitung bestätigt, dass alle erforderlichen Nachbesserungen durchgeführt und geprüft wurden.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Name (Betriebsleitung)</label>
                    <input
                      type="text"
                      value={nachbesserungName}
                      onChange={(e) => setNachbesserungName(e.target.value)}
                      disabled={!editMode}
                      placeholder="Vor- und Nachname"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-transparent disabled:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Datum der Prüfung</label>
                    <input
                      type="date"
                      value={nachbesserungDatum}
                      onChange={(e) => setNachbesserungDatum(e.target.value)}
                      disabled={!editMode}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-transparent disabled:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Unterschrift (PIN)</label>
                  {nachbesserungUnterschrift ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-sm font-medium flex-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Unterschrieben von: <span className="font-bold ml-1">{nachbesserungUnterschrift}</span>
                      </div>
                      {editMode && (
                        <button
                          type="button"
                          onClick={() => setNachbesserungUnterschrift("")}
                          className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-secondary transition-colors"
                          title="Unterschrift zurücksetzen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : editMode ? (
                    <button
                      type="button"
                      onClick={() => setPinDialogOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[#1a3a6b]/30 text-[#1a3a6b] rounded-xl text-sm font-medium hover:bg-[#1a3a6b]/5 transition-colors w-full justify-center"
                    >
                      <KeyRound className="w-4 h-4" />
                      Mit PIN unterschreiben
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Noch keine Unterschrift</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50">
          <ShieldCheck className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Noch kein TÜV-Bericht für {year}</p>
          <p className="text-xs text-muted-foreground mt-1">Klicken Sie auf "Eintragen" um zu beginnen</p>
        </div>
      )}

      {/* PIN-Dialog */}
      {pinDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#1a3a6b]/10 rounded-xl flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-[#1a3a6b]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Bestätigung Betriebsleitung</h3>
                <p className="text-xs text-muted-foreground">4-stellige PIN eingeben</p>
              </div>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={pinValue}
              onChange={(e) => { setPinValue(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handlePinSign(); }}
              placeholder="• • • •"
              className="w-full border border-border rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 focus:border-[#1a3a6b] mb-3"
            />
            {pinError && (
              <p className="text-xs text-red-600 text-center mb-3 flex items-center justify-center gap-1">
                <X className="w-3.5 h-3.5" /> {pinError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setPinDialogOpen(false); setPinValue(""); setPinError(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handlePinSign}
                disabled={pinValue.length !== 4 || pinLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {pinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== FORMULAR (für non-TÜV Tabs) =====
function KontrollberichtForm({ kategorie, year, onSave, onCancel }: {
  kategorie: Kategorie;
  year: number;
  onSave: (fields: Partial<Kontrollbericht>) => Promise<void>;
  onCancel: () => void;
}) {
  const tab = TABS.find((t) => t.key === kategorie)!;
  const [bezeichnung, setBezeichnung] = useState("");
  const [kontrollstelle, setKontrollstelle] = useState("");
  const [kontrollDatum, setKontrollDatum] = useState(`${year}-01-01`);
  const [gueltigBis, setGueltigBis] = useState("");
  const [ergebnis, setErgebnis] = useState<Ergebnis>("");
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
    if (!bezeichnung.trim()) return;
    setSaving(true);
    try {
      await onSave({
        kategorie,
        bezeichnung: bezeichnung.trim(),
        kontrollstelle: kontrollstelle.trim(),
        kontrollDatum,
        gueltigBis,
        ergebnis,
        dokumentBase64: dokument,
        notizen: notizen.trim(),
      });
    } finally { setSaving(false); }
  };

  return (
    <div className={`${tab.bgColor} border ${tab.borderColor} rounded-2xl p-5 space-y-4`}>
      <p className={`text-sm font-bold ${tab.color}`}>Neuer Bericht — {tab.label} {year}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bezeichnung / Titel *</label>
          <input value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} placeholder={tab.bezeichnungPlaceholder}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kontrollstelle / Prüforganisation</label>
          <input value={kontrollstelle} onChange={(e) => setKontrollstelle(e.target.value)} placeholder={tab.kontrollstelleBeispiel}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ergebnis</label>
          <select value={ergebnis} onChange={(e) => setErgebnis(e.target.value as Ergebnis)}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all">
            <option value="">-- kein Ergebnis --</option>
            <option value="bestanden">Bestanden</option>
            <option value="bestanden_mit_auflagen">Bestanden mit Auflagen</option>
            <option value="nicht_bestanden">Nicht bestanden</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kontrolldatum</label>
          <input type="date" value={kontrollDatum} onChange={(e) => setKontrollDatum(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gültig bis / Nächste Kontrolle</label>
          <input type="date" value={gueltigBis} onChange={(e) => setGueltigBis(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notizen / Auflagen / Maßnahmen</label>
        <textarea value={notizen} onChange={(e) => setNotizen(e.target.value)} rows={3}
          placeholder="Festgestellte Mängel, Auflagen, eingeleitete Maßnahmen..."
          className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all resize-none" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dokument (Foto, Screenshot oder PDF)</label>
        {dokument ? (
          isPdf ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1"><p className="text-sm font-bold text-red-700">PDF-Dokument</p></div>
              <button onClick={() => setDokument("")} className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <img src={dokument} alt="Dokument" className="w-full max-h-56 object-contain rounded-xl border border-border/60" />
              <button onClick={() => setDokument("")} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => fotoRef.current?.click()} disabled={processing}
              className="flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed border-[#1a3a6b]/25 rounded-xl text-[#1a3a6b] hover:bg-white/60 hover:border-[#1a3a6b]/40 transition-colors disabled:opacity-50">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              <span className="text-xs font-semibold text-center leading-tight">Foto /<br />Screenshot</span>
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={processing}
              className="flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed border-red-200 rounded-xl text-red-600 hover:bg-white/60 hover:border-red-300 transition-colors disabled:opacity-50">
              <FileText className="w-5 h-5" />
              <span className="text-xs font-semibold text-center leading-tight">PDF-<br />Datei</span>
            </button>
          </div>
        )}
        <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />
      </div>

      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={saving || !bezeichnung.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-40 transition-colors">
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

// ===== BERICHT KARTE =====
function BerichtKarte({ b, tab, onDelete, isAdmin }: {
  b: Kontrollbericht; tab: typeof TABS[0]; onDelete: () => void; isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = getStatus(b.gueltigBis);
  const isPdf = b.dokumentBase64?.startsWith("data:application/pdf");
  const ergebnisConfig = b.ergebnis ? ERGEBNIS_CONFIG[b.ergebnis] : null;

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden ${
      b.ergebnis === "nicht_bestanden" ? "border-red-300" :
      b.ergebnis === "bestanden_mit_auflagen" ? "border-amber-300" :
      status === "abgelaufen" ? "border-red-200" :
      status === "bald" ? "border-amber-200" :
      "border-border/40"
    }`}>
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tab.bgColor}`}>
          <span className={tab.color}>{tab.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground line-clamp-1">{b.bezeichnung}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
            {b.kontrollstelle && <><Building2 className="w-3 h-3" />{b.kontrollstelle}</>}
            {b.kontrollDatum && <><CalendarCheck className="w-3 h-3 ml-1" />{new Date(b.kontrollDatum).toLocaleDateString("de-DE")}</>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {ergebnisConfig && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ergebnisConfig.bg} ${ergebnisConfig.color} flex items-center gap-1 whitespace-nowrap`}>
              {ergebnisConfig.icon} {ergebnisConfig.label}
            </span>
          )}
          {b.gueltigBis && status === "abgelaufen" && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1 whitespace-nowrap">
              <AlertCircle className="w-3 h-3" /> Abgelaufen
            </span>
          )}
          {b.gueltigBis && status === "bald" && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3 h-3" /> Bald fällig
            </span>
          )}
          {b.gueltigBis && status === "ok" && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3" /> {new Date(b.gueltigBis).toLocaleDateString("de-DE")}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/30">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
            {b.kontrollstelle && (
              <div className="bg-muted/30 rounded-xl px-3 py-2">
                <p className="text-xs text-muted-foreground">Kontrollstelle</p>
                <p className="text-sm font-bold">{b.kontrollstelle}</p>
              </div>
            )}
            {b.kontrollDatum && (
              <div className="bg-muted/30 rounded-xl px-3 py-2">
                <p className="text-xs text-muted-foreground">Kontrolldatum</p>
                <p className="text-sm font-bold">{new Date(b.kontrollDatum).toLocaleDateString("de-DE")}</p>
              </div>
            )}
            {b.gueltigBis && (
              <div className={`rounded-xl px-3 py-2 ${status === "abgelaufen" ? "bg-red-50" : status === "bald" ? "bg-amber-50" : "bg-green-50"}`}>
                <p className={`text-xs ${status === "abgelaufen" ? "text-red-500" : status === "bald" ? "text-amber-600" : "text-green-600"}`}>
                  Nächste Kontrolle
                </p>
                <p className={`text-sm font-bold ${status === "abgelaufen" ? "text-red-700" : status === "bald" ? "text-amber-700" : "text-green-700"}`}>
                  {new Date(b.gueltigBis).toLocaleDateString("de-DE")}
                </p>
              </div>
            )}
            {ergebnisConfig && (
              <div className={`rounded-xl px-3 py-2 ${ergebnisConfig.bg}`}>
                <p className={`text-xs ${ergebnisConfig.color}`}>Ergebnis</p>
                <p className={`text-sm font-bold flex items-center gap-1 ${ergebnisConfig.color}`}>
                  {ergebnisConfig.icon} {ergebnisConfig.label}
                </p>
              </div>
            )}
          </div>

          {b.notizen && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notizen / Auflagen</p>
              <p className="text-sm text-foreground whitespace-pre-line">{b.notizen}</p>
            </div>
          )}

          {b.dokumentBase64 ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dokument</p>
              {isPdf ? (
                <a href={b.dokumentBase64} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div><p className="text-sm font-bold text-red-700">PDF anzeigen</p><p className="text-xs text-red-500">Klicken zum Öffnen</p></div>
                  <ExternalLink className="w-4 h-4 text-red-400 ml-auto" />
                </a>
              ) : (
                <img src={b.dokumentBase64} alt="Dokument" className="w-full max-h-80 object-contain rounded-xl border border-border/40" />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-3">
              <Camera className="w-4 h-4" /> Kein Dokument hinterlegt
            </div>
          )}

          <p className="text-xs text-muted-foreground">Hinzugefügt: {new Date(b.createdAt).toLocaleDateString("de-DE")}</p>

          {isAdmin && (
            <div className="flex gap-2">
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
export default function Kontrollberichte() {
  const { adminSession, selectedMarketId, hasPermission } = useAppStore();
  const canDelete = hasPermission("entries.delete");

  const currentYear = new Date().getFullYear();
  const [aktiveTab, setAktiveTab] = useState<Kategorie>("lebensmittelkontrolle");
  const [year, setYear] = useState(currentYear);
  const [daten, setDaten] = useState<Record<Kategorie, Kontrollbericht[]>>({
    lebensmittelkontrolle: [], tuev: [], bio: [], sonstige: [],
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadKategorie = useCallback(async (k: Kategorie) => {
    if (k === "tuev") return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/kontrollberichte?tenantId=1&kategorie=${k}${selectedMarketId ? `&marketId=${selectedMarketId}` : ""}`);
      const rows: Kontrollbericht[] = await res.json();
      setDaten((p) => ({ ...p, [k]: rows }));
    } finally { setLoading(false); }
  }, [selectedMarketId]);

  useEffect(() => { loadKategorie(aktiveTab); }, [aktiveTab, loadKategorie]);

  const handleTabChange = (k: Kategorie) => {
    setAktiveTab(k);
    setShowForm(false);
  };

  const handleYearChange = (y: number) => {
    setYear(y);
    setShowForm(false);
  };

  const handleSave = async (fields: Partial<Kontrollbericht>) => {
    const res = await fetch(`${BASE}/kontrollberichte`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: 1, marketId: selectedMarketId || null, ...fields }),
    });
    const neu = await res.json();
    setDaten((p) => ({
      ...p,
      [aktiveTab]: [...p[aktiveTab], neu].sort((a, b) =>
        (b.kontrollDatum || "").localeCompare(a.kontrollDatum || "")
      ),
    }));
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/kontrollberichte/${id}`, { method: "DELETE" });
    setDaten((p) => ({ ...p, [aktiveTab]: p[aktiveTab].filter((b) => b.id !== id) }));
  };

  const tab = TABS.find((t) => t.key === aktiveTab)!;

  // Für nicht-TÜV: nach Jahr filtern
  const liste = aktiveTab !== "tuev"
    ? daten[aktiveTab].filter((b) => b.kontrollDatum?.startsWith(String(year)))
    : [];

  const abgelaufen = liste.filter((b) => getStatus(b.gueltigBis) === "abgelaufen").length;
  const bald = liste.filter((b) => getStatus(b.gueltigBis) === "bald").length;
  const nichtBestanden = liste.filter((b) => b.ergebnis === "nicht_bestanden").length;
  const mitAuflagen = liste.filter((b) => b.ergebnis === "bestanden_mit_auflagen").length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4 pb-10">

        {/* Header */}
        <PageHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">1.12 Kontrollberichte</h1>
                <p className="text-sm text-white/75">Behördliche Kontrollen, Zertifikate &amp; Audits</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <JahrWahl year={year} onChange={handleYearChange} />
              {aktiveTab !== "tuev" && !showForm && (
                <button onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/15 text-white rounded-xl text-sm font-bold hover:bg-white/25 transition-colors">
                  <Plus className="w-4 h-4" /> Hinzufügen
                </button>
              )}
            </div>
          </div>
        </PageHeader>

        {/* 4 Kategorie-Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-muted/40 rounded-2xl border border-border/30">
          {TABS.map((t) => {
            const tabDaten = t.key !== "tuev" ? daten[t.key] : [];
            const warn = tabDaten.filter(
              (b) => getStatus(b.gueltigBis) === "abgelaufen" || b.ergebnis === "nicht_bestanden"
            ).length;
            const isActive = aktiveTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                  isActive ? "bg-white shadow-sm border border-border/40 " + t.color : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={isActive ? t.color : ""}>{t.icon}</span>
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

        {/* TÜV: Eigenes Panel */}
        {aktiveTab === "tuev" ? (
          <TuevPanel year={year} />
        ) : (
          <>
            {/* Warnkacheln */}
            {(abgelaufen > 0 || bald > 0 || nichtBestanden > 0 || mitAuflagen > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {nichtBestanden > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
                    <ThumbsDown className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-700">{nichtBestanden} nicht bestanden</p>
                      <p className="text-xs text-red-500">Maßnahmen einleiten</p>
                    </div>
                  </div>
                )}
                {mitAuflagen > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-700">{mitAuflagen} mit Auflagen</p>
                      <p className="text-xs text-amber-600">Auflagen prüfen</p>
                    </div>
                  </div>
                )}
                {abgelaufen > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-700">{abgelaufen} abgelaufen</p>
                      <p className="text-xs text-red-500">Neue Kontrolle erforderlich</p>
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
              <KontrollberichtForm
                kategorie={aktiveTab}
                year={year}
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
              <div className={`text-center py-12 rounded-2xl border-2 border-dashed ${tab.borderColor} ${tab.bgColor}`}>
                <p className="text-sm font-medium text-muted-foreground">Keine {tab.label} für {year}</p>
                <p className="text-xs text-muted-foreground mt-1">Klicken Sie auf "Hinzufügen"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {liste.map((b) => (
                  <BerichtKarte
                    key={b.id}
                    b={b}
                    tab={tab}
                    isAdmin={canDelete}
                    onDelete={() => handleDelete(b.id)}
                  />
                ))}
              </div>
            )}

            {/* Gesetzlicher Hinweis */}
            {tab.hinweis && (
              <div className={`${tab.bgColor} border ${tab.borderColor} rounded-2xl p-4`}>
                <p className={`text-xs font-medium leading-relaxed ${tab.color}`}>
                  <strong>Hinweis:</strong> {tab.hinweis}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
