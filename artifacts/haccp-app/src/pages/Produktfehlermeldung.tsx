import { useState, useEffect, useCallback, useRef } from "react";
import { useFilePaste } from "@/hooks/useFileUpload";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import {
  AlertTriangle, ChevronLeft, ChevronRight, Save, Plus, Trash2,
  Loader2, Check, X, PackageX, ListFilter, Printer, Camera,
  Mail, Send, ImagePlus, XCircle, KeyRound, UserCheck,
} from "lucide-react";
import { DruckformularPFM } from "@/components/DruckformularPFM";
import { UnterschriftPad } from "@/components/UnterschriftPad";
import { PinVerification } from "@/components/PinVerification";

const BASE = import.meta.env.VITE_API_URL || "/api";

const MARKT_STAMMDATEN: Record<number, { name: string; telefon: string; email: string }> = {
  1: { name: "Leeder",        telefon: "08243/9609041", email: "markt@edeka-dallmann.de"        },
  2: { name: "Buching",       telefon: "08368/9148741", email: "markt-buching@edeka-dallmann.de" },
  3: { name: "Marktoberdorf", telefon: "08342/9193006", email: "markt-mod@edeka-dallmann.de"     },
};

type JaNein = true | false | null;

interface FormData {
  markt: string;
  ansprechpartner: string;
  email: string;
  telefon: string;
  telefax: string;
  erkennungDurch: "markt" | "verbraucher" | "";
  einwilligungVorhanden: JaNein;
  markenname: string;
  einzelEan: string;
  mhd: string;
  losnummer: string;
  lieferantencode: string;
  belieferungsart: "strecke" | "grosshandel" | "";
  grosshandelsstandort: string;
  fehlerbeschreibung: string;
  mengeverbraucher: string;
  mengemarkt: string;
  kaufdatum: string;
  kassenbonVorhanden: JaNein;
  kundeEntschaedigt: JaNein;
  produktVorhanden: JaNein;
  fremdkoerperVorhanden: JaNein;
  gleichesMhdImMarkt: JaNein;
  gleicherFehlerImBestand: JaNein;
  wareAusRegalGenommen: JaNein;
  datumUnterschrift: string;
  unterschriftMarktleiter: string;
  unterschriftFoto: string;
  unterschriftPersonalDigital: string;
  unterschriftKundeDigital: string;
  // Seite 2
  verbraucherName: string;
  verbraucherAdresse: string;
  verbraucherTelefon: string;
  verbraucherEmail: string;
  einwilligungUnterschriftOrt: string;
  einwilligungDatum: string;
}

interface Report extends FormData {
  id: number;
  tenantId: number;
  createdAt: string;
  updatedAt: string;
}

const GROSSHANDEL_STANDORTE = [
  "Gaimersheim", "Landsberg am Lech", "Straubing", "Trostberg", "Eching",
];

function emptyForm(): FormData {
  return {
    markt: "", ansprechpartner: "", email: "", telefon: "", telefax: "",
    erkennungDurch: "", einwilligungVorhanden: null,
    markenname: "", einzelEan: "", mhd: "", losnummer: "", lieferantencode: "",
    belieferungsart: "", grosshandelsstandort: "",
    fehlerbeschreibung: "",
    mengeverbraucher: "", mengemarkt: "", kaufdatum: "",
    kassenbonVorhanden: null, kundeEntschaedigt: null,
    produktVorhanden: null, fremdkoerperVorhanden: null,
    gleichesMhdImMarkt: null, gleicherFehlerImBestand: null, wareAusRegalGenommen: null,
    datumUnterschrift: "", unterschriftMarktleiter: "", unterschriftFoto: "",
    unterschriftPersonalDigital: "", unterschriftKundeDigital: "",
    verbraucherName: "", verbraucherAdresse: "", verbraucherTelefon: "", verbraucherEmail: "",
    einwilligungUnterschriftOrt: "", einwilligungDatum: "",
  };
}

function JaNeinButton({ value, onChange, label }: {
  value: JaNein; onChange: (v: JaNein) => void; label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-foreground flex-1">{label}</span>}
      <div className="flex gap-1 shrink-0">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(value === v ? null : v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
              value === v
                ? v
                  ? "bg-green-100 border-green-400 text-green-700"
                  : "bg-red-100 border-red-400 text-red-700"
                : "bg-white border-border/40 text-muted-foreground hover:border-border"
            }`}
          >
            {v ? "Ja" : "Nein"}
          </button>
        ))}
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text", placeholder = "", required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-border/60 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
      />
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

const DRAFT_KEY = "haccp-pfm-draft-v1";

function compressImage(file: File, maxPx = 1400, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function Produktfehlermeldung() {
  const { adminSession, selectedMarketId, hasPermission } = useAppStore();
  const canDelete = hasPermission("entries.delete");

  const [page, setPage] = useState<1 | 2>(1);
  const [view, setView] = useState<"list" | "form">("list");
  const [reports, setReports] = useState<Report[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showDruck, setShowDruck] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const getMarktDefaults = () => {
    const info = selectedMarketId ? MARKT_STAMMDATEN[selectedMarketId] : null;
    return info
      ? { markt: info.name, telefon: info.telefon, email: info.email }
      : {};
  };

  // Entwurf-Verwaltung
  const [draftRestored, setDraftRestored] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<{ form: FormData; page: 1 | 2 } | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/produktfehlermeldung?tenantId=1${selectedMarketId ? `&marketId=${selectedMarketId}` : ""}`);
      const data = await res.json();
      setReports(data);
    } finally {
      setLoading(false);
    }
  }, [selectedMarketId]);

  useEffect(() => { loadReports(); }, [loadReports]);

  // Auto-Speichern in localStorage (nur bei neuen, noch nicht gespeicherten Meldungen)
  useEffect(() => {
    if (view === "form" && !currentReport) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, page }));
    }
  }, [form, page, view, currentReport]);

  const set = (key: keyof FormData) => (val: string | boolean | null) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleNew = () => {
    const draftRaw = localStorage.getItem(DRAFT_KEY);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw) as { form: FormData; page: 1 | 2 };
        setPendingDraft(draft);
        setShowDraftPrompt(true);
        return;
      } catch {}
    }
    setCurrentReport(null);
    setForm({ ...emptyForm(), datumUnterschrift: new Date().toLocaleDateString("de-DE"), ...getMarktDefaults() });
    setPage(1);
    setView("form");
    setSaved(false);
  };

  const handleRestoreDraft = () => {
    if (!pendingDraft) return;
    setCurrentReport(null);
    setForm(pendingDraft.form);
    setPage(pendingDraft.page);
    setView("form");
    setShowDraftPrompt(false);
    setDraftRestored(true);
    setSaved(false);
  };

  const handleNewFresh = () => {
    localStorage.removeItem(DRAFT_KEY);
    setPendingDraft(null);
    setShowDraftPrompt(false);
    setCurrentReport(null);
    setForm({ ...emptyForm(), datumUnterschrift: new Date().toLocaleDateString("de-DE"), ...getMarktDefaults() });
    setPage(1);
    setView("form");
    setSaved(false);
  };

  const handleOpen = (r: Report) => {
    setCurrentReport(r);
    const { id, tenantId, createdAt, updatedAt, ...fields } = r;
    setForm(fields as FormData);
    setPage(1);
    setView("form");
    setSaved(false);
    setDraftRestored(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { tenantId: 1, marketId: selectedMarketId || null, ...form };
      let res: Response;
      if (currentReport) {
        res = await fetch(`${BASE}/produktfehlermeldung/${currentReport.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${BASE}/produktfehlermeldung`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      setCurrentReport(data);
      localStorage.removeItem(DRAFT_KEY); // Entwurf nach erfolgreichem Speichern löschen
      await loadReports();
      setSaved(true);
      setDraftRestored(false);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      set("unterschriftFoto")(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => set("unterschriftFoto")(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  useFilePaste(async (file) => {
    if (file.type.startsWith("image/")) {
      try {
        set("unterschriftFoto")(await compressImage(file));
      } catch {
        const reader = new FileReader();
        reader.onload = () => set("unterschriftFoto")(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  });

  const handleDelete = async () => {
    if (!currentReport) return;
    await fetch(`${BASE}/produktfehlermeldung/${currentReport.id}`, { method: "DELETE" });
    setDeleteConfirm(false);
    setView("list");
    setCurrentReport(null);
    await loadReports();
  };

  const handleSendEmail = async () => {
    if (!currentReport) return;
    setEmailSending(true);
    setEmailError(null);
    setEmailSent(false);
    const marktInfo = selectedMarketId ? MARKT_STAMMDATEN[selectedMarketId] : null;
    try {
      const res = await fetch(`${BASE}/send-produktfehlermeldung-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: currentReport.id,
          tenantId: currentReport.tenantId,
          formData: form,
          marktName: marktInfo?.name || form.markt || "Unbekannt",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || "E-Mail konnte nicht gesendet werden.");
      } else {
        setEmailSent(true);
      }
    } catch {
      setEmailError("Netzwerkfehler beim Senden.");
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4 pb-10">

        {/* Header */}
        <PageHeader>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/category/1" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <PackageX className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Produktfehlermeldung</h1>
            </div>
          </div>
          <p className="text-blue-100 text-sm">
            Reklamationserfassung für Produktfehler und Verbraucherbeschwerden.
            Ausgefülltes Formblatt ist 3 Jahre von der Marktleitung zu archivieren.
          </p>

          <div className="flex items-center gap-3 mt-4">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-xl font-bold">{reports.length}</div>
              <div className="text-xs text-blue-200">Meldungen</div>
            </div>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 bg-white text-[#1a3a6b] font-bold text-sm px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors ml-auto"
            >
              <Plus className="w-4 h-4" /> Neue Meldung
            </button>
          </div>
        </PageHeader>

        {/* List view */}
        {view === "list" && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-muted-foreground" /> Alle Meldungen
              </h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Lade Meldungen …</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Noch keine Meldungen vorhanden</p>
                <p className="text-xs mt-1">Klicken Sie auf „Neue Meldung" um zu beginnen.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {reports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleOpen(r)}
                    className="w-full flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <PackageX className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">
                        {r.markenname || "Kein Produktname"}{r.einzelEan ? ` · EAN: ${r.einzelEan}` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {r.erkennungDurch === "verbraucher" ? "Verbraucher" : "Markt"} · {" "}
                        {r.kaufdatum || "—"} · Erstellt: {new Date(r.createdAt).toLocaleDateString("de-DE")}
                      </div>
                      {r.fehlerbeschreibung && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                          {r.fehlerbeschreibung}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form view */}
        {view === "form" && (
          <>
            {/* Entwurf-Wiederherstellungs-Banner */}
            {draftRestored && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 text-sm text-amber-800">
                <span className="text-lg">📋</span>
                <div className="flex-1">
                  <span className="font-bold">Entwurf wiederhergestellt.</span>{" "}
                  Ihre zuletzt eingegebenen Daten wurden automatisch geladen. Bitte prüfen und speichern.
                </div>
                <button
                  onClick={() => setDraftRestored(false)}
                  className="text-amber-600 hover:text-amber-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setView("list")}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Zurück zur Liste
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(1)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    page === 1 ? "bg-[#1a3a6b] text-white" : "bg-white border border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Seite 1
                </button>
                <button
                  onClick={() => setPage(2)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    page === 2 ? "bg-[#1a3a6b] text-white" : "bg-white border border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Seite 2 · Verbraucherdaten
                </button>
              </div>
            </div>

            {page === 1 && (
              <div className="space-y-4">

                <SectionCard title="Marktdaten">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput label="Markt" value={form.markt} onChange={set("markt")} required />

                    {/* Ansprechpartner per PIN */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Ansprechpartner
                      </label>
                      {form.ansprechpartner ? (
                        <div className="flex items-center gap-2 px-3 py-2 border border-green-300 bg-green-50 rounded-xl">
                          <UserCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-green-800 flex-1">{form.ansprechpartner}</span>
                          <button
                            type="button"
                            onClick={() => set("ansprechpartner")("")}
                            className="text-green-500 hover:text-green-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowPinModal(true)}
                          className="flex items-center gap-2 px-3 py-2 border border-dashed border-border/60 rounded-xl text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors text-left"
                        >
                          <KeyRound className="w-4 h-4 flex-shrink-0" />
                          Mit PIN eintragen …
                        </button>
                      )}
                    </div>

                    <FormInput label="E-Mail Adresse" value={form.email} onChange={set("email")} type="email" />
                    <FormInput label="Telefon" value={form.telefon} onChange={set("telefon")} type="tel" />
                    <FormInput label="Telefax" value={form.telefax} onChange={set("telefax")} />
                  </div>
                </SectionCard>

                <SectionCard title="Erkennung des Fehlers durch">
                  <div className="space-y-3">
                    {(["markt", "verbraucher"] as const).map((v) => (
                      <label key={v} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => set("erkennungDurch")(v)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            form.erkennungDurch === v
                              ? "bg-[#1a3a6b] border-[#1a3a6b]"
                              : "border-border group-hover:border-[#1a3a6b]/50"
                          }`}
                        >
                          {form.erkennungDurch === v && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {v === "markt" ? "den Markt" : "den Verbraucher"}
                        </span>
                      </label>
                    ))}

                    {form.erkennungDurch === "verbraucher" && (
                      <div className="mt-3 pl-8 space-y-2 border-l-2 border-[#1a3a6b]/20">
                        <JaNeinButton
                          label="Verbraucherdaten und Einwilligungserklärung liegen vor (siehe S. 2)"
                          value={form.einwilligungVorhanden}
                          onChange={(v) => set("einwilligungVorhanden")(v)}
                        />
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard title="Produktdaten">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <FormInput
                        label="Markenname / Artikel-Bezeichnung / Füllmenge"
                        value={form.markenname}
                        onChange={set("markenname")}
                        placeholder="z.B. Gut&Günstig Gouda, 200g"
                        required
                      />
                    </div>
                    <FormInput label="Einzel-EAN / PLU" value={form.einzelEan} onChange={set("einzelEan")} />
                    <FormInput label="MHD / Verbrauchsdatum" value={form.mhd} onChange={set("mhd")} type="date" />
                    <FormInput label="Losnummer / Chargennummer" value={form.losnummer} onChange={set("losnummer")} />
                    <FormInput label="Lieferantencode (bei Eigenmarken)" value={form.lieferantencode} onChange={set("lieferantencode")} />
                  </div>
                </SectionCard>

                <SectionCard title="Art der Belieferung">
                  <div className="space-y-3">
                    {(["strecke", "grosshandel"] as const).map((v) => (
                      <label key={v} className="flex items-start gap-3 cursor-pointer group">
                        <div
                          onClick={() => set("belieferungsart")(v)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            form.belieferungsart === v
                              ? "bg-[#1a3a6b] border-[#1a3a6b]"
                              : "border-border group-hover:border-[#1a3a6b]/50"
                          }`}
                        >
                          {form.belieferungsart === v && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            {v === "strecke" ? "Strecke" : "Großhandel aus Lager"}
                          </span>
                          {v === "grosshandel" && form.belieferungsart === "grosshandel" && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {GROSSHANDEL_STANDORTE.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => set("grosshandelsstandort")(form.grosshandelsstandort === s ? "" : s)}
                                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                                    form.grosshandelsstandort === s
                                      ? "bg-[#1a3a6b] text-white border-[#1a3a6b]"
                                      : "bg-white text-muted-foreground border-border/60 hover:border-[#1a3a6b]/40"
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Fehlerbeschreibung">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Fehlerbeschreibung mit Beanstandungsgrund, ggf. gesundheitliche Beeinträchtigung
                    </label>
                    <textarea
                      value={form.fehlerbeschreibung}
                      onChange={(e) => set("fehlerbeschreibung")(e.target.value)}
                      rows={4}
                      placeholder="Fehlerbeschreibung eingeben …"
                      className="mt-1 w-full px-3 py-2 border border-border/60 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all resize-none"
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Betroffene Menge & Kaufdaten">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput label="Betroffene Menge – Verbraucher" value={form.mengeverbraucher} onChange={set("mengeverbraucher")} />
                    <FormInput label="Betroffene Menge – Markt (insg.)" value={form.mengemarkt} onChange={set("mengemarkt")} />
                    <FormInput label="Kaufdatum" value={form.kaufdatum} onChange={set("kaufdatum")} type="date" />
                  </div>
                  <div className="space-y-3 pt-2">
                    <JaNeinButton label="Kaufbeleg (Kassen-Bon) vorhanden" value={form.kassenbonVorhanden} onChange={(v) => set("kassenbonVorhanden")(v)} />
                    <JaNeinButton label="Kunde wurde bereits entschädigt" value={form.kundeEntschaedigt} onChange={(v) => set("kundeEntschaedigt")(v)} />
                  </div>
                </SectionCard>

                <SectionCard title="Checkliste">
                  <div className="space-y-3">
                    <JaNeinButton label="Liegt das reklamierte Produkt vor?" value={form.produktVorhanden} onChange={(v) => set("produktVorhanden")(v)} />
                    <JaNeinButton label="Bei Fremdkörper-Reklamation: Liegt Fremdkörper vor?" value={form.fremdkoerperVorhanden} onChange={(v) => set("fremdkoerperVorhanden")(v)} />
                    <JaNeinButton label="Liegt das Produkt mit gleichem MHD im Markt noch vor?" value={form.gleichesMhdImMarkt} onChange={(v) => set("gleichesMhdImMarkt")(v)} />
                    {form.gleichesMhdImMarkt === true && (
                      <div className="pl-6 border-l-2 border-[#1a3a6b]/20 space-y-3">
                        <JaNeinButton label="Weist dieser Bestand den gleichen Fehler auf?" value={form.gleicherFehlerImBestand} onChange={(v) => set("gleicherFehlerImBestand")(v)} />
                        <JaNeinButton label="Wurde die Ware aus dem Regal genommen?" value={form.wareAusRegalGenommen} onChange={(v) => set("wareAusRegalGenommen")(v)} />
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard title="Abschluss & Unterschrift">
                  <FormInput label="Datum" value={form.datumUnterschrift} onChange={set("datumUnterschrift")} />
                  <div className="mt-3">
                    <UnterschriftPad
                      label="Digitale Unterschrift – Marktleiter / Vertreter"
                      value={form.unterschriftPersonalDigital}
                      onChange={(v) => set("unterschriftPersonalDigital")(v)}
                      height={150}
                    />
                  </div>
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs text-amber-800 font-medium">
                      Protokoll und alle vorhandenen Daten/Unterlagen bzw. Fotos zu diesem Vorgang bitte umgehend weiterleiten an:
                      <br /><strong>Fax-Nr.: 08458/62-510</strong> bzw. <strong>qm.suedbayern@edeka.de</strong>
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Das ausgefüllte Formblatt muss für 3 Jahre von der Marktleitung archiviert werden.
                    </p>
                  </div>
                </SectionCard>
              </div>
            )}

            {page === 2 && (
              <div className="space-y-4">
                <SectionCard title="Verbraucherdaten">
                  <p className="text-xs text-muted-foreground mb-2">
                    Die Angabe der Verbraucherdaten ist freiwillig und nur bei Einwilligung gemäß DSGVO zu erfassen.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput label="Name" value={form.verbraucherName} onChange={set("verbraucherName")} />
                    <FormInput label="Telefon" value={form.verbraucherTelefon} onChange={set("verbraucherTelefon")} type="tel" />
                    <div className="sm:col-span-2">
                      <FormInput label="Adresse" value={form.verbraucherAdresse} onChange={set("verbraucherAdresse")} />
                    </div>
                    <div className="sm:col-span-2">
                      <FormInput label="E-Mail" value={form.verbraucherEmail} onChange={set("verbraucherEmail")} type="email" />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Einwilligungserklärung Datenschutz">
                  <div className="bg-gray-50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed mb-4">
                    <p>
                      Mit meiner Unterschrift willige ich ein, dass meine im Meldebogen angegebenen personenbezogenen Daten
                      zur Bearbeitung und Abwicklung meines Anliegens durch die genannten Unternehmen verarbeitet werden.
                      Diese können mit mir hierzu per Telefon oder E-Mail Kontakt aufnehmen, sofern ich entsprechende
                      Kontaktangaben im Formular gemacht habe. Die Daten werden vertraulich behandelt und nicht für andere
                      Zwecke verwendet.
                    </p>
                    <p className="mt-2">
                      Mir ist bewusst, dass diese Einwilligung freiwillig und jederzeit widerrufbar ist.
                    </p>
                  </div>
                  <FormInput label="Ort, Datum" value={form.einwilligungUnterschriftOrt} onChange={set("einwilligungUnterschriftOrt")} />
                  <div className="mt-3">
                    <UnterschriftPad
                      label="Digitale Unterschrift – Kunde"
                      value={form.unterschriftKundeDigital}
                      onChange={(v) => set("unterschriftKundeDigital")(v)}
                      height={150}
                    />
                  </div>
                </SectionCard>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs text-amber-800 font-medium">
                    Protokoll und alle vorhandenen Daten/Unterlagen bzw. Fotos zu diesem Vorgang bitte umgehend weiterleiten an:
                    <br /><strong>Fax-Nr.: 08458/62-510</strong> bzw. <strong>qm.suedbayern@edeka.de</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Foto-Upload & Weiterleitung (immer sichtbar) */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Camera className="w-4 h-4 text-muted-foreground" /> Unterschriftsfoto &amp; Weiterleitung
                </h3>
              </div>
              <div className="p-5 space-y-4">

                {/* Schritt-Anleitung */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { nr: "1", icon: "🖨️", title: "Drucken & unterschreiben", text: "Formular vorausgefüllt drucken, Marktleiter und Kunde unterschreiben lassen" },
                    { nr: "2", icon: "📸", title: "Unterschrift fotografieren", text: "Nur die Unterschriftsseite fotografieren und hier hochladen" },
                    { nr: "3", icon: "📧", title: "An EDEKA weiterleiten", text: "Per E-Mail oder Fax an die QM-Abteilung senden" },
                  ].map((s) => (
                    <div key={s.nr} className="flex gap-3 p-3 bg-[#1a3a6b]/5 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-[#1a3a6b] text-white text-xs font-bold flex items-center justify-center shrink-0">{s.nr}</div>
                      <div>
                        <div className="text-xs font-bold text-foreground mb-0.5">{s.title}</div>
                        <div className="text-xs text-muted-foreground">{s.text}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Foto Upload */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Unterschriftsfoto hochladen</p>
                  {form.unterschriftFoto ? (
                    <div className="relative inline-block">
                      <img
                        src={form.unterschriftFoto}
                        alt="Unterschriftsfoto"
                        className="max-h-48 rounded-xl border border-border/60 object-contain"
                      />
                      <button
                        onClick={() => set("unterschriftFoto")("")}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Foto entfernen"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Foto gespeichert
                      </p>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => fotoInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={async (e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith("image/")) { try { set("unterschriftFoto")(await compressImage(f)); } catch { const reader = new FileReader(); reader.onload = () => set("unterschriftFoto")(reader.result as string); reader.readAsDataURL(f); } } }}
                        className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border/60 rounded-xl text-sm text-muted-foreground hover:border-[#1a3a6b]/40 hover:text-[#1a3a6b] hover:bg-[#1a3a6b]/5 transition-all w-full justify-center"
                      >
                        <ImagePlus className="w-4 h-4" />
                        Foto aufnehmen, hierher ziehen oder aus Galerie wählen
                      </button>
                      <p className="text-center text-[10px] text-muted-foreground mt-1">oder Strg+V zum Einfügen</p>
                    </>
                  )}
                  <input
                    ref={fotoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Weiterleitungsinfo */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Weiterleitung an EDEKA QM-Abteilung
                  </p>

                  {/* E-Mail Senden Button */}
                  {currentReport ? (
                    <div className="space-y-2">
                      <button
                        onClick={handleSendEmail}
                        disabled={emailSending || emailSent}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all w-full justify-center ${
                          emailSent
                            ? "bg-green-100 border-green-400 text-green-700"
                            : "bg-white border-amber-400 text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                        }`}
                      >
                        {emailSending ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Wird gesendet…</>
                        ) : emailSent ? (
                          <><Check className="w-3.5 h-3.5" /> E-Mail erfolgreich gesendet</>
                        ) : (
                          <><Mail className="w-3.5 h-3.5" /> Per E-Mail an EDEKA QM senden</>
                        )}
                      </button>
                      {emailError && (
                        <p className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
                          <X className="w-3.5 h-3.5 flex-shrink-0" /> {emailError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700">
                      Bitte erst speichern, um die Meldung per E-Mail zu senden.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 border-t border-amber-200 pt-2">
                    <a
                      href="mailto:qm.suedbayern@edeka.de?subject=Produktfehlermeldung 3.14"
                      className="flex items-center gap-1.5 text-xs text-amber-700 underline hover:text-amber-900"
                    >
                      <Mail className="w-3 h-3" /> qm.suedbayern@edeka.de
                    </a>
                    <span className="text-xs text-amber-600">|</span>
                    <span className="text-xs text-amber-700">📠 Fax: 08458/62-510</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Formblatt muss 3 Jahre von der Marktleitung archiviert werden.
                  </p>
                </div>

              </div>
            </div>

            {/* Save / Delete bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {page === 1 ? (
                <button
                  onClick={() => setPage(2)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Weiter zu Seite 2 <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setPage(1)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Zurück zu Seite 1
                </button>
              )}

              <div className="flex-1" />

              <button
                onClick={() => setShowDruck(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#1a3a6b]/30 text-[#1a3a6b] rounded-xl text-sm font-semibold hover:bg-[#1a3a6b]/5 transition-colors"
              >
                <Printer className="w-4 h-4" /> Formular drucken
              </button>

              {canDelete && currentReport && !deleteConfirm && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Löschen
                </button>
              )}

              {deleteConfirm && (
                <>
                  <span className="text-sm text-red-600 font-medium">Wirklich löschen?</span>
                  <button onClick={handleDelete} className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">
                    <Check className="w-4 h-4" /> Ja
                  </button>
                  <button onClick={() => setDeleteConfirm(false)} className="flex items-center gap-1 px-3 py-2 bg-white border border-border/60 rounded-xl text-sm font-bold">
                    <X className="w-4 h-4" /> Nein
                  </button>
                </>
              )}

              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  saved
                    ? "bg-green-600 text-white"
                    : "bg-[#1a3a6b] text-white hover:bg-[#2d5aa0]"
                } disabled:opacity-70`}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Speichern …</>
                ) : saved ? (
                  <><Check className="w-4 h-4" /> Gespeichert</>
                ) : (
                  <><Save className="w-4 h-4" /> Speichern</>
                )}
              </button>
            </div>
          </>
        )}

      </div>

      {/* PIN-Modal für Ansprechpartner */}
      <PinVerification
        open={showPinModal}
        onVerified={(_userId, userName) => {
          set("ansprechpartner")(userName);
          setShowPinModal(false);
        }}
        onCancel={() => setShowPinModal(false)}
      />

      {showDruck && (
        <DruckformularPFM form={form} onClose={() => setShowDruck(false)} />
      )}

      {/* Entwurf-Abfrage-Modal */}
      {showDraftPrompt && pendingDraft && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">📋</div>
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">
                  Nicht gespeicherter Entwurf gefunden
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sie haben eine angefangene Meldung, die nicht gespeichert wurde — z.B. weil die Sitzung unterbrochen wurde. Möchten Sie dort weitermachen?
                </p>
              </div>
            </div>

            {/* Vorschau was im Entwurf steht */}
            {(pendingDraft.form.markenname || pendingDraft.form.markt) && (
              <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                {pendingDraft.form.markt && <div><span className="font-semibold">Markt:</span> {pendingDraft.form.markt}</div>}
                {pendingDraft.form.markenname && <div><span className="font-semibold">Artikel:</span> {pendingDraft.form.markenname}</div>}
                {pendingDraft.form.fehlerbeschreibung && (
                  <div className="line-clamp-2">
                    <span className="font-semibold">Fehler:</span> {pendingDraft.form.fehlerbeschreibung}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground/60 pt-1">
                  Seite {pendingDraft.page} von 2 ausgefüllt
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleRestoreDraft}
                className="w-full px-4 py-3 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] transition-colors"
              >
                📋 Entwurf wiederherstellen
              </button>
              <button
                onClick={handleNewFresh}
                className="w-full px-4 py-2.5 border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Neu beginnen (Entwurf verwerfen)
              </button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
