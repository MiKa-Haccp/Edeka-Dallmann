import { pgTable, serial, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const archivLocksTable = pgTable("haccp_archiv_locks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1),
  marketId: integer("market_id").notNull(),
  year: integer("year").notNull(),
  lockedAt: timestamp("locked_at").defaultNow().notNull(),
  lockedBy: integer("locked_by"),
  lockedByName: text("locked_by_name"),
}, (table) => [
  uniqueIndex("archiv_locks_market_year_unique").on(table.marketId, table.year),
]);

export type ArchivLock = typeof archivLocksTable.$inferSelect;
