import { useState, useRef, useCallback, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Mic, MicOff, Loader2, CheckCircle2, XCircle, Plus, Trash2, ChevronRight, Wand2, AlertCircle, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

interface ExtractedTask {
  title: string;
  description: string;
  assignedTo: string;
  requiresApproval: boolean;
  selected: boolean;
}

type Step = "record" | "review" | "done";

export default function Sprachassistent() {
  const [step, setStep] = useState<Step>("record");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [projektName, setProjektName] = useState("Sprachnotiz");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);
  const [createdProjectTitle, setCreatedProjectTitle] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const mr = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.start(200);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch {
      toast({
        title: "Mikrofon nicht verfügbar",
        description: "Bitte erlaube den Mikrofonzugriff in deinem Browser.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopAndProcess = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsRecording(false);
    setIsProcessing(true);

    await new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current) return resolve();
      mediaRecorderRef.current.onstop = () => resolve();
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    });

    try {
      const mimeType = chunksRef.current[0]?.type || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });

      const fd = new FormData();
      fd.append("audio", blob, "aufnahme.webm");

      const res = await fetch(`${BASE}/sprachassistent/transkribieren`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Serverfehler");
      }

      const data = await res.json();
      setTranscript(data.transcript || "");
      const extracted: ExtractedTask[] = (data.aufgaben || []).map((a: any) => ({
        ...a,
        selected: true,
      }));
      setTasks(extracted);

      if (extracted.length === 0 && !data.transcript) {
        toast({ title: "Keine Sprache erkannt", description: "Bitte nochmal versuchen.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      setStep("review");
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Unbekannter Fehler", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const updateTask = (idx: number, field: keyof ExtractedTask, value: string | boolean) => {
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const removeTask = (idx: number) => {
    setTasks(prev => prev.filter((_, i) => i !== idx));
  };

  const addTask = () => {
    setTasks(prev => [...prev, {
      title: "",
      description: "",
      assignedTo: "",
      requiresApproval: false,
      selected: true,
    }]);
  };

  const handleSave = async () => {
    const selected = tasks.filter(t => t.selected && t.title.trim());
    if (selected.length === 0) {
      setSaveError("Bitte mindestens eine Aufgabe mit Titel auswählen.");
      return;
    }
    setSaveError("");
    setIsSaving(true);

    try {
      const res = await fetch(`${BASE}/sprachassistent/aufgaben-anlegen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aufgaben: selected,
          projektName: projektName.trim() || "Sprachnotiz",
          transcript,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Serverfehler");
      }

      const data = await res.json();
      setCreatedProjectId(data.projectId);
      setCreatedProjectTitle(data.projectTitle);
      setStep("done");
    } catch (err: any) {
      setSaveError(err.message || "Unbekannter Fehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <AppLayout>
      <PageHeader title="Sprachassistent" subtitle="Sprich deine Aufgaben ein – die KI erstellt sie automatisch" />

      <div className="max-w-2xl mx-auto px-4 pb-12 space-y-6">

        {/* ── STEP 1: Aufnehmen ── */}
        {step === "record" && (
          <div className="bg-white rounded-2xl border border-border/60 p-8 flex flex-col items-center gap-6 shadow-sm">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-[#1a3a6b]">Sprachnachricht aufnehmen</h2>
              <p className="text-sm text-muted-foreground">
                Beschreibe die Aufgaben, die du verteilen möchtest. Die KI extrahiert daraus strukturierte Projektaufgaben.
              </p>
            </div>

            {isProcessing ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-[#1a3a6b]/10 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-[#1a3a6b] animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#1a3a6b]">KI analysiert deine Nachricht…</p>
                  <p className="text-sm text-muted-foreground mt-1">Transkription & Aufgabenextraktion läuft</p>
                </div>
              </div>
            ) : isRecording ? (
              <div className="flex flex-col items-center gap-5 py-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                  <button
                    onClick={stopAndProcess}
                    className="relative w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
                  >
                    <MicOff className="w-10 h-10" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-red-600 font-bold text-xl tabular-nums">{formatTime(recordingSeconds)}</p>
                  <p className="text-sm text-muted-foreground">Aufnahme läuft… Drücke zum Beenden</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 py-4">
                <button
                  onClick={startRecording}
                  className="w-24 h-24 rounded-full bg-[#1a3a6b] hover:bg-[#2d5aa0] text-white flex items-center justify-center shadow-lg transition-all active:scale-95"
                >
                  <Mic className="w-10 h-10" />
                </button>
                <p className="text-sm text-muted-foreground">Mikrofon-Button drücken und sprechen</p>
              </div>
            )}

            <div className="w-full bg-muted/40 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground/70 flex items-center gap-1"><Volume2 className="w-3 h-3" /> Beispiel:</p>
              <p className="italic">"Bitte den Kühlraum im EG bis Freitag kontrollieren, das macht Tobias. Außerdem brauchen wir eine neue Bestellung für Milchprodukte – das soll Sandra übernehmen und Kai muss das genehmigen."</p>
            </div>
          </div>
        )}

        {/* ── STEP 2: Aufgaben prüfen ── */}
        {step === "review" && (
          <div className="space-y-5">
            {/* Transkript */}
            {transcript && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Transkript</p>
                <p className="text-sm text-blue-900 leading-relaxed">{transcript}</p>
              </div>
            )}

            {/* Projektname */}
            <div className="bg-white rounded-xl border border-border/60 p-4 space-y-2">
              <label className="text-sm font-semibold text-[#1a3a6b]">Projektname</label>
              <input
                value={projektName}
                onChange={e => setProjektName(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
                placeholder="z.B. Wochenziele KW17"
              />
            </div>

            {/* Aufgaben-Liste */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#1a3a6b] flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  {tasks.length === 0 ? "Keine Aufgaben erkannt" : `${tasks.filter(t => t.selected).length} von ${tasks.length} Aufgaben ausgewählt`}
                </h3>
                <button onClick={addTask} className="flex items-center gap-1 text-xs text-[#2d5aa0] font-semibold hover:underline">
                  <Plus className="w-3 h-3" /> Hinzufügen
                </button>
              </div>

              {tasks.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Keine Aufgaben erkannt. Du kannst manuell welche hinzufügen.</p>
                </div>
              )}

              {tasks.map((task, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-xl border p-4 space-y-3 transition-all ${task.selected ? "border-[#1a3a6b]/30 shadow-sm" : "border-border/40 opacity-50"}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.selected}
                      onChange={e => updateTask(idx, "selected", e.target.checked)}
                      className="mt-1 w-4 h-4 accent-[#1a3a6b] cursor-pointer"
                    />
                    <div className="flex-1 space-y-2">
                      <input
                        value={task.title}
                        onChange={e => updateTask(idx, "title", e.target.value)}
                        placeholder="Aufgabentitel"
                        className="w-full font-semibold text-sm border-0 border-b border-border/40 focus:border-[#1a3a6b] focus:outline-none pb-1 bg-transparent"
                      />
                      <input
                        value={task.description}
                        onChange={e => updateTask(idx, "description", e.target.value)}
                        placeholder="Beschreibung (optional)"
                        className="w-full text-xs text-muted-foreground border-0 focus:outline-none bg-transparent"
                      />
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Zuständig:</span>
                          <input
                            value={task.assignedTo}
                            onChange={e => updateTask(idx, "assignedTo", e.target.value)}
                            placeholder="Name"
                            className="text-xs border border-border/50 rounded-md px-2 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-[#1a3a6b]/30"
                          />
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={task.requiresApproval}
                            onChange={e => updateTask(idx, "requiresApproval", e.target.checked)}
                            className="w-3 h-3 accent-amber-500"
                          />
                          <span className="text-xs text-muted-foreground">Genehmigung nötig</span>
                        </label>
                      </div>
                    </div>
                    <button onClick={() => removeTask(idx)} className="text-muted-foreground/50 hover:text-red-500 transition-colors mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {saveError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {saveError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep("record"); setTranscript(""); setTasks([]); setRecordingSeconds(0); }}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                Neu aufnehmen
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || tasks.filter(t => t.selected && t.title.trim()).length === 0}
                className="flex-1 py-3 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold hover:bg-[#2d5aa0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Speichern…</> : <><CheckCircle2 className="w-4 h-4" /> Aufgaben anlegen</>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Fertig ── */}
        {step === "done" && (
          <div className="bg-white rounded-2xl border border-border/60 p-8 flex flex-col items-center gap-6 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1a3a6b]">Aufgaben wurden angelegt!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Das Projekt <span className="font-semibold text-foreground">„{createdProjectTitle}"</span> wurde erstellt.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => navigate("/projekt-hub")}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold hover:bg-[#2d5aa0] transition-colors"
              >
                Zum ProjektHub <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setStep("record"); setTranscript(""); setTasks([]); setRecordingSeconds(0); setProjektName("Sprachnotiz"); setSaveError(""); setCreatedProjectId(null); }}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                Neue Aufnahme
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
