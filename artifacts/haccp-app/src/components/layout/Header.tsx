import { useListMarkets } from "@workspace/api-client-react";
import { useAppStore } from "@/store/use-app-store";
import { MapPin, Bell, LogIn, LogOut, Shield, Settings, Menu } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { data: markets, isLoading } = useListMarkets();
  const { selectedMarketId, setSelectedMarketId, adminSession, setAdminSession } = useAppStore();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (markets?.length && !selectedMarketId) {
      setSelectedMarketId(markets[0].id);
    }
  }, [markets, selectedMarketId, setSelectedMarketId]);

  const isLoggedIn = !!adminSession;

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-border/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors -ml-1"
        >
          <Menu className="h-5 w-5" />
        </button>

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
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <select
              value={selectedMarketId || ""}
              onChange={(e) => setSelectedMarketId(Number(e.target.value))}
              disabled={isLoading || !markets?.length}
              className="appearance-none bg-secondary/50 hover:bg-secondary border border-border/50 text-foreground text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 cursor-pointer disabled:opacity-50 max-w-[160px] sm:max-w-none"
            >
              <option value="" disabled>Filiale...</option>
              {markets?.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.name} ({market.code})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center pointer-events-none text-muted-foreground">
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button className="relative p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors hidden sm:flex">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-white"></span>
          </button>
          
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
              {(adminSession.role === "SUPERADMIN") && (
                <button
                  onClick={() => navigate("/admin/users")}
                  className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                  title="Benutzerverwaltung"
                >
                  <Settings className="h-4 w-4" />
                </button>
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
