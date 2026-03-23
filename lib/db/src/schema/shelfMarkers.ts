import { pgTable, serial, integer, varchar, text, numeric, date, timestamp } from "drizzle-orm/pg-core";

export const shelfMarkersTable = pgTable("shelf_markers", {
  id:                serial("id").primaryKey(),
  marketId:          integer("market_id").notNull(),
  label:             varchar("label", { length: 100 }).notNull(),
  x:                 numeric("x", { precision: 7, scale: 3 }).notNull(),
  y:                 numeric("y", { precision: 7, scale: 3 }).notNull(),
  sortiment:         text("sortiment"),
  reduzierungsRegel: text("reduzierungs_regel"),
  aktionsHinweis:    text("aktions_hinweis"),
  kontrollIntervall: integer("kontroll_intervall").default(7),
  naechsteKontrolle: date("naechste_kontrolle"),
  createdAt:         timestamp("created_at").defaultNow().notNull(),
});

export type ShelfMarker = typeof shelfMarkersTable.$inferSelect;
