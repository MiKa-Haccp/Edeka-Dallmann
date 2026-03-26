import { AppLayout } from "@/components/layout/AppLayout";
import { useListSections, useListCategories } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { ChevronLeft, ShieldCheck, ShoppingCart, Beef } from "lucide-react";
import {
  useWarenzustandOGStatus, useReinigungTaeglichStatus, useWareneingaengeStatus,
  useMetzgereiWareneingaengeStatus, useMetzgereiReinigungStatus, useKaesethekeStatus,
  useOeffnungSalateStatus, useGQBegehungStatus, useSchulungsnachweiseStatus,
  useResponsibilitiesStatus, useAnnualCleaningPlanStatus, useBetriebsbegehungStatus,
  type TrafficLight,
} from "@/hooks/useWarenzustandStatus";

const CATEGORY_META: Record<number, { label: string; icon: React.ElementType; color: string; bgColor: string; nummer: string }> = {
  1: { label: "Allgemein", icon: ShieldCheck,  color: "text-[#1a3a6b]", bgColor: "bg-[#1a3a6b]/10", nummer: "HACCP 1" },
  2: { label: "Markt",     icon: ShoppingCart, color: "text-gray-700",   bgColor: "bg-gray-100",      nummer: "HACCP 2" },
  3: { label: "Metzgerei", icon: Beef,         color: "text-gray-700",   bgColor: "bg-gray-100",      nummer: "HACCP 3" },
};

const SECTION_HREFS: Record<string, string> = {
  "1.1": "/responsibilities",
  "1.2": "/mitarbeiter-liste",
  "1.3": "/info-documentation",
  "1.4": "/training-records",
  "1.5": "/annual-cleaning-plan",
  "1.6": "/betriebsbegehung",
  "1.7": "/hinweisschild-gesperrte-ware",
  "1.8": "/produktfehlermeldung",
  "1.9": "/probeentnahme",
  "1.10": "/anti-vektor-zugang",
  "1.11": "/bescheinigungen",
  "1.12": "/kontrollberichte",
  "2.1": "/wareneingaenge",
  "2.2": "/warencheck-og",
  "2.3": "/reinigung-taeglich",
  "2.4": "/carrier-portal",
  "3.1": "/metzgerei-wareneingaenge",
  "3.2": "/reinigungsplan-metzgerei",
  "3.3": "/oeffnung-salate",
  "3.4": "/kaesetheke-kontrolle",
  "3.5": "/semmelliste",
  "3.6": "/eingefrorenes-fleisch",
  "3.7": "/rezepturen",
  "3.8": "/gq-begehung",
  "3.9": "/abteilungsfremde-personen",
};

const STATUS_ORDER: Record<TrafficLight, number> = { red: 0, yellow: 1, none: 2, green: 3 };

const STATUS_CFG: Record<TrafficLight, {
  strip: string; dot: string; border: string; hoverBorder: string; numColor: string;
}> = {
  red:    { strip: "bg-red-500",    dot: "bg-red-500",    border: "border-red-200",    hoverBorder: "hover:border-red-400",    numColor: "text-red-400" },
  yellow: { strip: "bg-amber-400",  dot: "bg-amber-400",  border: "border-amber-200",  hoverBorder: "hover:border-amber-400",  numColor: "text-amber-400" },
  green:  { strip: "bg-green-500",  dot: "bg-green-500",  border: "border-green-200",  hoverBorder: "hover:border-green-400",  numColor: "text-green-500" },
  none:   { strip: "bg-gray-200",   dot: "bg-gray-300",   border: "border-gray-200",   hoverBorder: "hover:border-gray-300",   numColor: "text-gray-400" },
};

function AmpelBadge({ status, label }: { status: TrafficLight; label: string }) {
  if (status === "none") return null;
  const cfg = {
    green:  { dot: "bg-green-500",  text: "text-green-700",  bg: "bg-green-100"  },
    yellow: { dot: "bg-amber-400",  text: "text-amber-700",  bg: "bg-amber-100"  },
    red:    { dot: "bg-red-500",    text: "text-red-700",    bg: "bg-red-100"    },
  }[status];
  return (
    <span className={`flex items-center gap-1 text-xs font-bold ${cfg.text} ${cfg.bg} px-2 py-0.5 rounded-full`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
      {label}
    </span>
  );
}

export default function CategoryView() {
  const [match, params] = useRoute("/category/:categoryId");
  const categoryId = match ? Number(params?.categoryId) : 0;

  const { data: categories } = useListCategories();
  const { data: sections, isLoading } = useListSections(categoryId);

  const responsibilitiesStatus   = useResponsibilitiesStatus();
  const schulungsnachweiseStatus = useSchulungsnachweiseStatus();
  const cleaningPlanStatus       = useAnnualCleaningPlanStatus();
  const betriebsbegehungStatus   = useBetriebsbegehungStatus();
  const ogStatus                 = useWarenzustandOGStatus();
  const reinigungStatus          = useReinigungTaeglichStatus();
  const wareneingaengeStatus     = useWareneingaengeStatus();
  const metzgereiStatus          = useMetzgereiWareneingaengeStatus();
  const metzReinigungStatus      = useMetzgereiReinigungStatus();
  const oeffnungSalateStatus     = useOeffnungSalateStatus();
  const kaesethekeStatus         = useKaesethekeStatus();
  const gqBegehungStatus         = useGQBegehungStatus();

  const sectionStatus: Record<string, TrafficLight> = {
    "1.1": responsibilitiesStatus,
    "1.4": schulungsnachweiseStatus,
    "1.5": cleaningPlanStatus,
    "1.6": betriebsbegehungStatus,
    "2.1": wareneingaengeStatus,
    "2.2": ogStatus,
    "2.3": reinigungStatus,
    "3.1": metzgereiStatus,
    "3.2": metzReinigungStatus,
    "3.3": oeffnungSalateStatus,
    "3.4": kaesethekeStatus,
    "3.8": gqBegehungStatus,
  };

  const category = categories?.find(c => c.id === categoryId);
  const meta = CATEGORY_META[categoryId];
  const Icon = meta?.icon ?? ShieldCheck;

  const visible = sections?.filter(s => {
    if (s.number.includes("_")) return false;
    if (s.number.startsWith("hidden")) return false;
    const m = s.number.match(/^3\.(\d+)$/);
    if (m && parseInt(m[1]) >= 10) return false;
    return true;
  }) ?? [];

  const sorted = [...visible].sort((a, b) => {
    const sa = sectionStatus[a.number] ?? "none";
    const sb = sectionStatus[b.number] ?? "none";
    const diff = STATUS_ORDER[sa] - STATUS_ORDER[sb];
    if (diff !== 0) return diff;
    return parseFloat(a.number) - parseFloat(b.number);
  });

  const trackedStatuses = visible.map(s => sectionStatus[s.number] ?? "none").filter(s => s !== "none");
  const greenCount  = trackedStatuses.filter(s => s === "green").length;
  const yellowCount = trackedStatuses.filter(s => s === "yellow").length;
  const redCount    = trackedStatuses.filter(s => s === "red").length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/haccp" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className={`w-10 h-10 rounded-xl ${meta?.bgColor ?? "bg-primary/10"} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${meta?.color ?? "text-primary"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-bold uppercase tracking-wide ${meta?.color ?? "text-primary"}`}>
              {meta?.nummer ?? "HACCP"} · {category?.label ?? ""}
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{meta?.label ?? category?.label ?? "Lade..."}</h1>
          </div>
        </div>

        {/* Ampel-Zusammenfassung */}
        {trackedStatuses.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {redCount    > 0 && <AmpelBadge status="red"    label={`${redCount} fehlt`} />}
            {yellowCount > 0 && <AmpelBadge status="yellow" label={`${yellowCount} offen`} />}
            {greenCount  > 0 && <AmpelBadge status="green"  label={`${greenCount} ok`} />}
            <span className="text-xs text-muted-foreground ml-auto">
              {greenCount}/{trackedStatuses.length} erledigt
            </span>
          </div>
        )}

        {/* Kacheln */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Keine Formulare in dieser Kategorie.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sorted.map((section) => {
              const href   = SECTION_HREFS[section.number] ?? `/section/${section.id}`;
              const status = sectionStatus[section.number] ?? "none";
              const cfg    = STATUS_CFG[status];

              return (
                <Link
                  key={section.id}
                  href={href}
                  className={`group relative flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${cfg.border} ${cfg.hoverBorder}`}
                >
                  {/* Farbstreifen oben */}
                  <div className={`h-1.5 w-full ${cfg.strip}`} />

                  {/* Inhalt */}
                  <div className="flex flex-col flex-1 px-3.5 pt-3 pb-3.5 gap-3">

                    {/* Status-Dot oben rechts */}
                    <div className="flex justify-end">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    </div>

                    {/* Titel – prominent */}
                    <p className="text-sm font-bold text-gray-800 leading-snug group-hover:text-gray-900 flex-1">
                      {section.title}
                    </p>

                    {/* Nummer – zentriert unten */}
                    <p className={`text-xs font-semibold text-center ${cfg.numColor} tracking-wide`}>
                      {section.number}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
