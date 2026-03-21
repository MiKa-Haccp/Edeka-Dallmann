import { pgTable, serial, integer, varchar, text, boolean, date, timestamp } from "drizzle-orm/pg-core";

export const wareRayonsTable = pgTable("ware_rayons", {
  id:          serial("id").primaryKey(),
  marketId:    integer("market_id"),
  name:        varchar("name", { length: 100 }).notNull(),
  beschreibung: text("beschreibung"),
  farbe:       varchar("farbe", { length: 20 }).default("#1a3a6b"),
  sortOrder:   integer("sort_order").notNull().default(99),
  aktiv:       boolean("aktiv").notNull().default(true),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const wareBestellungenTable = pgTable("ware_bestellungen", {
  id:        serial("id").primaryKey(),
  marketId:  integer("market_id").notNull(),
  rayonId:   integer("rayon_id").notNull(),
  datum:     date("datum").notNull(),
  kuerzel:   varchar("kuerzel", { length: 10 }),
  anmerkung: text("anmerkung"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WareRayon = typeof wareRayonsTable.$inferSelect;
export type WareBestellung = typeof wareBestellungenTable.$inferSelect;
