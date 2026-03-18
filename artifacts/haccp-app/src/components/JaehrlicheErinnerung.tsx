import { CheckCircle2, AlertTriangle, AlertCircle, Clock, CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";

export type Turnus = "jährlich" | "vierteljährlich";

interface JaehrlicheErinnerungProps {
  turnus?: Turnus;
  sectionLabel: string;
  // Jährlich
  lastUpdatedYear?: number | null;
  lastUpdatedDate?: string | Date | null;
  renewalMonth?: number;
  // Vierteljährlich
  completedQuartals?: number[];
}

type Status = "aktuell" | "bald-faellig" | "ueberfaellig" | "leer";

function getCurrentQuartal(): number {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}

function getStatusJaehrlich(
  lastUpdatedYear: number | null | undefined,
  renewalMonth: number
): Status {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (!lastUpdatedYear) return "leer";
  if (lastUpdatedYear < currentYear) return "ueberfaellig";
  if (currentMonth >= renewalMonth) return "bald-faellig";
  return "aktuell";
}

function getStatusQuartal(completedQuartals: number[]): Status {
  const q = getCurrentQuartal();
  const now = new Date();
  const dayOfQuarter = now.getDate() + (now.getMonth() % 3) * 30;
  if (completedQuartals.includes(q)) return "aktuell";
  if (dayOfQuarter > 60) return "ueberfaellig";
  return "bald-faellig";
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

function getDaysInfoJaehrlich(lastUpdatedYear: number | null | undefined): string {
  if (!lastUpdatedYear) return "";
  const now = new Date();
  const currentYear = now.getFullYear();
  if (lastUpdatedYear < currentYear) {
    const overdueSince = new Date(lastUpdatedYear + 1, 0, 1);
    const diffDays = Math.floor((now.getTime() - overdueSince.getTime()) / 86400000);
    if (diffDays <= 0) return "Seit heute fällig";
    if (diffDays === 1) return "Seit gestern fällig";
    return `Seit ${diffDays} Tagen fällig`;
  }
  const nextDue = new Date(lastUpdatedYear + 1, 0, 1);
  const diffDays = Math.ceil((nextDue.getTime() - now.getTime()) / 86400000);
  if (diffDays <= 0) return "Erneuerung heute fällig";
  if (diffDays === 1) return "Erneuerung morgen fällig";
  if (diffDays < 60) return `Erneuerung in ${diffDays} Tagen fällig`;
  return `Nächste Erneuerung in ca. ${Math.floor(diffDays / 30)} Monat${Math.floor(diffDays / 30) !== 1 ? "en" : ""}`;
}

const QUARTAL_LABELS = ["Q1 (Jan–Mär)", "Q2 (Apr–Jun)", "Q3 (Jul–Sep)", "Q4 (Okt–Dez)"];

const CONFIG: Record<Status, {
  icon: React.ElementType; bg: string; border: string; iconColor: string;
  title: (turnus: Turnus) => string; badge: string; badgeBg: string;
}> = {
  aktuell: {
    icon: CheckCircle2, bg: "bg-green-50", border: "border-green-200", iconColor: "text-green-500",
    title: () => "Aktuell gültig", badge: "Aktuell", badgeBg: "bg-green-100 text-green-700",
  },
  "bald-faellig": {
    icon: Clock, bg: "bg-amber-50", border: "border-amber-200", iconColor: "text-amber-500",
    title: (t) => t === "vierteljährlich" ? "Quartal noch ausstehend" : "Erneuerung in Kürze fällig",
    badge: "Ausstehend", badgeBg: "bg-amber-100 text-amber-700",
  },
  ueberfaellig: {
    icon: AlertCircle, bg: "bg-red-50", border: "border-red-200", iconColor: "text-red-500",
    title: (t) => t === "vierteljährlich" ? "Quartal überfällig" : "Erneuerung überfällig",
    badge: "Überfällig", badgeBg: "bg-red-100 text-red-700",
  },
  leer: {
    icon: AlertTriangle, bg: "bg-gray-50", border: "border-gray-200", iconColor: "text-gray-400",
    title: () => "Noch nicht ausgefüllt", badge: "Kein Eintrag", badgeBg: "bg-gray-100 text-gray-500",
  },
};

export function JaehrlicheErinnerung({
  turnus = "jährlich",
  sectionLabel,
  lastUpdatedYear,
  lastUpdatedDate,
  renewalMonth = 11,
  completedQuartals = [],
}: JaehrlicheErinnerungProps) {
  const currentYear = new Date().getFullYear();
  const currentQ = getCurrentQuartal();

  const status = turnus === "vierteljährlich"
    ? getStatusQuartal(completedQuartals)
    : getStatusJaehrlich(lastUpdatedYear, renewalMonth);

  const cfg = CONFIG[status];
  const Icon = cfg.icon;

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
            {turnus === "vierteljährlich" ? "Quartalsüberprüfung" : "Jährliche Erneuerung"} · {sectionLabel}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
            {cfg.badge}
          </span>
        </div>

        {turnus === "vierteljährlich" ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {[1, 2, 3, 4].map((q) => {
              const done = completedQuartals.includes(q);
              const isCurrent = q === currentQ;
              return (
                <div
                  key={q}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium
                    ${done
                      ? "bg-green-100 border-green-200 text-green-700"
                      : isCurrent
                        ? status === "ueberfaellig"
                          ? "bg-red-100 border-red-200 text-red-700"
                          : "bg-amber-100 border-amber-200 text-amber-700"
                        : "bg-gray-100 border-gray-200 text-gray-400"
                    }`}
                >
                  {done
                    ? <CheckCircle2 className="w-3 h-3" />
                    : isCurrent
                      ? <AlertCircle className="w-3 h-3" />
                      : <Clock className="w-3 h-3" />
                  }
                  Q{q} {q <= currentQ ? (done ? "✓" : "ausstehend") : "—"}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {status === "leer" && "Für dieses Jahr wurden noch keine Daten eingetragen."}
            {status === "aktuell" && `Zuletzt aktualisiert: ${formatDate(lastUpdatedDate)}. ${getDaysInfoJaehrlich(lastUpdatedYear)}.`}
            {status === "bald-faellig" && `Zuletzt aktualisiert: ${formatDate(lastUpdatedDate)}. ${getDaysInfoJaehrlich(lastUpdatedYear)} — bitte rechtzeitig zum Jahreswechsel erneuern.`}
            {status === "ueberfaellig" && `Letzter Eintrag: ${lastUpdatedYear}. ${getDaysInfoJaehrlich(lastUpdatedYear)} — bitte baldmöglich für ${currentYear} aktualisieren.`}
          </p>
        )}
      </div>

      <div className="shrink-0 hidden sm:flex flex-col items-end gap-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Turnus: {turnus}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {turnus === "vierteljährlich" ? `Q${currentQ} / ${currentYear}` : `Stand ${currentYear}`}
        </span>
      </div>
    </motion.div>
  );
}
