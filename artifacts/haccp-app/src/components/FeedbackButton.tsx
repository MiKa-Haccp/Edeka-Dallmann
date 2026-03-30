import { useState } from "react";
import { X } from "lucide-react";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [thanks, setThanks] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    console.log("[Feedback]", text.trim());
    setThanks(true);
    setTimeout(() => {
      setOpen(false);
      setThanks(false);
      setText("");
    }, 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setText("");
    setThanks(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[9000] bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-lg transition-all"
      >
        🤯 Was nervt gerade?
      </button>

      {open && (
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
                  <button onClick={handleSubmit} disabled={!text.trim()}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors">
                    Absenden
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
