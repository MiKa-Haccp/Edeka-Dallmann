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
  Calendar,
  Users,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function NewSessionDialog({
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

  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [trainerName, setTrainerName] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [customTopicTitle, setCustomTopicTitle] = useState("");
  const [notes, setNotes] = useState("");

  const adminUsers = users?.filter(
    (u: any) =>
      u.role === "SUPERADMIN" ||
      u.role === "ADMIN" ||
      u.role === "MARKTLEITER"
  );

  const handleSelectAllTopics = () => {
    if (topics && selectedTopics.length === topics.length) {
      setSelectedTopics([]);
    } else if (topics) {
      setSelectedTopics(topics.map((t: any) => t.id));
    }
  };

  const toggleTopic = (id: number) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!sessionDate || selectedTopics.length === 0) return;

    await createSession.mutateAsync({
      marketId,
      data: {
        tenantId,
        sessionDate,
        trainerId,
        trainerName: trainerName || null,
        topicIds: selectedTopics,
        customTopicTitle: customTopicTitle || null,
        notes: notes || null,
      },
    });
    queryClient.invalidateQueries({
      queryKey: [`/api/markets/${marketId}/training-sessions`],
    });
    setSessionDate(new Date().toISOString().split("T")[0]);
    setTrainerId(null);
    setTrainerName("");
    setSelectedTopics([]);
    setCustomTopicTitle("");
    setNotes("");
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
              <label className="block text-sm font-medium text-foreground mb-1">
                Datum *
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Schulungsleiter *
              </label>
              <select
                value={trainerId || ""}
                onChange={(e) => {
                  const id = e.target.value ? parseInt(e.target.value) : null;
                  setTrainerId(id);
                  if (id) {
                    const user = adminUsers?.find((u: any) => u.id === id);
                    if (user) setTrainerName(user.name);
                  }
                }}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Schulungsleiter wählen...</option>
                {adminUsers?.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Nur Admins und Marktleiter können Schulungsleiter sein
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Schulungsthemen *
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllTopics}
                  className="text-xs text-primary hover:underline"
                >
                  {topics && selectedTopics.length === topics.length
                    ? "Alle abwählen"
                    : "Alle auswählen"}
                </button>
              </div>
              <div className="border border-border rounded-lg divide-y divide-border max-h-60 overflow-y-auto">
                {topics?.map((topic: any) => (
                  <label
                    key={topic.id}
                    className="flex items-start gap-3 px-3 py-2.5 hover:bg-secondary/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic.id)}
                      onChange={() => toggleTopic(topic.id)}
                      className="mt-0.5 rounded border-border"
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        {topic.title}
                      </p>
                      {topic.responsible && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Zuständig: {topic.responsible}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Sonstiges (Freitext)
              </label>
              <input
                type="text"
                value={customTopicTitle}
                onChange={(e) => setCustomTopicTitle(e.target.value)}
                placeholder='z.B. "Feuerwerksverkauf"'
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Anmerkungen
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                createSession.isPending ||
                !sessionDate ||
                selectedTopics.length === 0
              }
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createSession.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Schulung erstellen
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AttendanceDialog({
  isOpen,
  onClose,
  sessionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
}) {
  const addAttendance = useAddTrainingAttendance();
  const queryClient = useQueryClient();
  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async () => {
    if (!initials || !pin) return;
    setError("");
    try {
      await addAttendance.mutateAsync({
        sessionId,
        data: { initials: initials.toUpperCase(), pin },
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/training-sessions/${sessionId}`],
      });
      setInitials("");
      setPin("");
      onClose();
    } catch (err: any) {
      const msg =
        err?.message || err?.data?.error || "Fehler beim Eintragen.";
      setError(msg);
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
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Kürzel *
              </label>
              <input
                type="text"
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                placeholder="z.B. AS"
                maxLength={3}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm uppercase font-mono tracking-widest text-center text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                4-stellige PIN *
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="****"
                  maxLength={4}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-center text-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
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
            <button
              onClick={() => {
                setInitials("");
                setPin("");
                setError("");
                onClose();
              }}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                addAttendance.isPending || !initials || pin.length < 4
              }
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addAttendance.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Bestätigen
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SessionDetailView({
  sessionId,
  onBack,
}: {
  sessionId: number;
  onBack: () => void;
}) {
  const { data: session, isLoading } = useGetTrainingSession(sessionId);
  const updateSession = useUpdateTrainingSession();
  const deleteSession = useDeleteTrainingSession();
  const removeAttendance = useRemoveTrainingAttendance();
  const queryClient = useQueryClient();
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const adminSession = useAppStore((s) => s.adminSession);
  const isAdmin =
    adminSession?.role === "SUPERADMIN" ||
    adminSession?.role === "ADMIN" ||
    adminSession?.role === "MARKTLEITER";

  const handleToggleTopic = async (
    topicId: number,
    currentChecked: boolean
  ) => {
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
    queryClient.invalidateQueries({
      queryKey: [`/api/training-sessions/${sessionId}`],
    });
  };

  const handleDeleteSession = async () => {
    if (!confirm("Schulung wirklich löschen?")) return;
    await deleteSession.mutateAsync({ sessionId });
    onBack();
  };

  const handleRemoveAttendance = async (attendanceId: number) => {
    if (!confirm("Teilnahme wirklich entfernen?")) return;
    await removeAttendance.mutateAsync({ sessionId, attendanceId });
    queryClient.invalidateQueries({
      queryKey: [`/api/training-sessions/${sessionId}`],
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Schulung nicht gefunden.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">
            Schulungsprotokoll
          </h2>
          <p className="text-sm text-muted-foreground">
            {new Date(session.sessionDate + "T00:00:00").toLocaleDateString(
              "de-DE",
              {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }
            )}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleDeleteSession}
            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
            title="Schulung löschen"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-border p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Datum
            </p>
            <p className="text-sm font-semibold text-foreground">
              {new Date(session.sessionDate + "T00:00:00").toLocaleDateString(
                "de-DE"
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Schulungsleiter
            </p>
            <p className="text-sm font-semibold text-foreground">
              {session.trainerName || "–"}
            </p>
          </div>
        </div>

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
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary uppercase">
                    Schulungsthema
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary uppercase hidden sm:table-cell">
                    Zuständig
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-primary uppercase hidden md:table-cell">
                    Schulungsunterlage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {session.topics?.map((topic: any) => (
                  <tr
                    key={topic.id}
                    className={cn(
                      "hover:bg-secondary/30 transition-colors",
                      topic.checked && "bg-green-50"
                    )}
                  >
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() =>
                          handleToggleTopic(topic.topicId, topic.checked)
                        }
                        className={cn(
                          "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                          topic.checked
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-border hover:border-primary"
                        )}
                      >
                        {topic.checked && <Check className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-foreground">
                      {topic.title}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground hidden sm:table-cell">
                      {topic.responsible || "–"}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground hidden md:table-cell">
                      {topic.trainingMaterial || "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Teilnehmer ({session.attendances?.length || 0})
            </h3>
            <button
              onClick={() => setShowAttendanceDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Teilnahme bestätigen
            </button>
          </div>

          {session.attendances?.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
              Noch keine Teilnehmer eingetragen. Mitarbeiter können sich mit
              ihrem Kürzel und PIN eintragen.
            </div>
          ) : (
            <div className="border border-border rounded-lg divide-y divide-border">
              {session.attendances?.map((att: any) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary font-mono">
                      {att.initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {att.userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bestätigt am{" "}
                      {new Date(att.confirmedAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveAttendance(att.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AttendanceDialog
        isOpen={showAttendanceDialog}
        onClose={() => setShowAttendanceDialog(false)}
        sessionId={sessionId}
      />
    </div>
  );
}

export default function TrainingRecords() {
  const selectedMarketId = useAppStore((s) => s.selectedMarketId);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const adminSession = useAppStore((s) => s.adminSession);
  const isAdmin =
    adminSession?.role === "SUPERADMIN" ||
    adminSession?.role === "ADMIN" ||
    adminSession?.role === "MARKTLEITER";

  const { data: sessions, isLoading } = useListTrainingSessions(
    selectedMarketId!,
    { year: selectedYear },
    { query: { enabled: !!selectedMarketId } }
  );

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );

  if (!selectedMarketId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Bitte wählen Sie einen Markt aus.</p>
        </div>
      </AppLayout>
    );
  }

  if (selectedSessionId) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto">
          <SessionDetailView
            sessionId={selectedSessionId}
            onBack={() => setSelectedSessionId(null)}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-border p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  1.3 Schulungsnachweise
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Schulungsprotokolle und Teilnehmerbestätigungen
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowNewDialog(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Neue Schulung</span>
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !sessions?.length ? (
          <div className="bg-white rounded-xl border border-dashed border-border p-12 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Noch keine Schulungen
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Erstellen Sie eine neue Schulung, um Teilnahmen zu dokumentieren.
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowNewDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Erste Schulung erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {sessions.map((session: any) => (
              <button
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className="bg-white rounded-xl border border-border p-4 sm:p-5 hover:border-primary/50 hover:shadow-md transition-all duration-200 text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground">
                        Schulung vom{" "}
                        {new Date(
                          session.sessionDate + "T00:00:00"
                        ).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                      <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                    </div>
                    {session.trainerName && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Schulungsleiter: {session.trainerName}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5" />
                        {session.topicCount} Themen
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        {session.attendanceCount} Teilnehmer
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <NewSessionDialog
          isOpen={showNewDialog}
          onClose={() => setShowNewDialog(false)}
          marketId={selectedMarketId}
          tenantId={1}
        />
      </div>
    </AppLayout>
  );
}
