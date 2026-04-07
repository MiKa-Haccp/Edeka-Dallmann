import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link } from "wouter";
import {
  Users, UserPlus, Pencil, Trash2, Save, X, KeyRound,
  CheckCircle2, Clock, UserX, UserCheck, Loader2, Search, Printer,
  ShieldCheck, AlertTriangle, Lock, RefreshCcw, Eye, EyeOff,
  Building2, ChevronDown, ChevronUp, ChevronLeft, GraduationCap, AlarmClock, ShieldAlert,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

type Status = "onboarding" | "aktiv" | "inaktiv";
type Gruppe = "gesamter_markt" | "markt" | "metzgerei" | null;

const GRUPPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  gesamter_markt: { label: "Gesamter Markt", color: "text-violet-700", bg: "bg-violet-100", border: "border-violet-200" },
  markt:          { label: "Markt",          color: "text-sky-700",    bg: "bg-sky-100",    border: "border-sky-200" },
  metzgerei:      { label: "Metzgerei",      color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200" },
};

interface Employee {
  id: number;
  tenantId: number;
  firstName: string;
  lastName: string;
  name: string;
  birthDate: string | null;
  initials: string | null;
  pin: string | null;
  email: string | null;
  phone: string | null;
  status: Status;
  gruppe: Gruppe;
  role: string;
  createdAt: string;
  hasPin?: boolean;
}

interface ComplianceTraining {
  pflichtId: number;
  bezeichnung: string;
  kategorie: string;
  subbereich: string | null;
  personSpezifisch: boolean;
  intervallMonate: number;
  status: "ok" | "bald_fällig" | "überfällig" | "fehlend" | "ausnahme";
  naechsteSchulung: string | null;
  ausnahme: { id: number; begruendung: string } | null;
}

interface ComplianceEntry {
  employeeId: number;
  name: string;
  gruppe: string | null;
  hasProblems: boolean;
  problemCount: number;
  warningCount: number;
  trainings: ComplianceTraining[];
}

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  aktiv: { label: "Aktiv", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-green-700", bg: "bg-green-100", border: "border-green-200" },
  onboarding: { label: "Onboarding", icon: <Clock className="w-3.5 h-3.5" />, color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200" },
  inaktiv: { label: "Inaktiv", icon: <UserX className="w-3.5 h-3.5" />, color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200" },
};

const SORT_BY_OPTIONS = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "gruppe_asc", label: "Abteilung" },
  { value: "status_asc", label: "Status" },
] as const;

function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.aktiv;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.color} border ${c.border}`}>
      {c.icon} {c.label}
    </span>
  );
}

function GruppeBadge({ gruppe }: { gruppe: Gruppe }) {
  if (!gruppe) return null;
  const c = GRUPPE_CONFIG[gruppe];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.color} border ${c.border}`}>
      {c.label}
    </span>
  );
}

function InitialsBadge({ initials, status }: { initials: string; status: Status }) {
  const colors = status === "aktiv" ? "bg-[#1a3a6b] text-white" : status === "inaktiv" ? "bg-slate-300 text-slate-600" : "bg-amber-400 text-white";
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${colors}`}>
      {initials || "?"}
    </div>
  );
}

// ===== NEUER MITARBEITER FORMULAR =====
function NeuerMitarbeiterForm({ onSave, onCancel, existingInitials }: {
  onSave: (data: any) => Promise<{ error?: string }>;
  onCancel: () => void;
  existingInitials: string[];
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("aktiv");
  const [gruppe, setGruppe] = useState<string>("");
  const [initials, setInitials] = useState("");
  const [initialsManual, setInitialsManual] = useState(false);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (firstName.length >= 2 && lastName.length >= 2 && !initialsManual) {
      const f = firstName.trim().toUpperCase();
      const l = lastName.trim().toUpperCase();
      const candidates = [
        f[0] + l[0],
        f[0] + l.substring(0, 2),
        f.substring(0, 2) + l[0],
        f[0] + l[0] + l[1],
      ].filter((s) => s.length >= 2).map((s) => s.substring(0, 3));
      const unique = [...new Set(candidates)];
      const avail = unique.filter((s) => !existingInitials.includes(s.toUpperCase()));
      setSuggestions(avail.slice(0, 4));
      if (avail.length > 0) setInitials(avail[0]);
    }
  }, [firstName, lastName, initialsManual, existingInitials]);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) { setError("Vor- und Nachname sind erforderlich."); return; }
    if (pin && !/^\d{4}$/.test(pin)) { setError("PIN muss genau 4 Ziffern enthalten."); return; }
    setSaving(true);
    setError("");
    const res = await onSave({ firstName, lastName, birthDate, email: email || undefined, phone: phone || undefined, status, gruppe: gruppe || null, initials: initials || undefined, pin: pin || undefined });
    if (res.error) setError(res.error);
    setSaving(false);
  };

  return (
    <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-bold text-[#1a3a6b]">Neuer Mitarbeiter</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vorname *</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Vorname"
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nachname *</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nachname"
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Geburtsdatum</label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-Mail-Adresse</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@firma.de"
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Handynummer</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="z.B. 0151 12345678"
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)}
            className="px-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20">
            <option value="aktiv">Aktiv</option>
            <option value="inaktiv">Inaktiv</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Abteilungsgruppe</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "gesamter_markt", label: "Gesamter Markt" },
              { value: "markt",          label: "Markt" },
              { value: "metzgerei",      label: "Metzgerei" },
            ].map((opt) => {
              const cfg = GRUPPE_CONFIG[opt.value];
              const active = gruppe === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => setGruppe(active ? "" : opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${active ? `${cfg.bg} ${cfg.color} ${cfg.border}` : "bg-white border-border/60 text-muted-foreground hover:border-[#1a3a6b]/30"}`}>
                  {opt.label}
                </button>
              );
            })}
            {gruppe && (
              <button type="button" onClick={() => setGruppe("")}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-red-500">
                × Keine
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Bestimmt welche Schulungen relevant sind</p>
        </div>
      </div>

      {/* Kürzel */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kürzel (automatisch generiert)</label>
        <div className="flex items-center gap-2 flex-wrap">
          <input value={initials} onChange={(e) => { setInitials(e.target.value.toUpperCase().slice(0,3)); setInitialsManual(true); }}
            placeholder="z.B. MM" maxLength={3}
            className="w-24 px-3 py-2 rounded-xl border border-border/60 bg-white text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
          {suggestions.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Vorschläge:</span>
              {suggestions.map((s) => (
                <button key={s} onClick={() => { setInitials(s); setInitialsManual(false); }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${initials === s ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "bg-white border-border/60 hover:border-[#1a3a6b]/40"}`}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PIN */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PIN (optional — kann später gesetzt werden)</label>
        <div className="relative w-40">
          <input type={showPin ? "text" : "password"} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="4-stellige PIN" maxLength={4} inputMode="numeric"
            className="w-full px-3 py-2 pr-9 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 tracking-widest" />
          <button type="button" onClick={() => setShowPin((p) => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={saving || !firstName.trim() || !lastName.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-40 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Anlegen
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ===== SCHULUNGS-STATUS SEKTION =====
function SchulungsStatusSektion({ empId, empName, tenantId }: { empId: number; empName: string; tenantId: number }) {
  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState<ComplianceTraining[]>([]);
  const [ausnahmeFor, setAusnahmeFor] = useState<number | null>(null);
  const [begruendung, setBegruendung] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/schulungs-compliance?tenantId=${tenantId}`);
      const all: ComplianceEntry[] = await res.json();
      const mine = all.find((e) => e.employeeId === empId);
      setTrainings(mine?.trainings || []);
    } finally {
      setLoading(false);
    }
  }, [empId, tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleAddAusnahme = async (pflichtId: number) => {
    setSaving(true);
    await fetch(`${BASE}/schulungs-ausnahmen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, userId: empId, schulungsPflichtId: pflichtId, begruendung }),
    });
    setAusnahmeFor(null);
    setBegruendung("");
    setSaving(false);
    await load();
  };

  const handleRemoveAusnahme = async (ausnahmeId: number) => {
    await fetch(`${BASE}/schulungs-ausnahmen/${ausnahmeId}`, { method: "DELETE" });
    await load();
  };

  const STATUS_UI: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    ok:          { label: "Aktuell",     color: "text-green-700", bg: "bg-green-50",  border: "border-green-200",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    bald_fällig: { label: "Bald fällig", color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200",  icon: <AlarmClock className="w-3.5 h-3.5" /> },
    überfällig:  { label: "Überfällig",  color: "text-red-700",   bg: "bg-red-50",    border: "border-red-200",    icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    fehlend:     { label: "Fehlend",     color: "text-slate-700", bg: "bg-slate-50",  border: "border-slate-200",  icon: <X className="w-3.5 h-3.5" /> },
    ausnahme:    { label: "Ausnahme",    color: "text-gray-500",  bg: "bg-gray-50",   border: "border-gray-200",   icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  };

  if (loading) return (
    <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Schulungsstatus wird geladen...
    </div>
  );

  if (trainings.length === 0) return (
    <div className="py-2 text-xs text-muted-foreground italic">
      Keine Schulungspflichten für diese Gruppe hinterlegt.
    </div>
  );

  return (
    <div className="space-y-2">
      {trainings.map((t) => {
        const ui = STATUS_UI[t.status] || STATUS_UI.fehlend;
        const canExcept = t.status === "fehlend" || t.status === "überfällig";
        return (
          <div key={t.pflichtId} className={`rounded-xl border ${ui.border} ${ui.bg} px-3 py-2.5`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${ui.color}`}>
                    {ui.icon} {ui.label}
                  </span>
                  <span className="text-xs font-semibold text-foreground">{t.bezeichnung}</span>
                </div>
                {t.naechsteSchulung && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nächste Schulung: <span className="font-semibold">{new Date(t.naechsteSchulung).toLocaleDateString("de-DE")}</span>
                    {" "}(alle {t.intervallMonate} Monate)
                  </p>
                )}
                {t.status === "fehlend" && (
                  <p className="text-xs text-muted-foreground mt-0.5">Kein Nachweis in Kategorie „{t.kategorie}" vorhanden.</p>
                )}
                {t.ausnahme && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">Begründung: {t.ausnahme.begruendung || "—"}</p>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-1">
                {t.ausnahme ? (
                  <button onClick={() => handleRemoveAusnahme(t.ausnahme!.id)}
                    className="text-xs font-semibold px-2 py-1 rounded-lg bg-white border border-border/60 text-muted-foreground hover:text-red-500 transition-colors">
                    Aufheben
                  </button>
                ) : canExcept && ausnahmeFor !== t.pflichtId ? (
                  <button onClick={() => { setAusnahmeFor(t.pflichtId); setBegruendung(""); }}
                    className="text-xs font-semibold px-2 py-1 rounded-lg bg-white border border-border/60 text-muted-foreground hover:text-[#1a3a6b] transition-colors">
                    Ausnahme
                  </button>
                ) : null}
              </div>
            </div>
            {ausnahmeFor === t.pflichtId && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={begruendung}
                  onChange={(e) => setBegruendung(e.target.value)}
                  placeholder="Begründung (z.B. nicht zuständig)"
                  className="flex-1 px-2 py-1.5 rounded-lg border border-border/60 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#1a3a6b]/30"
                />
                <button onClick={() => handleAddAusnahme(t.pflichtId)} disabled={saving}
                  className="px-2 py-1.5 bg-[#1a3a6b] text-white rounded-lg text-xs font-bold hover:bg-[#2d5aa0] disabled:opacity-40">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                </button>
                <button onClick={() => setAusnahmeFor(null)}
                  className="px-2 py-1.5 bg-white border border-border/60 rounded-lg text-xs text-muted-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ===== MITARBEITER KARTE =====
function MitarbeiterKarte({ emp, onUpdate, onDelete, onPinChange, tenantId }: {
  emp: Employee;
  onUpdate: (id: number, data: Partial<Employee>) => Promise<{ error?: string }>;
  onDelete: (id: number) => Promise<void>;
  onPinChange: (id: number, pin: string) => Promise<{ error?: string }>;
  tenantId: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const [firstName, setFirstName] = useState(emp.firstName);
  const [lastName, setLastName] = useState(emp.lastName);
  const [birthDate, setBirthDate] = useState(emp.birthDate || "");
  const [email, setEmail] = useState(emp.email || "");
  const [phone, setPhone] = useState(emp.phone || "");
  const [status, setStatus] = useState<Status>(emp.status);
  const [gruppe, setGruppe] = useState<string>(emp.gruppe || "");
  const [initials, setInitials] = useState(emp.initials || "");
  const [newPin, setNewPin] = useState("");
  const [showNewPin, setShowNewPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const handleSaveEdit = async () => {
    setSaving(true); setError("");
    const res = await onUpdate(emp.id, { firstName, lastName, birthDate, email: email || null, phone: phone || null, status, gruppe: gruppe || null, initials });
    if (res.error) { setError(res.error); } else { setEditing(false); }
    setSaving(false);
  };

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(newPin)) { setError("PIN muss genau 4 Ziffern enthalten."); return; }
    setSaving(true); setError("");
    const res = await onPinChange(emp.id, newPin);
    if (res.error) { setError(res.error); } else { setPinMode(false); setNewPin(""); }
    setSaving(false);
  };

  const handleDelete = async () => {
    await onDelete(emp.id);
  };

  const handleQuickStatusChange = async (newStatus: Status) => {
    setStatusSaving(true);
    await onUpdate(emp.id, { status: newStatus });
    setStatusSaving(false);
  };

  const st = STATUS_CONFIG[emp.status] || STATUS_CONFIG.aktiv;

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${emp.status === "inaktiv" ? "border-slate-200 opacity-75" : emp.status === "onboarding" ? "border-amber-200" : "border-border/40"}`}>
      <button onClick={() => setExpanded((p) => !p)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors">
        <InitialsBadge initials={emp.initials || "?"} status={emp.status} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{emp.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kürzel: <span className="font-bold text-foreground">{emp.initials || "—"}</span>
            {emp.birthDate && <> · geb. {new Date(emp.birthDate).toLocaleDateString("de-DE")}</>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <GruppeBadge gruppe={emp.gruppe} />
          <StatusBadge status={emp.status} />
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${emp.hasPin ? "bg-[#1a3a6b]/10 text-[#1a3a6b]" : "bg-red-50 text-red-500 border border-red-200"}`}>
            <Lock className="w-3 h-3" /> {emp.hasPin ? "PIN gesetzt" : "Kein PIN"}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border/30 space-y-4 pt-4">
          {!editing && !pinMode && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setEditing(true); setError(""); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1a3a6b]/5 text-[#1a3a6b] border border-[#1a3a6b]/20 rounded-xl text-xs font-bold hover:bg-[#1a3a6b]/10 transition-colors">
                <Pencil className="w-3.5 h-3.5" /> Bearbeiten
              </button>
              <button onClick={() => { setPinMode(true); setError(""); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors">
                <KeyRound className="w-3.5 h-3.5" /> PIN {emp.hasPin ? "ändern" : "setzen"}
              </button>
              <button
                onClick={() => handleQuickStatusChange(emp.status === "inaktiv" ? "aktiv" : "inaktiv")}
                disabled={statusSaving}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${
                  emp.status === "inaktiv"
                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}>
                {statusSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : emp.status === "inaktiv" ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                {emp.status === "inaktiv" ? "Aktivieren" : "Deaktivieren"}
              </button>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Löschen
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-xs text-red-700 font-medium">Unwiderruflich löschen?</span>
                  <button onClick={handleDelete} className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs font-bold">Ja</button>
                  <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 bg-white border border-border/60 rounded-lg text-xs font-semibold text-muted-foreground">Nein</button>
                </div>
              )}
            </div>
          )}

          {/* Bearbeiten-Formular */}
          {editing && (
            <div className="bg-muted/20 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vorname</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nachname</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Geburtsdatum</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-Mail-Adresse</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@firma.de"
                    className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Handynummer</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="z.B. 0151 12345678"
                    className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as Status)}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20">
                    <option value="aktiv">Aktiv</option>
                    <option value="inaktiv">Inaktiv</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kürzel</label>
                  <input value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0,3))}
                    maxLength={3} className="w-24 px-3 py-2 rounded-lg border border-border/60 bg-white text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Abteilungsgruppe</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "gesamter_markt", label: "Gesamter Markt" },
                      { value: "markt",          label: "Markt" },
                      { value: "metzgerei",      label: "Metzgerei" },
                    ].map((opt) => {
                      const cfg = GRUPPE_CONFIG[opt.value];
                      const active = gruppe === opt.value;
                      return (
                        <button key={opt.value} type="button" onClick={() => setGruppe(active ? "" : opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${active ? `${cfg.bg} ${cfg.color} ${cfg.border}` : "bg-white border-border/60 text-muted-foreground hover:border-[#1a3a6b]/30"}`}>
                          {opt.label}
                        </button>
                      );
                    })}
                    {gruppe && (
                      <button type="button" onClick={() => setGruppe("")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-500">
                        × Keine
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3a6b] text-white rounded-lg text-xs font-bold hover:bg-[#2d5aa0] disabled:opacity-40">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Speichern
                </button>
                <button onClick={() => { setEditing(false); setError(""); setFirstName(emp.firstName); setLastName(emp.lastName); setBirthDate(emp.birthDate || ""); setEmail(emp.email || ""); setPhone(emp.phone || ""); setStatus(emp.status); setGruppe(emp.gruppe || ""); setInitials(emp.initials || ""); }}
                  className="px-4 py-2 bg-white border border-border/60 rounded-lg text-xs font-semibold text-muted-foreground">Abbrechen</button>
              </div>
            </div>
          )}

          {/* PIN Formular */}
          {pinMode && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-purple-700">
                {emp.hasPin ? "PIN ändern" : "PIN vergeben"} für {emp.name}
              </p>
              <div className="relative w-40">
                <input type={showNewPin ? "text" : "password"} value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="4-stellige PIN" maxLength={4} inputMode="numeric"
                  className="w-full px-3 py-2 pr-9 rounded-lg border border-purple-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 tracking-widest" />
                <button type="button" onClick={() => setShowNewPin((p) => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <div className="flex gap-2">
                <button onClick={handleSavePin} disabled={saving || newPin.length !== 4}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 text-white rounded-lg text-xs font-bold hover:bg-purple-800 disabled:opacity-40">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />} PIN speichern
                </button>
                <button onClick={() => { setPinMode(false); setError(""); setNewPin(""); }}
                  className="px-4 py-2 bg-white border border-border/60 rounded-lg text-xs font-semibold text-muted-foreground">Abbrechen</button>
              </div>
            </div>
          )}

          {!editing && !pinMode && emp.gruppe && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#1a3a6b]" />
                <p className="text-xs font-bold text-foreground">Schulungsstatus</p>
              </div>
              <SchulungsStatusSektion empId={emp.id} empName={emp.name} tenantId={tenantId} />
            </div>
          )}

          <p className="text-xs text-muted-foreground">Angelegt: {new Date(emp.createdAt).toLocaleDateString("de-DE")}</p>
        </div>
      )}
    </div>
  );
}

// ===== KÜRZEL-VERZEICHNIS =====
function KuerzelVerzeichnis({ employees }: { employees: Employee[] }) {
  const sorted = [...employees].sort((a, b) => a.lastName.localeCompare(b.lastName));
  const aktiv = sorted.filter((e) => e.status === "aktiv");
  const onboarding = sorted.filter((e) => e.status === "onboarding");
  const inaktiv = sorted.filter((e) => e.status === "inaktiv");

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Kürzel-Verzeichnis</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Alle Mitarbeiter — archivierungspflichtig für Lebensmittelamt / TÜV-Kontrollen</p>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 border border-border/60 rounded-xl text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors">
          <Printer className="w-4 h-4" /> Drucken
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 overflow-hidden">
        <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] text-white px-5 py-3">
          <p className="text-sm font-bold">EDEKA DALLMANN — Mitarbeiter-Kürzel-Verzeichnis</p>
          <p className="text-xs text-blue-200">Stand: {new Date().toLocaleDateString("de-DE")} · Gesamt: {employees.length} Einträge</p>
        </div>

        {[{ list: aktiv, title: "Aktive Mitarbeiter", statusKey: "aktiv" as Status },
          { list: onboarding, title: "Onboarding", statusKey: "onboarding" as Status },
          { list: inaktiv, title: "Inaktive Mitarbeiter (historisch — nicht entfernen)", statusKey: "inaktiv" as Status },
        ].map(({ list, title, statusKey }) => list.length === 0 ? null : (
          <div key={statusKey}>
            <div className={`px-5 py-2 border-b border-border/30 ${statusKey === "inaktiv" ? "bg-slate-50" : statusKey === "onboarding" ? "bg-amber-50" : "bg-green-50"}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${STATUS_CONFIG[statusKey].color}`}>{title} ({list.length})</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="text-left px-5 py-2 text-xs font-semibold text-muted-foreground w-16">Kürzel</th>
                  <th className="text-left px-5 py-2 text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-5 py-2 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Geburtsdatum</th>
                  <th className="text-left px-5 py-2 text-xs font-semibold text-muted-foreground hidden sm:table-cell">PIN</th>
                  <th className="text-left px-5 py-2 text-xs font-semibold text-muted-foreground hidden md:table-cell">Angelegt</th>
                </tr>
              </thead>
              <tbody>
                {list.map((emp, idx) => (
                  <tr key={emp.id} className={`border-b border-border/20 ${idx % 2 === 0 ? "bg-white" : "bg-blue-50/30"} ${emp.status === "inaktiv" ? "opacity-60" : ""}`}>
                    <td className="px-5 py-2.5">
                      <span className="font-bold text-sm font-mono bg-muted/40 px-2 py-0.5 rounded">{emp.initials || "—"}</span>
                    </td>
                    <td className="px-5 py-2.5 text-sm font-medium">{emp.lastName}, {emp.firstName}</td>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                      {emp.birthDate ? new Date(emp.birthDate).toLocaleDateString("de-DE") : "—"}
                    </td>
                    <td className="px-5 py-2.5 hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${emp.hasPin ? "bg-[#1a3a6b]/10 text-[#1a3a6b]" : "bg-red-50 text-red-500"}`}>
                        {emp.hasPin ? "gesetzt" : "nicht gesetzt"}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                      {new Date(emp.createdAt).toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="px-5 py-3 bg-muted/20 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>Kürzel-Verzeichnis nach LFGB / VO (EG) 852/2004</span>
          <span>{new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs font-medium text-amber-800 leading-relaxed">
          <strong>Archivierungspflicht:</strong> Dieses Verzeichnis muss vollständig aufbewahrt werden. Inaktive Mitarbeiter und deren Kürzel
          durfen nicht entfernt werden, da sie zur Ruckverfolgbarkeit in historischen HACCP-Dokumenten dienen. Bitte bei Kontrollen vorlegen.
        </p>
      </div>
    </div>
  );
}

// ===== HAUPTSEITE =====
export default function Mitarbeiterverwaltung() {
  const { adminSession, hasPermission } = useAppStore();
  const isAdmin = adminSession?.role === "ADMIN" || adminSession?.role === "SUPERADMIN" || adminSession?.role === "MARKTLEITER" || adminSession?.role === "BEREICHSLEITUNG" || hasPermission("users.manage");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"mitarbeiter" | "kuerzel">("mitarbeiter");
  const [filter, setFilter] = useState<"alle" | Status>("aktiv");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [showForm, setShowForm] = useState(false);

  const tenantId = adminSession?.tenantId || 1;

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/users?tenantId=${tenantId}`);
      const data = await res.json();
      const pinRes = await fetch(`${BASE}/users/pin-status?tenantId=${tenantId}`);
      let pinStatus: Record<number, boolean> = {};
      if (pinRes.ok) {
        pinStatus = await pinRes.json();
      }
      setEmployees(data.map((u: Employee) => ({ ...u, hasPin: !!pinStatus[u.id] })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-lg font-bold text-foreground">Zugriff verweigert</p>
          <p className="text-sm text-muted-foreground">Dieser Bereich ist nur fur Administratoren zugänglich.</p>
        </div>
      </AppLayout>
    );
  }

  const handleCreate = async (data: any): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${BASE}/users/admin-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...data }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error || "Fehler beim Anlegen." };
      await loadEmployees();
      setShowForm(false);
      return {};
    } catch { return { error: "Netzwerkfehler." }; }
  };

  const handleUpdate = async (id: number, data: Partial<Employee>): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${BASE}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error || "Fehler beim Speichern." };
      setEmployees((p) => p.map((e) => e.id === id ? { ...e, ...json, hasPin: e.hasPin } : e));
      return {};
    } catch { return { error: "Netzwerkfehler." }; }
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/users/${id}`, { method: "DELETE" });
    setEmployees((p) => p.filter((e) => e.id !== id));
  };

  const handlePinChange = async (id: number, pin: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${BASE}/users/${id}/pin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error || "Fehler beim Speichern." };
      setEmployees((p) => p.map((e) => e.id === id ? { ...e, hasPin: true } : e));
      return {};
    } catch { return { error: "Netzwerkfehler." }; }
  };

  const aktiv = employees.filter((e) => e.status === "aktiv").length;
  const onboarding = employees.filter((e) => e.status === "onboarding").length;
  const inaktiv = employees.filter((e) => e.status === "inaktiv").length;
  const keinPin = employees.filter((e) => e.status !== "inaktiv" && !e.hasPin).length;

  const GRUPPE_ORDER: Record<string, number> = { gesamter_markt: 0, markt: 1, metzgerei: 2 };

  const filtered = employees
    .filter((e) => {
      if (filter !== "alle" && e.status !== filter) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !(e.initials || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      if (sortBy === "gruppe_asc") return (GRUPPE_ORDER[a.gruppe || ""] ?? 9) - (GRUPPE_ORDER[b.gruppe || ""] ?? 9);
      if (sortBy === "status_asc") return a.status.localeCompare(b.status);
      return 0;
    });

  const existingInitials = employees.map((e) => (e.initials || "").toUpperCase());

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4 pb-10">

        {/* Header */}
        <PageHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/verwaltung" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Mitarbeiterverwaltung</h1>
                <p className="text-white/70 text-sm">Mitarbeiter-, Kürzel- und PIN-Verwaltung</p>
              </div>
            </div>
            <button onClick={loadEmployees} className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0" title="Aktualisieren">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Aktiv", value: aktiv, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
            { label: "Onboarding", value: onboarding, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
            { label: "Inaktiv", value: inaktiv, color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200" },
            { label: "Ohne PIN", value: keinPin, color: keinPin > 0 ? "text-red-600" : "text-muted-foreground", bg: keinPin > 0 ? "bg-red-50" : "bg-muted/30", border: keinPin > 0 ? "border-red-200" : "border-border/40" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-3 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-2xl border border-border/30">
          <button onClick={() => setTab("mitarbeiter")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "mitarbeiter" ? "bg-white shadow-sm border border-border/40 text-[#1a3a6b]" : "text-muted-foreground hover:text-foreground"}`}>
            <Users className="w-4 h-4" /> Mitarbeiter
          </button>
          <button onClick={() => setTab("kuerzel")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "kuerzel" ? "bg-white shadow-sm border border-border/40 text-[#1a3a6b]" : "text-muted-foreground hover:text-foreground"}`}>
            <ShieldCheck className="w-4 h-4" /> Kürzel-Verzeichnis
          </button>
        </div>

        {/* Mitarbeiter Tab */}
        {tab === "mitarbeiter" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name oder Kürzel suchen..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
                </div>
                {!showForm && (
                  <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] transition-colors shadow-sm whitespace-nowrap">
                    <UserPlus className="w-4 h-4" /> Neu
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1 flex-wrap">
                  {(["alle", "aktiv", "inaktiv"] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${filter === f ? "bg-[#1a3a6b] text-white" : "bg-white border border-border/60 text-muted-foreground hover:text-foreground"}`}>
                      {f === "alle" ? "Alle" : STATUS_CONFIG[f]?.label || f}
                    </button>
                  ))}
                </div>
                <div className="ml-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs border border-border/60 rounded-xl px-3 py-1.5 bg-white focus:outline-none text-muted-foreground"
                  >
                    {SORT_BY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {showForm && (
              <NeuerMitarbeiterForm
                onSave={handleCreate}
                onCancel={() => setShowForm(false)}
                existingInitials={existingInitials}
              />
            )}

            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border/40">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Keine Mitarbeiter gefunden</p>
                <p className="text-xs text-muted-foreground mt-1">Filter anpassen oder neuen Mitarbeiter anlegen</p>
              </div>
            ) : filter === "alle" ? (
              <>
                <div className="space-y-3">
                  {filtered.filter(e => e.status !== "inaktiv").map((emp) => (
                    <MitarbeiterKarte key={emp.id} emp={emp} onUpdate={handleUpdate} onDelete={handleDelete} onPinChange={handlePinChange} tenantId={tenantId} />
                  ))}
                </div>
                {filtered.some(e => e.status === "inaktiv") && (
                  <div className="mt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                        Inaktive Mitarbeiter ({filtered.filter(e => e.status === "inaktiv").length})
                      </span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="space-y-3 opacity-60">
                      {filtered.filter(e => e.status === "inaktiv").map((emp) => (
                        <MitarbeiterKarte key={emp.id} emp={emp} onUpdate={handleUpdate} onDelete={handleDelete} onPinChange={handlePinChange} tenantId={tenantId} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {filtered.map((emp) => (
                  <MitarbeiterKarte key={emp.id} emp={emp} onUpdate={handleUpdate} onDelete={handleDelete} onPinChange={handlePinChange} tenantId={tenantId} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Kürzel-Verzeichnis Tab */}
        {tab === "kuerzel" && <KuerzelVerzeichnis employees={employees} />}
      </div>
    </AppLayout>
  );
}
