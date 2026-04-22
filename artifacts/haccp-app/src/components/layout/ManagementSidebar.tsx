import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, KanbanSquare, Users, X, GripVertical, Briefcase } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 240;
const STORAGE_KEY = "management-sidebar-width";

const ACCENT = "#1a3a6b";
const ACCENT_LIGHT = "#eef4fb";

function NavLink({ href, label, icon: Icon, onNavigate }: {
  href: string;
  label: string;
  icon: React.ElementType;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const isActive = location === href || location.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 group",
        isActive
          ? "font-semibold"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
      style={isActive ? { background: ACCENT_LIGHT, color: ACCENT } : {}}
    >
      <Icon
        className={cn("h-4 w-4 flex-shrink-0")}
        style={{ color: isActive ? ACCENT : undefined }}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function ManagementSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="p-4 pb-2 flex flex-col gap-1">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold mb-2 transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
      >
        <Home className="h-4 w-4 flex-shrink-0" />
        Startseite
      </Link>

      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">
        Management Hub
      </div>

      <NavLink href="/management" label="Übersicht" icon={Briefcase} onNavigate={onNavigate} />
      <NavLink href="/management/tasks" label="Task-Board" icon={KanbanSquare} onNavigate={onNavigate} />
      <NavLink href="/management/recruiting" label="Recruiting" icon={Users} onNavigate={onNavigate} />
    </div>
  );
}

export function ManagementMobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-[min(300px,85vw)] bg-white shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <span className="text-sm font-bold text-foreground">Management Hub</span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ManagementSidebarContent onNavigate={onClose} />
      </aside>
    </div>
  );
}

export function ManagementSidebar() {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(saved))) : DEFAULT_WIDTH;
  });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;
    const move = (e: MouseEvent) => setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX)));
    const up = () => { setIsDragging(false); localStorage.setItem(STORAGE_KEY, String(width)); };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, width]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, String(width)); }, [width]);

  return (
    <aside
      className="hidden xl:flex flex-shrink-0 bg-white border-r border-border/60 h-[calc(100vh-4rem)] sticky top-16 relative"
      style={{ width }}
    >
      <div className="flex-1 flex flex-col overflow-y-auto">
        <ManagementSidebarContent />
      </div>
      <div
        onMouseDown={e => { e.preventDefault(); setIsDragging(true); }}
        className={cn(
          "absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-10 group flex items-center justify-center hover:bg-[#1a3a6b]/20 transition-colors",
          isDragging && "bg-[#1a3a6b]/30"
        )}
      >
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 right-0 w-4 h-10 flex items-center justify-center rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a3a6b]/10",
          isDragging && "opacity-100"
        )}>
          <GripVertical className="h-4 w-4 text-[#1a3a6b]/50" />
        </div>
      </div>
    </aside>
  );
}

export const MANAGEMENT_PATHS = ["/management", "/management/tasks", "/management/recruiting", "/management/bewerber/"];
