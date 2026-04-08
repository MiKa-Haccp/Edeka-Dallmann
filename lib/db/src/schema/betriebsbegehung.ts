import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const betriebsbegehungTable = pgTable("betriebsbegehung", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  marketId: integer("market_id"),
  quartal: integer("quartal").notNull(),
  year: integer("year").notNull(),
  durchgefuehrtAm: text("durchgefuehrt_am"),
  durchgefuehrtVon: text("durchgefuehrt_von"),
  sectionData: jsonb("section_data"),
  aktionsplan: text("aktionsplan"),
  nachbesserungName: text("nachbesserung_name"),
  nachbesserungDatum: text("nachbesserung_datum"),
  nachbesserungUnterschrift: text("nachbesserung_unterschrift"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Betriebsbegehung = typeof betriebsbegehungTable.$inferSelect;
