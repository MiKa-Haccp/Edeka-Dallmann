import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { marketsTable } from "./markets";
import { sectionsTable } from "./sections";

export const formInstancesTable = pgTable("form_instances", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => marketsTable.id),
  sectionId: integer("section_id").notNull().references(() => sectionsTable.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFormInstanceSchema = createInsertSchema(formInstancesTable).omit({ id: true, createdAt: true });
export type InsertFormInstance = z.infer<typeof insertFormInstanceSchema>;
export type FormInstance = typeof formInstancesTable.$inferSelect;
