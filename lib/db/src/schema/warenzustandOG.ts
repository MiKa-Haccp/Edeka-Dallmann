import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";

export const warenzustandOGTable = pgTable("warencheck_og", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1),
  marketId: integer("market_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  slot: varchar("slot", { length: 30 }).notNull(),
  kuerzel: varchar("kuerzel", { length: 20 }).notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WarenzustandOG = typeof warenzustandOGTable.$inferSelect;
