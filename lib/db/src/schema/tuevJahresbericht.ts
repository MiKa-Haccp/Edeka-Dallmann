import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";

export const tuevJahresberichtTable = pgTable("tuev_jahresbericht", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  marketId: integer("market_id").notNull().default(1),
  year: integer("year").notNull(),
  zertifikateDokument: text("zertifikate_dokument"),
  zertifikateNotizen: text("zertifikate_notizen"),
  pruefungenDokument: text("pruefungen_dokument"),
  pruefungenNotizen: text("pruefungen_notizen"),
  aktionsplanFoto: text("aktionsplan_foto"),
  aktionsplanMassnahmen: text("aktionsplan_massnahmen"),
  aktionsplanDatum: timestamp("aktionsplan_datum"),
  nachbesserungName: text("nachbesserung_name"),
  nachbesserungDatum: text("nachbesserung_datum"),
  nachbesserungUnterschrift: text("nachbesserung_unterschrift"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  uqTenantMarketYear: unique("uq_tuev_tenant_market_year").on(t.tenantId, t.marketId, t.year),
}));

export type TuevJahresbericht = typeof tuevJahresberichtTable.$inferSelect;
