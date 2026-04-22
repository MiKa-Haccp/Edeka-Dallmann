import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { FileText, Archive, Clock, Info, BookOpen, Folder, ChevronLeft } from "lucide-react";

const retentionData = [
  {
    category: "Allgemein & Verwaltung",
    items: [
      { name: "3.1 – Verantwortlichkeiten im Markt", retention: "2 Jahre", note: "HACCP-Ordner 1" },
      { name: "3.2 – Unterschriften und Kürzel der Mitarbeiter", retention: "1 Jahr", note: "HACCP-Ordner 1" },
      { name: "3.4 – Schulungsprotokoll", retention: "7 Jahre", note: "HACCP-Ordner 1" },
      { name: "3.8 – Betriebsbegehung (Eigenkontroll-Prüfliste)", retention: "2 Jahre", note: "HACCP-Ordner 1" },
      { name: "3.19 – Prüfmittelüberwachung", retention: "2 Jahre", note: "HACCP-Ordner 1" },
      { name: "Erstbelehrung nach IfSG / Gesundheitszeugnisse", retention: "7 Jahre", note: "HACCP-Ordner 1" },
      { name: "Ersthelferbescheinigung", retention: "7 Jahre", note: "HACCP-Ordner 1" },
      { name: "Berichte behördlicher Kontrollen", retention: "2 Jahre", note: "HACCP-Ordner 1" },
      { name: "Berichte externer Kontrollen (TÜV, QAL, QS usw.)", retention: "3 Jahre", note: "HACCP-Ordner 1" },
      { name: "Berichte interner Kontrollen (QM, Bezirksleiter)", retention: "2 Jahre", note: "HACCP-Ordner 1" },
    ],
  },
  {
    category: "Reinigung & Hygiene",
    items: [
      { name: "3.5 – Produktliste Personal- und Lebensmittelhygiene", retention: "1 Jahr", note: "HACCP-Ordner 2" },
      { name: "3.6-1 – Reinigungsplan Woche", retention: "1 Jahr", note: "HACCP-Ordner 2" },
      { name: "3.6-2 – Reinigungsplan Jahr", retention: "1 Jahr", note: "HACCP-Ordner 2" },
      { name: "3.6-3 – Reinigungsdokumentation", retention: "1 Jahr", note: "HACCP-Ordner 2" },
      { name: "3.9 – Hygienebelehrung abteilungsfremde Personen", retention: "2 Jahre", note: "HACCP-Ordner 3" },
    ],
  },
  {
    category: "Wareneingänge & Lagerung",
    items: [
      { name: "3.11-1 – Wareneingangskontrolle", retention: "2 Jahre", note: "HACCP-Ordner 2 & 3" },
      { name: "3.11-2 – Wareneingangskontrolle MSC-Fisch", retention: "3 Jahre", note: 'Ordner "MSC-Fisch"' },
      { name: "MSC-Lieferscheine", retention: "3 Jahre", note: 'Ordner "MSC-Fisch"' },
      { name: "3.12 – Lager- und Temperaturkontrolle manuell", retention: "3 Jahre", note: "HACCP-Ordner 2 & 3" },
      { name: "3.13 – Lager- und Temperaturkontrolle automatisch", retention: "3 Jahre", note: "HACCP-Ordner 2 & 3" },
    ],
  },
  {
    category: "Metzgerei & Frischetheke",
    items: [
      { name: "3.10 – Betriebsbegehung GQ-Frischeartikel", retention: "2 Jahre", note: "HACCP-Ordner 3" },
      { name: "3.14 – Produktfehlermeldung", retention: "3 Jahre", note: "HACCP-Ordner 2" },
      { name: "3.15 – Rezeptvordruck", retention: "1 Jahr", note: "HACCP-Ordner 3" },
      { name: "3.17 – Bestandsliste eingefrorenes Fleisch", retention: "2 Jahre", note: "HACCP-Ordner 3" },
      { name: "3.18 – Eigenherstellung / Öffnen von Gastro-Packungen", retention: "1 Jahr", note: "HACCP-Ordner 3" },
      { name: "3.20 – Archivierung von Rindfleischetiketten", retention: "2 Jahre", note: 'Ordner "Rindfleisch"' },
      { name: "Entsorgungsscheine K3-Abfälle", retention: "2 Jahre", note: "HACCP-Ordner 3" },
    ],
  },
  {
    category: "Bescheinigungen & sonstige Belege",
    items: [
      { name: "Durchschrift amtlicher Probenentnahme", retention: "3 Jahre", note: "HACCP-Ordner 1" },
      { name: "Warenrücknahmeprotokolle (REVOCO)", retention: "2 Jahre", note: 'Ordner "Warenrücknahmen"' },
      { name: "Lieferschein an die Deutschen Tafeln", retention: "2 Jahre", note: 'Ordner "Lebensmittelspenden"' },
      { name: "Sonstige Berichte und Belege (z. B. Schädlingsmonitoring)", retention: "2 Jahre", note: "HACCP-Ordner 1" },
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
              <h1 className="text-xl font-bold text-white">Info Dokumentation und Ablagefristen</h1>
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
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Kurzfristig</p>
              <p className="text-lg font-bold text-foreground">1 Jahr</p>
              <p className="text-xs text-muted-foreground">Reinigung & Rezepturen</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Standard HACCP</p>
              <p className="text-lg font-bold text-foreground">2–3 Jahre</p>
              <p className="text-xs text-muted-foreground">Wareneingänge, Begehungen</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Langfristig</p>
              <p className="text-lg font-bold text-foreground">7 Jahre</p>
              <p className="text-xs text-muted-foreground">Schulungen & IfSG-Belehrungen</p>
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
                      item.retention === "7 Jahre"
                        ? "bg-orange-100 text-orange-700"
                        : item.retention === "3 Jahre"
                          ? "bg-amber-100 text-amber-700"
                          : item.retention === "1 Jahr"
                            ? "bg-green-100 text-green-700"
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
