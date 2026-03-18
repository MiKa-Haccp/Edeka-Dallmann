import { useListMarkets } from "@workspace/api-client-react";
import { useAppStore } from "@/store/use-app-store";
import { MapPin, Lock, Store, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MARKET_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  LEE: { bg: "bg-blue-50", border: "border-blue-200 hover:border-blue-400", text: "text-blue-700", icon: "bg-blue-100 text-blue-600" },
  BUC: { bg: "bg-emerald-50", border: "border-emerald-200 hover:border-emerald-400", text: "text-emerald-700", icon: "bg-emerald-100 text-emerald-600" },
  MOD: { bg: "bg-violet-50", border: "border-violet-200 hover:border-violet-400", text: "text-violet-700", icon: "bg-violet-100 text-violet-600" },
};

function getMarketColor(code: string) {
  return MARKET_COLORS[code] || MARKET_COLORS["LEE"];
}

export function MarktwahlScreen() {
  const { data: markets, isLoading } = useListMarkets();
  const { adminSession, setSelectedMarketId, canAccessMarket } = useAppStore();

  const isMarktleiter = adminSession?.role === "MARKTLEITER";

  const handleSelect = (marketId: number) => {
    if (!canAccessMarket(marketId)) return;
    setSelectedMarketId(marketId);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#0f2444] via-[#1a3a6b] to-[#2d5aa0] min-h-screen"
      >
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center mb-8 sm:mb-12"
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
            {isMarktleiter && (
              <div className="mt-3 bg-white/10 text-blue-100 text-xs px-4 py-1.5 rounded-full flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Ihr Zugriff ist auf zugewiesene Filialen beschränkt
              </div>
            )}
          </motion.div>

          <div className="w-full max-w-2xl">
            <p className="text-blue-300 text-xs uppercase tracking-widest font-bold mb-4 text-center">
              Filiale auswählen
            </p>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 rounded-2xl bg-white/10 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {markets?.map((market, idx) => {
                  const accessible = canAccessMarket(market.id);
                  const colors = getMarketColor(market.code);

                  return (
                    <motion.button
                      key={market.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + idx * 0.08 }}
                      onClick={() => handleSelect(market.id)}
                      disabled={!accessible}
                      className={`
                        relative group flex flex-col items-center justify-center
                        bg-white rounded-2xl border-2 p-6 sm:p-8
                        transition-all duration-200 text-center
                        ${accessible
                          ? `cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.99] ${colors.border}`
                          : "opacity-40 cursor-not-allowed border-white/20 bg-white/20"
                        }
                      `}
                    >
                      {!accessible && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/20">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      )}

                      <div className={`w-14 h-14 rounded-xl ${accessible ? colors.icon : "bg-gray-200 text-gray-400"} flex items-center justify-center mb-4 ${accessible ? "group-hover:scale-110 transition-transform" : ""}`}>
                        <Store className="w-7 h-7" />
                      </div>

                      <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${accessible ? colors.text : "text-gray-400"}`}>
                        {market.code}
                      </div>
                      <div className={`text-lg font-bold ${accessible ? "text-foreground" : "text-gray-400"}`}>
                        {market.name}
                      </div>

                      {accessible && (
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
              className="mt-8 text-blue-300 text-xs text-center"
            >
              Mitarbeiter können in jeder Filiale mit ihrer PIN arbeiten (Aushilfe möglich)
            </motion.p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-blue-400 text-xs">
            <MapPin className="w-3 h-3" />
            EDEKA DALLMANN · Leeder · Buching · MOD
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
