import { useListCategories, useListSections } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Folder, FileText, ClipboardList, GripVertical, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useCallback, useEffect, useRef } from "react";

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

  if (isLoading) return <div className="p-4 text-xs text-muted-foreground">Lade Bereiche...</div>;
  if (!sections?.length) return <div className="p-4 text-xs text-muted-foreground">Keine Bereiche gefunden.</div>;

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {sections.map((section) => {
        const href = section.number === "1.1" ? "/responsibilities" : section.number === "1.2" ? "/user-registry" : section.number === "1.3" ? "/info-documentation" : section.number === "1.4" ? "/training-records" : section.number === "1.5" ? "/annual-cleaning-plan" : section.number === "1.6" ? "/betriebsbegehung" : section.number === "1.7" ? "/hinweisschild-gesperrte-ware" : section.number === "1.8" ? "/produktfehlermeldung" : section.number === "1.9" ? "/probeentnahme" : section.number === "1.10" ? "/besprechungsprotokoll" : `/section/${section.id}`;
        const isActive = location === href;
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
            <FileText className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground")} />
            <span className="truncate">{section.number} {section.title}</span>
          </Link>
        );
      })}
    </div>
  );
}

const ACCORDION_STORAGE_KEY = "haccp-sidebar-open-categories";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: categories, isLoading } = useListCategories();

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
      <div className="p-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">
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
            value={openCategories}
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
                  <Accordion.Trigger className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary rounded-lg transition-colors group [&[data-state=open]>div>svg]:rotate-180">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
                        <Folder className="h-4 w-4" />
                      </div>
                      <span className="truncate">{category.label}</span>
                    </div>
                    <div className="text-muted-foreground transition-transform duration-200 flex-shrink-0">
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

      <div className="mt-auto p-4 border-t border-border/60">
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
    <div className="fixed inset-0 z-50 lg:hidden">
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
      className="hidden lg:flex flex-shrink-0 bg-white border-r border-border/60 h-[calc(100vh-4rem)] sticky top-16 relative"
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
