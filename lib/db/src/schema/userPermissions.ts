import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { marketsTable } from "./markets";

export const userPermissionsTable = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  permissionType: text("permission_type").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: integer("resource_id"),
  granted: boolean("granted").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserPermission = typeof userPermissionsTable.$inferSelect;

export const userMarketAssignmentsTable = pgTable("user_market_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  marketId: integer("market_id").notNull().references(() => marketsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserMarketAssignment = typeof userMarketAssignmentsTable.$inferSelect;
