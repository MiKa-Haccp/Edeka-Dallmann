import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const BESPRECHUNGSDOKUMENT_KATEGORIEN = [
  "marktbesprechung",
  "hygienebelehrung",
  "teammeeting",
  "abteilungsrunde",
  "sonstige",
] as const;

export type BesprechungsdokumentKategorie = typeof BESPRECHUNGSDOKUMENT_KATEGORIEN[number];

export const besprechungsdokumenteTable = pgTable("besprechungsdokumente", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  kategorie: text("kategorie").notNull(),
  datum: text("datum").notNull(),
  leiter: text("leiter"),
  thema: text("thema"),
  teilnehmerAnzahl: text("teilnehmer_anzahl"),
  naechsteBesprechung: text("naechste_besprechung"),
  dokumentBase64: text("dokument_base64"),
  notizen: text("notizen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Besprechungsdokument = typeof besprechungsdokumenteTable.$inferSelect;
