import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  GraduationCap, Plus, Pencil, Trash2, Save, X, AlertTriangle,
  CheckCircle2, Clock, ChevronLeft, Loader2, ToggleLeft, ToggleRight,
  Users, ShieldAlert, AlarmClock, UserCheck, ChevronDown, GitBranch,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

const GRUPPEN_OPTS = [
  { value: "gesamter_markt", label: "Gesamter Markt", color: "text-violet-700", bg: "bg-violet-100 border-violet-200" },
  { value: "markt",          label: "Markt",          color: "text-sky-700",    bg: "bg-sky-100 border-sky-200" },
  { value: "metzgerei",      label: "Metzgerei",      color: "text-orange-700", bg: "bg-orange-100 border-orange-200" },
];

const INTERVALL_OPTS = [
  { label: "Monatlich", value: 1 },
  { label: "Vierteljährlich", value: 3 },
  { label: "Halbjährlich", value: 6 },
  { label: "Jährlich", value: 12 },
  { label: "Alle 2 Jahre", value: 24 },
  { label: "Alle 3 Jahre", value: 36 },
];

const INTERVALL_LABEL: Record<number, string> = {
  1: "Monatlich", 3: "Vierteljährlich", 6: "Halbjährlich",
  12: "Jährlich", 24: "Alle 2 Jahre", 36: "Alle 3 Jahre",
};

interface Pflicht {
  id: number;
  tenant_id: number;
  schulung_kategorie: string;
  bezeichnung: string;
  gueltige_gruppen: string[];
  intervall_monate: number;
  is_active: boolean;
  person_spezifisch: boolean;
  subbereich: string | null;
  parent_pflicht_id: number | null;
}

interface ComplianceEntry {
  employeeId: number;
  name: string;
  gruppe: string | null;
  status: string;
  hasProblems: boolean;
  problemCount: number;
  warningCount: number;
  trainings: {
    pflichtId: number;
    bezeichnung: string;
    kategorie: string;
    subbereich: string | null;
    personSpezifisch: boolean;
    parentPflichtId: number | null;
    intervallMonate: number;
    status: "ok" | "bald_fällig" | "überfällig" | "fehlend" | "ausnahme";
    naechsteSchulung: string | null;
    ausnahme: { id: number; begruendung: string } | null;
  }[];
}

// --- Combobox component ---
function Combobox({ value, onChange, options, placeholder, id }: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1">
        <input
          id={id}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
        />
        <button type="button" onClick={() => setOpen((p) => !p)}
          className="p-2 rounded-lg border border-border/60 bg-white hover:bg-muted/40 transition-colors">
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border/60 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Keine vorhandenen Einträge</p>
          )}
          {(filtered.length > 0 ? filtered : options).map((o) => (
            <button key={o} type="button"
              onClick={() => { onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/40 transition-colors ${value === o ? "font-semibold text-[#1a3a6b]" : "text-foreground"}`}>
              {o}
            </button>
          ))}
          {value && !options.includes(value) && (
            <button type="button"
              onClick={() => { onChange(value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted/40 border-t border-border/30">
              „{value}" neu anlegen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// --- GruppePill ---
function GruppePill({ value }: { value: string }) {
  const g = GRUPPEN_OPTS.find((x) => x.value === value);
  if (!g) return null;
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${g.bg} ${g.color}`}>
      {g.label}
    </span>
  );
}

// --- StatusChip ---
function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    ok:          { label: "OK",          color: "text-green-700", bg: "bg-green-100 border-green-200",  icon: <CheckCircle2 className="w-3 h-3" /> },
    bald_fällig: { label: "Bald fällig", color: "text-amber-700", bg: "bg-amber-100 border-amber-200",  icon: <AlarmClock className="w-3 h-3" /> },
    überfällig:  { label: "Überfällig",  color: "text-red-700",   bg: "bg-red-100 border-red-200",      icon: <AlertTriangle className="w-3 h-3" /> },
    fehlend:     { label: "Fehlend",     color: "text-slate-700", bg: "bg-slate-100 border-slate-200",  icon: <X className="w-3 h-3" /> },
    ausnahme:    { label: "Ausnahme",    color: "text-gray-500",  bg: "bg-gray-100 border-gray-200",    icon: <ShieldAlert className="w-3 h-3" /> },
  };
  const c = map[status] || map.fehlend;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
}

// --- PflichtForm (full form for main entries) ---
function PflichtForm({ initial, onSave, onCancel, kategorien, subbereiche }: {
  initial?: Partial<Pflicht>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  kategorien: string[];
  subbereiche: string[];
}) {
  const { adminSession } = useAppStore();
  const tenantId = adminSession?.tenantId || 1;

  const [kategorie, setKategorie] = useState(initial?.schulung_kategorie || "");
  const [bezeichnung, setBezeichnung] = useState(initial?.bezeichnung || "");
  const [gruppen, setGruppen] = useState<string[]>(initial?.gueltige_gruppen || []);
  const [intervall, setIntervall] = useState(initial?.intervall_monate || 12);
  const [personSpezifisch, setPersonSpezifisch] = useState(initial?.person_spezifisch || false);
  const [subbereich, setSubbereich] = useState(initial?.subbereich || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleGruppe = (g: string) => setGruppen((p) => p.includes(g) ? p.filter((x) => x !== g) : [...p, g]);

  const handleSave = async () => {
    if (!kategorie.trim() || !bezeichnung.trim()) { setError("Bitte Kategorie und Anzeigename ausfüllen."); return; }
    if (!personSpezifisch && gruppen.length === 0) { setError("Bitte mindestens eine Gruppe wählen oder auf Personenspezifisch umschalten."); return; }
    setSaving(true); setError("");
    await onSave({ tenantId, schulungKategorie: kategorie.trim(), bezeichnung: bezeichnung.trim(), gueltigeGruppen: personSpezifisch ? [] : gruppen, intervallMonate: intervall, isActive: initial?.is_active ?? true, personSpezifisch, subbereich: subbereich.trim() || null });
    setSaving(false);
  };

  return (
    <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-4">
      <p className="text-sm font-bold text-foreground">{initial?.id ? "Schulung bearbeiten" : "Neue Schulungspflicht"}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kategorie</label>
          <Combobox value={kategorie} onChange={setKategorie} options={kategorien} placeholder="z.B. Ersthelfer" />
          <p className="text-xs text-muted-foreground">Muss mit der Kategorie im Schulungsordner übereinstimmen.</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Anzeigename</label>
          <input value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} placeholder="z.B. Ersthelfer-Ausbildung"
            className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
        </div>
      </div>

      {/* Zuordnungsart */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zuordnungsart</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPersonSpezifisch(false)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${!personSpezifisch ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "bg-white text-muted-foreground border-border/60 hover:border-[#1a3a6b]/30"}`}>
            <Users className="w-3.5 h-3.5" /> Gruppenbasiert
          </button>
          <button type="button" onClick={() => setPersonSpezifisch(true)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${personSpezifisch ? "bg-teal-600 text-white border-teal-600" : "bg-white text-muted-foreground border-border/60 hover:border-teal-400"}`}>
            <UserCheck className="w-3.5 h-3.5" /> Personenspezifisch
          </button>
        </div>
        {personSpezifisch ? (
          <p className="text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
            Gilt automatisch für alle Mitarbeiter, die bereits einen Nachweis dieser Kategorie im Schulungsordner haben.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Schulung gilt verpflichtend für alle Mitarbeiter der gewählten Gruppen.</p>
        )}
      </div>

      {/* Gruppen (nur gruppenbasiert) */}
      {!personSpezifisch && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gilt für Gruppen</label>
          <div className="flex flex-wrap gap-2">
            {GRUPPEN_OPTS.map((g) => {
              const active = gruppen.includes(g.value);
              return (
                <button key={g.value} type="button" onClick={() => toggleGruppe(g.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${active ? `${g.bg} ${g.color}` : "bg-white border-border/60 text-muted-foreground hover:border-[#1a3a6b]/30"}`}>
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subbereich */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Subbereich <span className="font-normal normal-case text-muted-foreground">(optional)</span>
        </label>
        <Combobox value={subbereich} onChange={setSubbereich} options={subbereiche} placeholder="z.B. Feuerwerk" />
        <p className="text-xs text-muted-foreground">Wenn gesetzt, wird die Bezeichnung im Schulungsnachweis abgeglichen.</p>
      </div>

      {/* Intervall */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wiederholungsintervall</label>
        <div className="flex flex-wrap gap-2">
          {INTERVALL_OPTS.map((o) => (
            <button key={o.value} type="button" onClick={() => setIntervall(o.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${intervall === o.value ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "bg-white border-border/60 text-muted-foreground hover:border-[#1a3a6b]/30"}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

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

// --- UnterpunktForm (simplified for sub-entries) ---
function UnterpunktForm({ parent, onSave, onCancel, subbereiche }: {
  parent: Pflicht;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  subbereiche: string[];
}) {
  const { adminSession } = useAppStore();
  const tenantId = adminSession?.tenantId || 1;

  const [bezeichnung, setBezeichnung] = useState("");
  const [subbereich, setSubbereich] = useState("");
  const [intervall, setIntervall] = useState(parent.intervall_monate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!bezeichnung.trim()) { setError("Bitte einen Anzeigenamen eingeben."); return; }
    setSaving(true); setError("");
    await onSave({
      tenantId,
      schulungKategorie: parent.schulung_kategorie,
      bezeichnung: bezeichnung.trim(),
      gueltigeGruppen: parent.person_spezifisch ? [] : parent.gueltige_gruppen,
      intervallMonate: intervall,
      isActive: true,
      personSpezifisch: parent.person_spezifisch,
      subbereich: subbereich.trim() || null,
      parentPflichtId: parent.id,
    });
    setSaving(false);
  };

  return (
    <div className="ml-6 mt-2 bg-blue-50/50 border border-blue-200 rounded-xl p-3 space-y-3">
      <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
        <GitBranch className="w-3.5 h-3.5" /> Unterpunkt zu „{parent.bezeichnung}"
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Anzeigename</label>
          <input value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)}
            placeholder="z.B. HACCP — Fleischbereich"
            className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Subbereich <span className="font-normal normal-case text-muted-foreground">(opt.)</span>
          </label>
          <Combobox value={subbereich} onChange={setSubbereich} options={subbereiche} placeholder="z.B. Feuerwerk" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Intervall</label>
        <div className="flex flex-wrap gap-1.5">
          {INTERVALL_OPTS.map((o) => (
            <button key={o.value} type="button" onClick={() => setIntervall(o.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${intervall === o.value ? "bg-blue-600 text-white border-blue-600" : "bg-white border-border/60 text-muted-foreground"}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-40">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Hinzufügen
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-white border border-border/60 rounded-lg text-xs font-semibold text-muted-foreground">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function SchulungsAnforderungen() {
  const { adminSession } = useAppStore();
  const tenantId = adminSession?.tenantId || 1;

  const [tab, setTab] = useState<"pflichten" | "compliance">("pflichten");
  const [pflichten, setPflichten] = useState<Pflicht[]>([]);
  const [kategorien, setKategorien] = useState<string[]>([]);
  const [subbereiche, setSubbereiche] = useState<string[]>([]);
  const [compliance, setCompliance] = useState<ComplianceEntry[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingC, setLoadingC] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addSubTo, setAddSubTo] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const loadKategorien = useCallback(async () => {
    const res = await fetch(`${BASE}/schulungs-kategorien?tenantId=${tenantId}`);
    const data = await res.json();
    setKategorien(data.kategorien || []);
    setSubbereiche(data.subbereiche || []);
  }, [tenantId]);

  const loadPflichten = useCallback(async () => {
    setLoadingP(true);
    try {
      const res = await fetch(`${BASE}/schulungs-pflichten?tenantId=${tenantId}`);
      const data = await res.json();
      setPflichten(data);
    } finally {
      setLoadingP(false);
    }
  }, [tenantId]);

  const loadCompliance = useCallback(async () => {
    setLoadingC(true);
    try {
      const res = await fetch(`${BASE}/schulungs-compliance?tenantId=${tenantId}`);
      const data = await res.json();
      setCompliance(data);
    } finally {
      setLoadingC(false);
    }
  }, [tenantId]);

  useEffect(() => { loadPflichten(); loadKategorien(); }, [loadPflichten, loadKategorien]);
  useEffect(() => { if (tab === "compliance") loadCompliance(); }, [tab, loadCompliance]);

  const handleCreate = async (data: any) => {
    const res = await fetch(`${BASE}/schulungs-pflichten`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setShowForm(false); setAddSubTo(null); await loadPflichten(); await loadKategorien(); }
  };

  const handleUpdate = async (id: number, data: any) => {
    const res = await fetch(`${BASE}/schulungs-pflichten/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setEditingId(null); await loadPflichten(); await loadKategorien(); }
  };

  const handleToggleActive = async (p: Pflicht) => {
    await fetch(`${BASE}/schulungs-pflichten/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schulungKategorie: p.schulung_kategorie, bezeichnung: p.bezeichnung, gueltigeGruppen: p.gueltige_gruppen, intervallMonate: p.intervall_monate, isActive: !p.is_active, personSpezifisch: p.person_spezifisch, subbereich: p.subbereich }) });
    await loadPflichten();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/schulungs-pflichten/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await loadPflichten();
  };

  // Build tree: parent → children
  const parents = pflichten.filter((p) => !p.parent_pflicht_id);
  const childrenOf = (parentId: number) => pflichten.filter((p) => p.parent_pflicht_id === parentId);

  const withProblems = compliance.filter((e) => e.hasProblems);
  const warnOnly = compliance.filter((e) => !e.hasProblems && e.warningCount > 0);
  const okOnly = compliance.filter((e) => !e.hasProblems && e.warningCount === 0 && e.trainings.length > 0);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <div className="flex items-center gap-3">
          <Link href="/verwaltung" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Schulungsanforderungen</h1>
            <p className="text-sm text-muted-foreground">Pflichtschulungen definieren und Compliance-Status überwachen.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-2xl border border-border/30">
          <button onClick={() => setTab("pflichten")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "pflichten" ? "bg-white shadow-sm border border-border/40 text-[#1a3a6b]" : "text-muted-foreground hover:text-foreground"}`}>
            <GraduationCap className="w-4 h-4" /> Anforderungen
          </button>
          <button onClick={() => setTab("compliance")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "compliance" ? "bg-white shadow-sm border border-border/40 text-[#1a3a6b]" : "text-muted-foreground hover:text-foreground"}`}>
            <Users className="w-4 h-4" /> Mitarbeiter-Übersicht
          </button>
        </div>

        {/* ===== TAB: PFLICHTEN ===== */}
        {tab === "pflichten" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{pflichten.length} Schulungspflichten konfiguriert</p>
              {!showForm && (
                <button onClick={() => { setShowForm(true); setAddSubTo(null); setEditingId(null); }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] transition-colors">
                  <Plus className="w-4 h-4" /> Neue Anforderung
                </button>
              )}
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-xs text-teal-800 leading-relaxed">
              <strong>Personenspezifische Schulungen</strong> (Ersthelfer, Brandschutz, Strohschwein) erscheinen automatisch bei Mitarbeitern mit entsprechendem Eintrag im Schulungsordner.
            </div>

            {showForm && (
              <PflichtForm kategorien={kategorien} subbereiche={subbereiche} onSave={handleCreate} onCancel={() => setShowForm(false)} />
            )}

            {loadingP ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-3">
                {parents.map((p) => {
                  const children = childrenOf(p.id);
                  const isPersonSpez = p.person_spezifisch;
                  const borderColor = isPersonSpez ? "border-teal-200" : "border-border/40";

                  return (
                    <div key={p.id} className="space-y-0.5">
                      {/* Parent card */}
                      <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${p.is_active ? borderColor : "border-slate-200 opacity-60"}`}>
                        {editingId === p.id ? (
                          <div className="p-4">
                            <PflichtForm initial={p} kategorien={kategorien} subbereiche={subbereiche}
                              onSave={(data) => handleUpdate(p.id, data)} onCancel={() => setEditingId(null)} />
                          </div>
                        ) : (
                          <div className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold text-foreground">{p.bezeichnung}</p>
                                  {isPersonSpez && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 border border-teal-200 text-teal-700">
                                      <UserCheck className="w-3 h-3" /> Personenspezifisch
                                    </span>
                                  )}
                                  {children.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700">
                                      <GitBranch className="w-3 h-3" /> {children.length} Unterpunkt{children.length !== 1 ? "e" : ""}
                                    </span>
                                  )}
                                  {!p.is_active && (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Inaktiv</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Kategorie: <span className="font-semibold text-foreground">{p.schulung_kategorie}</span>
                                  {p.subbereich && <> · Subbereich: <span className="font-semibold text-foreground">{p.subbereich}</span></>}
                                  {" · "}<Clock className="w-3 h-3 inline" /> {INTERVALL_LABEL[p.intervall_monate] || `Alle ${p.intervall_monate} Monate`}
                                </p>
                                {!isPersonSpez && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {(p.gueltige_gruppen || []).map((g) => <GruppePill key={g} value={g} />)}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Unterpunkt hinzufügen */}
                                <button onClick={() => setAddSubTo(addSubTo === p.id ? null : p.id)}
                                  title="Unterpunkt hinzufügen"
                                  className={`p-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${addSubTo === p.id ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-white border-border/60 text-muted-foreground hover:border-blue-300 hover:text-blue-600"}`}>
                                  <GitBranch className="w-3.5 h-3.5" /><Plus className="w-2.5 h-2.5" />
                                </button>
                                <button onClick={() => handleToggleActive(p)} title={p.is_active ? "Deaktivieren" : "Aktivieren"}
                                  className="text-muted-foreground hover:text-[#1a3a6b] transition-colors">
                                  {p.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                                </button>
                                <button onClick={() => { setEditingId(p.id); setAddSubTo(null); }}
                                  className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {confirmDelete === p.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-red-600 font-medium">Löschen?</span>
                                    <button onClick={() => handleDelete(p.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">Ja</button>
                                    <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 border border-border/60 rounded text-xs font-semibold text-muted-foreground">Nein</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmDelete(p.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Unterpunkt-Formular */}
                      {addSubTo === p.id && (
                        <UnterpunktForm parent={p} subbereiche={subbereiche}
                          onSave={async (data) => { await handleCreate(data); setAddSubTo(null); }}
                          onCancel={() => setAddSubTo(null)} />
                      )}

                      {/* Child entries */}
                      {children.map((child) => (
                        <div key={child.id} className="ml-6 space-y-0.5">
                          <div className="flex items-stretch gap-0">
                            {/* Connector line */}
                            <div className="w-4 shrink-0 flex flex-col items-center">
                              <div className="w-px flex-1 bg-blue-200 ml-2" />
                              <div className="w-3 h-px bg-blue-200" />
                            </div>
                            <div className={`flex-1 bg-blue-50/60 rounded-xl border-2 overflow-hidden ${child.is_active ? "border-blue-200" : "border-slate-200 opacity-60"}`}>
                              {editingId === child.id ? (
                                <div className="p-3">
                                  <PflichtForm initial={child} kategorien={kategorien} subbereiche={subbereiche}
                                    onSave={(data) => handleUpdate(child.id, data)} onCancel={() => setEditingId(null)} />
                                </div>
                              ) : (
                                <div className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <GitBranch className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-xs font-bold text-foreground">{child.bezeichnung}</p>
                                        {child.person_spezifisch && (
                                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-teal-100 border border-teal-200 text-teal-700">
                                            <UserCheck className="w-2.5 h-2.5" /> Personenspez.
                                          </span>
                                        )}
                                        {!child.is_active && (
                                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Inaktiv</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {child.subbereich && <><span className="font-semibold text-blue-700">{child.subbereich}</span> · </>}
                                        <Clock className="w-2.5 h-2.5 inline" /> {INTERVALL_LABEL[child.intervall_monate] || `Alle ${child.intervall_monate} Monate`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button onClick={() => handleToggleActive(child)} className="text-muted-foreground">
                                        {child.is_active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4" />}
                                      </button>
                                      <button onClick={() => { setEditingId(child.id); setAddSubTo(null); }}
                                        className="p-1 rounded hover:bg-muted/40 text-muted-foreground hover:text-foreground">
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      {confirmDelete === child.id ? (
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => handleDelete(child.id)} className="px-1.5 py-0.5 bg-red-600 text-white rounded text-xs font-bold">Ja</button>
                                          <button onClick={() => setConfirmDelete(null)} className="px-1.5 py-0.5 border border-border/60 rounded text-xs font-semibold text-muted-foreground">Nein</button>
                                        </div>
                                      ) : (
                                        <button onClick={() => setConfirmDelete(child.id)}
                                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: COMPLIANCE ===== */}
        {tab === "compliance" && (
          <div className="space-y-4">
            {loadingC ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-red-700">{withProblems.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Handlungsbedarf</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">{warnOnly.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Bald fällig</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{okOnly.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Alles OK</p>
                  </div>
                </div>

                {compliance.length === 0 && (
                  <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border/40">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Keine aktiven Mitarbeiter gefunden</p>
                  </div>
                )}

                {withProblems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Handlungsbedarf</p>
                    {withProblems.map((emp) => <ComplianceCard key={emp.employeeId} entry={emp} />)}
                  </div>
                )}

                {warnOnly.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Bald fällig</p>
                    {warnOnly.map((emp) => <ComplianceCard key={emp.employeeId} entry={emp} />)}
                  </div>
                )}

                {okOnly.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Alles aktuell</p>
                    {okOnly.map((emp) => <ComplianceCard key={emp.employeeId} entry={emp} compact />)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ComplianceCard({ entry, compact }: { entry: ComplianceEntry; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const gruppe = GRUPPEN_OPTS.find((g) => g.value === entry.gruppe);

  const borderColor = entry.hasProblems
    ? "border-red-300"
    : entry.warningCount > 0
    ? "border-amber-300"
    : "border-border/40";

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden ${borderColor}`}>
      <button onClick={() => setExpanded((p) => !p)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/10 transition-colors">
        <div className="w-9 h-9 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4 text-[#1a3a6b]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{entry.name}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {gruppe && (
              <span className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full border ${gruppe.bg} ${gruppe.color}`}>
                {gruppe.label}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{entry.trainings.length} Schulung{entry.trainings.length !== 1 ? "en" : ""} relevant</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {entry.hasProblems && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700">
              <AlertTriangle className="w-3 h-3" /> {entry.problemCount} offen
            </span>
          )}
          {entry.warningCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700">
              <AlarmClock className="w-3 h-3" /> {entry.warningCount} bald
            </span>
          )}
          {!entry.hasProblems && entry.warningCount === 0 && entry.trainings.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 border border-green-200 text-green-700">
              <CheckCircle2 className="w-3 h-3" /> OK
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-2">
          {entry.trainings.map((t) => (
            <div key={t.pflichtId} className={`flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0 ${t.parentPflichtId ? "ml-4 pl-2 border-l-2 border-blue-200" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {t.parentPflichtId && <GitBranch className="w-3 h-3 text-blue-400 shrink-0" />}
                  <p className="text-xs font-semibold text-foreground">{t.bezeichnung}</p>
                  {t.personSpezifisch && <span className="text-xs text-teal-600 font-medium">· Extern</span>}
                </div>
                {t.naechsteSchulung && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nächste: {new Date(t.naechsteSchulung).toLocaleDateString("de-DE")}
                  </p>
                )}
                {t.ausnahme?.begruendung && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">Begründung: {t.ausnahme.begruendung}</p>
                )}
              </div>
              <StatusChip status={t.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
