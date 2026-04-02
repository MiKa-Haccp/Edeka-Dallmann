import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "wouter";
import { ShoppingCart, ArrowRight, Store, ChevronLeft } from "lucide-react";

interface SubCard {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}

const UNTERPUNKTE: SubCard[] = [
  {
    id: "laden",
    icon: Store,
    title: "Ladenbestellung",
    description: "Bestellungen für den Laden erfassen und verwalten.",
    href: "/ware-ladenbestellung",
  },
  {
    id: "rayon",
    icon: ShoppingCart,
    title: "Streckenbestellung",
    description: "Marktübersicht nach Rayons. Mitarbeiter haken jeden Bereich nach erfolgter Bestellung ab.",
    href: "/ware-streckenbestellung",
  },
];

export default function WareBestellungenHub() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <PageHeader className="from-[#c2410c] to-[#ea580c]">
          <div className="flex items-center gap-3">
            <Link href="/ware" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Bestellungen</h1>
              <p className="text-white/70 text-sm">Ladenbestellung und Streckenbestellung.</p>
            </div>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {UNTERPUNKTE.map(b => {
            const Icon = b.icon;
            return (
              <Link
                key={b.id}
                href={b.href}
                className="group bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-[#c2410c]/30 transition-all duration-200 p-6 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-[#c2410c]" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Aktiv</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{b.description}</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#c2410c] group-hover:gap-3 transition-all duration-200">
                  Öffnen <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </AppLayout>
  );
}
