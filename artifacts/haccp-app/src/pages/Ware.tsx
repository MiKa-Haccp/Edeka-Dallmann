import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { Package, ArrowRight, ShoppingCart, Truck, CalendarCheck } from "lucide-react";

interface BereichCard {
  id: string; icon: React.ElementType; title: string; description: string;
  href: string; iconColor: string; iconBg: string; accentColor: string; badge?: string;
}

const BEREICHE: BereichCard[] = [
  {
    id: "bestellungen",
    icon: ShoppingCart,
    title: "Bestellungen",
    description: "Marktubersicht nach Rayons. Mitarbeiter haken jeden Bereich nach erfolgter Bestellung ab. Echtzeit-Status welche Bereiche bereits bestellt wurden.",
    href: "/ware-bestellungen",
    iconColor: "text-[#1a3a6b]",
    iconBg: "bg-[#1a3a6b]/10",
    accentColor: "bg-[#1a3a6b]",
    badge: "Aktiv",
  },
  {
    id: "einraeumservice",
    icon: Truck,
    title: "Einraumservice",
    description: "Dokumentation externer Dienstleister. Erfassung von Paletten, Personalstarke, Zeitraum und Anmerkungen zur spateren Rechnungsprufung.",
    href: "/ware-einraeumservice",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    accentColor: "bg-blue-600",
    badge: "Aktiv",
  },
  {
    id: "mhd",
    icon: CalendarCheck,
    title: "MHD Kontrolle",
    description: "Qualitassicherung nach Regalmetern. Kontrollintervalle, Reduzierungs- und Entnahmekriterien pro Regalbereich. Interaktiver Ladenplan als Ziel.",
    href: "/ware-mhd",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
    accentColor: "bg-orange-500",
    badge: "Aktiv",
  },
];

export default function Ware() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 to-orange-400 p-6 sm:p-10 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 opacity-10 pointer-events-none hidden sm:block">
            <Package className="w-72 h-72" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white/90 text-xs font-bold uppercase tracking-wider mb-4">
              <Package className="w-3.5 h-3.5" /> Warenmanagement
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 leading-tight">Ware</h1>
            <p className="text-orange-100 text-sm sm:text-base max-w-xl">
              Zentrale Steuerung fur Warenbestellung, Logistik-Controlling und MHD-Management.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold">3</div>
                <div className="text-xs text-orange-100">Bereiche</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Bereiche</h2>
            <span className="text-xs text-muted-foreground">Weitere Bereiche werden laufend erganzt</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BEREICHE.map(b => {
              const Icon = b.icon;
              return (
                <Link key={b.id} href={b.href}>
                  <div className="group relative bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer hover:border-orange-200/80">
                    <div className={`absolute inset-x-0 top-0 h-1 ${b.accentColor}`} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl ${b.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-6 h-6 ${b.iconColor}`} />
                        </div>
                        {b.badge && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">{b.badge}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-1">{b.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{b.description}</p>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-orange-600 group-hover:gap-3 transition-all duration-200">
                        Oeffnen <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
