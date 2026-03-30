import { type ReactNode, useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2, Trash2, MessageSquare, RefreshCw } from "lucide-react";

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;
const BASE = import.meta.env.VITE_API_URL || "/api";

interface FeedbackEntry {
  id: number;
  text: string;
  page_path: string | null;
  market_name: string | null;
  created_at: string;
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/feedback`);
      setEntries(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Feedback-Eintrag löschen?")) return;
    await fetch(`${BASE}/feedback/${id}`, { method: "DELETE" });
    setEntries(prev => prev.filter(e => e.id !== id));
  };

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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-gray-50 border border-border/60 rounded-2xl p-10 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Noch kein Feedback eingegangen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white rounded-2xl border border-border/60 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.text}</p>
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
                    </div>
                  </div>
                  <button onClick={() => handleDelete(entry.id)}
                    className="shrink-0 p-1.5 text-muted-foreground hover:text-red-500 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
