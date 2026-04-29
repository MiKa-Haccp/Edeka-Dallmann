import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  ChevronLeft, Shield, ShieldCheck, Users, Store, Lock,
  Check, X, Plus, Trash2, AlertTriangle, RefreshCw, Settings2,
  LayoutGrid, UserCog, Star, ClipboardList, ListChecks, Package,
  Building2, TrendingUp, FolderOpen, Cpu, ChevronDown, ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return twMerge(clsx(inputs));
}

interface RoleConfig {
  id: number;
  tenant_id: number;
  role: string;
  label: string;
  color: string;
  is_custom: boolean;
  permissions: string[];
  sort_order: number;
}

// Berechtigungen mit 2-Ebenen-Gliederung: group = Hauptbereich, section = Unterbereich
const PERMISSION_AREAS: { key: string; label: string; group: string; section: string }[] = [
  // ── HACCP ────────────────────────────────────────────────────────────────────
  { key: "entries.create",         label: "Einträge erstellen",                   group: "HACCP", section: "HACCP Einträge" },
  { key: "entries.view_all",       label: "Alle Einträge einsehen",               group: "HACCP", section: "HACCP Einträge" },
  { key: "entries.edit",           label: "Einträge bearbeiten",                  group: "HACCP", section: "HACCP Einträge" },
  { key: "entries.delete",         label: "Einträge löschen",                     group: "HACCP", section: "HACCP Einträge" },
  { key: "responsibilities.edit",  label: "Verantwortlichkeiten (1.1) bearbeiten",group: "HACCP", section: "HACCP Einträge" },
  { key: "reports.view",           label: "Berichte einsehen",                    group: "HACCP", section: "Berichte & Dokumente" },
  { key: "reports.export",         label: "Berichte exportieren",                 group: "HACCP", section: "Berichte & Dokumente" },
  { key: "reports.monatsbericht",  label: "Monatsbericht einsehen",               group: "HACCP", section: "Berichte & Dokumente" },
  { key: "reports.tuev",           label: "TÜV-Jahresbericht bearbeiten",         group: "HACCP", section: "Berichte & Dokumente" },
  { key: "schulungen.manage",      label: "Schulungsanforderungen verwalten",     group: "HACCP", section: "Schulungen" },
  { key: "metzgerei.access",       label: "Metzgerei-Bereiche aufrufen",          group: "HACCP", section: "Metzgerei" },
  { key: "metzgerei.gq_begehung",  label: "GQ-Begehung durchführen",             group: "HACCP", section: "Metzgerei" },
  // ── TODO & AUFGABEN ──────────────────────────────────────────────────────────
  { key: "todo.access",            label: "Todo-Listen aufrufen",                 group: "Todo & Aufgaben", section: "" },
  { key: "todo.manage",            label: "Todos und Rundgänge verwalten",        group: "Todo & Aufgaben", section: "" },
  { key: "todo.kassen",            label: "Kassenkontrolle aufrufen",             group: "Todo & Aufgaben", section: "" },
  // ── WARENWIRTSCHAFT ──────────────────────────────────────────────────────────
  { key: "ware.access",            label: "Waren-Bereich aufrufen",               group: "Warenwirtschaft", section: "" },
  { key: "ware.bestellungen",      label: "Bestellungen verwalten",               group: "Warenwirtschaft", section: "" },
  { key: "ware.mhd",               label: "MHD-Kontrolle durchführen",            group: "Warenwirtschaft", section: "" },
  // ── VERWALTUNG ───────────────────────────────────────────────────────────────
  { key: "verwaltung.access",      label: "Verwaltungsbereich aufrufen",          group: "Verwaltung", section: "Benutzerverwaltung" },
  { key: "users.view",             label: "Mitarbeiterliste einsehen",            group: "Verwaltung", section: "Benutzerverwaltung" },
  { key: "users.manage",           label: "Mitarbeiter verwalten (Kürzel/PIN)",   group: "Verwaltung", section: "Benutzerverwaltung" },
  { key: "users.invite_admin",     label: "Admins einladen",                      group: "Verwaltung", section: "Benutzerverwaltung" },
  { key: "devices.manage",         label: "Geräteverwaltung aufrufen",            group: "Verwaltung", section: "Geräte & Benachrichtigungen" },
  { key: "notifications.manage",   label: "Benachrichtigungsregeln verwalten",    group: "Verwaltung", section: "Geräte & Benachrichtigungen" },
  // ── MANAGEMENT ───────────────────────────────────────────────────────────────
  { key: "management.hub",         label: "Management Hub aufrufen",              group: "Management", section: "" },
  // ── PROJEKT ──────────────────────────────────────────────────────────────────
  { key: "projekt.access",         label: "Projekt-Hub aufrufen",                 group: "Projekt", section: "" },
  // ── SYSTEM ───────────────────────────────────────────────────────────────────
  { key: "settings.manage",        label: "Systemeinstellungen verwalten",        group: "System", section: "" },
  { key: "modules.manage",         label: "Modul-Sichtbarkeit verwalten",         group: "System", section: "" },
  { key: "sections.manage",        label: "Bereichs-Sichtbarkeit verwalten",      group: "System", section: "" },
  { key: "feedback.manage",        label: "Feedback & Bereinigung verwalten",     group: "System", section: "" },
];

// Alle Hauptbereiche in der richtigen Reihenfolge
const PERMISSION_GROUPS = [
  "HACCP", "Todo & Aufgaben", "Warenwirtschaft", "Verwaltung", "Management", "Projekt", "System"
];

// Icon und Farbe pro Hauptbereich
const GROUP_META: Record<string, { icon: typeof ClipboardList; color: string; bg: string; border: string }> = {
  "HACCP":           { icon: ClipboardList, color: "text-[#1a3a6b]", bg: "bg-[#1a3a6b]/8",  border: "border-[#1a3a6b]/20" },
  "Todo & Aufgaben": { icon: ListChecks,    color: "text-emerald-700", bg: "bg-emerald-50",   border: "border-emerald-200" },
  "Warenwirtschaft": { icon: Package,       color: "text-orange-700",  bg: "bg-orange-50",    border: "border-orange-200" },
  "Verwaltung":      { icon: Building2,     color: "text-slate-700",   bg: "bg-slate-50",     border: "border-slate-200" },
  "Management":      { icon: TrendingUp,    color: "text-purple-700",  bg: "bg-purple-50",    border: "border-purple-200" },
  "Projekt":         { icon: FolderOpen,    color: "text-teal-700",    bg: "bg-teal-50",      border: "border-teal-200" },
  "System":          { icon: Cpu,           color: "text-red-700",     bg: "bg-red-50",       border: "border-red-200" },
};

const COLOR_OPTIONS = [
  { key: "purple",  label: "Lila",   cls: "bg-purple-500" },
  { key: "blue",    label: "Blau",   cls: "bg-blue-500" },
  { key: "indigo",  label: "Indigo", cls: "bg-indigo-500" },
  { key: "emerald", label: "Grün",   cls: "bg-emerald-500" },
  { key: "teal",    label: "Teal",   cls: "bg-teal-500" },
  { key: "amber",   label: "Amber",  cls: "bg-amber-500" },
  { key: "red",     label: "Rot",    cls: "bg-red-500" },
  { key: "gray",    label: "Grau",   cls: "bg-gray-500" },
];

function colorClasses(color: string) {
  const map: Record<string, { bg: string; text: string; border: string; light: string }> = {
    purple:  { bg: "bg-purple-100",  text: "text-purple-700",  border: "border-purple-200", light: "bg-purple-50" },
    blue:    { bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-200",   light: "bg-blue-50" },
    indigo:  { bg: "bg-indigo-100",  text: "text-indigo-700",  border: "border-indigo-200", light: "bg-indigo-50" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200",light: "bg-emerald-50" },
    teal:    { bg: "bg-teal-100",    text: "text-teal-700",    border: "border-teal-200",   light: "bg-teal-50" },
    amber:   { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200",  light: "bg-amber-50" },
    red:     { bg: "bg-red-100",     text: "text-red-700",     border: "border-red-200",    light: "bg-red-50" },
    gray:    { bg: "bg-gray-100",    text: "text-gray-700",    border: "border-gray-200",   light: "bg-gray-50" },
  };
  return map[color] || map["gray"];
}

const ROLE_ICONS: Record<string, typeof Shield> = {
  SUPERADMIN: ShieldCheck,
  ADMIN: Shield,
  BEREICHSLEITUNG: ShieldCheck,
  MARKTLEITER: Store,
  USER: Users,
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPERADMIN:      "Voller Zugriff auf alle Funktionen, Märkte und Systemeinstellungen. Nicht einschränkbar.",
  ADMIN:           "Übergreifender Zugriff auf alle Märkte, Mitarbeiterverwaltung und Berichte.",
  BEREICHSLEITUNG: "Erweiterte Rechte: Daten einsehen und teilweise ändern. Abteilungsübergreifend.",
  MARKTLEITER:     "Zugriff auf zugewiesene Märkte, Aufgaben erstellen und Checklisten verwalten.",
  USER:            "Einträge per PIN bestätigen. Standardrolle für alle Mitarbeiter.",
};

type TabId = "uebersicht" | "matrix" | "rollen";

export default function RollenKonfiguration() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<TabId>("uebersicht");
  const [roles, setRoles] = useState<RoleConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminSession || adminSession.role !== "SUPERADMIN") {
      navigate("/");
    }
  }, [adminSession, navigate]);

  const loadRoles = () => {
    setLoading(true);
    fetch(`${API_BASE}/permissions/roles?tenantId=1`)
      .then(r => r.json())
      .then(data => { setRoles(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadRoles(); }, []);

  if (!adminSession || adminSession.role !== "SUPERADMIN") return null;

  const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
    { id: "uebersicht", label: "Rollenübersicht",      icon: LayoutGrid },
    { id: "matrix",     label: "Berechtigungsmatrix",  icon: Settings2 },
    { id: "rollen",     label: "Rollen verwalten",     icon: UserCog },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <PageHeader>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/system")}
              className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Rollen & Berechtigungen</h1>
              <p className="text-sm text-white/70">Zugriffsrechte je Rolle konfigurieren.</p>
            </div>
          </div>
        </PageHeader>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  tab === t.id
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Lade Rollenkonfiguration...
          </div>
        ) : (
          <>
            {tab === "uebersicht" && <RollenUebersicht roles={roles} />}
            {tab === "matrix"     && <BerechtigungsMatrix roles={roles} onSaved={loadRoles} />}
            {tab === "rollen"     && <RollenVerwalten roles={roles} onSaved={loadRoles} />}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function RollenUebersicht({ roles }: { roles: RoleConfig[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map(role => {
          const Icon = ROLE_ICONS[role.role] || Users;
          const cc = colorClasses(role.color);
          const isSuperAdmin = role.role === "SUPERADMIN";
          const activePerms = role.permissions.length;
          const totalPerms = PERMISSION_AREAS.length;
          const pct = isSuperAdmin ? 100 : Math.round((activePerms / totalPerms) * 100);

          return (
            <div key={role.role} className={cn("bg-white rounded-2xl border-2 shadow-sm p-5 space-y-3", cc.border)}>
              <div className="flex items-start justify-between">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", cc.light)}>
                  <Icon className={cn("h-5 w-5", cc.text)} />
                </div>
                <div className="flex items-center gap-2">
                  {role.is_custom && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                      <Star className="h-3 w-3" /> Eigene Rolle
                    </span>
                  )}
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", cc.bg, cc.text, cc.border)}>
                    {role.label}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">{role.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {ROLE_DESCRIPTIONS[role.role] || `Benutzerdefinierte Rolle (${role.role})`}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Berechtigungen</span>
                  <span className="font-semibold">{isSuperAdmin ? "Alle" : `${activePerms} / ${totalPerms}`}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", isSuperAdmin ? "bg-purple-500" : colorClasses(role.color).text.replace("text-", "bg-"))}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {isSuperAdmin ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                    Alle Berechtigungen
                  </span>
                ) : (
                  role.permissions.slice(0, 4).map(p => {
                    const area = PERMISSION_AREAS.find(a => a.key === p);
                    return area ? (
                      <span key={p} className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cc.light, cc.text)}>
                        {area.label}
                      </span>
                    ) : null;
                  })
                )}
                {!isSuperAdmin && role.permissions.length > 4 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                    +{role.permissions.length - 4} weitere
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <span className="font-semibold">Hinweis:</span> Änderungen an Rollenberechtigungen gelten für neue Nutzer und können optional auf bestehende Nutzer der jeweiligen Rolle übertragen werden.
        </div>
      </div>
    </div>
  );
}

// ─── Einzelner Berechtigungs-Toggle ──────────────────────────────────────────
function PermToggle({
  area,
  active,
  cc,
  onToggle,
}: {
  area: { key: string; label: string };
  active: boolean;
  cc: { bg: string; text: string; border: string };
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all w-full",
        active
          ? cn(cc.bg, cc.text, cc.border)
          : "bg-white border-gray-200 text-muted-foreground hover:border-gray-300"
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border",
        active ? cn(cc.text, "border-current") : "border-gray-300"
      )}>
        {active && <Check className="h-2.5 w-2.5" />}
      </div>
      <span className="text-xs leading-tight">{area.label}</span>
    </button>
  );
}

// ─── 2-Ebenen Berechtigungsgruppe ────────────────────────────────────────────
function PermissionGroupList({
  perms,
  roleKey,
  cc,
  onToggle,
}: {
  perms: string[];
  roleKey: string;
  cc: { bg: string; text: string; border: string };
  onToggle: (role: string, perm: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="divide-y divide-gray-100">
      {PERMISSION_GROUPS.map(group => {
        const groupAreas = PERMISSION_AREAS.filter(a => a.group === group);
        if (groupAreas.length === 0) return null;

        const meta = GROUP_META[group];
        const GroupIcon = meta.icon;
        const isCollapsed = collapsed[group];

        // Unterabschnitte ermitteln
        const sections = [...new Set(groupAreas.map(a => a.section))].filter(Boolean);
        const hasSubsections = sections.length > 0;
        const unsectionedAreas = groupAreas.filter(a => !a.section);

        const activeCount = groupAreas.filter(a => perms.includes(a.key)).length;

        return (
          <div key={group}>
            {/* Hauptbereich-Header */}
            <button
              className={cn(
                "w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:brightness-95",
                meta.bg
              )}
              onClick={() => setCollapsed(prev => ({ ...prev, [group]: !prev[group] }))}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-white/70 shadow-sm shrink-0", meta.border, "border")}>
                <GroupIcon className={cn("h-4 w-4", meta.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn("font-bold text-sm", meta.color)}>{group}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {activeCount} / {groupAreas.length} aktiv
                </span>
              </div>
              {isCollapsed
                ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            {/* Inhalte (ein-/ausklappbar) */}
            {!isCollapsed && (
              <div className="px-5 py-4 space-y-4 bg-white">
                {/* Berechtigungen ohne Unterabschnitt */}
                {unsectionedAreas.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {unsectionedAreas.map(area => (
                      <PermToggle
                        key={area.key}
                        area={area}
                        active={perms.includes(area.key)}
                        cc={cc}
                        onToggle={() => onToggle(roleKey, area.key)}
                      />
                    ))}
                  </div>
                )}
                {/* Unterabschnitte */}
                {hasSubsections && sections.map(section => {
                  const sectionAreas = groupAreas.filter(a => a.section === section);
                  return (
                    <div key={section}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn("h-px flex-1 bg-gray-100")} />
                        <span className={cn("text-xs font-semibold uppercase tracking-wide px-2", meta.color, "opacity-70")}>
                          {section}
                        </span>
                        <div className={cn("h-px flex-1 bg-gray-100")} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {sectionAreas.map(area => (
                          <PermToggle
                            key={area.key}
                            area={area}
                            active={perms.includes(area.key)}
                            cc={cc}
                            onToggle={() => onToggle(roleKey, area.key)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BerechtigungsMatrix({ roles, onSaved }: { roles: RoleConfig[]; onSaved: () => void }) {
  const [localPerms, setLocalPerms] = useState<Record<string, string[]>>({});
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [savedRoles, setSavedRoles] = useState<Set<string>>(new Set());
  const [applyingRole, setApplyingRole] = useState<string | null>(null);
  const [applyMsg, setApplyMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    const init: Record<string, string[]> = {};
    roles.forEach(r => { init[r.role] = [...r.permissions]; });
    setLocalPerms(init);
  }, [roles]);

  const toggle = (role: string, perm: string) => {
    if (role === "SUPERADMIN") return;
    setLocalPerms(prev => {
      const current = prev[role] || [];
      const next = current.includes(perm)
        ? current.filter(p => p !== perm)
        : [...current, perm];
      return { ...prev, [role]: next };
    });
    setSavedRoles(prev => { const s = new Set(prev); s.delete(role); return s; });
  };

  const saveRole = async (role: string) => {
    setSavingRole(role);
    try {
      const resp = await fetch(`${API_BASE}/permissions/roles/${role}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: 1, permissions: localPerms[role] || [] }),
      });
      if (resp.ok) {
        setSavedRoles(prev => new Set([...prev, role]));
        onSaved();
        setTimeout(() => setSavedRoles(prev => { const s = new Set(prev); s.delete(role); return s; }), 3000);
      }
    } finally {
      setSavingRole(null);
    }
  };

  const applyToUsers = async (role: string) => {
    setApplyingRole(role);
    try {
      const resp = await fetch(`${API_BASE}/permissions/roles/${role}/apply-to-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: 1 }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setApplyMsg(prev => ({ ...prev, [role]: `${data.usersUpdated} Mitarbeiter aktualisiert` }));
        setTimeout(() => setApplyMsg(prev => { const n = { ...prev }; delete n[role]; return n; }), 4000);
      }
    } finally {
      setApplyingRole(null);
    }
  };

  const editableRoles = roles.filter(r => r.role !== "SUPERADMIN");
  const superAdminRole = roles.find(r => r.role === "SUPERADMIN");

  return (
    <div className="space-y-6">
      {superAdminRole && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-purple-600 flex-shrink-0" />
          <div className="text-sm text-purple-800">
            <span className="font-bold">Superadmin</span> hat automatisch Zugriff auf alle Bereiche und Funktionen. Berechtigungen können nicht eingeschränkt werden.
          </div>
        </div>
      )}

      {editableRoles.map(roleConfig => {
        const cc = colorClasses(roleConfig.color);
        const Icon = ROLE_ICONS[roleConfig.role] || Users;
        const perms = localPerms[roleConfig.role] || [];
        const isSaving = savingRole === roleConfig.role;
        const isSaved = savedRoles.has(roleConfig.role);
        const isApplying = applyingRole === roleConfig.role;

        return (
          <div key={roleConfig.role} className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className={cn("px-5 py-3.5 flex items-center justify-between gap-4", cc.light)}>
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", cc.bg)}>
                  <Icon className={cn("h-4 w-4", cc.text)} />
                </div>
                <div>
                  <span className="font-bold text-foreground">{roleConfig.label}</span>
                  {roleConfig.is_custom && (
                    <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Eigene Rolle
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {perms.length} / {PERMISSION_AREAS.length} Berechtigungen aktiv
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {applyMsg[roleConfig.role] && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> {applyMsg[roleConfig.role]}
                  </span>
                )}
                <button
                  onClick={() => applyToUsers(roleConfig.role)}
                  disabled={isApplying || isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-gray-300 transition-colors disabled:opacity-50"
                  title="Aktuelle Einstellungen auf alle Nutzer dieser Rolle übertragen"
                >
                  <RefreshCw className={cn("h-3 w-3", isApplying && "animate-spin")} />
                  {isApplying ? "Wird übertragen..." : "An alle Nutzer"}
                </button>
                <button
                  onClick={() => saveRole(roleConfig.role)}
                  disabled={isSaving || isSaved}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    isSaved
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                  )}
                >
                  {isSaved ? (
                    <><Check className="h-3.5 w-3.5" /> Gespeichert</>
                  ) : (
                    <>{isSaving ? "Speichert..." : "Speichern"}</>
                  )}
                </button>
              </div>
            </div>

            <PermissionGroupList
              perms={perms}
              roleKey={roleConfig.role}
              cc={cc}
              onToggle={toggle}
            />
          </div>
        );
      })}
    </div>
  );
}

function RollenVerwalten({ roles, onSaved }: { roles: RoleConfig[]; onSaved: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [newRole, setNewRole] = useState({ role: "", label: "", color: "teal" });
  const [templateRole, setTemplateRole] = useState("USER");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [deletingRole, setDeletingRole] = useState<string | null>(null);

  const customRoles = roles.filter(r => r.is_custom);
  const standardRoles = roles.filter(r => !r.is_custom);

  const handleCreate = async () => {
    if (!newRole.role.trim() || !newRole.label.trim()) {
      setCreateMsg({ type: "err", text: "Bitte Bezeichner und Anzeigename ausfüllen." });
      return;
    }
    setCreating(true);
    setCreateMsg(null);
    try {
      const templateConfig = roles.find(r => r.role === templateRole);
      const resp = await fetch(`${API_BASE}/permissions/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: 1,
          role: newRole.role.toUpperCase().replace(/\s+/g, "_"),
          label: newRole.label,
          color: newRole.color,
          permissions: templateConfig?.permissions || [],
          sortOrder: 50,
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setCreateMsg({ type: "ok", text: `Rolle "${newRole.label}" erfolgreich erstellt.` });
        setNewRole({ role: "", label: "", color: "teal" });
        setShowForm(false);
        onSaved();
      } else {
        setCreateMsg({ type: "err", text: data.error || "Fehler beim Erstellen." });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (role: string, label: string) => {
    if (!confirm(`Rolle "${label}" wirklich löschen? Nutzer mit dieser Rolle werden davon nicht berührt.`)) return;
    setDeletingRole(role);
    try {
      const resp = await fetch(`${API_BASE}/permissions/roles/${role}?tenantId=1`, { method: "DELETE" });
      if (resp.ok) onSaved();
    } finally {
      setDeletingRole(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="bg-[#1a3a6b] text-white px-5 py-3 flex items-center gap-3">
          <Shield className="h-5 w-5" />
          <h2 className="text-base font-bold">Standard-Rollen</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground mb-4">
            Diese Rollen sind fest im System hinterlegt und können nicht gelöscht werden. Ihre Berechtigungen lassen sich in der Berechtigungsmatrix anpassen.
          </p>
          <div className="space-y-2">
            {standardRoles.map(role => {
              const Icon = ROLE_ICONS[role.role] || Users;
              const cc = colorClasses(role.color);
              return (
                <div key={role.role} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border-2", cc.border, cc.light)}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cc.bg)}>
                    <Icon className={cn("h-4 w-4", cc.text)} />
                  </div>
                  <div className="flex-1">
                    <span className={cn("font-bold text-sm", cc.text)}>{role.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground font-mono">{role.role}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{role.permissions.length} Berechtigungen</span>
                  <Lock className="h-4 w-4 text-muted-foreground/40" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <Star className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold text-foreground">Eigene Rollen</h2>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Neue Rolle
          </button>
        </div>

        {showForm && (
          <div className="p-5 border-b border-border/40 bg-gray-50">
            <h3 className="text-sm font-bold text-foreground mb-4">Neue Rolle erstellen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Bezeichner (intern, z.B. SCHICHTLEITUNG)
                </label>
                <input
                  type="text"
                  value={newRole.role}
                  onChange={e => setNewRole(prev => ({ ...prev, role: e.target.value.toUpperCase().replace(/\s+/g, "_") }))}
                  placeholder="SCHICHTLEITUNG"
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Anzeigename (z.B. Schichtleitung)
                </label>
                <input
                  type="text"
                  value={newRole.label}
                  onChange={e => setNewRole(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Schichtleitung"
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Farbe
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setNewRole(prev => ({ ...prev, color: c.key }))}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all",
                        c.cls,
                        newRole.color === c.key ? "ring-2 ring-offset-2 ring-gray-600 scale-110" : "opacity-70 hover:opacity-100"
                      )}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Startberechtigungen (basierend auf)
                </label>
                <select
                  value={templateRole}
                  onChange={e => setTemplateRole(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                >
                  {roles.map(r => (
                    <option key={r.role} value={r.role}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {createMsg && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mb-4",
                createMsg.type === "ok"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              )}>
                {createMsg.type === "ok" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {createMsg.text}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {creating ? "Erstellt..." : "Rolle erstellen"}
              </button>
              <button
                onClick={() => { setShowForm(false); setCreateMsg(null); }}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        <div className="p-5">
          {customRoles.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Noch keine eigenen Rollen erstellt.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Erstellen Sie z.B. eine "Schichtleitung" zwischen Marktleiter und Mitarbeiter.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {customRoles.map(role => {
                const cc = colorClasses(role.color);
                return (
                  <div key={role.role} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border-2", cc.border, cc.light)}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cc.bg)}>
                      <Star className={cn("h-4 w-4", cc.text)} />
                    </div>
                    <div className="flex-1">
                      <span className={cn("font-bold text-sm", cc.text)}>{role.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground font-mono">{role.role}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{role.permissions.length} Berechtigungen</span>
                    <button
                      onClick={() => handleDelete(role.role, role.label)}
                      disabled={deletingRole === role.role}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Rolle löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p><span className="font-semibold">Berechtigungen eigener Rollen</span> können nach der Erstellung in der Berechtigungsmatrix angepasst werden.</p>
          <p>Um Nutzern eine eigene Rolle zuzuweisen, wechseln Sie in die Benutzerverwaltung.</p>
        </div>
      </div>
    </div>
  );
}
