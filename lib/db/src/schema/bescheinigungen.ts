import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const BESCHEINIGUNG_KATEGORIEN = [
  "gesundheitszeugnis",
  "arzneimittel",
  "ersthelfer",
  "brandschutz",
  "sonstige",
] as const;

export type BescheinigungKategorie = typeof BESCHEINIGUNG_KATEGORIEN[number];

export const bescheinigungenTable = pgTable("bescheinigungen", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  kategorie: text("kategorie").notNull(),
  mitarbeiterName: text("mitarbeiter_name").notNull(),
  bezeichnung: text("bezeichnung"),
  ausstellungsDatum: text("ausstellungs_datum"),
  gueltigBis: text("gueltig_bis"),
  dokumentBase64: text("dokument_base64"),
  notizen: text("notizen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Bescheinigung = typeof bescheinigungenTable.$inferSelect;
