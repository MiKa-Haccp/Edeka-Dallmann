import { useState } from "react";
import { useLocation } from "wouter";
import { Mail, ChevronLeft, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const appBaseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
      const resp = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, appBaseUrl }),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.error || "Fehler aufgetreten."); return; }
      setSent(true);
    } catch {
      setError("Verbindungsfehler.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="bg-[#1a3a6b] text-white px-6 py-5 flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">Passwort vergessen</h2>
              <p className="text-sm text-white/70">EDEKA Dallmann HACCP</p>
            </div>
          </div>

          <div className="p-6">
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Geben Sie Ihre E-Mail-Adresse ein. Sie erhalten einen Link zum Zurücksetzen Ihres Passworts.
                </p>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">E-Mail-Adresse</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="name@edeka-dallmann.de"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1a3a6b] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1a3a6b]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Wird gesendet…</> : <><Mail className="h-4 w-4" /> Link zusenden</>}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin/login")}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Zurück zur Anmeldung
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-700 text-sm">E-Mail gesendet</p>
                    <p className="text-green-600 text-xs mt-0.5">
                      Falls ein Konto mit dieser Adresse existiert, haben Sie soeben einen Link erhalten. Bitte prüfen Sie auch Ihren Spam-Ordner.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/admin/login")}
                  className="w-full px-4 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#1a3a6b]/90 transition-colors"
                >
                  Zur Anmeldung
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
