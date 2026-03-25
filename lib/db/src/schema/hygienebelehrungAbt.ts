import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const hygienebelehrungAbtTable = pgTable("hygienebelehrung_abt", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  marketId: integer("market_id"),
  name: text("name").notNull(),
  firmaAbteilung: text("firma_abteilung"),
  datum: text("datum").notNull(),
  unterschrift: text("unterschrift"),
  eingetragenVon: text("eingetragen_von"),
  kuerzel: text("kuerzel"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type HygienebelehrungAbt = typeof hygienebelehrungAbtTable.$inferSelect;
