import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const besprechungsprotokollTable = pgTable("besprechungsprotokoll", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  datum: text("datum").notNull(),
  leiterName: text("leiter_name"),
  unterschriftLeiterDigital: text("unterschrift_leiter_digital"),
  thema: text("thema"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const besprechungTeilnehmerTable = pgTable("besprechung_teilnehmer", {
  id: serial("id").primaryKey(),
  protokollId: integer("protokoll_id").notNull(),
  nameManuel: text("name_manuel"),       // Manuell eingetragener Name
  userId: integer("user_id"),            // Verknüpfter Nutzer (nach PIN-Bestätigung)
  bestaetigterName: text("bestaetigt_name"), // Name aus dem Nutzerprofil
  bestaetigt: boolean("bestaetigt").default(false).notNull(),
  bestaetigtAm: timestamp("bestaetigt_am"),
  reihenfolge: integer("reihenfolge").default(0),
});

export type Besprechungsprotokoll = typeof besprechungsprotokollTable.$inferSelect;
export type BesprechungTeilnehmer = typeof besprechungTeilnehmerTable.$inferSelect;
