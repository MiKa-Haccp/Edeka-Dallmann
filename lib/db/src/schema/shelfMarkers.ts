import { pgTable, serial, integer, varchar, text, numeric, date, timestamp, boolean } from "drizzle-orm/pg-core";

export const shelfMarkersTable = pgTable("shelf_markers", {
  id:                  serial("id").primaryKey(),
  marketId:            integer("market_id").notNull(),
  label:               varchar("label", { length: 100 }).notNull(),
  x:                   numeric("x", { precision: 7, scale: 3 }).notNull(),
  y:                   numeric("y", { precision: 7, scale: 3 }).notNull(),
  size:                varchar("size", { length: 10 }).default("md"),
  rotated:             boolean("rotated").default(false),
  sortiment:           text("sortiment"),
  reduzierungsRegel:   text("reduzierungs_regel"),
  reduzierungsDatum:   text("reduzierungs_datum"),
  aktionsHinweis:      text("aktions_hinweis"),
  knickDatum:          text("knick_datum"),
  kontrollIntervall:   integer("kontroll_intervall").default(7),
  kontrollRhythmus:    text("kontroll_rhythmus"),
  naechsteKontrolle:   date("naechste_kontrolle"),
  letzteKontrolleAt:   timestamp("letzte_kontrolle_at"),
  letzteKontrolleVon:  varchar("letzte_kontrolle_von", { length: 100 }),
  createdAt:           timestamp("created_at").defaultNow().notNull(),
});

export type ShelfMarker = typeof shelfMarkersTable.$inferSelect;
