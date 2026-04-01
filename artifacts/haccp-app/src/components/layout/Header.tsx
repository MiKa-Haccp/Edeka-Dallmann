import { useState, useEffect, useCallback } from "react";
import { useListMarkets } from "@workspace/api-client-react";
import { useAppStore } from "@/store/use-app-store";
import { MapPin, LogIn, LogOut, Shield, Settings, Menu, RefreshCw, Navigation, Lock, MessageSquare } from "lucide-react";
import { Link, useLocation } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { data: markets, isLoading } = useListMarkets();
  const {
    selectedMarketId,
    setSelectedMarketId,
    setMarketSelectionMode,
    adminSession,
    setAdminSession,
    canAccessMarket,
    isGpsLocked,
    marketSelectionMode,
  } = useAppStore();
  const [, navigate] = useLocation();
  const [unreadFeedback, setUnreadFeedback] = useState(0);

  const isSuperAdmin = adminSession?.role === "SUPERADMIN";

  const pollUnread = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`${BASE}/feedback/unread-count`);
      if (res.ok) {
        const { count } = await res.json();
        setUnreadFeedback(count);
      }
    } catch { /* ignore */ }
  }, [isSuperAdmin]);

  useEffect(() => {
    pollUnread();
    const id = setInterval(pollUnread, 60_000);
    return () => clearInterval(id);
  }, [pollUnread]);

  const isLoggedIn = !!adminSession;
  const gpsLocked = isGpsLocked();
  const marketsArray = Array.isArray(markets) ? markets : [];
  const selectedMarket = marketsArray.find((m) => m.id === selectedMarketId);

  const handleMarketChange = (newId: number) => {
    if (gpsLocked) return;
    if (canAccessMarket(newId)) {
      setSelectedMarketId(newId);
      setMarketSelectionMode("manual");
    }
  };

  const handleMarketReset = () => {
    setSelectedMarketId(null);
    setMarketSelectionMode(null);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-border/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors -ml-1"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link href="/" className="flex items-center gap-2 group cursor-pointer mr-2 sm:mr-4 md:mr-8 hover:opacity-80 transition-opacity">
          <img
            src={import.meta.env.BASE_URL + "dallmann-logo.png"}
            alt="DALLMANN EDEKA Logo"
            className="h-10 sm:h-12 w-auto object-contain"
            title="DALLMANN EDEKA HACCP Management"
          />
        </Link>

        <div className="h-6 w-px bg-border hidden md:block"></div>

        <div className="flex-1 flex items-center gap-2">
          {selectedMarketId ? (
            <div className="flex items-center gap-2">
              {gpsLocked ? (
                <div className="flex items-center gap-2 bg-secondary/50 border border-border/50 rounded-lg sm:rounded-xl pl-3 pr-3 py-2 sm:py-2.5">
                  {marketSelectionMode === "gps" ? (
                    <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    {selectedMarket?.name ?? "—"}
                  </span>
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                      {marketSelectionMode === "gps" ? (
                        <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                      ) : (
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </div>
                    <select
                      value={selectedMarketId || ""}
                      onChange={(e) => handleMarketChange(Number(e.target.value))}
                      disabled={isLoading || !markets?.length}
                      className="appearance-none bg-secondary/50 hover:bg-secondary border border-border/50 text-foreground text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 cursor-pointer disabled:opacity-50 max-w-[160px] sm:max-w-none"
                    >
                      {markets?.map((market) => (
                        <option key={market.id} value={market.id} disabled={!canAccessMarket(market.id)}>
                          {market.name}{!canAccessMarket(market.id) ? " 🔒" : ""}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center pointer-events-none text-muted-foreground">
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={handleMarketReset}
                    className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors hidden sm:flex"
                    title="Filiale wechseln"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </>
              )}

              {marketSelectionMode === "gps" && (
                <div className="hidden md:flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
                  <Navigation className="h-2.5 w-2.5" />
                  GPS
                </div>
              )}
              {marketSelectionMode === "manual" && !gpsLocked && (
                <div className="hidden md:flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full">
                  <MapPin className="h-2.5 w-2.5" />
                  manuell
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="hidden sm:block">Filiale auswählen...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="h-8 w-px bg-border hidden sm:block"></div>

          {isLoggedIn ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 border border-blue-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
                <span className="text-[10px] sm:text-xs font-semibold text-blue-700 hidden sm:block max-w-[100px] truncate">{adminSession.name}</span>
                <span className="text-[9px] sm:text-[10px] bg-blue-200 text-blue-800 px-1 sm:px-1.5 py-0.5 rounded-full font-bold hidden md:block">
                  {adminSession.role}
                </span>
              </div>
              {(adminSession.role === "SUPERADMIN" || (adminSession.permissions || []).includes("settings.manage")) && (
                <>
                  {adminSession.role === "SUPERADMIN" && (
                    <button
                      onClick={() => { navigate("/admin/feedback"); setUnreadFeedback(0); }}
                      className={`p-1.5 sm:p-2 rounded-full transition-colors relative ${unreadFeedback > 0 ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-muted-foreground hover:text-red-500 hover:bg-red-50"}`}
                      title={unreadFeedback > 0 ? `${unreadFeedback} neues Feedback` : "Feedback-Einträge"}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {unreadFeedback > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                          {unreadFeedback > 9 ? "9+" : unreadFeedback}
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/admin/system")}
                    className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                    title="Systemverwaltung"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setAdminSession(null);
                  navigate("/");
                }}
                className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                title="Abmelden"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/admin/login")}
              className="flex items-center gap-1.5 sm:gap-2 hover:bg-secondary p-1 sm:pr-3 rounded-full transition-colors border border-transparent hover:border-border"
            >
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:block">Admin Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
