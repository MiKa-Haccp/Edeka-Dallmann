import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const gesundheitszeugnisseTable = pgTable("gesundheitszeugnisse", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  marketId: integer("market_id").notNull().default(1),
  mitarbeiterName: text("mitarbeiter_name").notNull(),
  ausstellungsDatum: text("ausstellungs_datum"),
  naechstePruefung: text("naechste_pruefung"),
  dokumentBase64: text("dokument_base64"),
  notizen: text("notizen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Gesundheitszeugnis = typeof gesundheitszeugnisseTable.$inferSelect;
