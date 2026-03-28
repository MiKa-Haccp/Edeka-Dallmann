import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { marketsTable } from "./markets";

export const monatsberichtConfigTable = pgTable("monatsbericht_config", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().unique().references(() => marketsTable.id),
  empfaengerEmail: text("empfaenger_email"),
  autoSend: boolean("auto_send").notNull().default(false),
  sendDay: integer("send_day").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MonatsberichtConfig = typeof monatsberichtConfigTable.$inferSelect;
