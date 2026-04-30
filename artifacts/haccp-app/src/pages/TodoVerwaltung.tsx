import { type ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { useFilePaste } from "@/hooks/useFileUpload";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "wouter";
import { useAppStore } from "@/store/use-app-store";
import {
  Plus, Pencil, Trash2, Loader2, X, Save, Flame, Minus, ArrowDown,
  ImagePlus, ZoomIn, Camera, ChevronLeft, ChevronUp, ChevronDown,
  GripVertical, ListOrdered, Settings2,
  CalendarDays, CalendarRange, ListChecks, ShoppingCart, Package,
} from "lucide-react";

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;
const BASE = import.meta.env.VITE_API_URL || "/api";

const WEEKDAY_NAMES = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const PRIORITIES = [
  { value: "hoch",    label: "Hoch",    icon: Flame,    color: "text-red-600"   },
  { value: "mittel",  label: "Mittel",  icon: Minus,    color: "text-amber-600" },
  { value: "niedrig", label: "Niedrig", icon: ArrowDown, color: "text-teal-600"  },
];

const CATEGORIES = [
  { value: "aufgaben",      label: "Aufgaben",               icon: ListChecks },
  { value: "bestellungen",  label: "Bestellungen",            icon: ShoppingCart },
  { value: "lieferungen",   label: "Lieferungen (Info)",      icon: Package },
  { value: "tagesaufgaben", label: "Tagesaufgaben",           icon: CalendarDays },
  { value: "wochenaufgaben",label: "Wochenaufgaben",          icon: CalendarRange },
];

interface Task {
  id: number;
  title: string;
  description: string | null;
  weekday: number;
  priority: string;
  category: string;
  is_active: boolean;
  photo_data: string | null;
  sort_order: number | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function TaskForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Task>;
  onSave: (data: Omit<Task, "id" | "is_active" | "sort_order">) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [weekday, setWeekday] = useState(initial?.weekday ?? 1);
  const [priority, setPriority] = useState(initial?.priority ?? "mittel");
  const [category, setCategory] = useState(initial?.category ?? "aufgaben");
  const [photoData, setPhotoData] = useState<string | null>(initial?.photo_data ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [enlarged, setEnlarged] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setPhotoData(b64);
  };
  useFilePaste(async (file) => {
    if (file.type.startsWith("image/")) setPhotoData(await fileToBase64(file));
  });

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Titel erforderlich"); return; }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        weekday,
        priority,
        category,
        photo_data: photoData,
      } as Omit<Task, "id" | "is_active" | "sort_order">);
    } catch { setError("Fehler beim Speichern"); }
    finally { setSaving(false); }
  };

  return (
    <>
      {enlarged && photoData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setEnlarged(false)}>
          <img src={photoData} alt="Referenzfoto" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
      <div className="bg-white rounded-2xl border border-[#0f766e]/30 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">{initial?.id ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Titel *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="z.B. Einkaufswagen aufräumen"
            className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Beschreibung</label>
          <textarea
            value={description ?? ""}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kategorie</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wochentag *</label>
            <select
              value={weekday}
              onChange={e => setWeekday(Number(e.target.value))}
              className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
            >
              <option value={0}>Täglich (jeden Tag)</option>
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
              className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
            >
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Referenzfoto */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> Referenzfoto <span className="font-normal normal-case">(optional)</span>
          </label>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

          {photoData ? (
            <div className="mt-2 relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
              <img src={photoData} alt="Referenzfoto" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setEnlarged(true)}
                  className="p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoData(null)}
                  className="p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={async (e) => {
                e.preventDefault(); e.stopPropagation();
                const f = e.dataTransfer.files?.[0];
                if (f && f.type.startsWith("image/")) setPhotoData(await fileToBase64(f));
              }}
              className="mt-1 flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border/60 rounded-xl text-sm text-muted-foreground hover:border-[#0f766e]/40 hover:text-[#0f766e] w-full justify-center transition-colors"
            >
              <ImagePlus className="w-4 h-4" /> Foto auswählen oder hierher ziehen
            </button>
          )}
          <p className="text-[10px] text-muted-foreground mt-1 text-center">oder Strg+V zum Einfügen</p>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0f766e] hover:bg-[#0d6460] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {initial?.id ? "Speichern" : "Aufgabe anlegen"}
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 border border-border/60 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
            Abbrechen
          </button>
        </div>
      </div>
    </>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────

export default function TodoVerwaltung() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN"
    || adminSession?.role === "MARKTLEITER" || adminSession?.role === "BEREICHSLEITUNG";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"aufgaben" | "kategorien">("aufgaben");

  // Kategorien-Reihenfolge
  const [categoryOrder, setCategoryOrder] = useState<string[]>(["tagesaufgaben", "wochenaufgaben", "aufgaben", "bestellungen", "lieferungen"]);
  const [catOrderSaving, setCatOrderSaving] = useState(false);
  const [catOrderSaved, setCatOrderSaved] = useState(false);
  const [reorderSaving, setReorderSaving] = useState(false);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    const [tasksRes, catRes] = await Promise.all([
      fetch(`${BASE}/todo/standard-tasks?marketId=${selectedMarketId}`),
      fetch(`${BASE}/todo/category-order?marketId=${selectedMarketId}`),
    ]);
    const data = await tasksRes.json();
    setTasks(data);
    if (catRes.ok) setCategoryOrder(await catRes.json());
    setLoading(false);
  }, [selectedMarketId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: Omit<Task, "id" | "is_active" | "sort_order">) => {
    const res = await fetch(`${BASE}/todo/standard-tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: selectedMarketId, tenantId: 1, ...data, photoData: data.photo_data, category: data.category }),
    });
    const created = await res.json();
    setTasks(prev => [...prev, created]);
    setShowForm(false);
  };

  const handleUpdate = async (data: Omit<Task, "id" | "is_active" | "sort_order">) => {
    if (!editTask) return;
    const res = await fetch(`${BASE}/todo/standard-tasks/${editTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, is_active: editTask.is_active, photoData: data.photo_data, category: data.category }),
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
      body: JSON.stringify({
        title: task.title, description: task.description, weekday: task.weekday,
        priority: task.priority, is_active: !task.is_active, photoData: task.photo_data, category: task.category,
      }),
    });
    const updated = await res.json();
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  // Aufgabe innerhalb derselben Wochentag-Gruppe nach oben/unten verschieben
  const handleMoveTask = async (taskId: number, direction: "up" | "down", dayTasks: Task[]) => {
    const idx = dayTasks.findIndex(t => t.id === taskId);
    if (idx < 0) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === dayTasks.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const newDayTasks = [...dayTasks];
    [newDayTasks[idx], newDayTasks[swapIdx]] = [newDayTasks[swapIdx], newDayTasks[idx]];
    // Update local state immediately
    setTasks(prev => {
      const otherTasks = prev.filter(t => t.weekday !== dayTasks[0].weekday);
      return [...otherTasks, ...newDayTasks];
    });
    // Persist to server
    setReorderSaving(true);
    await fetch(`${BASE}/todo/standard-tasks/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newDayTasks.map(t => t.id) }),
    });
    setReorderSaving(false);
  };

  // Kategorie-Reihenfolge hoch/runter
  const handleMoveCat = (idx: number, direction: "up" | "down") => {
    const newOrder = [...categoryOrder];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setCategoryOrder(newOrder);
    setCatOrderSaved(false);
  };

  const handleSaveCategoryOrder = async () => {
    if (!selectedMarketId) return;
    setCatOrderSaving(true);
    await fetch(`${BASE}/todo/category-order`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: selectedMarketId, tenantId: "1", categoryOrder }),
    });
    setCatOrderSaving(false);
    setCatOrderSaved(true);
    setTimeout(() => setCatOrderSaved(false), 2000);
  };

  const filtered = filterDay !== null ? tasks.filter(t => t.weekday === filterDay) : tasks;
  const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
  const WEEKDAY_DISPLAY: Record<number, string> = {
    0: "Täglich",
    1: "Montag", 2: "Dienstag", 3: "Mittwoch", 4: "Donnerstag",
    5: "Freitag", 6: "Samstag",
  };
  const byDay = ALL_WEEKDAYS.reduce((acc, d) => {
    acc[d] = filtered.filter(t => t.weekday === d);
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
    <>
      {enlargedPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setEnlargedPhoto(null)}>
          <img src={enlargedPhoto} alt="Referenzfoto" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-5">
          <PageHeader className="from-[#0f766e] to-[#14b8a6]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Link href="/todo" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Standardaufgaben verwalten</h1>
                  <p className="text-sm text-white/70">Aufgaben und Kategorien einrichten</p>
                </div>
              </div>
              {activeTab === "aufgaben" && !showForm && !editTask && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" /> Neue Aufgabe
                </button>
              )}
            </div>
          </PageHeader>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("aufgaben")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "aufgaben" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ListOrdered className="w-4 h-4" /> Aufgaben-Reihenfolge
            </button>
            <button
              onClick={() => setActiveTab("kategorien")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "kategorien" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <GripVertical className="w-4 h-4" /> Kategorien-Reihenfolge
            </button>
          </div>

          {/* ── TAB: KATEGORIEN-REIHENFOLGE ── */}
          {activeTab === "kategorien" && (
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 space-y-3">
              <p className="text-xs text-muted-foreground">
                Legen Sie fest, in welcher Reihenfolge die Kategorien in der Tagesliste angezeigt werden.
              </p>
              <div className="space-y-2">
                {categoryOrder.map((catKey, idx) => {
                  const catConf = CATEGORIES.find(c => c.value === catKey);
                  const CatIcon = catConf?.icon ?? ListChecks;
                  return (
                    <div key={catKey} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-border/40">
                      <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                      <CatIcon className="w-4 h-4 text-[#0f766e] shrink-0" />
                      <span className="flex-1 text-sm font-medium">{catConf?.label ?? catKey}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveCat(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-[#0f766e] hover:bg-[#0f766e]/10 disabled:opacity-30 transition-colors"
                          title="Nach oben"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveCat(idx, "down")}
                          disabled={idx === categoryOrder.length - 1}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-[#0f766e] hover:bg-[#0f766e]/10 disabled:opacity-30 transition-colors"
                          title="Nach unten"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleSaveCategoryOrder}
                disabled={catOrderSaving}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${catOrderSaved ? "bg-green-500 text-white" : "bg-[#0f766e] hover:bg-[#0d6460] text-white"} disabled:opacity-50`}
              >
                {catOrderSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {catOrderSaved ? "Gespeichert ✓" : "Reihenfolge speichern"}
              </button>
            </div>
          )}

          {/* ── TAB: AUFGABEN-REIHENFOLGE ── */}
          {activeTab === "aufgaben" && (
            <>
              {/* Wochentag Filter */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setFilterDay(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${filterDay === null ? "bg-[#0f766e] text-white border-[#0f766e]" : "border-border/60 text-muted-foreground hover:border-[#0f766e]/40"}`}
                >
                  Alle
                </button>
                <button
                  onClick={() => setFilterDay(0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${filterDay === 0 ? "bg-[#0f766e] text-white border-[#0f766e]" : "border-border/60 text-muted-foreground hover:border-[#0f766e]/40"}`}
                >
                  Tägl.
                </button>
                {WEEKDAY_NAMES.slice(1).map((name, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setFilterDay(i + 1)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${filterDay === i + 1 ? "bg-[#0f766e] text-white border-[#0f766e]" : "border-border/60 text-muted-foreground hover:border-[#0f766e]/40"}`}
                  >
                    {name.slice(0, 2)}
                  </button>
                ))}
                {reorderSaving && <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Speichern…</span>}
              </div>

              {showForm && (
                <TaskForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
              )}

              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : (
                Object.entries(byDay).map(([dayStr, dayTasks]) => {
                  const day = Number(dayStr);
                  if (!dayTasks.length) return null;
                  return (
                    <div key={day}>
                      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1 mb-2">
                        {WEEKDAY_DISPLAY[day] ?? WEEKDAY_NAMES[day]} ({dayTasks.length})
                      </h2>
                      <div className="space-y-2">
                        {dayTasks.map((task, idx) => {
                          if (editTask?.id === task.id) {
                            return <TaskForm key={task.id} initial={task} onSave={handleUpdate} onCancel={() => setEditTask(null)} />;
                          }
                          const pConf = PRIORITIES.find(p => p.value === task.priority);
                          const PIcon = pConf?.icon ?? Minus;
                          return (
                            <div key={task.id} className={`bg-white rounded-2xl border border-border/60 overflow-hidden ${!task.is_active ? "opacity-50" : ""}`}>
                              {task.photo_data && (
                                <button
                                  onClick={() => setEnlargedPhoto(task.photo_data)}
                                  className="w-full block overflow-hidden"
                                >
                                  <img
                                    src={task.photo_data}
                                    alt="Referenzfoto"
                                    className="w-full h-28 object-cover hover:opacity-90 transition-opacity"
                                  />
                                </button>
                              )}
                              <div className="p-4 flex items-center gap-3">
                                {/* Reihenfolge-Pfeile */}
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button
                                    onClick={() => handleMoveTask(task.id, "up", dayTasks)}
                                    disabled={idx === 0}
                                    className="p-0.5 rounded text-muted-foreground hover:text-[#0f766e] disabled:opacity-20 transition-colors"
                                    title="Nach oben"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveTask(task.id, "down", dayTasks)}
                                    disabled={idx === dayTasks.length - 1}
                                    className="p-0.5 rounded text-muted-foreground hover:text-[#0f766e] disabled:opacity-20 transition-colors"
                                    title="Nach unten"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <button onClick={() => handleToggleActive(task)} title={task.is_active ? "Deaktivieren" : "Aktivieren"} className="shrink-0">
                                  <div className={`w-4 h-4 rounded-full border-2 ${task.is_active ? "bg-green-500 border-green-500" : "border-gray-300"}`} />
                                </button>
                                <PIcon className={`w-4 h-4 shrink-0 ${pConf?.color ?? "text-muted-foreground"}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-foreground">{task.title}</p>
                                  {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block">
                                    {CATEGORIES.find(c => c.value === (task.category || "aufgaben"))?.label ?? task.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button onClick={() => setEditTask(task)} className="p-1.5 text-muted-foreground hover:text-[#0f766e] rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDelete(task.id)} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
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
            </>
          )}
        </div>
      </AppLayout>
    </>
  );
}
