import { useState, useEffect, useRef } from "react";
import { Shield, Eye, EyeOff, Smartphone, AlertCircle, CheckCircle2, Link2, Loader2, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/use-app-store";

const BASE = import.meta.env.VITE_API_URL || "/api";

type Mode = "password" | "code";

function finishRegistration(token: string, setDeviceToken: (t: string) => void, setDeviceAuthorized: (b: boolean) => void) {
  const url = new URL(window.location.href);
  url.searchParams.delete("reg_key");
  window.history.replaceState({}, "", url.toString());
  setTimeout(() => {
    setDeviceToken(token);
    setDeviceAuthorized(true);
  }, 800);
}

export function GeraetSperrScreen() {
  // Master-Passwort-Flow
  const [password, setPassword] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registrierungscode-Flow (manuell eingegeben)
  const [shortCode, setShortCode] = useState("");
  const [codeDeviceName, setCodeDeviceName] = useState("");
  const [codeHint, setCodeHint] = useState<string | null>(null);

  // Registrierungslink-Flow (URL-Parameter)
  const [regKey, setRegKey] = useState<string | null>(null);
  const [regKeyValid, setRegKeyValid] = useState<boolean | null>(null);
  const [regKeyChecking, setRegKeyChecking] = useState(false);
  const [regKeyError, setRegKeyError] = useState<string | null>(null);
  const [linkDeviceName, setLinkDeviceName] = useState("");

  // Gemeinsam
  const [mode, setMode] = useState<Mode>("password");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const codeInputRef = useRef<HTMLInputElement>(null);

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
            if (data.deviceNameHint) setLinkDeviceName(data.deviceNameHint);
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

  // Registrierung via Master-Passwort
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
        finishRegistration(data.token, setDeviceToken, setDeviceAuthorized);
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

  // Registrierung via Registrierungscode (manuell)
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = shortCode.trim().toUpperCase();
    if (!trimmedCode || !codeDeviceName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/device/use-reg-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmedCode, deviceName: codeDeviceName.trim() }),
      });
      const data = await res.json();
      if (data.authorized && data.token) {
        setSuccess(true);
        finishRegistration(data.token, setDeviceToken, setDeviceAuthorized);
      } else {
        setError(data.error || "Registrierung fehlgeschlagen.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  // Code-Eingabe live validieren und Namens-Hint laden (nach 6 Zeichen)
  const handleCodeChange = async (val: string) => {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setShortCode(upper);
    setError(null);
    setCodeHint(null);
    if (upper.length === 6) {
      try {
        const res = await fetch(`${BASE}/device/reg-link-by-code/${upper}`);
        const data = await res.json();
        if (data.valid) {
          setCodeHint(data.deviceNameHint || null);
          if (data.deviceNameHint && !codeDeviceName) setCodeDeviceName(data.deviceNameHint);
        } else {
          setError(data.error || "Ungültiger Code.");
        }
      } catch {
        // Ignore network errors on live validation
      }
    }
  };

  // Registrierung via Link-URL
  const handleLinkRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regKey || !linkDeviceName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/device/use-reg-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: regKey, deviceName: linkDeviceName.trim() }),
      });
      const data = await res.json();
      if (data.authorized && data.token) {
        setSuccess(true);
        finishRegistration(data.token, setDeviceToken, setDeviceAuthorized);
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
        {/* Header */}
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
              success
                ? "bg-green-500"
                : isLinkFlow && regKeyValid
                ? "bg-blue-500/20 backdrop-blur-sm border border-blue-400/30"
                : "bg-white/10 backdrop-blur-sm border border-white/20"
            }`}
          >
            {success ? (
              <CheckCircle2 className="w-10 h-10 text-white" />
            ) : regKeyChecking ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : isLinkFlow && regKeyValid ? (
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
              : "Dieses Gerät wurde noch nicht für die HACCP-App freigegeben."}
          </p>
        </div>

        {!success && !regKeyChecking && (
          <>
            {/* ===== LINK-FLOW: URL-Link erkannt und gültig ===== */}
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
                    value={linkDeviceName}
                    onChange={(e) => { setLinkDeviceName(e.target.value); setError(null); }}
                    placeholder="z.B. iPad Metzgerei, Tablet Büro"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    autoComplete="off"
                  />
                  <p className="text-blue-300/60 text-xs mt-1">Name kann angepasst werden</p>
                </div>
                {error && <ErrorBox message={error} />}
                <button
                  type="submit"
                  disabled={isLoading || !linkDeviceName.trim()}
                  className="w-full bg-white text-[#1a3a6b] font-bold rounded-xl py-3 text-sm hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-[#1a3a6b]/30 border-t-[#1a3a6b] rounded-full animate-spin" /> : <><CheckCircle2 className="w-4 h-4" />Gerät jetzt registrieren</>}
                </button>
                <button
                  type="button"
                  onClick={() => { setRegKey(null); setRegKeyValid(null); setRegKeyError(null); setError(null); }}
                  className="w-full text-xs text-blue-400/70 hover:text-blue-300 mt-3 transition"
                >
                  Stattdessen anders registrieren
                </button>
              </motion.form>
            )}

            {/* ===== UNGÜLTIGER LINK ===== */}
            {isLinkFlow && regKeyValid === false && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 mb-4 text-center"
              >
                <AlertCircle className="w-6 h-6 text-red-300 mx-auto mb-2" />
                <p className="text-red-200 text-sm">{regKeyError}</p>
                <button
                  onClick={() => { setRegKey(null); setRegKeyValid(null); setRegKeyError(null); setError(null); }}
                  className="mt-3 text-xs text-blue-300 underline hover:text-white transition"
                >
                  Weiter zur manuellen Registrierung
                </button>
              </motion.div>
            )}

            {/* ===== STANDARD-FLOW: Kein Link oder Link ungültig ===== */}
            {(!isLinkFlow || regKeyValid === false) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
              >
                {/* Tab-Umschalter */}
                <div className="flex border-b border-white/15">
                  <button
                    type="button"
                    onClick={() => { setMode("password"); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
                      mode === "password"
                        ? "bg-white/15 text-white border-b-2 border-white"
                        : "text-blue-300/70 hover:text-blue-200 hover:bg-white/5"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Master-Passwort
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("code"); setError(null); setTimeout(() => codeInputRef.current?.focus(), 50); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
                      mode === "code"
                        ? "bg-white/15 text-white border-b-2 border-white"
                        : "text-blue-300/70 hover:text-blue-200 hover:bg-white/5"
                    }`}
                  >
                    <Hash className="w-4 h-4" />
                    Code eingeben
                  </button>
                </div>

                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {mode === "password" ? (
                      <motion.form
                        key="password"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.15 }}
                        onSubmit={handlePasswordSubmit}
                      >
                        <div className="mb-3">
                          <label className="block text-xs text-blue-300 font-medium mb-1.5">Gerätename</label>
                          <input
                            type="text"
                            value={deviceName}
                            onChange={(e) => { setDeviceName(e.target.value); setError(null); }}
                            placeholder="z.B. iPad Metzgerei, Tablet Büro"
                            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                          />
                        </div>
                        <div className="relative mb-4">
                          <label className="block text-xs text-blue-300 font-medium mb-1.5">Master-Passwort</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(null); }}
                            placeholder="••••••••••••"
                            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 bottom-3 text-white/50 hover:text-white transition"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {error && <ErrorBox message={error} />}
                        <button
                          type="submit"
                          disabled={isLoading || !password.trim() || !deviceName.trim()}
                          className="w-full bg-white text-[#1a3a6b] font-bold rounded-xl py-3 text-sm hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading
                            ? <div className="w-5 h-5 border-2 border-[#1a3a6b]/30 border-t-[#1a3a6b] rounded-full animate-spin" />
                            : <><Shield className="w-4 h-4" />Gerät freigeben</>
                          }
                        </button>
                      </motion.form>
                    ) : (
                      <motion.form
                        key="code"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.15 }}
                        onSubmit={handleCodeSubmit}
                      >
                        <p className="text-blue-300/80 text-xs mb-4">
                          Geben Sie den 6-stelligen Registrierungscode ein, den Sie vom Administrator erhalten haben.
                        </p>

                        <div className="mb-3">
                          <label className="block text-xs text-blue-300 font-medium mb-1.5">Registrierungscode</label>
                          <input
                            ref={codeInputRef}
                            type="text"
                            value={shortCode}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            placeholder="z.B. AB3X7K"
                            maxLength={6}
                            autoCapitalize="characters"
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-2xl font-bold tracking-[0.3em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                          />
                          {codeHint && (
                            <p className="text-green-300 text-xs mt-1.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />Code erkannt{codeHint ? ` – ${codeHint}` : ""}
                            </p>
                          )}
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs text-blue-300 font-medium mb-1.5">Gerätename</label>
                          <input
                            type="text"
                            value={codeDeviceName}
                            onChange={(e) => { setCodeDeviceName(e.target.value); setError(null); }}
                            placeholder="z.B. iPad Metzgerei, Tablet Büro"
                            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                            autoComplete="off"
                          />
                        </div>

                        {error && <ErrorBox message={error} />}

                        <button
                          type="submit"
                          disabled={isLoading || shortCode.length < 6 || !codeDeviceName.trim()}
                          className="w-full bg-white text-[#1a3a6b] font-bold rounded-xl py-3 text-sm hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading
                            ? <div className="w-5 h-5 border-2 border-[#1a3a6b]/30 border-t-[#1a3a6b] rounded-full animate-spin" />
                            : <><CheckCircle2 className="w-4 h-4" />Gerät registrieren</>
                          }
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
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

function ErrorBox({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 bg-red-500/20 border border-red-400/30 rounded-xl p-3 mb-4"
    >
      <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
      <p className="text-red-200 text-xs">{message}</p>
    </motion.div>
  );
}
