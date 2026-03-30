import { type ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  CheckCircle2, Circle, Loader2, Info, ChevronLeft, ChevronRight,
  Flame, Minus, ArrowDown, X, Camera, ImagePlus, Trash2, ZoomIn,
} from "lucide-react";

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;
const BASE = import.meta.env.VITE_API_URL || "/api";

const WEEKDAY_NAMES = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

const PRIORITY_CONFIG = {
  hoch:   { label: "Hoch",    icon: Flame,    color: "text-red-600",   bg: "bg-red-50",   border: "border-red-200"   },
  mittel: { label: "Mittel",  icon: Minus,    color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  niedrig:{ label: "Niedrig", icon: ArrowDown, color: "text-blue-600", bg: "bg-blue-50",  border: "border-blue-200"  },
};

interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  weekday: number;
  photo_data: string | null;
}
interface Completion {
  task_id: number;
  completed_by_name: string;
  completed_at: string;
  photo_data: string | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function PINDialog({ onConfirm, onClose, title }: {
  onConfirm: (pin: string) => Promise<string | null>;
  onClose: () => void;
  title: string;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (pin.length !== 4) { setError("PIN muss 4-stellig sein"); return; }
    setSaving(true);
    setError("");
    const err = await onConfirm(pin);
    setSaving(false);
    if (err) setError(err);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Bitte gib deinen 4-stelligen PIN ein:</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={e => e.key === "Enter" && handleConfirm()}
          placeholder="• • • •"
          autoFocus
          className="w-full border border-border/60 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 mb-3"
        />
        {error && <p className="text-xs text-red-600 text-center mb-3">{error}</p>}
        <button
          onClick={handleConfirm}
          disabled={saving || pin.length !== 4}
          className="w-full py-2.5 bg-[#1a3a6b] text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Bestätigen
        </button>
      </div>
    </div>
  );
}

function PhotoDialog({ taskTitle, currentPhoto, onSave, onDelete, onClose }: {
  taskTitle: string;
  currentPhoto: string | null;
  onSave: (base64: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(currentPhoto);
  const [saving, setSaving] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setPreview(b64);
  };

  const handleSave = async () => {
    if (!preview || preview === currentPhoto) { onClose(); return; }
    setSaving(true);
    await onSave(preview);
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setSaving(true);
    await onDelete();
    setSaving(false);
    onClose();
  };

  return (
    <>
      {enlarged && preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setEnlarged(false)}>
          <img src={preview} alt="Foto" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#1a3a6b]" /> Foto
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{taskTitle}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>

          {preview ? (
            <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-100 aspect-video">
              <img src={preview} alt="Vorschau" className="w-full h-full object-cover" />
              <button
                onClick={() => setEnlarged(true)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full mb-4 border-2 border-dashed border-border/60 rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-[#1a3a6b]/40 hover:text-[#1a3a6b] transition-colors"
            >
              <ImagePlus className="w-8 h-8" />
              <span className="text-sm font-medium">Foto auswählen oder aufnehmen</span>
            </button>
          )}

          <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

          <div className="flex gap-2">
            {preview && (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex-1 py-2.5 border border-border/60 rounded-xl text-sm font-medium text-muted-foreground hover:bg-gray-50 flex items-center justify-center gap-1.5"
              >
                <ImagePlus className="w-4 h-4" /> Ersetzen
              </button>
            )}
            {currentPhoto && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="py-2.5 px-3 border border-red-200 rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !preview}
              className="flex-1 py-2.5 bg-[#1a3a6b] text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {preview && preview !== currentPhoto ? "Speichern" : "Schließen"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function TodoTagesliste() {
  const { selectedMarketId } = useAppStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [pinDialog, setPinDialog] = useState<{ taskId: number; taskTitle: string } | null>(null);
  const [photoDialog, setPhotoDialog] = useState<{ taskId: number; taskTitle: string; currentPhoto: string | null } | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  const dateStr = selectedDate.toISOString().split("T")[0];
  const weekday = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([
        fetch(`${BASE}/todo/standard-tasks?marketId=${selectedMarketId}&weekday=${weekday}`),
        fetch(`${BASE}/todo/daily-completions?marketId=${selectedMarketId}&date=${dateStr}`),
      ]);
      setTasks(await tRes.json());
      setCompletions(await cRes.json());
    } finally { setLoading(false); }
  }, [selectedMarketId, weekday, dateStr]);

  useEffect(() => { load(); }, [load]);

  const completionMap = new Map(completions.map(c => [c.task_id, c]));
  const isToday = dateStr === new Date().toISOString().split("T")[0];

  const moveDate = (days: number) => {
    setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + days); return n; });
  };

  const handleToggle = async (task: Task) => {
    const comp = completionMap.get(task.id);
    if (comp) {
      await fetch(`${BASE}/todo/daily-completions/${task.id}/${dateStr}`, { method: "DELETE" });
      setCompletions(prev => prev.filter(c => c.task_id !== task.id));
    } else {
      setPinDialog({ taskId: task.id, taskTitle: task.title });
    }
  };

  const handlePinConfirm = async (pin: string) => {
    if (!pinDialog || !selectedMarketId) return "Fehler";
    const res = await fetch(`${BASE}/todo/daily-completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: pinDialog.taskId, marketId: selectedMarketId, date: dateStr, pin, tenantId: "1" }),
    });
    if (!res.ok) {
      const data = await res.json();
      return data.error || "Fehler";
    }
    const comp = await res.json();
    setCompletions(prev => [...prev.filter(c => c.task_id !== comp.task_id), comp]);
    setPinDialog(null);
    return null;
  };

  const handlePhotoSave = async (base64: string) => {
    if (!photoDialog) return;
    const res = await fetch(`${BASE}/todo/daily-completions/${photoDialog.taskId}/${dateStr}/photo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoData: base64 }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCompletions(prev => prev.map(c => c.task_id === updated.task_id ? updated : c));
    }
  };

  const handlePhotoDelete = async () => {
    if (!photoDialog) return;
    const res = await fetch(`${BASE}/todo/daily-completions/${photoDialog.taskId}/${dateStr}/photo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoData: null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCompletions(prev => prev.map(c => c.task_id === updated.task_id ? updated : c));
    }
  };

  const priorityOrder = ["hoch", "mittel", "niedrig"];
  const grouped = priorityOrder.reduce((acc, p) => {
    acc[p] = tasks.filter(t => t.priority === p);
    return acc;
  }, {} as Record<string, Task[]>);

  const totalDone = tasks.filter(t => completionMap.has(t.id)).length;
  const pct = tasks.length ? Math.round((totalDone / tasks.length) * 100) : 0;

  return (
    <AppLayout>
      {/* Vollbild-Overlay für Referenzfotos */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
          onClick={() => setEnlargedPhoto(null)}
        >
          <img src={enlargedPhoto} alt="Referenzfoto" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Tagesliste</h1>
            <p className="text-xs text-muted-foreground">
              {WEEKDAY_NAMES[weekday]}, {selectedDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => moveDate(-1)} className="p-2 rounded-xl border border-border/60 hover:bg-gray-50 text-muted-foreground">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${isToday ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "border-border/60 text-muted-foreground hover:bg-gray-50"}`}
            >
              Heute
            </button>
            <button onClick={() => moveDate(1)} className="p-2 rounded-xl border border-border/60 hover:bg-gray-50 text-muted-foreground">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fortschritt */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-2xl border border-border/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">{totalDone} / {tasks.length} erledigt</span>
              <span className={`text-sm font-bold ${pct === 100 ? "text-green-600" : "text-muted-foreground"}`}>{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : "bg-[#1a3a6b]"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/60 p-8 text-center">
            <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Keine Standardaufgaben für {WEEKDAY_NAMES[weekday]}.</p>
          </div>
        ) : (
          priorityOrder.map(p => {
            const conf = PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG];
            const Icon = conf.icon;
            const list = grouped[p];
            if (!list.length) return null;
            return (
              <div key={p}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Icon className={`w-3.5 h-3.5 ${conf.color}`} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${conf.color}`}>{conf.label}</span>
                </div>
                <div className="space-y-2">
                  {list.map(task => {
                    const comp = completionMap.get(task.id);
                    const done = !!comp;
                    return (
                      <div
                        key={task.id}
                        className={`bg-white rounded-2xl border transition-all overflow-hidden ${done ? "border-green-200 bg-green-50/60" : "border-border/60"}`}
                      >
                        {/* Erledigungs-Foto (oben, wenn erledigt + Foto vorhanden) */}
                        {done && comp?.photo_data && (
                          <button
                            onClick={() => setPhotoDialog({ taskId: task.id, taskTitle: task.title, currentPhoto: comp.photo_data })}
                            className="w-full block"
                          >
                            <img
                              src={comp.photo_data}
                              alt="Erledigungsfoto"
                              className="w-full h-32 object-cover hover:opacity-90 transition-opacity"
                            />
                          </button>
                        )}

                        {/* Referenzfoto (oben, wenn noch nicht erledigt) */}
                        {!done && task.photo_data && (
                          <button
                            onClick={() => setEnlargedPhoto(task.photo_data)}
                            className="w-full block relative"
                          >
                            <img
                              src={task.photo_data}
                              alt="Referenzfoto"
                              className="w-full h-32 object-cover hover:opacity-90 transition-opacity"
                            />
                            <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              Referenz
                            </span>
                          </button>
                        )}

                        <div className="p-4 flex items-start gap-3">
                          {/* Checkbox */}
                          <button onClick={() => handleToggle(task)} className="shrink-0 mt-0.5">
                            {done
                              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                              : <Circle className="w-5 h-5 text-muted-foreground/40" />
                            }
                          </button>

                          {/* Task-Info */}
                          <div
                            className="min-w-0 flex-1"
                            onClick={() => !done && handleToggle(task)}
                          >
                            <p className={`font-semibold text-sm ${done ? "line-through text-muted-foreground" : "text-foreground cursor-pointer"}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                            )}
                            {done && comp && (
                              <p className="text-xs text-green-600 mt-1 font-medium">
                                ✓ {comp.completed_by_name} · {new Date(comp.completed_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                              </p>
                            )}
                          </div>

                          {/* Kamera-Button (nur bei erledigten Aufgaben) */}
                          {done && (
                            <button
                              onClick={() => setPhotoDialog({ taskId: task.id, taskTitle: task.title, currentPhoto: comp?.photo_data ?? null })}
                              className={`shrink-0 p-1.5 rounded-xl transition-colors ${comp?.photo_data ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}
                              title="Erledigungsfoto"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {pct === 100 && tasks.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-green-700">Alle Aufgaben erledigt!</p>
          </div>
        )}
      </div>

      {pinDialog && (
        <PINDialog
          title={`Aufgabe erledigen: ${pinDialog.taskTitle}`}
          onConfirm={handlePinConfirm}
          onClose={() => setPinDialog(null)}
        />
      )}

      {photoDialog && (
        <PhotoDialog
          taskTitle={photoDialog.taskTitle}
          currentPhoto={photoDialog.currentPhoto}
          onSave={handlePhotoSave}
          onDelete={handlePhotoDelete}
          onClose={() => setPhotoDialog(null)}
        />
      )}
    </AppLayout>
  );
}
