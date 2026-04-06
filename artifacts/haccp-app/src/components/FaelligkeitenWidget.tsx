import { useEffect, useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { AlertCircle, Bell, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

const MARKET_NAMES: Record<number, string> = { 1: "Leeder", 2: "Buching", 3: "Marktoberdorf" };

const SECTION_HREFS: Record<string, string> = {
  "1.1": "/responsibilities", "1.4": "/training-records", "1.5": "/annual-cleaning-plan",
  "1.6": "/betriebsbegehung", "2.1": "/wareneingaenge", "2.2": "/warencheck-og",
  "2.3": "/reinigung-taeglich", "3.1": "/metzgerei-wareneingaenge", "3.2": "/reinigungsplan-metzgerei",
  "3.3": "/oeffnung-salate", "3.4": "/kaesetheke-kontrolle", "3.8": "/gq-begehung",
};

interface PendingRuleItem {
  sectionKey: string;
  sectionLabel: string;
  marketId: number;
  triggered: boolean;
  reason: string;
}

interface FaelligkeitItem {
  label: string;
  detail: string;
  href: string;
  marketName?: string;
}

export function FaelligkeitenWidget() {
  const { adminSession, selectedMarketId } = useAppStore();
  const [items, setItems] = useState<FaelligkeitItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!adminSession?.userId) { setItems([]); setLoaded(true); return; }
    const url = `${BASE}/notifications/my-pending?userId=${adminSession.userId}${selectedMarketId ? `&marketId=${selectedMarketId}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data: PendingRuleItem[]) => {
        if (!Array.isArray(data)) return;
        const triggered = data
          .filter((d) => d.triggered)
          .map((d) => ({
            label: d.sectionLabel,
            detail: d.reason,
            href: SECTION_HREFS[d.sectionKey] ?? "/haccp",
            marketName: MARKET_NAMES[d.marketId],
          }));
        setItems(triggered);
      })
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, [adminSession?.userId, selectedMarketId]);

  if (!adminSession || !loaded || items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-100">
            <Bell className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Fälligkeiten &amp; Erinnerungen</h2>
        </div>
        <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
          {items.length} ausstehend
        </span>
      </div>

      <div className="divide-y divide-border/30">
        {items.map((item, idx) => (
          <Link
            key={`${item.href}-${idx}`}
            href={item.href}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors group"
          >
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{item.label}</span>
                {item.marketName && (
                  <span className="text-xs text-muted-foreground font-medium">· {item.marketName}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      <div className="px-5 py-3 bg-muted/20 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Stand {new Date().toLocaleDateString("de-DE")} · basierend auf deinen Benachrichtigungsregeln
        </p>
      </div>
    </div>
  );
}
