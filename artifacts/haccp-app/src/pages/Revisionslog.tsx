import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useMarketsWithCache } from "@/hooks/useMarketsWithCache";
import { ChevronLeft, Search, FileSearch, Loader2, Download, RefreshCw } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";
const ALLOWED_ROLES = ["SUPERADMIN", "ADMIN"];
const MONTHS_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const FULL_MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const CURRENT_YEAR = new Date().getFullYear();

const MODULE_OPTIONS = [
  { value: "", label: "Alle Module" },
  { value: "reinigung", label: "Reinigung täglich" },
  { value: "kaese", label: "Käsetheke" },
  { value: "semmel", label: "Semmelliste" },
  { value: "salat", label: "Öffnung Salate" },
  { value: "wareneingang", label: "Wareneingänge" },
  { value: "obst", label: "Warencheck OG" },
  { value: "fleisch", label: "Eingefrorenes Fleisch" },
  { value: "temp", label: "Temp-Lagerkontrolle" },
  { value: "metz", label: "Metzgerei Reinigung" },
];

interface LogEntry {
  modul: string; market_id: number; year: number; month: number | null; day: number | null;
  kuerzel: string; user_id: number | null; created_at: string;
  user_name: string | null; market_name: string | null;
}

export default function Revisionslog() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();
  const { markets } = useMarketsWithCache();

  const [marketId, setMarketId] = useState<string>("");
  const [year, setYear] = useState<string>(String(CURRENT_YEAR));
  const [month, setMonth] = useState<string>("");
  const [modul, setModul] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!adminSession || !ALLOWED_ROLES.includes(adminSession.role)) navigate("/");
  }, [adminSession, navigate]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const params = new URLSearchParams();
    if (marketId) params.set("marketId", marketId);
    if (year) params.set("year", year);
    if (month) params.set("month", month);
    if (modul) params.set("modul", modul);
    params.set("limit", "1000");
    try {
      const res = await fetch(`${BASE}/archiv/revisionslog?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEntries(data);
      setLoaded(true);
    } catch (e: any) { setError(e.message || "Fehler beim Laden"); }
    finally { setLoading(false); }
  }, [marketId, year, month, modul]);

  const filtered = entries.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.kuerzel?.toLowerCase().includes(q) || e.user_name?.toLowerCase().includes(q) || e.modul.toLowerCase().includes(q) || e.market_name?.toLowerCase().includes(q));
  });

  const exportCsv = () => {
    const header = "Zeitstempel;Modul;Markt;Jahr;Monat;Tag;Kürzel;Mitarbeiter";
    const rows = filtered.map(e => [
      new Date(e.created_at).toLocaleString("de-DE"),
      e.modul, e.market_name ?? e.market_id, e.year,
      e.month ? MONTHS_DE[e.month - 1] : "-", e.day ?? "-",
      e.kuerzel, e.user_name ?? "-",
    ].join(";"));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `revisionslog_${year || "alle"}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (!adminSession || !ALLOWED_ROLES.includes(adminSession.role)) return null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/verwaltung" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Revisionslog</h1>
              <p className="text-sm text-white/70">Lückenlose Protokollierung aller Einträge – wer, wann, was.</p>
            </div>
          </div>
        </PageHeader>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Filter</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Markt</label>
              <select value={marketId} onChange={e => setMarketId(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a6b]/40">
                <option value="">Alle Märkte</option>
                {markets?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Jahr</label>
              <select value={year} onChange={e => setYear(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a6b]/40">
                <option value="">Alle Jahre</option>
                {Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Monat</label>
              <select value={month} onChange={e => setMonth(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a6b]/40">
                <option value="">Alle Monate</option>
                {FULL_MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Modul</label>
              <select value={modul} onChange={e => setModul(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a6b]/40">
                {MODULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a3a6b] text-white text-sm font-semibold hover:bg-[#2d5aa0] disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Suchen
            </button>
            {loaded && (
              <button onClick={exportCsv}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                <Download className="w-4 h-4" /> CSV exportieren
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loaded && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
              <p className="text-sm font-semibold">{filtered.length} Einträge{search ? ` (gefiltert aus ${entries.length})` : ""}</p>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kürzel / Name suchen…"
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-border text-xs focus:outline-none focus:border-[#1a3a6b]/40 w-48" />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <FileSearch className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Keine Einträge gefunden.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#1a3a6b] text-white">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold whitespace-nowrap">Zeitstempel</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Modul</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Markt</th>
                      <th className="text-center px-2 py-2.5 font-semibold w-12">Jahr</th>
                      <th className="text-center px-2 py-2.5 font-semibold w-12">Mon.</th>
                      <th className="text-center px-2 py-2.5 font-semibold w-10">Tag</th>
                      <th className="text-center px-2 py-2.5 font-semibold w-14">Kürzel</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Mitarbeiter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {new Date(e.created_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-3 py-2 font-medium">{e.modul}</td>
                        <td className="px-3 py-2 text-muted-foreground">{e.market_name ?? `Markt ${e.market_id}`}</td>
                        <td className="px-2 py-2 text-center">{e.year}</td>
                        <td className="px-2 py-2 text-center">{e.month ? MONTHS_DE[e.month - 1] : "–"}</td>
                        <td className="px-2 py-2 text-center">{e.day ?? "–"}</td>
                        <td className="px-2 py-2 text-center">
                          <span className="inline-block bg-[#1a3a6b]/10 text-[#1a3a6b] font-bold px-2 py-0.5 rounded-lg">{e.kuerzel}</span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{e.user_name ?? "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800">{error}</div>
        )}

        {!loaded && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Filter einstellen und auf „Suchen" klicken.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
