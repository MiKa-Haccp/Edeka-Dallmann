import { Router, type IRouter } from "express";
import { db, tenantsTable, marketsTable, categoriesTable, sectionsTable, formDefinitionsTable, usersTable, responsibilitiesTable, marketInfoTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/seed", async (_req, res) => {
  const existingTenants = await db.select().from(tenantsTable);
  if (existingTenants.length > 0) {
    await seedTrainingTopics(db);
    res.json({ message: "Data already seeded" });
    return;
  }

  const [tenant] = await db.insert(tenantsTable).values({ name: "EDEKA Mustermarkt" }).returning();

  await db.insert(marketsTable).values([
    { tenantId: tenant.id, name: "Leeder", code: "LEE" },
    { tenantId: tenant.id, name: "Buching", code: "BUC" },
    { tenantId: tenant.id, name: "MOD", code: "MOD" },
  ]);

  const [cat1] = await db.insert(categoriesTable).values({ name: "allgemein", label: "HACCP 1 - Allgemein", sortOrder: 1 }).returning();
  const [cat2] = await db.insert(categoriesTable).values({ name: "markt", label: "HACCP 2 - Markt", sortOrder: 2 }).returning();
  const [cat3] = await db.insert(categoriesTable).values({ name: "metzgerei", label: "HACCP 3 - Metzgerei", sortOrder: 3 }).returning();

  const allgemeinSections = [
    { number: "1.1", title: "Verantwortlichkeiten", sortOrder: 1 },
    { number: "1.2", title: "Kürzellisten", sortOrder: 2 },
    { number: "1.3", title: "Info Dokumentation und Ablagefristen", sortOrder: 3 },
    { number: "1.4", title: "Schulungsnachweise", sortOrder: 4 },
    { number: "1.5", title: "Reinigungsplan Jahr", sortOrder: 5 },
    { number: "1.6", title: "Rückverfolgbarkeit", sortOrder: 6 },
    { number: "1.7", title: "Reklamationsmanagement", sortOrder: 7 },
    { number: "1.8", title: "Krisenmanagement", sortOrder: 8 },
    { number: "1.9", title: "Rückrufverfahren", sortOrder: 9 },
    { number: "1.10", title: "Schädlingsbekämpfung", sortOrder: 10 },
    { number: "1.11", title: "Abfallmanagement", sortOrder: 11 },
    { number: "1.12", title: "Wasserqualität", sortOrder: 12 },
    { number: "1.13", title: "Personalhygiene", sortOrder: 13 },
    { number: "1.14", title: "Besucherregelung", sortOrder: 14 },
    { number: "1.15", title: "Glasbruch-/Fremdkörpermanagement", sortOrder: 15 },
    { number: "1.16", title: "Allergenmanagement", sortOrder: 16 },
    { number: "1.17", title: "Gefahrenanalyse", sortOrder: 17 },
    { number: "1.18", title: "CCP-Übersicht", sortOrder: 18 },
    { number: "1.19", title: "Dokumentenlenkung", sortOrder: 19 },
  ];

  const marktSections = [
    { number: "2.1", title: "Temperaturkontrolle Kühltheke", sortOrder: 1 },
    { number: "2.2", title: "Temperaturkontrolle TK-Truhe", sortOrder: 2 },
    { number: "2.3", title: "Temperaturkontrolle Kühlhaus", sortOrder: 3 },
    { number: "2.4", title: "Reinigungsplan Markt", sortOrder: 4 },
    { number: "2.5", title: "Warenannahme MoPro", sortOrder: 5 },
    { number: "2.6", title: "Warenannahme Obst & Gemüse", sortOrder: 6 },
    { number: "2.7", title: "Warenannahme TK-Ware", sortOrder: 7 },
    { number: "2.8", title: "Warenannahme Trockensortiment", sortOrder: 8 },
    { number: "2.9", title: "Warenannahme Getränke", sortOrder: 9 },
    { number: "2.10", title: "Warenannahme Non-Food", sortOrder: 10 },
    { number: "2.11", title: "Warenannahme Brot & Backwaren", sortOrder: 11 },
    { number: "2.12", title: "Warenannahme Sonstiges", sortOrder: 12 },
    { number: "2.13", title: "MHD-Kontrolle", sortOrder: 13 },
  ];

  const metzgereiSections = [
    { number: "3.1", title: "Temperaturkontrolle Fleisch", sortOrder: 1 },
    { number: "3.2", title: "Reinigungspläne Metzgerei", sortOrder: 2 },
    { number: "3.3", title: "Warenannahme Fleisch", sortOrder: 3 },
    { number: "3.4", title: "Zerlegung", sortOrder: 4 },
    { number: "3.5", title: "Wurstherstellung", sortOrder: 5 },
    { number: "3.6", title: "Räuchern", sortOrder: 6 },
    { number: "3.7", title: "Kochprozesse", sortOrder: 7 },
    { number: "3.8", title: "Kühlung & Lagerung", sortOrder: 8 },
    { number: "3.9", title: "Verpackung", sortOrder: 9 },
    { number: "3.10", title: "Etikettierung", sortOrder: 10 },
    { number: "3.11", title: "Thekenverkauf", sortOrder: 11 },
    { number: "3.12", title: "Personalschulung Metzgerei", sortOrder: 12 },
    { number: "3.13", title: "Gerätewartung", sortOrder: 13 },
    { number: "3.14", title: "Nematoden-Kontrolle", sortOrder: 14 },
    { number: "3.15", title: "Hackfleischherstellung", sortOrder: 15 },
    { number: "3.16", title: "Geflügelverarbeitung", sortOrder: 16 },
    { number: "3.17", title: "Wildverarbeitung", sortOrder: 17 },
    { number: "3.18", title: "Fischverarbeitung", sortOrder: 18 },
    { number: "3.19", title: "Marinaden & Gewürze", sortOrder: 19 },
    { number: "3.20", title: "Warmhaltung & Ausgabe", sortOrder: 20 },
    { number: "3.21", title: "Probenentnahme", sortOrder: 21 },
  ];

  const insertedAllgemein = await db.insert(sectionsTable).values(
    allgemeinSections.map(s => ({ ...s, categoryId: cat1.id }))
  ).returning();

  const insertedMarkt = await db.insert(sectionsTable).values(
    marktSections.map(s => ({ ...s, categoryId: cat2.id }))
  ).returning();

  const insertedMetzgerei = await db.insert(sectionsTable).values(
    metzgereiSections.map(s => ({ ...s, categoryId: cat3.id }))
  ).returning();

  const moProSection = insertedMarkt.find(s => s.number === "2.5")!;
  await db.insert(formDefinitionsTable).values([
    { sectionId: moProSection.id, fieldName: "temperatur", fieldType: "temperature", label: "Temperatur (°C)", required: true, warningThreshold: 7, sortOrder: 1 },
    { sectionId: moProSection.id, fieldName: "zustand", fieldType: "boolean", label: "Zustand OK", required: true, sortOrder: 2 },
    { sectionId: moProSection.id, fieldName: "bemerkung", fieldType: "text", label: "Bemerkung", required: false, sortOrder: 3 },
    { sectionId: moProSection.id, fieldName: "foto", fieldType: "photo", label: "Foto", required: false, sortOrder: 4 },
    { sectionId: moProSection.id, fieldName: "kuerzel", fieldType: "signature", label: "Handzeichen/Kürzel", required: true, sortOrder: 5 },
    { sectionId: moProSection.id, fieldName: "pin", fieldType: "pin", label: "Mitarbeiter-PIN", required: true, sortOrder: 6 },
  ]);

  const fleischSection = insertedMetzgerei.find(s => s.number === "3.1")!;
  await db.insert(formDefinitionsTable).values([
    { sectionId: fleischSection.id, fieldName: "temperatur", fieldType: "temperature", label: "Temperatur (°C)", required: true, warningThreshold: 2, sortOrder: 1 },
    { sectionId: fleischSection.id, fieldName: "zustand", fieldType: "boolean", label: "Zustand OK", required: true, sortOrder: 2 },
    { sectionId: fleischSection.id, fieldName: "bemerkung", fieldType: "text", label: "Bemerkung", required: false, sortOrder: 3 },
    { sectionId: fleischSection.id, fieldName: "foto", fieldType: "photo", label: "Foto", required: false, sortOrder: 4 },
    { sectionId: fleischSection.id, fieldName: "kuerzel", fieldType: "signature", label: "Handzeichen/Kürzel", required: true, sortOrder: 5 },
    { sectionId: fleischSection.id, fieldName: "pin", fieldType: "pin", label: "Mitarbeiter-PIN", required: true, sortOrder: 6 },
  ]);

  await db.insert(usersTable).values([
    { tenantId: tenant.id, name: "Max Mustermann", email: "max@edeka.de", role: "SUPERADMIN", initials: "MM", pin: "1234" },
    { tenantId: tenant.id, name: "Anna Schmidt", email: "anna@edeka.de", role: "ADMIN", initials: "AS", pin: "5678" },
    { tenantId: tenant.id, name: "Thomas Weber", email: "thomas@edeka.de", role: "USER", initials: "TW", pin: "9012" },
  ]);

  const allMarkets = await db.select().from(marketsTable);
  const currentYear = new Date().getFullYear();

  for (const market of allMarkets) {
    await db.insert(marketInfoTable).values({
      marketId: market.id,
      marketNumber: market.code === "LEE" ? "38107" : market.code === "BUC" ? "38108" : "38109",
      street: market.code === "LEE" ? "Dammstraße 28" : market.code === "BUC" ? "Hauptstraße 5" : "Bahnhofstraße 12",
      plzOrt: market.code === "LEE" ? "86825 Leeder" : market.code === "BUC" ? "86983 Buching" : "86989 MOD",
      year: currentYear,
    });

    const departments = [
      { department: "Marktleitung / Betreiber", responsibleName: "Frau Leyer", responsiblePhone: "0176/61703866", deputyName: "Frau Landherr", deputyPhone: "0160/6392521", sortOrder: 1 },
      { department: "HACCP- bzw. Hygiene-Beauftragter", responsibleName: "Frau Leyer", responsiblePhone: "s.o.", deputyName: "Frau Landherr", deputyPhone: "s.o.", sortOrder: 2 },
      { department: "Fleisch und Wurst", responsibleName: "Herr Wurth", responsiblePhone: "0176/83800179", deputyName: "Fr. Glossner", deputyPhone: "0173/6420766", sortOrder: 3 },
      { department: "Molkereiprodukte und Feinkost", responsibleName: "Fr. Schuster", responsiblePhone: "0162/5445376", deputyName: "Fr. Sarilenya", deputyPhone: "0160/87030 33", sortOrder: 4 },
      { department: "(MSC) Fisch", responsibleName: "", responsiblePhone: "", deputyName: "", deputyPhone: "", sortOrder: 5 },
      { department: "Obst und Gemüse", responsibleName: "Fr. Leyer", responsiblePhone: "s.o.", deputyName: "Fr. Landherr", deputyPhone: "s.o.", sortOrder: 6 },
      { department: "Backshop", responsibleName: "", responsiblePhone: "", deputyName: "", deputyPhone: "", sortOrder: 7 },
      { department: "Kühl- und Tiefkühlware", responsibleName: "Fr. Leyer", responsiblePhone: "s.o.", deputyName: "Fr. Landherr", deputyPhone: "s.o.", sortOrder: 8 },
      { department: "Trockensortiment", responsibleName: "Fr. Leyer", responsiblePhone: "s.o.", deputyName: "Fr. Landherr", deputyPhone: "s.o.", sortOrder: 9 },
      { department: "Freiverkäufliche Arzneimittel", responsibleName: "Fr. Leyer", responsiblePhone: "s.o.", deputyName: "Fr. Landherr", deputyPhone: "s.o.", sortOrder: 10 },
    ];

    await db.insert(responsibilitiesTable).values(
      departments.map(d => ({ ...d, marketId: market.id, year: currentYear }))
    );
  }

  await seedTrainingTopics(db);

  res.json({ message: "HACCP data seeded successfully" });
});

async function seedTrainingTopics(database: typeof db) {
  const { trainingTopicsTable } = await import("@workspace/db");
  const existingTopics = await database.select().from(trainingTopicsTable);
  if (existingTopics.length === 0) {
    const defaultTopics = [
      { title: `J\u00e4hrliche Belehrung und Belehrung beim Eintritt gem. \u00a7 43 Abs. 4 Infektionsschutzgesetz (IfSG)`, responsible: "Marktleitung oder Inhaber", trainingMaterial: "Kapitel 4.2 oder EDEKA Wissensportal", sortOrder: 1 },
      { title: `Hygieneschulung (Personal-, Betriebshygiene, Reinigung/Desinfektion, Sch\u00e4dlingsmonitoring, HACCP etc.)`, responsible: "Marktleitung oder Inhaber", trainingMaterial: `Kapitel 4.3 oder EDEKA Wissensportal unter "Das 1x1 der EDEKA-Qualit\u00e4tssicherung"`, sortOrder: 2 },
      { title: `Bio/\u00d6ko-Lebensmittel (insb. Warentrennung, Verhinderung Kontamination/Vermischung, Kennzeichnung, Massenbilanz)`, responsible: "Marktleitung oder Inhaber", trainingMaterial: "Kapitel", sortOrder: 3 },
      { title: `Handel mit freiverk\u00e4uflichen Arzneimitteln (Belehrung zum Umgang mit freiverk\u00e4uflichen Arzneimitteln nach \u00a750 Arzneimittelgesetz (AMG))`, responsible: "Marktleitung oder Inhaber", trainingMaterial: "Kapitel 4.4 oder EDEKA Wissensportal", sortOrder: 4 },
      { title: `Herstellung von leicht verderblichen Lebensmitteln (Achtung: diese Schulung ersetzt nicht die Schulung "Hackfleischf\u00fchrerschein")`, responsible: "Marktleitung oder Inhaber", trainingMaterial: "Kapitel 4.5", sortOrder: 5 },
      { title: `Verkauf von QS-Ware nach dem System "QS Qualit\u00e4t und Sicherheit GmbH"`, responsible: "Marktleitung oder Inhaber", trainingMaterial: "Kapitel 4.4", sortOrder: 6 },
      { title: "Rindfleischetikettierung", responsible: "Marktleitung oder Inhaber", trainingMaterial: "Kapitel 9.5 oder EDEKA Wissensportal", sortOrder: 7 },
      { title: `Verkauf von unverpackter, loser GQ-Ware wie z.B. Rind-, Schweine-/GQ-Wurstwaren, Putenfleisch, Puten, K\u00e4se etc. nach dem System "Gepr\u00fcfte Qualit\u00e4t \u2013 Bayern GQ" mit Auslobung \u00fcber die Bedienungstheke. (Umsetzung, Ein-/ Ausgangsdokumentation, Verhalten bei einer Kontrolle etc.)`, responsible: "Marktleitung oder Inhaber", trainingMaterial: "Kapitel 9.5 oder EDEKA Wissensportal", sortOrder: 8 },
      { title: `Verkauf von MSC-Fisch \u00fcber die Bedienungstheke`, responsible: "F&W Fachberater", trainingMaterial: `Kapitel 11.0 oder Schulungspr\u00e4sentation`, sortOrder: 9 },
      { title: `Verhalten bei Salmonellenbefall \u2013 Durchzuf\u00fchrende Ma\u00dfnahmen`, responsible: "Marktleitung oder Inhaber", trainingMaterial: "Kapitel 4.6", sortOrder: 10 },
      { title: `Unfallverh\u00fctungsvorschriften der Berufsgenossenschaft (berufsgenossenschaftliche Informationen, BG-Merkbl\u00e4tter etc.)`, responsible: "Marktleiter oder Inhaber", trainingMaterial: "Unterlagen der Berufsgenossenschaft", sortOrder: 11 },
      { title: `Innerbetriebliche Arbeitssicherheit (Brandschutz, Gef\u00e4hrdungsbeurteilung, Gefahrstoffe, Maschineneinweisung etc.)`, responsible: "Marktleiter oder Inhaber", trainingMaterial: "Unterlagen der Berufsgenossenschaft", sortOrder: 12 },
      { title: "Sonstiges", responsible: "", trainingMaterial: "", sortOrder: 13 },
    ];

    await database.insert(trainingTopicsTable).values(
      defaultTopics.map(t => ({ ...t, isDefault: true }))
    );
  }
}

export default router;
