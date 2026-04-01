import { useEffect, useState, useCallback, Fragment, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link } from "wouter";
import { Loader2, ChevronLeft, ChevronRight, Info, TableProperties, X, Clock } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

const SHIFTS = [
  { key: "frueh",  label: "Frühschicht",   defaultTime: "11:00" },
  { key: "mittel", label: "Mittelschicht",  defaultTime: "15:00" },
  { key: "spaet",  label: "Spätschicht",    defaultTime: "18:00" },
];
const TILLS = [1, 2, 3, 4];

// Halbstundentakt 5:00–22:00
const TIMES: string[] = [];
for (let h = 5; h <= 22; h++) {
  TIMES.push(`${h}:00`);
  if (h < 22) TIMES.push(`${h}:30`);
}

interface MarketUser { id: number; name: string; first_name: string; last_name: string; initials: string; role: string; }
interface Assignment { id: number; shift: string; till_number: number; user_id: number | null; user_name: string | null; notes: string | null; uhrzeit: string | null; }

// ─── Searchable Employee Picker ───────────────────────────────────────────────
function displayName(u: MarketUser) {
  return u.name || `${u.first_name} ${u.last_name}`.trim();
}

interface EmployeePickerProps {
  users: MarketUser[];
  value: number | null;
  onChange: (userId: number | null, userName: string | null) => void;
  disabled?: boolean;
}

function EmployeePicker({ users, value, onChange, disabled }: EmployeePickerProps) {
  const selectedUser = value ? users.find(u => u.id === value) ?? null : null;
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = query.trim()
    ? users.filter(u => displayName(u).toLowerCase().includes(query.toLowerCase()))
    : users;

  const select = (u: MarketUser | null) => {
    onChange(u ? u.id : null, u ? displayName(u) : null);
    setOpen(false); setQuery("");
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        onClick={() => { if (!disabled) { setOpen(true); setQuery(""); setTimeout(() => inputRef.current?.focus(), 30); } }}
        className={`flex items-center justify-between gap-1 border border-border/50 rounded-lg px-2 py-1.5 text-xs bg-white min-h-[30px] ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-[#0f766e]/40"}`}
      >
        <span className={selectedUser ? "text-foreground font-medium" : "text-muted-foreground/60 italic"}>
          {selectedUser ? displayName(selectedUser) : "– Frei –"}
        </span>
        {selectedUser && !disabled && (
          <button onMouseDown={e => { e.stopPropagation(); select(null); }} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-48 bg-white border border-border/60 rounded-xl shadow-lg overflow-hidden">
          <div className="p-1.5 border-b border-border/40">
            <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Name suchen…"
              className="w-full px-2 py-1 text-xs rounded-lg border border-border/40 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/25 bg-gray-50" />
          </div>
          <ul className="max-h-40 overflow-y-auto">
            <li onMouseDown={() => select(null)} className="px-3 py-1.5 text-xs text-muted-foreground italic cursor-pointer hover:bg-gray-50">– Frei –</li>
            {filtered.length === 0
              ? <li className="px-3 py-1.5 text-xs text-muted-foreground">Keine Ergebnisse</li>
              : filtered.map(u => (
                <li key={u.id} onMouseDown={() => select(u)}
                  className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-teal-50 hover:text-teal-800 transition-colors ${value === u.id ? "bg-teal-50 text-teal-800 font-semibold" : "text-foreground"}`}>
                  {displayName(u)}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Time Scroll Picker ───────────────────────────────────────────────────────
interface TimePickerProps {
  value: string | null;
  onChange: (val: string | null) => void;
  defaultTime?: string;
  disabled?: boolean;
}

function TimeScrollPicker({ value, onChange, defaultTime = "6:00", disabled }: TimePickerProps) {
  const [open, setOpen]   = useState(false);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const listRef  = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll to active / default when opening
  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      if (activeRef.current) {
        activeRef.current.scrollIntoView({ block: "center" });
      }
    }, 30);
  }, [open]);

  const targetTime = value ?? defaultTime;
  const handleOpen = () => { if (!disabled) setOpen(true); };

  const select = (t: string) => { onChange(t); setOpen(false); };
  const clear  = (e: React.MouseEvent) => { e.stopPropagation(); onChange(null); };

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Trigger */}
      <div
        onClick={handleOpen}
        className={`flex items-center gap-1.5 border border-border/50 rounded-lg px-2 py-1.5 text-xs bg-white min-h-[30px] group ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-[#0f766e]/40"
        }`}
      >
        <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
        <span className={`flex-1 ${value ? "text-foreground font-medium" : "text-muted-foreground/60"}`}>
          {value ?? "—"}
        </span>
        {value && !disabled && (
          <button onMouseDown={clear} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-28 bg-white border border-border/60 rounded-xl shadow-lg overflow-hidden">
          <ul ref={listRef} className="max-h-44 overflow-y-auto py-1 scroll-smooth">
            {TIMES.map(t => {
              const isSelected = value === t;
              const isDefault  = !value && t === defaultTime;
              return (
                <li
                  key={t}
                  ref={isSelected || (!value && isDefault) ? activeRef : undefined}
                  onMouseDown={() => select(t)}
                  className={`px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#0f766e] text-white font-bold"
                      : isDefault
                      ? "bg-teal-50 text-teal-700 font-semibold"
                      : "text-foreground hover:bg-teal-50 hover:text-teal-800"
                  }`}
                >
                  {t} Uhr
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function TodoKassen() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN"
    || adminSession?.role === "MARKTLEITER" || adminSession?.role === "BEREICHSLEITUNG";

  const [users, setUsers]               = useState<MarketUser[]>([]);
  const [assignments, setAssignments]   = useState<Assignment[]>([]);
  const [loading, setLoading]           = useState(false);
  const [savingKey, setSavingKey]       = useState<string | null>(null);
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

  const saveField = async (
    shift: string, till: number,
    patch: Partial<{ userId: number | null; userName: string | null; uhrzeit: string | null }>
  ) => {
    if (!selectedMarketId || !isAdmin) return;
    const key      = `${shift}-${till}`;
    const existing = getAssignment(shift, till);
    setSavingKey(key);
    try {
      const uid   = "userId"   in patch ? patch.userId   : (existing?.user_id   ?? null);
      const uname = "userName" in patch ? patch.userName : (existing?.user_name ?? null);
      const zeit  = "uhrzeit"  in patch ? patch.uhrzeit  : (existing?.uhrzeit   ?? null);
      const res = await fetch(`${BASE}/todo/till-assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId: selectedMarketId, date: dateStr, shift, tillNumber: till, userId: uid, userName: uname, uhrzeit: zeit }),
      });
      const updated: Assignment = await res.json();
      setAssignments(prev => [...prev.filter(a => !(a.shift === shift && a.till_number === till)), updated]);
    } finally { setSavingKey(null); }
  };

  const moveDate = (days: number) =>
    setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + days); return n; });

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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${isToday ? "bg-white text-[#0f766e]" : "bg-white/15 hover:bg-white/25 text-white"}`}
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
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-visible">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-border/50">
                  <th rowSpan={2} className="border-r border-border/40 px-3 py-2.5 text-center align-middle">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Kasse</span>
                  </th>
                  <th rowSpan={2} className="border-r border-border/40 px-3 py-2.5 text-center align-middle w-28">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Uhrzeit</span>
                  </th>
                  {SHIFTS.map((s, i) => (
                    <th key={s.key} colSpan={2}
                      className={`text-center py-2.5 text-sm font-bold text-gray-700 ${i < SHIFTS.length - 1 ? "border-r border-border/40" : ""}`}>
                      {s.label}
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-50 border-b border-border/50">
                  {SHIFTS.map((s, i) => (
                    <Fragment key={s.key}>
                      <th className="px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground border-r border-border/30 w-44">
                        Mitarbeiter
                      </th>
                      <th className={`px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground w-24 ${i < SHIFTS.length - 1 ? "border-r border-border/40" : ""}`}>
                        Uhr
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                {TILLS.map((till, tillIdx) => {
                  const isLast       = tillIdx === TILLS.length - 1;
                  const generalEntry = getAssignment("allgemein", till);
                  const generalKey   = `allgemein-${till}`;

                  return (
                    <tr key={till} className={`${!isLast ? "border-b border-border/40" : ""} hover:bg-gray-50/50 transition-colors`}>

                      {/* Kassen-Label */}
                      <td className="border-r border-border/40 bg-gray-50 px-3 py-3 text-center font-bold text-sm text-foreground whitespace-nowrap">
                        Kasse {till}
                      </td>

                      {/* Allgemeine Uhrzeit */}
                      <td className="border-r border-border/40 px-2.5 py-2.5 bg-gray-50/40">
                        {isAdmin ? (
                          <div className="relative">
                            {savingKey === generalKey && (
                              <Loader2 className="w-3 h-3 animate-spin absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                            )}
                            <TimeScrollPicker
                              value={generalEntry?.uhrzeit ?? null}
                              defaultTime="6:00"
                              disabled={savingKey === generalKey}
                              onChange={val => saveField("allgemein", till, { uhrzeit: val })}
                            />
                          </div>
                        ) : (
                          <span className={`text-xs ${generalEntry?.uhrzeit ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                            {generalEntry?.uhrzeit ?? "—"}
                          </span>
                        )}
                      </td>

                      {/* Schicht-Zellen */}
                      {SHIFTS.map((shift, shiftIdx) => {
                        const key         = `${shift.key}-${till}`;
                        const a           = getAssignment(shift.key, till);
                        const busy        = savingKey === key;
                        const isLastShift = shiftIdx === SHIFTS.length - 1;

                        return (
                          <Fragment key={key}>
                            {/* Mitarbeiter */}
                            <td className="px-2.5 py-2.5 border-r border-border/30">
                              {isAdmin ? (
                                <div className="relative">
                                  {busy && (
                                    <Loader2 className="w-3 h-3 animate-spin absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground z-20" />
                                  )}
                                  <EmployeePicker
                                    users={users}
                                    value={a?.user_id ?? null}
                                    disabled={busy}
                                    onChange={(uid, uname) => saveField(shift.key, till, { userId: uid, userName: uname })}
                                  />
                                </div>
                              ) : (
                                <span className={`text-xs ${a?.user_name ? "font-medium text-foreground" : "text-muted-foreground italic"}`}>
                                  {a?.user_name ?? "—"}
                                </span>
                              )}
                            </td>

                            {/* Uhr */}
                            <td className={`px-2.5 py-2.5 ${!isLastShift ? "border-r border-border/40" : ""}`}>
                              {isAdmin ? (
                                <TimeScrollPicker
                                  value={a?.uhrzeit ?? null}
                                  defaultTime={shift.defaultTime}
                                  disabled={busy}
                                  onChange={val => saveField(shift.key, till, { uhrzeit: val })}
                                />
                              ) : (
                                <span className={`text-xs ${a?.uhrzeit ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                  {a?.uhrzeit ?? "—"}
                                </span>
                              )}
                            </td>
                          </Fragment>
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
