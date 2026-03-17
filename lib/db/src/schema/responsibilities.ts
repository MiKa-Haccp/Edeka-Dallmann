import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { marketsTable } from "./markets";

export const responsibilitiesTable = pgTable("responsibilities", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => marketsTable.id),
  department: text("department").notNull(),
  responsibleName: text("responsible_name"),
  responsiblePhone: text("responsible_phone"),
  deputyName: text("deputy_name"),
  deputyPhone: text("deputy_phone"),
  sortOrder: integer("sort_order").notNull().default(0),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertResponsibilitySchema = createInsertSchema(responsibilitiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResponsibility = z.infer<typeof insertResponsibilitySchema>;
export type Responsibility = typeof responsibilitiesTable.$inferSelect;

export const marketInfoTable = pgTable("market_info", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => marketsTable.id),
  marketNumber: text("market_number"),
  street: text("street"),
  plzOrt: text("plz_ort"),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMarketInfoSchema = createInsertSchema(marketInfoTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMarketInfo = z.infer<typeof insertMarketInfoSchema>;
export type MarketInfo = typeof marketInfoTable.$inferSelect;
