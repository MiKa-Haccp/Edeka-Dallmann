import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const KONTROLLBERICHT_KATEGORIEN = [
  "lebensmittelkontrolle",
  "tuev",
  "qal",
  "bio",
  "sonstige",
] as const;

export type KontrollberichtKategorie = typeof KONTROLLBERICHT_KATEGORIEN[number];

export const kontrollberichteTable = pgTable("kontrollberichte", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  kategorie: text("kategorie").notNull(),
  bezeichnung: text("bezeichnung").notNull(),
  kontrollstelle: text("kontrollstelle"),
  kontrollDatum: text("kontroll_datum"),
  gueltigBis: text("gueltig_bis"),
  ergebnis: text("ergebnis"),
  dokumentBase64: text("dokument_base64"),
  notizen: text("notizen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Kontrollbericht = typeof kontrollberichteTable.$inferSelect;
