import { useState } from "react";
import { X } from "lucide-react";
import { useLocation } from "wouter";
import { useAppStore } from "@/store/use-app-store";

const BASE = import.meta.env.VITE_API_URL || "/api";

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

function getPageLabel(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  const clean = path.replace(/^\/+/, "");
  return clean || "Startseite";
}

interface FeedbackButtonProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackButton({ isOpen, onClose }: FeedbackButtonProps) {
  const [location] = useLocation();
  const { selectedMarketId } = useAppStore();
  const [text, setText] = useState("");
  const [thanks, setThanks] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch(`${BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          pagePath: location,
          marketId: selectedMarketId,
        }),
      });
    } catch {
      // still show thank you even if request fails
    }
    setSending(false);
    setThanks(true);
    setTimeout(() => {
      onClose();
      setThanks(false);
      setText("");
    }, 2000);
  };

  const handleClose = () => {
    onClose();
    setText("");
    setThanks(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9001] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        {thanks ? (
          <div className="py-6 text-center">
            <p className="text-2xl mb-2">🙏</p>
            <p className="font-bold text-foreground">Danke für dein Feedback!</p>
            <p className="text-xs text-muted-foreground mt-1">Das hilft uns sehr weiter.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-foreground text-base">Raus damit!</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Jede Kleinigkeit hilft uns besser zu werden.</p>
              </div>
              <button onClick={handleClose} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3 px-3 py-2 bg-gray-50 rounded-xl border border-border/40 text-xs text-muted-foreground">
              📍 Aktuelle Seite: <span className="font-semibold text-foreground">{getPageLabel(location)}</span>
            </div>

            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Was stört dich? Was fehlt? Was ist umständlich?"
              rows={5}
              className="w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400/40 mb-3"
            />
            <div className="flex gap-2">
              <button onClick={handleClose}
                className="flex-1 py-2.5 border border-border/60 rounded-xl text-sm font-medium text-muted-foreground hover:bg-gray-50 transition-colors">
                Abbrechen
              </button>
              <button onClick={handleSubmit} disabled={!text.trim() || sending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors">
                {sending ? "…" : "Absenden"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
