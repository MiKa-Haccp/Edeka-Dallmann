import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft, ShieldCheck, Package, ClipboardList, UserCog, FolderKanban,
  LayoutGrid, Eye, EyeOff, Loader2
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface ModuleDef {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  iconColor: string;
}

const MODULES: ModuleDef[] = [
  {
    id: "haccp",
    title: "HACCP",
    description: "Lebensmittelhygiene, Temperaturkontrollen, Reinigungspläne und Betriebsbegehungen.",
    icon: ShieldCheck,
    color: "border-[#1a3a6b]/30",
    bgColor: "bg-[#1a3a6b]/10",
    iconColor: "text-[#1a3a6b]",
  },
  {
    id: "ware",
    title: "Ware",
    description: "Wareneingangskontrolle für Markt und Metzgerei, Temperatur, Qualität, MSC-Prüfung.",
    icon: Package,
    color: "border-[#c73d00]/30",
    bgColor: "bg-orange-50",
    iconColor: "text-[#c73d00]",
  },
  {
    id: "todo",
    title: "To-Do & Einsatzplan",
    description: "Tägliche Standardaufgaben, Ad-hoc-Rundgang mit Fotoerfassung und Kasseneinteilung.",
    icon: ClipboardList,
    color: "border-[#1a3a6b]/30",
    bgColor: "bg-[#1a3a6b]/10",
    iconColor: "text-[#1a3a6b]",
  },
  {
    id: "verwaltung",
    title: "Verwaltung",
    description: "Mitarbeiterstammdaten, Kürzel-Vergabe und PIN-Management für Kontrollen.",
    icon: UserCog,
    color: "border-teal-300",
    bgColor: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    id: "projekt",
    title: "Projekt-Hub",
    description: "Projektübersicht, kombiniertes Logbuch und Aufgaben-Workflows mit Freigabelogik.",
    icon: FolderKanban,
    color: "border-indigo-300",
    bgColor: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
];

function Toggle({ enabled, onChange, loading }: { enabled: boolean; onChange: (v: boolean) => void; loading: boolean }) {
  return (
    <button
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
        enabled ? "bg-green-500" : "bg-gray-300"
      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function ModuleVerwaltung() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!adminSession || adminSession.role !== "SUPERADMIN") {
      navigate("/");
      return;
    }
    fetch(`${API_BASE}/module-visibility?tenantId=1`)
      .then(r => r.json())
      .then(data => {
        setSettings(data.settings || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [adminSession, navigate]);

  if (!adminSession || adminSession.role !== "SUPERADMIN") return null;

  async function handleToggle(moduleId: string, enabled: boolean) {
    setSaving(moduleId);
    try {
      await fetch(`${API_BASE}/module-visibility`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: 1, moduleId, enabled }),
      });
      setSettings(prev => ({ ...prev, [moduleId]: enabled }));
      setSaved(moduleId);
      setTimeout(() => setSaved(null), 2000);
    } catch {
    } finally {
      setSaving(null);
    }
  }

  const enabledCount = MODULES.filter(m => settings[m.id] !== false).length;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/admin/system" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Modul-Sichtbarkeit</h1>
              <p className="text-white/70 text-sm">Module für alle Benutzer ein- oder ausschalten.</p>
            </div>
          </div>
        </PageHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 text-sm text-blue-800 flex items-start gap-3">
          <Eye className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
          <div>
            <p className="font-semibold mb-1">Sichtbarkeit für alle Benutzer</p>
            <p className="text-blue-700">Deaktivierte Module werden auf der Startseite ausgeblendet. Systemadministratoren sehen immer alle Module. Aktuell aktiv: <strong>{enabledCount} von {MODULES.length}</strong> Module.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#1a3a6b] animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {MODULES.map(mod => {
              const enabled = settings[mod.id] !== false;
              const isSaving = saving === mod.id;
              const isSaved = saved === mod.id;
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 transition-all duration-200 ${
                    enabled ? `${mod.color}` : "border-gray-200 opacity-60"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl ${mod.bgColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${mod.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-foreground text-sm">{mod.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {isSaved ? "Gespeichert ✓" : enabled ? "Sichtbar" : "Ausgeblendet"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : enabled ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <Toggle
                      enabled={enabled}
                      onChange={(v) => handleToggle(mod.id, v)}
                      loading={isSaving}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Hinweis</p>
          <p className="text-amber-700">Änderungen gelten sofort nach dem nächsten Seitenaufruf. Benutzer die bereits eingeloggt sind sehen die Änderung nach einem Reload.</p>
        </div>
      </div>
    </AppLayout>
  );
}
