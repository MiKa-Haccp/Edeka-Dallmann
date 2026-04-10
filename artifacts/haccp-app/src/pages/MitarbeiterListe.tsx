import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Users, Loader2, ChevronLeft } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

type Status = "onboarding" | "aktiv" | "inaktiv";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  initials: string | null;
  status: Status;
}

const STATUS_LABEL: Record<Status, string> = {
  aktiv: "Aktiv",
  onboarding: "Onboarding",
  inaktiv: "Inaktiv",
};

const STATUS_COLOR: Record<Status, string> = {
  aktiv: "bg-green-100 text-green-700",
  onboarding: "bg-amber-100 text-amber-700",
  inaktiv: "bg-slate-100 text-slate-500",
};

export default function MitarbeiterListe() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/users?tenantId=1`)
      .then((r) => r.json())
      .then((data) => {
        const sorted = [...data].sort((a: Employee, b: Employee) =>
          a.lastName.localeCompare(b.lastName)
        );
        setEmployees(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  const aktiv = employees.filter((e) => e.status !== "inaktiv");
  const inaktiv = employees.filter((e) => e.status === "inaktiv");

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4 pb-10">

        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/haccp" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Mitarbeiter & Kürzel</h1>
              <p className="text-white/70 text-sm">Übersicht aller Mitarbeiter mit Kürzel</p>
            </div>
          </div>
        </PageHeader>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] text-white px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-bold">Mitarbeiterliste</span>
              <span className="text-xs text-blue-200">{aktiv.length} aktiv / {inaktiv.length} inaktiv</span>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20">Kürzel</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {aktiv.length === 0 && inaktiv.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Noch keine Mitarbeiter angelegt
                    </td>
                  </tr>
                ) : (
                  <>
                    {aktiv.map((emp, idx) => (
                      <tr key={emp.id} className={`border-b border-border/20 ${idx % 2 === 0 ? "bg-white" : "bg-blue-50/30"}`}>
                        <td className="px-5 py-3">
                          <span className="font-bold text-sm font-mono bg-[#1a3a6b]/10 text-[#1a3a6b] px-2 py-0.5 rounded">
                            {emp.initials || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-foreground">
                          {emp.lastName}, {emp.firstName}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[emp.status]}`}>
                            {STATUS_LABEL[emp.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {inaktiv.length > 0 && (
                      <>
                        <tr className="bg-slate-50 border-b border-border/30">
                          <td colSpan={3} className="px-5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Inaktiv — historisch (Archiv)
                          </td>
                        </tr>
                        {inaktiv.map((emp, idx) => (
                          <tr key={emp.id} className={`border-b border-border/20 opacity-60 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                            <td className="px-5 py-3">
                              <span className="font-bold text-sm font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded line-through">
                                {emp.initials || "—"}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-500 line-through">
                              {emp.lastName}, {emp.firstName}
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                Inaktiv
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </>
                )}
              </tbody>
            </table>

            <div className="px-5 py-3 bg-muted/20 border-t border-border/30 text-xs text-muted-foreground">
              Verwaltung der Mitarbeiter und PINs unter: Hauptseite → Mitarbeiterverwaltung
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
