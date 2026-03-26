import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { Link, useLocation } from "wouter";
import { Users, KeyRound, ArrowRight, UserCog, ChevronLeft, GraduationCap } from "lucide-react";
import { useEffect } from "react";

const ALLOWED_ROLES = ["SUPERADMIN", "ADMIN", "BEREICHSLEITUNG", "MARKTLEITER"];

export default function VerwaltungHub() {
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
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground mb-0.5">Verwaltung</h1>
            <p className="text-muted-foreground text-sm">Mitarbeiterstammdaten, Kürzel und PIN-Verwaltung für Ihr Team.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/mitarbeiterverwaltung">
            <div className="group bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-200 p-6 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">Verwaltung</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Mitarbeiterverwaltung</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Mitarbeiterstammdaten anlegen, bearbeiten und verwalten. Kürzel-Zuweisung und Statusverwaltung.
              </p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-teal-600 group-hover:gap-3 transition-all duration-200">
                Öffnen <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/mitarbeiterverwaltung?tab=pin">
            <div className="group bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-[#1a3a6b]/30 transition-all duration-200 p-6 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <KeyRound className="w-6 h-6 text-[#1a3a6b]" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1a3a6b]/10 text-[#1a3a6b]">Verwaltung</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">PIN-Verwaltung</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                PINs für Mitarbeiter vergeben, zurücksetzen und verwalten. Für Kontrollen und Unterschriften.
              </p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#1a3a6b] group-hover:gap-3 transition-all duration-200">
                Öffnen <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/verwaltung/schulungsanforderungen">
            <div className="group bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-200 p-6 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6 text-teal-600" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">Neu</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Schulungsanforderungen</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Pflichtschulungen pro Gruppe definieren. Wer muss wann geschult sein? Ersthelfer, Brandschutz & mehr.
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
