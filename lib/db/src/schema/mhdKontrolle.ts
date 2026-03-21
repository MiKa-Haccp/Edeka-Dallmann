import { pgTable, serial, integer, varchar, date, timestamp, text } from "drizzle-orm/pg-core";

export const mhdKontrolleTable = pgTable("mhd_kontrolle", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull(),
  datum: date("datum").notNull(),
  bereich: varchar("bereich", { length: 100 }),
  artikel: varchar("artikel", { length: 200 }).notNull(),
  mhdDatum: date("mhd_datum").notNull(),
  menge: integer("menge").notNull().default(1),
  aktion: varchar("aktion", { length: 50 }).notNull().default("geprueft"),
  bemerkung: text("bemerkung"),
  kuerzel: varchar("kuerzel", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MhdKontrolleEntry = typeof mhdKontrolleTable.$inferSelect;
export type MhdKontrolleInsert = typeof mhdKontrolleTable.$inferInsert;
