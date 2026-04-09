import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import {
  FolderKanban, Plus, ChevronLeft, Trash2, CheckCircle2, Circle,
  Clock, AlertCircle, Phone, Mail, MessageSquare, FileText, Loader2,
  ArrowRight, Lock, Check, X, ChevronDown, ChevronUp, Pencil,
  Calendar, User, Building2, BookOpen, ListChecks,
  Inbox, SendHorizontal, MailCheck, Edit2, RefreshCw,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

const STATUS_CONFIG = {
  geplant:               { label: "Geplant",               color: "bg-slate-100 text-slate-700",         dot: "bg-slate-400" },
  in_arbeit:             { label: "In Arbeit",              color: "bg-blue-100 text-blue-700",           dot: "bg-blue-500" },
  freigabe_erforderlich: { label: "Freigabe erforderlich",  color: "bg-amber-100 text-amber-700",         dot: "bg-amber-500" },
  abgeschlossen:         { label: "Abgeschlossen",          color: "bg-green-100 text-green-700",         dot: "bg-green-500" },
};

const TASK_STATUS_CONFIG = {
  pending: { label: "Wartend",  icon: Lock,          color: "text-slate-400",  bg: "bg-slate-50  border-slate-200" },
  active:  { label: "Aktiv",    icon: Circle,        color: "text-blue-500",   bg: "bg-blue-50   border-blue-200" },
  done:    { label: "Erledigt", icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50  border-green-200" },
};

const LOG_TYPE_CONFIG = {
  email:   { label: "E-Mail",          icon: Mail,           color: "text-blue-600",   bg: "bg-blue-50  border-blue-200" },
  phone:   { label: "Telefonat",       icon: Phone,          color: "text-green-600",  bg: "bg-green-50 border-green-200" },
  meeting: { label: "Gesprächsnotiz",  icon: MessageSquare,  color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  note:    { label: "Notiz",           icon: FileText,       color: "text-slate-600",  bg: "bg-slate-50 border-slate-200" },
};

const PROJECT_COLORS = [
  { key: "blue",    bg: "bg-blue-50",   text: "text-blue-700",   icon: "bg-blue-100" },
  { key: "orange",  bg: "bg-orange-50", text: "text-orange-700", icon: "bg-orange-100" },
  { key: "green",   bg: "bg-green-50",  text: "text-green-700",  icon: "bg-green-100" },
  { key: "purple",  bg: "bg-purple-50", text: "text-purple-700", icon: "bg-purple-100" },
  { key: "red",     bg: "bg-red-50",    text: "text-red-700",    icon: "bg-red-100" },
];

function projectColorClasses(color: string) {
  return PROJECT_COLORS.find(c => c.key === color) || PROJECT_COLORS[0];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

interface Project {
  id: number; name: string; description: string | null; status: string;
  color: string; market_id: number | null; market_name: string | null;
  created_by_name: string | null; created_at: string; updated_at: string;
}
interface LogEntry {
  id: number; project_id: number; entry_type: string; content: string;
  beteiligte_partei: string | null; created_by_name: string | null; created_at: string;
}
interface Task {
  id: number; project_id: number; title: string; description: string | null;
  status: string; depends_on_task_id: number | null; order_index: number;
  requires_approval: boolean; approval_note: string | null; assigned_to: string | null;
  completed_at: string | null; completed_by_name: string | null;
  dispatch_status: string; dispatch_to: string | null;
}

interface InboxItem {
  id: number; project_id: number; project_name: string; project_color: string;
  market_name: string | null; title: string; description: string | null;
  approval_note: string | null; assigned_to: string | null; status: string;
  dispatch_status: string; dispatch_to: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.geplant;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const cls = projectColorClasses(project.color);
  const taskCount = 0;
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-border/60 hover:border-blue-200 hover:shadow-md transition-all p-5 space-y-3 group"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${cls.icon} flex items-center justify-center shrink-0`}>
          <FolderKanban className={`w-5 h-5 ${cls.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate group-hover:text-[#1a3a6b] transition-colors">{project.name}</p>
          {project.market_name && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3" /> {project.market_name}
            </p>
          )}
        </div>
        <StatusBadge status={project.status} />
      </div>
      {project.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/40">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(project.updated_at)}</span>
        {project.created_by_name && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {project.created_by_name}</span>}
        <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-[#1a3a6b] transition-opacity" />
      </div>
    </button>
  );
}

function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Project) => void }) {
  const { adminSession, selectedMarketId } = useAppStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("geplant");
  const [color, setColor] = useState("blue");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), description: description.trim() || null,
          status, color, marketId: selectedMarketId || null,
          createdByName: adminSession?.name || null,
        }),
      });
      const p = await r.json();
      onCreate(p);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Neues Projekt</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projektname *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Umbau Marktoberdorf"
              className="w-full mt-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Beschreibung</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Kurze Beschreibung des Projekts..."
              className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full mt-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 bg-white">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Farbe</label>
            <div className="flex gap-2 mt-1">
              {PROJECT_COLORS.map(c => (
                <button key={c.key} onClick={() => setColor(c.key)}
                  className={`w-8 h-8 rounded-full ${c.icon} border-2 transition-all ${color === c.key ? "border-[#1a3a6b] scale-110" : "border-transparent hover:scale-105"}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Abbrechen</button>
          <button onClick={save} disabled={!name.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#2d5aa0] transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Erstellen
          </button>
        </div>
      </div>
    </div>
  );
}

function LogEntryForm({ projectId, onAdded }: { projectId: number; onAdded: () => void }) {
  const { adminSession } = useAppStore();
  const [open, setOpen] = useState(false);
  const [entryType, setEntryType] = useState("note");
  const [content, setContent] = useState("");
  const [beteiligte, setBeteiligte] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/projects/${projectId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryType, content: content.trim(),
          beteiligtPartei: beteiligte.trim() || null,
          createdByName: adminSession?.name || null,
        }),
      });
      setContent(""); setBeteiligte(""); setOpen(false);
      onAdded();
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
        <span className="text-sm font-semibold flex items-center gap-2 text-[#1a3a6b]">
          <Plus className="w-4 h-4" /> Neuer Eintrag
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(LOG_TYPE_CONFIG).map(([k, v]) => (
              <button key={k} onClick={() => setEntryType(k)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${entryType === k ? `border-[#1a3a6b] bg-[#1a3a6b]/5 ${v.color}` : "border-border text-muted-foreground hover:border-[#1a3a6b]/30"}`}>
                <v.icon className="w-3 h-3" /> {v.label}
              </button>
            ))}
          </div>
          <input value={beteiligte} onChange={e => setBeteiligte(e.target.value)}
            placeholder="Beteiligte Partei (z.B. Edeka Bau, Schreiner Müller)"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30" />
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={3}
            placeholder="Inhalt des Eintrags..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Abbrechen</button>
            <button onClick={save} disabled={!content.trim() || saving}
              className="flex-1 py-2 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#2d5aa0] transition-colors flex items-center justify-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Eintragen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LogFeed({ entries, onDelete, canDelete }: { entries: LogEntry[]; onDelete: (id: number) => void; canDelete: boolean }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
        <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Noch keine Einträge vorhanden</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {entries.map(e => {
        const cfg = LOG_TYPE_CONFIG[e.entry_type as keyof typeof LOG_TYPE_CONFIG] || LOG_TYPE_CONFIG.note;
        return (
          <div key={e.id} className={`rounded-xl border p-4 ${cfg.bg}`}>
            <div className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center shrink-0 mt-0.5 border border-border/40`}>
                <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                  {e.beteiligte_partei && (
                    <span className="text-xs bg-white/80 border border-border/40 px-2 py-0.5 rounded-full font-medium text-foreground">
                      {e.beteiligte_partei}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{e.content}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" /> {formatDateTime(e.created_at)}
                  {e.created_by_name && <><User className="w-3 h-3 ml-1" /> {e.created_by_name}</>}
                </div>
              </div>
              {canDelete && (
                <button onClick={() => onDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({ task, allTasks, onComplete, onUncomplete, canEdit }: {
  task: Task; allTasks: Task[];
  onComplete: (id: number) => void; onUncomplete: (id: number) => void;
  canEdit: boolean;
}) {
  const cfg = TASK_STATUS_CONFIG[task.status as keyof typeof TASK_STATUS_CONFIG] || TASK_STATUS_CONFIG.pending;
  const dependency = allTasks.find(t => t.id === task.depends_on_task_id);
  const StatusIcon = cfg.icon;

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg} transition-all`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {task.status === "pending" ? (
            <Lock className={`w-5 h-5 ${cfg.color}`} />
          ) : task.status === "done" ? (
            <CheckCircle2 className={`w-5 h-5 ${cfg.color}`} />
          ) : (
            <Circle className={`w-5 h-5 ${cfg.color}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-sm ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {task.title}
            </p>
            {task.requires_approval && task.status !== "done" && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Freigabe
              </span>
            )}
          </div>
          {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            {task.assigned_to && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {task.assigned_to}</span>}
            {dependency && task.status === "pending" && (
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="w-3 h-3" /> Wartet auf: {dependency.title}
              </span>
            )}
            {task.completed_at && (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="w-3 h-3" /> {formatDate(task.completed_at)}{task.completed_by_name ? ` – ${task.completed_by_name}` : ""}
              </span>
            )}
          </div>
          {task.approval_note && task.status !== "done" && (
            <p className="text-xs text-amber-600 mt-1 italic">{task.approval_note}</p>
          )}
        </div>
        {canEdit && task.status === "active" && (
          <button onClick={() => onComplete(task.id)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a3a6b] text-white text-xs font-bold hover:bg-[#2d5aa0] transition-colors">
            <Check className="w-3 h-3" /> Erledigt
          </button>
        )}
        {canEdit && task.status === "done" && (
          <button onClick={() => onUncomplete(task.id)}
            className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-3 h-3" /> Rückgängig
          </button>
        )}
      </div>
    </div>
  );
}

function AddTaskForm({ projectId, tasks, onAdded }: { projectId: number; tasks: Task[]; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dependsOn, setDependsOn] = useState<number | "">("");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), description: description.trim() || null,
          assignedTo: assignedTo.trim() || null,
          dependsOnTaskId: dependsOn || null,
          requiresApproval, approvalNote: approvalNote.trim() || null,
          orderIndex: tasks.length + 1,
        }),
      });
      setTitle(""); setDescription(""); setAssignedTo(""); setDependsOn(""); setRequiresApproval(false); setApprovalNote("");
      setOpen(false); onAdded();
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
        <span className="text-sm font-semibold flex items-center gap-2 text-[#1a3a6b]">
          <Plus className="w-4 h-4" /> Aufgabe hinzufügen
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Aufgabentitel *"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="Beschreibung (optional)"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 resize-none" />
          <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Verantwortlich (z.B. Bereichsleitung)"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30" />
          {tasks.length > 0 && (
            <select value={dependsOn} onChange={e => setDependsOn(e.target.value ? Number(e.target.value) : "")}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30">
              <option value="">Keine Abhängigkeit</option>
              {tasks.map(t => <option key={t.id} value={t.id}>Wartet auf: {t.title}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={requiresApproval} onChange={e => setRequiresApproval(e.target.checked)}
              className="w-4 h-4 rounded border-border" />
            <span className="text-sm font-medium">Freigabe erforderlich</span>
          </label>
          {requiresApproval && (
            <input value={approvalNote} onChange={e => setApprovalNote(e.target.value)}
              placeholder="Freigabe-Hinweis (wird per Telegram gesendet)"
              className="w-full border border-amber-200 bg-amber-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
          )}
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Abbrechen</button>
            <button onClick={save} disabled={!title.trim() || saving}
              className="flex-1 py-2 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#2d5aa0] transition-colors flex items-center justify-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Hinzufügen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectDetail({ project, onBack, onUpdated }: { project: Project; onBack: () => void; onUpdated: (p: Project) => void }) {
  const { adminSession } = useAppStore();
  const canEdit = !!adminSession;
  const [tab, setTab] = useState<"log" | "tasks">("log");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingLog, setLoadingLog] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [editStatus, setEditStatus] = useState(project.status);
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchLog = useCallback(async () => {
    setLoadingLog(true);
    try {
      const r = await fetch(`${BASE}/projects/${project.id}/log`);
      setLog(await r.json());
    } finally { setLoadingLog(false); }
  }, [project.id]);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const r = await fetch(`${BASE}/projects/${project.id}/tasks`);
      setTasks(await r.json());
    } finally { setLoadingTasks(false); }
  }, [project.id]);

  useEffect(() => { fetchLog(); fetchTasks(); }, [fetchLog, fetchTasks]);

  const handleDeleteLog = async (logId: number) => {
    await fetch(`${BASE}/projects/${project.id}/log/${logId}`, { method: "DELETE" });
    fetchLog();
  };

  const handleCompleteTask = async (taskId: number) => {
    await fetch(`${BASE}/projects/${project.id}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done", completedByName: adminSession?.name || null }),
    });
    fetchTasks();
  };

  const handleUncompleteTask = async (taskId: number) => {
    await fetch(`${BASE}/projects/${project.id}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    fetchTasks();
  };

  const handleStatusChange = async (newStatus: string) => {
    setEditStatus(newStatus);
    setSavingStatus(true);
    try {
      const r = await fetch(`${BASE}/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await r.json();
      onUpdated(updated);
    } finally { setSavingStatus(false); }
  };

  const cls = projectColorClasses(project.color);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-border/60 p-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Alle Projekte
        </button>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${cls.icon} flex items-center justify-center shrink-0`}>
            <FolderKanban className={`w-6 h-6 ${cls.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground">{project.name}</h2>
            {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              {project.market_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{project.market_name}</span>}
              {project.created_by_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{project.created_by_name}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(project.updated_at)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <select value={editStatus} onChange={e => handleStatusChange(e.target.value)}
              disabled={!canEdit || savingStatus}
              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 disabled:opacity-60">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            {savingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
        <button onClick={() => setTab("log")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "log" ? "bg-white shadow-sm text-[#1a3a6b]" : "text-muted-foreground hover:text-foreground"}`}>
          <BookOpen className="w-4 h-4" /> Logbuch ({log.length})
        </button>
        <button onClick={() => setTab("tasks")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "tasks" ? "bg-white shadow-sm text-[#1a3a6b]" : "text-muted-foreground hover:text-foreground"}`}>
          <ListChecks className="w-4 h-4" /> Aufgaben ({tasks.length})
        </button>
      </div>

      {tab === "log" && (
        <div className="space-y-3">
          {canEdit && <LogEntryForm projectId={project.id} onAdded={fetchLog} />}
          {loadingLog ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <LogFeed entries={log} onDelete={handleDeleteLog} canDelete={canEdit} />
          )}
        </div>
      )}

      {tab === "tasks" && (
        <div className="space-y-3">
          {canEdit && <AddTaskForm projectId={project.id} tasks={tasks} onAdded={fetchTasks} />}
          {loadingTasks ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
              <ListChecks className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Noch keine Aufgaben vorhanden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(t => (
                <TaskRow key={t.id} task={t} allTasks={tasks}
                  onComplete={handleCompleteTask} onUncomplete={handleUncompleteTask} canEdit={canEdit} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== MICHIS POSTEINGANG =====
function InboxCard({ item, onSent }: { item: InboxItem; onSent: (id: number) => void }) {
  const { adminSession } = useAppStore();
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [approvalNote, setApprovalNote] = useState(item.approval_note || "");
  const [sending, setSending] = useState<"sonja" | "kai" | null>(null);
  const [confirm, setConfirm] = useState<"sonja" | "kai" | null>(null);
  const [saving, setSaving] = useState(false);
  const cls = projectColorClasses(item.project_color);

  const saveEdit = async () => {
    setSaving(true);
    try {
      await fetch(`${BASE}/projects/${item.project_id}/tasks/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), approvalNote: approvalNote.trim() || null }),
      });
      setEditMode(false);
    } finally { setSaving(false); }
  };

  const dispatch = async (to: "sonja" | "kai") => {
    setSending(to);
    try {
      await fetch(`${BASE}/projects/${item.project_id}/tasks/${item.id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispatchTo: to, dispatchedByName: adminSession?.name || null }),
      });
      onSent(item.id);
    } finally { setSending(null); setConfirm(null); }
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className={`h-1.5 w-full ${cls.icon}`} />
      <div className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-xl ${cls.icon} flex items-center justify-center shrink-0`}>
            <FolderKanban className={`w-4 h-4 ${cls.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold ${cls.text} truncate`}>{item.project_name}</p>
            {item.market_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />{item.market_name}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            <AlertCircle className="w-3 h-3" /> Freigabe
          </span>
          <button onClick={() => setEditMode(e => !e)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {editMode ? (
          <div className="space-y-2">
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30" />
            <textarea value={approvalNote} onChange={e => setApprovalNote(e.target.value)} rows={2}
              placeholder="Freigabe-Hinweis (für den Empfänger)"
              className="w-full border border-amber-200 bg-amber-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => { setEditMode(false); setTitle(item.title); setApprovalNote(item.approval_note || ""); }}
                className="flex-1 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors">
                Abbrechen
              </button>
              <button onClick={saveEdit} disabled={saving || !title.trim()}
                className="flex-1 py-1.5 rounded-xl bg-[#1a3a6b] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#2d5aa0] transition-colors flex items-center justify-center gap-1.5">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Speichern
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-semibold text-foreground">{title}</p>
            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
            {approvalNote && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">{approvalNote}</p>
              </div>
            )}
            {item.assigned_to && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> {item.assigned_to}
              </p>
            )}
          </>
        )}

        {!editMode && (
          confirm ? (
            <div className="bg-[#1a3a6b]/5 border border-[#1a3a6b]/20 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-[#1a3a6b]">
                An {confirm === "sonja" ? "Sonja (Sekretariat)" : "Kai (Marktleiter)"} senden?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm(null)}
                  className="flex-1 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                  Abbrechen
                </button>
                <button onClick={() => dispatch(confirm)} disabled={!!sending}
                  className="flex-1 py-1.5 rounded-lg bg-[#1a3a6b] text-white text-xs font-bold hover:bg-[#2d5aa0] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {sending === confirm ? <Loader2 className="w-3 h-3 animate-spin" /> : <SendHorizontal className="w-3 h-3" />}
                  Ja, senden
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirm("sonja")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors">
                <SendHorizontal className="w-3.5 h-3.5" /> An Sonja
              </button>
              <button onClick={() => setConfirm("kai")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#1a3a6b]/8 border border-[#1a3a6b]/20 text-[#1a3a6b] text-xs font-bold hover:bg-[#1a3a6b]/15 transition-colors">
                <SendHorizontal className="w-3.5 h-3.5" /> An Kai
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function MichiPosteingang() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/projects/inbox?tenantId=1`);
      setItems(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSent = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
        <MailCheck className="w-12 h-12 text-green-500/60 mx-auto mb-3" />
        <p className="text-base font-semibold text-foreground mb-1">Posteingang ist leer</p>
        <p className="text-sm text-muted-foreground">Alle Freigabe-Aufgaben wurden bereits versendet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{items.length} ausstehende Freigabe{items.length !== 1 ? "n" : ""}</span>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(item => (
          <InboxCard key={item.id} item={item} onSent={handleSent} />
        ))}
      </div>
    </div>
  );
}

export default function ProjektHub() {
  const { adminSession, selectedMarketId } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [view, setView] = useState<"projects" | "inbox">("projects");
  const [inboxCount, setInboxCount] = useState(0);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${BASE}/projects?tenantId=1`;
      if (selectedMarketId) url += `&marketId=${selectedMarketId}`;
      const r = await fetch(url);
      setProjects(await r.json());
    } finally { setLoading(false); }
  }, [selectedMarketId]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const fetchInboxCount = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/projects/inbox/count?tenantId=1`);
      const data = await r.json();
      setInboxCount(data.count || 0);
    } catch {}
  }, []);

  useEffect(() => { fetchInboxCount(); }, [fetchInboxCount]);

  const handleProjectCreated = (p: Project) => {
    setProjects(prev => [p, ...prev]);
    setShowNewModal(false);
    setSelectedProject(p);
  };

  const handleProjectUpdated = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedProject(updated);
  };

  const filtered = filterStatus === "all" ? projects : projects.filter(p => p.status === filterStatus);
  const counts = Object.keys(STATUS_CONFIG).reduce((acc, k) => {
    acc[k] = projects.filter(p => p.status === k).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white leading-tight">Projekt-Hub</h1>
            <p className="text-sm text-white/75">Projekte, Logbuch & Aufgaben-Workflows</p>
          </div>
        </div>
      </PageHeader>

      <div className="max-w-4xl mx-auto space-y-5">
        {selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            onBack={() => { setSelectedProject(null); fetchProjects(); }}
            onUpdated={handleProjectUpdated}
          />
        ) : (
          <>
            {/* ── Ansicht-Tabs ── */}
            <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
              <button onClick={() => setView("projects")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${view === "projects" ? "bg-white shadow-sm text-[#1a3a6b]" : "text-muted-foreground hover:text-foreground"}`}>
                <FolderKanban className="w-4 h-4" /> Projekte
              </button>
              <button onClick={() => { setView("inbox"); fetchInboxCount(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${view === "inbox" ? "bg-white shadow-sm text-[#1a3a6b]" : "text-muted-foreground hover:text-foreground"}`}>
                <Inbox className="w-4 h-4" />
                Michis Posteingang
                {inboxCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {inboxCount}
                  </span>
                )}
              </button>
            </div>

            {view === "inbox" ? (
              <MichiPosteingang />
            ) : (
            <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <div key={k} className="bg-white rounded-xl border border-border/60 p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{counts[k] || 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1 bg-muted/40 rounded-xl p-1 flex-wrap">
                <button onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === "all" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  Alle ({projects.length})
                </button>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => counts[k] > 0 && (
                  <button key={k} onClick={() => setFilterStatus(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === k ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {v.label} ({counts[k]})
                  </button>
                ))}
              </div>
              {adminSession && (
                <button onClick={() => setShowNewModal(true)}
                  className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold hover:bg-[#2d5aa0] transition-colors">
                  <Plus className="w-4 h-4" /> Neues Projekt
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                <FolderKanban className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {filterStatus === "all" ? "Noch keine Projekte vorhanden" : "Keine Projekte in diesem Status"}
                </p>
                {adminSession && filterStatus === "all" && (
                  <button onClick={() => setShowNewModal(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold mx-auto hover:bg-[#2d5aa0] transition-colors">
                    <Plus className="w-4 h-4" /> Erstes Projekt erstellen
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map(p => (
                  <ProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
                ))}
              </div>
            )}
            </>
            )}
          </>
        )}
      </div>

      {showNewModal && (
        <NewProjectModal onClose={() => setShowNewModal(false)} onCreate={handleProjectCreated} />
      )}
    </AppLayout>
  );
}
