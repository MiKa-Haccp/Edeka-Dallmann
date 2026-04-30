import { type ReactNode, useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "wouter";
import { useAppStore } from "@/store/use-app-store";
import {
  ChevronLeft, History, Loader2, CheckCircle2, User, Clock,
  ChevronDown, ChevronUp, Flame, Minus, ArrowDown, Search,
} from "lucide-react";

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;
const BASE = import.meta.env.VITE_API_URL || "/api";

const PRIORITY_CONFIG = {
  hoch:   { label: "Hoch",    icon: Flame,    color: "text-red-600" },
  mittel: { label: "Mittel",  icon: Minus,    color: "text-amber-600" },
  niedrig:{ label: "Niedrig", icon: ArrowDown, color: "text-teal-600"  },
};

interface AdhocTask {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  created_by_name: string | null;
  completed_by_name: string | null;
  completed_at: string | null;
  created_at: string;
  deadline: string | null;
}

const RANGE_OPTIONS = [
  { label: "Heute",        days: 0 },
  { label: "7 Tage",       days: 7 },
  { label: "30 Tage",      days: 30 },
  { label: "90 Tage",      days: 90 },
];

function groupByDate(tasks: AdhocTask[]): Record<string, AdhocTask[]> {
  return tasks.reduce((acc, t) => {
    const d = t.completed_at
      ? new Date(t.completed_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "Unbekannt";
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {} as Record<string, AdhocTask[]>);
}

export default function TodoZusatzProtokoll() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN"
    || adminSession?.role === "MARKTLEITER" || adminSession?.role === "BEREICHSLEITUNG";

  const [tasks, setTasks] = useState<AdhocTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [rangeDays, setRangeDays] = useState(7);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/todo/adhoc-tasks?marketId=${selectedMarketId}&includeCompleted=true`);
      const all: AdhocTask[] = await res.json();
      const now = new Date();
      const filtered = all
        .filter(t => t.completed_at !== null)
        .filter(t => {
          if (!t.completed_at) return false;
          if (rangeDays === 0) {
            const today = now.toISOString().split("T")[0];
            return t.completed_at.startsWith(today);
          }
          const cutoff = new Date(now.getTime() - rangeDays * 86_400_000);
          return new Date(t.completed_at) >= cutoff;
        });
      setTasks(filtered);
      // Auto-expand first group
      if (filtered.length > 0) {
        const firstDate = filtered[0].completed_at
          ? new Date(filtered[0].completed_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
          : "Unbekannt";
        setExpanded({ [firstDate]: true });
      }
    } finally { setLoading(false); }
  }, [selectedMarketId, rangeDays]);

  useEffect(() => { load(); }, [load]);

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-10 text-center text-muted-foreground">Kein Zugriff – nur für Marktleiter und Admins.</div>
      </AppLayout>
    );
  }

  const searchLower = search.toLowerCase();
  const filtered = search
    ? tasks.filter(t =>
        t.title.toLowerCase().includes(searchLower) ||
        (t.completed_by_name ?? "").toLowerCase().includes(searchLower) ||
        (t.created_by_name ?? "").toLowerCase().includes(searchLower)
      )
    : tasks;

  const grouped = groupByDate(filtered);
  const dateKeys = Object.keys(grouped).sort((a, b) => {
    const parse = (d: string) => {
      const [day, month, year] = d.split(".");
      return new Date(`${year}-${month}-${day}`).getTime();
    };
    return parse(b) - parse(a);
  });

  return (
    <NoWrap>
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-5">
          <PageHeader className="from-[#0f766e] to-[#14b8a6]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Link href="/todo" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Zusatzaufgaben Protokoll</h1>
                  <p className="text-sm text-white/70">Erledigte Zusatzaufgaben zur Kontrolle</p>
                </div>
              </div>
              <div className="text-sm font-semibold text-white/90 bg-white/15 px-3 py-1.5 rounded-xl">
                {filtered.length} Einträge
              </div>
            </div>
          </PageHeader>

          {/* Filter-Leiste */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-1.5 flex-wrap">
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setRangeDays(opt.days)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    rangeDays === opt.days
                      ? "bg-[#0f766e] text-white border-[#0f766e]"
                      : "border-border/60 text-muted-foreground hover:border-[#0f766e]/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nach Name oder Aufgabe suchen…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border/60 p-10 text-center text-muted-foreground text-sm">
              Keine erledigten Zusatzaufgaben im gewählten Zeitraum.
            </div>
          ) : (
            <div className="space-y-4">
              {dateKeys.map(date => {
                const dayTasks = grouped[date];
                const isOpen = expanded[date] ?? false;
                return (
                  <div key={date} className="bg-white rounded-2xl border border-border/60 overflow-hidden">
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [date]: !isOpen }))}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0f766e]/10 rounded-xl">
                          <CheckCircle2 className="w-4 h-4 text-[#0f766e]" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm text-foreground">{date}</p>
                          <p className="text-xs text-muted-foreground">{dayTasks.length} Aufgabe{dayTasks.length !== 1 ? "n" : ""} erledigt</p>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {isOpen && (
                      <div className="border-t border-border/40">
                        {dayTasks.map((task, idx) => {
                          const pconf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.mittel;
                          const PIcon = pconf.icon;
                          return (
                            <div key={task.id} className={`p-4 flex items-start gap-3 ${idx > 0 ? "border-t border-border/30" : ""}`}>
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground">{task.title}</p>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  <PIcon className={`w-3 h-3 ${pconf.color}`} />
                                  <span className={`text-[10px] font-semibold ${pconf.color}`}>{pconf.label}</span>
                                  {task.completed_by_name && (
                                    <span className="flex items-center gap-1 text-[10px] text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> {task.completed_by_name}
                                    </span>
                                  )}
                                  {task.created_by_name && (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <User className="w-2.5 h-2.5" /> erstellt von {task.created_by_name}
                                    </span>
                                  )}
                                  {task.completed_at && (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <Clock className="w-2.5 h-2.5" />
                                      {new Date(task.completed_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppLayout>
    </NoWrap>
  );
}
