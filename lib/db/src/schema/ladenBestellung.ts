import { pgTable, serial, integer, varchar, text, date, timestamp } from "drizzle-orm/pg-core";

export const ladenBestellgebieteTable = pgTable("laden_bestellgebiete", {
  id:          serial("id").primaryKey(),
  marketId:    integer("market_id").notNull(),
  tenantId:    integer("tenant_id").notNull().default(1),
  name:        varchar("name", { length: 100 }).notNull(),
  farbe:       varchar("farbe", { length: 20 }).default("#1a3a6b"),
  x:           integer("x").notNull().default(0),
  y:           integer("y").notNull().default(0),
  w:           integer("w").notNull().default(180),
  h:           integer("h").notNull().default(100),
  sortOrder:   integer("sort_order").notNull().default(99),
  sortiment:   text("sortiment"),
  zustaendig:  varchar("zustaendig", { length: 100 }),
  kategorie:   varchar("kategorie", { length: 30 }),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const ladenBestellungenTable = pgTable("laden_bestellungen", {
  id:       serial("id").primaryKey(),
  marketId: integer("market_id").notNull(),
  tenantId: integer("tenant_id").notNull().default(1),
  gebietId: integer("gebiet_id").notNull(),
  datum:    date("datum").notNull(),
  kuerzel:  varchar("kuerzel", { length: 20 }),
  anmerkung: text("anmerkung"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ladenLieferplaeneTable = pgTable("laden_lieferplaene", {
  id:                    serial("id").primaryKey(),
  marketId:              integer("market_id").notNull(),
  tenantId:              integer("tenant_id").notNull().default(1),
  name:                  varchar("name", { length: 120 }).notNull(),
  kategorie:             varchar("kategorie", { length: 30 }),
  liefertag:             integer("liefertag").notNull(),
  bestelltag:            integer("bestelltag"),
  bestellschlussUhrzeit: varchar("bestellschluss_uhrzeit", { length: 10 }),
  notiz:                 text("notiz"),
  sortOrder:             integer("sort_order").notNull().default(99),
  createdAt:             timestamp("created_at").defaultNow().notNull(),
});

export type LadenBestellgebiet = typeof ladenBestellgebieteTable.$inferSelect;
export type LadenBestellung    = typeof ladenBestellungenTable.$inferSelect;
export type LadenLieferplan    = typeof ladenLieferplaeneTable.$inferSelect;
