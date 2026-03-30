import { type ReactNode, useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { Plus, Pencil, Trash2, Loader2, X, Save, Flame, Minus, ArrowDown } from "lucide-react";

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;
const BASE = import.meta.env.VITE_API_URL || "/api";

const WEEKDAY_NAMES = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const PRIORITIES = [
  { value: "hoch",    label: "Hoch",    icon: Flame,    color: "text-red-600"   },
  { value: "mittel",  label: "Mittel",  icon: Minus,    color: "text-amber-600" },
  { value: "niedrig", label: "Niedrig", icon: ArrowDown, color: "text-blue-600"  },
];

interface Task { id: number; title: string; description: string | null; weekday: number; priority: string; is_active: boolean; }

function TaskForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Task>;
  onSave: (data: Omit<Task, "id" | "is_active">) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [weekday, setWeekday] = useState(initial?.weekday ?? 1);
  const [priority, setPriority] = useState(initial?.priority ?? "mittel");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Titel erforderlich"); return; }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description: description.trim() || null, weekday, priority } as Omit<Task, "id" | "is_active">);
    } catch { setError("Fehler beim Speichern"); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#1a3a6b]/30 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">{initial?.id ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Titel *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="z.B. Einkaufswagen-Check"
          className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Beschreibung</label>
        <textarea
          value={description ?? ""}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wochentag *</label>
          <select
            value={weekday}
            onChange={e => setWeekday(Number(e.target.value))}
            className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
          >
            {WEEKDAY_NAMES.slice(1).map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dringlichkeit</label>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
          >
            {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm text-muted-foreground hover:bg-gray-50">Abbrechen</button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>
    </div>
  );
}

export default function TodoVerwaltung() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN"
    || adminSession?.role === "MARKTLEITER" || adminSession?.role === "BEREICHSLEITUNG";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    const res = await fetch(`${BASE}/todo/standard-tasks?marketId=${selectedMarketId}`);
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }, [selectedMarketId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: Omit<Task, "id" | "is_active">) => {
    const res = await fetch(`${BASE}/todo/standard-tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: selectedMarketId, tenantId: 1, ...data }),
    });
    const created = await res.json();
    setTasks(prev => [...prev, created]);
    setShowForm(false);
  };

  const handleUpdate = async (data: Omit<Task, "id" | "is_active">) => {
    if (!editTask) return;
    const res = await fetch(`${BASE}/todo/standard-tasks/${editTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, is_active: editTask.is_active }),
    });
    const updated = await res.json();
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditTask(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Aufgabe wirklich löschen?")) return;
    await fetch(`${BASE}/todo/standard-tasks/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleActive = async (task: Task) => {
    const res = await fetch(`${BASE}/todo/standard-tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: task.title, description: task.description, weekday: task.weekday, priority: task.priority, is_active: !task.is_active }),
    });
    const updated = await res.json();
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const filtered = filterDay !== null ? tasks.filter(t => t.weekday === filterDay) : tasks;
  const byDay = WEEKDAY_NAMES.slice(1).reduce((acc, name, i) => {
    acc[i + 1] = filtered.filter(t => t.weekday === i + 1);
    return acc;
  }, {} as Record<number, Task[]>);

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-10 text-center text-muted-foreground">Kein Zugriff – nur für Marktleiter und Admins.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-bold text-foreground">Standardaufgaben verwalten</h1>
          {!showForm && !editTask && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5aa0] transition-colors"
            >
              <Plus className="w-4 h-4" /> Neue Aufgabe
            </button>
          )}
        </div>

        {/* Wochentag Filter */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterDay(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${filterDay === null ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "border-border/60 text-muted-foreground hover:border-[#1a3a6b]/40"}`}
          >
            Alle
          </button>
          {WEEKDAY_NAMES.slice(1).map((name, i) => (
            <button
              key={i + 1}
              onClick={() => setFilterDay(i + 1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${filterDay === i + 1 ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "border-border/60 text-muted-foreground hover:border-[#1a3a6b]/40"}`}
            >
              {name.slice(0, 2)}
            </button>
          ))}
        </div>

        {showForm && (
          <TaskForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          Object.entries(byDay).map(([dayStr, dayTasks]) => {
            const day = Number(dayStr);
            if (!dayTasks.length && filterDay !== null) return null;
            if (!dayTasks.length) return null;
            return (
              <div key={day}>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1 mb-2">{WEEKDAY_NAMES[day]} ({dayTasks.length})</h2>
                <div className="space-y-2">
                  {dayTasks.map(task => {
                    if (editTask?.id === task.id) {
                      return <TaskForm key={task.id} initial={task} onSave={handleUpdate} onCancel={() => setEditTask(null)} />;
                    }
                    const pConf = PRIORITIES.find(p => p.value === task.priority);
                    const PIcon = pConf?.icon ?? Minus;
                    return (
                      <div key={task.id} className={`bg-white rounded-2xl border border-border/60 p-4 flex items-center gap-3 ${!task.is_active ? "opacity-50" : ""}`}>
                        <button onClick={() => handleToggleActive(task)} title={task.is_active ? "Deaktivieren" : "Aktivieren"} className="shrink-0">
                          <div className={`w-4 h-4 rounded-full border-2 ${task.is_active ? "bg-green-500 border-green-500" : "border-gray-300"}`} />
                        </button>
                        <PIcon className={`w-4 h-4 shrink-0 ${pConf?.color ?? "text-muted-foreground"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">{task.title}</p>
                          {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setEditTask(task)} className="p-1.5 text-muted-foreground hover:text-[#1a3a6b] rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(task.id)} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {!loading && tasks.length === 0 && (
          <div className="bg-white rounded-2xl border border-border/60 p-10 text-center text-muted-foreground text-sm">
            Noch keine Standardaufgaben angelegt.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
