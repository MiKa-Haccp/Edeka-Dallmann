import { useState, useRef, useEffect } from "react";
import { useVerifyPin } from "@workspace/api-client-react";
import { KeyRound, Check, X, Loader2 } from "lucide-react";

interface PinVerificationProps {
  open: boolean;
  onVerified: (userId: number, userName: string, initials: string) => void;
  onCancel: () => void;
}

export function PinVerification({ open, onVerified, onCancel }: PinVerificationProps) {
  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const verifyPin = useVerifyPin();
  const initialsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setInitials("");
      setPin("");
      setError("");
      setTimeout(() => initialsRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  const handleVerify = async () => {
    setError("");

    if (!initials) {
      setError("Bitte Kürzel eingeben.");
      return;
    }
    if (!pin || pin.length !== 4) {
      setError("Bitte 4-stelligen PIN eingeben.");
      return;
    }

    try {
      const result = await verifyPin.mutateAsync({
        data: { initials: initials.toUpperCase(), pin, tenantId: 1 },
      });

      if (result.valid && result.userId) {
        onVerified(result.userId, result.userName || initials, initials.toUpperCase());
      } else {
        setError("Kürzel oder PIN ungültig.");
      }
    } catch {
      setError("Verifizierung fehlgeschlagen.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#1a3a6b] text-white px-5 py-3 flex items-center gap-3">
          <KeyRound className="h-5 w-5" />
          <h3 className="font-bold text-base">Eingabe bestätigen</h3>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Bitte geben Sie Ihr Kürzel und Ihren 4-stelligen PIN ein, um die Eingabe zu bestätigen.
          </p>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <X className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Kürzel</label>
            <input
              ref={initialsRef}
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 3))}
              onKeyDown={handleKeyDown}
              className="w-full border border-border rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="z.B. AS"
              maxLength={3}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">PIN (4 Ziffern)</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").substring(0, 4))}
              onKeyDown={handleKeyDown}
              className="w-full border border-border rounded-xl px-4 py-3 text-center text-lg font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="****"
              maxLength={4}
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleVerify}
              disabled={verifyPin.isPending || !initials || pin.length !== 4}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifyPin.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Bestätigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
