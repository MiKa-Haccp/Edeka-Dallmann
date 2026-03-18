import { useState } from "react";
import { Shield, Eye, EyeOff, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/use-app-store";

export function GeraetSperrScreen() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const setDeviceAuthorized = useAppStore((s) => s.setDeviceAuthorized);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(import.meta.env.BASE_URL + "api/device/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.authorized) {
        setSuccess(true);
        setTimeout(() => {
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
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-xl ${success ? "bg-green-500" : "bg-white/10 backdrop-blur-sm border border-white/20"}`}
          >
            {success ? (
              <CheckCircle2 className="w-10 h-10 text-white" />
            ) : (
              <Smartphone className="w-10 h-10 text-white" />
            )}
          </motion.div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            {success ? "Gerät freigegeben" : "Gerät nicht autorisiert"}
          </h1>
          <p className="text-blue-200 text-sm text-center max-w-xs">
            {success
              ? "Dieses Gerät ist jetzt für EDEKA DALLMANN HACCP autorisiert."
              : "Dieses Gerät wurde noch nicht für die HACCP-App freigegeben. Bitte geben Sie das Master-Passwort ein."}
          </p>
        </div>

        {!success && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onSubmit={handleSubmit}
            className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-4 h-4 text-blue-300" />
              <span className="text-blue-200 text-sm font-medium">Master-Passwort eingeben</span>
            </div>

            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••••••"
                autoFocus
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
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
              disabled={isLoading || !password.trim()}
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
