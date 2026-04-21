import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useMarketsWithCache } from "@/hooks/useMarketsWithCache";
import { invalidateArchivCache } from "@/hooks/useArchivLock";
import { ChevronLeft, Archive, Lock, LockOpen, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";
const ALLOWED_ROLES = ["SUPERADMIN", "ADMIN", "BEREICHSLEITUNG", "MARKTLEITER"];

interface ArchivLock {
  id: number; marketId: number; year: number;
  lockedAt: string; lockedBy: number | null; lockedByName: string | null;
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 2025;
const YEARS = Array.from({ length: CURRENT_YEAR - MIN_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);

export default function Jahresarchiv() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();
  const { markets } = useMarketsWithCache();
  const [selectedMarket, setSelectedMarket] = useState<number | null>(null);
  const [locks, setLocks] = useState<ArchivLock[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionYear, setActionYear] = useState<number | null>(null);
  const [confirmYear, setConfirmYear] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const isSuperAdmin = adminSession?.role === "SUPERADMIN";
  const isAdmin = adminSession?.role === "ADMIN" || isSuperAdmin;

  useEffect(() => {
    if (!adminSession || !ALLOWED_ROLES.includes(adminSession.role)) navigate("/");
  }, [adminSession, navigate]);

  useEffect(() => {
    if (markets?.length && !selectedMarket) setSelectedMarket(markets[0].id);
  }, [markets, selectedMarket]);

  useEffect(() => {
    if (!selectedMarket) return;
    setLoading(true);
    fetch(`${BASE}/archiv/locks?marketId=${selectedMarket}`)
      .then(r => r.json())
      .then(setLocks)
      .catch(() => setLocks([]))
      .finally(() => setLoading(false));
  }, [selectedMarket]);

  const isYearLocked = (year: number) => locks.some(l => l.year === year);
  const getLock = (year: number) => locks.find(l => l.year === year);

  const lockYear = async (year: number) => {
    if (!selectedMarket) return;
    setActionYear(year);
    setMsg(null);
    try {
      const res = await fetch(`${BASE}/archiv/lock`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId: selectedMarket, year, lockedByName: adminSession?.name || adminSession?.email, lockedBy: adminSession?.userId ?? null }),
      });
      if (!res.ok) { const e = await res.json(); setMsg({ type: "err", text: e.error || "Fehler" }); return; }
      const newLock = await res.json();
      setLocks(prev => [...prev, newLock]);
      invalidateArchivCache(selectedMarket, year);
      setMsg({ type: "ok", text: `${year} wurde erfolgreich archiviert.` });
    } catch { setMsg({ type: "err", text: "Netzwerkfehler" }); }
    finally { setActionYear(null); setConfirmYear(null); }
  };

  const unlockYear = async (year: number) => {
    if (!selectedMarket) return;
    setActionYear(year);
    setMsg(null);
    try {
      await fetch(`${BASE}/archiv/lock/${selectedMarket}/${year}`, { method: "DELETE" });
      setLocks(prev => prev.filter(l => l.year !== year));
      invalidateArchivCache(selectedMarket, year);
      setMsg({ type: "ok", text: `Archivierung für ${year} aufgehoben.` });
    } catch { setMsg({ type: "err", text: "Netzwerkfehler" }); }
    finally { setActionYear(null); setConfirmYear(null); }
  };

  if (!adminSession || !ALLOWED_ROLES.includes(adminSession.role)) return null;

  const marketName = markets?.find(m => m.id === selectedMarket)?.name ?? "";

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/verwaltung" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Jahresarchiv</h1>
              <p className="text-sm text-white/70">Vergangene Jahre sperren – schreibgeschützt für Mitarbeiter.</p>
            </div>
          </div>
        </PageHeader>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-900">
          <p className="font-semibold mb-1">Wie funktioniert das Archiv?</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800 text-xs">
            <li>Archivierte Jahre sind für normale Mitarbeiter <b>nur lesbar</b> – keine neuen Einträge möglich.</li>
            <li>Admins sehen archivierte Daten weiterhin in allen Modulen.</li>
            <li>Empfohlen: Vorjahr immer zum <b>01.02.</b> archivieren.</li>
            {isSuperAdmin && <li>Als SuperAdmin können Sie Archivierungen wieder aufheben.</li>}
          </ul>
        </div>

        {/* Market selector */}
        {markets && markets.length > 1 && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-4">
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Markt auswählen</label>
            <div className="flex flex-wrap gap-2">
              {markets.map(m => (
                <button key={m.id} onClick={() => setSelectedMarket(m.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${selectedMarket === m.id ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "bg-white border-border hover:border-[#1a3a6b]/40"}`}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback messages */}
        {msg && (
          <div className={`rounded-2xl p-3 flex items-center gap-2 text-sm font-medium ${msg.type === "ok" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {msg.text}
          </div>
        )}

        {/* Years list */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60 bg-muted/30">
            <p className="text-sm font-semibold text-foreground">Archivstatus — {marketName}</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#1a3a6b] animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {YEARS.map(year => {
                const locked = isYearLocked(year);
                const lock = getLock(year);
                const isCurrent = year === CURRENT_YEAR;
                const isActing = actionYear === year;
                const isConfirming = confirmYear === year;

                return (
                  <div key={year} className={`px-5 py-4 flex items-center justify-between gap-4 ${locked ? "bg-amber-50/40" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${locked ? "bg-amber-100" : "bg-slate-100"}`}>
                        {locked ? <Lock className="w-5 h-5 text-amber-600" /> : <LockOpen className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <p className="font-bold text-base">{year}</p>
                        {locked && lock ? (
                          <p className="text-xs text-muted-foreground">
                            Archiviert am {new Date(lock.lockedAt).toLocaleDateString("de-DE")}
                            {lock.lockedByName ? ` · von ${lock.lockedByName}` : ""}
                          </p>
                        ) : isCurrent ? (
                          <p className="text-xs text-muted-foreground">Laufendes Jahr – noch nicht archivierbar</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Offen – alle Einträge editierbar</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!locked && !isCurrent && isAdmin && (
                        isConfirming ? (
                          <>
                            <button onClick={() => setConfirmYear(null)} className="px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted">
                              Abbrechen
                            </button>
                            <button onClick={() => lockYear(year)} disabled={isActing}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5">
                              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                              Bestätigen
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmYear(year)}
                            className="px-3 py-1.5 rounded-xl border border-amber-300 text-amber-700 bg-amber-50 text-xs font-semibold hover:bg-amber-100 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" /> Archivieren
                          </button>
                        )
                      )}
                      {locked && isSuperAdmin && (
                        isConfirming ? (
                          <>
                            <button onClick={() => setConfirmYear(null)} className="px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted">
                              Abbrechen
                            </button>
                            <button onClick={() => unlockYear(year)} disabled={isActing}
                              className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
                              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LockOpen className="w-3.5 h-3.5" />}
                              Sperre aufheben
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmYear(year)}
                            className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 bg-red-50 text-xs font-semibold hover:bg-red-100 flex items-center gap-1.5">
                            <LockOpen className="w-3.5 h-3.5" /> Aufheben
                          </button>
                        )
                      )}
                      {locked && !isSuperAdmin && (
                        <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-semibold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Archiviert
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold">
                          Aktuell
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
