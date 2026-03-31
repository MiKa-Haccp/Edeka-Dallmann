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
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Lock,
  Store,
  Activity,
  Mail,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLocation } from "wouter";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return twMerge(clsx(inputs));
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
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/system")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Benutzerverwaltung</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Rollen und Status für alle Mitarbeiter verwalten.
            </p>
          </div>
        </div>

        <UserRoleList />
      </div>
    </AppLayout>
  );
}

function UserRoleList() {
  const { data: users, refetch } = useListUsers({ tenantId: 1 });
  const { data: markets } = useListMarkets();
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  const allUsers = users || [];

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="bg-[#1a3a6b] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-bold">Alle Benutzer</h2>
        </div>
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
          {allUsers.length} Benutzer
        </span>
      </div>

      {allUsers.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Noch keine Benutzer angelegt.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {allUsers.map((user) => (
            <UserRoleRow
              key={user.id}
              user={user}
              markets={markets || []}
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

function UserRoleRow({
  user,
  markets,
  isExpanded,
  onToggle,
  onSaved,
}: {
  user: any;
  markets: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState<string>(user.status || "aktiv");
  const [email, setEmail] = useState<string>(user.email || "");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
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
          setAssignedMarkets(data.marketAssignments || []);
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }
  }, [isExpanded, loaded, user.id]);

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
        setSaveMsg("Rolle gespeichert");
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

  const handleEmailSave = async () => {
    setEmailSaving(true);
    setEmailMsg("");
    try {
      const resp = await fetch(`${API_BASE}/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || null }),
      });
      if (resp.ok) {
        setEmailMsg("E-Mail gespeichert");
        onSaved();
        setTimeout(() => setEmailMsg(""), 2000);
      }
    } catch {
      setEmailMsg("Fehler beim Speichern");
    } finally {
      setEmailSaving(false);
    }
  };

  const toggleMarket = (marketId: number) => {
    setAssignedMarkets((prev) =>
      prev.includes(marketId) ? prev.filter((id) => id !== marketId) : [...prev, marketId]
    );
  };

  const saveMarkets = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/permissions/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketIds: assignedMarkets }),
      });
      setSaveMsg("Märkte gespeichert");
      onSaved();
      setTimeout(() => setSaveMsg(""), 2000);
    } catch {
      setSaveMsg("Fehler");
    } finally {
      setSaving(false);
    }
  };

  const Icon = ROLE_ICONS[role] || Users;
  const isSuperAdmin = role === "SUPERADMIN";
  const showMarkets = role === "MARKTLEITER";

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

        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border", STATUS_COLORS[status] || STATUS_COLORS["aktiv"])}>
          {STATUS_LABELS[status] || status}
        </span>
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border", ROLE_COLORS[role] || ROLE_COLORS["USER"])}>
          <Icon className="h-3.5 w-3.5" />
          {ROLE_LABELS[role] || role}
        </span>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 pl-16 space-y-5 border-t border-border/30 pt-4">
          {isSuperAdmin ? (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3 text-sm text-purple-700">
              <ShieldCheck className="h-5 w-5 flex-shrink-0" />
              <div>
                <span className="font-bold">Superadmin</span> — Hat automatisch vollen Zugriff auf alle Bereiche und Märkte.
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  E-Mail-Adresse
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@firma.de"
                    className="flex-1 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    onKeyDown={(e) => { if (e.key === "Enter") handleEmailSave(); }}
                  />
                  <button
                    onClick={handleEmailSave}
                    disabled={emailSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    {emailSaving ? "..." : "Speichern"}
                  </button>
                </div>
                {emailMsg && (
                  <p className="mt-1.5 text-xs text-green-600 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    {emailMsg}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Kontostatus
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
                <p className="text-xs text-muted-foreground mt-1.5">
                  Inaktive Benutzer können sich nicht mehr anmelden. Daten bleiben erhalten.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Rolle
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
                  <p className="mt-1.5 text-xs text-green-600 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    {saveMsg}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  Die Berechtigungen je Rolle werden zentral unter Systemverwaltung → Rollen & Berechtigungen verwaltet.
                </p>
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
                        <MapPin className="h-4 w-4" />
                        {market.name} ({market.code})
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={saveMarkets}
                    disabled={saving}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    {saving ? "Speichert..." : "Märkte speichern"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
