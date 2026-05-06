import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ShieldCheck, ArrowRight,
  Lock, UserCog, Package, Settings, ClipboardList, FolderKanban,
} from "lucide-react";
import { Link } from "wouter";
import { FaelligkeitenWidget } from "@/components/FaelligkeitenWidget";
import { useState, useEffect } from "react";

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
  requiredRoles?: string[];
  requiredPermission?: string;
}

const MODULES: ModuleCard[] = [
  {
    id: "haccp",
    icon: ShieldCheck,
    title: "HACCP",
    description: "Lebensmittelhygiene, Temperaturkontrollen, Reinigungspläne und Betriebsbegehungen für alle Filialen.",
    href: "/haccp",
    color: "text-[#1a3a6b]",
    bgColor: "bg-[#1a3a6b]/10",
    available: true,
    badge: "Aktiv",
  },
  {
    id: "ware",
    icon: Package,
    title: "Ware",
    description: "Wareneingangskontrolle für Markt und Metzgerei. Temperatur, Qualität, MSC-Prüfung und Lieferantenbewertung.",
    href: "/ware",
    color: "text-[#f94d00]",
    bgColor: "bg-orange-50",
    available: true,
    badge: "Aktiv",
  },
  {
    id: "todo",
    icon: ClipboardList,
    title: "To-Do & Einsatzplan",
    description: "Tägliche Standardaufgaben, Ad-hoc-Rundgang mit Fotoerfassung und Kasseneinteilung für den Markt.",
    href: "/todo",
    color: "text-[#1a3a6b]",
    bgColor: "bg-[#1a3a6b]/10",
    available: true,
    badge: "Aktiv",
  },
  {
    id: "projekt",
    icon: FolderKanban,
    title: "Projekt-Hub",
    description: "Projektübersicht, kombiniertes Logbuch für E-Mails und Notizen sowie Aufgaben-Workflows mit Freigabelogik.",
    href: "/projekt-hub",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    available: true,
    badge: "Aktiv",
  },
  {
    id: "verwaltung",
    icon: UserCog,
    title: "Verwaltung",
    description: "Mitarbeiterstammdaten, Kürzel-Vergabe und PIN-Management für Kontrollen und Unterschriften.",
    href: "/verwaltung",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    available: true,
    badge: "Verwaltung",
  },
  {
    id: "system",
    icon: Settings,
    title: "Systemverwaltung",
    description: "Rollenverwaltung, Benutzerrechte und Geräteverwaltung. Nur für Systemadministratoren.",
    href: "/admin/system",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    available: true,
    badge: "System",
    requiredRoles: ["SUPERADMIN"],
    requiredPermission: "settings.manage",
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function Dashboard() {
  const { adminSession } = useAppStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [moduleSettings, setModuleSettings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    // Rollen-spezifische Sichtbarkeit laden wenn eingeloggt
    const role = adminSession?.role;
    const url = role
      ? `${API_BASE}/module-visibility?tenantId=1&role=${encodeURIComponent(role)}`
      : `${API_BASE}/module-visibility?tenantId=1`;
    fetch(url)
      .then(r => r.json())
      .then(data => setModuleSettings(data.settings || {}))
      .catch(() => {});
  }, [adminSession?.role]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] p-6 sm:p-10 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10 pointer-events-none hidden sm:block">
            <ShieldCheck className="w-80 h-80" />
          </div>
          <div className="relative z-10">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-bold uppercase tracking-wider mb-4`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-green-400" : "bg-red-400"}`} />
              {isOnline ? "Online" : "Offline"}
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 leading-tight">
              {getGreeting()}{adminSession?.name ? `, ${adminSession.userId === 17 ? "Michi" : adminSession.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-blue-100 text-sm sm:text-base max-w-xl mt-1">
              Willkommen bei Edeka Dallmann. Wählen Sie ein Modul um fortzufahren.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Module</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MODULES.filter((mod) => {
              // SUPERADMIN sieht immer alle Module
              const isSuperAdmin = adminSession?.role === "SUPERADMIN";

              // Modul-Sichtbarkeit: ausgeblendete Module für normale Nutzer verstecken
              if (!isSuperAdmin && moduleSettings[mod.id] === false) return false;

              // Module ohne Rollenbeschränkung sind für alle sichtbar
              if (!mod.requiredRoles && !mod.requiredPermission) return true;
              // Eingeschränkte Module nur für eingeloggte Admins
              if (!adminSession) return false;
              // Prüfe requiredPermission zuerst (aus role_permission_defaults)
              if (mod.requiredPermission) {
                const perms = adminSession.permissions || [];
                if (perms.includes(mod.requiredPermission)) return true;
              }
              // Fallback: requiredRoles prüfen
              if (mod.requiredRoles) {
                return mod.requiredRoles.includes(adminSession.role);
              }
              return true;
            }).map((mod) => {
              const Icon = mod.icon;
              const badgeColors: Record<string, string> = {
                "Aktiv": "bg-green-100 text-green-700",
                "Verwaltung": "bg-teal-100 text-teal-700",
                "System": "bg-purple-100 text-purple-700",
              };
              const badgeClass = badgeColors[mod.badge ?? ""] ?? "bg-secondary text-foreground";
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
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
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

        <FaelligkeitenWidget />

      </div>
    </AppLayout>
  );
}
