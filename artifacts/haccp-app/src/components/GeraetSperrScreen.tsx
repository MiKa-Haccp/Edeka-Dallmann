import { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, Smartphone, AlertCircle, CheckCircle2, Link2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/use-app-store";

const BASE = import.meta.env.VITE_API_URL || "/api";

export function GeraetSperrScreen() {
  const [password, setPassword] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Registrierungslink-Flow
  const [regKey, setRegKey] = useState<string | null>(null);
  const [regKeyValid, setRegKeyValid] = useState<boolean | null>(null);
  const [regKeyChecking, setRegKeyChecking] = useState(false);
  const [regKeyError, setRegKeyError] = useState<string | null>(null);

  const { setDeviceToken, setDeviceAuthorized } = useAppStore();

  // Beim Laden: URL auf ?reg_key= prüfen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("reg_key");
    if (key) {
      setRegKey(key);
      setRegKeyChecking(true);
      fetch(`${BASE}/device/reg-link/${key}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.valid) {
            setRegKeyValid(true);
            if (data.deviceNameHint) setDeviceName(data.deviceNameHint);
          } else {
            setRegKeyValid(false);
            setRegKeyError(data.error || "Ungültiger Registrierungslink.");
          }
        })
        .catch(() => {
          setRegKeyValid(false);
          setRegKeyError("Verbindungsfehler beim Prüfen des Links.");
        })
        .finally(() => setRegKeyChecking(false));
    }
  }, []);

  // Registrierung via Passwort (bestehender Flow – unverändert)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !deviceName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE}/device/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, name: deviceName.trim() }),
      });
      const data = await res.json();

      if (data.authorized && data.token) {
        setSuccess(true);
        // URL-Parameter sauber entfernen
        const url = new URL(window.location.href);
        url.searchParams.delete("reg_key");
        window.history.replaceState({}, "", url.toString());
        setTimeout(() => {
          setDeviceToken(data.token);
          setDeviceAuthorized(true);
        }, 800);
      } else {
        setError(data.error || "Falsches Passwort. Bitte wenden Sie sich an den Administrator.");
        setPassword("");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  // Registrierung via Link
  const handleLinkRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regKey || !deviceName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE}/device/use-reg-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: regKey, deviceName: deviceName.trim() }),
      });
      const data = await res.json();

      if (data.authorized && data.token) {
        setSuccess(true);
        // URL-Parameter sauber entfernen
        const url = new URL(window.location.href);
        url.searchParams.delete("reg_key");
        window.history.replaceState({}, "", url.toString());
        setTimeout(() => {
          setDeviceToken(data.token);
          setDeviceAuthorized(true);
        }, 800);
      } else {
        setError(data.error || "Registrierung fehlgeschlagen.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const isLinkFlow = regKey !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2444] via-[#1a3a6b] to-[#2d5aa0] p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <img
            src={import.meta.env.BASE_URL + "dallmann-logo.png"}
            alt="DALLMANN EDEKA"
            className="h-14 w-auto object-contain mb-6 drop-shadow-lg"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-xl ${
              success ? "bg-green-500" : isLinkFlow ? "bg-blue-500/20 backdrop-blur-sm border border-blue-400/30" : "bg-white/10 backdrop-blur-sm border border-white/20"
            }`}
          >
            {success ? (
              <CheckCircle2 className="w-10 h-10 text-white" />
            ) : regKeyChecking ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : isLinkFlow ? (
              <Link2 className="w-10 h-10 text-blue-300" />
            ) : (
              <Smartphone className="w-10 h-10 text-white" />
            )}
          </motion.div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            {success
              ? "Gerät freigeschaltet"
              : regKeyChecking
              ? "Link wird geprüft…"
              : isLinkFlow && regKeyValid
              ? "Gerät registrieren"
              : "Gerät nicht autorisiert"}
          </h1>
          <p className="text-blue-200 text-sm text-center max-w-xs">
            {success
              ? "Dieses Gerät ist jetzt dauerhaft für EDEKA DALLMANN HACCP autorisiert."
              : regKeyChecking
              ? "Registrierungslink wird validiert…"
              : isLinkFlow && regKeyValid
              ? "Registrierungslink erkannt. Gerätename bestätigen und Registrierung abschließen."
              : isLinkFlow && regKeyValid === false
              ? regKeyError || "Ungültiger Link."
              : "Dieses Gerät wurde noch nicht für die HACCP-App freigegeben. Bitte geben Sie das Master-Passwort und einen Gerätenamen ein."}
          </p>
        </div>

        {/* Link-Flow: Ungültiger Link → Fallback auf Passwort-Form */}
        {isLinkFlow && regKeyValid === false && !regKeyChecking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 mb-4 text-center"
          >
            <AlertCircle className="w-6 h-6 text-red-300 mx-auto mb-2" />
            <p className="text-red-200 text-sm">{regKeyError}</p>
            <button
              onClick={() => {
                setRegKey(null);
                setRegKeyValid(null);
                setRegKeyError(null);
              }}
              className="mt-3 text-xs text-blue-300 underline hover:text-white transition"
            >
              Stattdessen mit Master-Passwort registrieren
            </button>
          </motion.div>
        )}

        {!success && !regKeyChecking && (
          <>
            {/* Link-Flow: Gültiger Link → vereinfachtes Formular */}
            {isLinkFlow && regKeyValid === true && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                onSubmit={handleLinkRegister}
                className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Link2 className="w-4 h-4 text-blue-300" />
                  <span className="text-blue-200 text-sm font-medium">Automatische Registrierung via Link</span>
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-blue-300 font-medium mb-1.5">Gerätename</label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => { setDeviceName(e.target.value); setError(null); }}
                    placeholder="z.B. iPad Metzgerei, Tablet Büro"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    autoComplete="off"
                  />
                  <p className="text-blue-300/60 text-xs mt-1">Name kann angepasst werden</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 bg-red-500/20 border border-red-400/30 rounded-xl p-3 mb-4"
                  >
                    <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
                    <p className="text-red-200 text-xs">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !deviceName.trim()}
                  className="w-full bg-white text-[#1a3a6b] font-bold rounded-xl py-3 text-sm hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#1a3a6b]/30 border-t-[#1a3a6b] rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Gerät jetzt registrieren
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRegKey(null);
                    setRegKeyValid(null);
                    setRegKeyError(null);
                  }}
                  className="w-full text-xs text-blue-400/70 hover:text-blue-300 mt-3 transition"
                >
                  Mit Master-Passwort registrieren
                </button>
              </motion.form>
            )}

            {/* Passwort-Flow (Standard, unverändert + Fallback wenn Link ungültig) */}
            {(!isLinkFlow || (isLinkFlow && regKeyValid === false)) && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                onSubmit={handlePasswordSubmit}
                className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Shield className="w-4 h-4 text-blue-300" />
                  <span className="text-blue-200 text-sm font-medium">Gerät registrieren</span>
                </div>

                <div className="mb-3">
                  <label className="block text-xs text-blue-300 font-medium mb-1.5">Gerätename</label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => { setDeviceName(e.target.value); setError(null); }}
                    placeholder="z.B. iPad Metzgerei, Tablet Büro"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  />
                </div>

                <div className="relative mb-4">
                  <label className="block text-xs text-blue-300 font-medium mb-1.5">Master-Passwort</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="••••••••••••"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 bottom-3 text-white/50 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 bg-red-500/20 border border-red-400/30 rounded-xl p-3 mb-4"
                  >
                    <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
                    <p className="text-red-200 text-xs">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !password.trim() || !deviceName.trim()}
                  className="w-full bg-white text-[#1a3a6b] font-bold rounded-xl py-3 text-sm hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#1a3a6b]/30 border-t-[#1a3a6b] rounded-full animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Gerät freigeben
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-blue-400 text-xs mt-6"
        >
          Nur autorisierte Geräte dürfen auf die HACCP-App zugreifen.
          <br />
          Bei Fragen wenden Sie sich an den HACCP-Administrator.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
