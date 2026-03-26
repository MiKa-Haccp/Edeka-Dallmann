import { AppLayout } from "@/components/layout/AppLayout";
import { useListSections, useListCategories } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { FileText, ChevronLeft, ShieldCheck, ShoppingCart, Beef, ArrowRight } from "lucide-react";
import {
  useWarenzustandOGStatus, useReinigungTaeglichStatus, useWareneingaengeStatus,
  useMetzgereiWareneingaengeStatus, useMetzgereiReinigungStatus, useKaesethekeStatus,
  useOeffnungSalateStatus, useGQBegehungStatus, useSchulungsnachweiseStatus,
  useResponsibilitiesStatus, useAnnualCleaningPlanStatus, useBetriebsbegehungStatus,
  type TrafficLight,
} from "@/hooks/useWarenzustandStatus";

const CATEGORY_META: Record<number, { label: string; icon: React.ElementType; color: string; bgColor: string; nummer: string; borderColor: string }> = {
  1: { label: "Allgemein", icon: ShieldCheck,  color: "text-[#1a3a6b]",  bgColor: "bg-[#1a3a6b]/10", borderColor: "border-[#1a3a6b]/20", nummer: "HACCP 1" },
  2: { label: "Markt",     icon: ShoppingCart, color: "text-gray-800",    bgColor: "bg-gray-100",      borderColor: "border-gray-200",      nummer: "HACCP 2" },
  3: { label: "Metzgerei", icon: Beef,         color: "text-gray-800",    bgColor: "bg-gray-100",      borderColor: "border-gray-200",      nummer: "HACCP 3" },
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
  "2.1": "/warencheck-og",
  "2.2": "/reinigung-taeglich",
  "2.3": "/carrier-portal",
  "2.4": "/wareneingaenge",
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

function StatusDot({ status }: { status: TrafficLight }) {
  if (status === "none") return <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />;
  const cfg = {
    green:  "bg-green-500",
    yellow: "bg-amber-400",
    red:    "bg-red-500",
  }[status];
  return <span className={`w-2 h-2 rounded-full ${cfg} inline-block`} />;
}

function StatusStrip({ status }: { status: TrafficLight }) {
  const cfg = {
    red:    "bg-red-500",
    yellow: "bg-amber-400",
    green:  "bg-green-500",
    none:   "bg-gray-200",
  }[status];
  return <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${cfg}`} />;
}

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
    "2.1": ogStatus,
    "2.2": reinigungStatus,
    "2.4": wareneingaengeStatus,
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
    const na = parseFloat(a.number.replace(",", "."));
    const nb = parseFloat(b.number.replace(",", "."));
    return na - nb;
  });

  const trackedStatuses = visible
    .map(s => sectionStatus[s.number] ?? "none")
    .filter(s => s !== "none");
  const greenCount  = trackedStatuses.filter(s => s === "green").length;
  const yellowCount = trackedStatuses.filter(s => s === "yellow").length;
  const redCount    = trackedStatuses.filter(s => s === "red").length;
  const hasStatus   = trackedStatuses.length > 0;

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
        {hasStatus && (
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
              <div key={i} className="bg-gray-100 rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Keine Formulare in dieser Kategorie.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sorted.map((section) => {
              const href   = SECTION_HREFS[section.number] ?? `/section/${section.id}`;
              const status = sectionStatus[section.number] ?? "none";

              const cardBorder =
                status === "red"    ? "border-red-200 hover:border-red-300" :
                status === "yellow" ? "border-amber-200 hover:border-amber-300" :
                status === "green"  ? "border-green-200 hover:border-green-300" :
                "border-gray-200 hover:border-gray-300";

              const cardBg =
                status === "red"    ? "hover:bg-red-50/30" :
                status === "yellow" ? "hover:bg-amber-50/30" :
                status === "green"  ? "hover:bg-green-50/30" :
                "hover:bg-gray-50";

              const numBadgeBg =
                status === "red"    ? "bg-red-100 text-red-600" :
                status === "yellow" ? "bg-amber-100 text-amber-600" :
                status === "green"  ? "bg-green-100 text-green-600" :
                (meta?.bgColor ?? "bg-primary/10") + " " + (meta?.color ?? "text-primary");

              return (
                <Link
                  key={section.id}
                  href={href}
                  className={`group relative flex flex-col bg-white rounded-2xl border shadow-sm p-4 transition-all duration-200 hover:shadow-md ${cardBorder} ${cardBg} overflow-hidden`}
                >
                  <StatusStrip status={status} />

                  {/* Nummer + Status */}
                  <div className="flex items-center justify-between mb-3 pt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${numBadgeBg}`}>
                      {section.number}
                    </span>
                    <StatusDot status={status} />
                  </div>

                  {/* Icon + Titel */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      status === "red"    ? "bg-red-100" :
                      status === "yellow" ? "bg-amber-100" :
                      status === "green"  ? "bg-green-100" :
                      (meta?.bgColor ?? "bg-primary/10")
                    }`}>
                      <FileText className={`w-4 h-4 ${
                        status === "red"    ? "text-red-500" :
                        status === "yellow" ? "text-amber-500" :
                        status === "green"  ? "text-green-600" :
                        (meta?.color ?? "text-primary")
                      }`} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-3 group-hover:text-gray-900">
                      {section.title}
                    </h3>
                  </div>

                  {/* Pfeil */}
                  <div className="flex justify-end mt-2">
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
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
