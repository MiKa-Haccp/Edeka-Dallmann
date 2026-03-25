import { AppLayout } from "@/components/layout/AppLayout";
import { useListSections, useListCategories } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { FileText, ArrowRight, ChevronLeft, ShieldCheck, ShoppingCart, Beef } from "lucide-react";
import {
  useWarenzustandOGStatus, useReinigungTaeglichStatus, useWareneingaengeStatus,
  useMetzgereiWareneingaengeStatus, useMetzgereiReinigungStatus, useKaesethekeStatus,
  useOeffnungSalateStatus, useGQBegehungStatus, useSchulungsnachweiseStatus,
  useResponsibilitiesStatus, useAnnualCleaningPlanStatus, useBetriebsbegehungStatus,
  type TrafficLight,
} from "@/hooks/useWarenzustandStatus";

const CATEGORY_META: Record<number, { label: string; icon: React.ElementType; color: string; bgColor: string; nummer: string; borderColor: string }> = {
  1: { label: "Allgemein", icon: ShieldCheck,  color: "text-[#1a3a6b]",  bgColor: "bg-[#1a3a6b]/10", borderColor: "border-[#1a3a6b]/20", nummer: "HACCP 1" },
  2: { label: "Markt",     icon: ShoppingCart, color: "text-sky-700",     bgColor: "bg-sky-50",        borderColor: "border-sky-200",       nummer: "HACCP 2" },
  3: { label: "Metzgerei", icon: Beef,         color: "text-violet-700",  bgColor: "bg-violet-50",     borderColor: "border-violet-200",    nummer: "HACCP 3" },
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
  "2.5": "/wareneingaenge",
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

// Ampel-Punkt als Badge auf dem Icon (oben rechts)
function AmpelDot({ status }: { status: TrafficLight }) {
  if (status === "none") return null;
  return (
    <span
      className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
        status === "green"  ? "bg-green-500" :
        status === "yellow" ? "bg-amber-400" :
        "bg-red-500"
      }`}
    />
  );
}

// Ampel-Badge mit Label für die Zusammenfassung oben
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

  // Alle Status-Hooks (müssen immer aufgerufen werden – React-Regel)
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

  // Mapping Abschnittsnummer → Status
  const sectionStatus: Record<string, TrafficLight> = {
    "1.1": responsibilitiesStatus,
    "1.4": schulungsnachweiseStatus,
    "1.5": cleaningPlanStatus,
    "1.6": betriebsbegehungStatus,
    "2.1": ogStatus,
    "2.2": reinigungStatus,
    "2.5": wareneingaengeStatus,
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

  // Zusammenfassung für diese Kategorie
  const trackedStatuses = visible
    .map(s => sectionStatus[s.number] ?? "none")
    .filter(s => s !== "none");
  const greenCount  = trackedStatuses.filter(s => s === "green").length;
  const yellowCount = trackedStatuses.filter(s => s === "yellow").length;
  const redCount    = trackedStatuses.filter(s => s === "red").length;
  const hasStatus   = trackedStatuses.length > 0;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/haccp" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className={`w-10 h-10 rounded-xl ${meta?.bgColor ?? "bg-primary/10"} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${meta?.color ?? "text-primary"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-bold uppercase tracking-wide ${meta?.color ?? "text-primary"}`}>
              {meta?.nummer ?? "HACCP"} · {category?.label ?? ""}
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{meta?.label ?? category?.label ?? "Lade..."}</h1>
          </div>
        </div>

        {/* Ampel-Zusammenfassung für diese Kategorie */}
        {hasStatus && (
          <div className="flex items-center gap-2 flex-wrap">
            {greenCount  > 0 && <AmpelBadge status="green"  label={`${greenCount} ok`} />}
            {yellowCount > 0 && <AmpelBadge status="yellow" label={`${yellowCount} offen`} />}
            {redCount    > 0 && <AmpelBadge status="red"    label={`${redCount} fehlt`} />}
            <span className="text-xs text-muted-foreground ml-auto">
              {greenCount}/{trackedStatuses.length} erledigt
            </span>
          </div>
        )}

        {/* Abschnittsliste */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b bg-gray-50/60 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">Formulare & Protokolle</h2>
            <span className="text-xs text-gray-400">{visible.length} Einträge</span>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm animate-pulse">Lade Formulare...</div>
            ) : visible.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Keine Formulare in dieser Kategorie.</div>
            ) : (
              visible.map((section) => {
                const href   = SECTION_HREFS[section.number] ?? `/section/${section.id}`;
                const status = sectionStatus[section.number] ?? "none";
                return (
                  <Link
                    key={section.id}
                    href={href}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <div className={`w-9 h-9 rounded-lg ${meta?.bgColor ?? "bg-primary/10"} flex items-center justify-center`}>
                          <FileText className={`w-4 h-4 ${meta?.color ?? "text-primary"}`} />
                        </div>
                        <AmpelDot status={status} />
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium">{section.number}</span>
                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 leading-tight">
                          {section.title}
                        </h3>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
