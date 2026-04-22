import { FileText, Download, BookOpen, Users, ExternalLink } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

const DOCS = [
  {
    icon: Users,
    title: "Kurzanleitung Mitarbeiter",
    subtitle: "4 Seiten · Tägliche Aufgaben · Wareneingang · FAQ",
    description:
      "Übersichtliche Schritt-für-Schritt-Anleitung für alle Mitarbeiter. Erklärt den Wareneingang, Ampel-Bedeutung, Abweichungen und häufige Fragen.",
    file: "/docs/MiKa_Kurzanleitung_Mitarbeiter.html",
    color: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-600",
    hint: "Ideal zum Aushängen oder Weitergeben an neue Mitarbeiter",
  },
  {
    icon: BookOpen,
    title: "Anleitung Verwaltung & Administration",
    subtitle: "~10 Seiten · Vollständige Funktionsbeschreibung · Admin-Bereiche",
    description:
      "Ausführliche Anleitung für Verwaltung und Admins. Abdeckt alle Bereiche: Mitarbeiter, Lieferanten, Berichte, E-Mail, Systemkonfiguration und Datenschutz.",
    file: "/docs/MiKa_Anleitung_Verwaltung_Admin.html",
    color: "bg-indigo-50 border-indigo-200",
    iconBg: "bg-[#1a3a6b]",
    hint: "Für Verwaltungspersonal und System-Admins",
  },
];

export default function Dokumente() {
  return (
    <AppLayout>
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-7 h-7 text-[#1a3a6b]" />
          <h1 className="text-2xl font-bold text-[#1a3a6b]">
            MiKa-Anleitungen
          </h1>
        </div>
        <p className="text-gray-600 text-sm">
          Anleitungen und Dokumentation zum Herunterladen und Drucken.
        </p>
      </div>

      {/* Info box */}
      <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">So druckst du die Anleitungen als PDF:</p>
        <ol className="list-decimal ml-5 space-y-1 text-blue-800">
          <li>Dokument unten öffnen (öffnet in neuem Tab)</li>
          <li>
            Im Browser: <span className="font-mono bg-blue-100 px-1 rounded">Strg + P</span>{" "}
            (Windows) oder{" "}
            <span className="font-mono bg-blue-100 px-1 rounded">⌘ + P</span> (Mac)
          </li>
          <li>
            Ziel: <strong>„Als PDF speichern"</strong> wählen → Speichern
          </li>
        </ol>
      </div>

      {/* Document cards */}
      <div className="space-y-5">
        {DOCS.map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.file}
              className={`rounded-xl border-2 ${doc.color} p-5 flex flex-col gap-4 sm:flex-row sm:items-start`}
            >
              {/* Icon */}
              <div
                className={`${doc.iconBg} rounded-xl p-3 shrink-0 self-start`}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#1a3a6b] text-lg leading-snug">
                  {doc.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 mb-2">
                  {doc.subtitle}
                </div>
                <p className="text-sm text-gray-700 mb-3">{doc.description}</p>
                <div className="text-xs text-gray-500 italic mb-4">
                  {doc.hint}
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={doc.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a6b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5aa0] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Öffnen & Drucken
                  </a>
                  <a
                    href={doc.file}
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Herunterladen
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-10 rounded-lg bg-gray-50 border border-gray-200 px-5 py-4 text-xs text-gray-500">
        <strong className="text-gray-700">Hinweis:</strong> Alle Anleitungen
        beziehen sich auf MiKa – Stand April 2025.{" "}
        Bei Änderungen am System wird die Dokumentation entsprechend
        aktualisiert.
      </div>
    </div>
    </AppLayout>
  );
}
