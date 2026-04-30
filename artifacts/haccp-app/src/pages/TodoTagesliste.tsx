import { type ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { useFilePaste } from "@/hooks/useFileUpload";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "wouter";
import { useAppStore } from "@/store/use-app-store";
import { getBavarianHolidays, getHolidayName } from "@/utils/holidays";
import {
  CheckCircle2, Circle, Loader2, Info, ChevronLeft, ChevronRight,
  Flame, Minus, ArrowDown, X, Camera, ImagePlus, Trash2, ZoomIn,
  Plus, Clock, Archive, ChevronDown, ChevronUp, RotateCcw, CalendarDays, Zap,
  ShoppingCart, Package, ListChecks, CalendarRange,
} from "lucide-react";

const CATEGORY_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  headerColor: string;
  badge: string;
  borderLeft: string;
  doneBorderLeft: string;
  isInfo: boolean;
}> = {
  tagesaufgaben: { label: "Tagesaufgaben",  icon: CalendarDays,  headerColor: "text-[#0f766e]", badge: "bg-[#0f766e]/10 text-[#0f766e]", borderLeft: "border-l-[#0f766e]/40", doneBorderLeft: "border-l-green-400", isInfo: false },
  wochenaufgaben:{ label: "Wochenaufgaben", icon: CalendarRange, headerColor: "text-[#0f766e]", badge: "bg-[#0f766e]/10 text-[#0f766e]", borderLeft: "border-l-[#0f766e]/30", doneBorderLeft: "border-l-green-400", isInfo: false },
  aufgaben:      { label: "Aufgaben",        icon: ListChecks,   headerColor: "text-[#0f766e]", badge: "bg-[#0f766e]/10 text-[#0f766e]", borderLeft: "border-l-[#0f766e]/40", doneBorderLeft: "border-l-green-400", isInfo: false },
  bestellungen:  { label: "Bestellungen",   icon: ShoppingCart, headerColor: "text-[#0f766e]", badge: "bg-[#0f766e]/10 text-[#0f766e]", borderLeft: "border-l-[#0f766e]/30", doneBorderLeft: "border-l-green-400", isInfo: false },
  lieferungen:   { label: "Lieferungen",    icon: Package,      headerColor: "text-[#0f766e]", badge: "bg-[#0f766e]/10 text-[#0f766e]", borderLeft: "border-l-amber-300",    doneBorderLeft: "border-l-amber-300", isInfo: true  },
};
const CATEGORY_ORDER = ["tagesaufgaben", "wochenaufgaben", "aufgaben", "bestellungen", "lieferungen"];

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;
const BASE = import.meta.env.VITE_API_URL || "/api";

const WEEKDAY_NAMES = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split("T")[0];
}

function skipClosedDays(d: Date): Date {
  const result = new Date(d);
  const year = result.getFullYear();
  const holidays = getBavarianHolidays(year);
  const dateStr = () => result.toISOString().split("T")[0];
  let safety = 0;
  while ((result.getDay() === 0 || holidays.has(dateStr())) && safety++ < 14) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

const PRIORITY_CONFIG = {
  hoch:   { label: "Hoch",    icon: Flame,    color: "text-red-600",   bg: "bg-red-50",   border: "border-red-200",   badge: "bg-red-100 text-red-700"    },
  mittel: { label: "Mittel",  icon: Minus,    color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
  niedrig:{ label: "Niedrig", icon: ArrowDown, color: "text-teal-600", bg: "bg-teal-50",  border: "border-teal-200",  badge: "bg-teal-100 text-teal-700"   },
};

interface StandardTask {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  weekday: number;
  category: string;
  photo_data: string | null;
}
interface Completion {
  task_id: number;
  completed_by_name: string;
  completed_at: string;
  photo_data: string | null;
}
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
  task_type: string | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
    setError("");
    const err = await onConfirm(pin);
    setSaving(false);
    if (err) setError(err);
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
          className="w-full border border-border/60 rounded-xl px-4 py-3 text-center text-2xl tracking-widest mb-3 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
        />
        {error && <p className="text-xs text-red-600 text-center mb-3">{error}</p>}
        <button onClick={handleConfirm} disabled={saving || pin.length !== 4}
          className="w-full py-2.5 bg-[#0f766e] text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Bestätigen
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
    setPreview(await fileToBase64(file));
  };
  useFilePaste(async (file) => {
    if (file.type.startsWith("image/")) setPreview(await fileToBase64(file));
  });
  const handleSave = async () => {
    if (!preview || preview === currentPhoto) { onClose(); return; }
    setSaving(true); await onSave(preview); setSaving(false); onClose();
  };
  const handleDelete = async () => {
    setSaving(true); await onDelete(); setSaving(false); onClose();
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
              <h3 className="font-bold text-foreground flex items-center gap-2"><Camera className="w-4 h-4 text-[#0f766e]" /> Foto</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{taskTitle}</p>
            </div>
            <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          {preview ? (
            <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-100 aspect-video">
              <img src={preview} alt="Vorschau" className="w-full h-full object-cover" />
              <button onClick={() => setEnlarged(true)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white"><ZoomIn className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={async (e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith("image/")) setPreview(await fileToBase64(f)); }}
              className="w-full mb-4 border-2 border-dashed border-border/60 rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-[#0f766e]/40 hover:text-[#0f766e] transition-colors">
              <ImagePlus className="w-8 h-8" />
              <span className="text-sm font-medium">Foto auswählen, hierher ziehen oder aufnehmen</span>
              <span className="text-[10px] text-muted-foreground/60">oder Strg+V zum Einfügen</span>
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          <div className="flex gap-2">
            {preview && (
              <button onClick={() => inputRef.current?.click()}
                className="flex-1 py-2.5 border border-border/60 rounded-xl text-sm font-medium text-muted-foreground hover:bg-gray-50 flex items-center justify-center gap-1.5">
                <ImagePlus className="w-4 h-4" /> Ersetzen
              </button>
            )}
            {currentPhoto && (
              <button onClick={handleDelete} disabled={saving} className="py-2.5 px-3 border border-red-200 rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={handleSave} disabled={saving || !preview}
              className="flex-1 py-2.5 bg-[#0f766e] text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {preview && preview !== currentPhoto ? "Speichern" : "Schließen"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const TASK_TYPES = [
  { value: "heute",  label: "Heute erledigen",     color: "border-orange-300 bg-orange-50 text-orange-700",   activeColor: "border-orange-500 bg-orange-500 text-white",   desc: "Erscheint nur heute" },
  { value: "sofort", label: "Sofort erledigen!",    color: "border-red-300 bg-red-50 text-red-700",            activeColor: "border-red-500 bg-red-500 text-white",         desc: "Dringend, sofort sichtbar" },
  { value: "woche",  label: "Zusatz-Wochentodo",    color: "border-blue-300 bg-blue-50 text-blue-700",         activeColor: "border-blue-600 bg-blue-600 text-white",        desc: "Diese ganze Woche sichtbar" },
];

function NewAdhocDialog({ onSave, onClose }: {
  onSave: (data: { title: string; description: string; priority: string; deadline: string; photoData: string; pin: string; taskType: string }) => Promise<string | null>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("mittel");
  const [deadline, setDeadline] = useState("");
  const [photoData, setPhotoData] = useState("");
  const [pin, setPin] = useState("");
  const [taskType, setTaskType] = useState("heute");
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
  useFilePaste((file) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setPhotoData(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  });
  const handleSubmit = async () => {
    if (!title.trim()) { setError("Titel erforderlich"); return; }
    if (pin.length !== 4) { setError("PIN muss 4-stellig sein"); return; }
    setSaving(true);
    const err = await onSave({ title: title.trim(), description, priority, deadline, photoData, pin, taskType });
    setSaving(false);
    if (err) setError(err);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border/60 px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500" /> Neue Aufgabe</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Aufgaben-Typ */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Art der Aufgabe</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TASK_TYPES.map(tt => (
                <button
                  key={tt.value}
                  type="button"
                  onClick={() => setTaskType(tt.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-colors ${taskType === tt.value ? tt.activeColor : tt.color}`}
                >
                  <span className="text-xs font-bold leading-tight">{tt.label}</span>
                  <span className={`text-[10px] leading-tight ${taskType === tt.value ? "text-white/80" : "opacity-70"}`}>{tt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Titel *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Was muss erledigt werden?"
              className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Beschreibung</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dringlichkeit</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30">
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zieluhrzeit</label>
              <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
                className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Foto (optional)</label>
            <div className="mt-1">
              {photoData ? (
                <div className="relative">
                  <img src={photoData} alt="Vorschau" className="w-full h-36 object-cover rounded-xl" />
                  <button onClick={() => setPhotoData("")} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith("image/")) { const reader = new FileReader(); reader.onload = ev => setPhotoData(ev.target?.result as string); reader.readAsDataURL(f); } }}
                  className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border/60 rounded-xl text-sm text-muted-foreground hover:border-orange-400/60 hover:text-orange-500 w-full justify-center transition-colors">
                  <Camera className="w-4 h-4" /> Foto aufnehmen, hierher ziehen oder auswählen
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
              {!photoData && <p className="text-center text-[10px] text-muted-foreground mt-1">oder Strg+V zum Einfügen</p>}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dein PIN *</label>
            <input type="password" inputMode="numeric" maxLength={4} value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ""))} placeholder="• • • •"
              className="mt-1 w-full border border-border/60 rounded-xl px-4 py-2.5 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={handleSubmit} disabled={saving || !title.trim() || pin.length !== 4}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Aufgabe speichern
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TodoTagesliste() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN"
    || adminSession?.role === "MARKTLEITER" || adminSession?.role === "BEREICHSLEITUNG";

  const [standardTasks, setStandardTasks] = useState<StandardTask[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [weeklyCompletions, setWeeklyCompletions] = useState<Completion[]>([]);
  const [adhocTasks, setAdhocTasks] = useState<AdhocTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    if (d.getDay() === 0) d.setDate(d.getDate() - 1); // Sonntag → Samstag
    // Feiertag? Zum letzten Werktag zurück
    const yr = d.getFullYear();
    const hols = getBavarianHolidays(yr);
    let safety = 0;
    while (hols.has(d.toISOString().split("T")[0]) && d.getDay() !== 0 && safety++ < 14) {
      d.setDate(d.getDate() - 1);
    }
    return d;
  });

  const [pinStandardId, setPinStandardId] = useState<{ id: number; title: string } | null>(null);
  const [pinAdhocId, setPinAdhocId] = useState<number | null>(null);
  const [photoDialog, setPhotoDialog] = useState<{ taskId: number; taskTitle: string; currentPhoto: string | null } | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [showNewAdhoc, setShowNewAdhoc] = useState(false);
  const [showDoneStandard, setShowDoneStandard] = useState(false);
  const [showDoneAdhoc, setShowDoneAdhoc] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState<string[]>(["tagesaufgaben", "wochenaufgaben", "aufgaben", "bestellungen", "lieferungen"]);

  const dateStr = selectedDate.toISOString().split("T")[0];
  const weekday = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
  const isToday = dateStr === new Date().toISOString().split("T")[0];
  const weekStart = getMonday(selectedDate);

  const year = selectedDate.getFullYear();
  const holidays = getBavarianHolidays(year);
  const isHoliday = holidays.has(dateStr);
  const holidayName = isHoliday ? (getHolidayName(dateStr, year) ?? "Feiertag") : null;

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const [tRes, cRes, aRes, wRes, catRes] = await Promise.all([
        fetch(`${BASE}/todo/standard-tasks?marketId=${selectedMarketId}&weekday=${weekday}`),
        fetch(`${BASE}/todo/daily-completions?marketId=${selectedMarketId}&date=${dateStr}`),
        fetch(`${BASE}/todo/adhoc-tasks?marketId=${selectedMarketId}&includeCompleted=true`),
        fetch(`${BASE}/todo/daily-completions?marketId=${selectedMarketId}&weekStart=${weekStart}`),
        fetch(`${BASE}/todo/category-order?marketId=${selectedMarketId}`),
      ]);
      setStandardTasks(await tRes.json());
      setCompletions(await cRes.json());
      setAdhocTasks(await aRes.json());
      setWeeklyCompletions(await wRes.json());
      if (catRes.ok) setCategoryOrder(await catRes.json());
    } finally { setLoading(false); }
  }, [selectedMarketId, weekday, dateStr, weekStart]);

  useEffect(() => { load(); }, [load]);

  const completionMap = new Map(completions.map(c => [c.task_id, c]));

  // Wochenaufgaben: Map mit der aktuellsten Erledigung pro Aufgabe diese Woche
  const weeklyCompletedMap = new Map<number, Completion>();
  [...weeklyCompletions]
    .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
    .forEach(c => weeklyCompletedMap.set(c.task_id, c));

  const isTaskDone = (task: StandardTask) =>
    task.category === "wochenaufgaben" ? weeklyCompletedMap.has(task.id) : completionMap.has(task.id);
  const getTaskComp = (task: StandardTask): Completion | undefined =>
    task.category === "wochenaufgaben" ? weeklyCompletedMap.get(task.id) : completionMap.get(task.id);
  const isDoneEarlierThisWeek = (task: StandardTask) =>
    task.category === "wochenaufgaben" && weeklyCompletedMap.has(task.id) && !completionMap.has(task.id);
  const moveDate = (days: number) => {
    setSelectedDate(d => {
      const n = new Date(d);
      n.setDate(n.getDate() + days);
      // Sonntage und Feiertage überspringen
      let safety = 0;
      while (safety++ < 14) {
        const ds = n.toISOString().split("T")[0];
        const hols = getBavarianHolidays(n.getFullYear());
        if (n.getDay() === 0 || hols.has(ds)) {
          n.setDate(n.getDate() + (days > 0 ? 1 : -1));
        } else break;
      }
      return n;
    });
  };

  // Standard task handlers
  const handleStandardToggle = async (task: StandardTask) => {
    const comp = completionMap.get(task.id);
    if (comp) {
      await fetch(`${BASE}/todo/daily-completions/${task.id}/${dateStr}`, { method: "DELETE" });
      setCompletions(prev => prev.filter(c => c.task_id !== task.id));
    } else {
      setPinStandardId({ id: task.id, title: task.title });
    }
  };
  const handleStandardPIN = async (pin: string) => {
    if (!pinStandardId || !selectedMarketId) return "Fehler";
    const res = await fetch(`${BASE}/todo/daily-completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: pinStandardId.id, marketId: selectedMarketId, date: dateStr, pin, tenantId: "1" }),
    });
    if (!res.ok) { const d = await res.json(); return d.error || "Fehler"; }
    const comp = await res.json();
    setCompletions(prev => [...prev.filter(c => c.task_id !== comp.task_id), comp]);
    setPinStandardId(null);
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

  // Ad-hoc handlers
  const handleAdhocCreate = async (data: { title: string; description: string; priority: string; deadline: string; photoData: string; pin: string; taskType: string }) => {
    const res = await fetch(`${BASE}/todo/adhoc-tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: selectedMarketId, tenantId: "1", ...data, taskType: data.taskType }),
    });
    if (!res.ok) { const d = await res.json(); return d.error || "Fehler"; }
    const created = await res.json();
    setAdhocTasks(prev => [created, ...prev]);
    setShowNewAdhoc(false);
    return null;
  };
  const handleAdhocCompletePIN = async (pin: string) => {
    if (!pinAdhocId) return "Fehler";
    const res = await fetch(`${BASE}/todo/adhoc-tasks/${pinAdhocId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, tenantId: "1" }),
    });
    if (!res.ok) { const d = await res.json(); return d.error || "Fehler"; }
    const updated = await res.json();
    setAdhocTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setPinAdhocId(null);
    return null;
  };
  const handleAdhocReopen = async (id: number) => {
    await fetch(`${BASE}/todo/adhoc-tasks/${id}/reopen`, { method: "PATCH" });
    setAdhocTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: false, completed_by_name: null, completed_at: null } : t));
  };
  const handleAdhocDelete = async (id: number) => {
    if (!confirm("Aufgabe wirklich löschen?")) return;
    await fetch(`${BASE}/todo/adhoc-tasks/${id}`, { method: "DELETE" });
    setAdhocTasks(prev => prev.filter(t => t.id !== id));
  };

  const openStandard = standardTasks.filter(t => !isTaskDone(t));
  const doneStandard = standardTasks.filter(t => isTaskDone(t));
  const openAdhoc = adhocTasks.filter(t => !t.is_completed);
  const doneAdhoc = adhocTasks.filter(t => t.is_completed);
  // Aufgaben nach Typ aufteilen
  const openSofort = openAdhoc.filter(t => t.task_type === "sofort");
  const openWoche  = openAdhoc.filter(t => t.task_type === "woche");
  const openHeute  = openAdhoc.filter(t => !t.task_type || t.task_type === "heute");
  // "Lieferungen" are info cards — not counted in progress
  const completableTasks = standardTasks.filter(t => (t.category || "aufgaben") !== "lieferungen");
  const totalAll = completableTasks.length + adhocTasks.length;
  const doneAll = completableTasks.filter(t => isTaskDone(t)).length + doneAdhoc.length;
  const pct = totalAll ? Math.round((doneAll / totalAll) * 100) : 0;
  const totalOpen = completableTasks.filter(t => !isTaskDone(t)).length + openAdhoc.length;

  const priorityOrder = ["hoch", "mittel", "niedrig"];

  return (
    <AppLayout>
      {enlargedPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setEnlargedPhoto(null)}>
          <img src={enlargedPhoto} alt="Referenzfoto" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <PageHeader className="from-[#0f766e] to-[#14b8a6]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Link href="/todo" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Meine Aufgaben</h1>
                <p className="text-sm text-white/70">
                  {selectedDate.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                  {totalOpen > 0 && <span className="ml-2 font-semibold text-white">· {totalOpen} offen</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button onClick={() => moveDate(-1)} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setSelectedDate(new Date())}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium ${isToday ? "bg-white text-[#0f766e]" : "bg-white/15 hover:bg-white/25 text-white"}`}>
                  Heute
                </button>
                <button onClick={() => moveDate(1)} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <button onClick={() => setShowNewAdhoc(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Aufgabe
              </button>
            </div>
          </div>
        </PageHeader>

        {/* Feiertags-Banner */}
        {isHoliday && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <CalendarDays className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="font-bold text-amber-700 text-lg">{holidayName}</p>
            <p className="text-sm text-amber-600 mt-1">Heute ist ein gesetzlicher Feiertag – keine Aufgaben.</p>
          </div>
        )}

        {/* Gesamtfortschritt */}
        {!isHoliday && totalAll > 0 && (() => {
          const ampel = pct === 100
            ? { dot: "bg-green-500", bar: "bg-green-500", text: "text-green-600", bg: "bg-green-50", border: "border-green-200", label: "Alle erledigt" }
            : pct >= 33
            ? { dot: "bg-amber-400", bar: "bg-amber-400", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "In Bearbeitung" }
            : { dot: "bg-red-500", bar: "bg-red-500", text: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Noch viel offen" };
          return (
            <div className={`rounded-2xl border p-4 ${ampel.bg} ${ampel.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold flex items-center gap-2 ${ampel.text}`}>
                  <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${ampel.dot}`} />
                  {ampel.label} · {doneAll}/{totalAll} Aufgaben
                </span>
                <span className={`text-sm font-bold ${ampel.text}`}>{pct}%</span>
              </div>
              <div className="w-full bg-white/60 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all duration-500 ${ampel.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })()}

        {!isHoliday && loading && (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        )}
        {!isHoliday && !loading && (
          <>
            {/* ── STANDARD-AUFGABEN nach Kategorie gruppiert ── */}
            {categoryOrder.map(cat => {
              const catConf = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.aufgaben;
              const CatIcon = catConf.icon;
              // Heute: nur offene Aufgaben; Vergangene Tage: alle Aufgaben (erledigt inline durchgestrichen)
              const catTasks = isToday
                ? openStandard.filter(t => (t.category || "aufgaben") === cat)
                : standardTasks.filter(t => (t.category || "aufgaben") === cat);
              if (catTasks.length === 0) return null;

              if (catConf.isInfo) {
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <CatIcon className={`w-4 h-4 ${catConf.headerColor}`} />
                      <span className={`text-xs font-bold uppercase tracking-wide ${catConf.headerColor}`}>{catConf.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${catConf.badge}`}>{catTasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {catTasks.map(task => (
                        <div key={task.id} className="bg-[#0f766e]/5 rounded-2xl border border-[#0f766e]/20 border-l-4 border-l-amber-300 p-4">
                          {task.photo_data && (
                            <button onClick={() => setEnlargedPhoto(task.photo_data)} className="w-full block relative mb-3">
                              <img src={task.photo_data} alt="Referenz" className="w-full h-24 object-cover rounded-xl hover:opacity-90 transition-opacity" />
                            </button>
                          )}
                          <div className="flex items-start gap-3">
                            <Package className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground">{task.title}</p>
                              {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <CatIcon className={`w-4 h-4 ${catConf.headerColor}`} />
                    <span className={`text-xs font-bold uppercase tracking-wide ${catConf.headerColor}`}>{catConf.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${catConf.badge}`}>{catTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {priorityOrder.flatMap(p => catTasks.filter(t => t.priority === p)).map(task => {
                      const pconf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.mittel;
                      const PIcon = pconf.icon;
                      const isDone = isTaskDone(task);
                      const comp = isDone ? getTaskComp(task) ?? null : null;
                      const doneEarlier = isDoneEarlierThisWeek(task);

                      // Vergangener Tag: erledigte Aufgaben inline durchgestrichen anzeigen
                      if (isDone && !isToday) {
                        return (
                          <div key={task.id} className={`bg-green-50/60 rounded-2xl border border-green-200/80 overflow-hidden border-l-4 ${catConf.doneBorderLeft} opacity-75`}>
                            {comp?.photo_data && (
                              <button onClick={() => setEnlargedPhoto(comp.photo_data)} className="w-full block">
                                <img src={comp.photo_data} alt="Foto" className="w-full h-20 object-cover hover:opacity-90" />
                              </button>
                            )}
                            <div className="p-4 flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm line-through text-muted-foreground">{task.title}</p>
                                {task.description && <p className="text-xs text-muted-foreground/70 line-through mt-0.5">{task.description}</p>}
                                {comp && (
                                  <p className="text-xs text-green-600 font-medium mt-1">
                                    ✓ {comp.completed_by_name} · {new Date(comp.completed_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={task.id} className={`bg-white rounded-2xl border border-border/60 overflow-hidden border-l-4 ${catConf.borderLeft}`}>
                          {task.photo_data && (
                            <button onClick={() => setEnlargedPhoto(task.photo_data)} className="w-full block relative">
                              <img src={task.photo_data} alt="Referenz" className="w-full h-28 object-cover hover:opacity-90 transition-opacity" />
                              <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Referenz</span>
                            </button>
                          )}
                          <div className="p-4 flex items-start gap-3">
                            <button onClick={() => handleStandardToggle(task)} className="shrink-0 mt-0.5">
                              <Circle className="w-5 h-5 text-muted-foreground/40" />
                            </button>
                            <div className="min-w-0 flex-1" onClick={() => handleStandardToggle(task)}>
                              <p className="font-semibold text-sm text-foreground cursor-pointer">{task.title}</p>
                              {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <PIcon className={`w-3 h-3 ${pconf.color}`} />
                                <span className={`text-[10px] font-semibold ${pconf.color}`}>{pconf.label}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* ── SOFORT-AUFGABEN (dringend) ── */}
            {openSofort.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-red-600 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wide text-red-700">Sofort erledigen!</span>
                  <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-bold">{openSofort.length}</span>
                </div>
                <div className="space-y-2">
                  {openSofort.map(task => {
                    const conf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.hoch;
                    const PIcon = conf.icon;
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                    return (
                      <div key={task.id} className={`bg-white rounded-xl border-2 border-red-300 overflow-hidden`}>
                        {task.photo_data && (
                          <button onClick={() => setEnlargedPhoto(task.photo_data)} className="w-full block">
                            <img src={task.photo_data} alt="Foto" className="w-full h-28 object-cover hover:opacity-90 transition-opacity" />
                          </button>
                        )}
                        <div className="p-3 flex items-start gap-3">
                          <button onClick={() => setPinAdhocId(task.id)} className="shrink-0 mt-0.5"><Circle className="w-5 h-5 text-red-400/70" /></button>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-foreground">{task.title}</p>
                            {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {task.deadline && (
                                <span className={`text-xs flex items-center gap-0.5 ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                                  <Clock className="w-3 h-3" />
                                  {new Date(task.deadline).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr
                                </span>
                              )}
                              {task.created_by_name && <span className="text-[10px] text-muted-foreground">von {task.created_by_name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setPinAdhocId(task.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Erledigt"><CheckCircle2 className="w-4 h-4" /></button>
                            {isAdmin && <button onClick={() => handleAdhocDelete(task.id)} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── ZUSATZ-WOCHENTODOS ── */}
            {openWoche.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <CalendarRange className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Zusatz-Wochentodos</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{openWoche.length}</span>
                </div>
                <div className="space-y-2">
                  {openWoche.map(task => {
                    const conf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.mittel;
                    const PIcon = conf.icon;
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                    return (
                      <div key={task.id} className={`bg-white rounded-2xl border overflow-hidden border-l-4 border-l-blue-400 ${isOverdue ? "border-red-200" : "border-border/60"}`}>
                        {task.photo_data && (
                          <button onClick={() => setEnlargedPhoto(task.photo_data)} className="w-full block">
                            <img src={task.photo_data} alt="Foto" className="w-full h-28 object-cover hover:opacity-90 transition-opacity" />
                          </button>
                        )}
                        <div className="p-4 flex items-start gap-3">
                          <button onClick={() => setPinAdhocId(task.id)} className="shrink-0 mt-0.5"><Circle className="w-5 h-5 text-blue-400/60" /></button>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-foreground">{task.title}</p>
                            {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <PIcon className={`w-3 h-3 ${conf.color}`} />
                              <span className={`text-[10px] font-semibold ${conf.color}`}>{conf.label}</span>
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Diese Woche</span>
                              {task.deadline && (
                                <span className={`text-xs flex items-center gap-0.5 ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                                  <Clock className="w-3 h-3" />
                                  {new Date(task.deadline).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr
                                </span>
                              )}
                              {task.created_by_name && <span className="text-[10px] text-muted-foreground">von {task.created_by_name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setPinAdhocId(task.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Erledigt"><CheckCircle2 className="w-4 h-4" /></button>
                            {isAdmin && <button onClick={() => handleAdhocDelete(task.id)} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── HEUTE-AUFGABEN (standard adhoc) ── */}
            {openHeute.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold uppercase tracking-wide text-orange-600">Zusätzliche Aufgaben</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{openHeute.length}</span>
                </div>
                <div className="space-y-2">
                  {openHeute.map(task => {
                    const conf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.mittel;
                    const PIcon = conf.icon;
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                    return (
                      <div key={task.id} className={`bg-white rounded-2xl border overflow-hidden border-l-4 border-l-orange-300 ${isOverdue ? "border-red-200" : "border-border/60"}`}>
                        {task.photo_data && (
                          <button onClick={() => setEnlargedPhoto(task.photo_data)} className="w-full block">
                            <img src={task.photo_data} alt="Foto" className="w-full h-28 object-cover hover:opacity-90 transition-opacity" />
                          </button>
                        )}
                        <div className="p-4 flex items-start gap-3">
                          <button onClick={() => setPinAdhocId(task.id)} className="shrink-0 mt-0.5"><Circle className="w-5 h-5 text-orange-400/60" /></button>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-foreground">{task.title}</p>
                            {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <PIcon className={`w-3 h-3 ${conf.color}`} />
                              <span className={`text-[10px] font-semibold ${conf.color}`}>{conf.label}</span>
                              {task.deadline && (
                                <span className={`text-xs flex items-center gap-0.5 ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                                  <Clock className="w-3 h-3" />
                                  {new Date(task.deadline).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr
                                </span>
                              )}
                              {task.created_by_name && <span className="text-[10px] text-muted-foreground">von {task.created_by_name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setPinAdhocId(task.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Erledigt"><CheckCircle2 className="w-4 h-4" /></button>
                            {isAdmin && <button onClick={() => handleAdhocDelete(task.id)} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Leerer Zustand – Alle erledigt (nur für heute) */}
            {isToday && openStandard.length === 0 && openAdhoc.length === 0 && (standardTasks.length > 0 || doneAdhoc.length > 0) && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-green-700">Alle Aufgaben erledigt!</p>
                <p className="text-xs text-green-600 mt-1">Großartige Arbeit heute.</p>
              </div>
            )}

            {standardTasks.length === 0 && adhocTasks.length === 0 && (
              <div className="bg-white rounded-2xl border border-border/60 p-8 text-center">
                <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Keine Aufgaben für {WEEKDAY_NAMES[weekday]}.</p>
              </div>
            )}

            {/* ── ERLEDIGTE STANDARD-AUFGABEN (nur für heute) ── */}
            {isToday && doneStandard.length > 0 && (
              <div>
                <button onClick={() => setShowDoneStandard(s => !s)}
                  className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground mb-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Erledigt – Standard ({doneStandard.length})
                  {showDoneStandard ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showDoneStandard && (
                  <div className="space-y-2">
                    {doneStandard.map(task => {
                      const comp = getTaskComp(task);
                      const doneEarlier = isDoneEarlierThisWeek(task);
                      return (
                        <div key={task.id} className="bg-green-50/60 rounded-2xl border border-green-200 overflow-hidden border-l-4 border-l-green-400">
                          {comp?.photo_data && (
                            <button onClick={() => setPhotoDialog({ taskId: task.id, taskTitle: task.title, currentPhoto: comp.photo_data })} className="w-full block">
                              <img src={comp.photo_data} alt="Foto" className="w-full h-24 object-cover hover:opacity-90" />
                            </button>
                          )}
                          <div className="p-4 flex items-start gap-3">
                            {doneEarlier ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                            ) : (
                              <button onClick={() => handleStandardToggle(task)} className="shrink-0 mt-0.5">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              </button>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm line-through text-muted-foreground">{task.title}</p>
                              {comp && (
                                <p className="text-xs text-green-600 mt-0.5 font-medium">
                                  ✓ {comp.completed_by_name}
                                  {doneEarlier
                                    ? ` · ${new Date(comp.completed_at).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}`
                                    : ` · ${new Date(comp.completed_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr`}
                                  {doneEarlier && <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Diese Woche</span>}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => setPhotoDialog({ taskId: task.id, taskTitle: task.title, currentPhoto: comp?.photo_data ?? null })}
                              className={`shrink-0 p-1.5 rounded-xl ${comp?.photo_data ? "bg-green-100 text-green-600" : "bg-gray-100 text-muted-foreground"}`}
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ERLEDIGTE AD-HOC-AUFGABEN ── */}
            {doneAdhoc.length > 0 && (
              <div>
                <button onClick={() => setShowDoneAdhoc(s => !s)}
                  className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground mb-2">
                  <Archive className="w-3.5 h-3.5" />
                  Erledigt – Zusatz ({doneAdhoc.length})
                  {showDoneAdhoc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showDoneAdhoc && (
                  <div className="space-y-2">
                    {doneAdhoc.map(task => (
                      <div key={task.id} className="bg-white rounded-2xl border border-border/40 opacity-60 overflow-hidden border-l-4 border-l-orange-200 p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm line-through text-muted-foreground">{task.title}</p>
                          {task.completed_by_name && (
                            <p className="text-xs text-green-600 font-medium mt-0.5">✓ {task.completed_by_name}</p>
                          )}
                        </div>
                        {isAdmin && (
                          <button onClick={() => handleAdhocReopen(task.id)} className="p-1.5 text-muted-foreground hover:text-[#0f766e] rounded-lg" title="Wieder öffnen">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {pinStandardId && (
        <PINDialog
          title={`Erledigt: ${pinStandardId.title}`}
          onConfirm={handleStandardPIN}
          onClose={() => setPinStandardId(null)}
        />
      )}
      {pinAdhocId !== null && (
        <PINDialog
          title="Aufgabe als erledigt markieren"
          onConfirm={handleAdhocCompletePIN}
          onClose={() => setPinAdhocId(null)}
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
      {showNewAdhoc && (
        <NewAdhocDialog onSave={handleAdhocCreate} onClose={() => setShowNewAdhoc(false)} />
      )}
    </AppLayout>
  );
}
