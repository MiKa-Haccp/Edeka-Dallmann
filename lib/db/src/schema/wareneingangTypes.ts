import { pgTable, serial, integer, varchar, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const wareneingangTypesTable = pgTable("wareneingang_types", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1),
  name: varchar("name", { length: 100 }).notNull(),
  beschreibung: text("beschreibung"),
  wareArt: varchar("ware_art", { length: 20 }).default("ungekuehlt"),
  criteriaConfig: jsonb("criteria_config").default({}),
  marketId: integer("market_id"),
  sortOrder: integer("sort_order").default(0),
  aktiv: boolean("aktiv").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wareneingangEntriesTable = pgTable("wareneingang_entries", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1),
  marketId: integer("market_id").notNull(),
  typeId: integer("type_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  criteriaValues: jsonb("criteria_values").default({}),
  kuerzel: varchar("kuerzel", { length: 20 }).notNull(),
  userId: integer("user_id"),
  notizen: text("notizen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WareneingangType = typeof wareneingangTypesTable.$inferSelect;
export type WareneingangEntry = typeof wareneingangEntriesTable.$inferSelect;
