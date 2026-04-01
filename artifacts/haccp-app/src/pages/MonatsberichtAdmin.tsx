import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft, FileText, Send, Eye, Settings, CheckCircle2,
  AlertCircle, Loader2, Mail, Calendar, Building2
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

const MARKETS = [
  { id: 1, name: "Leeder",         defaultEmail: "markt@edeka-dallmann.de" },
  { id: 2, name: "Buching",        defaultEmail: "markt-buching@edeka-dallmann.de" },
  { id: 3, name: "Marktoberdorf",  defaultEmail: "markt-mod@edeka-dallmann.de" },
];

const GERMAN_MONTHS = [
  "", "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

interface MarktConfig {
  id?: number;
  marketId: number;
  empfaengerEmail: string | null;
  autoSend: boolean;
  sendDay: number;
  isActive: boolean;
}

export default function MonatsberichtAdmin() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();

  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const [selectedMarket, setSelectedMarket] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(prevMonth);
  const [selectedYear, setSelectedYear] = useState<number>(prevYear);
  const [customEmail, setCustomEmail] = useState<string>("");
  const [senden, setSenden] = useState<boolean>(false);

  const [configs, setConfigs] = useState<Record<number, MarktConfig>>({});
  const [configSaving, setConfigSaving] = useState<number | null>(null);
  const [localConfigs, setLocalConfigs] = useState<Record<number, MarktConfig>>({});

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; emailStatus?: string; error?: string } | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!adminSession || adminSession.role !== "SUPERADMIN") {
      navigate("/");
    }
  }, [adminSession, navigate]);

  // Load configs
  useEffect(() => {
    if (!adminSession) return;
    fetch(`${API}/admin/monatsbericht-config`, {
      headers: { "x-admin-email": adminSession.email },
    })
      .then(r => r.json())
      .then((data: MarktConfig[]) => {
        const map: Record<number, MarktConfig> = {};
        for (const d of data) map[d.marketId] = d;
        setConfigs(map);
        // Init local state
        const local: Record<number, MarktConfig> = {};
        for (const m of MARKETS) {
          local[m.id] = map[m.id] ?? {
            marketId: m.id,
            empfaengerEmail: m.defaultEmail,
            autoSend: false,
            sendDay: 1,
            isActive: true,
          };
        }
        setLocalConfigs(local);
      })
      .catch(() => {});
  }, [adminSession]);

  // Sync iframe when previewHtml changes
  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [previewHtml]);

  if (!adminSession || adminSession.role !== "SUPERADMIN") return null;

  const headers = { "Content-Type": "application/json", "x-admin-email": adminSession.email };

  async function saveConfig(marketId: number) {
    const cfg = localConfigs[marketId];
    if (!cfg) return;
    setConfigSaving(marketId);
    try {
      const r = await fetch(`${API}/admin/monatsbericht-config/${marketId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(cfg),
      });
      const data = await r.json();
      setConfigs(prev => ({ ...prev, [marketId]: data }));
    } finally {
      setConfigSaving(null);
    }
  }

  function updateLocalConfig(marketId: number, updates: Partial<MarktConfig>) {
    setLocalConfigs(prev => ({
      ...prev,
      [marketId]: { ...(prev[marketId] ?? { marketId, empfaengerEmail: null, autoSend: false, sendDay: 1, isActive: true }), ...updates },
    }));
  }

  async function handleGenerieren() {
    setGenerating(true);
    setResult(null);
    setPreviewHtml(null);
    try {
      const r = await fetch(`${API}/admin/monatsbericht/generieren`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          marketId: selectedMarket,
          monat: selectedMonth,
          jahr: selectedYear,
          senden,
          empfaengerEmail: customEmail || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setResult({ error: data.error || "Unbekannter Fehler." });
      } else {
        setResult({ success: true, emailStatus: data.emailStatus });
        if (data.html) setPreviewHtml(data.html);
      }
    } catch {
      setResult({ error: "Netzwerkfehler beim Generieren." });
    } finally {
      setGenerating(false);
    }
  }

  async function handleVorschau() {
    setPreviewLoading(true);
    setPreviewHtml(null);
    try {
      const r = await fetch(
        `${API}/admin/monatsbericht/vorschau?marketId=${selectedMarket}&monat=${selectedMonth}&jahr=${selectedYear}`,
        { headers: { "x-admin-email": adminSession.email } }
      );
      const html = await r.text();
      setPreviewHtml(html);
    } catch {
      setPreviewHtml("<p style='padding:20px;color:red'>Fehler beim Laden der Vorschau.</p>");
    } finally {
      setPreviewLoading(false);
    }
  }

  const years = [prevYear - 1, prevYear, now.getFullYear()];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/admin/system" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Monatsbericht</h1>
              <p className="text-white/70 text-sm">HACCP-Daten aggregieren und per E-Mail versenden.</p>
            </div>
          </div>
        </PageHeader>

        {/* Bericht generieren */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-base">Bericht erstellen</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Filiale</label>
              <select
                value={selectedMarket}
                onChange={e => setSelectedMarket(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {MARKETS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Monat</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {GERMAN_MONTHS.slice(1).map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Jahr</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* E-Mail-Option */}
          <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="senden"
                checked={senden}
                onChange={e => setSenden(e.target.checked)}
                className="w-4 h-4 accent-purple-600"
              />
              <label htmlFor="senden" className="text-sm font-medium cursor-pointer">
                Bericht per E-Mail senden
              </label>
            </div>
            {senden && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Empfänger-E-Mail (leer = konfigurierte Adresse der Filiale)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={customEmail}
                    onChange={e => setCustomEmail(e.target.value)}
                    placeholder={localConfigs[selectedMarket]?.empfaengerEmail ?? "z. B. markt@edeka-dallmann.de"}
                    className="w-full pl-9 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleVorschau}
              disabled={previewLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-300 text-purple-700 font-semibold text-sm hover:bg-purple-50 transition-colors disabled:opacity-50"
            >
              {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Vorschau
            </button>
            <button
              onClick={handleGenerieren}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : (senden ? <Send className="w-4 h-4" /> : <FileText className="w-4 h-4" />)}
              {senden ? "Generieren & Senden" : "Generieren"}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className={`flex items-start gap-3 rounded-xl p-3 text-sm ${result.error ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
              {result.error
                ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                : <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              <div>
                {result.error
                  ? result.error
                  : <>
                    <span className="font-semibold">Bericht erfolgreich erstellt.</span>
                    {result.emailStatus && <div className="mt-0.5 text-xs text-green-600">{result.emailStatus}</div>}
                  </>}
              </div>
            </div>
          )}
        </div>

        {/* Vorschau iframe */}
        {previewHtml && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <span className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                Berichts-Vorschau
              </span>
              <button
                onClick={() => {
                  const w = window.open("", "_blank");
                  if (w) { w.document.open(); w.document.write(previewHtml); w.document.close(); }
                }}
                className="text-xs text-purple-600 hover:underline font-medium"
              >
                In neuem Tab öffnen →
              </button>
            </div>
            <iframe
              ref={iframeRef}
              className="w-full"
              style={{ height: "600px", border: "none" }}
              title="Monatsbericht Vorschau"
            />
          </div>
        )}

        {/* Config per Filiale */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-base">E-Mail-Konfiguration je Filiale</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Hier wird hinterlegt, an welche Adresse der Bericht je Filiale standardmäßig gesendet wird. Der Auto-Versand ist noch nicht aktiv – die Funktion wird in einer zukünftigen Version freigeschaltet.
          </p>
          <div className="space-y-4">
            {MARKETS.map(m => {
              const cfg = localConfigs[m.id];
              if (!cfg) return null;
              const saved = configs[m.id];
              const isDirty = JSON.stringify(cfg) !== JSON.stringify(saved);
              return (
                <div key={m.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold text-sm">{m.name}</span>
                    {isDirty && <span className="text-xs text-amber-600 font-medium ml-auto">● Nicht gespeichert</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Standard-Empfänger</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={cfg.empfaengerEmail ?? ""}
                          onChange={e => updateLocalConfig(m.id, { empfaengerEmail: e.target.value })}
                          className="w-full pl-9 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Versandtag (Auto)</label>
                      <input
                        type="number"
                        min={1} max={28}
                        value={cfg.sendDay}
                        onChange={e => updateLocalConfig(m.id, { sendDay: Number(e.target.value) })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        disabled
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => saveConfig(m.id)}
                    disabled={configSaving === m.id || !isDirty}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors disabled:opacity-40"
                  >
                    {configSaving === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Speichern
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
