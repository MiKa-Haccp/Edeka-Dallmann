import { AppLayout } from "@/components/layout/AppLayout";
import { useWareneingaengeStatus, useMetzgereiWareneingaengeStatus, type TrafficLight } from "@/hooks/useWarenzustandStatus";
import { Link } from "wouter";
import {
  Package, ArrowRight, Fish, Beef, ShoppingCart,
  CircleCheck, CircleAlert, Circle, MinusCircle,
} from "lucide-react";

function TrafficDot({ status }: { status: TrafficLight }) {
  if (status === "green")  return <span className="flex items-center gap-1.5 text-green-600 text-xs font-semibold"><CircleCheck className="w-4 h-4" /> Erledigt</span>;
  if (status === "red")    return <span className="flex items-center gap-1.5 text-red-600 text-xs font-semibold"><CircleAlert className="w-4 h-4" /> Offen / Problem</span>;
  if (status === "yellow") return <span className="flex items-center gap-1.5 text-amber-500 text-xs font-semibold"><Circle className="w-4 h-4" /> Teilweise erledigt</span>;
  return <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold"><MinusCircle className="w-4 h-4" /> Kein Liefertag</span>;
}

function statusBorder(s: TrafficLight) {
  if (s === "green")  return "border-green-400/60";
  if (s === "red")    return "border-red-400/60";
  if (s === "yellow") return "border-amber-400/60";
  return "border-border/60";
}

function statusBg(s: TrafficLight) {
  if (s === "green")  return "bg-green-50";
  if (s === "red")    return "bg-red-50";
  if (s === "yellow") return "bg-amber-50";
  return "bg-white";
}

interface AreaCard {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  status: TrafficLight;
}

function AreaCard({ title, subtitle, href, icon: Icon, iconColor, iconBg, status }: AreaCard) {
  return (
    <Link href={href}>
      <div className={`group relative bg-white rounded-2xl border-2 ${statusBorder(status)} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer`}>
        <div className={`absolute inset-x-0 top-0 h-1 ${status === "green" ? "bg-green-400" : status === "red" ? "bg-red-400" : status === "yellow" ? "bg-amber-400" : "bg-border"}`} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <TrafficDot status={status} />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{subtitle}</p>
          <div className="flex items-center gap-1.5 text-sm font-bold text-[#1a3a6b] group-hover:gap-3 transition-all duration-200">
            Jetzt prüfen <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Ware() {
  const marktStatus     = useWareneingaengeStatus();
  const metzgereiStatus = useMetzgereiWareneingaengeStatus();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 to-orange-400 p-6 sm:p-10 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 opacity-10 pointer-events-none hidden sm:block">
            <Package className="w-72 h-72" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white/90 text-xs font-bold uppercase tracking-wider mb-4">
              <ShoppingCart className="w-3.5 h-3.5" /> Wareneingangskontrolle
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 leading-tight">Ware</h1>
            <p className="text-orange-100 text-sm sm:text-base max-w-xl">
              Wareneingangskontrolle fur Markt und Metzgerei. Temperatur, Qualitat, MSC und Lieferantenbewertung auf einen Blick.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Bereiche</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AreaCard
              title="2.5 Wareneingaenge Markt"
              subtitle="MoPro, Obst & Gemuse, TK und alle Marktlieferanten. Tagliche Eingangsprufung mit Temperaturen und Kriterien."
              href="/wareneingaenge"
              icon={ShoppingCart}
              iconColor="text-[#1a3a6b]"
              iconBg="bg-[#1a3a6b]/10"
              status={marktStatus}
            />
            <AreaCard
              title="3.1 Wareneingaenge Metzgerei"
              subtitle="Fleisch, Frischfisch und MSC-Fisch. Erweiterte Eingangsprufung mit Fischqualitats- und MSC-Kriterien."
              href="/metzgerei-wareneingaenge"
              icon={Fish}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
              status={metzgereiStatus}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Beef className="w-4 h-4 text-muted-foreground" /> Schnellzugriff Lieferanten
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "SBF", href: "/metzgerei-wareneingaenge" },
              { label: "Deutsche See", href: "/metzgerei-wareneingaenge" },
              { label: "Grimmer", href: "/metzgerei-wareneingaenge" },
              { label: "Haller", href: "/metzgerei-wareneingaenge" },
              { label: "Schonegger", href: "/metzgerei-wareneingaenge" },
              { label: "Friedis Kase", href: "/metzgerei-wareneingaenge" },
              { label: "Slottke", href: "/metzgerei-wareneingaenge" },
              { label: "MoPro", href: "/wareneingaenge" },
              { label: "Obst & Gemuse", href: "/wareneingaenge" },
              { label: "TK Edeka", href: "/wareneingaenge" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors border border-border/40"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
