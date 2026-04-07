import { type ReactNode, useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2, Trash2, MessageSquare, RefreshCw, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;
const BASE = import.meta.env.VITE_API_URL || "/api";

interface FeedbackEntry {
  id: number;
  text: string;
  page_path: string | null;
  market_name: string | null;
  created_at: string;
  status: "offen" | "erledigt";
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Startseite / Dashboard",
  "/todo": "To-Do Übersicht",
  "/todo-tagesliste": "Meine Aufgaben",
  "/todo-verwaltung": "Aufgaben verwalten",
  "/todo-kassen": "Kasseneinteilung",
  "/admin/system": "Systemverwaltung",
  "/admin/users": "Benutzerverwaltung",
  "/wareneingaenge": "Wareneingänge",
  "/reinigung-taeglich": "Tägliche Reinigung",
  "/responsibilities": "Verantwortlichkeiten",
  "/mitarbeiter-liste": "Mitarbeiter",
  "/training-records": "Schulungsnachweise",
  "/annual-cleaning-plan": "Jahresreinigungsplan",
  "/betriebsbegehung": "Betriebsbegehung",
};

function pageLabel(path: string | null): string {
  if (!path) return "–";
  return PAGE_LABELS[path] || path;
}

export default function FeedbackAdmin() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"alle" | "offen" | "erledigt">("alle");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/feedback`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
      await fetch(`${BASE}/feedback/mark-all-read`, { method: "PATCH" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (entry: FeedbackEntry) => {
    const newStatus = entry.status === "erledigt" ? "offen" : "erledigt";
    const res = await fetch(`${BASE}/feedback/${entry.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: newStatus } : e));
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`${BASE}/feedback/${id}`, { method: "DELETE" });
    setEntries(prev => prev.filter(e => e.id !== id));
    setConfirmDeleteId(null);
  };

  const visible = entries.filter(e =>
    filter === "alle" ? true : e.status === filter
  );

  const offenCount = entries.filter(e => e.status === "offen").length;
  const erledigtCount = entries.filter(e => e.status === "erledigt").length;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-500" /> Feedback-Einträge
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{entries.length} Einträge gesamt</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-border/60 rounded-xl text-sm text-muted-foreground hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Aktualisieren
          </button>
        </div>

        {/* Filter-Tabs */}
        <div className="flex gap-2">
          {[
            { key: "alle", label: `Alle (${entries.length})` },
            { key: "offen", label: `Offen (${offenCount})`, icon: AlertCircle, color: "text-amber-600" },
            { key: "erledigt", label: `Erledigt (${erledigtCount})`, icon: CheckCircle2, color: "text-green-600" },
          ].map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors",
                filter === key
                  ? "bg-[#1a3a6b] text-white border-[#1a3a6b]"
                  : "bg-white text-muted-foreground border-border/60 hover:bg-gray-50"
              )}
            >
              {Icon && <Icon className={cn("w-3.5 h-3.5", filter === key ? "text-white" : color)} />}
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-gray-50 border border-border/60 rounded-2xl p-10 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              {entries.length === 0 ? "Noch kein Feedback eingegangen." : "Keine Einträge in diesem Filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(entry => (
              <div
                key={entry.id}
                className={cn(
                  "bg-white rounded-2xl border shadow-sm p-4 transition-colors",
                  entry.status === "erledigt" ? "border-green-200 opacity-70" : "border-border/60"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className={cn(
                      "text-sm whitespace-pre-wrap leading-relaxed",
                      entry.status === "erledigt" ? "line-through text-muted-foreground" : "text-foreground"
                    )}>
                      {entry.text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] bg-gray-100 text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                        📍 {pageLabel(entry.page_path)}
                      </span>
                      {entry.market_name && (
                        <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          🏪 {entry.market_name}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString("de-DE", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })} Uhr
                      </span>
                      {entry.status === "erledigt" && (
                        <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Erledigt
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Erledigt toggle */}
                    <button
                      onClick={() => handleToggleStatus(entry)}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        entry.status === "erledigt"
                          ? "text-green-600 hover:bg-green-50"
                          : "text-muted-foreground hover:text-green-600 hover:bg-green-50"
                      )}
                      title={entry.status === "erledigt" ? "Als offen markieren" : "Als erledigt markieren"}
                    >
                      {entry.status === "erledigt"
                        ? <CheckCircle2 className="w-4 h-4" />
                        : <Circle className="w-4 h-4" />
                      }
                    </button>

                    {/* Delete mit Inline-Bestätigung */}
                    {confirmDeleteId === entry.id ? (
                      <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                        <span className="text-xs text-red-700 font-medium">Löschen?</span>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-800 px-1"
                        >
                          Ja
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-muted-foreground hover:text-foreground px-1"
                        >
                          Nein
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
