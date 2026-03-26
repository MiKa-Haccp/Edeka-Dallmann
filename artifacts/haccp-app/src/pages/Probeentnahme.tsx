import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ChevronLeft, Save, Plus, Trash2, Loader2, Check, X,
  FlaskConical, Printer, Camera, Mail, ImagePlus, FileText, Send, KeyRound,
} from "lucide-react";
import { UnterschriftPad } from "@/components/UnterschriftPad";
import { PinVerification } from "@/components/PinVerification";

const BASE = import.meta.env.VITE_API_URL || "/api";
const DRAFT_KEY = "haccp-probe-draft-v1";

const MARKT_STAMMDATEN: Record<number, { name: string; adresse: string; telefon: string }> = {
  1: { name: "EDEKA Leeder",        adresse: "Lechaschauer Str. 1, 86929 Leeder",            telefon: "08243/9609041" },
  2: { name: "EDEKA Buching",       adresse: "Buchinger Str. 10, 86971 Peiting-Buching",      telefon: "08368/9148741" },
  3: { name: "EDEKA Marktoberdorf", adresse: "Kaufbeurer Str. 30, 87616 Marktoberdorf",       telefon: "08342/9193006" },
};

interface FormData {
  markt: string;
  ansprechpartner: string;
  behoerdeBezeichnung: string;
  grundProbenahme: string;
  untersuchungsziel: string;
  datumEntnahme: string;
  gegenprobeArt: "gegenprobe" | "zweitprobe" | "";
  gegenprobeStatus: "hinterlassen" | "nicht_vorhanden" | "";
  probentyp: "fertigpackung" | "lose_ware" | "bedientheke" | "";
  ean: string;
  artikelNr: string;
  verkehrsbezeichnung: string;
  mhd: string;
  losnummer: string;
  fuellmenge: string;
  hersteller: string;
  durchschriftGefaxtDurch: string;
  durchschriftGefaxtAm: string;
  // 3.22-2
  abholerName: string;
  abholerFirmaName: string;
  abholerFirmaStrasse: string;
  abholerFirmaPostfach: string;
  abholerFirmaPlzOrt: string;
  amtlicheProbennummer: string;
  siegeldatum: string;
  uebergabeArtikel: string;
  uebergabeOrtDatum: string;
  gegenprobeAbgeholtAm: string;
  gegenprobeAbgeholtDurch: string;
  unterschriftAbholerDigital: string;
  unterschriftMitarbeiterDigital: string;
  // Foto
  amtlichesDokumentFoto: string;
}

interface ProbeRecord extends FormData {
  id: number;
  tenantId: number;
  createdAt: string;
  updatedAt: string;
}

function emptyForm(): FormData {
  return {
    markt: "", ansprechpartner: "", behoerdeBezeichnung: "",
    grundProbenahme: "", untersuchungsziel: "",
    datumEntnahme: new Date().toLocaleDateString("de-DE"),
    gegenprobeArt: "", gegenprobeStatus: "", probentyp: "",
    ean: "", artikelNr: "", verkehrsbezeichnung: "", mhd: "", losnummer: "", fuellmenge: "", hersteller: "",
    durchschriftGefaxtDurch: "", durchschriftGefaxtAm: "",
    abholerName: "", abholerFirmaName: "", abholerFirmaStrasse: "", abholerFirmaPostfach: "", abholerFirmaPlzOrt: "",
    amtlicheProbennummer: "", siegeldatum: "", uebergabeArtikel: "", uebergabeOrtDatum: "",
    gegenprobeAbgeholtAm: "", gegenprobeAbgeholtDurch: "",
    unterschriftAbholerDigital: "", unterschriftMitarbeiterDigital: "",
    amtlichesDokumentFoto: "",
  };
}

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
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function SectionCard({ title, subtitle, icon, children }: {
  title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
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
        className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b]/40 transition-all"
      />
    </div>
  );
}

function FTextarea({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b]/40 transition-all resize-none"
      />
    </div>
  );
}

function ToggleGroup<T extends string>({ label, value, onChange, options }: {
  label: string; value: T | ""; onChange: (v: T | "") => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value} type="button"
            onClick={() => onChange(value === o.value ? "" : o.value)}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              value === o.value
                ? "bg-[#1a3a6b] border-[#1a3a6b] text-white"
                : "bg-white border-border/40 text-muted-foreground hover:border-[#1a3a6b]/30"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Probeentnahme() {
  const { adminSession, selectedMarketId } = useAppStore();
  const isAdmin = !!adminSession;

  const [view, setView] = useState<"list" | "form">("list");
  const [records, setRecords] = useState<ProbeRecord[]>([]);
  const [current, setCurrent] = useState<ProbeRecord | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<FormData | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [showDruckMenu, setShowDruckMenu] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);

  const [showPinModal, setShowPinModal] = useState(false);
  const [verifiedUserName, setVerifiedUserName] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const getMarktDefault = () => {
    const info = selectedMarketId ? MARKT_STAMMDATEN[selectedMarketId] : null;
    if (!info) return "";
    return `${info.name}, ${info.adresse}, Tel. ${info.telefon}`;
  };

  const set = (k: keyof FormData) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/probeentnahme?tenantId=1`);
      setRecords(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // Auto-Draft
  useEffect(() => {
    if (view === "form" && !current) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }
  }, [form, view, current]);

  const handleNew = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        setPendingDraft(JSON.parse(raw));
        setShowDraftPrompt(true);
        return;
      } catch {}
    }
    const marktDefault = getMarktDefault();
    setCurrent(null);
    setForm({ ...emptyForm(), markt: marktDefault });
    setVerifiedUserName(null);
    setEmailSent(false);
    setEmailError(null);
    setView("form");
    setSaved(false);
  };

  const handleOpen = (r: ProbeRecord) => {
    setCurrent(r);
    const { id, tenantId, createdAt, updatedAt, ...fields } = r;
    setForm(fields as FormData);
    setVerifiedUserName(null);
    setEmailSent(false);
    setEmailError(null);
    setView("form"); setSaved(false); setDraftRestored(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { tenantId: 1, ...form };
      const res = current
        ? await fetch(`${BASE}/probeentnahme/${current.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch(`${BASE}/probeentnahme`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      setCurrent(data);
      localStorage.removeItem(DRAFT_KEY);
      await loadRecords();
      setSaved(true); setDraftRestored(false);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!current) return;
    await fetch(`${BASE}/probeentnahme/${current.id}`, { method: "DELETE" });
    setDeleteConfirm(false); setView("list"); setCurrent(null);
    await loadRecords();
  };

  const handleSendEmail = async () => {
    if (!current) return;
    setEmailSending(true);
    setEmailError(null);
    setEmailSent(false);
    const marktInfo = selectedMarketId ? MARKT_STAMMDATEN[selectedMarketId] : null;
    try {
      const res = await fetch(`${BASE}/send-probeentnahme-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: current.id,
          marketId: selectedMarketId || undefined,
          formData: form,
          marktName: marktInfo?.name || form.markt || "Unbekannt",
        }),
      });
      const data = await res.json();
      if (!res.ok) setEmailError(data.error || "E-Mail konnte nicht gesendet werden.");
      else setEmailSent(true);
    } catch {
      setEmailError("Netzwerkfehler beim Senden.");
    } finally {
      setEmailSending(false);
    }
  };

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      set("amtlichesDokumentFoto")(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => set("amtlichesDokumentFoto")(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const hatGegenprobe = form.gegenprobeArt !== "" && form.gegenprobeStatus === "hinterlassen";

  // Print helpers
  const handlePrint322_1 = () => { setShowDruckMenu(false); setTimeout(() => window.print(), 50); };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a3a6b]/10 rounded-2xl flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-[#1a3a6b]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">1.9 Probeentnahme</h1>
              <p className="text-xs text-muted-foreground">Amtliche Probenentnahme durch Lebensmittelüberwachung</p>
            </div>
          </div>
          {view === "list" && (
            <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Neue Probeentnahme
            </button>
          )}
        </div>

        {/* LIST VIEW — Gesamtprotokoll (3.22-3) */}
        {view === "list" && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800">
              <p className="font-bold mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Gesamtprotokoll (Formblatt 3.22-3)</p>
              <p>Jede Probeentnahme durch die Lebensmittelüberwachung wird hier dokumentiert. Ausgefüllten Probenahmebogen und amtlichen Durchschlag umgehend per Fax <strong>08458/62-510</strong> oder E-Mail <strong>qm.suedbayern@edeka.de</strong> weiterleiten.</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : records.length === 0 ? (
              <div className="text-center py-16">
                <FlaskConical className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Noch keine Probeentnahmen dokumentiert</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/40">
                        <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Datum</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Artikel / EAN</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Behörde</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Schein gefaxt durch</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Gegenprobe abgeholt</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Dok.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {records.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => handleOpen(r)}
                          className="hover:bg-muted/20 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">{r.datumEntnahme || "–"}</td>
                          <td className="px-4 py-3">
                            <div className="text-xs font-medium text-foreground line-clamp-1">{r.verkehrsbezeichnung || r.uebergabeArtikel || "–"}</div>
                            {r.ean && <div className="text-[10px] text-muted-foreground">EAN: {r.ean}</div>}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{r.behoerdeBezeichnung || "–"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                            {r.durchschriftGefaxtDurch
                              ? <span className="text-green-600 font-semibold">{r.durchschriftGefaxtDurch}</span>
                              : <span className="text-amber-500">Ausstehend</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                            {r.gegenprobeAbgeholtAm
                              ? <span>{r.gegenprobeAbgeholtAm}{r.gegenprobeAbgeholtDurch ? ` / ${r.gegenprobeAbgeholtDurch}` : ""}</span>
                              : r.gegenprobeArt
                              ? <span className="text-amber-500">Ausstehend</span>
                              : "–"}
                          </td>
                          <td className="px-4 py-3">
                            {r.amtlichesDokumentFoto
                              ? <span title="Foto vorhanden" className="text-green-600">📷</span>
                              : <span title="Kein Foto" className="text-muted-foreground/30">📷</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* FORM VIEW */}
        {view === "form" && (
          <>
            {/* Entwurf-Banner */}
            {draftRestored && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 text-sm text-amber-800">
                <span className="text-lg">📋</span>
                <div className="flex-1"><span className="font-bold">Entwurf wiederhergestellt.</span> Bitte prüfen und speichern.</div>
                <button onClick={() => setDraftRestored(false)}><X className="w-4 h-4 text-amber-600" /></button>
              </div>
            )}

            {/* Nav */}
            <div className="flex items-center justify-between">
              <button onClick={() => setView("list")} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" /> Zurück zum Gesamtprotokoll
              </button>
              <div className="text-xs text-muted-foreground font-medium">
                {current ? `Eintrag #${current.id}` : "Neue Probeentnahme"}
              </div>
            </div>

            {/* ===== 3.22-1 Probenahmebogen ===== */}
            <SectionCard
              title="Probenahmebogen (3.22-1)"
              subtitle="Zur amtlichen Probenentnahme — in Druckbuchstaben"
              icon={<FlaskConical className="w-4 h-4" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FInput label="Markt (Name, Adresse, Telefon)" value={form.markt} onChange={set("markt")} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ansprechpartner im Markt</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.ansprechpartner}
                      onChange={(e) => set("ansprechpartner")(e.target.value)}
                      placeholder="Name des Ansprechpartners"
                      className="flex-1 px-3 py-2 rounded-xl border border-border/60 bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b]/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinModal(true)}
                      title="Mitarbeiter per PIN bestätigen"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-[#1a3a6b]/30 bg-[#1a3a6b]/5 text-[#1a3a6b] text-xs font-bold hover:bg-[#1a3a6b]/10 transition-all flex-shrink-0"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      PIN
                    </button>
                  </div>
                  {verifiedUserName && (
                    <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Bestätigt: {verifiedUserName}
                    </p>
                  )}
                </div>
              </div>
              <FInput label="Bezeichnung der Behörde (z.B. Stadt München, Landratsamt Freising)" value={form.behoerdeBezeichnung} onChange={set("behoerdeBezeichnung")} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FInput label="Datum der Probenentnahme" value={form.datumEntnahme} onChange={set("datumEntnahme")} type="text" />
                <FInput label="Grund der Probenahme (z.B. Planprobe, ROP, Verdachtsprobe)" value={form.grundProbenahme} onChange={set("grundProbenahme")} />
              </div>
              <FTextarea label='Untersuchungsziel (UZ) - häufig im Feld "Bemerkungen" angegeben' value={form.untersuchungsziel} onChange={set("untersuchungsziel")} rows={2} />

              {/* Gegenprobe / Zweitprobe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToggleGroup
                  label="Art der Rückhalteprobe"
                  value={form.gegenprobeArt}
                  onChange={(v) => setForm((p) => ({ ...p, gegenprobeArt: v as typeof p.gegenprobeArt }))}
                  options={[
                    { value: "gegenprobe", label: "Gegenprobe" },
                    { value: "zweitprobe", label: "Zweitprobe" },
                  ]}
                />
                {form.gegenprobeArt !== "" && (
                  <ToggleGroup
                    label="Status der Rückhalteprobe"
                    value={form.gegenprobeStatus}
                    onChange={(v) => setForm((p) => ({ ...p, gegenprobeStatus: v as typeof p.gegenprobeStatus }))}
                    options={[
                      { value: "hinterlassen", label: "Hinterlassen" },
                      { value: "nicht_vorhanden", label: "Nicht vorhanden" },
                    ]}
                  />
                )}
              </div>

              {/* Warenart */}
              <ToggleGroup
                label="Art der Probe"
                value={form.probentyp}
                onChange={(v) => setForm((p) => ({ ...p, probentyp: v as typeof p.probentyp }))}
                options={[
                  { value: "fertigpackung", label: "Fertigpackung" },
                  { value: "lose_ware", label: "Lose Ware (Obst/Gemüse)" },
                  { value: "bedientheke", label: "Bedientheke (Käse/Fleisch/Fisch)" },
                ]}
              />

              {/* Produktdaten */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FInput label="EAN / PLU Nummer" value={form.ean} onChange={set("ean")} />
                <FInput label="Artikel-Nr. (falls keine EAN/PLU)" value={form.artikelNr} onChange={set("artikelNr")} />
              </div>
              <FInput
                label={`Verkehrsbezeichnung${form.probentyp === "lose_ware" ? " (Ursprung ergänzen)" : ""}`}
                value={form.verkehrsbezeichnung}
                onChange={set("verkehrsbezeichnung")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FInput label="MHD / Verbrauchsdatum" value={form.mhd} onChange={set("mhd")} />
                <FInput label="Losnummer / Charge" value={form.losnummer} onChange={set("losnummer")} />
                <FInput label="Füllmenge / Gewicht" value={form.fuellmenge} onChange={set("fuellmenge")} />
              </div>
              <FInput label="Angegebener Hersteller" value={form.hersteller} onChange={set("hersteller")} />

              {/* Weiterleitung */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/30">
                <FInput label="Durchschrift gefaxt durch (Name)" value={form.durchschriftGefaxtDurch} onChange={set("durchschriftGefaxtDurch")} />
                <FInput label="Gefaxt am" value={form.durchschriftGefaxtAm} onChange={set("durchschriftGefaxtAm")} />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Weiterleitung an EDEKA QM-Abteilung
                </p>
                <p className="text-xs text-amber-800">
                  <strong>Ausgefüllten Probenahmebogen und amtlichen Durchschlag</strong> bitte umgehend weiterleiten an die QM-Abteilung der EDEKA Südbayern mbH.
                </p>

                {current ? (
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
                  <p className="text-xs text-amber-700">Bitte erst speichern, um per E-Mail zu senden.</p>
                )}

                <div className="flex flex-wrap gap-3 border-t border-amber-200 pt-2 text-xs text-amber-700">
                  <span>📠 Fax: <strong>08458/62-510</strong></span>
                  <span>|</span>
                  <span>✉️ <strong>qm.suedbayern@edeka.de</strong></span>
                </div>
                <p className="text-xs text-amber-700">Der Hersteller wird von der Abteilung QM informiert.</p>
              </div>
            </SectionCard>

            {/* ===== 3.22-2 Probenübergabeprotokoll (nur bei Gegenprobe hinterlassen) ===== */}
            {hatGegenprobe && (
              <SectionCard
                title="Probenübergabeprotokoll (3.22-2)"
                subtitle="Ausgefüllt wenn die Gegenprobe/Zweitprobe an einen Abholer übergeben wurde"
                icon={<Send className="w-4 h-4" />}
              >
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 font-medium">
                  Dieser Abschnitt erscheint, weil eine Gegenprobe/Zweitprobe hinterlassen wurde. Bitte Abholer- und Firmendaten sowie Unterschriften erfassen.
                </div>

                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Information zum Abholer</p>
                <FInput label="Name des Abholers / des Fahrers" value={form.abholerName} onChange={set("abholerName")} />

                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-2">Firma des Abholers</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FInput label="Name der Firma" value={form.abholerFirmaName} onChange={set("abholerFirmaName")} />
                  <FInput label="Straße" value={form.abholerFirmaStrasse} onChange={set("abholerFirmaStrasse")} />
                  <FInput label="Postfach" value={form.abholerFirmaPostfach} onChange={set("abholerFirmaPostfach")} />
                  <FInput label="PLZ, Ort" value={form.abholerFirmaPlzOrt} onChange={set("abholerFirmaPlzOrt")} />
                </div>

                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-2">Probendaten</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FInput label="Amtliche Probennummer" value={form.amtlicheProbennummer} onChange={set("amtlicheProbennummer")} />
                  <FInput label="Siegeldatum" value={form.siegeldatum} onChange={set("siegeldatum")} />
                  <FInput label="Artikelbezeichnung" value={form.uebergabeArtikel} onChange={set("uebergabeArtikel")} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FInput label="Gegenprobe abgeholt am" value={form.gegenprobeAbgeholtAm} onChange={set("gegenprobeAbgeholtAm")} />
                  <FInput label="Abgeholt durch" value={form.gegenprobeAbgeholtDurch} onChange={set("gegenprobeAbgeholtDurch")} />
                </div>
                <FInput label="Ort, Datum (Übergabe)" value={form.uebergabeOrtDatum} onChange={set("uebergabeOrtDatum")} />

                <div className="bg-muted/20 border border-border/40 rounded-xl p-4 text-xs text-muted-foreground italic">
                  Hiermit garantiere ich (der Abholer / der Fahrer), die amtlich versiegelte Gegenprobe/Zweitprobe mit der oben stehenden Probennummer an die vom Auftraggeber angegebene Adresse zu liefern. Die oben genannte Probe wird nur zum Sinn der Untersuchung abgeholt und sachgerecht behandelt.
                </div>

                <UnterschriftPad
                  label="Unterschrift Abholer / Fahrer"
                  value={form.unterschriftAbholerDigital}
                  onChange={(v) => setForm((p) => ({ ...p, unterschriftAbholerDigital: v }))}
                  height={140}
                />
                <UnterschriftPad
                  label="Unterschrift Markt-Mitarbeiter/in (Probe übergeben durch)"
                  value={form.unterschriftMitarbeiterDigital}
                  onChange={(v) => setForm((p) => ({ ...p, unterschriftMitarbeiterDigital: v }))}
                  height={140}
                />
              </SectionCard>
            )}

            {/* ===== Amtliches Dokument Foto ===== */}
            <SectionCard
              title="Amtliches Dokument der Behörde"
              subtitle="Durchschlag / Probenentnahmeschein der Lebensmittelüberwachung fotografieren und hier ablegen"
              icon={<Camera className="w-4 h-4" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                {[
                  { nr: "1", title: "Dokument erhalten", text: "Die Behörde lässt einen Durchschlag / Probenentnahmeschein zurück" },
                  { nr: "2", title: "Fotografieren", text: "Dokument fotografieren und hier hochladen" },
                  { nr: "3", title: "6 Monate aufbewahren", text: "Original 6 Monate im Markt aufbewahren (zurückgelassene Probe am Sperrplatz sperren)" },
                ].map((s) => (
                  <div key={s.nr} className="flex gap-2 p-3 bg-[#1a3a6b]/5 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-[#1a3a6b] text-white text-xs font-bold flex items-center justify-center shrink-0">{s.nr}</div>
                    <div>
                      <div className="text-xs font-bold text-foreground mb-0.5">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {form.amtlichesDokumentFoto ? (
                <div className="relative inline-block">
                  <img src={form.amtlichesDokumentFoto} alt="Amtliches Dokument" className="max-h-64 rounded-xl border border-border/60 object-contain" />
                  <button
                    onClick={() => set("amtlichesDokumentFoto")("")}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Dokument gespeichert
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => fotoRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border/60 rounded-xl text-sm text-muted-foreground hover:border-[#1a3a6b]/40 hover:text-[#1a3a6b] hover:bg-[#1a3a6b]/5 transition-all w-full justify-center"
                >
                  <ImagePlus className="w-4 h-4" /> Dokument fotografieren oder aus Galerie wählen
                </button>
              )}
              <input ref={fotoRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} className="hidden" />

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <p className="font-bold flex items-center gap-1.5 mb-1"><Mail className="w-3.5 h-3.5" /> Weiterleitung an EDEKA QM-Abteilung</p>
                <p>Probenahmebogen + Durchschlag sofort nach Probeentnahme weiterleiten:<br />
                  <strong>📠 Fax: 08458/62-510</strong> &nbsp;|&nbsp; <strong>✉️ qm.suedbayern@edeka.de</strong></p>
                <p className="text-amber-700 mt-1">Zurückgelassene Probe auf Sperrplatz sperren und <strong>6 Monate</strong> aufbewahren.</p>
              </div>
            </SectionCard>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setView("list")}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Zurück
              </button>

              <div className="flex-1" />

              {/* Druck-Menü */}
              <div className="relative">
                <button
                  onClick={() => setShowDruckMenu((p) => !p)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#1a3a6b]/30 text-[#1a3a6b] rounded-xl text-sm font-semibold hover:bg-[#1a3a6b]/5 transition-colors"
                >
                  <Printer className="w-4 h-4" /> Drucken
                </button>
                {showDruckMenu && (
                  <div className="absolute right-0 bottom-12 bg-white rounded-xl border border-border/60 shadow-xl z-20 w-60 overflow-hidden">
                    <button
                      onClick={handlePrint322_1}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/40 border-b border-border/30"
                    >
                      🧪 Probenahmebogen (3.22-1)
                    </button>
                    {hatGegenprobe && (
                      <button
                        onClick={() => { setShowDruckMenu(false); setTimeout(() => window.print(), 50); }}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/40"
                      >
                        📦 Übergabeprotokoll (3.22-2)
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isAdmin && current && !deleteConfirm && (
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
                {saving ? "Speichert…" : saved ? "Gespeichert" : "Speichern"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Entwurf-Abfrage-Modal */}
      {showDraftPrompt && pendingDraft && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">📋</div>
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Nicht gespeicherter Entwurf gefunden</h2>
                <p className="text-sm text-muted-foreground">Eine angefangene Probeentnahme wurde gefunden. Möchten Sie dort weitermachen?</p>
              </div>
            </div>
            {(pendingDraft.datumEntnahme || pendingDraft.behoerdeBezeichnung) && (
              <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                {pendingDraft.datumEntnahme && <div><span className="font-semibold">Datum:</span> {pendingDraft.datumEntnahme}</div>}
                {pendingDraft.behoerdeBezeichnung && <div><span className="font-semibold">Behörde:</span> {pendingDraft.behoerdeBezeichnung}</div>}
                {pendingDraft.verkehrsbezeichnung && <div><span className="font-semibold">Artikel:</span> {pendingDraft.verkehrsbezeichnung}</div>}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setForm(pendingDraft!); setPendingDraft(null); setShowDraftPrompt(false); setCurrent(null); setView("form"); setDraftRestored(true); }}
                className="w-full px-4 py-3 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] transition-colors"
              >
                📋 Entwurf wiederherstellen
              </button>
              <button
                onClick={() => { localStorage.removeItem(DRAFT_KEY); setPendingDraft(null); setShowDraftPrompt(false); setCurrent(null); setForm(emptyForm()); setView("form"); }}
                className="w-full px-4 py-2.5 border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                Neu beginnen (Entwurf verwerfen)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      <PinVerification
        open={showPinModal}
        onVerified={(_userId, userName, _initials) => {
          setVerifiedUserName(userName);
          setForm((p) => ({ ...p, ansprechpartner: userName }));
          setShowPinModal(false);
        }}
        onCancel={() => setShowPinModal(false)}
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          body > *:not(#probe-print-root) { display: none !important; }
          #probe-print-root { display: block !important; }
          @page { margin: 10mm; size: A4 portrait; }
        }
      `}</style>
    </AppLayout>
  );
}
