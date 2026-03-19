import { pgTable, serial, integer, varchar, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const wareneingangOGTable = pgTable("wareneingang_og", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1),
  marketId: integer("market_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  hygiene: varchar("hygiene", { length: 15 }),
  etikettierung: varchar("etikettierung", { length: 15 }),
  qualitaet: varchar("qualitaet", { length: 15 }),
  mhd: varchar("mhd", { length: 15 }),
  kistenetikett: varchar("kistenetikett", { length: 15 }),
  qsBiosiegel: varchar("qs_biosiegel", { length: 15 }),
  qsBy: varchar("qs_by", { length: 15 }),
  qsQs: varchar("qs_qs", { length: 15 }),
  tempCelsius: numeric("temp_celsius", { precision: 4, scale: 1 }),
  kuerzel: varchar("kuerzel", { length: 20 }).notNull(),
  userId: integer("user_id"),
  notizen: text("notizen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WareneingangOG = typeof wareneingangOGTable.$inferSelect;
