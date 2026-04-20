import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useState, useEffect } from "react";
import { Shield, UserPlus, Eye, EyeOff, AlertTriangle, Check, Loader2 } from "lucide-react";
import { useLocation, useSearch } from "wouter";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function AdminRegister() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") || "";

  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { setAdminSession } = useAppStore();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!token) {
      setInviteValid(false);
      setInviteError("Kein Einladungstoken angegeben.");
      return;
    }

    fetch(`${API_BASE}/admin/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setInviteValid(true);
          setInviteEmail(data.email);
          setEmail(data.email);
        } else {
          setInviteValid(false);
          setInviteError(data.error || "Einladung ungültig.");
        }
      })
      .catch(() => {
        setInviteValid(false);
        setInviteError("Verbindungsfehler.");
      });
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !email || !password) {
      setError("Bitte füllen Sie alle Felder aus.");
      return;
    }

    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, firstName, lastName, email, password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Registrierung fehlgeschlagen.");
        return;
      }

      setSuccess(true);
      setAdminSession({
        userId: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      });

      setTimeout(() => navigate("/"), 2000);
    } catch {
      setError("Verbindungsfehler.");
    } finally {
      setLoading(false);
    }
  };

  if (inviteValid === null) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto mt-20 p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Einladung wird geprüft...</p>
        </div>
      </AppLayout>
    );
  }

  if (!inviteValid) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl border border-border/60 shadow-sm text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Einladung ungültig</h2>
          <p className="text-muted-foreground text-sm">{inviteError}</p>
        </div>
      </AppLayout>
    );
  }

  if (success) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl border border-border/60 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Registrierung erfolgreich!</h2>
          <p className="text-muted-foreground text-sm">Sie werden zum Dashboard weitergeleitet...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="bg-[#1a3a6b] text-white px-6 py-4 flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-bold">Admin Registrierung</h2>
              <p className="text-sm text-white/70">Einladung für {inviteEmail}</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Vorname</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Nachname</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">E-Mail</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Passwort (min. 6 Zeichen)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Passwort bestätigen</label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a3a6b] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1a3a6b]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? "Registrierung..." : "Als Admin registrieren"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
