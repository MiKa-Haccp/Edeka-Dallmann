import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "wouter";
import { ShieldCheck, ChevronLeft, ClipboardList, ShoppingCart, Beef } from "lucide-react";
import {
  useWarenzustandOGStatus, useReinigungTaeglichStatus, useWareneingaengeStatus,
  useMetzgereiWareneingaengeStatus, useMetzgereiReinigungStatus, useKaesethekeStatus,
  useOeffnungSalateStatus, useGQBegehungStatus, useSchulungsnachweiseStatus,
  useResponsibilitiesStatus, useAnnualCleaningPlanStatus, useBetriebsbegehungStatus,
  useTempLagerStatus,
  type TrafficLight,
} from "@/hooks/useWarenzustandStatus";

// ===== AMPEL-ZUSAMMENFASSUNG =====
function AmpelSummary({ statuses }: { statuses: TrafficLight[] }) {
  const active = statuses.filter(s => s !== "none");
  if (active.length === 0) return null;

  const green  = active.filter(s => s === "green").length;
  const yellow = active.filter(s => s === "yellow").length;
  const red    = active.filter(s => s === "red").length;

  return (
    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-black/5 flex-wrap">
      {red > 0 && (
        <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />{red}
        </span>
      )}
      {yellow > 0 && (
        <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />{yellow}
        </span>
      )}
      {green > 0 && (
        <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />{green}
        </span>
      )}
    </div>
  );
}

// ===== HAUPTSEITE =====
export default function HaccpOverview() {
  // Kategorie 1 – Allgemein
  const responsibilitiesStatus   = useResponsibilitiesStatus();
  const schulungsnachweiseStatus = useSchulungsnachweiseStatus();
  const cleaningPlanStatus       = useAnnualCleaningPlanStatus();
  const betriebsbegehungStatus   = useBetriebsbegehungStatus();
  const tempLagerStatus          = useTempLagerStatus();

  // Kategorie 2 – Markt
  const ogStatus           = useWarenzustandOGStatus();
  const reinigungStatus    = useReinigungTaeglichStatus();
  const wareneingaengeStatus = useWareneingaengeStatus();

  // Kategorie 3 – Metzgerei
  const metzgereiStatus     = useMetzgereiWareneingaengeStatus();
  const metzReinigungStatus = useMetzgereiReinigungStatus();
  const oeffnungSalateStatus = useOeffnungSalateStatus();
  const kaesethekeStatus    = useKaesethekeStatus();
  const gqBegehungStatus    = useGQBegehungStatus();

  const cat1: TrafficLight[] = [responsibilitiesStatus, schulungsnachweiseStatus, cleaningPlanStatus, betriebsbegehungStatus, tempLagerStatus];
  const cat2: TrafficLight[] = [ogStatus, reinigungStatus, wareneingaengeStatus];
  const cat3: TrafficLight[] = [metzgereiStatus, metzReinigungStatus, oeffnungSalateStatus, kaesethekeStatus, gqBegehungStatus];

  const KATEGORIEN = [
    {
      id: 1,
      nummer: "HACCP 1",
      titel: "Allgemein",
      beschreibung: "Verantwortlichkeiten, Mitarbeiter, Schulungen, Betriebsbegehungen, Reinigungspläne und allgemeine Dokumentation.",
      icon: ShieldCheck,
      color: "text-[#1a3a6b]",
      bgColor: "bg-[#1a3a6b]/10",
      borderColor: "border-[#1a3a6b]/20",
      hoverBg: "hover:bg-[#1a3a6b]/5",
      href: "/category/1",
      statuses: cat1,
    },
    {
      id: 2,
      nummer: "HACCP 2",
      titel: "Markt",
      beschreibung: "Warenzustand Obst & Gemüse, tägliche Reinigung, Carrier-Portal und Wareneingänge.",
      icon: ShoppingCart,
      color: "text-[#1a3a6b]",
      bgColor: "bg-[#1a3a6b]/10",
      borderColor: "border-[#1a3a6b]/20",
      hoverBg: "hover:bg-[#1a3a6b]/5",
      href: "/category/2",
      statuses: cat2,
    },
    {
      id: 3,
      nummer: "HACCP 3",
      titel: "Metzgerei",
      beschreibung: "Wareneingänge Metzgerei, Reinigungsplan, Öffnung Salate, Käsetheke, Semmelliste, Rezepturen und GQ-Begehung.",
      icon: Beef,
      color: "text-[#1a3a6b]",
      bgColor: "bg-[#1a3a6b]/10",
      borderColor: "border-[#1a3a6b]/20",
      hoverBg: "hover:bg-[#1a3a6b]/5",
      href: "/category/3",
      statuses: cat3,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">HACCP Modul</h1>
              <p className="text-sm text-white/70">Wählen Sie einen Bereich</p>
            </div>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 gap-4">
          {KATEGORIEN.map((kat) => {
            const Icon = kat.icon;
            return (
              <Link
                key={kat.id}
                href={kat.href}
                className={`group flex flex-col bg-white rounded-2xl border ${kat.borderColor} shadow-sm p-5 transition-all duration-200 hover:shadow-md ${kat.hoverBg}`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl ${kat.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-8 h-8 ${kat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold uppercase tracking-wide ${kat.color}`}>{kat.nummer}</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-gray-700">{kat.titel}</h2>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{kat.beschreibung}</p>
                  </div>
                  <ClipboardList className={`w-5 h-5 ${kat.color} opacity-40 group-hover:opacity-70 flex-shrink-0 transition-opacity`} />
                </div>

                {/* Ampel-Zusammenfassung */}
                <AmpelSummary statuses={kat.statuses} />
              </Link>
            );
          })}
        </div>

      </div>
    </AppLayout>
  );
}
