import { Link, useLocation } from "wouter";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Folder, FileText, ClipboardList, GripVertical, X, Home, ShieldCheck, ShoppingCart, Beef } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";

import { useWarenzustandOGStatus, useReinigungTaeglichStatus, useWareneingaengeStatus, useMetzgereiWareneingaengeStatus, useMetzgereiReinigungStatus, useKaesethekeStatus, useOeffnungSalateStatus, useGQBegehungStatus, useSchulungsnachweiseStatus, useResponsibilitiesStatus, useAnnualCleaningPlanStatus, useBetriebsbegehungStatus, useTempLagerStatus, useBescheinigungenStatus, useTuevAktionsplanStatus, type TrafficLight } from "@/hooks/useWarenzustandStatus";
import { useAppStore } from "@/store/use-app-store";
import { SIDEBAR_CONFIG, MARKET_TITLE_OVERRIDES, type SectionConfig } from "@/config/sidebarConfig";

const BASE = import.meta.env.VITE_API_URL || "/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getCategoryIcon(categoryId: number) {
  switch (categoryId) {
    case 1: return { Icon: ShieldCheck, bg: "bg-[#1a3a6b]/10", text: "text-[#1a3a6b]", hoverBg: "group-hover:bg-[#1a3a6b]" };
    case 2: return { Icon: ShoppingCart, bg: "bg-[#1a3a6b]/10", text: "text-[#1a3a6b]", hoverBg: "group-hover:bg-[#1a3a6b]" };
    case 3: return { Icon: Beef, bg: "bg-[#1a3a6b]/10", text: "text-[#1a3a6b]", hoverBg: "group-hover:bg-[#1a3a6b]" };
    default: return { Icon: Folder, bg: "bg-primary/10", text: "text-primary", hoverBg: "group-hover:bg-primary" };
  }
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 288;
const STORAGE_KEY = "haccp-sidebar-width";

function CategorySections({
  categoryId,
  sections,
  onNavigate,
  visibility,
  selectedMarketId,
}: {
  categoryId: number;
  sections: SectionConfig[];
  onNavigate?: () => void;
  visibility: Record<number, boolean>;
  selectedMarketId: number | null;
}) {
  const [location] = useLocation();

  const ogStatus               = useWarenzustandOGStatus();
  const reinigungStatus        = useReinigungTaeglichStatus();
  const wareneingaengeStatus   = useWareneingaengeStatus();
  const metzgereiStatus        = useMetzgereiWareneingaengeStatus();
  const metzReinigungStatus    = useMetzgereiReinigungStatus();
  const kaesethekeStatus       = useKaesethekeStatus();
  const oeffnungSalateStatus   = useOeffnungSalateStatus();
  const gqBegehungStatus       = useGQBegehungStatus();
  const schulungsnachweiseStatus = useSchulungsnachweiseStatus();
  const responsibilitiesStatus   = useResponsibilitiesStatus();
  const cleaningPlanStatus       = useAnnualCleaningPlanStatus();
  const betriebsbegehungStatus   = useBetriebsbegehungStatus();
  const tempLagerStatus          = useTempLagerStatus();
  const bescheinigungenStatus    = useBescheinigungenStatus();
  const tuevAktionsplanStatus    = useTuevAktionsplanStatus();

  const trafficFor = (num: string): TrafficLight => {
    switch (num) {
      case "1.1":  return responsibilitiesStatus;
      case "1.4":  return schulungsnachweiseStatus;
      case "1.5":  return cleaningPlanStatus;
      case "1.6":  return betriebsbegehungStatus;
      case "1.11": return bescheinigungenStatus;
      case "1.12": return tuevAktionsplanStatus;
      case "1.13": return tempLagerStatus;
      case "2.1":  return wareneingaengeStatus;
      case "2.2":  return ogStatus;
      case "2.3":  return reinigungStatus;
      case "3.1":  return metzgereiStatus;
      case "3.2":  return metzReinigungStatus;
      case "3.3":  return oeffnungSalateStatus;
      case "3.4":  return kaesethekeStatus;
      case "3.8":  return gqBegehungStatus;
      default:     return "none";
    }
  };

  const visibleSections = sections.filter((s) => {
    if (s.dbId in visibility && visibility[s.dbId] === false) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {visibleSections.map((section, idx) => {
        const displayNum  = `${categoryId}.${idx + 1}`;
        const isActive    = location === section.href;
        const traffic     = trafficFor(section.number);
        const title       = (selectedMarketId && MARKET_TITLE_OVERRIDES[selectedMarketId]?.[section.number]) || section.title;

        const iconColor =
          traffic === "green"  ? "text-green-500" :
          traffic === "yellow" ? "text-amber-400" :
          traffic === "red"    ? "text-red-500"   :
          isActive             ? "text-primary"   :
          "text-muted-foreground/50 group-hover:text-muted-foreground";

        return (
          <Link
            key={section.number}
            href={section.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 group",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <FileText className={cn("h-4 w-4 flex-shrink-0", iconColor)} />
            <span className="truncate">{displayNum} {title}</span>
          </Link>
        );
      })}
    </div>
  );
}

const ACCORDION_STORAGE_KEY = "haccp-sidebar-open-categories";

const SIDEBAR_OPEN_PATHS = [
  "/responsibilities", "/mitarbeiter-liste", "/info-documentation",
  "/training-records", "/annual-cleaning-plan", "/betriebsbegehung",
  "/hinweisschild-gesperrte-ware", "/produktfehlermeldung", "/probeentnahme",
  "/anti-vektor-zugang", "/bescheinigungen", "/kontrollberichte",
  "/warencheck-og", "/reinigung-taeglich", "/carrier-portal",
  "/haccp", "/wareneingaenge", "/metzgerei-wareneingaenge", "/reinigungsplan-metzgerei",
  "/oeffnung-salate", "/kaesetheke-kontrolle", "/semmelliste", "/eingefrorenes-fleisch",
  "/rezepturen", "/gq-begehung", "/abteilungsfremde-personen",
  "/section/", "/category/", "/we-", "/besprechungsprotokoll",
  "/gesundheitszeugnisse", "/mitarbeiterverwaltung", "/admin/",
  "/projekt-hub", "/temp-lager-kontrolle", "/rindfleisch-etikettierung",
  "/metz-bestellungen",
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location, navigate] = useLocation();
  const selectedMarketId = useAppStore(s => s.selectedMarketId);
  const [sectionVisibility, setSectionVisibility] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!selectedMarketId) return;
    setSectionVisibility({});
    fetch(`${BASE}/section-visibility?marketId=${selectedMarketId}`)
      .then(r => r.json())
      .then(d => { if (d.settings) setSectionVisibility(d.settings); })
      .catch(() => {});
  }, [selectedMarketId]);

  const isHaccpPage = useMemo(
    () => location === "/" || SIDEBAR_OPEN_PATHS.some((p) => p !== "/" && location.startsWith(p)),
    [location]
  );

  const [openCategories, setOpenCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ACCORDION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (openCategories.length === 0) {
      const allIds = SIDEBAR_CONFIG.map((c) => c.id.toString());
      setOpenCategories(allIds);
      localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(allIds));
    }
  }, []);

  const handleValueChange = (values: string[]) => {
    setOpenCategories(values);
    localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(values));
  };

  return (
    <>
      <div className="p-4 pb-2">
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold mb-3 transition-colors",
            location === "/"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          Startseite
        </Link>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2 mt-1">
          HACCP Handbuch
        </div>

        <Accordion.Root
          type="multiple"
          value={isHaccpPage ? openCategories : []}
          onValueChange={handleValueChange}
          className="space-y-2"
        >
          {SIDEBAR_CONFIG.map((category) => {
            const { Icon, bg, text, hoverBg } = getCategoryIcon(category.id);
            return (
              <Accordion.Item
                key={category.id}
                value={category.id.toString()}
                className="border border-transparent focus-within:border-border rounded-xl overflow-hidden"
              >
                <Accordion.Header>
                  <Accordion.Trigger
                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary rounded-lg transition-colors group [&[data-state=open]>div>svg]:rotate-180"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1"
                      onClick={(e) => { e.stopPropagation(); navigate(`/category/${category.id}`); onNavigate?.(); }}
                    >
                      <div className={`p-1.5 rounded-md ${bg} ${text} ${hoverBg} group-hover:text-white transition-colors flex-shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="truncate text-left">{category.label}</span>
                    </div>
                    <div className="text-muted-foreground transition-transform duration-200 flex-shrink-0 pl-2">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden text-sm data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown pl-3">
                  <div className="ml-4 border-l border-border/60 pl-2 my-1">
                    <CategorySections
                      categoryId={category.id}
                      sections={category.sections}
                      onNavigate={onNavigate}
                      visibility={sectionVisibility}
                      selectedMarketId={selectedMarketId}
                    />
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>
      </div>

      <div className="mt-auto p-4 border-t border-border/60 space-y-1">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
        >
          <ClipboardList className="h-4 w-4" />
          Aufgaben Übersicht
        </Link>
      </div>
    </>
  );
}

export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-[min(320px,85vw)] bg-white shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <span className="text-sm font-bold text-foreground">Navigation</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent onNavigate={onClose} />
      </aside>
    </div>
  );
}

export function Sidebar() {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(saved))) : DEFAULT_WIDTH;
  });
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef  = useRef<HTMLDivElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  const [location]  = useLocation();

  const handleClickCapture = useCallback(() => {
    savedScroll.current = scrollRef.current?.scrollTop ?? 0;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const saved = savedScroll.current;
    requestAnimationFrame(() => { el.scrollTop = saved; });
  }, [location]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX - sidebarLeft));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem(STORAGE_KEY, String(width));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, width]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  return (
    <aside
      ref={sidebarRef}
      className="hidden xl:flex flex-shrink-0 bg-white border-r border-border/60 h-[calc(100vh-4rem)] sticky top-16 relative"
      style={{ width }}
    >
      <div
        ref={scrollRef}
        onClickCapture={handleClickCapture}
        className="flex-1 flex flex-col overflow-y-auto haccp-table-container"
      >
        <SidebarContent />
      </div>

      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-10 group flex items-center justify-center",
          "hover:bg-primary/20 transition-colors",
          isDragging && "bg-primary/30"
        )}
      >
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 right-0 w-4 h-10 flex items-center justify-center rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10",
          isDragging && "opacity-100"
        )}>
          <GripVertical className="h-4 w-4 text-primary/50" />
        </div>
      </div>
    </aside>
  );
}
