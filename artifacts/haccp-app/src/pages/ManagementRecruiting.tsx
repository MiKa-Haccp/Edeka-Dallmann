import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useLocation, Link } from "wouter";
import { Plus, X, ChevronLeft, User, Phone, Mail, Star } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";
const ALLOWED_ROLES = ["SUPERADMIN", "ADMIN"];

export const RECRUITING_STAGES: { key: string; label: string; color: string; bg: string; border: string; dot: string }[] = [
  { key: "eingang",   label: "Eingang",             color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   dot: "bg-blue-500" },
  { key: "einladung", label: "Einladung",            color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", dot: "bg-violet-500" },
  { key: "gespraech", label: "Gespräch geführt",     color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-500" },
  { key: "vertrag",   label: "Vertrag / Einstellung",color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-500" },
  { key: "absage",    label: "Absage",               color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-500" },
];

export type Applicant = {
  id: number;
  tenantId: number;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  experienceKasse?: boolean;
  experienceLaden?: boolean;
  experienceObst?: boolean;
  experienceMopro?: boolean;
  experienceMetzgerei?: boolean;
  flexibility?: string;
  hoursWish?: string;
  entryDate?: string;
  salaryWish?: string;
  status: string;
  notes?: string;
  photoBase64?: string;
  sortOrder: number;
  createdAt: string;
};

function expLabels(a: Applicant) {
  const labs: string[] = [];
  if (a.experienceKasse)    labs.push("Kasse");
  if (a.experienceLaden)    labs.push("Laden");
  if (a.experienceObst)     labs.push("O&G");
  if (a.experienceMopro)    labs.push("MoPro");
  if (a.experienceMetzgerei)labs.push("Metzg.");
  return labs;
}

function ApplicantCard({
  app,
  onDragStart,
  onClick,
}: {
  app: Applicant;
  onDragStart: (e: React.DragEvent, app: Applicant) => void;
  onClick: () => void;
}) {
  const exps = expLabels(app);
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, app)}
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer select-none group"
    >
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1a3a6b]/10 flex items-center justify-center shrink-0">
            {app.photoBase64 ? (
              <img src={app.photoBase64} className="w-8 h-8 rounded-full object-cover" alt={app.name} />
            ) : (
              <User className="w-4 h-4 text-[#1a3a6b]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug">{app.name}</p>
            {app.source && <p className="text-xs text-gray-400">{app.source}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {app.hoursWish && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{app.hoursWish} Std.</span>
          )}
          {exps.slice(0, 3).map(e => (
            <span key={e} className="text-xs bg-[#1a3a6b]/10 text-[#1a3a6b] px-2 py-0.5 rounded-full">{e}</span>
          ))}
          {exps.length > 3 && <span className="text-xs text-gray-400">+{exps.length - 3}</span>}
        </div>

        {(app.phone || app.email) && (
          <div className="flex items-center gap-2 mt-1.5">
            {app.phone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone className="w-3 h-3" />{app.phone}</span>}
            {app.email && <span className="flex items-center gap-1 text-xs text-gray-400 truncate"><Mail className="w-3 h-3" />{app.email}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  applicants,
  onDragStart,
  onDrop,
  onDragOver,
  onClick,
  onAddNew,
  dragOverStage,
}: {
  stage: typeof RECRUITING_STAGES[0];
  applicants: Applicant[];
  onDragStart: (e: React.DragEvent, app: Applicant) => void;
  onDrop: (e: React.DragEvent, stageKey: string) => void;
  onDragOver: (e: React.DragEvent, stageKey: string) => void;
  onClick: (app: Applicant) => void;
  onAddNew: (stageKey: string) => void;
  dragOverStage: string | null;
}) {
  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] w-[260px]">
      <div className={`rounded-t-xl px-4 py-3 border-b-2 ${stage.bg} ${stage.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
            <span className={`font-bold text-sm ${stage.color}`}>{stage.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.bg} ${stage.color} border ${stage.border}`}>
              {applicants.length}
            </span>
            <button
              onClick={() => onAddNew(stage.key)}
              className={`p-1 rounded-lg hover:bg-white/80 ${stage.color} transition-colors`}
              title="Neue Bewerbung"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        onDrop={e => onDrop(e, stage.key)}
        onDragOver={e => onDragOver(e, stage.key)}
        className={`flex-1 rounded-b-xl border ${stage.border} p-3 space-y-2 min-h-[160px] transition-colors ${
          dragOverStage === stage.key ? `${stage.bg} border-dashed` : "bg-gray-50/50"
        }`}
      >
        {applicants.length === 0 && dragOverStage !== stage.key && (
          <p className="text-xs text-gray-400 italic text-center py-8">Keine Bewerbungen</p>
        )}
        {applicants.map(app => (
          <ApplicantCard
            key={app.id}
            app={app}
            onDragStart={onDragStart}
            onClick={() => onClick(app)}
          />
        ))}
        {dragOverStage === stage.key && (
          <div className={`rounded-xl border-2 border-dashed ${stage.border} h-16 flex items-center justify-center`}>
            <span className={`text-xs ${stage.color} font-medium`}>Hier ablegen</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quick-Add Modal ────────────────────────────────────────
function QuickAddModal({
  initialStatus,
  onClose,
  onCreated,
}: {
  initialStatus: string;
  onClose: () => void;
  onCreated: (app: Applicant) => void;
}) {
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/management/applicants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), source, phone, status: initialStatus, tenantId: 1 }),
      });
      const app = await r.json();
      onCreated(app);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-lg text-[#1a3a6b]">Neue Bewerbung</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
            <input autoFocus className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30" value={name} onChange={e => setName(e.target.value)} placeholder="Vollständiger Name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Quelle</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30" value={source} onChange={e => setSource(e.target.value)} placeholder="z.B. Indeed, Walk-in, Empfehlung" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Telefon</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0xxx xxxxxxx" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Abbrechen</button>
            <button onClick={save} disabled={!name.trim() || saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#1a3a6b" }}>
              Anlegen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function ManagementRecruiting() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragApp, setDragApp] = useState<Applicant | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState<string | null>(null);

  useEffect(() => {
    if (!adminSession || !ALLOWED_ROLES.includes(adminSession.role)) {
      navigate("/");
      return;
    }
    loadApplicants();
  }, [adminSession]);

  const loadApplicants = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/management/applicants?tenantId=1`);
      const data = await r.json();
      setApplicants(Array.isArray(data) ? data : []);
    } catch {
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, app: Applicant) => {
    setDragApp(app);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!dragApp || dragApp.status === stageKey) { setDragApp(null); return; }
    const updated = { ...dragApp, status: stageKey };
    setApplicants(prev => prev.map(a => a.id === dragApp.id ? updated : a));
    await fetch(`${BASE}/management/applicants/${dragApp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: stageKey }),
    });
    setDragApp(null);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageKey);
  };

  const appsByStage = (stageKey: string) =>
    applicants.filter(a => a.status === stageKey).sort((a, b) => a.sortOrder - b.sortOrder);

  if (!adminSession || !ALLOWED_ROLES.includes(adminSession.role)) return null;

  return (
    <AppLayout>
      <div className="px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/management" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1a3a6b]">Recruiting-Center</h1>
            <p className="text-sm text-gray-500">Bewerbungen verwalten – vom Eingang bis zur Einstellung</p>
          </div>
          <button
            onClick={() => setQuickAdd("eingang")}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: "#1a3a6b" }}
          >
            <Plus className="w-4 h-4" />
            Neue Bewerbung
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#1a3a6b]/20 border-t-[#1a3a6b] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {RECRUITING_STAGES.map(stage => (
              <StageColumn
                key={stage.key}
                stage={stage}
                applicants={appsByStage(stage.key)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={app => navigate(`/management/bewerber/${app.id}`)}
                onAddNew={stageKey => setQuickAdd(stageKey)}
                dragOverStage={dragOverStage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {quickAdd !== null && (
        <QuickAddModal
          initialStatus={quickAdd}
          onClose={() => setQuickAdd(null)}
          onCreated={app => setApplicants(prev => [...prev, app])}
        />
      )}
    </AppLayout>
  );
}
