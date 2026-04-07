import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { FileText, Archive, Clock, Info, BookOpen, Folder, ChevronLeft } from "lucide-react";

const retentionData = [
  {
    category: "HACCP-Dokumentation",
    items: [
      { name: "Temperaturprotokolle", retention: "3 Jahre", note: "Ab Ende des Kalenderjahres" },
      { name: "Reinigungsprotokolle", retention: "3 Jahre", note: "Ab Ende des Kalenderjahres" },
      { name: "Wareneingangskontrollen", retention: "3 Jahre", note: "Ab Ende des Kalenderjahres" },
      { name: "Schädlingsbekämpfung (Berichte)", retention: "3 Jahre", note: "Ab Erstellungsdatum" },
      { name: "Gefahrenanalysen", retention: "Dauerhaft", note: "Solange aktuell, mind. 3 Jahre nach Ablösung" },
      { name: "CCP-Überwachungsprotokolle", retention: "3 Jahre", note: "Ab Ende des Kalenderjahres" },
      { name: "Korrekturmaßnahmen", retention: "3 Jahre", note: "Ab Abschluss der Maßnahme" },
    ],
  },
  {
    category: "Schulung & Personal",
    items: [
      { name: "Schulungsnachweise", retention: "Dauer der Beschäftigung + 1 Jahr", note: "Nach Ausscheiden des Mitarbeiters" },
      { name: "IfSG-Belehrungen (§43)", retention: "Dauerhaft", note: "Solange Mitarbeiter im Betrieb" },
      { name: "Gesundheitszeugnisse", retention: "Dauerhaft", note: "Solange Mitarbeiter im Betrieb" },
      { name: "Personalunterweisungen Hygiene", retention: "3 Jahre", note: "Ab Datum der Unterweisung" },
    ],
  },
  {
    category: "Lieferanten & Warenverkehr",
    items: [
      { name: "Lieferantenbewertungen", retention: "3 Jahre", note: "Ab Ende der Geschäftsbeziehung" },
      { name: "Lieferscheine", retention: "6 Jahre", note: "Steuerrechtliche Aufbewahrungspflicht" },
      { name: "Rechnungen", retention: "10 Jahre", note: "Steuerrechtliche Aufbewahrungspflicht" },
      { name: "Rückverfolgbarkeitsdokumente", retention: "3 Jahre", note: "Ab Erstellungsdatum" },
    ],
  },
  {
    category: "Reklamation & Rückruf",
    items: [
      { name: "Reklamationsprotokolle", retention: "3 Jahre", note: "Ab Abschluss des Vorgangs" },
      { name: "Rückrufprotokolle", retention: "5 Jahre", note: "Ab Datum des Rückrufs" },
      { name: "Krisenmanagement-Dokumentation", retention: "5 Jahre", note: "Ab Abschluss des Vorgangs" },
    ],
  },
];

export default function InfoDocumentation() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-8">
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/category/1" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Info Dokumentation und Ablagefristen</h1>
            </div>
          </div>
        </PageHeader>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Wichtiger Hinweis</p>
            <p className="text-sm text-amber-700 mt-1">
              Die hier aufgeführten Aufbewahrungsfristen basieren auf den geltenden gesetzlichen Bestimmungen 
              (LMHV, IfSG, HGB, AO) sowie den EDEKA-internen Qualitätsrichtlinien. Bei Unsicherheiten 
              wenden Sie sich bitte an die Qualitätssicherung oder den zuständigen HACCP-Beauftragten.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Standard-Aufbewahrung</p>
              <p className="text-lg font-bold text-foreground">3 Jahre</p>
              <p className="text-xs text-muted-foreground">HACCP-Dokumente</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Steuerrechtlich</p>
              <p className="text-lg font-bold text-foreground">6–10 Jahre</p>
              <p className="text-xs text-muted-foreground">Lieferscheine & Rechnungen</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dauerhaft</p>
              <p className="text-lg font-bold text-foreground">Unbegrenzt</p>
              <p className="text-xs text-muted-foreground">IfSG & Gefahrenanalysen</p>
            </div>
          </div>
        </div>

        {retentionData.map((group) => (
          <div key={group.category} className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-secondary/50 px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground text-sm">{group.category}</h2>
              </div>
            </div>
            <div className="divide-y divide-border">
              <div className="grid grid-cols-12 px-5 py-2 bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-5">Dokument</div>
                <div className="col-span-3">Aufbewahrungsfrist</div>
                <div className="col-span-4">Hinweis</div>
              </div>
              {group.items.map((item) => (
                <div key={item.name} className="grid grid-cols-12 px-5 py-3 text-sm items-center hover:bg-secondary/20 transition-colors">
                  <div className="col-span-5 font-medium text-foreground">{item.name}</div>
                  <div className="col-span-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.retention === "Dauerhaft" 
                        ? "bg-green-100 text-green-700" 
                        : item.retention.includes("10") || item.retention.includes("6")
                          ? "bg-orange-100 text-orange-700"
                          : item.retention.includes("5")
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                    }`}>
                      {item.retention}
                    </span>
                  </div>
                  <div className="col-span-4 text-muted-foreground text-xs">{item.note}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-foreground text-sm flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-primary" />
            Gesetzliche Grundlagen
          </h2>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <a
              href="https://www.gesetze-im-internet.de/lmhv_2007/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary/30 hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-lg p-3 transition-all group block"
            >
              <p className="font-semibold text-foreground group-hover:text-primary flex items-center gap-1.5">
                LMHV
                <span className="text-[10px] text-muted-foreground group-hover:text-primary/60 font-normal">↗ gesetze-im-internet.de</span>
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Lebensmittelhygiene-Verordnung — Grundlage für HACCP-Dokumentationspflichten
              </p>
            </a>
            <a
              href="https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32004R0852"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary/30 hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-lg p-3 transition-all group block"
            >
              <p className="font-semibold text-foreground group-hover:text-primary flex items-center gap-1.5">
                VO (EG) 852/2004
                <span className="text-[10px] text-muted-foreground group-hover:text-primary/60 font-normal">↗ eur-lex.europa.eu</span>
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                EU-Verordnung über Lebensmittelhygiene — HACCP-Grundsätze und Dokumentation
              </p>
            </a>
            <a
              href="https://www.gesetze-im-internet.de/ifsg/__43.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary/30 hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-lg p-3 transition-all group block"
            >
              <p className="font-semibold text-foreground group-hover:text-primary flex items-center gap-1.5">
                IfSG §43
                <span className="text-[10px] text-muted-foreground group-hover:text-primary/60 font-normal">↗ gesetze-im-internet.de</span>
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Infektionsschutzgesetz — Belehrungen und Gesundheitszeugnisse
              </p>
            </a>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://www.gesetze-im-internet.de/hgb/__257.html"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary/30 hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-lg p-3 transition-all group block"
              >
                <p className="font-semibold text-foreground group-hover:text-primary flex items-center gap-1">
                  HGB §257
                  <span className="text-[10px] text-muted-foreground group-hover:text-primary/60 font-normal">↗</span>
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">Handelsgesetzbuch — 6 Jahre</p>
              </a>
              <a
                href="https://www.gesetze-im-internet.de/ao_1977/__147.html"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary/30 hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-lg p-3 transition-all group block"
              >
                <p className="font-semibold text-foreground group-hover:text-primary flex items-center gap-1">
                  AO §147
                  <span className="text-[10px] text-muted-foreground group-hover:text-primary/60 font-normal">↗</span>
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">Abgabenordnung — 10 Jahre</p>
              </a>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center text-sm text-blue-700">
          <p className="font-medium">
            📋 Diese Seite dient ausschließlich der Information. 
            Für die rechtsverbindliche Auslegung konsultieren Sie bitte die zuständige Qualitätssicherung.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
