import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { marketsTable } from "./markets";

export const marketEmailConfigsTable = pgTable("market_email_configs", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().unique().references(() => marketsTable.id),
  smtpUser: text("smtp_user"),
  smtpPass: text("smtp_pass"),
  fromName: text("from_name"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MarketEmailConfig = typeof marketEmailConfigsTable.$inferSelect;
