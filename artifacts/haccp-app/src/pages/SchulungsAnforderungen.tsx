import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  GraduationCap, Plus, Pencil, Trash2, Save, X, AlertTriangle,
  CheckCircle2, Clock, ChevronLeft, Loader2, ToggleLeft, ToggleRight,
  Users, ShieldAlert, AlarmClock, UserCheck,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

const GRUPPEN_OPTS = [
  { value: "gesamter_markt", label: "Gesamter Markt", color: "text-violet-700", bg: "bg-violet-100 border-violet-200" },
  { value: "markt",          label: "Markt",          color: "text-sky-700",    bg: "bg-sky-100 border-sky-200" },
  { value: "metzgerei",      label: "Metzgerei",      color: "text-orange-700", bg: "bg-orange-100 border-orange-200" },
];

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
    intervallMonate: number;
    status: "ok" | "bald_fällig" | "überfällig" | "fehlend" | "ausnahme";
    naechsteSchulung: string | null;
    ausnahme: { id: number; begruendung: string } | null;
  }[];
}

const INTERVALL_OPTS = [
  { label: "Monatlich", value: 1 },
  { label: "Vierteljährlich", value: 3 },
  { label: "Halbjährlich", value: 6 },
  { label: "Jährlich", value: 12 },
  { label: "Alle 2 Jahre", value: 24 },
  { label: "Alle 3 Jahre", value: 36 },
];

function GruppePill({ value }: { value: string }) {
  const g = GRUPPEN_OPTS.find((x) => x.value === value);
  if (!g) return null;
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${g.bg} ${g.color}`}>
      {g.label}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    ok:           { label: "OK",          color: "text-green-700", bg: "bg-green-100 border-green-200",   icon: <CheckCircle2 className="w-3 h-3" /> },
    bald_fällig:  { label: "Bald fällig", color: "text-amber-700", bg: "bg-amber-100 border-amber-200",   icon: <AlarmClock className="w-3 h-3" /> },
    überfällig:   { label: "Überfällig",  color: "text-red-700",   bg: "bg-red-100 border-red-200",       icon: <AlertTriangle className="w-3 h-3" /> },
    fehlend:      { label: "Fehlend",     color: "text-slate-700", bg: "bg-slate-100 border-slate-200",   icon: <X className="w-3 h-3" /> },
    ausnahme:     { label: "Ausnahme",    color: "text-gray-500",  bg: "bg-gray-100 border-gray-200",     icon: <ShieldAlert className="w-3 h-3" /> },
  };
  const c = map[status] || map.fehlend;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
}

function PflichtForm({ initial, onSave, onCancel }: {
  initial?: Partial<Pflicht>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
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

  const toggleGruppe = (g: string) => {
    setGruppen((p) => p.includes(g) ? p.filter((x) => x !== g) : [...p, g]);
  };

  const handleSave = async () => {
    if (!kategorie.trim() || !bezeichnung.trim()) {
      setError("Bitte Kategorie und Anzeigename ausfüllen.");
      return;
    }
    if (!personSpezifisch && gruppen.length === 0) {
      setError("Bitte mindestens eine Gruppe wählen oder auf Personenspezifisch umschalten.");
      return;
    }
    setSaving(true);
    setError("");
    await onSave({
      tenantId,
      schulungKategorie: kategorie.trim(),
      bezeichnung: bezeichnung.trim(),
      gueltigeGruppen: personSpezifisch ? [] : gruppen,
      intervallMonate: intervall,
      isActive: initial?.is_active ?? true,
      personSpezifisch,
      subbereich: subbereich.trim() || null,
    });
    setSaving(false);
  };

  return (
    <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-4">
      <p className="text-sm font-bold text-foreground">{initial?.id ? "Schulung bearbeiten" : "Neue Schulungspflicht"}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kategorie-Schlüssel</label>
          <input value={kategorie} onChange={(e) => setKategorie(e.target.value)} placeholder="z.B. Ersthelfer"
            className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
          <p className="text-xs text-muted-foreground">Muss mit der Kategorie in den Schulungsnachweisen übereinstimmen.</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Anzeigename</label>
          <input value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} placeholder="z.B. Ersthelfer-Ausbildung"
            className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
        </div>
      </div>

      {/* Personenspezifisch Toggle */}
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
            <strong>Personenspezifisch:</strong> Gilt automatisch für alle Mitarbeiter, die bereits einen Nachweis dieser Kategorie im Schulungsordner haben. Ideal für Ersthelfer, Brandschutzbeauftragte, Strohschwein-Schulungen etc.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Schulung gilt verpflichtend für alle Mitarbeiter der gewählten Gruppen.</p>
        )}
      </div>

      {/* Gruppen (nur wenn gruppenbasiert) */}
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
          Subbereich <span className="text-muted-foreground font-normal normal-case">(optional)</span>
        </label>
        <input value={subbereich} onChange={(e) => setSubbereich(e.target.value)}
          placeholder="z.B. Feuerwerk, Fleischhygiene"
          className="px-3 py-2 rounded-lg border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20" />
        <p className="text-xs text-muted-foreground">
          Wenn gesetzt, wird auch das Feld „Bezeichnung" im Schulungsnachweis abgeglichen (enthält den Subbereich).
        </p>
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
        <button onClick={onCancel}
          className="px-4 py-2 bg-white border border-border/60 rounded-lg text-xs font-semibold text-muted-foreground">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

export default function SchulungsAnforderungen() {
  const { adminSession } = useAppStore();
  const tenantId = adminSession?.tenantId || 1;

  const [tab, setTab] = useState<"pflichten" | "compliance">("pflichten");
  const [pflichten, setPflichten] = useState<Pflicht[]>([]);
  const [compliance, setCompliance] = useState<ComplianceEntry[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingC, setLoadingC] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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

  useEffect(() => { loadPflichten(); }, [loadPflichten]);
  useEffect(() => {
    if (tab === "compliance") loadCompliance();
  }, [tab, loadCompliance]);

  const handleCreate = async (data: any) => {
    const res = await fetch(`${BASE}/schulungs-pflichten`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { setShowForm(false); await loadPflichten(); }
  };

  const handleUpdate = async (id: number, data: any) => {
    const res = await fetch(`${BASE}/schulungs-pflichten/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { setEditingId(null); await loadPflichten(); }
  };

  const handleToggleActive = async (p: Pflicht) => {
    await fetch(`${BASE}/schulungs-pflichten/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schulungKategorie: p.schulung_kategorie,
        bezeichnung: p.bezeichnung,
        gueltigeGruppen: p.gueltige_gruppen,
        intervallMonate: p.intervall_monate,
        isActive: !p.is_active,
        personSpezifisch: p.person_spezifisch,
        subbereich: p.subbereich,
      }),
    });
    await loadPflichten();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/schulungs-pflichten/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await loadPflichten();
  };

  const INTERVALL_LABEL: Record<number, string> = {
    1: "Monatlich", 3: "Vierteljährlich", 6: "Halbjährlich",
    12: "Jährlich", 24: "Alle 2 Jahre", 36: "Alle 3 Jahre",
  };

  const withProblems = compliance.filter((e) => e.hasProblems || e.warningCount > 0);
  const problemOnly = compliance.filter((e) => e.hasProblems);
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
              <p className="text-sm text-muted-foreground">
                {pflichten.length} Schulungspflichten konfiguriert
              </p>
              {!showForm && (
                <button onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] transition-colors">
                  <Plus className="w-4 h-4" /> Neue Anforderung
                </button>
              )}
            </div>

            {/* Hinweis-Box personenspezifische Schulungen */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-xs text-teal-800 leading-relaxed">
              <strong>Personenspezifische Schulungen</strong> (z.B. Ersthelfer, Brandschutz, Strohschwein) erscheinen automatisch bei den Mitarbeitern, die einen entsprechenden Nachweis im Schulungsordner hinterlegt haben — unabhängig von der Gruppe.
            </div>

            {showForm && (
              <PflichtForm
                onSave={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            )}

            {loadingP ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-3">
                {pflichten.map((p) => (
                  <div key={p.id} className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${p.is_active ? (p.person_spezifisch ? "border-teal-200" : "border-border/40") : "border-slate-200 opacity-60"}`}>
                    {editingId === p.id ? (
                      <div className="p-4">
                        <PflichtForm
                          initial={p}
                          onSave={(data) => handleUpdate(p.id, data)}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    ) : (
                      <div className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-foreground">{p.bezeichnung}</p>
                              {p.person_spezifisch && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 border border-teal-200 text-teal-700">
                                  <UserCheck className="w-3 h-3" /> Personenspezifisch
                                </span>
                              )}
                              {!p.is_active && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Inaktiv</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Kategorie: <span className="font-semibold text-foreground">{p.schulung_kategorie}</span>
                              {p.subbereich && <> · Subbereich: <span className="font-semibold text-foreground">{p.subbereich}</span></>}
                              {" · "}
                              <Clock className="w-3 h-3 inline" /> {INTERVALL_LABEL[p.intervall_monate] || `Alle ${p.intervall_monate} Monate`}
                            </p>
                            {!p.person_spezifisch && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(p.gueltige_gruppen || []).map((g) => (
                                  <GruppePill key={g} value={g} />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => handleToggleActive(p)} title={p.is_active ? "Deaktivieren" : "Aktivieren"}
                              className="text-muted-foreground hover:text-[#1a3a6b] transition-colors">
                              {p.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                            </button>
                            <button onClick={() => setEditingId(p.id)}
                              className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {confirmDelete === p.id ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-red-600 font-medium">Löschen?</span>
                                <button onClick={() => handleDelete(p.id)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">Ja</button>
                                <button onClick={() => setConfirmDelete(null)}
                                  className="px-2 py-1 border border-border/60 rounded text-xs font-semibold text-muted-foreground">Nein</button>
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
                ))}
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
                    <p className="text-2xl font-bold text-red-700">{problemOnly.length}</p>
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
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Handlungsbedarf / Bald fällig</p>
                    {withProblems.map((emp) => (
                      <ComplianceCard key={emp.employeeId} entry={emp} />
                    ))}
                  </div>
                )}

                {okOnly.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Alles aktuell</p>
                    {okOnly.map((emp) => (
                      <ComplianceCard key={emp.employeeId} entry={emp} compact />
                    ))}
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
            <div key={t.pflichtId} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-semibold text-foreground">{t.bezeichnung}</p>
                  {t.personSpezifisch && (
                    <span className="text-xs text-teal-600 font-medium">· Extern</span>
                  )}
                </div>
                {t.naechsteSchulung && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nächste Schulung: {new Date(t.naechsteSchulung).toLocaleDateString("de-DE")}
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
