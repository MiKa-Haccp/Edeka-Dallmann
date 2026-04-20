import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link, useLocation } from "wouter";
import { ShieldCheck, Smartphone, ArrowRight, ShieldAlert, Mail, ChevronLeft, Settings2, Bell, FileText, Trash2, LayoutGrid, LayoutList } from "lucide-react";
import { useEffect } from "react";

interface AdminCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function AdminCard({ href, icon, title, description }: AdminCardProps) {
  return (
    <Link href={href} className="h-full">
      <div className="group h-full bg-white rounded-2xl border border-purple-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all duration-200 p-6 cursor-pointer flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
            {icon}
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">System</span>
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{description}</p>
        <div className="flex items-center gap-1.5 text-sm font-bold text-purple-600 group-hover:gap-3 transition-all duration-200 mt-auto">
          Öffnen <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

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
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Systemverwaltung</h1>
              <p className="text-white/70 text-sm">Rollen, Benutzerrechte und Geräteverwaltung.</p>
            </div>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminCard
            href="/admin/users"
            icon={<ShieldCheck className="w-6 h-6 text-purple-600" />}
            title="Benutzerverwaltung"
            description="Systembenutzer anlegen und individuelle Zugriffsrechte je Filiale verwalten."
          />
          <AdminCard
            href="/admin/rollen"
            icon={<Settings2 className="w-6 h-6 text-purple-600" />}
            title="Rollen & Berechtigungen"
            description="Zugriffsrechte je Rolle konfigurieren, Berechtigungsmatrix anpassen und eigene Rollen erstellen."
          />
          <AdminCard
            href="/admin/geraete"
            icon={<Smartphone className="w-6 h-6 text-purple-600" />}
            title="Geräteverwaltung"
            description="Autorisierte Geräte anzeigen, sperren und freigeben. Gerätenamen und Tokens verwalten."
          />
          <AdminCard
            href="/admin/email"
            icon={<Mail className="w-6 h-6 text-purple-600" />}
            title="E-Mail Einstellungen"
            description="SMTP-Zugangsdaten für den automatischen E-Mail-Versand konfigurieren und testen."
          />
          <AdminCard
            href="/admin/benachrichtigungen"
            icon={<Bell className="w-6 h-6 text-purple-600" />}
            title="Benachrichtigungen"
            description="Automatische Hinweise bei fehlenden Einträgen konfigurieren. Per E-Mail oder Telegram."
          />
          <AdminCard
            href="/admin/monatsbericht"
            icon={<FileText className="w-6 h-6 text-purple-600" />}
            title="Monatsbericht"
            description="HACCP-Daten aller Module als Monatsbericht zusammenfassen, als HTML ausgeben und per E-Mail versenden."
          />
          <AdminCard
            href="/admin/module-sichtbarkeit"
            icon={<LayoutGrid className="w-6 h-6 text-purple-600" />}
            title="Modul-Sichtbarkeit"
            description="Module auf der Startseite ein- oder ausschalten. Schrittweise Freischaltung für alle Benutzer."
          />
          <AdminCard
            href="/admin/section-sichtbarkeit"
            icon={<LayoutList className="w-6 h-6 text-purple-600" />}
            title="Abschnitt-Sichtbarkeit"
            description="Einzelne Handbuch-Punkte aus der Sidebar ausblenden. Die Nummerierung passt sich automatisch an."
          />
          <AdminCard
            href="/admin/daten-bereinigung"
            icon={<Trash2 className="w-6 h-6 text-red-600" />}
            title="Daten-Bereinigung"
            description="Filial-spezifischen System-Reset durchführen. Datenkategorien selektiv vor einem Stichtag löschen."
          />
        </div>
      </div>
    </AppLayout>
  );
}
