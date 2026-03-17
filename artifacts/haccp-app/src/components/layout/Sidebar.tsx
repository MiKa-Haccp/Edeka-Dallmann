import { useListCategories, useListSections } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Folder, FileText, ClipboardList, GripVertical } from "lucide-react";
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

function CategorySections({ categoryId }: { categoryId: number }) {
  const { data: sections, isLoading } = useListSections(categoryId);
  const [location] = useLocation();

  if (isLoading) return <div className="p-4 text-xs text-muted-foreground">Lade Bereiche...</div>;
  if (!sections?.length) return <div className="p-4 text-xs text-muted-foreground">Keine Bereiche gefunden.</div>;

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {sections.map((section) => {
        const href = section.number === "1.1" ? "/responsibilities" : section.number === "1.2" ? "/user-registry" : `/section/${section.id}`;
        const isActive = location === href;
        return (
          <Link
            key={section.id}
            href={href}
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

export function Sidebar() {
  const { data: categories, isLoading } = useListCategories();
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
      className="flex-shrink-0 bg-white border-r border-border/60 flex h-[calc(100vh-4rem)] sticky top-16 relative"
      style={{ width }}
    >
      <div className="flex-1 flex flex-col overflow-y-auto haccp-table-container">
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
            <Accordion.Root type="multiple" className="space-y-2">
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
                      <CategorySections categoryId={category.id} />
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          )}
        </div>

        <div className="mt-auto p-4 border-t border-border/60">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
            <ClipboardList className="h-4 w-4" />
            Aufgaben Übersicht
          </Link>
        </div>
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
