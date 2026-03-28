import { AppLayout } from "@/components/layout/AppLayout";
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
    id: "rayon",
    icon: ShoppingCart,
    title: "Rayon-Bestellungen",
    description: "Marktübersicht nach Rayons. Mitarbeiter haken jeden Bereich nach erfolgter Bestellung ab.",
    href: "/ware-rayon-bestellungen",
  },
  {
    id: "laden",
    icon: Store,
    title: "Ladenbestellung",
    description: "Bestellungen für den Laden erfassen und verwalten.",
    href: "/ware-ladenbestellung",
  },
];

export default function WareBestellungenHub() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <div className="flex items-center gap-3">
          <Link href="/ware" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 text-[#1a3a6b]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground mb-0.5">Bestellungen</h1>
            <p className="text-muted-foreground text-sm">Rayon-Bestellungen und Ladenbestellung.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {UNTERPUNKTE.map(b => {
            const Icon = b.icon;
            return (
              <Link
                key={b.id}
                href={b.href}
                className="group bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-[#1a3a6b]/30 transition-all duration-200 p-6 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-[#1a3a6b]" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Aktiv</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{b.description}</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#1a3a6b] group-hover:gap-3 transition-all duration-200">
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
