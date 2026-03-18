import { CheckCircle2, AlertTriangle, AlertCircle, Clock, CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";

interface JaehrlicheErinnerungProps {
  lastUpdatedYear?: number | null;
  lastUpdatedDate?: string | Date | null;
  sectionLabel: string;
  renewalMonth?: number;
}

type Status = "aktuell" | "bald-faellig" | "ueberfaellig" | "leer";

function getStatus(
  lastUpdatedYear: number | null | undefined,
  renewalMonth: number
): Status {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (!lastUpdatedYear) return "leer";
  if (lastUpdatedYear < currentYear) return "ueberfaellig";
  if (lastUpdatedYear === currentYear) {
    if (currentMonth >= renewalMonth) return "bald-faellig";
    return "aktuell";
  }
  return "aktuell";
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getDaysInfo(lastUpdatedYear: number | null | undefined): string {
  if (!lastUpdatedYear) return "";
  const now = new Date();
  const currentYear = now.getFullYear();

  if (lastUpdatedYear < currentYear) {
    const overdueSince = new Date(lastUpdatedYear + 1, 0, 1);
    const diffMs = now.getTime() - overdueSince.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Seit heute fällig";
    if (diffDays === 1) return "Seit gestern fällig";
    return `Seit ${diffDays} Tagen fällig`;
  }

  const nextDue = new Date(lastUpdatedYear + 1, 0, 1);
  const diffMs = nextDue.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Erneuerung heute fällig";
  if (diffDays === 1) return "Erneuerung morgen fällig";
  if (diffDays < 60) return `Erneuerung in ${diffDays} Tagen fällig`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Nächste Erneuerung in ca. ${diffMonths} Monat${diffMonths !== 1 ? "en" : ""}`;
}

const CONFIG: Record<
  Status,
  {
    icon: React.ElementType;
    bg: string;
    border: string;
    iconColor: string;
    title: string;
    badge: string;
    badgeBg: string;
  }
> = {
  aktuell: {
    icon: CheckCircle2,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-500",
    title: "Aktuell gültig",
    badge: "Aktuell",
    badgeBg: "bg-green-100 text-green-700",
  },
  "bald-faellig": {
    icon: Clock,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
    title: "Erneuerung in Kürze fällig",
    badge: "Bald fällig",
    badgeBg: "bg-amber-100 text-amber-700",
  },
  ueberfaellig: {
    icon: AlertCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    title: "Erneuerung überfällig",
    badge: "Überfällig",
    badgeBg: "bg-red-100 text-red-700",
  },
  leer: {
    icon: AlertTriangle,
    bg: "bg-gray-50",
    border: "border-gray-200",
    iconColor: "text-gray-400",
    title: "Noch nicht ausgefüllt",
    badge: "Kein Eintrag",
    badgeBg: "bg-gray-100 text-gray-500",
  },
};

export function JaehrlicheErinnerung({
  lastUpdatedYear,
  lastUpdatedDate,
  sectionLabel,
  renewalMonth = 11,
}: JaehrlicheErinnerungProps) {
  const status = getStatus(lastUpdatedYear, renewalMonth);
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  const daysInfo = getDaysInfo(lastUpdatedYear);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border ${cfg.bg} ${cfg.border} px-5 py-4 flex items-start gap-4`}
    >
      <div className={`mt-0.5 shrink-0 ${cfg.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">
            Jährliche Erneuerung · {sectionLabel}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
            {cfg.badge}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          {status === "leer" && "Für dieses Jahr wurden noch keine Daten eingetragen."}
          {status === "aktuell" && `Zuletzt aktualisiert: ${formatDate(lastUpdatedDate)}. ${daysInfo}.`}
          {status === "bald-faellig" && `Zuletzt aktualisiert: ${formatDate(lastUpdatedDate)}. ${daysInfo} — bitte rechtzeitig zum Jahreswechsel erneuern.`}
          {status === "ueberfaellig" && `Letzter Eintrag: ${lastUpdatedYear}. ${daysInfo} — bitte baldmöglich die Verantwortlichkeiten für ${new Date().getFullYear()} aktualisieren.`}
        </p>
      </div>

      <div className="shrink-0 hidden sm:flex flex-col items-end gap-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Turnus: jährlich</span>
        </div>
        {lastUpdatedYear && (
          <span className="text-xs text-muted-foreground">
            Stand {lastUpdatedYear}
          </span>
        )}
      </div>
    </motion.div>
  );
}
