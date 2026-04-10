import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Home, Package, ShoppingCart, Truck, CalendarCheck,
  ShoppingBag, List, X, GripVertical, ChevronDown,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 288;
const STORAGE_KEY = "ware-sidebar-width";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const NAV: NavItem[] = [
  {
    label: "Bestellungen",
    href: "/ware-bestellungen",
    icon: ShoppingCart,
    children: [
      { label: "Ladenbestellung", href: "/ware-ladenbestellung", icon: ShoppingBag },
      { label: "Streckenbestellung", href: "/ware-streckenbestellung", icon: Truck },
    ],
  },
  {
    label: "MHD Kontrolle",
    href: "/ware-mhd",
    icon: CalendarCheck,
  },
  {
    label: "Einräumservice",
    href: "/ware-einraeumservice",
    icon: Truck,
  },
];

const WARE_PATHS = [
  "/ware",
  "/ware-bestellungen",
  "/ware-ladenbestellung",
  "/ware-streckenbestellung",
  "/ware-strecken-uebersicht",
  "/ware-strecken-bestellung",
  "/ware-mhd",
  "/ware-einraeumservice",
];

function NavLink({
  href,
  label,
  icon: Icon,
  indent = false,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  indent?: boolean;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const isActive = location === href || location.startsWith(href + "/") ||
    (href === "/ware-streckenbestellung" && location.startsWith("/ware-strecken"));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 group",
        indent && "pl-8",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function AccordionItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const isGroupActive = location === item.href ||
    item.children?.some(c => location === c.href || location.startsWith(c.href + "/")) ||
    (item.href === "/ware-bestellungen" && location.startsWith("/ware-strecken"));
  const [open, setOpen] = useState(isGroupActive ?? false);
  const Icon = item.icon;

  if (!item.children) {
    return <NavLink href={item.href} label={item.label} icon={item.icon} onNavigate={onNavigate} />;
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center justify-between w-full px-4 py-2 text-sm rounded-lg transition-colors group",
          isGroupActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "p-1.5 rounded-md transition-colors flex-shrink-0",
            isGroupActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="truncate text-left">{item.label}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 flex-shrink-0 transition-transform duration-200 ml-2", open && "rotate-180")} />
      </button>

      {open && (
        <div className="ml-4 border-l border-border/60 pl-2 my-1 space-y-0.5">
          {item.children.map(child => (
            <NavLink
              key={child.href}
              href={child.href}
              label={child.label}
              icon={child.icon}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WareSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const isWareRoot = location === "/ware";

  return (
    <>
      <div className="p-4 pb-2 flex flex-col gap-0.5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold mb-1 transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          Startseite
        </Link>

        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2 mt-2">
          Warenbereich
        </div>

        <Link
          href="/ware"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 group font-semibold mb-1",
            isWareRoot
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Package className={cn("h-4 w-4 flex-shrink-0", isWareRoot ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground")} />
          <span>Ware Übersicht</span>
        </Link>

        <div className="space-y-0.5 py-1">
          {NAV.map(item => (
            <AccordionItem key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-border/60">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
        >
          <List className="h-4 w-4" />
          Aufgaben Übersicht
        </Link>
      </div>
    </>
  );
}

export function WareMobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-[min(320px,85vw)] bg-white shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <span className="text-sm font-bold text-foreground">Warenbereich</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <WareSidebarContent onNavigate={onClose} />
      </aside>
    </div>
  );
}

export function WareSidebar() {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(saved))) : DEFAULT_WIDTH;
  });
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  const [location] = useLocation();

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
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX - left)));
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
        <WareSidebarContent />
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

export { WARE_PATHS };
