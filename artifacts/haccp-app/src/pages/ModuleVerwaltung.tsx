import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft, ShieldCheck, Package, ClipboardList, UserCog, FolderKanban,
  LayoutGrid, Eye, EyeOff, Loader2, Info, Users, Store, Building2, Shield,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const MODULES_CONFIG = [
  { id: "haccp",      label: "HACCP",               icon: ShieldCheck,   desc: "Lebensmittelhygiene und Temperaturkontrollen" },
  { id: "ware",       label: "Ware",                icon: Package,       desc: "Wareneingangskontrolle und Lieferanten" },
  { id: "todo",       label: "To-Do & Einsatzplan", icon: ClipboardList, desc: "Tagesaufgaben, Rundgänge und Kasseneinteilung" },
  { id: "verwaltung", label: "Verwaltung",           icon: UserCog,       desc: "Mitarbeiterstammdaten und PIN-Management" },
  { id: "projekt",    label: "Projekt-Hub",          icon: FolderKanban,  desc: "Projektübersicht und Logbuch" },
];

const ROLES_CONFIG = [
  { key: "USER",            label: "Mitarbeiter",     icon: Users,     badgeCls: "bg-gray-100 text-gray-700 border-gray-200",      dotCls: "bg-gray-500" },
  { key: "MARKTLEITER",     label: "Marktleiter",     icon: Store,     badgeCls: "bg-emerald-100 text-emerald-700 border-emerald-200", dotCls: "bg-emerald-500" },
  { key: "BEREICHSLEITUNG", label: "Bereichsleitung", icon: Building2, badgeCls: "bg-indigo-100 text-indigo-700 border-indigo-200",  dotCls: "bg-indigo-500" },
  { key: "ADMIN",           label: "Administrator",   icon: Shield,    badgeCls: "bg-blue-100 text-blue-700 border-blue-200",       dotCls: "bg-blue-500" },
];

function Toggle({ enabled, onChange, loading }: { enabled: boolean; onChange: (v: boolean) => void; loading: boolean }) {
  return (
    <button
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
        enabled ? "bg-green-500" : "bg-gray-300"
      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {loading ? (
        <Loader2 className="absolute inset-0 m-auto w-3.5 h-3.5 text-white animate-spin" />
      ) : (
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-1"
        }`} />
      )}
    </button>
  );
}

export default function ModuleVerwaltung() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();

  // matrix[role][moduleId] = boolean
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  // savingKey: "ROLE:moduleId"
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!adminSession || adminSession.role !== "SUPERADMIN") {
      navigate("/");
      return;
    }
    fetch(`${API_BASE}/module-visibility/matrix?tenantId=1`)
      .then(r => r.json())
      .then(data => {
        setMatrix(data.matrix || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [adminSession, navigate]);

  if (!adminSession || adminSession.role !== "SUPERADMIN") return null;

  async function handleToggle(role: string, moduleId: string, visible: boolean) {
    const key = `${role}:${moduleId}`;
    setSavingKey(key);
    try {
      await fetch(`${API_BASE}/module-visibility`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: 1, role, moduleId, visible }),
      });
      setMatrix(prev => ({
        ...prev,
        [role]: { ...prev[role], [moduleId]: visible },
      }));
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
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
              <p className="text-sm text-white/70">Module pro Rolle ein- oder ausschalten.</p>
            </div>
          </div>
        </PageHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 text-sm text-blue-800 flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
          <div>
            <p className="font-semibold mb-1">Rollen-basierte Sichtbarkeit</p>
            <p className="text-blue-700">
              Hier legst du fest, welche Module jede Rolle auf der Startseite sehen kann.
              Superadmin sieht immer alle Module. Änderungen greifen beim nächsten Seitenaufruf.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#1a3a6b] animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {ROLES_CONFIG.map(roleConf => {
              const roleSettings = matrix[roleConf.key] || {};
              const visibleCount = MODULES_CONFIG.filter(m => roleSettings[m.id] !== false).length;
              const RoleIcon = roleConf.icon;

              return (
                <div key={roleConf.key} className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                  {/* Role Header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 bg-gray-50/60">
                    <div className="w-9 h-9 rounded-xl bg-white border border-border/40 flex items-center justify-center shadow-sm shrink-0">
                      <RoleIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{roleConf.label}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${roleConf.badgeCls}`}>
                          {visibleCount} von {MODULES_CONFIG.length} Module sichtbar
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Module Toggles */}
                  <div className="divide-y divide-border/30">
                    {MODULES_CONFIG.map(mod => {
                      const key = `${roleConf.key}:${mod.id}`;
                      const isVisible = roleSettings[mod.id] !== false;
                      const isSaving = savingKey === key;
                      const isSaved = savedKey === key;
                      const ModIcon = mod.icon;

                      return (
                        <div key={mod.id} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                          isVisible ? "" : "bg-gray-50/60"
                        }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isVisible ? "bg-[#1a3a6b]/8 text-[#1a3a6b]" : "bg-gray-100 text-gray-400"
                          }`}>
                            <ModIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold leading-tight ${isVisible ? "text-foreground" : "text-muted-foreground"}`}>
                              {mod.label}
                            </p>
                            <p className="text-xs text-muted-foreground leading-tight mt-0.5">{mod.desc}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isSaved ? (
                              <span className="text-xs font-semibold text-green-600">Gespeichert ✓</span>
                            ) : (
                              <span className={`text-xs font-medium ${isVisible ? "text-green-600" : "text-gray-400"}`}>
                                {isVisible ? <Eye className="w-3.5 h-3.5 inline-block" /> : <EyeOff className="w-3.5 h-3.5 inline-block" />}
                              </span>
                            )}
                            <Toggle
                              enabled={isVisible}
                              onChange={(v) => handleToggle(roleConf.key, mod.id, v)}
                              loading={isSaving}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Superadmin Hinweis */}
            <div className="bg-purple-50 border border-purple-200 rounded-2xl px-5 py-4 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-purple-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-purple-800">Superadmin</p>
                <p className="text-xs text-purple-700 mt-0.5">Superadmins sehen immer alle Module – diese Einstellung kann nicht geändert werden.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
