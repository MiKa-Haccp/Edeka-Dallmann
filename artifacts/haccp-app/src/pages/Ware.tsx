import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "wouter";
import { Package, ArrowRight, ShoppingCart, Truck, CalendarCheck, ChevronLeft } from "lucide-react";

interface BereichCard {
  id: string; icon: React.ElementType; title: string; description: string;
  href: string; iconColor: string; iconBg: string; badge?: string;
}

const BEREICHE: BereichCard[] = [
  {
    id: "bestellungen",
    icon: ShoppingCart,
    title: "Bestellungen",
    description: "Marktübersicht nach Rayons. Mitarbeiter haken jeden Bereich nach erfolgter Bestellung ab.",
    href: "/ware-bestellungen",
    iconColor: "text-[#f94d00]",
    iconBg: "bg-orange-100",
    badge: "Aktiv",
  },
  {
    id: "einraeumservice",
    icon: Truck,
    title: "Einräumservice",
    description: "Dokumentation externer Dienstleister. Erfassung von Paletten, Personalstärke, Zeitraum und Anmerkungen.",
    href: "/ware-einraeumservice",
    iconColor: "text-[#f94d00]",
    iconBg: "bg-orange-100",
    badge: "Aktiv",
  },
  {
    id: "mhd",
    icon: CalendarCheck,
    title: "MHD Kontrolle",
    description: "Qualitätssicherung nach Regalmetern. Kontrollintervalle, Reduzierungs- und Entnahmekriterien pro Regalbereich.",
    href: "/ware-mhd",
    iconColor: "text-[#f94d00]",
    iconBg: "bg-orange-100",
    badge: "Aktiv",
  },
];

export default function Ware() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <PageHeader className="from-[#c73d00] to-[#f94d00]">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ware</h1>
              <p className="text-white/70 text-sm">Bestellungen, Einräumservice und MHD-Kontrolle.</p>
            </div>
          </div>
        </PageHeader>

        {/* Karten */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BEREICHE.map(b => {
            const Icon = b.icon;
            return (
              <Link
                key={b.id}
                href={b.href}
                className="group bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-[#f94d00]/30 transition-all duration-200 p-6 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${b.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${b.iconColor}`} />
                  </div>
                  {b.badge && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">{b.badge}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{b.description}</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#f94d00] group-hover:gap-3 transition-all duration-200">
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
