import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useState } from "react";
import { Shield, LogIn, Eye, EyeOff, AlertTriangle, Check } from "lucide-react";
import { useLocation } from "wouter";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAdminSession, adminSession } = useAppStore();
  const [, navigate] = useLocation();

  if (adminSession) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl border border-border/60 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Angemeldet als Admin</h2>
          <p className="text-muted-foreground text-sm mb-1">{adminSession.name}</p>
          <p className="text-muted-foreground text-xs mb-6">{adminSession.email}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Zum Dashboard
            </button>
            <button
              onClick={() => {
                setAdminSession(null);
                navigate("/");
              }}
              className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Anmeldung fehlgeschlagen.");
        return;
      }

      setAdminSession({
        userId: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      });
      navigate("/");
    } catch {
      setError("Verbindungsfehler.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="bg-[#1a3a6b] text-white px-6 py-5 flex flex-col items-center gap-3">
            <img 
              src={import.meta.env.BASE_URL + "dallmann-logo.png"} 
              alt="DALLMANN EDEKA Logo" 
              className="h-16 w-auto object-contain"
              title="DALLMANN EDEKA HACCP Management"
            />
            <div className="text-center">
              <h2 className="text-lg font-bold">Admin Anmeldung</h2>
              <p className="text-xs text-white/70 mt-1">Nur für autorisierte Administratoren</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="admin@firma.de"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                  placeholder="••••••••"
                  required
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a3a6b] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1a3a6b]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Anmeldung..." : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
