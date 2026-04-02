import type { ReactNode, ElementType } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import BesprechungsprotokollPage from "./Besprechungsprotokoll";
import {
  useListTrainingTopics,
  useListTrainingSessions,
  useGetTrainingSession,
  useCreateTrainingSession,
  useUpdateTrainingSession,
  useDeleteTrainingSession,
  useAddTrainingAttendance,
  useRemoveTrainingAttendance,
  useListUsers,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  GraduationCap,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Trash2,
  Eye,
  UserPlus,
  KeyRound,
  Loader2,
  Users,
  BookOpen,
  AlertCircle,
  Scale,
  Leaf,
  Ham,
  RefreshCw,
  Calendar,
  FileText,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SessionType = "schulungsprotokoll" | "taraschulung" | "lebensmittelleitkultur" | "strohschwein";

const TAB_LABELS: Record<SessionType | "besprechungsprotokoll", string> = {
  schulungsprotokoll: "Schulungsprotokoll",
  taraschulung: "Taraschulung",
  lebensmittelleitkultur: "Lebensmittelleitkultur",
  strohschwein: "Strohschwein",
  besprechungsprotokoll: "Besprechungsprotokoll",
};

const ALL_TABS = ["schulungsprotokoll", "taraschulung", "lebensmittelleitkultur", "strohschwein", "besprechungsprotokoll"] as const;
type TabKey = (typeof ALL_TABS)[number];

function trafficLight(sessions: any[] | undefined, selectedYear: number): "green" | "yellow" | "red" {
  if (sessions && sessions.length > 0) return "green";
  const now = new Date();
  const currentYear = now.getFullYear();
  const jan31 = new Date(currentYear, 0, 31, 23, 59, 59);
  if (selectedYear < currentYear) return "red";
  if (now > jan31) return "red";
  return "yellow";
}

function TrafficDot({ color }: { color: "green" | "yellow" | "red" }) {
  return (
    <span
      className={cn(
        "inline-block w-2.5 h-2.5 rounded-full flex-shrink-0",
        color === "green" && "bg-green-500",
        color === "yellow" && "bg-amber-400",
        color === "red" && "bg-red-500"
      )}
    />
  );
}

function TrafficBadge({ color }: { color: "green" | "yellow" | "red" }) {
  const labels = { green: "Erledigt", yellow: "Ausstehend", red: "Überfällig" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        color === "green" && "bg-green-100 text-green-700",
        color === "yellow" && "bg-amber-100 text-amber-700",
        color === "red" && "bg-red-100 text-red-700"
      )}
    >
      <TrafficDot color={color} />
      {labels[color]}
    </span>
  );
}

function NewSchulungsprotokollDialog({
  isOpen,
  onClose,
  marketId,
  tenantId,
  initialTopicIds,
}: {
  isOpen: boolean;
  onClose: () => void;
  marketId: number;
  tenantId: number;
  initialTopicIds?: number[];
}) {
  const { data: topics } = useListTrainingTopics();
  const { data: users } = useListUsers({ tenantId });
  const createSession = useCreateTrainingSession();
  const queryClient = useQueryClient();

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [trainerName, setTrainerName] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<number[]>(initialTopicIds ?? []);
  const [notes, setNotes] = useState("");

  const adminUsers = users?.filter(
    (u: any) => u.role === "SUPERADMIN" || u.role === "ADMIN" || u.role === "MARKTLEITER"
  );

  const toggleTopic = (id: number) => {
    setSelectedTopics((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (topics && selectedTopics.length === topics.length) setSelectedTopics([]);
    else if (topics) setSelectedTopics(topics.map((t: any) => t.id));
  };

  const handleSubmit = async () => {
    if (!sessionDate || selectedTopics.length === 0) return;
    await createSession.mutateAsync({
      marketId,
      data: { tenantId, sessionDate, trainerId, trainerName: trainerName || null, topicIds: selectedTopics, notes: notes || null, sessionType: "schulungsprotokoll" } as any,
    });
    queryClient.invalidateQueries({ queryKey: [`/api/markets/${marketId}/training-sessions`] });
    setSessionDate(new Date().toISOString().split("T")[0]);
    setTrainerId(null); setTrainerName(""); setSelectedTopics([]); setNotes("");
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto z-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
            <GraduationCap className="w-5 h-5 text-primary" />
            Neue Schulung erstellen
          </Dialog.Title>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Datum *</label>
              <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Schulungsleiter *</label>
              <select value={trainerId || ""} onChange={(e) => {
                const id = e.target.value ? parseInt(e.target.value) : null;
                setTrainerId(id);
                if (id) { const user = adminUsers?.find((u: any) => u.id === id); if (user) setTrainerName(user.name); }
              }} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                <option value="">Schulungsleiter wählen...</option>
                {adminUsers?.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">Schulungsthemen *</label>
                <button type="button" onClick={handleSelectAll} className="text-xs text-primary hover:underline">
                  {topics && selectedTopics.length === topics.length ? "Alle abwählen" : "Alle auswählen"}
                </button>
              </div>
              <div className="border border-border rounded-lg divide-y divide-border max-h-60 overflow-y-auto">
                {topics?.map((topic: any) => (
                  <label key={topic.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-secondary/50 cursor-pointer">
                    <input type="checkbox" checked={selectedTopics.includes(topic.id)} onChange={() => toggleTopic(topic.id)}
                      className="mt-0.5 rounded border-border" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground leading-snug">{topic.title}</p>
                      {topic.responsible && (
                        <p className="text-xs text-muted-foreground mt-0.5">Zuständig: {topic.responsible}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Anmerkungen</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary">
              Abbrechen
            </button>
            <button onClick={handleSubmit}
              disabled={createSession.isPending || !sessionDate || selectedTopics.length === 0}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Schulung erstellen
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NewSimpleSessionDialog({
  isOpen,
  onClose,
  marketId,
  tenantId,
  sessionType,
  typeLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  marketId: number;
  tenantId: number;
  sessionType: SessionType;
  typeLabel: string;
}) {
  const createSession = useCreateTrainingSession();
  const queryClient = useQueryClient();

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [trainerName, setTrainerName] = useState("");

  const handleSubmit = async () => {
    if (!sessionDate) return;
    await createSession.mutateAsync({
      marketId,
      data: { tenantId, sessionDate, trainerName: trainerName || null, topicIds: [], sessionType } as any,
    });
    queryClient.invalidateQueries({ queryKey: [`/api/markets/${marketId}/training-sessions`] });
    setSessionDate(new Date().toISOString().split("T")[0]);
    setTrainerName("");
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-[95vw] max-w-md z-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-primary" />
            {typeLabel} – Neue Schulung
          </Dialog.Title>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Datum *</label>
              <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Schulungsleiter / Durchgeführt von</label>
              <input type="text" value={trainerName} onChange={(e) => setTrainerName(e.target.value)}
                placeholder="Name des Schulungsleiters"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary">
              Abbrechen
            </button>
            <button onClick={handleSubmit} disabled={createSession.isPending || !sessionDate}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Schulung anlegen
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AttendanceDialog({ isOpen, onClose, sessionId }: { isOpen: boolean; onClose: () => void; sessionId: number }) {
  const addAttendance = useAddTrainingAttendance();
  const queryClient = useQueryClient();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async () => {
    if (!pin || pin.length < 4) return;
    setError("");
    try {
      await addAttendance.mutateAsync({ sessionId, data: { pin } });
      queryClient.invalidateQueries({ queryKey: [`/api/training-sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      setPin("");
      onClose();
    } catch (err: any) {
      setError(err?.message || err?.data?.error || "Fehler beim Eintragen.");
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-[95vw] max-w-md z-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-primary" />
            Teilnahme bestätigen
          </Dialog.Title>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Geben Sie Ihre 4-stellige PIN ein. Ihr Kürzel wird automatisch erkannt.
            </p>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">PIN (4 Ziffern) *</label>
              <div className="relative">
                <input type={showPin ? "text" : "password"} value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="****" maxLength={4} autoFocus
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-center text-lg" />
                <button type="button" onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <KeyRound className="w-4 h-4" />
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setPin(""); setError(""); onClose(); }}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary">
              Abbrechen
            </button>
            <button onClick={handleSubmit} disabled={addAttendance.isPending || pin.length < 4}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {addAttendance.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Bestätigen
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SessionDetailView({ sessionId, onBack }: { sessionId: number; onBack: () => void }) {
  const { data: session, isLoading } = useGetTrainingSession(sessionId);
  const updateSession = useUpdateTrainingSession();
  const deleteSession = useDeleteTrainingSession();
  const removeAttendance = useRemoveTrainingAttendance();
  const queryClient = useQueryClient();
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const adminSession = useAppStore((s) => s.adminSession);
  const hasPermission = useAppStore((s) => s.hasPermission);
  const isAdmin = hasPermission("entries.delete");

  const handleToggleTopic = async (topicId: number, currentChecked: boolean) => {
    if (!session) return;
    await updateSession.mutateAsync({
      sessionId,
      data: {
        topics: session.topics.map((t: any) => ({
          topicId: t.topicId,
          checked: t.topicId === topicId ? !currentChecked : t.checked,
        })),
      },
    });
    queryClient.invalidateQueries({ queryKey: [`/api/training-sessions/${sessionId}`] });
  };

  const handleDeleteSession = async () => {
    if (!confirm("Schulung wirklich löschen?")) return;
    await deleteSession.mutateAsync({ sessionId });
    onBack();
  };

  const handleRemoveAttendance = async (attendanceId: number) => {
    if (!confirm("Teilnahme wirklich entfernen?")) return;
    await removeAttendance.mutateAsync({ sessionId, attendanceId });
    queryClient.invalidateQueries({ queryKey: [`/api/training-sessions/${sessionId}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!session) return <div className="text-center py-20 text-muted-foreground">Schulung nicht gefunden.</div>;

  const isSimpleType = session.sessionType !== "schulungsprotokoll" && session.sessionType !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">
            {TAB_LABELS[(session.sessionType as SessionType) || "schulungsprotokoll"]}
          </h2>
          <p className="text-sm text-muted-foreground">
            {new Date(session.sessionDate + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        {isAdmin && (
          <button onClick={handleDeleteSession} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Schulung löschen">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-border p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Datum</p>
            <p className="text-sm font-semibold text-foreground">
              {new Date(session.sessionDate + "T00:00:00").toLocaleDateString("de-DE")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Schulungsleiter</p>
            <p className="text-sm font-semibold text-foreground">{session.trainerName || "–"}</p>
          </div>
        </div>

        {isSimpleType && TAB_META[session.sessionType as SessionType]?.sections?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Schulungsinhalt
            </h3>
            <div className={cn("rounded-xl border p-4 sm:p-5 space-y-5", TAB_META[session.sessionType as SessionType]?.bgColor || "bg-secondary/50 border-border")}>
              {TAB_META[session.sessionType as SessionType].sections.map((section, si) => (
                <div key={si}>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white border border-border text-xs font-bold text-muted-foreground shrink-0">
                      {si + 1}
                    </span>
                    {section.heading}
                  </h4>
                  <ul className="space-y-1.5">
                    {section.items.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isSimpleType && session.topics?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Schulungsthemen
            </h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary/5">
                    <th className="w-10 px-3 py-2 text-center text-xs font-bold text-primary uppercase">
                      <Check className="w-4 h-4 mx-auto" />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-primary uppercase">Schulungsthema</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-primary uppercase hidden sm:table-cell">Zuständig</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-primary uppercase hidden md:table-cell">Schulungsunterlage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {session.topics?.map((topic: any) => (
                    <tr key={topic.id} className={cn("hover:bg-secondary/30 transition-colors", topic.checked && "bg-green-50")}>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => handleToggleTopic(topic.topicId, topic.checked)}
                          className={cn("w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                            topic.checked ? "bg-green-500 border-green-500 text-white" : "border-border hover:border-primary")}>
                          {topic.checked && <Check className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-foreground">{topic.title}</td>
                      <td className="px-3 py-2.5 text-sm text-muted-foreground hidden sm:table-cell">{topic.responsible || "–"}</td>
                      <td className="px-3 py-2.5 text-sm text-muted-foreground hidden md:table-cell">{topic.trainingMaterial || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {session.notes && (
          <div className="mb-6 p-3 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Anmerkungen: </span>{session.notes}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Teilnehmer ({session.attendances?.length || 0})
            </h3>
            <button onClick={() => setShowAttendanceDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
              <UserPlus className="w-3.5 h-3.5" />
              Teilnahme bestätigen
            </button>
          </div>

          {session.attendances?.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
              Noch keine Teilnehmer. Mitarbeiter tragen sich mit ihrer PIN ein.
            </div>
          ) : (
            <div className="border border-border rounded-lg divide-y divide-border">
              {session.attendances?.map((att: any) => (
                <div key={att.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary font-mono">{att.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{att.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      Bestätigt am {new Date(att.confirmedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleRemoveAttendance(att.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AttendanceDialog isOpen={showAttendanceDialog} onClose={() => setShowAttendanceDialog(false)} sessionId={sessionId} />
    </div>
  );
}

type ContentSection = { heading: string; items: string[] };

const TAB_META: Record<SessionType, { icon: ElementType; color: string; bgColor: string; desc: string; sections: ContentSection[] }> = {
  schulungsprotokoll: {
    icon: GraduationCap,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    desc: "Jährliche Schulungen gem. HACCP, IfSG, Arbeitssicherheit u.a.",
    sections: [],
  },
  taraschulung: {
    icon: Scale,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    desc: "Unterweisung Tara (Kasse/Bedientheke) gem. §26 Mess- und Eichverordnung – Pflicht für alle Mitarbeiter an Bedienungstheken und Kassen.",
    sections: [
      {
        heading: "§ 26 der Mess- und Eichverordnung",
        items: [
          "(1) Im geschäftlichen Verkehr mit losen Erzeugnissen sind Gewichtswerte, die der Preisermittlung zugrunde liegen, nur als Nettowerte anzugeben.",
          "(2) Das Verwenden gespeicherter Taragewichtswerte zur Berücksichtigung des Gewichts von Verpackungen oder Transportgeräten ist gestattet, wenn die gespeicherten Gewichtswerte den tatsächlichen Taragewichtswerten zum Zeitpunkt ihrer Verwendung entsprechen oder so bemessen sind, dass eine Benachteiligung des Vertragspartners ausgeschlossen ist.",
        ],
      },
      {
        heading: "Bereich Bedientheke/Kasse – Was ist zu beachten?",
        items: [
          "Die richtigen Tarawerte sind grundsätzlich beim Verkauf von Ware mit Verpackung im Bedienungsbereich in der Waage einzugeben.",
          "– das kann das Schälchen für Fleischsalat usw. bei Bedienungsware sein",
          "– das kann die Voreinstellung für das Auflagepapier bei Bedienungsware sein",
          "– das kann beim Kassieren von loser Ware in Plastik- oder Holzschliff-Schalen sein, sofern die Tara hier nicht bereits voreingestellt ist.",
          "– das kann der Wiege-Korb für Lauch und Rhabarber sein.",
        ],
      },
      {
        heading: "Prüfpflicht bei jedem Wiegevorgang",
        items: [
          "Grundsätzlich muss bei jedem Wiegevorgang geprüft werden, ob für die jeweilige Verpackung die Tara korrekt eingestellt ist. Gegebenenfalls muss die Einstellung von Hand korrigiert werden.",
        ],
      },
      {
        heading: "Bestätigung durch Unterschrift",
        items: [
          "Mit Unterschrift wird bestätigt, dass die/der Mitarbeiter/in a) über die Funktion der Tara an Kasse und/oder Bedienungswaage aufgeklärt wurde, dass sie/er b) die im Markt verwendeten unterschiedlich großen Plastik-Schalen, Beutel usw. kennt und sie/er c) in der Lage ist, bei Bedarf die Einstellungen jeweils anzupassen.",
        ],
      },
      {
        heading: "Wichtige Hinweise",
        items: [
          "Bei Fehlfunktionen ist sofort die Abteilungsleitung bzw. Marktleitung zu verständigen.",
          "Bitte beachten Sie: Eine Zuwiderhandlung gegen die rechtlichen Vorgaben stellt eine Ordnungswidrigkeit dar und wird von den zuständigen Eichbehörden regelmäßig mit Bußgeld geahndet.",
        ],
      },
    ],
  },
  lebensmittelleitkultur: {
    icon: Leaf,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    desc: "Information der QM-Abteilung 12/2022 – Neue Vorgaben für die Lebensmittelwirtschaft: Lebensmittelsicherheitskultur.",
    sections: [
      {
        heading: "Was ist die Lebensmittelsicherheitskultur?",
        items: [
          "Ganz allgemein gesagt ist eine gute \"Lebensmittelsicherheitskultur\" angestrebt, dass alle Mitarbeiter für das gemeinsame Ziel der Lebensmittelsicherheit verfügen und im Unternehmen die notwendigen Abläufe und Voraussetzungen gegeben sind, um eine positive Einstellung der Mitarbeiter für die Lebensmittelsicherheit zu erzeugen.",
          "Ab 2023 nimmt die QM-AG das Thema in ihr Prüfprogramm auf. Das Thema wird auch durch TÜV SÜD oder QAL (Filialqualität bzw. Qualitätscheck) berücksichtigt.",
        ],
      },
      {
        heading: "Gesetzliche Vorgaben – Verordnung (EG) Nr. 852/2004, Kapitel XIa",
        items: [
          "a) Verpflichtung der Betriebsleitung sowie aller Beschäftigten für sichere Produktion von Lebensmitteln.",
          "b) Führungsstärke in der Produktion sicherer Lebensmittel und der Entscheidung aller Beschäftigten in die Verfahren zur Gewährleistung der Lebensmittelsicherheit.",
          "c) Bewusstsein aller Beschäftigten für die Unternehmen, die Branche und für die Bedeutung der Lebensmittelsicherheit.",
          "d) Offene und klare Kommunikation zwischen allen Beschäftigten.",
          "e) Verfügbarkeit ausreichender Ressourcen zur Gewährleistung eines sicheren und hygienischen Umgangs mit Lebensmitteln.",
        ],
      },
      {
        heading: "Umsetzung auf Marktebene",
        items: [
          "a) Mitarbeiter werden angemessen und regelmäßig zu den einschlägigen Vorgaben geschult.",
          "b) Alle Vorgaben werden im Markt kommuniziert und Prüfprotokolle sowie Dokumentationen aktuell gehalten.",
          "c) Einschluss aller Mitarbeiter: Dokumentation im Markt, einschließlich neuer Mitarbeiter/innen.",
        ],
      },
      {
        heading: "Einhaltung der Regeln der Lebensmittelhygiene",
        items: [
          "Temperaturvorgaben für jeden Lebensmittelbereich einhalten.",
          "Einhaltung der Vorgaben für Mindesthaltbarkeiten.",
          "Vermeidung von Beeinflussungen der Lebensmittel durch Kontaminationen.",
          "Einhaltung der Regeln der Personalhygiene.",
          "Einhaltung der Regeln des Allergenmanagements.",
          "Einhaltung der Regeln der Schädlingsprävention.",
          "Einhaltung der Regeln der Abfallentsorgung.",
        ],
      },
      {
        heading: "Nachweis gegenüber der Behörde",
        items: [
          "QM-AG und TÜV bzw. QAL werden das Thema ab 2023 in das Prüfprogramm aufnehmen und können im Beurteilungsverfahren entsprechende Nachweise anfordern.",
          "Jeder Mitarbeiter hat das Recht, nach eigener Wahrnehmung Verstöße gegen Vorgaben/Gesetze zu melden. Im Zweifel an die Geschäftsführung wenden.",
          "Bei Fragen: Rochua Wallau, rochua.wallau@edeka.de",
        ],
      },
    ],
  },
  strohschwein: {
    icon: Ham,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    desc: "Schulungsprotokoll: Strohschwein & Bestes vom Huhn – gem. Qualitätssicherungs-Handbuch Einzelhandel Kapitel 9.4, Version 03/2023.",
    sections: [
      {
        heading: "Für GQB-Teilnehmer (Geprüfte Qualität – Bayern)",
        items: [
          "Verkauf von unverpackter, loser GQ-Ware (Strohschwein, Bestes vom Huhn) über die Bedienungstheke.",
          "Einhaltung der Systemvorgaben: Umsetzung, Ein-/Ausgangsdokumentation sowie Verhalten bei Kontrollen.",
          "Korrekte Auslobung: Kennzeichnung als \"Geprüfte Qualität – Bayern\" und \"Haltungsstufe 3\".",
          "Herstellung leicht verderblicher Produkte aus diesen Rohstoffen (Dokumentation FB 3.18.1 für Kunden ohne Lunar).",
        ],
      },
      {
        heading: "Für NICHT GQB-Teilnehmer",
        items: [
          "Verkauf von bayerischem Strohschwein / Bestem vom Huhn über die Bedienungstheke.",
          "Wichtig: Keine Auslobung als \"Geprüfte Qualität – Bayern\". Nur die Kennzeichnung mit \"Haltungsstufe 3\" ist erlaubt.",
          "Wissensstand über die spezifischen Produkte sicherstellen.",
          "Teilnahme an der verpflichtenden externen Kontrolle (Stichprobenplan 10% durch externe Zertifizierer).",
        ],
      },
      {
        heading: "Rechtliche Erklärungen & Bestätigung",
        items: [
          "Erhalt & Verständnis: Die oben genannten Schulungsinhalte wurden vermittelt und verstanden.",
          "Infektionsschutzgesetz: Es liegen keine Gründe für ein Beschäftigungsverbot nach §42 Abs. 1 IfSG vor.",
          "Kontrollsystem: Kenntnisnahme, dass man automatisch an das vorgeschriebene, unangemeldete Kontrollsystem der EDEKA Südbayern angebunden ist.",
        ],
      },
    ],
  },
};

const MAX_TOPICS_SHOWN = 4;

function SessionCard({
  session,
  sessionType,
  isAdmin,
  meta,
  onSelect,
  onRepeat,
}: {
  session: any;
  sessionType: SessionType;
  isAdmin: boolean;
  meta: (typeof TAB_META)[SessionType];
  onSelect: () => void;
  onRepeat: (e: React.MouseEvent) => void;
}) {
  const Icon = meta.icon as ElementType;
  const [topicsExpanded, setTopicsExpanded] = useState(false);

  const attendees: { initials: string; name: string }[] = session.attendees || [];
  const topics: string[] = session.topicTitles || [];
  const visibleTopics = topicsExpanded ? topics : topics.slice(0, MAX_TOPICS_SHOWN);
  const hiddenCount = topics.length - MAX_TOPICS_SHOWN;

  const formattedDate = new Date(session.sessionDate + "T00:00:00").toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all group">
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/50 cursor-pointer" onClick={onSelect}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors shrink-0">
            <Icon className={cn("w-4 h-4", meta.color)} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground">{formattedDate}</h3>
            {session.trainerName && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Schulungsleiter: <span className="font-medium text-foreground/70">{session.trainerName}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {isAdmin && sessionType === "schulungsprotokoll" && (
            <span
              role="button"
              onClick={onRepeat}
              title="Schulung wiederholen (gleiche Themen)"
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </span>
          )}
          <span className="p-1.5 rounded-lg text-muted-foreground group-hover:text-primary transition-colors" onClick={onSelect}>
            <Eye className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Topics (Schulungsprotokoll only) */}
      {sessionType === "schulungsprotokoll" && topics.length > 0 && (
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Schulungsthemen ({topics.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {visibleTopics.map((title: string, i: number) => (
              <span key={i} className="inline-block px-2 py-0.5 rounded-full bg-primary/8 text-primary text-xs font-medium border border-primary/15 leading-5">
                {title}
              </span>
            ))}
            {!topicsExpanded && hiddenCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setTopicsExpanded(true); }}
                className="inline-block px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors leading-5"
              >
                +{hiddenCount} weitere
              </button>
            )}
            {topicsExpanded && hiddenCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setTopicsExpanded(false); }}
                className="inline-block px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium border border-border hover:bg-secondary/80 transition-colors leading-5"
              >
                Weniger anzeigen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Attendees */}
      <div className="px-4 py-3">
        {attendees.length > 0 ? (
          <>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              Teilnehmer ({attendees.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {attendees.map((a, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs font-medium">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-200 text-green-800 text-[10px] font-bold shrink-0">
                    {a.initials}
                  </span>
                  {a.name || a.initials}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            Noch keine Teilnehmer eingetragen
          </p>
        )}
      </div>
    </div>
  );
}

function SessionListTab({
  marketId,
  tenantId,
  sessionType,
  selectedYear,
  isAdmin,
  onSelectSession,
}: {
  marketId: number;
  tenantId: number;
  sessionType: SessionType;
  selectedYear: number;
  isAdmin: boolean;
  onSelectSession: (id: number) => void;
}) {
  const { data: sessions, isLoading } = useListTrainingSessions(
    marketId,
    { year: selectedYear, type: sessionType } as any,
    { query: { enabled: !!marketId } }
  );
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [cloneTopicIds, setCloneTopicIds] = useState<number[] | undefined>(undefined);
  const meta = TAB_META[sessionType];
  const Icon = meta.icon;
  const color = trafficLight(sessions, selectedYear);

  const [showContent, setShowContent] = useState(false);

  const handleRepeat = (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    setCloneTopicIds(session.topicIds || []);
    setShowNewDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className={cn("rounded-xl border p-4", meta.bgColor)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", meta.color)} />
            <p className="text-sm text-foreground/80 leading-relaxed">{meta.desc}</p>
          </div>
          <TrafficBadge color={color} />
        </div>
        {sessionType !== "schulungsprotokoll" && meta.sections.length > 0 && (
          <button
            onClick={() => setShowContent(!showContent)}
            className={cn("mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors", meta.color, "hover:opacity-70")}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showContent ? "Schulungsinhalt ausblenden" : "Schulungsinhalt anzeigen"}
            <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform", showContent ? "rotate-90" : "-rotate-90")} />
          </button>
        )}
        {showContent && sessionType !== "schulungsprotokoll" && (
          <div className="mt-4 space-y-4 border-t border-border/40 pt-4">
            {meta.sections.map((section, si) => (
              <div key={si}>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/80 border border-border text-xs font-bold text-muted-foreground shrink-0">
                    {si + 1}
                  </span>
                  {section.heading}
                </h4>
                <ul className="space-y-1.5">
                  {section.items.map((item, ii) => (
                    <li key={ii} className="flex items-start gap-2 text-sm text-foreground/75 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {sessions?.length || 0} Schulung{(sessions?.length ?? 0) !== 1 ? "en" : ""} in {selectedYear}
        </p>
        {isAdmin && (
          <button onClick={() => setShowNewDialog(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Neue Schulung
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : !sessions?.length ? (
        <div className="bg-white rounded-xl border border-dashed border-border p-10 text-center">
          <Icon className={cn("w-10 h-10 mx-auto mb-3 opacity-20", meta.color)} />
          <p className="text-sm font-semibold text-foreground mb-1">Keine Schulung eingetragen</p>
          <p className="text-xs text-muted-foreground mb-4">Erstellen Sie eine neue Schulung, um Teilnahmen zu dokumentieren.</p>
          {isAdmin && (
            <button onClick={() => setShowNewDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
              <Plus className="w-4 h-4" />Erste Schulung anlegen
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session: any) => (
            <SessionCard
              key={session.id}
              session={session}
              sessionType={sessionType}
              isAdmin={isAdmin}
              meta={meta}
              onSelect={() => onSelectSession(session.id)}
              onRepeat={(e) => handleRepeat(e, session)}
            />
          ))}
        </div>
      )}

      {sessionType === "schulungsprotokoll" ? (
        <NewSchulungsprotokollDialog
          isOpen={showNewDialog}
          onClose={() => { setShowNewDialog(false); setCloneTopicIds(undefined); }}
          marketId={marketId}
          tenantId={tenantId}
          initialTopicIds={cloneTopicIds}
        />
      ) : (
        <NewSimpleSessionDialog isOpen={showNewDialog} onClose={() => setShowNewDialog(false)}
          marketId={marketId} tenantId={tenantId} sessionType={sessionType} typeLabel={TAB_LABELS[sessionType]} />
      )}
    </div>
  );
}

const TAB_ICONS: Record<TabKey, ElementType> = {
  schulungsprotokoll: GraduationCap,
  taraschulung: Scale,
  lebensmittelleitkultur: Leaf,
  strohschwein: Ham,
  besprechungsprotokoll: FileText,
};

export default function TrainingRecords({ noLayout }: { noLayout?: boolean } = {}) {
  const selectedMarketId = useAppStore((s) => s.selectedMarketId);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const setDate = useAppStore((s) => s.setDate);
  const adminSession = useAppStore((s) => s.adminSession);
  const hasPermission = useAppStore((s) => s.hasPermission);
  const isAdmin = hasPermission("entries.delete");
  const Wrap = noLayout
    ? ({ children }: { children: ReactNode }) => <>{children}</>
    : AppLayout;

  const [activeTab, setActiveTab] = useState<TabKey>("schulungsprotokoll");
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const enabled = { query: { enabled: !!selectedMarketId } };
  const { data: sessSchul } = useListTrainingSessions(selectedMarketId ?? 0, { year: selectedYear, type: "schulungsprotokoll" } as any, enabled);
  const { data: sessTara } = useListTrainingSessions(selectedMarketId ?? 0, { year: selectedYear, type: "taraschulung" } as any, enabled);
  const { data: sessLeben } = useListTrainingSessions(selectedMarketId ?? 0, { year: selectedYear, type: "lebensmittelleitkultur" } as any, enabled);
  const { data: sessStroh } = useListTrainingSessions(selectedMarketId ?? 0, { year: selectedYear, type: "strohschwein" } as any, enabled);

  const tabStatuses: Record<SessionType, "green" | "yellow" | "red"> = {
    schulungsprotokoll: trafficLight(sessSchul, selectedYear),
    taraschulung: trafficLight(sessTara, selectedYear),
    lebensmittelleitkultur: trafficLight(sessLeben, selectedYear),
    strohschwein: trafficLight(sessStroh, selectedYear),
  };

  if (!selectedMarketId) {
    return (
      <Wrap>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Bitte waehlen Sie einen Markt aus.</p>
        </div>
      </Wrap>
    );
  }

  if (selectedSessionId) {
    return (
      <Wrap>
        <div className="max-w-5xl mx-auto">
          <SessionDetailView sessionId={selectedSessionId} onBack={() => setSelectedSessionId(null)} />
        </div>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <div className="max-w-5xl mx-auto space-y-5">
        <PageHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/category/1" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="p-2.5 bg-white/15 rounded-xl shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">1.4 Schulungsnachweise</h1>
                <p className="text-sm text-white/70 mt-0.5">Schulungsprotokolle und Teilnehmerbestätigung</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setDate(selectedYear - 1, selectedMonth)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/75 hover:text-white transition-colors"
                title="Vorjahr"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-sm font-bold min-w-[4.5rem] justify-center">
                <Calendar className="w-3.5 h-3.5" />
                {selectedYear}
              </span>
              <button
                onClick={() => setDate(selectedYear + 1, selectedMonth)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/75 hover:text-white transition-colors"
                title="Nächstes Jahr"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </PageHeader>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="flex overflow-x-auto border-b border-border">
            {ALL_TABS.map((tab) => {
              const Icon = TAB_ICONS[tab];
              const st = tab !== "besprechungsprotokoll" ? tabStatuses[tab as SessionType] : null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors relative",
                    activeTab === tab
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {TAB_LABELS[tab]}
                  {st && (
                    <span className={cn(
                      "inline-block w-2 h-2 rounded-full ml-0.5 flex-shrink-0",
                      st === "green" && "bg-green-500",
                      st === "yellow" && "bg-amber-400",
                      st === "red" && "bg-red-500 animate-pulse",
                    )} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "besprechungsprotokoll" ? (
              <BesprechungsprotokollPage noLayout />
            ) : (
              <SessionListTab
                key={`${activeTab}-${selectedYear}`}
                marketId={selectedMarketId}
                tenantId={1}
                sessionType={activeTab}
                selectedYear={selectedYear}
                isAdmin={isAdmin}
                onSelectSession={setSelectedSessionId}
              />
            )}
          </div>
        </div>
      </div>
    </Wrap>
  );
}
