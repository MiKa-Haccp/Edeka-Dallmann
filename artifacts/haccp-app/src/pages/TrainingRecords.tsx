import type { ReactNode, ElementType } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
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
import { Link } from "wouter";
import {
  GraduationCap,
  Plus,
  ChevronLeft,
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
  FileText,
  ExternalLink,
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
}: {
  isOpen: boolean;
  onClose: () => void;
  marketId: number;
  tenantId: number;
}) {
  const { data: topics } = useListTrainingTopics();
  const { data: users } = useListUsers({ tenantId });
  const createSession = useCreateTrainingSession();
  const queryClient = useQueryClient();

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [trainerName, setTrainerName] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
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
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN" || adminSession?.role === "MARKTLEITER";

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

const TAB_META: Record<SessionType, { icon: ElementType; color: string; desc: string }> = {
  schulungsprotokoll: {
    icon: GraduationCap,
    color: "text-primary",
    desc: "Jährliche Schulungen gem. HACCP, IfSG, Arbeitssicherheit u.a.",
  },
  taraschulung: {
    icon: Scale,
    color: "text-blue-600",
    desc: "Taraschulung gem. §26 Mess- und Eichverordnung (MessEV) – Pflicht für alle Mitarbeiter an Bedienungstheken und Waagen.",
  },
  lebensmittelleitkultur: {
    icon: Leaf,
    color: "text-green-600",
    desc: "Schulung zu Lebensmittelkennzeichnung, Herkunft und Qualitaetssicherung gemaess Lebensmittelleitkultur.",
  },
  strohschwein: {
    icon: Ham,
    color: "text-amber-600",
    desc: "Jaehrliche Schulung zum Verkauf von Strohschwein-Produkten – Haltungsform, Kennzeichnung und Kundenkommunikation.",
  },
};

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
  const meta = TAB_META[sessionType];
  const Icon = meta.icon;
  const color = trafficLight(sessions, selectedYear);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4 flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", meta.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground leading-relaxed">{meta.desc}</p>
        </div>
        <TrafficBadge color={color} />
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
            <button key={session.id} onClick={() => onSelectSession(session.id)}
              className="bg-white rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-md transition-all text-left group">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors shrink-0">
                  <Icon className={cn("w-5 h-5", meta.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {new Date(session.sessionDate + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                    </h3>
                    <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  </div>
                  {session.trainerName && (
                    <p className="text-xs text-muted-foreground mt-0.5">Schulungsleiter: {session.trainerName}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {sessionType === "schulungsprotokoll" && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5" />{session.topicCount} Themen
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />{session.attendanceCount} Teilnehmer
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {sessionType === "schulungsprotokoll" ? (
        <NewSchulungsprotokollDialog isOpen={showNewDialog} onClose={() => setShowNewDialog(false)} marketId={marketId} tenantId={tenantId} />
      ) : (
        <NewSimpleSessionDialog isOpen={showNewDialog} onClose={() => setShowNewDialog(false)}
          marketId={marketId} tenantId={tenantId} sessionType={sessionType} typeLabel={TAB_LABELS[sessionType]} />
      )}
    </div>
  );
}

export default function TrainingRecords({ noLayout }: { noLayout?: boolean } = {}) {
  const selectedMarketId = useAppStore((s) => s.selectedMarketId);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const adminSession = useAppStore((s) => s.adminSession);
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN" || adminSession?.role === "MARKTLEITER";
  const Wrap = noLayout
    ? ({ children }: { children: ReactNode }) => <>{children}</>
    : AppLayout;

  const [activeTab, setActiveTab] = useState<TabKey>("schulungsprotokoll");
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

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

  const tabIcons: Record<TabKey, ElementType> = {
    schulungsprotokoll: GraduationCap,
    taraschulung: Scale,
    lebensmittelleitkultur: Leaf,
    strohschwein: Ham,
    besprechungsprotokoll: FileText,
  };

  return (
    <Wrap>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="bg-white rounded-xl border border-border p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">1.4 Schulungsnachweise</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Schulungsprotokolle und Teilnehmerbestaetigung</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="flex overflow-x-auto border-b border-border">
            {ALL_TABS.map((tab) => {
              const Icon = tabIcons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeTab === tab
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {TAB_LABELS[tab]}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "besprechungsprotokoll" ? (
              <div className="text-center py-10">
                <FileText className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Besprechungsprotokoll</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  Das Besprechungsprotokoll befindet sich im Bereich Hygienebelehrung und Mitarbeiterbesprechungen.
                </p>
                <Link
                  href="/besprechungsprotokoll"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  <ExternalLink className="w-4 h-4" />
                  Zum Besprechungsprotokoll
                </Link>
              </div>
            ) : (
              <SessionListTab
                key={`${activeTab}-${selectedYear}`}
                marketId={selectedMarketId}
                tenantId={1}
                sessionType={activeTab as SessionType}
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
