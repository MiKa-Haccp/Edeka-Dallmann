import { type ReactNode, useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link } from "wouter";
import { Loader2, ChevronLeft, ChevronRight, Info } from "lucide-react";

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;
const BASE = import.meta.env.VITE_API_URL || "/api";

const SHIFTS = [
  { key: "frueh",   label: "Frühschicht",  color: "bg-amber-50  border-amber-200", headColor: "bg-amber-100  text-amber-800"  },
  { key: "mittel",  label: "Mittelschicht", color: "bg-blue-50   border-blue-200",  headColor: "bg-blue-100   text-blue-800"   },
  { key: "spaet",   label: "Spätschicht",  color: "bg-purple-50 border-purple-200", headColor: "bg-purple-100 text-purple-800" },
];
const TILLS = [1, 2, 3, 4];

interface MarketUser { id: number; name: string; first_name: string; last_name: string; initials: string; role: string; }
interface Assignment { id: number; shift: string; till_number: number; user_id: number | null; user_name: string | null; notes: string | null; }

export default function TodoKassen() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN"
    || adminSession?.role === "MARKTLEITER" || adminSession?.role === "BEREICHSLEITUNG";

  const [users, setUsers] = useState<MarketUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
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

  const handleChange = async (shift: string, till: number, userId: string) => {
    if (!selectedMarketId || !isAdmin) return;
    const uid = userId ? Number(userId) : null;
    const user = uid ? users.find(u => u.id === uid) : null;
    const key = `${shift}-${till}`;
    setSaving(key);
    try {
      const res = await fetch(`${BASE}/todo/till-assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId,
          date: dateStr,
          shift,
          tillNumber: till,
          userId: uid,
          userName: user ? (user.name || `${user.first_name} ${user.last_name}`.trim()) : null,
        }),
      });
      const updated = await res.json();
      setAssignments(prev => {
        const filtered = prev.filter(a => !(a.shift === shift && a.till_number === till));
        return [...filtered, updated];
      });
    } finally { setSaving(null); }
  };

  const moveDate = (days: number) => {
    setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + days); return n; });
  };

  const displayName = (u: MarketUser) => u.name || `${u.first_name} ${u.last_name}`.trim();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <PageHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Link href="/todo" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Kasseneinteilung</h1>
                <p className="text-white/70 text-sm">{selectedDate.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => moveDate(-1)} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setSelectedDate(new Date())} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${isToday ? "bg-white text-[#1a3a6b]" : "bg-white/15 hover:bg-white/25 text-white"}`}>Heute</button>
              <button onClick={() => moveDate(1)} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </PageHeader>

        {!isAdmin && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
            <Info className="w-4 h-4 shrink-0" />
            Nur zur Ansicht – Änderungen sind dem Marktleiter vorbehalten.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            {SHIFTS.map(shift => (
              <div key={shift.key} className={`rounded-2xl border ${shift.color} overflow-hidden`}>
                <div className={`px-4 py-2.5 ${shift.headColor} font-bold text-sm`}>{shift.label}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/40">
                  {TILLS.map(till => {
                    const key = `${shift.key}-${till}`;
                    const a = getAssignment(shift.key, till);
                    const isSaving = saving === key;
                    return (
                      <div key={till} className="p-3 space-y-1.5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Kasse {till}</p>
                        {isAdmin ? (
                          <div className="relative">
                            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2 top-2.5 text-muted-foreground" />}
                            <select
                              value={a?.user_id ?? ""}
                              onChange={e => handleChange(shift.key, till, e.target.value)}
                              disabled={isSaving}
                              className="w-full border border-border/60 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 bg-white disabled:opacity-50 pr-6"
                            >
                              <option value="">– Frei –</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{displayName(u)}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className={`px-3 py-2 rounded-xl text-xs font-medium min-h-[2.25rem] flex items-center ${a?.user_name ? "bg-white border border-border/40 text-foreground" : "text-muted-foreground italic"}`}>
                            {a?.user_name ?? "Frei"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
