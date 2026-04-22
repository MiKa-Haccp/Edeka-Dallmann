import { AppLayout } from "@/components/layout/AppLayout";
import { Link, useLocation } from "wouter";
import { KanbanSquare, Users, Briefcase, ArrowRight, ChevronLeft } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { useEffect } from "react";

const ALLOWED_ROLES = ["SUPERADMIN", "ADMIN"];

export default function ManagementHub() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!adminSession || !ALLOWED_ROLES.includes(adminSession.role)) {
      navigate("/");
    }
  }, [adminSession, navigate]);

  if (!adminSession || !ALLOWED_ROLES.includes(adminSession.role)) return null;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="rounded-2xl text-white p-6" style={{ background: "linear-gradient(135deg, #1a3a6b 0%, #2d5aa0 100%)" }}>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Management Hub</h1>
              <p className="text-sm text-white/70">Backoffice für Kai · Michi · Sonja</p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/management/tasks">
            <div className="group bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-[#1a3a6b]/30 transition-all duration-200 p-6 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <KanbanSquare className="w-6 h-6 text-[#1a3a6b]" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1a3a6b]/10 text-[#1a3a6b]">Büro</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Task-Board</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Aufgaben verwalten und zwischen Kai, Michi, Sonja und Wiedervorlage verschieben – wie „Büro Ost".
              </p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#1a3a6b] group-hover:gap-3 transition-all duration-200">
                Öffnen <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/management/recruiting">
            <div className="group bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-200 p-6 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">Recruiting</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Recruiting-Center</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Bewerbungen verwalten – vom Eingang bis zur Einstellung. Digitale Bewerberbögen, Gesprächsnotizen und Statusverfolgung.
              </p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-teal-600 group-hover:gap-3 transition-all duration-200">
                Öffnen <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
