import { pgTable, serial, integer, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const oeffnungSalateTable = pgTable("oeffnung_salate", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1),
  marketId: integer("market_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  artikelBezeichnung: text("artikel_bezeichnung").notNull(),
  verbrauchsdatum: varchar("verbrauchsdatum", { length: 20 }),
  eigenherstellung: boolean("eigenherstellung").notNull().default(false),
  kuerzel: varchar("kuerzel", { length: 20 }).notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OeffnungSalate = typeof oeffnungSalateTable.$inferSelect;
