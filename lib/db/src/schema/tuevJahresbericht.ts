import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const tuevJahresberichtTable = pgTable("tuev_jahresbericht", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  year: integer("year").notNull(),
  zertifikateDokument: text("zertifikate_dokument"),
  zertifikateNotizen: text("zertifikate_notizen"),
  pruefungenDokument: text("pruefungen_dokument"),
  pruefungenNotizen: text("pruefungen_notizen"),
  aktionsplanFoto: text("aktionsplan_foto"),
  aktionsplanMassnahmen: text("aktionsplan_massnahmen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TuevJahresbericht = typeof tuevJahresberichtTable.$inferSelect;
