import { useState, useEffect, useRef } from "react";
import { Shield, Eye, EyeOff, Smartphone, AlertCircle, CheckCircle2, Link2, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/use-app-store";

const BASE = import.meta.env.VITE_API_URL || "/api";

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
  // Registrierungscode-Flow (Standardmethode)
  const [shortCode, setShortCode] = useState("");
  const [codeDeviceName, setCodeDeviceName] = useState("");
  const [codeHint, setCodeHint] = useState<string | null>(null);

  // Master-Passwort-Flow (Notfall, eingeklappt)
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordDeviceName, setPasswordDeviceName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registrierungslink-Flow (URL-Parameter)
  const [regKey, setRegKey] = useState<string | null>(null);
  const [regKeyValid, setRegKeyValid] = useState<boolean | null>(null);
  const [regKeyChecking, setRegKeyChecking] = useState(false);
  const [regKeyError, setRegKeyError] = useState<string | null>(null);
  const [linkDeviceName, setLinkDeviceName] = useState("");

  // Gemeinsam
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
    } else {
      // Kein Link – direkt Code-Input fokussieren
      setTimeout(() => codeInputRef.current?.focus(), 300);
    }
  }, []);

  // Registrierung via Registrierungscode
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
      let data: { authorized?: boolean; token?: string; error?: string; detail?: string; pgCode?: string; constraint?: string; hint?: string; column?: string; table?: string } = {};
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        setError(`Server-Antwort unlesbar (HTTP ${res.status}): ${text.slice(0, 200) || "leer"}`);
        return;
      }
      if (data.authorized && data.token) {
        setSuccess(true);
        finishRegistration(data.token, setDeviceToken, setDeviceAuthorized);
      } else {
        const parts = [data.error || `HTTP ${res.status}`];
        if (data.detail) parts.push(`Detail: ${data.detail}`);
        if (data.constraint) parts.push(`Constraint: ${data.constraint}`);
        if (data.column) parts.push(`Spalte: ${data.column}`);
        if (data.table) parts.push(`Tabelle: ${data.table}`);
        if (data.hint) parts.push(`Hinweis: ${data.hint}`);
        if (data.pgCode) parts.push(`(${data.pgCode})`);
        setError(parts.join(" — "));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Netzwerk-Fehler: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Code-Eingabe: live validieren nach 6 Zeichen
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
        // Live-Validierung: Netzwerkfehler ignorieren
      }
    }
  };

  // Registrierung via Master-Passwort
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !passwordDeviceName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/device/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, name: passwordDeviceName.trim() }),
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
      let data: { authorized?: boolean; token?: string; error?: string; detail?: string; pgCode?: string; constraint?: string; hint?: string; column?: string; table?: string } = {};
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        setError(`Server-Antwort unlesbar (HTTP ${res.status}): ${text.slice(0, 200) || "leer"}`);
        return;
      }
      if (data.authorized && data.token) {
        setSuccess(true);
        finishRegistration(data.token, setDeviceToken, setDeviceAuthorized);
      } else {
        const parts = [data.error || `HTTP ${res.status}`];
        if (data.detail) parts.push(`Detail: ${data.detail}`);
        if (data.constraint) parts.push(`Constraint: ${data.constraint}`);
        if (data.column) parts.push(`Spalte: ${data.column}`);
        if (data.table) parts.push(`Tabelle: ${data.table}`);
        if (data.hint) parts.push(`Hinweis: ${data.hint}`);
        if (data.pgCode) parts.push(`(${data.pgCode})`);
        setError(parts.join(" — "));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Netzwerk-Fehler: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isLinkFlow = regKey !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2444] via-[#1a3a6b] to-[#2d5aa0] p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="w-full max-w-sm py-8"
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
              ? "Registrierungslink erkannt. Gerätename bestätigen."
              : isLinkFlow && regKeyValid === false
              ? regKeyError || "Ungültiger Link."
              : "Geben Sie den Registrierungscode ein, den Sie vom Administrator erhalten haben."}
          </p>
        </div>

        {!success && !regKeyChecking && (
          <div className="space-y-3">
            {/* ===== LINK-FLOW: URL-Link erkannt und gültig ===== */}
            {isLinkFlow && regKeyValid === true && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                </div>
                {error && <ErrorBox message={error} />}
                <button
                  type="submit"
                  disabled={isLoading || !linkDeviceName.trim()}
                  className="w-full bg-white text-[#1a3a6b] font-bold rounded-xl py-3 text-sm hover:bg-blue-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading
                    ? <div className="w-5 h-5 border-2 border-[#1a3a6b]/30 border-t-[#1a3a6b] rounded-full animate-spin" />
                    : <><CheckCircle2 className="w-4 h-4" />Gerät jetzt registrieren</>
                  }
                </button>
                <button
                  type="button"
                  onClick={() => { setRegKey(null); setRegKeyValid(null); setRegKeyError(null); setError(null); }}
                  className="w-full text-xs text-blue-400/70 hover:text-blue-300 mt-3 transition"
                >
                  Stattdessen Code eingeben
                </button>
              </motion.form>
            )}

            {/* ===== UNGÜLTIGER LINK → Hinweis + weiter zu Code-Eingabe ===== */}
            {isLinkFlow && regKeyValid === false && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 text-center"
              >
                <AlertCircle className="w-6 h-6 text-red-300 mx-auto mb-2" />
                <p className="text-red-200 text-sm">{regKeyError}</p>
                <button
                  onClick={() => { setRegKey(null); setRegKeyValid(null); setRegKeyError(null); setError(null); }}
                  className="mt-3 text-xs text-blue-300 underline hover:text-white transition"
                >
                  Weiter zur Code-Eingabe
                </button>
              </motion.div>
            )}

            {/* ===== STANDARD: Code-Eingabe (Hauptmethode) ===== */}
            {(!isLinkFlow || regKeyValid === false) && (
              <>
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  onSubmit={handleCodeSubmit}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-2xl"
                >
                  {/* Großes Code-Eingabefeld */}
                  <div className="mb-4">
                    <label className="block text-xs text-blue-300 font-medium mb-1.5 uppercase tracking-wide">Registrierungscode</label>
                    <input
                      ref={codeInputRef}
                      type="text"
                      value={shortCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="• • • • • •"
                      maxLength={6}
                      autoCapitalize="characters"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-white/20 rounded-xl px-4 py-4 text-3xl font-black tracking-[0.45em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                    {codeHint && (
                      <p className="text-green-300 text-xs mt-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Code erkannt{codeHint ? ` – ${codeHint}` : ""}
                      </p>
                    )}
                    {shortCode.length > 0 && shortCode.length < 6 && (
                      <p className="text-blue-300/60 text-xs mt-1.5 text-center">{6 - shortCode.length} Zeichen noch</p>
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

                  {error && !showPasswordForm && <ErrorBox message={error} />}

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

                {/* Notfall-Master-Passwort (eingeklappt) */}
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setShowPasswordForm(!showPasswordForm); setError(null); }}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-blue-300/70 hover:text-blue-200 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      Notfall: Mit Master-Passwort registrieren
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPasswordForm ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showPasswordForm && (
                      <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handlePasswordSubmit}
                        className="px-4 pb-4 overflow-hidden"
                      >
                        <div className="pt-2 border-t border-white/10 space-y-3">
                          <div>
                            <label className="block text-xs text-blue-300 font-medium mb-1.5">Gerätename</label>
                            <input
                              type="text"
                              value={passwordDeviceName}
                              onChange={(e) => { setPasswordDeviceName(e.target.value); setError(null); }}
                              placeholder="z.B. iPad Metzgerei, Tablet Büro"
                              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                            />
                          </div>
                          <div className="relative">
                            <label className="block text-xs text-blue-300 font-medium mb-1.5">Master-Passwort</label>
                            <input
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => { setPassword(e.target.value); setError(null); }}
                              placeholder="••••••••••••"
                              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 bottom-2.5 text-white/50 hover:text-white transition"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {error && showPasswordForm && <ErrorBox message={error} />}
                          <button
                            type="submit"
                            disabled={isLoading || !password.trim() || !passwordDeviceName.trim()}
                            className="w-full bg-white/20 text-white font-bold rounded-xl py-2.5 text-sm hover:bg-white/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isLoading
                              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              : <><Shield className="w-3.5 h-3.5" />Gerät freigeben</>
                            }
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
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
