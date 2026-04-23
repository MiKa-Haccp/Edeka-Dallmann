import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useLocation } from "wouter";
import { Plus, X, Pencil, Trash2, MessageSquare, ChevronLeft, ChevronDown, ChevronUp, Send, Flag, Calendar } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";
const ALLOWED_ROLES = ["SUPERADMIN", "ADMIN"];

const COLUMNS: { key: string; label: string; color: string; bg: string; border: string }[] = [
  { key: "todo_kai",    label: "To-Do Kai",     color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
  { key: "todo_michi",  label: "To-Do Michi",   color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  { key: "todo_sonja",  label: "To-Do Sonja",   color: "text-pink-700",   bg: "bg-pink-50",   border: "border-pink-200" },
  { key: "wiedervorlage", label: "Wiedervorlage", color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200" },
];

const PRIORITIES = [
  { key: "low",    label: "Niedrig", color: "text-gray-500",  dot: "bg-gray-400"  },
  { key: "normal", label: "Normal",  color: "text-blue-600",  dot: "bg-blue-500"  },
  { key: "high",   label: "Hoch",    color: "text-red-600",   dot: "bg-red-500"   },
];

type Task = {
  id: number;
  tenantId: number;
  title: string;
  description?: string;
  column: string;
  priority: string;
  dueDate?: string;
  createdBy?: string;
  assignee?: string;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
};

type Comment = {
  id: number;
  taskId: number;
  author: string;
  content: string;
  createdAt: string;
};

function PriorityDot({ priority }: { priority: string }) {
  const p = PRIORITIES.find(x => x.key === priority) || PRIORITIES[1];
  return <span className={`inline-block w-2 h-2 rounded-full ${p.dot} mr-1.5`} />;
}

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatDue(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const overdue = diff < 0;
  return { label: d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }), overdue };
}

// ─── Task Card ─────────────────────────────────────────────
function TaskCard({
  task,
  onDragStart,
  onEdit,
  onDelete,
}: {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}) {
  const due = task.dueDate ? formatDue(task.dueDate) : null;

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, task)}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group select-none"
    >
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug break-words">{task.title}</p>
            {task.description && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="flex items-center text-xs text-gray-500">
            <PriorityDot priority={task.priority} />
            {PRIORITIES.find(p => p.key === task.priority)?.label || "Normal"}
          </span>
          {due && (
            <span className={`flex items-center gap-1 text-xs ${due.overdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
              <Calendar className="w-3 h-3" />
              {due.label}
              {due.overdue && " ⚠"}
            </span>
          )}
          {task.createdBy && (
            <span className="text-xs text-gray-400 ml-auto">{task.createdBy}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Task Detail Modal ──────────────────────────────────────
function TaskModal({
  task,
  authorName,
  adminEmail,
  onClose,
  onSave,
}: {
  task: Task | null;
  authorName: string;
  adminEmail: string;
  onClose: () => void;
  onSave: (updated: Partial<Task> & { id?: number }) => void;
}) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    column: task?.column || "todo_kai",
    priority: task?.priority || "normal",
    dueDate: task?.dueDate || "",
    createdBy: task?.createdBy || authorName,
  });
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(true);
  const [loading, setLoading] = useState(false);
  const isEdit = !!task?.id;

  const authHeaders = { "x-admin-email": adminEmail };

  useEffect(() => {
    if (!task?.id) return;
    fetch(`${BASE}/management/tasks/${task.id}/comments`, { headers: authHeaders })
      .then(r => r.json())
      .then(setComments)
      .catch(() => {});
  }, [task?.id]);

  const addComment = async () => {
    if (!newComment.trim() || !task?.id) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/management/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ author: authorName || "Unbekannt", content: newComment.trim() }),
      });
      const c = await r.json();
      setComments(prev => [...prev, c]);
      setNewComment("");
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    await fetch(`${BASE}/management/tasks/comments/${commentId}`, { method: "DELETE", headers: authHeaders });
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-lg text-[#1a3a6b]">{isEdit ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Titel *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 focus:border-[#2d5aa0]"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Was muss erledigt werden?"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Beschreibung</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 focus:border-[#2d5aa0] resize-none"
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Details, Kontext, Hinweise…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Spalte</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 focus:border-[#2d5aa0]"
                value={form.column}
                onChange={e => setForm(f => ({ ...f, column: e.target.value }))}
              >
                {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Priorität</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 focus:border-[#2d5aa0]"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fällig am</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 focus:border-[#2d5aa0]"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Erstellt von</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 focus:border-[#2d5aa0]"
                value={form.createdBy}
                onChange={e => setForm(f => ({ ...f, createdBy: e.target.value }))}
                placeholder="Name"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Abbrechen
            </button>
            <button
              onClick={() => { if (form.title.trim()) onSave({ ...form, id: task?.id }); }}
              disabled={!form.title.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "#1a3a6b" }}
            >
              {isEdit ? "Speichern" : "Aufgabe erstellen"}
            </button>
          </div>

          {/* Comments */}
          {isEdit && (
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={() => setShowComments(v => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-[#1a3a6b]"
              >
                <MessageSquare className="w-4 h-4" />
                Verlauf ({comments.length})
                {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showComments && (
                <div className="space-y-2">
                  {comments.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Noch kein Verlaufs-Eintrag.</p>
                  )}
                  {comments.map(c => (
                    <div key={c.id} className="bg-gray-50 rounded-lg p-3 group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#1a3a6b]">{c.author}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                          <button onClick={() => deleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-3">
                    <input
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                      placeholder="Verlaufs-Eintrag hinzufügen…"
                    />
                    <button
                      onClick={addComment}
                      disabled={!newComment.trim() || loading}
                      className="p-2 rounded-lg text-white disabled:opacity-50 transition-colors"
                      style={{ background: "#1a3a6b" }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Column ────────────────────────────────────────────────
function KanbanColumn({
  col,
  tasks,
  onDragStart,
  onDrop,
  onDragOver,
  onEdit,
  onDelete,
  onAddNew,
  dragOverCol,
}: {
  col: typeof COLUMNS[0];
  tasks: Task[];
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDrop: (e: React.DragEvent, colKey: string) => void;
  onDragOver: (e: React.DragEvent, colKey: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onAddNew: (colKey: string) => void;
  dragOverCol: string | null;
}) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] w-[280px]">
      <div className={`rounded-t-xl px-4 py-3 border-b-2 ${col.bg} ${col.border}`}>
        <div className={`flex items-center justify-between`}>
          <span className={`font-bold text-sm ${col.color}`}>{col.label}</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
              {tasks.length}
            </span>
            <button
              onClick={() => onAddNew(col.key)}
              className={`p-1 rounded-lg hover:bg-white/80 ${col.color} transition-colors`}
              title="Neue Aufgabe"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        onDrop={e => onDrop(e, col.key)}
        onDragOver={e => onDragOver(e, col.key)}
        onDragLeave={e => { (e.currentTarget as HTMLElement).dataset.dragover = ""; }}
        className={`flex-1 rounded-b-xl border ${col.border} p-3 space-y-2 min-h-[200px] transition-colors ${
          dragOverCol === col.key ? `${col.bg} border-dashed` : "bg-gray-50/50"
        }`}
      >
        {tasks.length === 0 && dragOverCol !== col.key && (
          <p className="text-xs text-gray-400 italic text-center py-8">Keine Aufgaben</p>
        )}
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {dragOverCol === col.key && (
          <div className={`rounded-xl border-2 border-dashed ${col.border} h-16 flex items-center justify-center`}>
            <span className={`text-xs ${col.color} font-medium`}>Hier ablegen</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function ManagementTaskBoard() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTask, setEditTask] = useState<Task | null | "new">(null);
  const [newCol, setNewCol] = useState<string>("todo_kai");
  const [dragTask, setDragTask] = useState<Task | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const authorName = adminSession?.name || "Unbekannt";
  const adminEmail = adminSession?.email || "";
  const authHeaders = { "x-admin-email": adminEmail };

  useEffect(() => {
    if (!adminSession || !ALLOWED_ROLES.includes(adminSession.role)) {
      navigate("/");
      return;
    }
    loadTasks();
  }, [adminSession]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/management/tasks?tenantId=1`, { headers: authHeaders });
      const data = await r.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: Partial<Task> & { id?: number }) => {
    const { id, ...fields } = formData;
    if (id) {
      const r = await fetch(`${BASE}/management/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(fields),
      });
      const updated = await r.json();
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    } else {
      const r = await fetch(`${BASE}/management/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ ...fields, tenantId: 1, column: fields.column || newCol }),
      });
      const created = await r.json();
      setTasks(prev => [...prev, created]);
    }
    setEditTask(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Aufgabe löschen?")) return;
    await fetch(`${BASE}/management/tasks/${id}`, { method: "DELETE", headers: authHeaders });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDragTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!dragTask || dragTask.column === colKey) { setDragTask(null); return; }
    const updated = { ...dragTask, column: colKey };
    setTasks(prev => prev.map(t => t.id === dragTask.id ? updated : t));
    await fetch(`${BASE}/management/tasks/${dragTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ column: colKey }),
    });
    setDragTask(null);
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  };

  const tasksByCol = (colKey: string) =>
    tasks.filter(t => t.column === colKey).sort((a, b) => a.sortOrder - b.sortOrder);

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
            <h1 className="text-xl font-bold text-[#1a3a6b]">Task-Board</h1>
            <p className="text-sm text-gray-500">Aufgaben für Kai · Michi · Sonja · Wiedervorlage</p>
          </div>
          <button
            onClick={() => { setNewCol("todo_kai"); setEditTask("new"); }}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: "#1a3a6b" }}
          >
            <Plus className="w-4 h-4" />
            Neue Aufgabe
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#1a3a6b]/20 border-t-[#1a3a6b] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.key}
                col={col}
                tasks={tasksByCol(col.key)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onEdit={t => setEditTask(t)}
                onDelete={handleDelete}
                onAddNew={ck => { setNewCol(ck); setEditTask("new"); }}
                dragOverCol={dragOverCol}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {editTask !== null && (
        <TaskModal
          task={editTask === "new" ? { column: newCol } as Task : editTask}
          authorName={authorName}
          adminEmail={adminEmail}
          onClose={() => setEditTask(null)}
          onSave={handleSave}
        />
      )}
    </AppLayout>
  );
}
