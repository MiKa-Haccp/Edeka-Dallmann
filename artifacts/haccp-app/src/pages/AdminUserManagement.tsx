import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useListUsers, useListMarkets } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  MapPin,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Lock,
  Settings,
  Store,
  Activity,
  Smartphone,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLocation } from "wouter";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return twMerge(clsx(inputs));
}

interface PermissionArea {
  key: string;
  label: string;
  group: string;
}

interface PermissionsConfig {
  areas: PermissionArea[];
  roles: string[];
  roleDefaults: Record<string, string[]>;
}

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Administrator",
  BEREICHSLEITUNG: "Bereichsleitung",
  MARKTLEITER: "Marktleiter",
  USER: "Mitarbeiter",
};

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
  BEREICHSLEITUNG: "bg-indigo-100 text-indigo-700 border-indigo-200",
  MARKTLEITER: "bg-emerald-100 text-emerald-700 border-emerald-200",
  USER: "bg-gray-100 text-gray-700 border-gray-200",
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  SUPERADMIN: ShieldCheck,
  ADMIN: Shield,
  BEREICHSLEITUNG: ShieldCheck,
  MARKTLEITER: Store,
  USER: Users,
};

const STATUS_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  aktiv: "Aktiv",
  inaktiv: "Inaktiv",
};

const STATUS_COLORS: Record<string, string> = {
  onboarding: "bg-amber-50 text-amber-700 border-amber-200",
  aktiv: "bg-green-50 text-green-700 border-green-200",
  inaktiv: "bg-red-50 text-red-600 border-red-200",
};

export default function AdminUserManagement() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();
  const isSuperAdmin = adminSession?.role === "SUPERADMIN";

  if (!adminSession || !isSuperAdmin) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl border border-border/60 shadow-sm text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Zugriff verweigert</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Diese Seite ist nur für Superadmins zugänglich.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
          >
            Zum Dashboard
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Settings className="h-7 w-7 text-primary" />
              Benutzerverwaltung
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rollen und Berechtigungen für alle Mitarbeiter verwalten
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/geraete")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white hover:bg-secondary text-sm font-medium text-foreground shadow-sm transition-colors"
          >
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            Geräteverwaltung
          </button>
        </div>

        <RoleOverview />
        <UserPermissionsList />
      </div>
    </AppLayout>
  );
}

function RoleOverview() {
  const roles = ["SUPERADMIN", "ADMIN", "BEREICHSLEITUNG", "MARKTLEITER", "USER"];

  const roleDescriptions: Record<string, string> = {
    SUPERADMIN: "Voller Zugriff auf alle Funktionen, alle Märkte und Systemeinstellungen. Ebene 1.",
    ADMIN: "Übergreifender Zugriff auf alle Märkte, Mitarbeiterverwaltung und Berichte. Ebene 2.",
    BEREICHSLEITUNG: "Erweiterte Rechte: Daten einsehen und teilweise ändern. Abteilungsübergreifend. Ebene 3.",
    MARKTLEITER: "Zugriff auf zugewiesene Märkte, Aufgaben erstellen und Checklisten verwalten. Ebene 4.",
    USER: "Einträge per PIN bestätigen. Standardrolle für alle Mitarbeiter. Ebene 5.",
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="bg-[#1a3a6b] text-white px-6 py-3 flex items-center gap-3">
        <Shield className="h-5 w-5" />
        <h2 className="text-lg font-bold">Rollenübersicht</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-5">
        {roles.map((role) => {
          const Icon = ROLE_ICONS[role];
          return (
            <div key={role} className={cn("rounded-xl border-2 p-3 space-y-1.5", ROLE_COLORS[role])}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="font-bold text-xs">{ROLE_LABELS[role]}</span>
              </div>
              <p className="text-xs opacity-75 leading-relaxed">{roleDescriptions[role]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UserPermissionsList() {
  const { data: users, refetch } = useListUsers({ tenantId: 1 });
  const { data: markets } = useListMarkets();
  const [config, setConfig] = useState<PermissionsConfig | null>(null);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/permissions/areas`)
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  const registeredUsers = users?.filter((u) => u.isRegistered) || [];

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="bg-[#1a3a6b] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-bold">Mitarbeiter & Berechtigungen</h2>
        </div>
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
          {registeredUsers.length} Mitarbeiter
        </span>
      </div>

      {registeredUsers.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Noch keine Mitarbeiter registriert.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {registeredUsers.map((user) => (
            <UserPermissionRow
              key={user.id}
              user={user}
              markets={markets || []}
              config={config}
              isExpanded={expandedUser === user.id}
              onToggle={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
              onSaved={() => refetch()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserPermissionRow({
  user,
  markets,
  config,
  isExpanded,
  onToggle,
  onSaved,
}: {
  user: any;
  markets: any[];
  config: PermissionsConfig | null;
  isExpanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState<string>(user.status || "aktiv");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [assignedMarkets, setAssignedMarkets] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    if (isExpanded && !loaded) {
      fetch(`${API_BASE}/permissions/user/${user.id}`)
        .then((r) => r.json())
        .then((data) => {
          const perms = data.permissions?.map((p: any) => p.permissionType) || [];
          if (perms.length === 0 && config?.roleDefaults[user.role]) {
            setPermissions([...config.roleDefaults[user.role]]);
          } else {
            setPermissions(perms);
          }
          setAssignedMarkets(data.marketAssignments || []);
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }
  }, [isExpanded, loaded, user.id, user.role, config]);

  const handleRoleChange = async (newRole: string) => {
    setSaving(true);
    setSaveMsg("");
    try {
      const resp = await fetch(`${API_BASE}/permissions/user/${user.id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (resp.ok) {
        setRole(newRole);
        if (config?.roleDefaults[newRole]) {
          setPermissions([...config.roleDefaults[newRole]]);
        }
        setSaveMsg("Rolle geändert");
        onSaved();
        setTimeout(() => setSaveMsg(""), 2000);
      }
    } catch {
      setSaveMsg("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusSaving(true);
    try {
      const resp = await fetch(`${API_BASE}/users/${user.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (resp.ok) {
        setStatus(newStatus);
        onSaved();
      }
    } catch {
    } finally {
      setStatusSaving(false);
    }
  };

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleMarket = (marketId: number) => {
    setAssignedMarkets((prev) =>
      prev.includes(marketId) ? prev.filter((id) => id !== marketId) : [...prev, marketId]
    );
  };

  const savePermissions = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const resp = await fetch(`${API_BASE}/permissions/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions, marketIds: assignedMarkets }),
      });
      if (resp.ok) {
        setSaveMsg("Gespeichert!");
        setTimeout(() => setSaveMsg(""), 2000);
      }
    } catch {
      setSaveMsg("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const Icon = ROLE_ICONS[role] || Users;
  const isSuperAdmin = role === "SUPERADMIN";
  const showMarkets = role === "MARKTLEITER";

  const groups = config
    ? [...new Set(config.areas.map((a) => a.group))]
    : [];

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors text-left"
      >
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <span className="inline-flex items-center justify-center h-9 w-12 bg-primary/10 text-primary font-mono font-bold text-sm rounded-lg flex-shrink-0">
          {user.initials || "—"}
        </span>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.email || "Kein E-Mail"}</div>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
            STATUS_COLORS[status] || STATUS_COLORS["aktiv"]
          )}
        >
          {STATUS_LABELS[status] || status}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
            ROLE_COLORS[role] || ROLE_COLORS["USER"]
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {ROLE_LABELS[role] || role}
        </span>

        {assignedMarkets.length > 0 && showMarkets && (
          <div className="flex items-center gap-1">
            {assignedMarkets.map((mId) => {
              const market = markets.find((m) => m.id === mId);
              return market ? (
                <span
                  key={mId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full"
                >
                  <MapPin className="h-3 w-3" />
                  {market.code}
                </span>
              ) : null;
            })}
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 pl-16 space-y-6">
          {isSuperAdmin ? (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3 text-sm text-purple-700">
              <ShieldCheck className="h-5 w-5 flex-shrink-0" />
              <div>
                <span className="font-bold">Superadmin</span> — Hat automatisch vollen Zugriff auf alle Bereiche und Märkte. Berechtigungen können nicht eingeschränkt werden.
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Mitarbeiterstatus
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["onboarding", "aktiv", "inaktiv"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={statusSaving}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                        status === s
                          ? STATUS_COLORS[s] + " ring-2 ring-offset-1"
                          : "bg-white text-muted-foreground border-border hover:border-primary/50"
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Inaktive Mitarbeiter können sich nicht mehr per PIN einloggen. Ihre Daten bleiben erhalten.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Rolle ändern
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["ADMIN", "BEREICHSLEITUNG", "MARKTLEITER", "USER"] as const).map((r) => {
                      const RIcon = ROLE_ICONS[r] || Users;
                      return (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(r)}
                          disabled={saving}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                            role === r
                              ? ROLE_COLORS[r] + " ring-2 ring-offset-1 ring-primary/30"
                              : "bg-white text-muted-foreground border-border hover:border-primary/50"
                          )}
                        >
                          <RIcon className="h-4 w-4" />
                          {ROLE_LABELS[r]}
                        </button>
                      );
                    })}
                </div>
                {saveMsg && (
                  <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    {saveMsg}
                  </p>
                )}
              </div>

              {showMarkets && (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Zugewiesene Märkte
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Marktleiter haben nur Zugriff auf ihre zugewiesenen Filialen.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {markets.map((market) => (
                      <button
                        key={market.id}
                        onClick={() => toggleMarket(market.id)}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all",
                          assignedMarkets.includes(market.id)
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-white text-muted-foreground border-border hover:border-emerald-300"
                        )}
                      >
                        {assignedMarkets.includes(market.id) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        {market.name} ({market.code})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Berechtigungen
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Aktivieren oder deaktivieren Sie einzelne Berechtigungen per Häkchen.
                </p>
                <div className="space-y-4">
                  {groups.map((group) => {
                    const groupAreas = config!.areas.filter((a) => a.group === group);
                    return (
                      <div key={group}>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          {group}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {groupAreas.map((area) => (
                            <label
                              key={area.key}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                                permissions.includes(area.key)
                                  ? "bg-blue-50 border-blue-200"
                                  : "bg-white border-border hover:border-blue-200"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={permissions.includes(area.key)}
                                onChange={() => togglePermission(area.key)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                              />
                              <span className="text-sm font-medium text-foreground">{area.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={savePermissions}
                  disabled={saving}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {saving ? "Wird gespeichert..." : "Berechtigungen speichern"}
                </button>
                {saveMsg && (
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    {saveMsg}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
