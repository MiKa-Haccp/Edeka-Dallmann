import { useEffect, useState } from "react";
import { useListResponsibilities } from "@workspace/api-client-react";
import { useAppStore } from "@/store/use-app-store";
import { CheckCircle2, AlertCircle, Clock, Bell, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

type ItemStatus = "aktuell" | "ausstehend" | "ueberfaellig";

interface FaelligkeitItem {
  label: string;
  status: ItemStatus;
  detail: string;
  href: string;
}

function getCurrentQuartal() {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}

function getQuartalDayProgress() {
  const now = new Date();
  return now.getDate() + (now.getMonth() % 3) * 30;
}

function StatusIcon({ status }: { status: ItemStatus }) {
  if (status === "aktuell") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === "ueberfaellig") return <AlertCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
}

function statusBadge(status: ItemStatus) {
  if (status === "aktuell") return { text: "Aktuell", cls: "bg-green-100 text-green-700" };
  if (status === "ueberfaellig") return { text: "Überfällig", cls: "bg-red-100 text-red-700" };
  return { text: "Ausstehend", cls: "bg-amber-100 text-amber-700" };
}

export function FaelligkeitenWidget() {
  const { adminSession, selectedMarketId } = useAppStore();
  const currentYear = new Date().getFullYear();
  const currentQ = getCurrentQuartal();

  const [bbQuartals, setBbQuartals] = useState<number[]>([]);
  const [bbLoaded, setBbLoaded] = useState(false);

  const { data: currentYearResp } = useListResponsibilities(
    selectedMarketId ?? 0,
    { year: currentYear },
    { query: { enabled: !!selectedMarketId } }
  );

  useEffect(() => {
    fetch(`${BASE}/betriebsbegehung?tenantId=1`)
      .then((r) => r.json())
      .then((data: Array<{ quartal: number; year: number }>) => {
        const done = data
          .filter((r) => r.year === currentYear)
          .map((r) => r.quartal);
        setBbQuartals(done);
        setBbLoaded(true);
      })
      .catch(() => setBbLoaded(true));
  }, [currentYear]);

  if (!adminSession) return null;

  const respStatus: ItemStatus = (() => {
    if (!currentYearResp) return "ausstehend";
    if (currentYearResp.length === 0) return "ueberfaellig";
    return "aktuell";
  })();

  const bbStatus: ItemStatus = (() => {
    if (!bbLoaded) return "ausstehend";
    if (bbQuartals.includes(currentQ)) return "aktuell";
    if (getQuartalDayProgress() > 60) return "ueberfaellig";
    return "ausstehend";
  })();

  const items: FaelligkeitItem[] = [
    {
      label: "Verantwortlichkeiten",
      status: respStatus,
      detail:
        respStatus === "aktuell"
          ? `Einträge für ${currentYear} vorhanden`
          : respStatus === "ueberfaellig"
          ? `Für ${currentYear} noch kein Eintrag — bitte baldmöglich ausfüllen`
          : "Wird geprüft …",
      href: "/category/1/responsibilities",
    },
    {
      label: "Betriebsbegehung",
      status: bbStatus,
      detail:
        bbStatus === "aktuell"
          ? `Q${currentQ}/${currentYear} abgeschlossen`
          : bbStatus === "ueberfaellig"
          ? `Q${currentQ}/${currentYear} überfällig — bitte nachholen`
          : `Q${currentQ}/${currentYear} noch offen`,
      href: "/category/1/betriebsbegehung",
    },
  ];

  const pendingCount = items.filter((i) => i.status !== "aktuell").length;
  const hasIssues = pendingCount > 0;

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              hasIssues ? "bg-amber-100" : "bg-green-100"
            }`}
          >
            <Bell className={`w-4 h-4 ${hasIssues ? "text-amber-600" : "text-green-600"}`} />
          </div>
          <h2 className="text-sm font-bold text-foreground">Fälligkeiten &amp; Erinnerungen</h2>
        </div>
        {hasIssues ? (
          <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
            {pendingCount} ausstehend
          </span>
        ) : (
          <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
            Alles aktuell
          </span>
        )}
      </div>

      <div className="divide-y divide-border/30">
        {items.map((item) => {
          const badge = statusBadge(item.status);
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors group"
            >
              <StatusIcon status={item.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                    {badge.text}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>

      <div className="px-5 py-3 bg-muted/20 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Automatisch geprüft für die aktuelle Filiale ·{" "}
          <span className="font-medium">Stand {new Date().toLocaleDateString("de-DE")}</span>
        </p>
      </div>
    </div>
  );
}
