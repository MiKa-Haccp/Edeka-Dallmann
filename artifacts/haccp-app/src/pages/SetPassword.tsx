import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Eye, EyeOff, CheckCircle, AlertTriangle, Lock, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function SetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") || "";

  const [tokenInfo, setTokenInfo] = useState<{ name: string; email: string; type: string } | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [tokenLoading, setTokenLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) { setTokenError("Kein Token gefunden."); setTokenLoading(false); return; }
    fetch(`${API_BASE}/auth/token/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) setTokenInfo({ name: data.name, email: data.email, type: data.type });
        else setTokenError(data.error || "Ungültiger Link.");
      })
      .catch(() => setTokenError("Verbindungsfehler."))
      .finally(() => setTokenLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Passwort muss mindestens 8 Zeichen lang sein."); return; }
    if (password !== passwordConfirm) { setError("Passwörter stimmen nicht überein."); return; }
    setSaving(true);
    try {
      const resp = await fetch(`${API_BASE}/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.error || "Fehler beim Speichern."); return; }
      setSuccess(`Passwort für ${data.name} wurde erfolgreich gesetzt.`);
    } catch {
      setError("Verbindungsfehler.");
    } finally {
      setSaving(false);
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ["", "Zu kurz", "Ausreichend", "Stark"];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-green-500"];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="bg-[#1a3a6b] text-white px-6 py-5 flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">Passwort festlegen</h2>
              <p className="text-sm text-white/70">EDEKA Dallmann HACCP</p>
            </div>
          </div>

          <div className="p-6">
            {tokenLoading && (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                <Loader2 className="h-5 w-5 animate-spin" /> Link wird geprüft…
              </div>
            )}

            {!tokenLoading && tokenError && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700 text-sm">Link ungültig</p>
                    <p className="text-red-600 text-xs mt-0.5">{tokenError}</p>
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

            {!tokenLoading && tokenInfo && !success && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800 font-semibold">{tokenInfo.name}</p>
                  <p className="text-xs text-blue-600">{tokenInfo.email}</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Neues Passwort</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                      placeholder="Mindestens 8 Zeichen"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${strengthColor[strength]}`}
                          style={{ width: `${(strength / 3) * 100}%` }} />
                      </div>
                      <span className={`text-xs font-medium ${strength === 1 ? "text-red-500" : strength === 2 ? "text-yellow-600" : "text-green-600"}`}>
                        {strengthLabel[strength]}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Passwort bestätigen</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={passwordConfirm}
                      onChange={e => setPasswordConfirm(e.target.value)}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                      placeholder="Passwort wiederholen"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordConfirm.length > 0 && password !== passwordConfirm && (
                    <p className="text-xs text-red-500 mt-1">Passwörter stimmen nicht überein.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving || password.length < 8 || password !== passwordConfirm}
                  className="w-full bg-[#1a3a6b] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1a3a6b]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Speichert…</> : <><Shield className="h-4 w-4" /> Passwort festlegen</>}
                </button>
              </form>
            )}

            {success && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-700 text-sm">Passwort gesetzt!</p>
                    <p className="text-green-600 text-xs mt-0.5">{success}</p>
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
