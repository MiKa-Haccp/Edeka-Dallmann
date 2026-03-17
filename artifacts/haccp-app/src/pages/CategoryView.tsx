import { AppLayout } from "@/components/layout/AppLayout";
import { useListSections, useListCategories } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { FileText, ArrowRight, ShieldCheck } from "lucide-react";

export default function CategoryView() {
  const [match, params] = useRoute("/category/:categoryId");
  const categoryId = match ? Number(params?.categoryId) : 0;

  const { data: categories } = useListCategories();
  const { data: sections, isLoading } = useListSections(categoryId);

  const category = categories?.find(c => c.id === categoryId);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="bg-white rounded-3xl p-8 border border-border shadow-sm relative overflow-hidden">
           <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
           <div className="relative z-10">
             <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8" />
             </div>
             <h1 className="text-3xl font-display font-bold text-foreground mb-2">
               {category?.label || "Lade Kategorie..."}
             </h1>
             <p className="text-muted-foreground text-lg max-w-2xl">
               Wählen Sie ein Dokument aus der Liste, um die Protokollierung für den aktuellen Monat durchzuführen.
             </p>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60 bg-secondary/30 flex justify-between items-center">
            <h2 className="font-semibold text-foreground">Verfügbare Protokolle</h2>
            <span className="text-sm text-muted-foreground">{sections?.length || 0} Einträge</span>
          </div>
          
          <div className="divide-y divide-border/60">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Lade Formulare...</div>
            ) : sections?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Keine Formulare in dieser Kategorie.</div>
            ) : (
              sections?.map((section) => (
                <Link 
                  key={section.id} 
                  href={`/section/${section.id}`}
                  className="flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {section.number} {section.title}
                      </h3>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{section.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
