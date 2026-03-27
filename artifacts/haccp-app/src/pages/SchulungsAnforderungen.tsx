import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  GraduationCap, Plus, Pencil, Trash2, Save, X, AlertTriangle,
  CheckCircle2, ChevronLeft, Loader2, ToggleRight, ToggleLeft,
  Users, ShieldAlert, AlarmClock, UserCheck, ChevronDown,
  GitBranch, Award, BookOpen, Search, Link2, CalendarCheck, EyeOff,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

const GRUPPEN_OPTS = [
  { value: "gesamter_markt", label: "Gesamter Markt", color: "text-violet-700", bg: "bg-violet-100 border-violet-200" },
  { value: "markt",          label: "Markt",          color: "text-sky-700",    bg: "bg-sky-100 border-sky-200" },
  { value: "metzgerei",      label: "Metzgerei",      color: "text-orange-700", bg: "bg-orange-100 border-orange-200" },
];
const INTERVALL_OPTS = [
  { label: "Monatl.", value: 1 }, { label: "Vierteljährl.", value: 3 },
  { label: "Halbjährl.", value: 6 }, { label: "Jährlich", value: 12 },
  { label: "Alle 2 J.", value: 24 }, { label: "Alle 3 J.", value: 36 },
];
const INTERVALL_LABEL: Record<number, string> = {
  1: "Monatlich", 3: "Vierteljährlich", 6: "Halbjährlich",
  12: "Jährlich", 24: "Alle 2 Jahre", 36: "Alle 3 Jahre",
};

interface Mitarbeiter { id: number; name: string; gruppe: string; }
interface TrainingTopic { id: number; title: string; responsible: string; }

interface Pflicht {
  id: number; schulung_kategorie: string; bezeichnung: string;
  gueltige_gruppen: string[]; intervall_monate: number; is_active: boolean;
  typ: "schulung" | "bescheinigung"; zuordnung_modus: "gruppe" | "personen" | "auto";
  subbereich: string | null; parent_pflicht_id: number | null; person_spezifisch: boolean;
  pruef_modus: "zeitbasiert" | "vorhanden";
  training_topic_id: number | null; training_topic_title: string | null;
  personen: { userId: number; name: string; gruppe: string }[];
}

interface BeschComplianceEntry {
  pflichtId: number; bezeichnung: string; kategorie: string;
  intervallMonate: number; zuordnungModus: string; pruefModus: string;
  personen: { userId: number; name: string }[];
  entries: { name: string; gruppe: string | null; gueltigBis: string | null; status: string; ausnahme: any }[];
  hasProblems: boolean; problemCount: number; warningCount: number;
}

interface SchulComplianceEntry {
  employeeId: number; name: string; gruppe: string | null;
  hasProblems: boolean; problemCount: number; warningCount: number;
  trainings: {
    pflichtId: number; bezeichnung: string; status: string;
    naechsteSchulung: string | null; zuordnungModus: string; parentPflichtId: number | null;
    pruefModus: string; trainingTopicTitle: string | null;
    ausnahme: { id: number; begruendung: string } | null;
  }[];
}

// ── Combobox ─────────────────────────────────────────────────────────────────
function Combobox({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = value ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase())) : options;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1">
        <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)} placeholder={placeholder} autoComplete="off"
          className="flex-1 px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
        <button type="button" onClick={() => setOpen((p) => !p)}
          className="p-2 rounded-lg border border-border/60 bg-white hover:bg-muted/40">
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border/60 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {(filtered.length > 0 ? filtered : options).map((o) => (
            <button key={o} type="button" onClick={() => { onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/40 ${value === o ? "font-semibold text-[#1a3a6b]" : ""}`}>
              {o}
            </button>
          ))}
          {value && !options.includes(value) && (
            <button type="button" onClick={() => { onChange(value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted/40 border-t border-border/30">
              „{value}" neu anlegen
            </button>
          )}
          {options.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">Noch keine Einträge</p>}
        </div>
      )}
    </div>
  );
}

// ── Person-Picker ────────────────────────────────────────────────────────────
function PersonPicker({ mitarbeiter, selected, onChange }: {
  mitarbeiter: Mitarbeiter[]; selected: number[]; onChange: (ids: number[]) => void;
}) {
  const [filter, setFilter] = useState("");
  const shown = mitarbeiter.filter((m) => m.name.toLowerCase().includes(filter.toLowerCase()));
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const allSelected = mitarbeiter.length > 0 && mitarbeiter.every((m) => selected.includes(m.id));

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-muted/20">
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Mitarbeiter suchen…"
          className="flex-1 bg-transparent text-sm focus:outline-none" />
        <button type="button" onClick={() => onChange(allSelected ? [] : mitarbeiter.map((m) => m.id))}
          className="text-xs font-semibold text-[#1a3a6b] hover:underline shrink-0">
          {allSelected ? "Alle abwählen" : "Alle"}
        </button>
      </div>
      <div className="max-h-44 overflow-y-auto divide-y divide-border/20">
        {shown.map((m) => {
          const g = GRUPPEN_OPTS.find((x) => x.value === m.gruppe);
          const checked = selected.includes(m.id);
          return (
            <label key={m.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/20 ${checked ? "bg-[#1a3a6b]/5" : ""}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(m.id)} className="rounded" />
              <span className="flex-1 text-sm font-medium">{m.name}</span>
              {g && <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${g.bg} ${g.color}`}>{g.label}</span>}
            </label>
          );
        })}
        {shown.length === 0 && <p className="px-3 py-3 text-xs text-muted-foreground">Keine Mitarbeiter gefunden</p>}
      </div>
    </div>
  );
}

// ── Training-Topic-Picker ────────────────────────────────────────────────────
function TopicPicker({ topics, selectedId, onChange }: {
  topics: TrainingTopic[]; selectedId: number | null; onChange: (id: number | null) => void;
}) {
  const [filter, setFilter] = useState("");
  const shown = topics.filter((t) => t.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-muted/20">
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Thema suchen…"
          className="flex-1 bg-transparent text-sm focus:outline-none" />
        {selectedId && (
          <button type="button" onClick={() => onChange(null)} className="text-xs font-semibold text-red-500 hover:underline shrink-0">
            Entfernen
          </button>
        )}
      </div>
      <div className="max-h-52 overflow-y-auto divide-y divide-border/20">
        {shown.map((t) => (
          <button key={t.id} type="button" onClick={() => onChange(t.id === selectedId ? null : t.id)}
            className={`w-full text-left px-3 py-2.5 hover:bg-muted/20 transition-colors ${selectedId === t.id ? "bg-[#1a3a6b]/5 border-l-2 border-[#1a3a6b]" : ""}`}>
            <p className="text-xs font-semibold text-foreground leading-snug">{t.title}</p>
            {t.responsible && <p className="text-xs text-muted-foreground mt-0.5">{t.responsible}</p>}
          </button>
        ))}
        {shown.length === 0 && <p className="px-3 py-3 text-xs text-muted-foreground">Kein Thema gefunden</p>}
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function GruppePill({ value }: { value: string }) {
  const g = GRUPPEN_OPTS.find((x) => x.value === value);
  if (!g) return null;
  return <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${g.bg} ${g.color}`}>{g.label}</span>;
}

function StatusChip({ status }: { status: string }) {
  const m: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    ok:          { label: "OK",         color: "text-green-700", bg: "bg-green-100 border-green-200",  icon: <CheckCircle2 className="w-3 h-3" /> },
    bald_fällig: { label: "Bald fällig",color: "text-amber-700", bg: "bg-amber-100 border-amber-200",  icon: <AlarmClock className="w-3 h-3" /> },
    überfällig:  { label: "Überfällig", color: "text-red-700",   bg: "bg-red-100 border-red-200",      icon: <AlertTriangle className="w-3 h-3" /> },
    fehlend:     { label: "Fehlend",    color: "text-slate-600", bg: "bg-slate-100 border-slate-200",  icon: <X className="w-3 h-3" /> },
    ausnahme:    { label: "Ausnahme",   color: "text-gray-500",  bg: "bg-gray-100 border-gray-200",    icon: <ShieldAlert className="w-3 h-3" /> },
  };
  const c = m[status] || m.fehlend;
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>{c.icon}{c.label}</span>;
}

function ZuordnungBadge({ modus }: { modus: string }) {
  if (modus === "personen") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700">
      <UserCheck className="w-3 h-3" /> Bestimmte Personen
    </span>
  );
  if (modus === "auto") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 border border-teal-200 text-teal-700">
      <Award className="w-3 h-3" /> Aus Ordner
    </span>
  );
  return null;
}

// ── Pflicht-Form ─────────────────────────────────────────────────────────────
function PflichtForm({ initial, typ: fixedTyp, parentId, kategorien, subbereiche, mitarbeiter, topics, onSave, onCancel }: {
  initial?: Partial<Pflicht>; typ?: "schulung" | "bescheinigung"; parentId?: number;
  kategorien: string[]; subbereiche: string[]; mitarbeiter: Mitarbeiter[]; topics: TrainingTopic[];
  onSave: (data: any) => Promise<void>; onCancel: () => void;
}) {
  const { adminSession } = useAppStore();
  const tenantId = adminSession?.tenantId || 1;

  const [typ, setTyp] = useState<"schulung"|"bescheinigung">(fixedTyp || initial?.typ || "schulung");
  const [kategorie, setKategorie] = useState(initial?.schulung_kategorie || "");
  const [bezeichnung, setBezeichnung] = useState(initial?.bezeichnung || "");
  const [modus, setModus] = useState<"gruppe"|"personen"|"auto">(initial?.zuordnung_modus || "gruppe");
  const [gruppen, setGruppen] = useState<string[]>(initial?.gueltige_gruppen || []);
  const [selectedPersonen, setSelectedPersonen] = useState<number[]>((initial?.personen || []).map((p) => p.userId));
  const [subbereich, setSubbereich] = useState(initial?.subbereich || "");
  const [intervall, setIntervall] = useState(initial?.intervall_monate || 12);
  const [pruefModus, setPruefModus] = useState<"zeitbasiert"|"vorhanden">(initial?.pruef_modus || "zeitbasiert");
  const [trainingTopicId, setTrainingTopicId] = useState<number|null>(initial?.training_topic_id || null);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedTopic = topics.find((t) => t.id === trainingTopicId);
  const toggleGruppe = (g: string) => setGruppen((p) => p.includes(g) ? p.filter((x) => x !== g) : [...p, g]);

  const handleSave = async () => {
    if (!bezeichnung.trim()) { setError("Anzeigename ausfüllen."); return; }
    if (!trainingTopicId && !kategorie.trim()) { setError("Kategorie oder Schulungsthema wählen."); return; }
    if (modus === "gruppe" && gruppen.length === 0) { setError("Mindestens eine Gruppe wählen."); return; }
    if (modus === "personen" && selectedPersonen.length === 0) { setError("Mindestens eine Person auswählen."); return; }
    setSaving(true); setError("");
    await onSave({
      tenantId,
      schulungKategorie: kategorie.trim() || selectedTopic?.title || "",
      bezeichnung: bezeichnung.trim(),
      gueltigeGruppen: modus === "gruppe" ? gruppen : [],
      intervallMonate: intervall,
      subbereich: subbereich.trim() || null,
      typ, zuordnungModus: modus, pruefModus,
      trainingTopicId: trainingTopicId || null,
      personSpezifisch: modus === "auto",
      parentPflichtId: parentId || null,
      isActive: initial?.is_active ?? true,
      selectedPersonen,
    });
    setSaving(false);
  };

  return (
    <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-4">
      <p className="text-sm font-bold">{initial?.id ? "Bearbeiten" : (parentId ? "Unterpunkt hinzufügen" : "Neu anlegen")}</p>

      {/* Typ */}
      {!fixedTyp && !parentId && (
        <div className="flex gap-2">
          <button type="button" onClick={() => setTyp("schulung")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${typ === "schulung" ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "bg-white text-muted-foreground border-border/60"}`}>
            <BookOpen className="w-3.5 h-3.5" /> Schulung
          </button>
          <button type="button" onClick={() => setTyp("bescheinigung")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${typ === "bescheinigung" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-muted-foreground border-border/60"}`}>
            <Award className="w-3.5 h-3.5" /> Bescheinigung
          </button>
        </div>
      )}

      {/* Schulungsthema verknüpfen (nur bei Schulung) */}
      {typ === "schulung" && !parentId && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Link2 className="w-3 h-3" /> Schulungsthema aus Protokoll verknüpfen
              <span className="font-normal normal-case text-muted-foreground">(optional)</span>
            </label>
            <button type="button" onClick={() => setShowTopicPicker((x) => !x)}
              className="text-xs font-semibold text-[#1a3a6b] hover:underline">
              {showTopicPicker ? "Schließen" : (trainingTopicId ? "Ändern" : "Auswählen")}
            </button>
          </div>
          {selectedTopic && !showTopicPicker && (
            <div className="flex items-start gap-2 p-2.5 bg-[#1a3a6b]/5 border border-[#1a3a6b]/20 rounded-lg">
              <Link2 className="w-3.5 h-3.5 text-[#1a3a6b] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground leading-snug">{selectedTopic.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Compliance wird aus Schulungsprotokoll berechnet.</p>
              </div>
              <button type="button" onClick={() => setTrainingTopicId(null)} className="text-muted-foreground hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {showTopicPicker && (
            <TopicPicker topics={topics} selectedId={trainingTopicId}
              onChange={(id) => { setTrainingTopicId(id); const t = topics.find((x) => x.id === id); if (t && !bezeichnung) setBezeichnung(t.title.slice(0, 60)); setShowTopicPicker(false); }} />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kategorie</label>
          <Combobox value={kategorie} onChange={setKategorie} options={kategorien} placeholder="z.B. Hygieneschulung" />
          <p className="text-xs text-muted-foreground">Muss mit Kategorie im Schulungsordner übereinstimmen.</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Anzeigename</label>
          <input value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} placeholder="z.B. Jährliche Hygieneschulung"
            className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
        </div>
      </div>

      {/* Prüf-Modus */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prüfmodus</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPruefModus("zeitbasiert")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${pruefModus === "zeitbasiert" ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "bg-white text-muted-foreground border-border/60"}`}>
            <CalendarCheck className="w-3.5 h-3.5" /> Zeitbasiert
          </button>
          <button type="button" onClick={() => setPruefModus("vorhanden")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${pruefModus === "vorhanden" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-muted-foreground border-border/60"}`}>
            <EyeOff className="w-3.5 h-3.5" /> Nur Vorhandensein
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {pruefModus === "zeitbasiert" ? "Prüft ob die Schulung innerhalb des Intervalls stattgefunden hat." : "Prüft nur ob überhaupt ein Nachweis vorhanden ist — kein Ablaufdatum."}
        </p>
      </div>

      {/* Zuordnungsmodus */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zuordnung</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "gruppe",   icon: <Users className="w-3.5 h-3.5" />,     label: "Gruppe",    cls: "bg-[#1a3a6b] text-white border-[#1a3a6b]" },
            { key: "personen", icon: <UserCheck className="w-3.5 h-3.5" />, label: "Personen",  cls: "bg-indigo-600 text-white border-indigo-600" },
            { key: "auto",     icon: <Award className="w-3.5 h-3.5" />,     label: "Aus Ordner",cls: "bg-teal-600 text-white border-teal-600" },
          ].map(({ key, icon, label, cls }) => (
            <button key={key} type="button" onClick={() => setModus(key as any)}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${modus === key ? cls : "bg-white text-muted-foreground border-border/60"}`}>
              {icon} {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {modus === "gruppe" && "Verpflichtend für alle Mitarbeiter der gewählten Gruppen."}
          {modus === "personen" && "Nur die explizit ausgewählten Personen."}
          {modus === "auto" && "Automatisch für jeden, der bereits einen Nachweis in dieser Kategorie hat."}
        </p>
      </div>

      {modus === "gruppe" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gilt für</label>
          <div className="flex flex-wrap gap-2">
            {GRUPPEN_OPTS.map((g) => {
              const active = gruppen.includes(g.value);
              return (
                <button key={g.value} type="button" onClick={() => toggleGruppe(g.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${active ? `${g.bg} ${g.color} border-current` : "bg-white border-border/60 text-muted-foreground"}`}>
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {modus === "personen" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Zugeordnete Personen <span className="font-normal normal-case text-muted-foreground">({selectedPersonen.length} gewählt)</span>
          </label>
          <PersonPicker mitarbeiter={mitarbeiter} selected={selectedPersonen} onChange={setSelectedPersonen} />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Subbereich <span className="font-normal normal-case text-muted-foreground">(optional)</span>
        </label>
        <Combobox value={subbereich} onChange={setSubbereich} options={subbereiche} placeholder="z.B. Feuerwerk, Fleischhygiene" />
      </div>

      {pruefModus === "zeitbasiert" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wiederholungsintervall</label>
          <div className="flex flex-wrap gap-2">
            {INTERVALL_OPTS.map((o) => (
              <button key={o.value} type="button" onClick={() => setIntervall(o.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${intervall === o.value ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "bg-white border-border/60 text-muted-foreground"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3a6b] text-white rounded-lg text-xs font-bold hover:bg-[#2d5aa0] disabled:opacity-40">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Speichern
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-white border border-border/60 rounded-lg text-xs font-semibold text-muted-foreground">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ── Pflicht-Karte ─────────────────────────────────────────────────────────────
function PflichtCard({ p, children, kategorien, subbereiche, mitarbeiter, topics, onUpdate, onDelete, onToggle, onAddChild }: {
  p: Pflicht; children?: Pflicht[];
  kategorien: string[]; subbereiche: string[]; mitarbeiter: Mitarbeiter[]; topics: TrainingTopic[];
  onUpdate: (id: number, data: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggle: (p: Pflicht) => Promise<void>;
  onAddChild: (parentId: number, data: any) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const isDesc = p.typ === "bescheinigung";
  const borderColor = isDesc ? "border-amber-300" : p.zuordnung_modus === "personen" ? "border-indigo-200" : p.zuordnung_modus === "auto" ? "border-teal-200" : "border-border/40";

  return (
    <div className="space-y-1">
      <div className={`bg-white rounded-2xl border-2 overflow-hidden ${p.is_active ? borderColor : "border-slate-200 opacity-60"}`}>
        {editing ? (
          <div className="p-4">
            <PflichtForm initial={p} kategorien={kategorien} subbereiche={subbereiche} mitarbeiter={mitarbeiter} topics={topics}
              onSave={async (d) => { await onUpdate(p.id, d); setEditing(false); }} onCancel={() => setEditing(false)} />
          </div>
        ) : (
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1.5 mb-1">
                  <p className="text-sm font-bold text-foreground">{p.bezeichnung}</p>
                  {isDesc && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700"><Award className="w-3 h-3" /> Bescheinigung</span>}
                  {p.training_topic_title && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1a3a6b]/10 border border-[#1a3a6b]/20 text-[#1a3a6b]">
                      <Link2 className="w-3 h-3" /> Schulungsprotokoll
                    </span>
                  )}
                  {p.pruef_modus === "vorhanden" && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700">
                      <EyeOff className="w-3 h-3" /> Nur Vorhandensein
                    </span>
                  )}
                  <ZuordnungBadge modus={p.zuordnung_modus} />
                  {(children?.length ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700">
                      <GitBranch className="w-3 h-3" /> {children!.length} Unterpkt.
                    </span>
                  )}
                  {!p.is_active && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Inaktiv</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.training_topic_title
                    ? <span className="text-[#1a3a6b]/70 italic truncate block max-w-xs">{p.training_topic_title.slice(0, 70)}{p.training_topic_title.length > 70 ? "…" : ""}</span>
                    : <>Kat: <span className="font-semibold text-foreground">{p.schulung_kategorie}</span></>}
                  {p.subbereich && <> · <span className="font-semibold text-blue-700">{p.subbereich}</span></>}
                  {p.pruef_modus === "zeitbasiert" && <> · {INTERVALL_LABEL[p.intervall_monate] || `${p.intervall_monate}M`}</>}
                </p>
                {p.zuordnung_modus === "gruppe" && p.gueltige_gruppen.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">{p.gueltige_gruppen.map((g) => <GruppePill key={g} value={g} />)}</div>
                )}
                {p.zuordnung_modus === "personen" && p.personen.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.personen.slice(0, 4).map((per) => (
                      <span key={per.userId} className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">{per.name}</span>
                    ))}
                    {p.personen.length > 4 && <span className="text-xs text-muted-foreground px-1">+{p.personen.length - 4}</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!p.parent_pflicht_id && (
                  <button onClick={() => { setAddingSub((x) => !x); setEditing(false); }} title="Unterpunkt"
                    className={`p-1.5 rounded-lg border transition-all ${addingSub ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-white border-border/60 text-muted-foreground hover:border-blue-300 hover:text-blue-600"}`}>
                    <GitBranch className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => onToggle(p)} className="text-muted-foreground hover:text-green-600 transition-colors">
                  {p.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => { setEditing(true); setAddingSub(false); }}
                  className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {confirmDel ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-red-600 font-medium">Löschen?</span>
                    <button onClick={() => onDelete(p.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">Ja</button>
                    <button onClick={() => setConfirmDel(false)} className="px-2 py-1 border rounded text-xs text-muted-foreground">Nein</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDel(true)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {addingSub && (
        <div className="ml-6">
          <PflichtForm parentId={p.id} typ={p.typ} kategorien={kategorien} subbereiche={subbereiche} mitarbeiter={mitarbeiter} topics={topics}
            onSave={async (d) => { await onAddChild(p.id, d); setAddingSub(false); }} onCancel={() => setAddingSub(false)} />
        </div>
      )}

      {(children || []).map((child) => (
        <div key={child.id} className="flex gap-0 ml-6">
          <div className="flex flex-col items-center w-4 shrink-0 pt-3">
            <div className="w-px flex-1 bg-blue-200 ml-2" />
            <div className="w-3 h-px bg-blue-200" />
          </div>
          <div className="flex-1">
            <PflichtCard p={child} kategorien={kategorien} subbereiche={subbereiche} mitarbeiter={mitarbeiter} topics={topics}
              onUpdate={onUpdate} onDelete={onDelete} onToggle={onToggle} onAddChild={onAddChild} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Hauptseite ────────────────────────────────────────────────────────────────
export default function SchulungsAnforderungen() {
  const { adminSession } = useAppStore();
  const tenantId = adminSession?.tenantId || 1;

  const [tab, setTab] = useState<"anforderungen" | "uebersicht">("anforderungen");
  const [uebersichtTyp, setUebersichtTyp] = useState<"schulungen" | "bescheinigungen">("schulungen");
  const [pflichten, setPflichten] = useState<Pflicht[]>([]);
  const [kategorien, setKategorien] = useState<string[]>([]);
  const [subbereiche, setSubbereiche] = useState<string[]>([]);
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [topics, setTopics] = useState<TrainingTopic[]>([]);
  const [schulCompliance, setSchulCompliance] = useState<SchulComplianceEntry[]>([]);
  const [beschCompliance, setBeschCompliance] = useState<BeschComplianceEntry[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingC, setLoadingC] = useState(false);
  const [showFormTyp, setShowFormTyp] = useState<"schulung" | "bescheinigung" | null>(null);

  const reload = useCallback(async () => {
    setLoadingP(true);
    const [pRes, kRes, mRes, tRes] = await Promise.all([
      fetch(`${BASE}/schulungs-pflichten?tenantId=${tenantId}`).then((r) => r.json()),
      fetch(`${BASE}/schulungs-kategorien?tenantId=${tenantId}`).then((r) => r.json()),
      fetch(`${BASE}/mitarbeiter-fuer-picker?tenantId=${tenantId}`).then((r) => r.json()),
      fetch(`${BASE}/schulungs-themen-katalog`).then((r) => r.json()),
    ]);
    setPflichten(pRes);
    setKategorien(kRes.kategorien || []);
    setSubbereiche(kRes.subbereiche || []);
    setMitarbeiter(mRes);
    setTopics(tRes);
    setLoadingP(false);
  }, [tenantId]);

  const loadCompliance = useCallback(async () => {
    setLoadingC(true);
    const [sc, bc] = await Promise.all([
      fetch(`${BASE}/schulungs-compliance?tenantId=${tenantId}`).then((r) => r.json()),
      fetch(`${BASE}/bescheinigungen-compliance?tenantId=${tenantId}`).then((r) => r.json()),
    ]);
    setSchulCompliance(sc);
    setBeschCompliance(bc);
    setLoadingC(false);
  }, [tenantId]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { if (tab === "uebersicht") loadCompliance(); }, [tab, loadCompliance]);

  const savePersonen = async (pflichtId: number, data: any) => {
    if (data.zuordnungModus === "personen") {
      await fetch(`${BASE}/schulungs-person-zuordnungen/${pflichtId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, userIds: data.selectedPersonen || [] }),
      });
    }
  };

  const handleCreate = async (data: any) => {
    const res = await fetch(`${BASE}/schulungs-pflichten`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (res.ok) {
      const created = await res.json();
      await savePersonen(created.id, data);
      setShowFormTyp(null);
      await reload();
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    await fetch(`${BASE}/schulungs-pflichten/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    await savePersonen(id, data);
    await reload();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/schulungs-pflichten/${id}`, { method: "DELETE" });
    await reload();
  };

  const handleToggle = async (p: Pflicht) => {
    await fetch(`${BASE}/schulungs-pflichten/${p.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schulungKategorie: p.schulung_kategorie, bezeichnung: p.bezeichnung, gueltigeGruppen: p.gueltige_gruppen, intervallMonate: p.intervall_monate, isActive: !p.is_active, subbereich: p.subbereich, typ: p.typ, zuordnungModus: p.zuordnung_modus, pruefModus: p.pruef_modus, trainingTopicId: p.training_topic_id }),
    });
    await reload();
  };

  const handleAddChild = async (_parentId: number, data: any) => { await handleCreate(data); };

  const schulungen = pflichten.filter((p) => p.typ === "schulung" && !p.parent_pflicht_id);
  const bescheinigungen = pflichten.filter((p) => p.typ === "bescheinigung" && !p.parent_pflicht_id);
  const childrenOf = (id: number) => pflichten.filter((p) => p.parent_pflicht_id === id);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <div className="flex items-center gap-3">
          <Link href="/verwaltung" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Schulungsanforderungen</h1>
            <p className="text-sm text-muted-foreground">Schulungen, Bescheinigungen und Compliance-Status verwalten.</p>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-muted/40 rounded-2xl border border-border/30">
          {[
            { key: "anforderungen", label: "Anforderungen", icon: <GraduationCap className="w-4 h-4" /> },
            { key: "uebersicht",    label: "Mitarbeiter-Übersicht", icon: <Users className="w-4 h-4" /> },
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === key ? "bg-white shadow-sm border border-border/40 text-[#1a3a6b]" : "text-muted-foreground"}`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ===== ANFORDERUNGEN ===== */}
        {tab === "anforderungen" && (
          <div className="space-y-6">
            {loadingP ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {/* Schulungen */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#1a3a6b]" />
                      <h2 className="text-sm font-bold text-foreground">Schulungsthemen</h2>
                      <span className="text-xs text-muted-foreground">{schulungen.length} Themen</span>
                    </div>
                    {showFormTyp !== "schulung" && (
                      <button onClick={() => setShowFormTyp("schulung")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3a6b] text-white rounded-xl text-xs font-bold hover:bg-[#2d5aa0]">
                        <Plus className="w-3.5 h-3.5" /> Schulung
                      </button>
                    )}
                  </div>

                  {showFormTyp === "schulung" && (
                    <PflichtForm typ="schulung" kategorien={kategorien} subbereiche={subbereiche} mitarbeiter={mitarbeiter} topics={topics}
                      onSave={handleCreate} onCancel={() => setShowFormTyp(null)} />
                  )}

                  {schulungen.map((p) => (
                    <PflichtCard key={p.id} p={p} children={childrenOf(p.id)}
                      kategorien={kategorien} subbereiche={subbereiche} mitarbeiter={mitarbeiter} topics={topics}
                      onUpdate={handleUpdate} onDelete={handleDelete} onToggle={handleToggle} onAddChild={handleAddChild} />
                  ))}

                  {schulungen.length === 0 && !showFormTyp && (
                    <div className="text-center py-8 border-2 border-dashed border-border/40 rounded-2xl">
                      <p className="text-sm text-muted-foreground">Noch keine Schulungsthemen angelegt</p>
                    </div>
                  )}
                </div>

                {/* Bescheinigungen */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <h2 className="text-sm font-bold text-foreground">Bescheinigungen & Zertifikate</h2>
                      <span className="text-xs text-muted-foreground">{bescheinigungen.length} Typen</span>
                    </div>
                    {showFormTyp !== "bescheinigung" && (
                      <button onClick={() => setShowFormTyp("bescheinigung")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700">
                        <Plus className="w-3.5 h-3.5" /> Bescheinigung
                      </button>
                    )}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800">
                    <strong>Aus Ordner:</strong> Automatisch für jeden mit Bescheinigung im Archiv.&nbsp;
                    <strong>Personen:</strong> Nur explizit ausgewählte Personen.&nbsp;
                    <strong>Nur Vorhandensein:</strong> Kein Ablaufdatum — nur prüfen ob vorhanden.
                  </div>

                  {showFormTyp === "bescheinigung" && (
                    <PflichtForm typ="bescheinigung" kategorien={kategorien} subbereiche={subbereiche} mitarbeiter={mitarbeiter} topics={topics}
                      onSave={handleCreate} onCancel={() => setShowFormTyp(null)} />
                  )}

                  {bescheinigungen.map((p) => (
                    <PflichtCard key={p.id} p={p} children={childrenOf(p.id)}
                      kategorien={kategorien} subbereiche={subbereiche} mitarbeiter={mitarbeiter} topics={topics}
                      onUpdate={handleUpdate} onDelete={handleDelete} onToggle={handleToggle} onAddChild={handleAddChild} />
                  ))}

                  {bescheinigungen.length === 0 && !showFormTyp && (
                    <div className="text-center py-8 border-2 border-dashed border-amber-200 rounded-2xl">
                      <p className="text-sm text-muted-foreground">Noch keine Bescheinigungstypen angelegt</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== ÜBERSICHT ===== */}
        {tab === "uebersicht" && (
          <div className="space-y-4">
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border border-border/20">
              <button onClick={() => setUebersichtTyp("schulungen")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${uebersichtTyp === "schulungen" ? "bg-white shadow-sm text-[#1a3a6b]" : "text-muted-foreground"}`}>
                <BookOpen className="w-3.5 h-3.5" /> Schulungen
              </button>
              <button onClick={() => setUebersichtTyp("bescheinigungen")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${uebersichtTyp === "bescheinigungen" ? "bg-white shadow-sm text-amber-600" : "text-muted-foreground"}`}>
                <Award className="w-3.5 h-3.5" /> Bescheinigungen
              </button>
            </div>

            {loadingC ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {uebersichtTyp === "schulungen" && <SchulComplianceView entries={schulCompliance} />}
                {uebersichtTyp === "bescheinigungen" && <BeschComplianceView entries={beschCompliance} />}
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── Schulungen-Compliance ────────────────────────────────────────────────────
function SchulComplianceView({ entries }: { entries: SchulComplianceEntry[] }) {
  const problems = entries.filter((e) => e.hasProblems);
  const warnings = entries.filter((e) => !e.hasProblems && e.warningCount > 0);
  const ok = entries.filter((e) => !e.hasProblems && e.warningCount === 0 && e.trainings.length > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-red-700">{problems.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Handlungsbedarf</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{warnings.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Bald fällig</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-green-700">{ok.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Alles OK</p>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-border/40 rounded-2xl">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Keine Mitarbeiter gefunden</p>
        </div>
      )}

      {[...problems, ...warnings, ...ok].map((emp) => {
        const gruppe = GRUPPEN_OPTS.find((g) => g.value === emp.gruppe);
        const border = emp.hasProblems ? "border-red-300" : emp.warningCount > 0 ? "border-amber-300" : "border-border/40";
        return <SchulEmpCard key={emp.employeeId} emp={emp} gruppe={gruppe} border={border} />;
      })}
    </div>
  );
}

function SchulEmpCard({ emp, gruppe, border }: { emp: SchulComplianceEntry; gruppe: any; border: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden ${border}`}>
      <button onClick={() => setExpanded((x) => !x)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/10">
        <div className="w-9 h-9 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4 text-[#1a3a6b]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">{emp.name}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {gruppe && <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${gruppe.bg} ${gruppe.color}`}>{gruppe.label}</span>}
            <span className="text-xs text-muted-foreground">{emp.trainings.length} Schulung{emp.trainings.length !== 1 ? "en" : ""}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {emp.hasProblems && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700"><AlertTriangle className="w-3 h-3" />{emp.problemCount}</span>}
          {emp.warningCount > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700"><AlarmClock className="w-3 h-3" />{emp.warningCount}</span>}
          {!emp.hasProblems && emp.warningCount === 0 && emp.trainings.length > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 border border-green-200 text-green-700"><CheckCircle2 className="w-3 h-3" />OK</span>}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-1.5">
          {emp.trainings.map((t) => (
            <div key={t.pflichtId} className={`flex items-center gap-3 py-1.5 border-b border-border/10 last:border-0 ${t.parentPflichtId ? "ml-4 pl-2 border-l-2 border-blue-200" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {t.parentPflichtId && <GitBranch className="w-3 h-3 text-blue-400 shrink-0" />}
                  {t.trainingTopicTitle && <Link2 className="w-3 h-3 text-[#1a3a6b]/50 shrink-0" />}
                  <p className="text-xs font-semibold">{t.bezeichnung}</p>
                </div>
                {t.naechsteSchulung && <p className="text-xs text-muted-foreground">Nächste: {new Date(t.naechsteSchulung).toLocaleDateString("de-DE")}</p>}
                {t.ausnahme?.begruendung && <p className="text-xs text-muted-foreground italic">Begr.: {t.ausnahme.begruendung}</p>}
              </div>
              <StatusChip status={t.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Bescheinigungen-Compliance ───────────────────────────────────────────────
function BeschComplianceView({ entries }: { entries: BeschComplianceEntry[] }) {
  if (entries.length === 0) return (
    <div className="text-center py-10 border-2 border-dashed border-amber-200 rounded-2xl">
      <Award className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Keine Bescheinigungstypen konfiguriert</p>
    </div>
  );

  return <div className="space-y-4">{entries.map((b) => <BeschCard key={b.pflichtId} b={b} />)}</div>;
}

function BeschCard({ b }: { b: BeschComplianceEntry }) {
  const [expanded, setExpanded] = useState(false);
  const border = b.hasProblems ? "border-red-300" : b.warningCount > 0 ? "border-amber-300" : "border-amber-200";

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden ${border}`}>
      <button onClick={() => setExpanded((x) => !x)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/10">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Award className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold">{b.bezeichnung}</p>
            {b.pruefModus === "vorhanden" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700">
                <EyeOff className="w-2.5 h-2.5" /> Nur Vorhandensein
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {b.entries.length} Person{b.entries.length !== 1 ? "en" : ""} ·{" "}
            {b.zuordnungModus === "auto" ? "Aus Ordner" : b.zuordnungModus === "personen" ? "Explizit" : "Gruppe"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {b.hasProblems && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700"><AlertTriangle className="w-3 h-3" />{b.problemCount}</span>}
          {b.warningCount > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700"><AlarmClock className="w-3 h-3" />{b.warningCount}</span>}
          {!b.hasProblems && b.warningCount === 0 && b.entries.length > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 border border-green-200 text-green-700"><CheckCircle2 className="w-3 h-3" />OK</span>}
          {b.entries.length === 0 && <span className="text-xs text-muted-foreground px-2">Keine Einträge</span>}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-1.5">
          {b.entries.length === 0 && <p className="text-xs text-muted-foreground">Noch keine Nachweise im Archiv.</p>}
          {b.entries.map((e, i) => {
            const gruppe = GRUPPEN_OPTS.find((g) => g.value === e.gruppe);
            return (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border/10 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold">{e.name}</p>
                    {gruppe && <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${gruppe.bg} ${gruppe.color}`}>{gruppe.label}</span>}
                  </div>
                  {e.status !== "ausnahme" && e.gueltigBis && b.pruefModus !== "vorhanden" && (
                    <p className="text-xs text-muted-foreground">Gültig bis: {new Date(e.gueltigBis).toLocaleDateString("de-DE")}</p>
                  )}
                  {e.status === "ausnahme" && e.ausnahme?.begruendung && (
                    <p className="text-xs text-muted-foreground italic">Begr.: {e.ausnahme.begruendung}</p>
                  )}
                </div>
                <StatusChip status={e.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
