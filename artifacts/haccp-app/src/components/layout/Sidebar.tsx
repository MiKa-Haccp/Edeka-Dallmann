import { useListCategories, useListSections } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Folder, FileText, ClipboardList } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function CategorySections({ categoryId }: { categoryId: number }) {
  const { data: sections, isLoading } = useListSections(categoryId);
  const [location] = useLocation();

  if (isLoading) return <div className="p-4 text-xs text-muted-foreground">Lade Bereiche...</div>;
  if (!sections?.length) return <div className="p-4 text-xs text-muted-foreground">Keine Bereiche gefunden.</div>;

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {sections.map((section) => {
        const href = `/section/${section.id}`;
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
            <FileText className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground")} />
            <span className="truncate">{section.number} {section.title}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const { data: categories, isLoading } = useListCategories();

  return (
    <aside className="w-72 flex-shrink-0 bg-white border-r border-border/60 flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto haccp-table-container">
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
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Folder className="h-4 w-4" />
                      </div>
                      <span>{category.label}</span>
                    </div>
                    <div className="text-muted-foreground transition-transform duration-200">
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
    </aside>
  );
}
