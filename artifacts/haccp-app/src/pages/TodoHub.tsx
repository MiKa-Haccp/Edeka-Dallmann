import { type ReactNode, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { useAppStore } from "@/store/use-app-store";
import { ClipboardList, Zap, TableProperties, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;
const BASE = import.meta.env.VITE_API_URL || "/api";

const WEEKDAY_NAMES = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export default function TodoHub() {
  const { selectedMarketId } = useAppStore();
  const [pendingStandard, setPendingStandard] = useState<number | null>(null);
  const [openAdhoc, setOpenAdhoc] = useState<number | null>(null);
  const [overdueAdhoc, setOverdueAdhoc] = useState<number>(0);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const weekday = today.getDay() === 0 ? 7 : today.getDay();

  useEffect(() => {
    if (!selectedMarketId) return;
    Promise.all([
      fetch(`${BASE}/todo/standard-tasks?marketId=${selectedMarketId}&weekday=${weekday}`),
      fetch(`${BASE}/todo/daily-completions?marketId=${selectedMarketId}&date=${todayStr}`),
      fetch(`${BASE}/todo/adhoc-tasks?marketId=${selectedMarketId}`),
    ]).then(async ([tRes, cRes, aRes]) => {
      const tasks = await tRes.json();
      const completions = await cRes.json();
      const adhoc = await aRes.json();
      const completedIds = new Set(completions.map((c: { task_id: number }) => c.task_id));
      setPendingStandard(tasks.filter((t: { id: number }) => !completedIds.has(t.id)).length);
      setOpenAdhoc(adhoc.length);
      const now = Date.now();
      setOverdueAdhoc(adhoc.filter((a: { deadline: string | null }) =>
        a.deadline && new Date(a.deadline).getTime() < now
      ).length);
    }).catch(() => {});
  }, [selectedMarketId, weekday, todayStr]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">To-Do & Einsatzplan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {WEEKDAY_NAMES[weekday]}, {today.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="grid gap-4">
          <Link href="/todo-tagesliste">
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 hover:shadow-md hover:border-[#1a3a6b]/30 transition-all cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#1a3a6b]/10 rounded-xl group-hover:bg-[#1a3a6b]/20 transition-colors">
                    <ClipboardList className="w-6 h-6 text-[#1a3a6b]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Tagesliste</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Standard-Aufgaben für heute</p>
                  </div>
                </div>
                {pendingStandard !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${
                    pendingStandard === 0
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {pendingStandard === 0
                      ? <><CheckCircle2 className="w-4 h-4" /> Alle erledigt</>
                      : <><AlertCircle className="w-4 h-4" /> {pendingStandard} offen</>
                    }
                  </div>
                )}
              </div>
            </div>
          </Link>

          <Link href="/todo-rundgang">
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                    <Zap className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Schneller Rundgang</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Ad-hoc Aufgaben erfassen & erledigen</p>
                  </div>
                </div>
                {openAdhoc !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${
                    overdueAdhoc > 0
                      ? "bg-red-100 text-red-700"
                      : openAdhoc === 0
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                  }`}>
                    {overdueAdhoc > 0
                      ? <><Clock className="w-4 h-4" /> {overdueAdhoc} überfällig</>
                      : openAdhoc === 0
                        ? <><CheckCircle2 className="w-4 h-4" /> Keine offen</>
                        : <><Zap className="w-4 h-4" /> {openAdhoc} offen</>
                    }
                  </div>
                )}
              </div>
            </div>
          </Link>

          <Link href="/todo-kassen">
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <TableProperties className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Kasseneinteilung</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Schicht- und Kassenplan für heute</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
