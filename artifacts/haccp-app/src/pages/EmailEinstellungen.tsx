import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useLocation } from "wouter";
import {
  Mail, Save, ShieldAlert, Loader2, Check, X,
  Eye, EyeOff, FlaskConical, AlertCircle, CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

interface EmailSettings {
  id: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string | null;
  fromName: string | null;
  defaultRecipient: string | null;
  enabled: boolean;
  hasPassword: boolean;
  updatedAt: string;
}

export default function EmailEinstellungen() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();

  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [smtpHost, setSmtpHost] = useState("smtp.ionos.de");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [fromName, setFromName] = useState("EDEKA Dallmann HACCP");
  const [defaultRecipient, setDefaultRecipient] = useState("qm.suedbayern@edeka.de");
  const [enabled, setEnabled] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!adminSession || adminSession.role !== "SUPERADMIN") {
      navigate("/");
    }
  }, [adminSession, navigate]);

  useEffect(() => {
    if (!adminSession?.email) return;
    fetch(`${BASE}/admin/email-settings`, {
      headers: { "x-admin-email": adminSession.email },
    })
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setSmtpHost(data.smtpHost || "smtp.ionos.de");
        setSmtpPort(String(data.smtpPort || 587));
        setSmtpUser(data.smtpUser || "");
        setFromName(data.fromName || "EDEKA Dallmann HACCP");
        setDefaultRecipient(data.defaultRecipient || "qm.suedbayern@edeka.de");
        setEnabled(data.enabled || false);
      })
      .finally(() => setLoading(false));
  }, [adminSession?.email]);

  if (!adminSession || adminSession.role !== "SUPERADMIN") return null;

  async function handleSave() {
    setSaving(true);
    setSaveResult(null);
    try {
      const body: Record<string, any> = {
        smtpHost,
        smtpPort: parseInt(smtpPort),
        smtpUser,
        fromName,
        defaultRecipient,
        enabled,
      };
      if (smtpPass.trim()) body.smtpPass = smtpPass;

      const res = await fetch(`${BASE}/admin/email-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminSession.email,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveResult({ ok: false, msg: data.error || "Fehler beim Speichern." });
      } else {
        setSettings(data);
        setSmtpPass("");
        setSaveResult({ ok: true, msg: "Einstellungen gespeichert." });
      }
    } catch {
      setSaveResult({ ok: false, msg: "Netzwerkfehler." });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${BASE}/admin/email-settings/test`, {
        method: "POST",
        headers: { "x-admin-email": adminSession.email },
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult({ ok: false, msg: data.error || "Test fehlgeschlagen." });
      } else {
        setTestResult({ ok: true, msg: data.message || "Test-E-Mail gesendet." });
      }
    } catch {
      setTestResult({ ok: false, msg: "Netzwerkfehler beim Testen." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
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
            SMTP-Zugangsdaten für den automatischen E-Mail-Versand aus dem HACCP-System. Nur der Superadministrator hat Zugriff auf diese Daten.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">

            {/* Aktivierung */}
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-foreground">E-Mail-Versand aktiviert</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Wenn deaktiviert, erscheint der Sende-Button aber sendet keine E-Mails.
                </p>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enabled ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* SMTP Server */}
            <div className="p-5 space-y-4">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">SMTP-Server</p>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    SMTP-Server (Host)
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="smtp.ionos.de"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Port</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                IONOS-Standard: <strong>smtp.ionos.de</strong> Port <strong>587</strong> (STARTTLS) oder Port <strong>465</strong> (SSL)
              </div>
            </div>

            {/* Zugangsdaten */}
            <div className="p-5 space-y-4">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">Zugangsdaten</p>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Absender-E-Mail (SMTP-Benutzername)
                </label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="markt@edeka-dallmann.de"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Passwort
                  {settings?.hasPassword && (
                    <span className="ml-2 text-green-600 font-normal">✓ bereits gesetzt</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder={settings?.hasPassword ? "Leer lassen um beizubehalten" : "Passwort eingeben"}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Absender & Empfänger */}
            <div className="p-5 space-y-4">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">Absender & Empfänger</p>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Absendername (Anzeigename)
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="EDEKA Dallmann HACCP"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Standard-Empfänger (Produktfehlermeldung)
                </label>
                <input
                  type="email"
                  value={defaultRecipient}
                  onChange={(e) => setDefaultRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="qm.suedbayern@edeka.de"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  An diese Adresse werden Produktfehlermeldungen gesendet.
                </p>
              </div>
            </div>

            {/* Aktionen */}
            <div className="p-5 space-y-3">
              {saveResult && (
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    saveResult.ok
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {saveResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {saveResult.msg}
                </div>
              )}

              {testResult && (
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    testResult.ok
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {testResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {testResult.msg}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Einstellungen speichern
                </button>

                <button
                  onClick={handleTest}
                  disabled={testing || !settings?.hasPassword}
                  title={!settings?.hasPassword ? "Zuerst speichern" : "Test-E-Mail an Ihre Adresse senden"}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                  Verbindung testen
                </button>
              </div>

              {!settings?.hasPassword && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Bitte erst Zugangsdaten speichern, dann die Verbindung testen.
                </p>
              )}

              {settings?.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Zuletzt geändert: {new Date(settings.updatedAt).toLocaleString("de-DE")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
