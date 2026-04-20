import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  ChevronLeft, Bell, Plus, Trash2, Check, X, AlertTriangle,
  Mail, Send, Clock, Users, RefreshCw, Eye, MessageCircle,
  BellOff, Play, CheckCircle, XCircle, Settings, Save, Store, Pencil,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return twMerge(clsx(inputs));
}

interface Section { key: string; label: string; group: string; periodType: string; description: string; }
interface TriggerType { key: string; label: string; unit: string; description: string; }
interface CheckRhythm { key: string; label: string; description: string; }
interface Rule { id: number; tenant_id: number; section_key: string; trigger_type: string; trigger_value: number; notify_user_ids: number[]; is_active: boolean; market_ids: number[] | null; check_rhythm: string | null; }
interface UserChannel { id: number; name: string; email: string; role: string; channel_type: string | null; telegram_chat_id: string | null; email_override: string | null; assigned_market_ids: number[] | null; }
interface LogEntry { id: number; rule_id: number; user_id: number; market_id: number; channel_type: string; message: string; status: string; sent_at: string; user_name: string; section_key: string; trigger_type: string; }
interface EmailSettings { id?: number; smtp_host?: string; smtp_port?: number; smtp_user?: string; smtp_pass?: string; from_name?: string; default_recipient?: string; enabled?: boolean; telegram_bot_token?: string; }

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadmin", ADMIN: "Administrator",
  BEREICHSLEITUNG: "Bereichsleitung", MARKTLEITER: "Marktleiter", USER: "Mitarbeiter",
};

const PERIOD_LABELS: Record<string, string> = {
  daily: "Täglich", monthly: "Monatlich", quarterly: "Quartal", yearly: "Jährlich",
};

const MARKET_NAMES: Record<number, string> = { 1: "Leeder", 2: "Buching", 3: "Marktoberdorf" };

type TabId = "regeln" | "empfaenger" | "protokoll" | "einstellungen";

export default function BenachrichtigungsEinstellungen() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<TabId>("regeln");
  const [sections, setSections] = useState<Section[]>([]);
  const [triggerTypes, setTriggerTypes] = useState<TriggerType[]>([]);
  const [checkRhythms, setCheckRhythms] = useState<CheckRhythm[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [users, setUsers] = useState<UserChannel[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({});
  const [loading, setLoading] = useState(true);
  const [checkRunning, setCheckRunning] = useState(false);
  const [checkResult, setCheckResult] = useState<{ checked: number; sent: number; errors: number } | null>(null);
  const [usersRefreshing, setUsersRefreshing] = useState(false);

  useEffect(() => {
    if (!adminSession || adminSession.role !== "SUPERADMIN") navigate("/");
  }, [adminSession, navigate]);

  const loadUsers = async () => {
    setUsersRefreshing(true);
    try {
      const usersData = await fetch(`${API_BASE}/notifications/channels`).then(r => r.json());
      setUsers(usersData || []);
    } finally {
      setUsersRefreshing(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [meta, rulesData, usersData, logData, settingsData] = await Promise.all([
        fetch(`${API_BASE}/notifications/meta`).then(r => r.json()),
        fetch(`${API_BASE}/notifications/rules`).then(r => r.json()),
        fetch(`${API_BASE}/notifications/channels`).then(r => r.json()),
        fetch(`${API_BASE}/notifications/log?limit=50`).then(r => r.json()),
        fetch(`${API_BASE}/notifications/email-settings`).then(r => r.json()),
      ]);
      setSections(meta.sections || []);
      setTriggerTypes(meta.triggerTypes || []);
      setCheckRhythms(meta.checkRhythms || []);
      setRules(rulesData || []);
      setUsers(usersData || []);
      setLog(logData || []);
      setEmailSettings(settingsData || {});
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: TabId) => {
    setTab(newTab);
    if (newTab === "empfaenger" || newTab === "regeln") {
      loadUsers();
    }
  };

  useEffect(() => { loadAll(); }, []);

  const runCheck = async () => {
    setCheckRunning(true);
    setCheckResult(null);
    try {
      const resp = await fetch(`${API_BASE}/notifications/check-now`, { method: "POST" });
      const data = await resp.json();
      setCheckResult(data);
      loadAll();
    } finally {
      setCheckRunning(false);
    }
  };

  if (!adminSession || adminSession.role !== "SUPERADMIN") return null;

  const tabs: { id: TabId; label: string; icon: typeof Bell; count?: number }[] = [
    { id: "regeln",        label: "Regeln",        icon: Bell,     count: rules.length },
    { id: "empfaenger",    label: "Empfänger",     icon: Users,    count: users.length },
    { id: "protokoll",     label: "Protokoll",     icon: Eye,      count: log.length },
    { id: "einstellungen", label: "Einstellungen", icon: Settings },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <PageHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/admin/system")} className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Benachrichtigungen</h1>
                <p className="text-sm text-white/70">Automatische Hinweise bei fehlenden HACCP-Einträgen.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {checkResult && (
                <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/15 text-white flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {checkResult.sent} gesendet · {checkResult.errors} Fehler
                </span>
              )}
              <button
                onClick={runCheck}
                disabled={checkRunning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                <Play className={cn("h-4 w-4", checkRunning && "animate-pulse")} />
                {checkRunning ? "Prüft..." : "Jetzt prüfen"}
              </button>
            </div>
          </div>
        </PageHeader>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                    tab === t.id ? "bg-white text-orange-700 shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={cn("px-1.5 py-0.5 rounded-full text-xs font-bold", tab === t.id ? "bg-orange-100 text-orange-700" : "bg-gray-200 text-gray-600")}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={loadUsers}
            disabled={usersRefreshing}
            title="Benutzerliste aktualisieren"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${usersRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Laden...</div>
        ) : (
          <>
            {tab === "regeln"        && <RegelnTab sections={sections} triggerTypes={triggerTypes} checkRhythms={checkRhythms} rules={rules} users={users} onSaved={loadAll} />}
            {tab === "empfaenger"    && <EmpfaengerTab users={users} onSaved={loadAll} />}
            {tab === "protokoll"     && <ProtokollTab log={log} sections={sections} />}
            {tab === "einstellungen" && <EinstellungenTab settings={emailSettings} onSaved={() => { loadAll(); }} />}
          </>
        )}
      </div>
    </AppLayout>
  );
}

const RHYTHM_LABELS: Record<string, string> = {
  daily: "Täglich", weekly_monday: "Wöchentlich (Mo)", monthly: "Monatlich", quarterly: "Quartalsweise", yearly: "Jährlich",
};

function RegelnTab({ sections, triggerTypes, checkRhythms, rules, users, onSaved }: {
  sections: Section[]; triggerTypes: TriggerType[]; checkRhythms: CheckRhythm[]; rules: Rule[]; users: UserChannel[]; onSaved: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [form, setForm] = useState({ sectionKey: "", triggerType: "no_entry_days", triggerValue: 7, notifyUserIds: [] as number[], marketIds: [] as number[], checkRhythm: "daily" });
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const openCreate = () => {
    setEditingRule(null);
    setForm({ sectionKey: "", triggerType: "no_entry_days", triggerValue: 7, notifyUserIds: [], marketIds: [], checkRhythm: "daily" });
    setUserSearch("");
    setShowForm(true);
  };

  const openEdit = (rule: Rule) => {
    setEditingRule(rule);
    setForm({
      sectionKey: rule.section_key,
      triggerType: rule.trigger_type,
      triggerValue: rule.trigger_value,
      notifyUserIds: [...rule.notify_user_ids],
      marketIds: rule.market_ids ? [...rule.market_ids] : [],
      checkRhythm: rule.check_rhythm || "daily",
    });
    setUserSearch("");
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingRule(null); };

  const groups = [...new Set(sections.map(s => s.group))];

  const handleCreate = async () => {
    if (!form.sectionKey) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/notifications/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionKey: form.sectionKey,
          triggerType: form.triggerType,
          triggerValue: form.triggerValue,
          notifyUserIds: form.notifyUserIds,
          marketIds: form.marketIds,
          checkRhythm: form.checkRhythm,
        }),
      });
      closeForm();
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingRule || !form.sectionKey) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/notifications/rules/${editingRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionKey: form.sectionKey,
          triggerType: form.triggerType,
          triggerValue: form.triggerValue,
          notifyUserIds: form.notifyUserIds,
          marketIds: form.marketIds,
          checkRhythm: form.checkRhythm,
        }),
      });
      closeForm();
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Regel löschen?")) return;
    setDeletingId(id);
    try {
      await fetch(`${API_BASE}/notifications/rules/${id}`, { method: "DELETE" });
      onSaved();
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (rule: Rule) => {
    setTogglingId(rule.id);
    try {
      await fetch(`${API_BASE}/notifications/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.is_active }),
      });
      onSaved();
    } finally {
      setTogglingId(null);
    }
  };

  const toggleUser = (userId: number) => {
    setForm(prev => ({
      ...prev,
      notifyUserIds: prev.notifyUserIds.includes(userId)
        ? prev.notifyUserIds.filter(id => id !== userId)
        : [...prev.notifyUserIds, userId],
    }));
  };

  const toggleMarketRule = (marketId: number) => {
    setForm(prev => ({
      ...prev,
      marketIds: prev.marketIds.includes(marketId)
        ? prev.marketIds.filter(id => id !== marketId)
        : [...prev.marketIds, marketId],
    }));
  };

  const ALL_MARKETS = [{ id: 1, name: "Leeder" }, { id: 2, name: "Buching" }, { id: 3, name: "Marktoberdorf" }];

  const triggerNeedsValue = form.triggerType !== "overdue_period";
  const selectedSection = sections.find(s => s.key === form.sectionKey);

  const getTriggerLabel = (type: string, value: number, unit: string) => {
    if (type === "no_entry_days")   return `Keine Einträge seit ${value} Tagen`;
    if (type === "before_due_days") return `${value} Tage vor Periodenende`;
    if (type === "overdue_period")  return `Aktuelle Periode fehlt`;
    return type;
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-800">
        <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Tägliche Prüfung um 07:00 Uhr</span> — Das System prüft automatisch alle aktiven Regeln und sendet Benachrichtigungen. Eine manuelle Prüfung ist jederzeit über „Jetzt prüfen" möglich.
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">Aktive Regeln ({rules.length})</h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors"
        >
          <Plus className="h-4 w-4" /> Neue Regel
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-5 space-y-4">
          <h4 className="font-bold text-foreground flex items-center gap-2">
            {editingRule ? <Pencil className="h-4 w-4 text-orange-500" /> : <Bell className="h-4 w-4 text-orange-500" />}
            {editingRule ? "Regel bearbeiten" : "Neue Benachrichtigungsregel"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">HACCP-Bereich</label>
              <select
                value={form.sectionKey}
                onChange={e => setForm(prev => ({ ...prev, sectionKey: e.target.value }))}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="">— Bitte wählen —</option>
                {groups.map(group => (
                  <optgroup key={group} label={group}>
                    {sections.filter(s => s.group === group).map(s => (
                      <option key={s.key} value={s.key}>{s.key} – {s.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {selectedSection && (
                <p className="text-xs text-muted-foreground mt-1">
                  Standardrhythmus der Sektion: <span className="font-medium">{PERIOD_LABELS[selectedSection.periodType] || selectedSection.periodType}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Filialen <span className="font-normal text-muted-foreground/60">(leer = alle 3 Filialen)</span>
              </label>
              <div className="flex gap-2">
                {ALL_MARKETS.map(m => {
                  const sel = form.marketIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMarketRule(m.id)}
                      className={cn(
                        "flex-1 px-2 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                        sel ? "bg-orange-50 text-orange-700 border-orange-400" : "bg-white text-muted-foreground border-border hover:border-orange-200"
                      )}
                    >
                      {sel && <Check className="h-3 w-3 inline-block mr-0.5" />}
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Auslöser</label>
              <select
                value={form.triggerType}
                onChange={e => setForm(prev => ({ ...prev, triggerType: e.target.value }))}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                {triggerTypes.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {triggerTypes.find(t => t.key === form.triggerType)?.description}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Prüfungsrhythmus</label>
              <select
                value={form.checkRhythm}
                onChange={e => setForm(prev => ({ ...prev, checkRhythm: e.target.value }))}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                {(checkRhythms.length > 0 ? checkRhythms : [
                  { key: "daily", label: "Täglich", description: "" },
                  { key: "weekly_monday", label: "Wöchentlich (jeden Montag)", description: "" },
                  { key: "monthly", label: "Monatlich (1. des Monats)", description: "" },
                  { key: "quarterly", label: "Quartalsweise", description: "" },
                  { key: "yearly", label: "Jährlich (1. Januar)", description: "" },
                ]).map(r => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Wie oft prüft das System diese Regel?
              </p>
            </div>

            {triggerNeedsValue && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Schwellwert (Tage)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1} max={365}
                    value={form.triggerValue}
                    onChange={e => setForm(prev => ({ ...prev, triggerValue: Number(e.target.value) }))}
                    className="w-24 px-3 py-2.5 border border-border rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <div className="flex gap-2">
                    {[1, 3, 7, 14, 30].map(d => (
                      <button
                        key={d}
                        onClick={() => setForm(prev => ({ ...prev, triggerValue: d }))}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          form.triggerValue === d ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-white text-muted-foreground border-border hover:border-orange-300"
                        )}
                      >
                        {d === 1 ? "1T" : d === 7 ? "1W" : d === 14 ? "2W" : d === 30 ? "1M" : `${d}T`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-muted-foreground">
                Empfänger ({form.notifyUserIds.length} ausgewählt)
              </label>
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Mitarbeiter suchen…"
                className="px-3 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-200 w-48"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {users.filter(u => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => {
                const selected = form.notifyUserIds.includes(u.id);
                const hasChannel = u.channel_type && u.channel_type !== "off";
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all",
                      selected ? "bg-orange-50 border-orange-300 text-orange-800" : "bg-white border-border text-muted-foreground hover:border-orange-200"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center", selected ? "bg-orange-500 border-orange-500" : "border-gray-300")}>
                      {selected && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-xs">{u.name}</div>
                      <div className="text-xs opacity-60">{ROLE_LABELS[u.role] || u.role}</div>
                    </div>
                    {hasChannel ? (
                      <span className="text-xs">
                        {u.channel_type === "email" ? "📧" : u.channel_type === "telegram" ? "💬" : ""}
                      </span>
                    ) : (
                      <BellOff className="h-3 w-3 text-muted-foreground/40" title="Kein Kanal konfiguriert" />
                    )}
                  </button>
                );
              })}
            </div>
            {form.notifyUserIds.some(id => {
              const u = users.find(u => u.id === id);
              return !u?.channel_type || u.channel_type === "off";
            }) && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Einige Empfänger haben noch keinen Benachrichtigungskanal eingerichtet.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={editingRule ? handleUpdate : handleCreate}
              disabled={saving || !form.sectionKey || form.notifyUserIds.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-40"
            >
              {editingRule ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saving ? "Speichert..." : editingRule ? "Änderungen speichern" : "Regel erstellen"}
            </button>
            <button onClick={closeForm} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Noch keine Regeln angelegt.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Erstellen Sie eine Regel um automatische Hinweise zu erhalten.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => {
            const section = sections.find(s => s.key === rule.section_key);
            const notifyUsers = users.filter(u => rule.notify_user_ids.includes(u.id));
            return (
              <div key={rule.id} className={cn("bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4", rule.is_active ? "border-border/60" : "border-border/30 opacity-60")}>
                <div className={cn("w-2 h-10 rounded-full flex-shrink-0", rule.is_active ? "bg-orange-400" : "bg-gray-300")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-sm text-foreground">{section?.label || rule.section_key}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {PERIOD_LABELS[section?.periodType || ""] || section?.periodType}
                    </span>
                    {rule.market_ids && rule.market_ids.length > 0
                      ? rule.market_ids.map(mid => (
                          <span key={mid} className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-medium">
                            {MARKET_NAMES[mid] || `Markt ${mid}`}
                          </span>
                        ))
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-medium">Alle Filialen</span>
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getTriggerLabel(rule.trigger_type, rule.trigger_value, "")}
                    {rule.check_rhythm && rule.check_rhythm !== "daily" && <> · <span className="font-medium">{RHYTHM_LABELS[rule.check_rhythm] || rule.check_rhythm}</span></>}
                    {" · "}{notifyUsers.length === 0 ? "Keine Empfänger" : notifyUsers.map(u => u.name).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(rule)}
                    disabled={togglingId === rule.id}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      rule.is_active ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    {rule.is_active ? <><Check className="h-3 w-3" /> Aktiv</> : "Inaktiv"}
                  </button>
                  <button
                    onClick={() => openEdit(rule)}
                    title="Bearbeiten"
                    className="p-2 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    disabled={deletingId === rule.id}
                    className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const MARKETS = [{ id: 1, name: "Leeder" }, { id: 2, name: "Buching" }, { id: 3, name: "Marktoberdorf" }];

function EmpfaengerTab({ users, onSaved }: { users: UserChannel[]; onSaved: () => void }) {
  const [saving, setSaving] = useState<number | null>(null);
  const [localUsers, setLocalUsers] = useState<UserChannel[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  useEffect(() => { setLocalUsers(users.map(u => ({ ...u, assigned_market_ids: u.assigned_market_ids || [] }))); }, [users]);

  const updateLocal = (userId: number, field: string, value: string) => {
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
    setSavedIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
  };

  const toggleMarket = (userId: number, marketId: number) => {
    setLocalUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const current = u.assigned_market_ids || [];
      const updated = current.includes(marketId)
        ? current.filter(id => id !== marketId)
        : [...current, marketId];
      return { ...u, assigned_market_ids: updated };
    }));
    setSavedIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
  };

  const save = async (userId: number) => {
    const u = localUsers.find(u => u.id === userId);
    if (!u) return;
    setSaving(userId);
    try {
      await fetch(`${API_BASE}/notifications/channels/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelType: u.channel_type || "off",
          telegramChatId: u.telegram_chat_id,
          emailOverride: u.email_override,
          assignedMarketIds: u.role === "MARKTLEITER" ? (u.assigned_market_ids || []) : undefined,
        }),
      });
      setSavedIds(prev => new Set([...prev, userId]));
      setTimeout(() => setSavedIds(prev => { const s = new Set(prev); s.delete(userId); return s; }), 3000);
      onSaved();
    } finally {
      setSaving(null);
    }
  };

  const roleOrder = ["SUPERADMIN", "ADMIN", "BEREICHSLEITUNG", "MARKTLEITER", "USER"];
  const sorted = [...localUsers].sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <MessageCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 space-y-1.5">
          <p className="font-semibold">Telegram einrichten (einmalig pro Person):</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs">
            <li>Den HACCP-Bot bei Telegram suchen und „/start" schreiben</li>
            <li>Die Chat-ID erscheint in der Antwort — diese hier eintragen</li>
            <li>Alternativ: @userinfobot bei Telegram schreiben um die eigene Chat-ID zu erhalten</li>
          </ol>
          <p className="text-xs opacity-80">Der Bot-Token muss einmalig vom Administrator in den Systemeinstellungen hinterlegt werden (Umgebungsvariable <code className="bg-amber-100 px-1 rounded">TELEGRAM_BOT_TOKEN</code>).</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="bg-[#1a3a6b] text-white px-5 py-3 flex items-center gap-3">
          <Users className="h-5 w-5" />
          <h2 className="text-base font-bold">Benachrichtigungskanäle ({localUsers.length} Mitarbeiter)</h2>
        </div>
        <div className="divide-y divide-border/40">
          {sorted.map(u => {
            const isSaving = saving === u.id;
            const isSaved = savedIds.has(u.id);
            const channel = u.channel_type || "off";
            return (
              <div key={u.id} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-sm text-foreground">{u.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{ROLE_LABELS[u.role] || u.role}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      {(["off", "email", "telegram"] as const).map(ch => (
                        <button
                          key={ch}
                          onClick={() => updateLocal(u.id, "channel_type", ch)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                            channel === ch
                              ? ch === "off" ? "bg-gray-100 text-gray-700 border-gray-300"
                                : ch === "email" ? "bg-blue-50 text-blue-700 border-blue-300"
                                : "bg-green-50 text-green-700 border-green-300"
                              : "bg-white text-muted-foreground border-border hover:border-gray-300"
                          )}
                        >
                          {ch === "off" && <><BellOff className="h-3.5 w-3.5" /> Aus</>}
                          {ch === "email" && <><Mail className="h-3.5 w-3.5" /> E-Mail</>}
                          {ch === "telegram" && <><MessageCircle className="h-3.5 w-3.5" /> Telegram</>}
                        </button>
                      ))}
                    </div>

                    {channel === "email" && (
                      <div className="max-w-xs">
                        <label className="block text-xs text-muted-foreground mb-1">E-Mail-Adresse{u.email ? ` (Standard: ${u.email})` : ""}</label>
                        <input
                          type="email"
                          value={u.email_override || ""}
                          onChange={e => updateLocal(u.id, "email_override", e.target.value)}
                          placeholder={u.email || "name@beispiel.de"}
                          className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Leer = hinterlegte E-Mail des Benutzers wird verwendet.</p>
                      </div>
                    )}

                    {channel === "telegram" && (
                      <div className="max-w-xs">
                        <label className="block text-xs text-muted-foreground mb-1">Telegram Chat-ID</label>
                        <input
                          type="text"
                          value={u.telegram_chat_id || ""}
                          onChange={e => updateLocal(u.id, "telegram_chat_id", e.target.value)}
                          placeholder="z.B. 123456789"
                          className="w-full px-3 py-2 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-200"
                        />
                      </div>
                    )}

                    {u.role === "MARKTLEITER" && (
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                          <Store className="h-3.5 w-3.5" /> Zugeordnete Filialen
                          <span className="text-muted-foreground/60">(leer = alle Filialen)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {MARKETS.map(m => {
                            const assigned = (u.assigned_market_ids || []).includes(m.id);
                            return (
                              <button
                                key={m.id}
                                onClick={() => toggleMarket(u.id, m.id)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all",
                                  assigned ? "bg-orange-50 text-orange-700 border-orange-300" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                                )}
                              >
                                {assigned && <Check className="h-3 w-3 inline-block mr-1" />}
                                {m.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => save(u.id)}
                    disabled={isSaving || isSaved}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 mt-1",
                      isSaved ? "bg-green-100 text-green-700 border border-green-200" : "bg-[#1a3a6b] text-white hover:bg-[#1a3a6b]/90 disabled:opacity-50"
                    )}
                  >
                    {isSaved ? <><Check className="h-3.5 w-3.5" /> Gespeichert</> : <><Send className="h-3.5 w-3.5" /> {isSaving ? "..." : "Speichern"}</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EinstellungenTab({ settings, onSaved }: { settings: EmailSettings; onSaved: () => void }) {
  const [form, setForm] = useState<EmailSettings>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showTgToken, setShowTgToken] = useState(false);

  useEffect(() => { setForm({ ...settings }); }, [settings]);

  const update = (field: keyof EmailSettings, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/notifications/email-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: form.smtp_host,
          smtpPort: Number(form.smtp_port) || 587,
          smtpUser: form.smtp_user,
          smtpPass: form.smtp_pass,
          fromName: form.from_name,
          defaultRecipient: form.default_recipient,
          enabled: form.enabled,
          telegramBotToken: form.telegram_bot_token,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Email SMTP */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="bg-[#1a3a6b] text-white px-5 py-3 flex items-center gap-3">
          <Mail className="h-5 w-5" />
          <h2 className="text-base font-bold">E-Mail-Versand (SMTP)</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-border/40">
            <span className="text-sm font-semibold text-foreground flex-1">E-Mail-Benachrichtigungen aktiv</span>
            <button
              onClick={() => update("enabled", !form.enabled)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                form.enabled ? "bg-orange-500" : "bg-gray-300"
              )}
            >
              <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform", form.enabled ? "translate-x-6" : "translate-x-1")} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">SMTP-Server (Host)</label>
              <input type="text" value={form.smtp_host || ""} onChange={e => update("smtp_host", e.target.value)}
                placeholder="smtp.ionos.de" className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">SMTP-Port</label>
              <input type="number" value={form.smtp_port || 587} onChange={e => update("smtp_port", Number(e.target.value))}
                placeholder="587" className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">SMTP-Benutzername</label>
              <input type="text" value={form.smtp_user || ""} onChange={e => update("smtp_user", e.target.value)}
                placeholder="haccp@edeka-dallmann.de" className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">SMTP-Passwort</label>
              <div className="relative">
                <input type={showSmtpPass ? "text" : "password"} value={form.smtp_pass || ""} onChange={e => update("smtp_pass", e.target.value)}
                  placeholder="••••••••" className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <button type="button" onClick={() => setShowSmtpPass(p => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Absendername</label>
              <input type="text" value={form.from_name || ""} onChange={e => update("from_name", e.target.value)}
                placeholder="EDEKA Dallmann HACCP" className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Standard-Empfänger (Fallback)</label>
              <input type="email" value={form.default_recipient || ""} onChange={e => update("default_recipient", e.target.value)}
                placeholder="chef@edeka-dallmann.de" className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Telegram */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="bg-[#1a3a6b] text-white px-5 py-3 flex items-center gap-3">
          <MessageCircle className="h-5 w-5" />
          <h2 className="text-base font-bold">Telegram Bot-Token</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <p className="font-semibold mb-1">Bot erstellen (einmalig):</p>
            <ol className="list-decimal list-inside text-xs space-y-0.5">
              <li>Bei Telegram <strong>@BotFather</strong> schreiben und <code>/newbot</code> eingeben</li>
              <li>Einen Namen und Benutzernamen für den Bot wählen</li>
              <li>Den generierten Token hier eintragen</li>
            </ol>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Bot-Token</label>
            <div className="relative">
              <input type={showTgToken ? "text" : "password"} value={form.telegram_bot_token || ""} onChange={e => update("telegram_bot_token", e.target.value)}
                placeholder="1234567890:ABCdef..." className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-200" />
              <button type="button" onClick={() => setShowTgToken(p => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <Eye className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Alternativ kann der Token auch als Umgebungsvariable <code className="bg-gray-100 px-1 rounded">TELEGRAM_BOT_TOKEN</code> hinterlegt werden — dann hat die Umgebungsvariable Vorrang.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || saved}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
            saved ? "bg-green-100 text-green-700 border border-green-200" : "bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
          )}
        >
          {saved ? <><Check className="h-4 w-4" /> Gespeichert</> : <><Save className="h-4 w-4" /> {saving ? "Speichert..." : "Einstellungen speichern"}</>}
        </button>
      </div>
    </div>
  );
}

function ProtokollTab({ log, sections }: { log: LogEntry[]; sections: Section[] }) {
  const statusIcon = (status: string) => status === "sent"
    ? <CheckCircle className="h-4 w-4 text-green-500" />
    : <XCircle className="h-4 w-4 text-red-400" />;

  const channelIcon = (ch: string) => ch === "email"
    ? <Mail className="h-3.5 w-3.5 text-blue-500" />
    : ch === "telegram"
    ? <MessageCircle className="h-3.5 w-3.5 text-green-500" />
    : null;

  if (log.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-12 text-center">
        <Eye className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Noch keine Benachrichtigungen versendet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="bg-[#1a3a6b] text-white px-5 py-3 flex items-center gap-3">
        <Eye className="h-5 w-5" />
        <h2 className="text-base font-bold">Versandprotokoll (letzte {log.length} Einträge)</h2>
      </div>
      <div className="divide-y divide-border/40">
        {log.map(entry => {
          const section = sections.find(s => s.key === entry.section_key);
          const dt = new Date(entry.sent_at);
          return (
            <div key={entry.id} className="px-5 py-3 flex items-center gap-4">
              <div className="flex-shrink-0">{statusIcon(entry.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-foreground truncate">{section?.label || entry.section_key}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">→ {entry.user_name}</span>
                  <span className="flex items-center gap-0.5">{channelIcon(entry.channel_type)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{entry.message} · {MARKET_NAMES[entry.market_id] || `Markt ${entry.market_id}`}</p>
              </div>
              <div className="text-xs text-muted-foreground flex-shrink-0 text-right">
                <div>{dt.toLocaleDateString("de-DE")}</div>
                <div>{dt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
