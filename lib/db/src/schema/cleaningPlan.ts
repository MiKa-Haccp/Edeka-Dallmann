import { pgTable, serial, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const cleaningPlanConfirmationsTable = pgTable("cleaning_plan_confirmations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  itemKey: text("item_key").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  initials: text("initials").notNull(),
  userId: integer("user_id").references(() => usersTable.id),
  confirmedAt: timestamp("confirmed_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("cleaning_plan_unique").on(table.tenantId, table.itemKey, table.year, table.month),
]);

export type CleaningPlanConfirmation = typeof cleaningPlanConfirmationsTable.$inferSelect;
