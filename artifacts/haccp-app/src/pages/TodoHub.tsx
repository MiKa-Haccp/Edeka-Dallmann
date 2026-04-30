import { type ReactNode, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "wouter";
import { useAppStore } from "@/store/use-app-store";
import { ClipboardList, TableProperties, CheckCircle2, AlertCircle, ChevronLeft } from "lucide-react";

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;
const BASE = import.meta.env.VITE_API_URL || "/api";

const WEEKDAY_NAMES = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export default function TodoHub() {
  const { selectedMarketId } = useAppStore();
  const [pendingStandard, setPendingStandard] = useState<number | null>(null);
  const [openAdhoc, setOpenAdhoc] = useState<number | null>(null);

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
      const completable = tasks.filter((t: { id: number; category?: string }) => (t.category || "aufgaben") !== "lieferungen");
      setPendingStandard(completable.filter((t: { id: number }) => !completedIds.has(t.id)).length);
      setOpenAdhoc(adhoc.length);
    }).catch(() => {});
  }, [selectedMarketId, weekday, todayStr]);

  const totalOpen = (pendingStandard ?? 0) + (openAdhoc ?? 0);
  const allDone = pendingStandard !== null && openAdhoc !== null && totalOpen === 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader className="from-[#0f766e] to-[#14b8a6]">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">To-Do & Einsatzplan</h1>
              <p className="text-sm text-white/70">{WEEKDAY_NAMES[weekday]}, {today.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
          </div>
        </PageHeader>

        <div className="grid gap-4">
          <Link href="/todo-tagesliste">
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 hover:shadow-md hover:border-[#0f766e]/30 transition-all cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#0f766e]/10 rounded-xl group-hover:bg-[#0f766e]/20 transition-colors">
                    <ClipboardList className="w-6 h-6 text-[#0f766e]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Mein Weg</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Aufgaben, Bestellungen & Lieferungen für heute</p>
                  </div>
                </div>
                {pendingStandard !== null && openAdhoc !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap ${
                    allDone
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {allDone
                      ? <><CheckCircle2 className="w-4 h-4" /> Alle erledigt</>
                      : <><AlertCircle className="w-4 h-4" /> {totalOpen} offen</>
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
