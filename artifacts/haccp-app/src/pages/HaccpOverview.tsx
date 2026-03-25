import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { ShieldCheck, ChevronLeft, ClipboardList, ShoppingCart, Beef } from "lucide-react";

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
    abschnitte: "1.1 – 1.12",
  },
  {
    id: 2,
    nummer: "HACCP 2",
    titel: "Markt",
    beschreibung: "Warenzustand Obst & Gemüse, tägliche Reinigung, Carrier-Portal, Wareneingänge und Marktkontrollen.",
    icon: ShoppingCart,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    hoverBg: "hover:bg-emerald-50/50",
    href: "/category/2",
    abschnitte: "2.1 – 2.5",
  },
  {
    id: 3,
    nummer: "HACCP 3",
    titel: "Metzgerei",
    beschreibung: "Wareneingänge Metzgerei, Reinigungsplan, Öffnung Salate, Käsetheke, Semmelliste, Rezepturen und GQ-Begehung.",
    icon: Beef,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    hoverBg: "hover:bg-red-50/50",
    href: "/category/3",
    abschnitte: "3.1 – 3.9",
  },
];

export default function HaccpOverview() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">HACCP Modul</h1>
            <p className="text-sm text-gray-500">Wählen Sie einen Bereich</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {KATEGORIEN.map((kat) => {
            const Icon = kat.icon;
            return (
              <Link
                key={kat.id}
                href={kat.href}
                className={`group flex items-center gap-5 bg-white rounded-2xl border ${kat.borderColor} shadow-sm p-5 transition-all duration-200 hover:shadow-md ${kat.hoverBg}`}
              >
                <div className={`w-16 h-16 rounded-2xl ${kat.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-8 h-8 ${kat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-bold uppercase tracking-wide ${kat.color}`}>{kat.nummer}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{kat.abschnitte}</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-gray-700">{kat.titel}</h2>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{kat.beschreibung}</p>
                </div>
                <ClipboardList className={`w-5 h-5 ${kat.color} opacity-40 group-hover:opacity-70 flex-shrink-0 transition-opacity`} />
              </Link>
            );
          })}
        </div>

      </div>
    </AppLayout>
  );
}
