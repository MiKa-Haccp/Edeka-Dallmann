import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const arzneimittelSachkundeTable = pgTable("arzneimittel_sachkunde", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  mitarbeiterName: text("mitarbeiter_name").notNull(),
  zertifikatBezeichnung: text("zertifikat_bezeichnung"),
  ausstellungsDatum: text("ausstellungs_datum"),
  gueltigBis: text("gueltig_bis"),
  dokumentBase64: text("dokument_base64"),
  notizen: text("notizen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ArzneimittelSachkunde = typeof arzneimittelSachkundeTable.$inferSelect;
