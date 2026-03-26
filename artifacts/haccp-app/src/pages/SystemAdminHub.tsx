import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { Link, useLocation } from "wouter";
import { ShieldCheck, Smartphone, ArrowRight, ShieldAlert, Mail } from "lucide-react";
import { useEffect } from "react";

export default function SystemAdminHub() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!adminSession || adminSession.role !== "SUPERADMIN") {
      navigate("/");
    }
  }, [adminSession, navigate]);

  if (!adminSession || adminSession.role !== "SUPERADMIN") return null;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold mb-3">
            <ShieldAlert className="w-3.5 h-3.5" /> Nur für Systemadministratoren
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Systemverwaltung</h1>
          <p className="text-muted-foreground text-sm">Rollen, Benutzerrechte und Geräteverwaltung. Dieser Bereich ist nur für autorisierte Systemadministratoren zugänglich.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/users">
            <div className="group bg-white rounded-2xl border border-purple-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all duration-200 p-6 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">System</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Rollenverwaltung</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Systembenutzer anlegen, Rollen und Zugriffsrechte je Filiale verwalten.
              </p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-purple-600 group-hover:gap-3 transition-all duration-200">
                Öffnen <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/admin/geraete">
            <div className="group bg-white rounded-2xl border border-purple-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all duration-200 p-6 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">System</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Geräteverwaltung</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Autorisierte Geräte anzeigen, sperren und freigeben. Gerätenamen und Tokens verwalten.
              </p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-purple-600 group-hover:gap-3 transition-all duration-200">
                Öffnen <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/admin/email">
            <div className="group bg-white rounded-2xl border border-purple-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all duration-200 p-6 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">System</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">E-Mail Einstellungen</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                SMTP-Zugangsdaten für den automatischen E-Mail-Versand konfigurieren und testen.
              </p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-purple-600 group-hover:gap-3 transition-all duration-200">
                Öffnen <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
