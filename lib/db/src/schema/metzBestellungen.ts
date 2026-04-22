import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const metzBestellungenTable = pgTable("metz_bestellungen", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1),
  marketId: integer("market_id"),
  datum: varchar("datum", { length: 10 }).notNull(),
  kundeName: varchar("kunde_name", { length: 100 }).notNull(),
  kundeTelefon: varchar("kunde_telefon", { length: 50 }),
  artikel: text("artikel").notNull(),
  menge: varchar("menge", { length: 50 }),
  notizen: text("notizen"),
  bestelltKuerzel: varchar("bestellt_kuerzel", { length: 20 }),
  bestelltUserId: integer("bestellt_user_id"),
  bestelltAm: timestamp("bestellt_am"),
  abholdatum: varchar("abholdatum", { length: 10 }),
  abgeholtKuerzel: varchar("abgeholt_kuerzel", { length: 20 }),
  abgeholtUserId: integer("abgeholt_user_id"),
  abgeholtAm: timestamp("abgeholt_am"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MetzBestellung = typeof metzBestellungenTable.$inferSelect;
