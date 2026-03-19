import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const SCHULUNGSNACHWEIS_KATEGORIEN = [
  "lebensmittelhygiene",
  "arbeitssicherheit",
  "brandschutz",
  "haccp",
  "sonstige",
] as const;

export type SchulungsnachweisKategorie = typeof SCHULUNGSNACHWEIS_KATEGORIEN[number];

export const schulungsnachweiseTable = pgTable("schulungsnachweise", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  kategorie: text("kategorie").notNull(),
  mitarbeiterName: text("mitarbeiter_name").notNull(),
  bezeichnung: text("bezeichnung"),
  schulungsDatum: text("schulungs_datum"),
  naechsteSchulung: text("naechste_schulung"),
  anbieter: text("anbieter"),
  dokumentBase64: text("dokument_base64"),
  notizen: text("notizen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Schulungsnachweis = typeof schulungsnachweiseTable.$inferSelect;
