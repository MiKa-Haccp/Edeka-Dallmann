import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
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
  Unlock,
  Store,
  Activity,
  Mail,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  KeyRound,
  UserCog,
  Search,
  ArrowUpDown,
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
        <PageHeader>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/system")}
              className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Benutzerverwaltung</h1>
              <p className="text-white/70 text-sm">Rollen und Status für alle Mitarbeiter verwalten.</p>
            </div>
          </div>
        </PageHeader>

        <UserRoleList />
      </div>
    </AppLayout>
  );
}

const ROLES_ALL = ["SUPERADMIN", "ADMIN", "BEREICHSLEITUNG", "MARKTLEITER", "USER"] as const;
const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "role_asc", label: "Rolle (aufst.)" },
  { value: "status_asc", label: "Status" },
] as const;

function UserRoleList() {
  const { data: users, refetch } = useListUsers({ tenantId: 1 });
  const { data: markets } = useListMarkets();
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("alle");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [sortBy, setSortBy] = useState<string>("name_asc");

  const allUsers = users || [];

  const ROLE_ORDER: Record<string, number> = { SUPERADMIN: 0, ADMIN: 1, BEREICHSLEITUNG: 2, MARKTLEITER: 3, USER: 4 };

  const filtered = allUsers
    .filter((u) => {
      if (roleFilter !== "alle" && u.role !== roleFilter) return false;
      if (statusFilter !== "alle" && (u.status || "aktiv") !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = (u.name || "").toLowerCase().includes(q);
        const emailMatch = (u.email || "").toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "role_asc") return (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9);
      if (sortBy === "status_asc") return (a.status || "aktiv").localeCompare(b.status || "aktiv");
      return 0;
    });

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="bg-[#1a3a6b] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-bold">Alle Benutzer</h2>
        </div>
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
          {filtered.length} / {allUsers.length}
        </span>
      </div>

      {/* Filter-Toolbar */}
      <div className="px-4 py-3 border-b border-border/40 bg-gray-50 space-y-2">
        {/* Suche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name oder E-Mail suchen..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
          />
        </div>
        {/* Rolle + Status + Sort */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 flex-wrap">
            {["alle", ...ROLES_ALL].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  roleFilter === r
                    ? "bg-[#1a3a6b] text-white border-[#1a3a6b]"
                    : "bg-white text-muted-foreground border-border/60 hover:border-[#1a3a6b]/40"
                }`}
              >
                {r === "alle" ? "Alle Rollen" : ROLE_LABELS[r] || r}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {["alle", "aktiv", "onboarding", "inaktiv"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  statusFilter === s
                    ? "bg-[#1a3a6b] text-white border-[#1a3a6b]"
                    : "bg-white text-muted-foreground border-border/60 hover:border-[#1a3a6b]/40"
                }`}
              >
                {s === "alle" ? "Alle Status" : STATUS_LABELS[s] || s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs border border-border/60 rounded-lg px-2 py-1 bg-white focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {allUsers.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Noch keine Benutzer angelegt.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center">
          <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Keine Benutzer gefunden</p>
          <button
            onClick={() => { setSearch(""); setRoleFilter("alle"); setStatusFilter("alle"); }}
            className="mt-2 text-xs text-[#1a3a6b] hover:underline"
          >
            Filter zurücksetzen
          </button>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {filtered.map((user) => (
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
  const [inviteStatus, setInviteStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [inviteMessage, setInviteMessage] = useState("");

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
    setSaving(true); setSaveMsg("");
    try {
      const resp = await fetch(`${API_BASE}/permissions/user/${user.id}/role`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (resp.ok) { setRole(newRole); setSaveMsg("Rolle gespeichert"); onSaved(); setTimeout(() => setSaveMsg(""), 2500); }
    } catch { setSaveMsg("Fehler beim Speichern"); } finally { setSaving(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusSaving(true);
    try {
      const resp = await fetch(`${API_BASE}/users/${user.id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (resp.ok) { setStatus(newStatus); onSaved(); }
    } catch { } finally { setStatusSaving(false); }
  };

  const handleEmailSave = async () => {
    setEmailSaving(true); setEmailMsg("");
    try {
      const resp = await fetch(`${API_BASE}/users/${user.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || null }),
      });
      if (resp.ok) { setEmailMsg("E-Mail gespeichert"); onSaved(); setTimeout(() => setEmailMsg(""), 2500); }
    } catch { setEmailMsg("Fehler beim Speichern"); } finally { setEmailSaving(false); }
  };

  const handleSendInvite = async (type: "invite" | "reset") => {
    setInviteStatus("sending"); setInviteMessage("");
    try {
      const appBaseUrl = window.location.origin + (import.meta.env.BASE_URL || "").replace(/\/$/, "");
      const resp = await fetch(`${API_BASE}/auth/send-invite`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, type, appBaseUrl }),
      });
      const data = await resp.json();
      if (!resp.ok) { setInviteStatus("error"); setInviteMessage(data.error || "Fehler aufgetreten."); return; }
      setInviteStatus("success");
      setInviteMessage(data.emailSent ? `E-Mail an ${email || user.email} gesendet.` : `Link: ${data.setPasswordUrl}`);
    } catch { setInviteStatus("error"); setInviteMessage("Verbindungsfehler."); }
  };

  const toggleMarket = (marketId: number) => {
    setAssignedMarkets((prev) => prev.includes(marketId) ? prev.filter((id) => id !== marketId) : [...prev, marketId]);
  };

  const saveMarkets = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/permissions/user/${user.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketIds: assignedMarkets }),
      });
      setSaveMsg("Märkte gespeichert"); onSaved(); setTimeout(() => setSaveMsg(""), 2500);
    } catch { setSaveMsg("Fehler"); } finally { setSaving(false); }
  };

  const Icon = ROLE_ICONS[role] || Users;
  const isSuperAdmin = role === "SUPERADMIN";
  const showMarkets = role === "MARKTLEITER";
  const isLocked = status === "inaktiv";

  return (
    <div className={cn(isLocked && "bg-red-50/30")}>
      {/* ── Zeilen-Header ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
        {/* Expand-Trigger */}
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <span className={cn(
            "inline-flex items-center justify-center h-9 w-10 font-mono font-bold text-sm rounded-lg flex-shrink-0",
            isLocked ? "bg-red-100 text-red-500" : "bg-primary/10 text-primary"
          )}>
            {user.initials || "—"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{user.name}</span>
              {isLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold border border-red-200">
                  <Lock className="h-3 w-3" /> Gesperrt
                </span>
              )}
              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border", ROLE_COLORS[role] || ROLE_COLORS["USER"])}>
                <Icon className="h-3 w-3" />
                {ROLE_LABELS[role] || role}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {user.email ? (
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</span>
              ) : (
                <span className="italic text-muted-foreground/60">Keine E-Mail hinterlegt</span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 text-muted-foreground">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </button>

        {/* Schnell-Sperren-Button – immer sichtbar, außer bei Superadmin */}
        {!isSuperAdmin && (
          <button
            onClick={(e) => { e.stopPropagation(); handleStatusChange(isLocked ? "aktiv" : "inaktiv"); }}
            disabled={statusSaving}
            title={isLocked ? "Benutzer entsperren" : "Benutzer sperren"}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
              isLocked
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
              statusSaving && "opacity-50 cursor-wait"
            )}
          >
            {statusSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {isLocked ? "Entsperren" : "Sperren"}
          </button>
        )}
      </div>

      {/* ── Aufgeklappter Bereich ── */}
      {isExpanded && (
        <div className="px-5 pb-6 pl-[68px] border-t border-border/30 pt-4 space-y-5 bg-gray-50/40">
          {isSuperAdmin ? (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3 text-sm text-purple-700">
              <ShieldCheck className="h-5 w-5 flex-shrink-0" />
              <div><span className="font-bold">Superadmin</span> — Hat automatisch vollen Zugriff auf alle Bereiche und Märkte.</div>
            </div>
          ) : (
            <>
              {/* E-Mail */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">E-Mail-Adresse</label>
                <div className="flex items-center gap-2">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@firma.de"
                    className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                    onKeyDown={(e) => { if (e.key === "Enter") handleEmailSave(); }}
                  />
                  <button onClick={handleEmailSave} disabled={emailSaving}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap">
                    <Check className="h-4 w-4" />{emailSaving ? "..." : "Speichern"}
                  </button>
                </div>
                {emailMsg && <p className="mt-1 text-xs text-green-600 font-medium flex items-center gap-1"><Check className="h-3 w-3" />{emailMsg}</p>}
              </div>

              {/* Einladung & Passwort */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" />Passwort & Zugang</span>
                </label>
                {email ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleSendInvite("invite")} disabled={inviteStatus === "sending"}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-semibold hover:bg-green-100 disabled:opacity-50 transition-colors">
                        {inviteStatus === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Einladung senden
                      </button>
                      <button onClick={() => handleSendInvite("reset")} disabled={inviteStatus === "sending"}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors">
                        {inviteStatus === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                        Passwort zurücksetzen
                      </button>
                    </div>
                    {inviteStatus === "success" && (
                      <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                        <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /><span className="break-all">{inviteMessage}</span>
                      </div>
                    )}
                    {inviteStatus === "error" && (
                      <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />{inviteMessage}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Link ist 48 Stunden gültig und kann nur einmal verwendet werden.</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/70 italic bg-white border border-border/50 rounded-xl px-3 py-2">
                    Zuerst E-Mail-Adresse eintragen, dann kann eine Einladung versendet werden.
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" />Kontostatus</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["onboarding", "aktiv", "inaktiv"] as const).map((s) => (
                    <button key={s} onClick={() => handleStatusChange(s)} disabled={statusSaving}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                        s === "inaktiv" && status !== "inaktiv" && "hover:bg-red-50 hover:border-red-300 hover:text-red-600",
                        status === s ? STATUS_COLORS[s] + " ring-2 ring-offset-1" : "bg-white text-muted-foreground border-border"
                      )}
                    >
                      {s === "inaktiv" && <Lock className="h-3.5 w-3.5" />}
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Gesperrte Benutzer können sich nicht mehr anmelden. Alle Daten bleiben erhalten.</p>
              </div>

              {/* Rolle */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-blue-600" />Rolle</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["ADMIN", "BEREICHSLEITUNG", "MARKTLEITER", "USER"] as const).map((r) => {
                    const RIcon = ROLE_ICONS[r] || Users;
                    return (
                      <button key={r} onClick={() => handleRoleChange(r)} disabled={saving}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                          role === r ? ROLE_COLORS[r] + " ring-2 ring-offset-1 ring-primary/20" : "bg-white text-muted-foreground border-border hover:border-primary/40"
                        )}
                      >
                        <RIcon className="h-4 w-4" />{ROLE_LABELS[r]}
                      </button>
                    );
                  })}
                </div>
                {saveMsg && <p className="mt-1 text-xs text-green-600 font-medium flex items-center gap-1"><Check className="h-3 w-3" />{saveMsg}</p>}
              </div>

              {/* Märkte (nur Marktleiter) */}
              {showMarkets && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald-600" />Zugewiesene Märkte</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {markets.map((market) => (
                      <button key={market.id} onClick={() => toggleMarket(market.id)}
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                          assignedMarkets.includes(market.id) ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-white text-muted-foreground border-border hover:border-emerald-300"
                        )}
                      >
                        <MapPin className="h-4 w-4" />{market.name}
                      </button>
                    ))}
                  </div>
                  <button onClick={saveMarkets} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    <Check className="h-4 w-4" />{saving ? "Speichert..." : "Märkte speichern"}
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
