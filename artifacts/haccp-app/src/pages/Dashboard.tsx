import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ShieldCheck, ArrowRight, Activity, ClipboardList, CheckSquare,
  RefreshCw, BarChart3, Lock, Clock, Users
} from "lucide-react";
import { Link } from "wouter";

interface ModuleCard {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
  bgColor: string;
  available: boolean;
  badge?: string;
}

const MODULES: ModuleCard[] = [
  {
    id: "haccp",
    icon: ShieldCheck,
    title: "HACCP",
    description: "Lebensmittelhygiene, Temperaturkontrollen, Reinigungspläne und Betriebsbegehungen für alle Filialen.",
    href: "/category/1",
    color: "text-[#1a3a6b]",
    bgColor: "bg-[#1a3a6b]/10",
    available: true,
    badge: "Aktiv",
  },
  {
    id: "todos",
    icon: CheckSquare,
    title: "To-Do Listen",
    description: "Aufgabenverwaltung für Marktleiter und Teams. Erstellen, zuweisen und verfolgen Sie Aufgaben.",
    href: "#",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    available: false,
    badge: "Bald verfügbar",
  },
  {
    id: "revisionen",
    icon: ClipboardList,
    title: "Revisionen",
    description: "Prüfprotokolle, Revisionsberichte und Nachverfolgung von Maßnahmen.",
    href: "#",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    available: false,
    badge: "Geplant",
  },
  {
    id: "berichte",
    icon: BarChart3,
    title: "Berichte & Analysen",
    description: "Auswertungen, Statistiken und exportierbare Reports über alle Module.",
    href: "#",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    available: false,
    badge: "Geplant",
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

export default function Dashboard() {
  const { adminSession } = useAppStore();

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] p-6 sm:p-10 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10 pointer-events-none hidden sm:block">
            <ShieldCheck className="w-80 h-80" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-bold uppercase tracking-wider mb-4">
              <Activity className="w-3.5 h-3.5" /> System Online
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 leading-tight">
              {getGreeting()}{adminSession ? `, ${adminSession.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-blue-100 text-sm sm:text-base max-w-xl">
              Willkommen bei der EDEKA DALLMANN Plattform. Wählen Sie ein Modul, um fortzufahren.
            </p>

            <div className="flex flex-wrap gap-3 mt-5">
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold">3</div>
                <div className="text-xs text-blue-200">Filialen</div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold">1</div>
                <div className="text-xs text-blue-200">Aktive Module</div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold">3</div>
                <div className="text-xs text-blue-200">Module geplant</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Module</h2>
            <span className="text-xs text-muted-foreground">Weitere Module werden laufend ergänzt</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className={`group relative bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden transition-all duration-300 ${mod.available ? "hover:shadow-md hover:border-[#1a3a6b]/30" : "opacity-70"}`}
                >
                  {!mod.available && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                      <div className="flex items-center gap-2 bg-white border border-border/60 rounded-xl px-4 py-2 shadow-sm">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">{mod.badge}</span>
                      </div>
                    </div>
                  )}
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${mod.bgColor} flex items-center justify-center ${mod.available ? "group-hover:scale-110 transition-transform" : ""}`}>
                        <Icon className={`w-6 h-6 ${mod.color}`} />
                      </div>
                      {mod.available && mod.badge && (
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                          {mod.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{mod.title}</h3>
                    <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{mod.description}</p>
                    {mod.available && (
                      <div className="mt-4 pt-4 border-t border-border/40">
                        <Link
                          href={mod.href}
                          className={`inline-flex items-center gap-1.5 text-sm font-bold ${mod.color} group-hover:gap-3 transition-all duration-200`}
                        >
                          Modul öffnen <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {adminSession && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" /> Admin-Schnellzugriff
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/users"
                className="flex items-center gap-2 px-4 py-2 bg-[#1a3a6b]/5 hover:bg-[#1a3a6b]/10 text-[#1a3a6b] rounded-xl text-sm font-semibold transition-colors border border-[#1a3a6b]/10"
              >
                <Users className="w-4 h-4" /> Benutzerverwaltung
              </Link>
              <Link
                href="/user-registry"
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-sm font-semibold transition-colors"
              >
                <ClipboardList className="w-4 h-4" /> Kürzelliste
              </Link>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
