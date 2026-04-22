export interface SectionConfig {
  number: string;
  title: string;
  href: string;
  dbId: number;
}

export interface CategoryConfig {
  id: number;
  label: string;
  sections: SectionConfig[];
}

export const SIDEBAR_CONFIG: CategoryConfig[] = [
  {
    id: 1,
    label: "Allgemein",
    sections: [
      { number: "1.1",  title: "Verantwortlichkeiten",           href: "/responsibilities",              dbId: 1  },
      { number: "1.2",  title: "Mitarbeiter & Kürzel",            href: "/mitarbeiter-liste",             dbId: 2  },
      { number: "1.3",  title: "Info Dokumentation",              href: "/info-documentation",            dbId: 53 },
      { number: "1.4",  title: "Schulungsnachweise",              href: "/training-records",              dbId: 3  },
      { number: "1.5",  title: "Reinigungsplan Jahr",             href: "/annual-cleaning-plan",          dbId: 4  },
      { number: "1.6",  title: "Betriebsbegehung",                href: "/betriebsbegehung",              dbId: 5  },
      { number: "1.7",  title: "Hinweisschild gesperrte Ware",   href: "/hinweisschild-gesperrte-ware",  dbId: 6  },
      { number: "1.8",  title: "Produktfehlermeldung",            href: "/produktfehlermeldung",          dbId: 7  },
      { number: "1.9",  title: "Probeentnahme",                   href: "/probeentnahme",                 dbId: 8  },
      { number: "1.10", title: "Anti-Vektor Zugang",              href: "/anti-vektor-zugang",            dbId: 10 },
      { number: "1.11", title: "Bescheinigungen & Nachweise",     href: "/bescheinigungen",               dbId: 11 },
      { number: "1.12", title: "Kontrollberichte",                href: "/kontrollberichte",              dbId: 12 },
      { number: "1.13", title: "Temperatur-Lagerkontrolle",       href: "/temp-lager-kontrolle",          dbId: 55 },
    ],
  },
  {
    id: 2,
    label: "Obst & Gemüse / Allgemein",
    sections: [
      { number: "2.1", title: "Wareneingänge",                   href: "/wareneingaenge",      dbId: 23 },
      { number: "2.2", title: "Warenzustand Obst & Gemüse",      href: "/warencheck-og",       dbId: 19 },
      { number: "2.3", title: "Reinigungsdokumentation täglich", href: "/reinigung-taeglich",  dbId: 20 },
      { number: "2.4", title: "Zugangsdaten Carrier-Portal",     href: "/carrier-portal",      dbId: 21 },
    ],
  },
  {
    id: 3,
    label: "Metzgerei / Käsetheke",
    sections: [
      { number: "3.1",  title: "Wareneingänge Metzgerei",         href: "/metzgerei-wareneingaenge",   dbId: 32 },
      { number: "3.2",  title: "Reinigungspläne Metzgerei",       href: "/reinigungsplan-metzgerei",   dbId: 33 },
      { number: "3.3",  title: "Öffnung Salate",                  href: "/oeffnung-salate",            dbId: 34 },
      { number: "3.4",  title: "Käsetheke und Reifeschrank",      href: "/kaesetheke-kontrolle",       dbId: 35 },
      { number: "3.5",  title: "Semmelliste",                     href: "/semmelliste",                dbId: 36 },
      { number: "3.6",  title: "Eingefrorenes Fleisch",           href: "/eingefrorenes-fleisch",      dbId: 37 },
      { number: "3.7",  title: "Eigenherstellung / Rezepturen",   href: "/rezepturen",                 dbId: 38 },
      { number: "3.8",  title: "GQ-Betriebsbegehung",            href: "/gq-begehung",                dbId: 39 },
      { number: "3.9",  title: "Abteilungsfremde Personen",       href: "/abteilungsfremde-personen",  dbId: 40 },
      { number: "3.10", title: "Rindfleisch-Etikettierung",       href: "/rindfleisch-etikettierung",  dbId: 41 },
      { number: "3.11", title: "Bestellungen",                    href: "/metz-bestellungen",          dbId: 42 },
    ],
  },
];

export const MARKET_TITLE_OVERRIDES: Record<number, Record<string, string>> = {
  3: { "2.4": "Zugangsdaten Hauser-Portal" },
};
