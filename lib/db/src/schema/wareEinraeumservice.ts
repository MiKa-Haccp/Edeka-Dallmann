import { pgTable, serial, integer, varchar, text, date, time, timestamp } from "drizzle-orm/pg-core";

export const wareEinraeumserviceTable = pgTable("ware_einraeumservice", {
  id:            serial("id").primaryKey(),
  marketId:      integer("market_id").notNull(),
  datum:         date("datum").notNull(),
  dienstleister: varchar("dienstleister", { length: 100 }),
  paletten:      integer("paletten"),
  personal:      integer("personal"),
  beginn:        time("beginn"),
  ende:          time("ende"),
  anmerkungen:   text("anmerkungen"),
  kuerzel:       varchar("kuerzel", { length: 10 }),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

export type WareEinraeumservice = typeof wareEinraeumserviceTable.$inferSelect;
