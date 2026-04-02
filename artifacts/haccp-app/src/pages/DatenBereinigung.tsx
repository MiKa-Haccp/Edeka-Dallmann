import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft,
  Trash2,
  AlertTriangle,
  ClipboardList,
  ShieldAlert,
  History,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const MARKETS = [
  { id: 1, name: "Leeder" },
  { id: 2, name: "Buching" },
  { id: 3, name: "MOD" },
];

const CATEGORIES = [
  {
    id: "hygiene",
    label: "Hygiene- & Temperaturdaten",
    desc: "Alle HACCP-Listen, Messreihen, Betriebsbegehungen, Reinigungsprotokolle der Filiale.",
    defaultOn: true,
  },
  {
    id: "mhd",
    label: "MHD-Daten",
    desc: "Wareneingänge, MHD-Kontrollen, Warencheck OG und Regalmeter-Infos.",
    defaultOn: true,
  },
  {
    id: "todo",
    label: "To-Do & Rundgang",
    desc: "Abgeschlossene Tagesaufgaben und Ad-hoc-Aufgaben der Filiale.",
    defaultOn: true,
  },
  {
    id: "kassen",
    label: "Kasseneinteilung",
    desc: "Alle Schichtpläne (Kasse, Leergut, MoPro) vor dem Stichtag.",
    defaultOn: true,
  },
  {
    id: "mitarbeiter",
    label: "Mitarbeiter-Zuordnung",
    desc: "Verknüpfung der Mitarbeiter zur Filiale lösen. Stammdaten bleiben erhalten.",
    defaultOn: false,
  },
  {
    id: "zeugnisse",
    label: "Importierte Zeugnisse",
    desc: "Gesundheitszeugnisse, Hygienebelehrungen, Bescheinigungen und Anti-Vektor-Nachweise.",
    defaultOn: false,
  },
];

interface ResetLog {
  id: number;
  admin_pin: string;
  admin_name: string;
  market_id: number;
  market_name: string;
  cutoff_date: string;
  categories: string[];
  deleted_counts: Record<string, number>;
  created_at: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  hygiene: "Hygiene",
  mhd: "MHD",
  todo: "To-Do",
  kassen: "Kassen",
  mitarbeiter: "Mitarbeiter",
  zeugnisse: "Zeugnisse",
};

export default function DatenBereinigung() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [marketId, setMarketId] = useState<number | "">("");
  const [cutoffDate, setCutoffDate] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.id, c.defaultOn]))
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [logs, setLogs] = useState<ResetLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (!adminSession || adminSession.role !== "SUPERADMIN") {
      navigate("/");
    }
  }, [adminSession, navigate]);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const r = await fetch("/api/system-reset/logs");
      if (r.ok) setLogs(await r.json());
    } finally {
      setLogsLoading(false);
    }
  }

  if (!adminSession || adminSession.role !== "SUPERADMIN") return null;

  const marketName = MARKETS.find((m) => m.id === marketId)?.name ?? "";
  const anySelected = Object.values(selected).some(Boolean);
  const canSubmit = marketId !== "" && cutoffDate !== "" && anySelected;

  function toggleCategory(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function executeReset() {
    if (!canSubmit) return;
    setLoading(true);
    setShowConfirm(false);
    try {
      const categories = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k);

      const r = await fetch("/api/system-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPin: adminSession!.userId?.toString() ?? "?",
          adminName: adminSession!.username ?? adminSession!.email ?? "Admin",
          marketId,
          marketName,
          cutoffDate,
          categories,
        }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Unbekannter Fehler");

      setResult(data.deletedCounts);
      toast({ title: "Reset erfolgreich", description: `Daten für ${marketName} gelöscht.` });
      loadLogs();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const totalDeleted = result ? Object.values(result).reduce((a, b) => a + b, 0) : 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/system"
              className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Daten-Bereinigung</h1>
              <p className="text-white/70 text-sm">Selektiver System-Reset je Filiale</p>
            </div>
          </div>
        </PageHeader>

        {/* Erfolgs-Anzeige */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="font-bold text-green-800">Reset abgeschlossen</p>
                <p className="text-sm text-green-700">
                  {totalDeleted} Datensätze für <strong>{marketName}</strong> gelöscht.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result).map(([k, v]) => (
                <span
                  key={k}
                  className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium"
                >
                  {CATEGORY_LABEL[k] ?? k}: {v}
                </span>
              ))}
            </div>
            <button
              onClick={() => setResult(null)}
              className="mt-3 text-xs text-green-600 underline"
            >
              Neuen Reset vorbereiten
            </button>
          </div>
        )}

        {!result && (
          <>
            {/* Filial-Auswahl */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                <h2 className="font-bold text-gray-800">1. Filiale & Stichtag</h2>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Filiale <span className="text-red-500">*</span>
                </label>
                <select
                  value={marketId}
                  onChange={(e) => setMarketId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                >
                  <option value="">– Filiale wählen –</option>
                  {MARKETS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Stichtag für Reset{" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500">
                  Alle Datensätze <strong>bis einschließlich</strong> diesem Datum werden gelöscht.
                </p>
                <input
                  type="date"
                  value={cutoffDate}
                  onChange={(e) => setCutoffDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            {/* Kategorien */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                <h2 className="font-bold text-gray-800">2. Datenkategorien</h2>
              </div>

              <div className="space-y-3">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all
                      ${selected[cat.id]
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!selected[cat.id]}
                      onChange={() => toggleCategory(cat.id)}
                      className="mt-0.5 accent-purple-600 w-4 h-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{cat.label}</span>
                        {!cat.defaultOn && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                            Standard: aus
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Hinweis-Banner */}
            {canSubmit && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Hinweis vor dem Reset</p>
                  <p>
                    Du bist dabei, Daten der Filiale <strong>{marketName}</strong> vor dem{" "}
                    <strong>
                      {new Date(cutoffDate + "T00:00:00").toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </strong>{" "}
                    unwiderruflich zu löschen. Alle Benachrichtigungs-Trigger werden
                    für diese Filiale ab dem Stichtag neu berechnet.
                  </p>
                </div>
              </div>
            )}

            {/* Aktions-Button */}
            <button
              disabled={!canSubmit || loading}
              onClick={() => setShowConfirm(true)}
              className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Reset wird ausgeführt …
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Reset vorbereiten
                </>
              )}
            </button>
          </>
        )}

        {/* Revisions-Log */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-gray-800">Revisions-Protokoll</h2>
            </div>
            <button
              onClick={loadLogs}
              className="text-xs text-purple-600 hover:underline"
            >
              Aktualisieren
            </button>
          </div>

          {logsLoading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Lade Protokoll …
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              Noch keine Reset-Vorgänge protokolliert.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const total = Object.values(log.deleted_counts).reduce((a, b) => a + b, 0);
                return (
                  <div
                    key={log.id}
                    className="border border-gray-100 rounded-xl p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800">
                        Filiale: {log.market_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <p>
                        <span className="font-medium">Admin:</span> {log.admin_name}
                      </p>
                      <p>
                        <span className="font-medium">Stichtag:</span>{" "}
                        {new Date(log.cutoff_date).toLocaleDateString("de-DE")}
                      </p>
                      <p>
                        <span className="font-medium">Kategorien:</span>{" "}
                        {log.categories.map((c) => CATEGORY_LABEL[c] ?? c).join(", ")}
                      </p>
                      <p>
                        <span className="font-medium">Gelöscht:</span>{" "}
                        <span className="text-red-600 font-semibold">{total} Datensätze</span>
                        {" – "}
                        {Object.entries(log.deleted_counts)
                          .map(([k, v]) => `${CATEGORY_LABEL[k] ?? k}: ${v}`)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bestätigungs-Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Letzte Bestätigung</h3>
                <p className="text-sm text-gray-500">Dieser Vorgang kann nicht rückgängig gemacht werden!</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <p className="font-semibold mb-1">ACHTUNG:</p>
              <p>
                Die Daten der Filiale <strong>{marketName}</strong> werden unwiderruflich gelöscht.
                Alle Datensätze vor dem{" "}
                <strong>
                  {new Date(cutoffDate + "T00:00:00").toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </strong>{" "}
                in folgenden Kategorien werden entfernt:{" "}
                <strong>
                  {Object.entries(selected)
                    .filter(([, v]) => v)
                    .map(([k]) => CATEGORY_LABEL[k] ?? k)
                    .join(", ")}
                </strong>
                .
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={executeReset}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 text-sm font-bold transition-colors"
              >
                Ja, unwiderruflich löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
