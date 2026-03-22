import { pgTable, serial, integer, varchar, date, timestamp } from "drizzle-orm/pg-core";

export const metzReinigungTable = pgTable("metz_reinigung", {
  id:        serial("id").primaryKey(),
  marketId:  integer("market_id").notNull(),
  itemKey:   varchar("item_key", { length: 60 }).notNull(),
  datum:     date("datum").notNull(),
  kuerzel:   varchar("kuerzel", { length: 20 }).notNull(),
  userId:    integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MetzReinigung = typeof metzReinigungTable.$inferSelect;
