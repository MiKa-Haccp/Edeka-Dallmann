import { useListMarkets } from "@workspace/api-client-react";
import { useAppStore } from "@/store/use-app-store";
import { MapPin, ShieldCheck, User as UserIcon, Bell, LogIn, LogOut, Shield } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

export function Header() {
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
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        <Link href="/" className="flex items-center gap-2 group mr-4 md:mr-8 cursor-pointer">
          <div className="bg-primary/10 p-2 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-display font-bold text-lg leading-tight text-foreground tracking-tight">
              HACCP
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground leading-none">
              Management
            </span>
          </div>
        </Link>

        <div className="h-6 w-px bg-border hidden md:block"></div>

        <div className="flex-1 flex items-center gap-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <MapPin className="h-4 w-4" />
            </div>
            <select
              value={selectedMarketId || ""}
              onChange={(e) => setSelectedMarketId(Number(e.target.value))}
              disabled={isLoading || !markets?.length}
              className="appearance-none bg-secondary/50 hover:bg-secondary border border-border/50 text-foreground text-sm font-semibold rounded-xl pl-10 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              <option value="" disabled>Filiale wählen...</option>
              {markets?.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.name} ({market.code})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-white"></span>
          </button>
          
          <div className="h-8 w-px bg-border"></div>
          
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700 hidden sm:block">{adminSession.name}</span>
                <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full font-bold hidden sm:block">
                  {adminSession.role}
                </span>
              </div>
              <button
                onClick={() => {
                  setAdminSession(null);
                  navigate("/");
                }}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                title="Abmelden"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/admin/login")}
              className="flex items-center gap-2 hover:bg-secondary p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-border"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                <LogIn className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium hidden sm:block">Admin Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
