import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ClipboardList, Users, FileText, CalendarClock, MessageSquare,
  Plus, Loader2, Save, X, Camera, ChevronDown, ChevronUp,
  Trash2, ExternalLink, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

type Kategorie = "marktbesprechung" | "hygienebelehrung" | "teammeeting" | "abteilungsrunde" | "sonstige";

interface Besprechungsdokument {
  id: number;
  tenantId: number;
  kategorie: Kategorie;
  datum: string;
  leiter: string;
  thema: string;
  teilnehmerAnzahl: string;
  naechsteBesprechung: string;
  dokumentBase64: string;
  notizen: string;
  createdAt: string;
}

const TABS: {
  key: Kategorie;
  label: string;
  kurzLabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  hinweis?: string;
}[] = [
  {
    key: "marktbesprechung",
    label: "Marktbesprechungen",
    kurzLabel: "Markt",
    icon: <ClipboardList className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    hinweis: "Regelmäßige Marktbesprechungen dokumentieren Entscheidungen und Aufgabenverteilungen. Protokolle sind mindestens 1 Jahr aufzubewahren.",
  },
  {
    key: "hygienebelehrung",
    label: "Hygienebelehrungen",
    kurzLabel: "Hygiene",
    icon: <Users className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    hinweis: "§43 IfSG / LMHV: Hygienebelehrungen sind nach § 43 IfSG jährlich durchzuführen. Teilnahmenachweis ist Pflicht.",
  },
  {
    key: "teammeeting",
    label: "Teammeetings",
    kurzLabel: "Team",
    icon: <MessageSquare className="w-4 h-4" />,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    hinweis: undefined,
  },
  {
    key: "abteilungsrunde",
    label: "Abteilungsrunden",
    kurzLabel: "Abteilung",
    icon: <CalendarClock className="w-4 h-4" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    hinweis: undefined,
  },
  {
    key: "sonstige",
    label: "Sonstige Besprechungen",
    kurzLabel: "Sonstige",
    icon: <FileText className="w-4 h-4" />,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    hinweis: undefined,
  },
];

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

function getStatus(naechsteBesprechung: string | null) {
  if (!naechsteBesprechung) return "ok";
  const d = new Date(naechsteBesprechung);
  if (d < new Date()) return "abgelaufen";
  if (d < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)) return "bald";
  return "ok";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "abgelaufen") return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1 whitespace-nowrap">
      <AlertCircle className="w-3 h-3" /> Fällig
    </span>
  );
  if (status === "bald") return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1 whitespace-nowrap">
      <Clock className="w-3 h-3" /> Bald fällig
    </span>
  );
  return null;
}

function DokumentForm({ kategorie, onSave, onCancel }: {
  kategorie: Kategorie;
  onSave: (fields: Partial<Besprechungsdokument>) => Promise<void>;
  onCancel: () => void;
}) {
  const tab = TABS.find((t) => t.key === kategorie)!;
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [leiter, setLeiter] = useState("");
  const [thema, setThema] = useState("");
  const [teilnehmerAnzahl, setTeilnehmerAnzahl] = useState("");
  const [naechsteBesprechung, setNaechsteBesprechung] = useState("");
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
    if (!datum.trim()) return;
    setSaving(true);
    try {
      await onSave({ kategorie, datum, leiter: leiter.trim(), thema: thema.trim(), teilnehmerAnzahl: teilnehmerAnzahl.trim(), naechsteBesprechung, dokumentBase64: dokument, notizen: notizen.trim() });
    } finally { setSaving(false); }
  };

  return (
    <div className={`${tab.bgColor} border ${tab.borderColor} rounded-2xl p-5 space-y-4`}>
      <p className={`text-sm font-bold ${tab.color}`}>Neuer Eintrag — {tab.label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datum *</label>
          <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Besprechungsleiter</label>
          <input value={leiter} onChange={(e) => setLeiter(e.target.value)} placeholder="Name des Leiters"
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Anzahl Teilnehmer</label>
          <input type="number" min="0" value={teilnehmerAnzahl} onChange={(e) => setTeilnehmerAnzahl(e.target.value)} placeholder="z.B. 8"
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nächste Besprechung</label>
          <input type="date" value={naechsteBesprechung} onChange={(e) => setNaechsteBesprechung(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Thema / Agenda</label>
        <textarea value={thema} onChange={(e) => setThema(e.target.value)} rows={3}
          placeholder="Themen, Beschlüsse, wichtige Punkte..."
          className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all resize-none" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ergebnisse / Notizen</label>
        <input value={notizen} onChange={(e) => setNotizen(e.target.value)} placeholder="Offene Punkte, Maßnahmen, Verantwortliche..."
          className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Protokoll (Foto, Screenshot oder PDF)</label>
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
              <img src={dokument} alt="Protokoll" className="w-full max-h-56 object-contain rounded-xl border border-border/60" />
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
        <button onClick={handleSubmit} disabled={saving || !datum.trim()}
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

function DokumentKarte({ d, tab, onDelete, isAdmin }: {
  d: Besprechungsdokument; tab: typeof TABS[0]; onDelete: () => void; isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = getStatus(d.naechsteBesprechung);
  const isPdf = d.dokumentBase64?.startsWith("data:application/pdf");

  const datumFormatiert = d.datum
    ? new Date(d.datum + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : d.datum;

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden ${status === "abgelaufen" ? "border-red-200" : status === "bald" ? "border-amber-200" : "border-border/40"}`}>
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status === "abgelaufen" ? "bg-red-100" : status === "bald" ? "bg-amber-100" : tab.bgColor}`}>
          <span className={status === "abgelaufen" ? "text-red-500" : status === "bald" ? "text-amber-500" : tab.color}>{tab.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{datumFormatiert}</p>
          {d.leiter && <p className="text-xs text-muted-foreground mt-0.5">Leiter: {d.leiter}</p>}
          {d.thema && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.thema}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {d.naechsteBesprechung && <StatusBadge status={status} />}
          {d.naechsteBesprechung && status === "ok" && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3" /> {new Date(d.naechsteBesprechung + "T00:00:00").toLocaleDateString("de-DE")}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/30">
          <div className="grid grid-cols-2 gap-3 pt-4">
            {d.teilnehmerAnzahl && (
              <div className="bg-muted/30 rounded-xl px-3 py-2">
                <p className="text-xs text-muted-foreground">Teilnehmer</p>
                <p className="text-sm font-bold">{d.teilnehmerAnzahl} Personen</p>
              </div>
            )}
            {d.naechsteBesprechung && (
              <div className={`rounded-xl px-3 py-2 ${status === "abgelaufen" ? "bg-red-50" : status === "bald" ? "bg-amber-50" : "bg-green-50"}`}>
                <p className={`text-xs ${status === "abgelaufen" ? "text-red-500" : status === "bald" ? "text-amber-600" : "text-green-600"}`}>
                  {status === "abgelaufen" ? "Fällig seit" : "Nächste Besprechung"}
                </p>
                <p className={`text-sm font-bold ${status === "abgelaufen" ? "text-red-700" : status === "bald" ? "text-amber-700" : "text-green-700"}`}>
                  {new Date(d.naechsteBesprechung + "T00:00:00").toLocaleDateString("de-DE")}
                </p>
              </div>
            )}
          </div>

          {d.thema && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Thema / Agenda</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{d.thema}</p>
            </div>
          )}

          {d.dokumentBase64 ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Protokoll-Dokument</p>
              {isPdf ? (
                <a href={d.dokumentBase64} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div><p className="text-sm font-bold text-red-700">PDF anzeigen</p><p className="text-xs text-red-500">Klicken zum Öffnen</p></div>
                  <ExternalLink className="w-4 h-4 text-red-400 ml-auto" />
                </a>
              ) : (
                <img src={d.dokumentBase64} alt="Protokoll" className="w-full max-h-80 object-contain rounded-xl border border-border/40" />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-3">
              <Camera className="w-4 h-4" /> Kein Dokument hinterlegt
            </div>
          )}

          {d.notizen && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Ergebnisse / Notizen</p>
              <p className="text-sm text-foreground">{d.notizen}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">Hinzugefügt: {new Date(d.createdAt).toLocaleDateString("de-DE")}</p>

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

export default function BesprechungsDokumente() {
  const { adminSession } = useAppStore();
  const isAdmin = !!adminSession;

  const [aktiveTab, setAktiveTab] = useState<Kategorie>("marktbesprechung");
  const [daten, setDaten] = useState<Record<Kategorie, Besprechungsdokument[]>>({
    marktbesprechung: [], hygienebelehrung: [], teammeeting: [], abteilungsrunde: [], sonstige: [],
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadKategorie = useCallback(async (k: Kategorie) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/besprechungsdokumente?tenantId=1&kategorie=${k}`);
      const rows = await res.json();
      setDaten((p) => ({ ...p, [k]: Array.isArray(rows) ? rows.sort((a: Besprechungsdokument, b: Besprechungsdokument) => b.datum.localeCompare(a.datum)) : [] }));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadKategorie(aktiveTab); }, [aktiveTab, loadKategorie]);

  const handleTabChange = (k: Kategorie) => { setAktiveTab(k); setShowForm(false); };

  const handleSave = async (fields: Partial<Besprechungsdokument>) => {
    const res = await fetch(`${BASE}/besprechungsdokumente`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: 1, ...fields }),
    });
    const neu = await res.json();
    setDaten((p) => ({
      ...p,
      [aktiveTab]: [neu, ...p[aktiveTab]].sort((a, b) => b.datum.localeCompare(a.datum)),
    }));
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/besprechungsdokumente/${id}`, { method: "DELETE" });
    setDaten((p) => ({ ...p, [aktiveTab]: p[aktiveTab].filter((d) => d.id !== id) }));
  };

  const tab = TABS.find((t) => t.key === aktiveTab)!;
  const liste = daten[aktiveTab];
  const abgelaufen = liste.filter((d) => getStatus(d.naechsteBesprechung) === "abgelaufen").length;
  const bald = liste.filter((d) => getStatus(d.naechsteBesprechung) === "bald").length;
  const gesamtFaellig = Object.values(daten).flat().filter((d) => getStatus(d.naechsteBesprechung) === "abgelaufen").length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4 pb-10">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a3a6b]/10 rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#1a3a6b]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">1.10 Besprechungsprotokoll</h1>
              <p className="text-xs text-muted-foreground">Dokumentation aller Besprechungen und Belehrungen</p>
            </div>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Hinzufügen
            </button>
          )}
        </div>

        {gesamtFaellig > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm font-bold text-red-700">
              {gesamtFaellig} {gesamtFaellig === 1 ? "Besprechung ist" : "Besprechungen sind"} fällig
            </p>
          </div>
        )}

        <div className="grid grid-cols-5 gap-1 p-1 bg-muted/40 rounded-2xl border border-border/30">
          {TABS.map((t) => {
            const tabDaten = daten[t.key];
            const warn = tabDaten.filter((d) => getStatus(d.naechsteBesprechung) === "abgelaufen").length;
            const isActive = aktiveTab === t.key;
            return (
              <button key={t.key} onClick={() => handleTabChange(t.key)}
                className={`relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                  isActive ? "bg-white shadow-sm border border-border/40 " + t.color : "text-muted-foreground hover:text-foreground"
                }`}>
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

        {(abgelaufen > 0 || bald > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {abgelaufen > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700">{abgelaufen} fällig</p>
                  <p className="text-xs text-red-500">Besprechung planen</p>
                </div>
              </div>
            )}
            {bald > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-700">{bald} bald fällig</p>
                  <p className="text-xs text-amber-600">Innerhalb 60 Tagen</p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab.hinweis && (
          <div className={`flex items-start gap-3 px-4 py-3 ${tab.bgColor} border ${tab.borderColor} rounded-2xl`}>
            <ClipboardList className={`w-4 h-4 mt-0.5 shrink-0 ${tab.color}`} />
            <p className={`text-xs leading-relaxed ${tab.color}`}>{tab.hinweis}</p>
          </div>
        )}

        {showForm && (
          <DokumentForm kategorie={aktiveTab} onSave={handleSave} onCancel={() => setShowForm(false)} />
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : liste.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Noch keine Einträge in dieser Kategorie</p>
            <p className="text-xs text-muted-foreground mt-1">Klicken Sie auf "Hinzufügen" um das erste Protokoll zu erfassen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {liste.map((d) => (
              <DokumentKarte key={d.id} d={d} tab={tab} onDelete={() => handleDelete(d.id)} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
