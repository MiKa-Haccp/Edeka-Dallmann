import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import {
  ClipboardCheck, ChevronLeft, ChevronRight, Save, Plus, Trash2,
  CheckCircle2, AlertTriangle, MinusCircle, Loader2, FileText, X, KeyRound
} from "lucide-react";
import { JaehrlicheErinnerung } from "@/components/JaehrlicheErinnerung";

const BASE = import.meta.env.VITE_API_URL || "/api";
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_QUARTAL = Math.ceil((new Date().getMonth() + 1) / 3);
const TODAY = new Date().toISOString().split("T")[0];
const isFutureQuartal = (y: number, q: number) => y > CURRENT_YEAR || (y === CURRENT_YEAR && q > CURRENT_QUARTAL);

type CheckStatus = "ok" | "mangel" | "na" | "";

interface CheckItem {
  nr: string;
  text: string;
}

interface Section {
  id: string;
  title: string;
  items: CheckItem[];
}

const SECTIONS: Section[] = [
  {
    id: "1",
    title: "1. Anlieferungsbereich",
    items: [
      { nr: "1.1", text: "Der gesamte Bereich (Rampen, Abfallcontainer etc.) ist ordentlich und sauber." },
      { nr: "1.2", text: "Der bauliche Zustand ist in Ordnung." },
      { nr: "1.3", text: "Es gibt keine Anzeichen auf Schädlingsbefall." },
      { nr: "1.4", text: "Wareneingangskontrolle wird durchgeführt und dokumentiert." },
      { nr: "1.5", text: "Es ist sichergestellt, dass die angelieferte Ware auf MHD, Verbrauchsdaten, richtige Temperatur und Beschädigungen/Produktmängel kontrolliert wird." },
      { nr: "1.6", text: "Die Reinigung des Bereichs wird durchgeführt und im entsprechenden Formblatt zur Reinigung dokumentiert." },
      { nr: "1.7", text: "Für alle Direktlieferanten liegen aktuelle Zertifizierungsnachweise im Markt vor (Bio, Bayerisches Biosiegel, Geprüfte Qualität-Bayern, QS., etc.)" },
      { nr: "1.8", text: "Sonstiges" },
    ],
  },
  {
    id: "2",
    title: "2. Lagerbereich",
    items: [
      { nr: "2.1", text: "Der gesamte Bereich (Räume, Möbel, Böden, Abfallbehälter, etc.) ist ordentlich und sauber." },
      { nr: "2.2", text: "Der bauliche Zustand ist in Ordnung." },
      { nr: "2.3", text: "Es gibt keine Anzeichen auf Schädlingsbefall." },
      { nr: "2.4", text: "Die Temperaturen werden täglich kontrolliert und dokumentiert." },
      { nr: "2.5", text: "Die Raumtemperaturen entsprechen den empfohlenen Vorgaben." },
      { nr: "2.6", text: "Die Grenzwerte der Produkttemperaturen werden nicht überschritten." },
      { nr: "2.7", text: "Die Mindesthaltbarkeits- bzw. Verbrauchsdaten werden eingehalten." },
      { nr: "2.8", text: "Produktmängel sind nicht erkennbar." },
      { nr: "2.9", text: "Packungen mit überschrittener Haltbarkeit bzw. unverkäufliche Waren sind gesondert gelagert und mit Sperrkennzeichnung versehen." },
      { nr: "2.10", text: "Konventionelle Ware und Produkte aus Qualitätssicherungsprogrammen (Bio, Bayerisches Biosiegel, Geprüfte Qualität-Bayern, QS, etc.) sind klar getrennt." },
      { nr: "2.11", text: "Die Reinigung des Bereichs wird durchgeführt und im entsprechenden Formblatt zur Reinigung dokumentiert." },
      { nr: "2.12", text: "Sonstiges" },
    ],
  },
  {
    id: "3",
    title: "3. Verkaufsbereich Obst und Gemüse",
    items: [
      { nr: "3.1", text: "Der gesamte Bereich (Räume, Möbel, Geräte etc.) ist ordentlich und sauber." },
      { nr: "3.2", text: "Alle vorgeschriebenen Kennzeichnungen/Deklarationen sind vorhanden und korrekt." },
      { nr: "3.3", text: "Die Temperaturen der Kühlmöbel entsprechen den empfohlenen Vorgaben." },
      { nr: "3.4", text: "Die Produkttemperaturen entsprechen den Grenzwerten." },
      { nr: "3.5", text: "Bei kühlpflichtiger Ware werden die Mindesthaltbarkeits- bzw. Verbrauchsdaten eingehalten." },
      { nr: "3.6", text: "Produktmängel sind nicht erkennbar; die Ware ist in einem frischen und ordentlichen Zustand." },
      { nr: "3.7", text: "Die Reinigung des Bereichs wird durchgeführt und im entsprechenden Formblatt zur Reinigung dokumentiert." },
      { nr: "3.8", text: "Das Formular Warenzustand (3.7) ist vorhanden und wird geführt." },
      { nr: "3.9", text: "Konventionelle Ware und Produkte aus Qualitätssicherungsprogrammen (Bio, Bayerisches Biosiegel, Geprüfte Qualität-Bayern, QS., etc.) sind klar getrennt." },
      { nr: "3.10", text: "Sonstiges" },
    ],
  },
  {
    id: "4",
    title: "4. Verkaufsbereich (Trockensortiment, Frischebereich, Tiefkühlware, Getränke)",
    items: [
      { nr: "4.1", text: "Der gesamte Bereich (Räume, Kühlmöbel, Regale, Geräte etc.) ist ordentlich und sauber." },
      { nr: "4.2", text: "Der bauliche Zustand ist in Ordnung." },
      { nr: "4.3", text: "Es gibt keine Anzeichen auf Schädlingsbefall." },
      { nr: "4.4", text: "Die Lagerbedingungen werden eingehalten." },
      { nr: "4.5", text: "Bei Kühl- und Tiefkühlmöbeln ist die maximale Füllhöhe angegeben und wird eingehalten." },
      { nr: "4.6", text: "Die Temperaturen der Kühl- und Tiefkühlmöbel entsprechen den empfohlenen Vorgaben." },
      { nr: "4.7", text: "Die Produkttemperaturen entsprechen den Grenzwerten." },
      { nr: "4.8", text: "Alle vorgeschriebenen Kennzeichnungen / Deklarationen sind vorhanden und korrekt (Preisetiketten, Qualitätssicherungssysteme etc.)." },
      { nr: "4.9", text: "Die Mindesthaltbarkeits- bzw. Verbrauchsdaten werden eingehalten." },
      { nr: "4.10", text: "Produktmängel sind nicht erkennbar." },
      { nr: "4.11", text: "Die Reinigung des Bereichs wird durchgeführt und im entsprechenden Formblatt zur Reinigung dokumentiert." },
      { nr: "4.12a", text: "Die angegebenen Temperaturen bzw. Verfallsdaten auf Arzneimitteln/Medizinprodukten werden kontrolliert und eingehalten." },
      { nr: "4.12b", text: "Sonstiges" },
    ],
  },
  {
    id: "5",
    title: "5. Salatbar",
    items: [
      { nr: "5.1", text: "Der gesamte Bereich ist ordentlich und sauber." },
      { nr: "5.2", text: "Sicherungsmaßnahmen wie Spuckschutz sind vorhanden und wirksam." },
      { nr: "5.3", text: "Alle vorgeschriebenen Kennzeichnungen/Deklarationen sind vorhanden und korrekt." },
      { nr: "5.4", text: "Die Temperaturgrenzwerte werden eingehalten." },
      { nr: "5.5", text: "Produktmängel sind nicht erkennbar; die Ware ist in einem frischen und ordentlichen Zustand." },
      { nr: "5.6", text: "Die Reinigung des Bereichs wird durchgeführt und im entsprechenden Formblatt zur Reinigung dokumentiert." },
      { nr: "5.7", text: "Das Formblatt zur Kontrolle der Salatbar wird geführt." },
      { nr: "5.8", text: "Sonstiges" },
    ],
  },
  {
    id: "6",
    title: "6. Bake-Off / Back-Shop",
    items: [
      { nr: "6.1", text: "Der gesamte Bereich (Lager-, Vorbereitungs-, Backraum und Verkaufsbereich) ist ordentlich und sauber." },
      { nr: "6.2", text: "Der bauliche Zustand ist in Ordnung." },
      { nr: "6.3", text: "Es gibt keine Anzeichen auf Schädlingsbefall." },
      { nr: "6.4", text: "Alle Rohstoffe werden vorschriftsmäßig gelagert. Die Lagertemperaturen (z.B. für Tiefkühlrohlinge) entsprechen den Grenzwerten." },
      { nr: "6.5", text: "Die Verbraucherinformation (Allergene, Zusatzstoffinformationen) ist aktuell, vollständig und liegt für den Kunden aus." },
      { nr: "6.6", text: "Alle vorgeschriebenen Kennzeichnungen/Deklarationen sind vorhanden und korrekt." },
      { nr: "6.7", text: "Das Formblatt Reinigungsdokumentation Bake-Off / Back-Shop wird geführt." },
      { nr: "6.8", text: "Produktmängel sind nicht erkennbar." },
      { nr: "6.9", text: "Sonstiges" },
    ],
  },
  {
    id: "7",
    title: "7. Vorbereitungs- und Kühlräume im Bedienbereich (Verarbeitung, Zubereitung, Abpackung)",
    items: [
      { nr: "7.1", text: "Der gesamte Bereich (Räume, Kühltheken, sonstige Möbel und Ausstattungen, Fußböden, Gullys, Fugen etc.) ist ordentlich und sauber." },
      { nr: "7.2", text: "Der bauliche Zustand ist in Ordnung." },
      { nr: "7.3", text: "Es gibt keine Anzeichen auf Schädlingsbefall." },
      { nr: "7.4", text: "Splitterschutz ist vorhanden und intakt." },
      { nr: "7.5", text: "Alle nötigen Geräte, Werkzeuge und sonstigen Hilfsmittel inklusive Schneidebrettern und Kisten sind vorhanden und in einwandfreiem Zustand." },
      { nr: "7.6", text: "Der Fleischwolf befindet sich im Kühlraum / ist gekühlt." },
      { nr: "7.7", text: "Die Bearbeitung von Geflügel erfolgt getrennt von anderen Fleischarten." },
      { nr: "7.8", text: "Die Reinigung des Bereichs wird durchgeführt und im entsprechenden Formblatt zur Reinigung dokumentiert." },
      { nr: "7.9", text: "Die Temperaturvorgaben werden bei der Verarbeitung von Ware eingehalten (z.B. im gekühlten Raum, nur geringe Mengen Rohware auf Tisch, nicht für längere Zeit ungekühlt usw.)." },
      { nr: "7.10", text: "Die Eismaschine wird regelmäßig gereinigt und desinfiziert." },
      { nr: "7.11", text: "Produktmängel sind nicht erkennbar; die Ware ist in einem frischen und ordentlichen Zustand." },
      { nr: "7.12", text: "Für MSC-Teilnehmer: MSC-Fisch wird getrennt von konventioneller Ware gelagert. Der Lagerbereich ist deutlich gekennzeichnet." },
      { nr: "7.13", text: "Konventionelle Ware und Produkte aus Qualitätssicherungsprogrammen (Bio, Bayerisches Biosiegel, Geprüfte Qualität-Bayern, QS., etc.) sind klar getrennt." },
      { nr: "7.14", text: "Die Kennzeichnung von Produkten aus Qualitätssicherungsprogrammen (Bio, Bayerisches Biosiegel, Geprüfte Qualität-Bayern, QS., etc.) sind korrekt." },
      { nr: "7.15", text: "Sonstiges" },
    ],
  },
  {
    id: "8",
    title: "8. Bedienungstheken (Fleisch, Wurst, Käse, Fisch)",
    items: [
      { nr: "8.1", text: "Alle Bedienbereiche (Räume, Kühltheken, sonstige Möbel und Ausstattungen, Fußböden, Gullys, Fugen etc.) sind ordentlich und sauber." },
      { nr: "8.2", text: "Der bauliche Zustand ist in Ordnung." },
      { nr: "8.3", text: "Es gibt keine Anzeichen auf Schädlingsbefall." },
      { nr: "8.4", text: "Alle nötigen Geräte, Werkzeuge und sonstigen Hilfsmittel inklusive Schneidebrettern und Waagen sind vorhanden, in einwandfreiem Zustand und sauber." },
      { nr: "8.5", text: "Die Kühlmöbel- und Produkttemperaturen werden regelmäßig kontrolliert und dokumentiert." },
      { nr: "8.6", text: "Die Temperaturen der Kühlmöbel entsprechen den Vorgaben." },
      { nr: "8.7", text: "Die Produkttemperaturen entsprechen den Grenzwerten." },
      { nr: "8.9", text: "Die Rindfleischetikettierung entspricht den Vorgaben." },
      { nr: "8.10", text: "Eine negative Beeinflussung von Frisch-Fleisch durch Frisch-Geflügel ist ausgeschlossen." },
      { nr: "8.11a", text: "Innereien werden in flüssigkeitsfesten Schalen aufbewahrt." },
      { nr: "8.11b", text: "Produktmängel sind nicht erkennbar." },
      { nr: "8.12", text: "Die Reinigung des Bereichs wird durchgeführt und im entsprechenden Formblatt zur Reinigung dokumentiert." },
      { nr: "8.13", text: "Für MSC-Teilnehmer: Die Vorgaben gemäß Handbuch für MSC-Ware werden eingehalten." },
      { nr: "8.14", text: "Konventionelle Ware und Produkte aus Qualitätssicherungsprogrammen (Bio, Bayerisches Biosiegel, Geprüfte Qualität-Bayern, QS., etc.) sind klar getrennt." },
      { nr: "8.15", text: "Die Kennzeichnung von Produkten aus Qualitätssicherungsprogrammen (Bio, Bayerisches Biosiegel, Geprüfte Qualität-Bayern, QS., etc.) sind korrekt." },
      { nr: "8.16", text: "Sonstiges" },
    ],
  },
  {
    id: "9",
    title: "9. Personalbereich / Personalhygiene",
    items: [
      { nr: "9.1", text: "Der gesamte Personalbereich (Umkleide- und Aufenthaltsräume, Toiletten, Handwaschplätze etc.) ist ordentlich und sauber." },
      { nr: "9.2", text: "Die vorgeschriebenen Wasch-, Desinfektions- und Pflegemittel sind an allen vorgesehenen Stellen in ausreichender Menge vorhanden." },
      { nr: "10.3", text: "Alle Anforderungen an die Personalhygiene (z.B. saubere Kleidung) werden erfüllt." },
      { nr: "10.4", text: "Beim Umgang mit offenen Lebensmitteln werden die Regeln zur Personalhygiene umgesetzt." },
      { nr: "10.5", text: "Privat- und Hygienekleidung werden getrennt aufbewahrt." },
      { nr: "10.6", text: "Sonstiges" },
    ],
  },
  {
    id: "11",
    title: "11. Eigenkontrollen / Schulungen / Prüfmittelkontrolle",
    items: [
      { nr: "11.1", text: "Alle Eigenkontrollen gemäß Qualitätssicherungs-Handbuch sind dokumentiert." },
      { nr: "11.2", text: "Alle Mitarbeiter haben innerhalb der letzten 12 Monate eine den Vorschriften entsprechende Schulung erhalten." },
      { nr: "11.3", text: "Alle Mitarbeiter, die mit offenen Lebensmitteln umgehen, haben innerhalb der letzten 12 Monate eine Belehrung nach dem Infektionsschutzgesetz erhalten." },
      { nr: "11.4", text: "Alle geführten Formblätter werden gemäß den Handbuchvorgaben im jeweiligen Ablageordner (HACCP Ablage 1-x) archiviert." },
      { nr: "11.5", text: 'Funktionsfähige, geeignete und kontrollierte Prüfmittel (z.B. Thermometer) sind in ausreichender Anzahl in den Abteilungen vorhanden. Das Formblatt \u201E3.19 Prüfmittelüberwachung\u201C wird geführt.' },
      { nr: "11.6", text: "Die Selbstverpflichtung zur Einhaltung der Regeln der Lebensmittelsicherheitskultur wurde von allen Mitarbeitern mit Unterschrift bestätigt." },
    ],
  },
  {
    id: "12",
    title: "12. Weitere Kontrollpunkte",
    items: [
      { nr: "12.1", text: "Die Kundentoiletten sind ordentlich und sauber." },
      { nr: "12.2", text: "Schädlingsmonitoring und -bekämpfung wird regelmäßig durchgeführt und dokumentiert." },
      { nr: "12.3", text: "Abfall wird vorschriftsmäßig getrennt, gelagert und entsorgt." },
      { nr: "12.4", text: "Warenrückrufprotokolle werden gemäß den Vorgaben bearbeitet und für 2 Jahre in der Verkaufsstelle archiviert." },
      { nr: "12.5", text: "Behördliche Gegenproben werden vorschriftsmäßig gelagert. Entnahmebelege werden per E-Mail an die QM-Abteilung weitergeleitet." },
      { nr: "12.6", text: "Preisauszeichnung, Etiketten, Plakate für Produkte aus Qualitätssicherungsprogrammen sind korrekt." },
      { nr: "12.7", text: "Sonstiges" },
    ],
  },
  {
    id: "13",
    title: "13. Gastronomie",
    items: [
      { nr: "13.1", text: "Baulicher Zustand in Ordnung." },
      { nr: "13.2", text: "Es gibt keine Anzeichen auf Schädlingsbefall." },
      { nr: "13.3", text: "Allgemeine Hygiene in Ordnung (Personal-, Betriebshygiene, Umsetzung der Reinigungspläne), Gastraum hygienisch in Ordnung." },
      { nr: "13.4", text: "Die Reinigung des Bereichs wird durchgeführt und im entsprechenden Formblatt zur Reinigung dokumentiert." },
      { nr: "13.5", text: "Erforderliche Dokumentationen (Wareneingangskontrollen, Temperaturkontrollen etc.) werden durchgeführt und dokumentiert." },
      { nr: "13.6", text: "Rezepturen sind vorhanden und werden eingehalten." },
      { nr: "13.7", text: "Alle Zutaten werden vorschriftsgemäß gelagert. Es wird keine Ware mit abgelaufenen Verbrauchsdatum verarbeitet. Zutaten mit abgelaufenen MHD werden vor Verarbeitung sensorisch geprüft." },
      { nr: "13.8", text: "Die Verbraucherinformation (Allergene, Zusatzstoffinformationen) ist aktuell, vollständig und liegt für den Kunden aus." },
      { nr: "13.9", text: "Alle vorgeschriebenen Kennzeichnungen / Deklarationen sind vorhanden und korrekt." },
      { nr: "13.10", text: "Allergenmanagement wird während Produktion und an der Essensausgabe eingehalten." },
      { nr: "13.11", text: "Gar- und Heißhaltezeiten bzw. -temperaturen werden kontrolliert und dokumentiert, Frittierfettkontrolle wird durchgeführt und dokumentiert." },
      { nr: "13.12", text: "Sonstiges" },
    ],
  },
];

type SectionData = Record<string, { status: CheckStatus; bemerkung: string }>;

interface Report {
  id: number;
  quartal: number;
  year: number;
  durchgefuehrtAm: string | null;
  durchgefuehrtVon: string | null;
  sectionData: SectionData | null;
  aktionsplan: string | null;
  createdAt: string;
}

function buildEmptyData(): SectionData {
  const data: SectionData = {};
  for (const section of SECTIONS) {
    for (const item of section.items) {
      data[item.nr] = { status: "", bemerkung: "" };
    }
  }
  return data;
}

function StatusButton({
  value, current, onChange, label, icon, color,
}: {
  value: CheckStatus; current: CheckStatus; onChange: (v: CheckStatus) => void;
  label: string; icon: React.ReactNode; color: string;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(active ? "" : value)}
      title={label}
      className={`flex items-center justify-center w-9 h-9 rounded-lg border-2 transition-all duration-150 text-sm font-bold
        ${active ? `${color} border-transparent shadow-sm` : "bg-white border-border/40 text-muted-foreground hover:border-border"}`}
    >
      {icon}
    </button>
  );
}

export default function Betriebsbegehung() {
  const { adminSession, selectedMarketId, hasPermission } = useAppStore();
  const canDelete = hasPermission("entries.delete");

  const [quartal, setQuartal] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [year, setYear] = useState(CURRENT_YEAR);
  const [reports, setReports] = useState<Report[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [sectionData, setSectionData] = useState<SectionData>(buildEmptyData());
  const [durchgefuehrtAm, setDurchgefuehrtAm] = useState("");
  const [durchgefuehrtVon, setDurchgefuehrtVon] = useState("");
  const [aktionsplan, setAktionsplan] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/betriebsbegehung?tenantId=1${selectedMarketId ? `&marketId=${selectedMarketId}` : ""}`);
      const data = await res.json();
      setReports(data);
    } finally {
      setLoading(false);
    }
  }, [selectedMarketId]);

  useEffect(() => { loadReports(); }, [loadReports]);

  useEffect(() => {
    const found = reports.find((r) => r.quartal === quartal && r.year === year);
    if (found) {
      setCurrentReport(found);
      setSectionData((found.sectionData as SectionData) || buildEmptyData());
      setDurchgefuehrtAm(found.durchgefuehrtAm || "");
      setDurchgefuehrtVon(found.durchgefuehrtVon || "");
      setAktionsplan(found.aktionsplan || "");
    } else {
      setCurrentReport(null);
      setSectionData(buildEmptyData());
      setDurchgefuehrtAm("");
      setDurchgefuehrtVon("");
      setAktionsplan("");
    }
    setSaved(false);
  }, [quartal, year, reports]);

  const handleStatusChange = (nr: string, status: CheckStatus) => {
    setSectionData((prev) => ({
      ...prev,
      [nr]: { ...prev[nr], status },
    }));
  };

  const handleBemerkungChange = (nr: string, bemerkung: string) => {
    setSectionData((prev) => ({
      ...prev,
      [nr]: { ...prev[nr], bemerkung },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { tenantId: 1, marketId: selectedMarketId || null, quartal, year, durchgefuehrtAm, durchgefuehrtVon, sectionData, aktionsplan };
      let res: Response;
      if (currentReport) {
        res = await fetch(`${BASE}/betriebsbegehung/${currentReport.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${BASE}/betriebsbegehung`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      setCurrentReport(data);
      await loadReports();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentReport) return;
    await fetch(`${BASE}/betriebsbegehung/${currentReport.id}`, { method: "DELETE" });
    setDeleteConfirm(false);
    await loadReports();
  };

  const handlePinSign = async () => {
    if (pinValue.length !== 4) return;
    setPinLoading(true);
    setPinError("");
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue, tenantId: 1 }),
      });
      if (res.status === 409) {
        setPinError("PIN mehrfach vergeben – bitte Admin kontaktieren.");
        return;
      }
      const data = await res.json();
      if (!data.valid) {
        setPinError("Ungültige PIN. Kein Mitarbeiter gefunden.");
        return;
      }
      setDurchgefuehrtVon(data.userName || "");
      setPinDialogOpen(false);
      setPinValue("");
      setPinError("");
    } finally {
      setPinLoading(false);
    }
  };

  const countByStatus = (status: CheckStatus) =>
    Object.values(sectionData).filter((v) => v.status === status).length;

  const totalItems = Object.keys(sectionData).length;
  const doneItems = countByStatus("ok") + countByStatus("mangel") + countByStatus("na");
  const mangelItems = countByStatus("mangel");

  const completedQuartals = reports
    .filter((r) => r.year === CURRENT_YEAR)
    .map((r) => r.quartal);

  const isFuture = isFutureQuartal(year, quartal);

  return (
    <AppLayout>
      <div className="max-w-full space-y-4 pb-8">
        <JaehrlicheErinnerung
          turnus="vierteljährlich"
          sectionLabel="1.6 Betriebsbegehung"
          completedQuartals={completedQuartals}
        />

        <PageHeader>
          <div className="flex items-center gap-3 mb-3">
            <Link href="/category/1" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-blue-200 font-medium tracking-wide uppercase">Sektion 1.6</p>
              <h1 className="text-xl md:text-2xl font-bold">Betriebsbegehung</h1>
            </div>
          </div>
          <p className="text-blue-100 text-sm mb-4">Eigenkontroll-Prüfliste · einmal pro Quartal durchzuführen</p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
              {[1, 2, 3, 4].map((q) => {
                const future = isFutureQuartal(year, q);
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => !future && setQuartal(q)}
                    disabled={future}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${quartal === q ? "bg-white text-[#1a3a6b] shadow" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                  >
                    Q{q}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 bg-white/10 rounded-xl px-2 py-1">
              <button type="button" onClick={() => setYear((y) => y - 1)} className="p-1 hover:bg-white/10 rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg px-2 min-w-[4rem] text-center">{year}</span>
              <button
                type="button"
                onClick={() => {
                  if (year < CURRENT_YEAR) {
                    const newYear = year + 1;
                    setYear(newYear);
                    if (newYear === CURRENT_YEAR && quartal > CURRENT_QUARTAL) setQuartal(CURRENT_QUARTAL);
                  }
                }}
                disabled={year >= CURRENT_YEAR}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {currentReport && (
              <span className="text-xs bg-green-500/20 text-green-200 border border-green-400/30 px-3 py-1.5 rounded-lg font-medium">
                ✓ Gespeichert
              </span>
            )}
            {!currentReport && (
              <span className="text-xs bg-white/10 text-blue-200 border border-white/20 px-3 py-1.5 rounded-lg">
                Neuer Bericht
              </span>
            )}
          </div>
        </PageHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-border/60 p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalItems - mangelItems - countByStatus("na")}<span className="text-muted-foreground text-base font-normal">/{totalItems}</span></div>
            <div className="text-xs text-muted-foreground mt-1">In Ordnung</div>
          </div>
          <div className={`bg-white rounded-xl border p-4 text-center ${mangelItems > 0 ? "border-red-200" : "border-border/60"}`}>
            <div className={`text-2xl font-bold ${mangelItems > 0 ? "text-red-600" : "text-foreground"}`}>{mangelItems}</div>
            <div className="text-xs text-muted-foreground mt-1">Mängel</div>
          </div>
          <div className="bg-white rounded-xl border border-border/60 p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{countByStatus("na")}</div>
            <div className="text-xs text-muted-foreground mt-1">Nicht anwendbar</div>
          </div>
        </div>

        {isFuture && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🔒</span>
            </div>
            <div>
              <p className="font-semibold text-amber-900 text-sm">Dieses Quartal liegt in der Zukunft</p>
              <p className="text-amber-700 text-xs mt-0.5">Q{quartal} {year} kann noch nicht ausgefüllt werden.</p>
            </div>
          </div>
        )}

        {!isFuture && (
        <div className="contents">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="bg-secondary/30 border-b border-border/60 px-6 py-4">
            <h2 className="font-semibold text-foreground text-sm">Allgemeine Angaben</h2>
          </div>
          <div className="p-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Durchgeführt am</label>
              <input
                type="date"
                value={durchgefuehrtAm}
                onChange={(e) => setDurchgefuehrtAm(e.target.value)}
                max={TODAY}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Durchgeführt von</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={durchgefuehrtVon}
                  onChange={(e) => setDurchgefuehrtVon(e.target.value)}
                  placeholder="Name eingeben oder per PIN"
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => { setPinDialogOpen(true); setPinValue(""); setPinError(""); }}
                  title="Mit PIN unterschreiben"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  PIN
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border/60 shadow-sm px-4 py-3 flex items-center gap-6 text-xs">
          <span className="font-semibold text-muted-foreground">Legende:</span>
          <span className="flex items-center gap-1.5 text-green-700 font-medium">
            <CheckCircle2 className="w-4 h-4" /> In Ordnung
          </span>
          <span className="flex items-center gap-1.5 text-red-600 font-medium">
            <AlertTriangle className="w-4 h-4" /> Mangel
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <MinusCircle className="w-4 h-4" /> N/A
          </span>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] text-white px-5 py-3">
              <h2 className="font-bold text-sm">{section.title}</h2>
            </div>
            <div className="divide-y divide-border/40">
              {section.items.map((item) => {
                const entry = sectionData[item.nr] || { status: "", bemerkung: "" };
                return (
                  <div key={item.nr} className={`px-5 py-3 ${entry.status === "mangel" ? "bg-red-50/50" : ""}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-8 flex-shrink-0 pt-1">{item.nr}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                        {entry.status === "mangel" && (
                          <textarea
                            value={entry.bemerkung}
                            onChange={(e) => handleBemerkungChange(item.nr, e.target.value)}
                            placeholder="Mängelbeschreibung / Bemerkung..."
                            rows={2}
                            className="mt-2 w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white resize-none"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <StatusButton
                          value="mangel"
                          current={entry.status}
                          onChange={(v) => handleStatusChange(item.nr, v)}
                          label="Mangel"
                          icon={<AlertTriangle className="w-4 h-4" />}
                          color="bg-red-500 text-white"
                        />
                        <StatusButton
                          value="na"
                          current={entry.status}
                          onChange={(v) => handleStatusChange(item.nr, v)}
                          label="Nicht anwendbar"
                          icon={<span className="text-xs">N/A</span>}
                          color="bg-slate-400 text-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {mangelItems > 0 && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="bg-orange-500 text-white px-5 py-3">
              <h2 className="font-bold text-sm">Aktionsplan</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground mb-3">
                Es wurden <span className="font-bold text-red-600">{mangelItems} Mängel</span> festgestellt. Bitte erfassen Sie hier die geplanten Maßnahmen zur Behebung:
              </p>
              <textarea
                value={aktionsplan}
                onChange={(e) => setAktionsplan(e.target.value)}
                placeholder="Maßnahmen zur Mängelbeseitigung, zuständige Personen und geplante Termine..."
                rows={5}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {saved ? (
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Bericht erfolgreich gespeichert
              </span>
            ) : (
              <span>Q{quartal} · {year} · {totalItems - mangelItems - countByStatus("na")} von {totalItems} Punkten in Ordnung</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentReport && canDelete && (
              deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Bericht löschen?</span>
                  <button onClick={handleDelete} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Ja, löschen</button>
                  <button onClick={() => setDeleteConfirm(false)} className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-secondary">Abbrechen</button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Löschen
                </button>
              )
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#1a3a6b]/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Speichern..." : currentReport ? "Aktualisieren" : "Bericht speichern"}
            </button>
          </div>
        </div>
        </div>
        )}

        {reports.length > 1 && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="bg-secondary/30 border-b border-border/60 px-5 py-3">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" /> Vorherige Berichte
              </h2>
            </div>
            <div className="divide-y divide-border/40">
              {reports
                .filter((r) => !(r.quartal === quartal && r.year === year))
                .sort((a, b) => b.year - a.year || b.quartal - a.quartal)
                .map((r) => {
                  const mCount = r.sectionData
                    ? Object.values(r.sectionData as SectionData).filter((v) => v.status === "mangel").length
                    : 0;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { setQuartal(r.quartal); setYear(r.year); }}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm text-foreground">Q{r.quartal} · {r.year}</span>
                        {r.durchgefuehrtVon && (
                          <span className="text-xs text-muted-foreground">von {r.durchgefuehrtVon}</span>
                        )}
                        {r.durchgefuehrtAm && (
                          <span className="text-xs text-muted-foreground">{new Date(r.durchgefuehrtAm).toLocaleDateString("de-DE")}</span>
                        )}
                      </div>
                      {mCount > 0 ? (
                        <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">{mCount} Mängel</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">OK</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {pinDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">PIN-Unterschrift</h3>
                <p className="text-xs text-muted-foreground">4-stellige PIN eingeben</p>
              </div>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={pinValue}
              onChange={(e) => { setPinValue(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handlePinSign(); }}
              placeholder="• • • •"
              className="w-full border border-border rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-3"
            />
            {pinError && (
              <p className="text-xs text-red-600 text-center mb-3 flex items-center justify-center gap-1">
                <X className="w-3.5 h-3.5" /> {pinError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setPinDialogOpen(false); setPinValue(""); setPinError(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handlePinSign}
                disabled={pinValue.length !== 4 || pinLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {pinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
