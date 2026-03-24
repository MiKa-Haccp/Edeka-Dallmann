import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";

export const marketsTable = pgTable("markets", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  address: text("address"),
  lat: text("lat"),
  lng: text("lng"),
  geoRadiusKm: integer("geo_radius_km").default(10),
  planRotiert: boolean("plan_rotiert").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMarketSchema = createInsertSchema(marketsTable).omit({ id: true, createdAt: true });
export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof marketsTable.$inferSelect;
