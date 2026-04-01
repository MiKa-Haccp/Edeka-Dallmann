import { type ReactNode, useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link } from "wouter";
import { Loader2, ChevronLeft, ChevronRight, Info, TableProperties } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

const SHIFTS = [
  { key: "frueh",  label: "Frühschicht",  short: "F",
    headerBg: "bg-amber-100",  headerText: "text-amber-900",
    cellBg:   "bg-amber-50/60", border: "border-amber-200" },
  { key: "mittel", label: "Mittelschicht", short: "M",
    headerBg: "bg-teal-100",   headerText: "text-teal-900",
    cellBg:   "bg-teal-50/60", border: "border-teal-200" },
  { key: "spaet",  label: "Spätschicht",  short: "S",
    headerBg: "bg-purple-100", headerText: "text-purple-900",
    cellBg:   "bg-purple-50/60", border: "border-purple-200" },
];
const TILLS = [1, 2, 3, 4];

interface MarketUser { id: number; name: string; first_name: string; last_name: string; initials: string; role: string; }
interface Assignment { id: number; shift: string; till_number: number; user_id: number | null; user_name: string | null; notes: string | null; uhrzeit: string | null; }

export default function TodoKassen() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN"
    || adminSession?.role === "MARKTLEITER" || adminSession?.role === "BEREICHSLEITUNG";

  const [users, setUsers]             = useState<MarketUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading]         = useState(false);
  const [savingKey, setSavingKey]     = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const dateStr = selectedDate.toISOString().split("T")[0];
  const isToday = dateStr === new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const [uRes, aRes] = await Promise.all([
        fetch(`${BASE}/todo/market-users?marketId=${selectedMarketId}`),
        fetch(`${BASE}/todo/till-assignments?marketId=${selectedMarketId}&date=${dateStr}`),
      ]);
      setUsers(await uRes.json());
      setAssignments(await aRes.json());
    } finally { setLoading(false); }
  }, [selectedMarketId, dateStr]);

  useEffect(() => { load(); }, [load]);

  const getAssignment = (shift: string, till: number) =>
    assignments.find(a => a.shift === shift && a.till_number === till);

  const save = async (shift: string, till: number, patch: Partial<{ userId: number | null; userName: string | null; uhrzeit: string | null }>) => {
    if (!selectedMarketId || !isAdmin) return;
    const key = `${shift}-${till}`;
    const existing = getAssignment(shift, till);
    setSavingKey(key);
    try {
      const uid   = "userId"   in patch ? patch.userId   : (existing?.user_id   ?? null);
      const uname = "userName" in patch ? patch.userName : (existing?.user_name ?? null);
      const zeit  = "uhrzeit"  in patch ? patch.uhrzeit  : (existing?.uhrzeit   ?? null);

      const res = await fetch(`${BASE}/todo/till-assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId,
          date: dateStr,
          shift,
          tillNumber: till,
          userId:   uid,
          userName: uname,
          uhrzeit:  zeit,
        }),
      });
      const updated: Assignment = await res.json();
      setAssignments(prev => {
        const filtered = prev.filter(a => !(a.shift === shift && a.till_number === till));
        return [...filtered, updated];
      });
    } finally { setSavingKey(null); }
  };

  const handleNameChange = (shift: string, till: number, userId: string) => {
    const uid  = userId ? Number(userId) : null;
    const user = uid ? users.find(u => u.id === uid) : null;
    const uname = user ? (user.name || `${user.first_name} ${user.last_name}`.trim()) : null;
    save(shift, till, { userId: uid, userName: uname });
  };

  const handleZeitBlur = (shift: string, till: number, value: string) => {
    const trimmed = value.trim() || null;
    const existing = getAssignment(shift, till);
    if (trimmed === (existing?.uhrzeit ?? null)) return;
    save(shift, till, { uhrzeit: trimmed });
  };

  const moveDate = (days: number) => {
    setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + days); return n; });
  };

  const displayName = (u: MarketUser) => u.name || `${u.first_name} ${u.last_name}`.trim();

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-5 pb-8">

        {/* Header */}
        <PageHeader className="from-[#0f766e] to-[#14b8a6]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Link href="/todo" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                <TableProperties className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Kasseneinteilung</h1>
                <p className="text-white/70 text-sm">
                  {selectedDate.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => moveDate(-1)} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  isToday ? "bg-white text-[#0f766e]" : "bg-white/15 hover:bg-white/25 text-white"
                }`}
              >
                Heute
              </button>
              <button onClick={() => moveDate(1)} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </PageHeader>

        {!isAdmin && (
          <div className="flex items-center gap-2 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 text-sm">
            <Info className="w-4 h-4 shrink-0" />
            Nur zur Ansicht – Änderungen sind dem Marktleiter vorbehalten.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                {/* Schicht-Header (Zeile 1) */}
                <tr>
                  <th className="w-24 bg-gray-50 border-b border-r border-border/50" rowSpan={2}>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-3">Kasse</span>
                  </th>
                  {SHIFTS.map(s => (
                    <th key={s.key} colSpan={2} className={`${s.headerBg} ${s.headerText} border-b border-r border-border/30 text-center py-2.5 text-sm font-bold tracking-wide`}>
                      {s.label}
                    </th>
                  ))}
                </tr>
                {/* Unterheader: Wer / Uhr (Zeile 2) */}
                <tr>
                  {SHIFTS.map(s => (
                    <>
                      <th key={`${s.key}-wer`} className={`${s.headerBg} ${s.headerText} border-b border-r border-border/20 text-left px-3 py-1.5 text-xs font-semibold w-40`}>
                        Mitarbeiter
                      </th>
                      <th key={`${s.key}-uhr`} className={`${s.headerBg} ${s.headerText} border-b border-r border-border/20 text-left px-3 py-1.5 text-xs font-semibold w-24`}>
                        Uhrzeit
                      </th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TILLS.map((till, tillIdx) => {
                  const isLast = tillIdx === TILLS.length - 1;
                  return (
                    <tr key={till} className={`${isLast ? "" : "border-b border-border/40"} hover:bg-gray-50/50 transition-colors`}>
                      {/* Kassen-Label */}
                      <td className="border-r border-border/50 bg-gray-50 px-3 py-3 text-center">
                        <span className="text-sm font-bold text-foreground">Kasse {till}</span>
                      </td>

                      {/* Schicht-Zellen */}
                      {SHIFTS.map((shift, shiftIdx) => {
                        const key  = `${shift.key}-${till}`;
                        const a    = getAssignment(shift.key, till);
                        const busy = savingKey === key;
                        const isLastShift = shiftIdx === SHIFTS.length - 1;

                        return (
                          <>
                            {/* Mitarbeiter-Spalte */}
                            <td key={`${key}-wer`} className={`${shift.cellBg} px-2.5 py-2.5 border-r border-border/20`}>
                              {isAdmin ? (
                                <div className="relative">
                                  {busy && (
                                    <Loader2 className="w-3 h-3 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                                  )}
                                  <select
                                    value={a?.user_id ?? ""}
                                    onChange={e => handleNameChange(shift.key, till, e.target.value)}
                                    disabled={busy}
                                    className="w-full border border-border/50 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e]/25 disabled:opacity-50 appearance-none cursor-pointer pr-6 min-w-0"
                                  >
                                    <option value="">– Frei –</option>
                                    {users.map(u => (
                                      <option key={u.id} value={u.id}>{displayName(u)}</option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <span className={`text-xs ${a?.user_name ? "font-medium text-foreground" : "text-muted-foreground italic"}`}>
                                  {a?.user_name ?? "—"}
                                </span>
                              )}
                            </td>

                            {/* Uhrzeit-Spalte */}
                            <td key={`${key}-uhr`} className={`${shift.cellBg} px-2.5 py-2.5 ${isLastShift ? "" : "border-r border-border/20"}`}>
                              {isAdmin ? (
                                <input
                                  type="text"
                                  defaultValue={a?.uhrzeit ?? ""}
                                  key={`${key}-zeit-${a?.uhrzeit}`}
                                  onBlur={e => handleZeitBlur(shift.key, till, e.target.value)}
                                  placeholder="z.B. 6–14"
                                  className="w-full border border-border/50 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e]/25 placeholder:text-muted-foreground/50"
                                />
                              ) : (
                                <span className={`text-xs ${a?.uhrzeit ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                  {a?.uhrzeit ?? "—"}
                                </span>
                              )}
                            </td>
                          </>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {users.length === 0 && !loading && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            <Info className="w-4 h-4 shrink-0" />
            Keine Mitarbeiter diesem Markt zugeordnet. Bitte in der Mitarbeiterverwaltung prüfen.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
