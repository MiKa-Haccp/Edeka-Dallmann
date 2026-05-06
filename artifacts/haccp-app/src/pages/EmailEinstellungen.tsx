import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useLocation } from "wouter";
import {
  Mail, Save, ShieldAlert, Loader2,
  Eye, EyeOff, FlaskConical, AlertCircle, CheckCircle2,
  ChevronLeft, Building2,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

const MARKT_LABELS: Record<number, { name: string; email: string }> = {
  1: { name: "Leeder",        email: "markt@edeka-dallmann.de" },
  2: { name: "Buching",       email: "markt-buching@edeka-dallmann.de" },
  3: { name: "Marktoberdorf", email: "markt-mod@edeka-dallmann.de" },
};

interface GlobalSettings {
  id: number;
  smtpHost: string;
  smtpPort: number;
  fromName: string | null;
  defaultRecipient: string | null;
  qmEmail: string | null;
  enabled: boolean;
  hasPassword: boolean;
  updatedAt: string;
}

interface MarketConfig {
  id: number;
  marketId: number;
  smtpUser: string | null;
  fromName: string | null;
  hasPassword: boolean;
  updatedAt: string;
}

function StatusPill({ ok, msg, className = "" }: { ok: boolean; msg: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"} ${className}`}>
      {ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {msg}
    </div>
  );
}

function PasswordInput({ value, onChange, hasExisting, placeholder }: {
  value: string; onChange: (v: string) => void; hasExisting?: boolean; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
        placeholder={hasExisting ? "Leer lassen um beizubehalten" : (placeholder || "Passwort eingeben")}
        autoComplete="new-password"
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function MarktSection({ marketId, adminEmail, globalSaved }: { marketId: number; adminEmail: string; globalSaved: boolean }) {
  const markt = MARKT_LABELS[marketId];
  const [config, setConfig] = useState<MarketConfig | null>(null);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [fromName, setFromName] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch(`${BASE}/admin/market-email-configs`, {
      headers: { "x-admin-email": adminEmail },
    })
      .then((r) => r.json())
      .then((data: MarketConfig[]) => {
        const c = data.find((x) => x.marketId === marketId);
        if (c) {
          setConfig(c);
          setSmtpUser(c.smtpUser || "");
          setFromName(c.fromName || markt.name);
        } else {
          setFromName(`EDEKA Dallmann ${markt.name}`);
          setSmtpUser(markt.email);
        }
      });
  }, [adminEmail, marketId]);

  async function save() {
    setSaving(true);
    setSaveResult(null);
    const body: Record<string, any> = { smtpUser, fromName };
    if (smtpPass.trim()) body.smtpPass = smtpPass;
    const res = await fetch(`${BASE}/admin/market-email-configs/${marketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveResult({ ok: false, msg: data.error || "Fehler." }); return; }
    setConfig(data);
    setSmtpPass("");
    setSaveResult({ ok: true, msg: "Gespeichert." });
  }

  async function test() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch(`${BASE}/admin/email-settings/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
      body: JSON.stringify({ marketId }),
    });
    const data = await res.json();
    setTesting(false);
    if (!res.ok) { setTestResult({ ok: false, msg: data.error || "Test fehlgeschlagen." }); return; }
    setTestResult({ ok: true, msg: data.message || "Test-E-Mail gesendet." });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1a3a6b]/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-[#1a3a6b]" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Markt {markt.name}</p>
          <p className="text-xs text-muted-foreground">{markt.email}</p>
        </div>
        {config?.hasPassword && (
          <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">✓ Konfiguriert</span>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Absender-E-Mail</label>
            <input
              type="email"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder={markt.email}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Passwort
              {config?.hasPassword && <span className="ml-1 text-green-600 font-normal">✓ gesetzt</span>}
            </label>
            <PasswordInput value={smtpPass} onChange={setSmtpPass} hasExisting={config?.hasPassword} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Absendername</label>
          <input
            type="text"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder={`EDEKA Dallmann ${markt.name}`}
          />
        </div>

        {saveResult && <StatusPill ok={saveResult.ok} msg={saveResult.msg} />}
        {testResult && <StatusPill ok={testResult.ok} msg={testResult.msg} />}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Speichern
          </button>
          <button
            onClick={test}
            disabled={testing || !config?.hasPassword}
            title={!config?.hasPassword ? "Erst speichern" : "Test senden"}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
            Verbindung testen
          </button>
        </div>

        {!config?.hasPassword && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Zugangsdaten eingeben und speichern, dann testen.
          </p>
        )}
      </div>
    </div>
  );
}

export default function EmailEinstellungen() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();

  const [global, setGlobal] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [smtpHost, setSmtpHost] = useState("smtp.ionos.de");
  const [smtpPort, setSmtpPort] = useState("587");
  const [defaultRecipient, setDefaultRecipient] = useState("qm.suedbayern@edeka.de");
  const [qmEmail, setQmEmail] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [globalSaved, setGlobalSaved] = useState(false);

  useEffect(() => {
    if (!adminSession || adminSession.role !== "SUPERADMIN") navigate("/");
  }, [adminSession, navigate]);

  useEffect(() => {
    if (!adminSession?.email) return;
    fetch(`${BASE}/admin/email-settings`, { headers: { "x-admin-email": adminSession.email } })
      .then((r) => r.json())
      .then((d) => {
        setGlobal(d);
        setSmtpHost(d.smtpHost || "smtp.ionos.de");
        setSmtpPort(String(d.smtpPort || 587));
        setDefaultRecipient(d.defaultRecipient || "qm.suedbayern@edeka.de");
        setQmEmail(d.qmEmail || "");
        setEnabled(d.enabled || false);
        setGlobalSaved(true);
      })
      .finally(() => setLoading(false));
  }, [adminSession?.email]);

  if (!adminSession || adminSession.role !== "SUPERADMIN") return null;

  async function saveGlobal() {
    setSaving(true);
    setSaveResult(null);
    const res = await fetch(`${BASE}/admin/email-settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-email": adminSession!.email },
      body: JSON.stringify({ smtpHost, smtpPort: parseInt(smtpPort), defaultRecipient, qmEmail, enabled }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveResult({ ok: false, msg: data.error || "Fehler." }); return; }
    setGlobal(data);
    setGlobalSaved(true);
    setSaveResult({ ok: true, msg: "Globale Einstellungen gespeichert." });
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        <div>
          <Link href="/admin/system">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Systemverwaltung
            </button>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold mb-3">
            <ShieldAlert className="w-3.5 h-3.5" /> Nur für Superadministratoren
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">E-Mail Einstellungen</h1>
          <p className="text-muted-foreground text-sm">
            SMTP-Konfiguration für den automatischen E-Mail-Versand. Jeder Markt hat eine eigene Absenderadresse und ein eigenes Passwort.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Globale Einstellungen */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Globale Einstellungen</p>
                  <p className="text-xs text-muted-foreground">SMTP-Server, Empfänger, Aktivierung</p>
                </div>
                <button
                  onClick={() => setEnabled(!enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                  IONOS-Standard: <strong>smtp.ionos.de</strong> Port <strong>587</strong> (STARTTLS) · Der Toggle oben aktiviert/deaktiviert den E-Mail-Versand global.
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">SMTP-Server</label>
                    <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder="smtp.ionos.de" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Port</label>
                    <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder="587" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Standard-Empfänger (Produktfehlermeldung & Probeentnahme)</label>
                  <input type="email" value={defaultRecipient} onChange={(e) => setDefaultRecipient(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="qm.suedbayern@edeka.de" />
                  <p className="text-xs text-muted-foreground mt-1">An diese Adresse werden Produktfehlermeldungen & Probeentnahmen gesendet.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">QM-Empfänger (TÜV Aktionsplan)</label>
                  <input type="email" value={qmEmail} onChange={(e) => setQmEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="qm.suedbayern@edeka.de" />
                  <p className="text-xs text-muted-foreground mt-1">An diese Adresse werden TÜV-Aktionspläne gesendet. Leer = Standard-Empfänger wird verwendet.</p>
                </div>

                {saveResult && <StatusPill ok={saveResult.ok} msg={saveResult.msg} />}

                <button onClick={saveGlobal} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Globale Einstellungen speichern
                </button>

                {global?.updatedAt && (
                  <p className="text-xs text-muted-foreground">Zuletzt geändert: {new Date(global.updatedAt).toLocaleString("de-DE")}</p>
                )}
              </div>
            </div>

            {/* Pro-Markt Einstellungen */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-[#1a3a6b]" />
                <h2 className="text-base font-bold text-foreground">Absender-Adressen pro Markt</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Jeder Markt sendet mit seiner eigenen IONOS-E-Mail-Adresse. Das Passwort ist das jeweilige IONOS-Passwort für diese Adresse.
              </p>
              <div className="space-y-4">
                {[1, 2, 3].map((id) => (
                  <MarktSection key={id} marketId={id} adminEmail={adminSession!.email} globalSaved={globalSaved} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
