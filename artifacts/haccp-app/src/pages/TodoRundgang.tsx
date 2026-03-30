import { type ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  Plus, Flame, Minus, ArrowDown, CheckCircle2, Clock, Loader2, X, Camera,
  Archive, RotateCcw, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;
const BASE = import.meta.env.VITE_API_URL || "/api";

const PRIORITY_CONFIG = {
  hoch:   { label: "Hoch",    icon: Flame,    color: "text-red-600",   bg: "bg-red-100",    badge: "bg-red-100 text-red-700"   },
  mittel: { label: "Mittel",  icon: Minus,    color: "text-amber-600", bg: "bg-amber-100",  badge: "bg-amber-100 text-amber-700" },
  niedrig:{ label: "Niedrig", icon: ArrowDown, color: "text-blue-600", bg: "bg-blue-100",   badge: "bg-blue-100 text-blue-700"  },
};

interface AdhocTask {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  deadline: string | null;
  photo_data: string | null;
  created_by_name: string | null;
  created_at: string;
  is_completed: boolean;
  completed_by_name: string | null;
  completed_at: string | null;
}

function PINDialog({ title, onConfirm, onClose }: {
  title: string;
  onConfirm: (pin: string) => Promise<string | null>;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const handleConfirm = async () => {
    if (pin.length !== 4) { setError("PIN muss 4-stellig sein"); return; }
    setSaving(true);
    const err = await onConfirm(pin);
    setSaving(false);
    if (err) { setError(err); } else { setPin(""); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-sm">{title}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <input
          type="password" inputMode="numeric" maxLength={4} value={pin} autoFocus
          onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={e => e.key === "Enter" && handleConfirm()}
          placeholder="• • • •"
          className="w-full border border-border/60 rounded-xl px-4 py-3 text-center text-2xl tracking-widest mb-3 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
        />
        {error && <p className="text-xs text-red-600 text-center mb-3">{error}</p>}
        <button onClick={handleConfirm} disabled={saving || pin.length !== 4}
          className="w-full py-2.5 bg-[#1a3a6b] text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Bestätigen
        </button>
      </div>
    </div>
  );
}

function NewTaskDialog({ onSave, onClose }: {
  onSave: (data: { title: string; description: string; priority: string; deadline: string; photoData: string; pin: string }) => Promise<string | null>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"form" | "pin">("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("mittel");
  const [deadline, setDeadline] = useState("");
  const [photoData, setPhotoData] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoData(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Titel erforderlich"); return; }
    if (pin.length !== 4) { setError("PIN muss 4-stellig sein"); return; }
    setSaving(true);
    const err = await onSave({ title: title.trim(), description, priority, deadline, photoData, pin });
    setSaving(false);
    if (err) setError(err);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border/60 px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
          <h3 className="font-bold text-foreground">Neue Aufgabe</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Titel *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Was muss erledigt werden?"
              className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Beschreibung</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Details (optional)"
              className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dringlichkeit</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30">
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zieluhrzeit</label>
              <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
                className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Foto (optional)</label>
            <div className="mt-1">
              {photoData ? (
                <div className="relative">
                  <img src={photoData} alt="Vorschau" className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => setPhotoData("")} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border/60 rounded-xl text-sm text-muted-foreground hover:border-[#1a3a6b]/40 hover:text-[#1a3a6b] w-full justify-center transition-colors">
                  <Camera className="w-4 h-4" /> Foto aufnehmen / auswählen
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dein PIN *</label>
            <input type="password" inputMode="numeric" maxLength={4} value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="• • • •"
              className="mt-1 w-full border border-border/60 rounded-xl px-4 py-2.5 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={handleSubmit} disabled={saving || !title.trim() || pin.length !== 4}
            className="w-full py-3 bg-[#1a3a6b] text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Aufgabe speichern
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, isAdmin, onComplete, onReopen, onDelete }: {
  task: AdhocTask;
  isAdmin: boolean;
  onComplete: (id: number) => void;
  onReopen: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const conf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.mittel;
  const Icon = conf.icon;
  const isOverdue = !task.is_completed && task.deadline && new Date(task.deadline) < new Date();

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${task.is_completed ? "opacity-60 border-border/40" : isOverdue ? "border-red-300" : "border-border/60"}`}>
      <div className="p-4 flex items-start gap-3">
        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${conf.bg}`}>
          <Icon className={`w-4 h-4 ${conf.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${task.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conf.badge}`}>{conf.label}</span>
            {task.deadline && (
              <span className={`text-xs flex items-center gap-0.5 ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                <Clock className="w-3 h-3" />
                {new Date(task.deadline).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr
              </span>
            )}
            {task.is_completed && task.completed_by_name && (
              <span className="text-xs text-green-600 font-medium">✓ {task.completed_by_name}</span>
            )}
          </div>
          {task.created_by_name && (
            <p className="text-xs text-muted-foreground mt-0.5">von {task.created_by_name} · {new Date(task.created_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(task.description || task.photo_data) && (
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          {!task.is_completed && (
            <button onClick={() => onComplete(task.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Als erledigt markieren">
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          {task.is_completed && isAdmin && (
            <button onClick={() => onReopen(task.id)} className="p-1.5 text-muted-foreground hover:text-[#1a3a6b] rounded-lg transition-colors" title="Wieder öffnen">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {isAdmin && (
            <button onClick={() => onDelete(task.id)} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg transition-colors" title="Löschen">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3">
          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
          {task.photo_data && <img src={task.photo_data} alt="Aufgaben-Foto" className="w-full max-h-60 object-cover rounded-xl" />}
        </div>
      )}
    </div>
  );
}

export default function TodoRundgang() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN"
    || adminSession?.role === "MARKTLEITER" || adminSession?.role === "BEREICHSLEITUNG";

  const [tasks, setTasks] = useState<AdhocTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [pinDialogId, setPinDialogId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    const res = await fetch(`${BASE}/todo/adhoc-tasks?marketId=${selectedMarketId}&includeCompleted=true`);
    setTasks(await res.json());
    setLoading(false);
  }, [selectedMarketId]);

  useEffect(() => { load(); }, [load]);

  const openTasks = tasks.filter(t => !t.is_completed);
  const doneTasks = tasks.filter(t => t.is_completed);

  const handleCreate = async (data: { title: string; description: string; priority: string; deadline: string; photoData: string; pin: string }) => {
    const res = await fetch(`${BASE}/todo/adhoc-tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: selectedMarketId, tenantId: "1", ...data }),
    });
    if (!res.ok) { const d = await res.json(); return d.error || "Fehler"; }
    const created = await res.json();
    setTasks(prev => [created, ...prev]);
    setShowNewForm(false);
    return null;
  };

  const handleCompletePIN = async (pin: string) => {
    if (!pinDialogId) return "Fehler";
    const res = await fetch(`${BASE}/todo/adhoc-tasks/${pinDialogId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, tenantId: "1" }),
    });
    if (!res.ok) { const d = await res.json(); return d.error || "Fehler"; }
    const updated = await res.json();
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setPinDialogId(null);
    return null;
  };

  const handleReopen = async (id: number) => {
    await fetch(`${BASE}/todo/adhoc-tasks/${id}/reopen`, { method: "PATCH" });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: false, completed_by_name: null, completed_at: null } : t));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Aufgabe wirklich löschen?")) return;
    await fetch(`${BASE}/todo/adhoc-tasks/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-foreground">Schneller Rundgang</h1>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Neue Aufgabe
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {openTasks.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-7 h-7 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-green-700 text-sm">Keine offenen Aufgaben</p>
              </div>
            )}
            {openTasks.length > 0 && (
              <div className="space-y-3">
                {openTasks.map(task => (
                  <TaskCard key={task.id} task={task} isAdmin={isAdmin}
                    onComplete={id => setPinDialogId(id)}
                    onReopen={handleReopen}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {doneTasks.length > 0 && (
              <div>
                <button
                  onClick={() => setShowCompleted(s => !s)}
                  className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground mb-2"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Erledigt ({doneTasks.length})
                  {showCompleted ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showCompleted && (
                  <div className="space-y-2">
                    {doneTasks.map(task => (
                      <TaskCard key={task.id} task={task} isAdmin={isAdmin}
                        onComplete={id => setPinDialogId(id)}
                        onReopen={handleReopen}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showNewForm && <NewTaskDialog onSave={handleCreate} onClose={() => setShowNewForm(false)} />}
      {pinDialogId !== null && (
        <PINDialog
          title="Aufgabe als erledigt markieren"
          onConfirm={handleCompletePIN}
          onClose={() => setPinDialogId(null)}
        />
      )}
    </AppLayout>
  );
}
