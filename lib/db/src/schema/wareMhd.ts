import { pgTable, serial, integer, varchar, text, boolean, date, timestamp } from "drizzle-orm/pg-core";

export const wareMhdBereicheTable = pgTable("ware_mhd_bereiche", {
  id:              serial("id").primaryKey(),
  marketId:        integer("market_id"),
  name:            varchar("name", { length: 100 }).notNull(),
  beschreibung:    text("beschreibung"),
  intervallTage:   integer("intervall_tage").notNull().default(1),
  reduzierungTage: integer("reduzierung_tage").notNull().default(3),
  entnahmeTage:    integer("entnahme_tage").notNull().default(1),
  sortOrder:       integer("sort_order").notNull().default(99),
  aktiv:           boolean("aktiv").notNull().default(true),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
});

export const wareMhdKontrollenTable = pgTable("ware_mhd_kontrollen", {
  id:        serial("id").primaryKey(),
  marketId:  integer("market_id").notNull(),
  bereichId: integer("bereich_id").notNull(),
  datum:     date("datum").notNull(),
  kuerzel:   varchar("kuerzel", { length: 10 }),
  bemerkung: text("bemerkung"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WareMhdBereich = typeof wareMhdBereicheTable.$inferSelect;
export type WareMhdKontrolle = typeof wareMhdKontrollenTable.$inferSelect;
