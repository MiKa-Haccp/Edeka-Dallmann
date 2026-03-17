import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const adminInvitationsTable = pgTable("admin_invitations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type AdminInvitation = typeof adminInvitationsTable.$inferSelect;
