import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const antiVektorZugangsdatenTable = pgTable("anti_vektor_zugangsdaten", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().unique(),
  websiteUrl: text("website_url").default("https://www.av-ods.de"),
  benutzername: text("benutzername"),
  passwort: text("passwort"),
  rufnummer: text("rufnummer"),
  notizen: text("notizen"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const antiVektorZertifikateTable = pgTable("anti_vektor_zertifikate", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  prueferName: text("pruefer_name").notNull(),
  zertifikatBezeichnung: text("zertifikat_bezeichnung"),
  gueltigBis: text("gueltig_bis"),
  fotoBase64: text("foto_base64"),
  notizen: text("notizen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AntiVektorZugangsdaten = typeof antiVektorZugangsdatenTable.$inferSelect;
export type AntiVektorZertifikat = typeof antiVektorZertifikateTable.$inferSelect;
