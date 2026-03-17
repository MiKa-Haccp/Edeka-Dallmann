import { Router, type IRouter } from "express";
import { db, tenantsTable, marketsTable, categoriesTable, sectionsTable, formDefinitionsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/seed", async (_req, res) => {
  const existingTenants = await db.select().from(tenantsTable);
  if (existingTenants.length > 0) {
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
    { number: "1.3", title: "Schulungsnachweise", sortOrder: 3 },
    { number: "1.4", title: "Lieferantenbewertung", sortOrder: 4 },
    { number: "1.5", title: "Rückverfolgbarkeit", sortOrder: 5 },
    { number: "1.6", title: "Reklamationsmanagement", sortOrder: 6 },
    { number: "1.7", title: "Krisenmanagement", sortOrder: 7 },
    { number: "1.8", title: "Rückrufverfahren", sortOrder: 8 },
    { number: "1.9", title: "Schädlingsbekämpfung", sortOrder: 9 },
    { number: "1.10", title: "Abfallmanagement", sortOrder: 10 },
    { number: "1.11", title: "Wasserqualität", sortOrder: 11 },
    { number: "1.12", title: "Personalhygiene", sortOrder: 12 },
    { number: "1.13", title: "Besucherregelung", sortOrder: 13 },
    { number: "1.14", title: "Glasbruch-/Fremdkörpermanagement", sortOrder: 14 },
    { number: "1.15", title: "Allergenmanagement", sortOrder: 15 },
    { number: "1.16", title: "Gefahrenanalyse", sortOrder: 16 },
    { number: "1.17", title: "CCP-Übersicht", sortOrder: 17 },
    { number: "1.18", title: "Dokumentenlenkung", sortOrder: 18 },
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

  res.json({ message: "HACCP data seeded successfully" });
});

export default router;
