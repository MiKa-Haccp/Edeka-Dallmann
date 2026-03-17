import { AppLayout } from "@/components/layout/AppLayout";
import { useListCategories } from "@workspace/api-client-react";
import { ShieldCheck, AlertCircle, FileCheck, ArrowRight, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: categories, isLoading } = useListCategories();

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-border shadow-sm p-5 sm:p-8 md:p-12">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-10 pointer-events-none hidden sm:block">
             <ShieldCheck className="w-96 h-96 text-primary" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 sm:mb-6">
              <Activity className="w-4 h-4" /> System Status: Online
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
              Guten Morgen,<br/>
              <span className="text-primary">Ihre HACCP Übersicht.</span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground">
              Verwalten Sie alle Kontrollpunkte, Reinigungsprotokolle und Temperaturmessungen zentral. Wählen Sie einen Bereich, um fortzufahren.
            </p>
          </div>
        </div>

        {/* Quick Stats (Mocked for dashboard feel) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm shadow-black/5 flex items-start gap-3 sm:gap-4">
            <div className="p-3 bg-green-500/10 text-green-600 rounded-xl">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Erledigte Prüfungen</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">142</h3>
              <p className="text-xs text-green-600 font-medium mt-1">Dieser Monat</p>
            </div>
          </div>
          <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm shadow-black/5 flex items-start gap-3 sm:gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Anstehend Heute</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">12</h3>
              <p className="text-xs text-amber-600 font-medium mt-1">Aktion erforderlich</p>
            </div>
          </div>
          <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm shadow-black/5 flex items-start gap-3 sm:gap-4">
            <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Grenzwerte Überschritten</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">0</h3>
              <p className="text-xs text-green-600 font-medium mt-1">Alles im grünen Bereich</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">HACCP Bereiche</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {isLoading ? (
              [1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-white border border-border animate-pulse" />)
            ) : categories?.map((cat) => (
              <div key={cat.id} className="group bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 flex flex-col">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{cat.label}</h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    Kontrolllisten und Dokumentationen für {cat.name.toLowerCase()}.
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-border/50">
                  <Link href={`/category/${cat.id}`} className="inline-flex items-center text-sm font-bold text-primary group-hover:gap-2 transition-all">
                    Bereich öffnen <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
