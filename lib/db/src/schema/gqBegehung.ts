import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const gqBegehungTable = pgTable("gq_begehung", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  marketId: integer("market_id"),
  quartal: integer("quartal").notNull(),
  year: integer("year").notNull(),
  durchgefuehrtAm: text("durchgefuehrt_am"),
  durchgefuehrtVon: text("durchgefuehrt_von"),
  kuerzel: text("kuerzel"),
  checkData: jsonb("check_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GQBegehung = typeof gqBegehungTable.$inferSelect;
