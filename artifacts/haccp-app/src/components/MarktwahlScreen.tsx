import { useEffect, useState } from "react";
import { useListMarkets } from "@workspace/api-client-react";
import { useAppStore } from "@/store/use-app-store";
import {
  MapPin, Lock, Store, ChevronRight, Navigation, AlertCircle,
  CheckCircle2, Loader2, NavigationOff, Info, Shield, Eye, EyeOff,
  LogIn, LogOut, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGeolocation,
  findNearestMarket,
  getDistanceKm,
  type MarketWithGeo,
} from "@/hooks/useGeolocation";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const MARKET_COLORS: Record<string, { bg: string; border: string; text: string; icon: string; activeBorder: string }> = {
  LEE: { bg: "bg-blue-50", border: "border-blue-200 hover:border-blue-400", activeBorder: "border-blue-500 ring-2 ring-blue-300", text: "text-blue-700", icon: "bg-blue-100 text-blue-600" },
  BUC: { bg: "bg-emerald-50", border: "border-emerald-200 hover:border-emerald-400", activeBorder: "border-emerald-500 ring-2 ring-emerald-300", text: "text-emerald-700", icon: "bg-emerald-100 text-emerald-600" },
  MOD: { bg: "bg-violet-50", border: "border-violet-200 hover:border-violet-400", activeBorder: "border-violet-500 ring-2 ring-violet-300", text: "text-violet-700", icon: "bg-violet-100 text-violet-600" },
};

function getMarketColor(code: string) {
  return MARKET_COLORS[code] || MARKET_COLORS["LEE"];
}

export function MarktwahlScreen() {
  const { data: markets, isLoading: marketsLoading, isError: marketsError, refetch: refetchMarkets } = useListMarkets();
  const { adminSession, setAdminSession, setSelectedMarketId, setMarketSelectionMode, canAccessMarket, isGpsLocked } = useAppStore();
  const { position, status: geoStatus, error: geoError, request: requestGeo } = useGeolocation();

  const [detectedMarketId, setDetectedMarketId] = useState<number | null>(null);
  const [detectedDistance, setDetectedDistance] = useState<number | null>(null);
  const [outsideAllMarkets, setOutsideAllMarkets] = useState(false);
  const [gpsInitialized, setGpsInitialized] = useState(false);

  const [marketsRetryCountdown, setMarketsRetryCountdown] = useState<number | null>(null);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      const resp = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setLoginError(data.error || "Anmeldung fehlgeschlagen.");
      } else {
        setAdminSession({
          userId: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          assignedMarketIds: data.assignedMarketIds || [],
          permissions: data.permissions || [],
        });
        setLoginSuccess(true);
        setLoginEmail("");
        setLoginPassword("");
        setTimeout(() => {
          setLoginSuccess(false);
          setShowAdminLogin(false);
        }, 1200);
      }
    } catch {
      setLoginError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Auto-Retry wenn Märkte nicht laden
  useEffect(() => {
    if (!marketsError) {
      setMarketsRetryCountdown(null);
      return;
    }
    setMarketsRetryCountdown(15);
    const interval = setInterval(() => {
      setMarketsRetryCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          refetchMarkets();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [marketsError, refetchMarkets]);

  // GPS-Sperre direkt von adminSession ableiten (nicht über isGpsLocked() damit es immer reaktiv ist)
  const gpsLocked = !adminSession;
  const isMarktleiter = adminSession?.role === "MARKTLEITER";

  useEffect(() => {
    requestGeo();
  }, [requestGeo]);

  useEffect(() => {
    if (position && Array.isArray(markets) && markets.length > 0) {
      const geoMarkets = markets as MarketWithGeo[];
      const nearest = findNearestMarket(position, geoMarkets);
      if (nearest) {
        setDetectedMarketId(nearest.market.id);
        setDetectedDistance(nearest.distanceKm);
        setOutsideAllMarkets(false);
        // GPS-Auto-Auswahl: Wenn kein Admin angemeldet ist, automatisch den erkannten Markt wählen
        if (!adminSession && canAccessMarket(nearest.market.id)) {
          setSelectedMarketId(nearest.market.id);
          setMarketSelectionMode("gps");
        }
      } else {
        setDetectedMarketId(null);
        setDetectedDistance(null);
        setOutsideAllMarkets(true);
      }
      setGpsInitialized(true);
    } else if (geoStatus === "denied" || geoStatus === "unavailable" || geoStatus === "error") {
      setGpsInitialized(true);
    }
  }, [position, markets, geoStatus, adminSession, canAccessMarket, setSelectedMarketId, setMarketSelectionMode]);

  // Fallback: wenn keine Filiale GPS-Koordinaten hat, GPS-Sperre aufheben (Konfigurationsfehler)
  const noMarketsHaveGps =
    Array.isArray(markets) &&
    markets.length > 0 &&
    (markets as MarketWithGeo[]).every((m) => !m.lat || !m.lng);
  const gpsConfigMissing = gpsLocked && noMarketsHaveGps;

  const handleSelect = (marketId: number, isGpsDetected: boolean) => {
    if (gpsLocked) {
      if (!gpsConfigMissing && marketId !== detectedMarketId) return;
      if (!canAccessMarket(marketId)) return;
    } else {
      if (!canAccessMarket(marketId)) return;
    }
    setSelectedMarketId(marketId);
    setMarketSelectionMode(isGpsDetected ? "gps" : "manual");
  };

  const canSelectMarket = (marketId: number): boolean => {
    if (!canAccessMarket(marketId)) return false;
    if (gpsLocked) {
      if (gpsConfigMissing) return true;
      if (geoStatus === "denied" || geoStatus === "unavailable" || geoStatus === "error") return false;
      if (geoStatus === "requesting" || !gpsInitialized) return false;
      return marketId === detectedMarketId;
    }
    return true;
  };

  const getMarketDistanceKm = (market: MarketWithGeo): number | null => {
    if (!position || !market.lat || !market.lng) return null;
    const lat = parseFloat(market.lat);
    const lng = parseFloat(market.lng);
    if (isNaN(lat) || isNaN(lng)) return null;
    return getDistanceKm(position.lat, position.lng, lat, lng);
  };

  const renderGpsStatus = () => {
    if (geoStatus === "requesting") {
      return (
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 text-blue-200 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Standort wird ermittelt…
        </div>
      );
    }
    if (geoStatus === "granted" && detectedMarketId) {
      const market = markets?.find((m) => m.id === detectedMarketId);
      return (
        <div className="flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-2.5 text-green-200 text-sm">
          <CheckCircle2 className="w-4 h-4 text-green-300" />
          <span>
            GPS erkannt: <strong>{market?.name}</strong>
            {detectedDistance !== null && (
              <span className="text-green-300/70 ml-1">({detectedDistance.toFixed(1)} km)</span>
            )}
          </span>
        </div>
      );
    }
    if (geoStatus === "granted" && outsideAllMarkets) {
      return (
        <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-2.5 text-amber-200 text-sm">
          <NavigationOff className="w-4 h-4 text-amber-300" />
          Kein Markt in Reichweite erkannt (10 km Radius)
        </div>
      );
    }
    if (geoStatus === "denied") {
      return (
        <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2.5 text-red-200 text-sm">
          <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
          <span>GPS-Zugriff verweigert – bitte in den Browser-Einstellungen aktivieren</span>
        </div>
      );
    }
    if (geoStatus === "unavailable" || geoStatus === "error") {
      return (
        <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 rounded-xl px-4 py-2.5 text-orange-200 text-sm">
          <NavigationOff className="w-4 h-4 text-orange-300" />
          GPS nicht verfügbar
        </div>
      );
    }
    return null;
  };

  const showGpsLockedWarning =
    gpsLocked &&
    !gpsConfigMissing &&
    gpsInitialized &&
    (geoStatus === "denied" || geoStatus === "unavailable" || geoStatus === "error" || outsideAllMarkets);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#0f2444] via-[#1a3a6b] to-[#2d5aa0] overflow-y-auto"
      >
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center mb-8 sm:mb-10"
          >
            <img
              src={import.meta.env.BASE_URL + "dallmann-logo.png"}
              alt="DALLMANN EDEKA"
              className="h-16 sm:h-20 w-auto object-contain mb-5 drop-shadow-lg"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
              Willkommen zurück
            </h1>
            <p className="text-blue-200 text-sm sm:text-base text-center max-w-md">
              {adminSession
                ? `Angemeldet als ${adminSession.name} · ${adminSession.role}`
                : "Bitte wählen Sie Ihre Filiale, in der Sie heute arbeiten."}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {(isMarktleiter || !adminSession) && (
                <div className="bg-white/10 text-blue-100 text-xs px-4 py-1.5 rounded-full flex items-center gap-1.5">
                  <Navigation className="w-3 h-3" />
                  GPS-gesicherter Zugriff aktiv
                </div>
              )}
              {isMarktleiter && (
                <div className="bg-white/10 text-blue-100 text-xs px-4 py-1.5 rounded-full flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Auf zugewiesene Filialen beschränkt
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            {renderGpsStatus()}
          </motion.div>

          {showGpsLockedWarning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl mb-6 bg-red-500/20 border border-red-400/30 rounded-2xl p-5 text-center"
            >
              <AlertCircle className="w-8 h-8 text-red-300 mx-auto mb-2" />
              <p className="text-red-100 font-semibold mb-1">
                {outsideAllMarkets ? "Nicht in Reichweite" : "Standortzugriff erforderlich"}
              </p>
              {outsideAllMarkets ? (
                <p className="text-red-200 text-sm">
                  Sie befinden sich nicht in der Nähe einer EDEKA DALLMANN Filiale (10 km Radius).
                </p>
              ) : geoStatus === "denied" ? (
                <div className="text-red-200 text-sm space-y-1">
                  <p>Der Standortzugriff wurde vom Browser blockiert.</p>
                  <p className="text-red-300/80 text-xs mt-1">
                    <strong>iPhone/iPad:</strong> Einstellungen → Safari → Datenschutz & Sicherheit → Standort → „Fragen"<br />
                    <strong>Android:</strong> Browser-Einstellungen → Website-Einstellungen → Standort → erlauben
                  </p>
                </div>
              ) : (
                <p className="text-red-200 text-sm">
                  GPS-Ortung ist nicht verfügbar. Bitte prüfen Sie Ihre Einstellungen.
                </p>
              )}
              <p className="text-blue-300 text-xs mt-3 border-t border-white/10 pt-3">
                Mit persönlicher Anmeldung können Sie eine Filiale manuell auswählen.
              </p>
              {(geoStatus === "error" || geoStatus === "unavailable") && (
                <button
                  onClick={() => requestGeo()}
                  className="mt-3 bg-red-400/30 hover:bg-red-400/50 text-white text-xs px-4 py-2 rounded-xl transition"
                >
                  Erneut versuchen
                </button>
              )}
            </motion.div>
          )}

          {/* Hinweis für angemeldete Nutzer wenn GPS ein Problem hat */}
          {adminSession && !gpsLocked && (outsideAllMarkets || geoStatus === "denied" || geoStatus === "unavailable" || geoStatus === "error") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl mb-6 bg-blue-500/20 border border-blue-400/30 rounded-2xl p-4 flex items-start gap-3 text-left"
            >
              <Info className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-100 font-semibold text-sm">Manuelle Filialauswahl aktiv</p>
                <p className="text-blue-200 text-xs mt-0.5">
                  Als angemeldeter Nutzer können Sie die Filiale unabhängig vom GPS-Standort auswählen.
                </p>
              </div>
            </motion.div>
          )}

          {gpsConfigMissing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl mb-6 bg-amber-500/20 border border-amber-400/30 rounded-2xl p-5 text-center"
            >
              <AlertCircle className="w-8 h-8 text-amber-300 mx-auto mb-2" />
              <p className="text-amber-100 font-semibold mb-1">GPS-Koordinaten nicht konfiguriert</p>
              <p className="text-amber-200 text-sm">
                Für diesen Server sind noch keine GPS-Koordinaten hinterlegt. Manuelle Auswahl ist aktiv — bitte im Admin-Bereich die Filial-Koordinaten eintragen.
              </p>
            </motion.div>
          )}

          {!gpsLocked && detectedMarketId && geoStatus === "granted" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="w-full max-w-2xl mb-4 bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center gap-3"
            >
              <Info className="w-4 h-4 text-blue-300 shrink-0" />
              <p className="text-blue-200 text-xs">
                GPS hat Ihren Standort erkannt. Sie können den vorgeschlagenen Markt wählen oder manuell eine Filiale auswählen.
              </p>
            </motion.div>
          )}

          <div className="w-full max-w-2xl">
            <p className="text-blue-300 text-xs uppercase tracking-widest font-bold mb-4 text-center">
              Filiale auswählen
            </p>

            {marketsLoading || (!markets && !marketsError) ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 rounded-2xl bg-white/10 animate-pulse" />
                ))}
              </div>
            ) : marketsError || !markets || (Array.isArray(markets) && markets.length === 0) ? (
              <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/10 p-6">
                <AlertCircle className="w-8 h-8 text-red-300 mx-auto mb-3" />
                <p className="text-red-200 font-semibold mb-1">Filialdaten konnten nicht geladen werden</p>
                <p className="text-blue-300/70 text-xs mb-4">
                  {marketsRetryCountdown !== null
                    ? `Automatischer Neuversuch in ${marketsRetryCountdown} Sekunden…`
                    : "Verbindung zum Server wird hergestellt…"}
                </p>
                <button
                  onClick={() => { setMarketsRetryCountdown(null); refetchMarkets(); }}
                  className="bg-white/15 hover:bg-white/25 text-white text-sm px-5 py-2.5 rounded-xl transition font-medium"
                >
                  Jetzt erneut laden
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(Array.isArray(markets) ? markets : []).map((market, idx) => {
                  const selectable = canSelectMarket(market.id);
                  const isDetected = market.id === detectedMarketId;
                  const colors = getMarketColor(market.code);
                  const distanceKm = getMarketDistanceKm(market as MarketWithGeo);
                  const isLoading = geoStatus === "requesting" && gpsLocked;

                  return (
                    <motion.button
                      key={market.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + idx * 0.08 }}
                      onClick={() => selectable && handleSelect(market.id, isDetected)}
                      disabled={!selectable || isLoading}
                      className={`
                        relative group flex flex-col items-center justify-center
                        bg-white rounded-2xl border-2 p-6 sm:p-8
                        transition-all duration-200 text-center
                        ${selectable && !isLoading
                          ? `cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.99] ${isDetected ? colors.activeBorder : colors.border}`
                          : "opacity-40 cursor-not-allowed border-white/20 bg-white/20"
                        }
                        ${isDetected && geoStatus === "granted" ? "shadow-lg" : ""}
                      `}
                    >
                      {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/50">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                      ) : !selectable && !isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/20">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      ) : null}

                      {isDetected && geoStatus === "granted" && selectable && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <div className={`${colors.text} ${colors.bg} text-xs font-bold px-3 py-1 rounded-full border ${colors.activeBorder.split(" ")[0]} flex items-center gap-1 shadow`}>
                            <Navigation className="w-3 h-3" />
                            GPS erkannt
                          </div>
                        </div>
                      )}

                      <div className={`w-14 h-14 rounded-xl ${selectable ? colors.icon : "bg-gray-200 text-gray-400"} flex items-center justify-center mb-4 ${selectable && !isLoading ? "group-hover:scale-110 transition-transform" : ""}`}>
                        <Store className="w-7 h-7" />
                      </div>

                      <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${selectable ? colors.text : "text-gray-400"}`}>
                        {market.code}
                      </div>
                      <div className={`text-lg font-bold ${selectable ? "text-foreground" : "text-gray-400"}`}>
                        {market.name}
                      </div>

                      {distanceKm !== null && geoStatus === "granted" && selectable && (
                        <div className={`mt-1 text-xs ${colors.text} opacity-70`}>
                          {distanceKm < 1
                            ? `${(distanceKm * 1000).toFixed(0)} m entfernt`
                            : `${distanceKm.toFixed(1)} km entfernt`}
                        </div>
                      )}

                      {selectable && !isLoading && (
                        <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          Auswählen <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {!adminSession && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-blue-300 text-xs text-center max-w-xs"
            >
              Mitarbeiter arbeiten immer in der GPS-erkannten Filiale.
            </motion.p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="px-4 pb-6 flex flex-col items-center gap-3"
        >
          {adminSession ? (
            <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3">
              <Shield className="w-4 h-4 text-blue-300 shrink-0" />
              <div className="text-left">
                <p className="text-white text-sm font-semibold leading-none">{adminSession.name}</p>
                <p className="text-blue-300 text-xs mt-0.5">{adminSession.role} · {adminSession.email}</p>
              </div>
              <button
                onClick={() => setAdminSession(null)}
                className="ml-2 p-1.5 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Abmelden"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm">
              <button
                onClick={() => {
                  setShowAdminLogin(!showAdminLogin);
                  setLoginError(null);
                }}
                className={`w-full flex items-center justify-center gap-2 font-medium py-2.5 transition group rounded-xl ${
                  showGpsLockedWarning
                    ? "bg-white/20 hover:bg-white/30 text-white text-sm border border-white/30 px-4"
                    : "text-blue-300 hover:text-white text-xs"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Persönliche Anmeldung
                {showAdminLogin
                  ? <ChevronUp className="w-3.5 h-3.5" />
                  : <ChevronDown className="w-3.5 h-3.5" />
                }
              </button>

              <AnimatePresence>
                {showAdminLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {loginSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-2 bg-green-500/20 border border-green-400/30 rounded-2xl p-4 flex items-center justify-center gap-2 text-green-200 text-sm font-medium"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-300" />
                        Erfolgreich angemeldet
                      </motion.div>
                    ) : (
                      <form
                        onSubmit={handleAdminLogin}
                        className="mt-2 bg-white/10 border border-white/20 rounded-2xl p-4 space-y-3"
                      >
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => { setLoginEmail(e.target.value); setLoginError(null); }}
                          placeholder="E-Mail-Adresse"
                          autoComplete="email"
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        />
                        <div className="relative">
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={(e) => { setLoginPassword(e.target.value); setLoginError(null); }}
                            placeholder="Passwort"
                            autoComplete="current-password"
                            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {loginError && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-red-300 text-xs bg-red-500/20 rounded-xl px-3 py-2"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {loginError}
                          </motion.div>
                        )}

                        <button
                          type="submit"
                          disabled={loginLoading || !loginEmail || !loginPassword}
                          className="w-full bg-white text-[#1a3a6b] font-bold rounded-xl py-2.5 text-sm hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loginLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <LogIn className="w-4 h-4" />
                              Anmelden
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-blue-400/60 text-xs mt-1">
            <MapPin className="w-3 h-3" />
            EDEKA DALLMANN · Leeder · Buching · MOD
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
