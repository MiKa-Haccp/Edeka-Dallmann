import { pgTable, serial, text, integer, timestamp, date, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";

export const USER_ROLES = ["SUPERADMIN", "ADMIN", "BEREICHSLEITUNG", "MARKTLEITER", "USER"] as const;
export type UserRole = typeof USER_ROLES[number];

export const USER_STATUSES = ["onboarding", "aktiv", "inaktiv"] as const;
export type UserStatus = typeof USER_STATUSES[number];

export const USER_GRUPPEN = ["gesamter_markt", "markt", "metzgerei"] as const;
export type UserGruppe = typeof USER_GRUPPEN[number];

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  password: text("password"),
  birthDate: date("birth_date"),
  role: text("role").notNull().default("USER"),
  status: text("status").notNull().default("aktiv"),
  gruppe: text("gruppe"),
  initials: text("initials"),
  pin: text("pin"),
  phone: text("phone"),
  isRegistered: boolean("is_registered").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("users_tenant_pin_unique").on(table.tenantId, table.pin),
]);

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
