import { useListCategories, useListSections } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Folder, FileText, ClipboardList, GripVertical, X, Home } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useWarenzustandOGStatus, useReinigungTaeglichStatus, useWareneingaengeStatus, useMetzgereiWareneingaengeStatus, useMetzgereiReinigungStatus, useKaesethekeStatus, useOeffnungSalateStatus, useGQBegehungStatus, useSchulungsnachweiseStatus, useResponsibilitiesStatus, useAnnualCleaningPlanStatus, useBetriebsbegehungStatus, type TrafficLight } from "@/hooks/useWarenzustandStatus";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 288;
const STORAGE_KEY = "haccp-sidebar-width";


function CategorySections({ categoryId, onNavigate }: { categoryId: number; onNavigate?: () => void }) {
  const { data: sections, isLoading } = useListSections(categoryId);
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

  if (isLoading) return <div className="p-4 text-xs text-muted-foreground">Lade Bereiche...</div>;
  if (!sections?.length) return <div className="p-4 text-xs text-muted-foreground">Keine Bereiche gefunden.</div>;

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {sections.filter((s) => {
        if (s.number.includes("_")) return false;
        const m = s.number.match(/^3\.(\d+)$/);
        if (m && parseInt(m[1]) >= 10) return false;
        return true;
      }).map((section) => {
        const href = section.number === "1.1" ? "/responsibilities" : section.number === "1.2" ? "/mitarbeiter-liste" : section.number === "1.3" ? "/info-documentation" : section.number === "1.4" ? "/training-records" : section.number === "1.5" ? "/annual-cleaning-plan" : section.number === "1.6" ? "/betriebsbegehung" : section.number === "1.7" ? "/hinweisschild-gesperrte-ware" : section.number === "1.8" ? "/produktfehlermeldung" : section.number === "1.9" ? "/probeentnahme" : section.number === "1.10" ? "/anti-vektor-zugang" : section.number === "1.11" ? "/bescheinigungen" : section.number === "1.12" ? "/kontrollberichte" : section.number === "2.1" ? "/warencheck-og" : section.number === "2.2" ? "/reinigung-taeglich" : section.number === "2.3" ? "/carrier-portal" : section.number === "2.5" ? "/wareneingaenge" : section.number === "3.1" ? "/metzgerei-wareneingaenge" : section.number === "3.2" ? "/reinigungsplan-metzgerei" : section.number === "3.3" ? "/oeffnung-salate" : section.number === "3.4" ? "/kaesetheke-kontrolle" : section.number === "3.5" ? "/semmelliste" : section.number === "3.6" ? "/eingefrorenes-fleisch" : section.number === "3.7" ? "/rezepturen" : section.number === "3.8" ? "/gq-begehung" : section.number === "3.9" ? "/abteilungsfremde-personen" : `/section/${section.id}`;
        const isActive = location === href;
        const trafficStatus: TrafficLight = section.number === "1.1" ? responsibilitiesStatus : section.number === "1.4" ? schulungsnachweiseStatus : section.number === "1.5" ? cleaningPlanStatus : section.number === "1.6" ? betriebsbegehungStatus : section.number === "2.1" ? ogStatus : section.number === "2.2" ? reinigungStatus : section.number === "2.5" ? wareneingaengeStatus : section.number === "3.1" ? metzgereiStatus : section.number === "3.2" ? metzReinigungStatus : section.number === "3.3" ? oeffnungSalateStatus : section.number === "3.4" ? kaesethekeStatus : section.number === "3.8" ? gqBegehungStatus : "none";
        const iconColor = trafficStatus === "green"
          ? "text-green-500"
          : trafficStatus === "yellow"
          ? "text-amber-400"
          : trafficStatus === "red"
          ? "text-red-500"
          : isActive
          ? "text-primary"
          : "text-muted-foreground/50 group-hover:text-muted-foreground";
        return (
          <Link
            key={section.id}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 group",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <FileText className={cn("h-4 w-4 flex-shrink-0", iconColor)} />
            <span className="truncate">{section.number} {section.title}</span>
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
  "/haccp", "/wareneingaenge", "/metzgerei-wareneingaenge", "/reinigungsplan-metzgerei", "/oeffnung-salate", "/kaesetheke-kontrolle", "/semmelliste", "/eingefrorenes-fleisch", "/rezepturen", "/gq-begehung", "/abteilungsfremde-personen",
  "/section/", "/category/", "/we-", "/besprechungsprotokoll",
  "/gesundheitszeugnisse", "/mitarbeiterverwaltung", "/admin/",
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: categories, isLoading } = useListCategories();
  const [location, navigate] = useLocation();

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
    if (!isLoading && categories?.length && openCategories.length === 0) {
      const allIds = categories.map((c) => c.id.toString());
      setOpenCategories(allIds);
      localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(allIds));
    }
  }, [isLoading, categories]);

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
        
        {isLoading ? (
          <div className="px-2 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex gap-3 items-center">
                <div className="w-5 h-5 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded flex-1"></div>
              </div>
            ))}
          </div>
        ) : (
          <Accordion.Root
            type="multiple"
            value={isHaccpPage ? openCategories : []}
            onValueChange={handleValueChange}
            className="space-y-2"
          >
            {categories?.map((category) => (
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
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
                        <Folder className="h-4 w-4" />
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
                    <CategorySections categoryId={category.id} onNavigate={onNavigate} />
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        )}
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
    <div className="fixed inset-0 z-50 md:hidden">
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
  const sidebarRef = useRef<HTMLDivElement>(null);

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
      className="hidden md:flex flex-shrink-0 bg-white border-r border-border/60 h-[calc(100vh-4rem)] sticky top-16 relative"
      style={{ width }}
    >
      <div className="flex-1 flex flex-col overflow-y-auto haccp-table-container">
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
