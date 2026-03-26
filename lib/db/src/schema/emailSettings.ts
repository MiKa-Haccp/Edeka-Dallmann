import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const emailSettingsTable = pgTable("email_settings", {
  id: serial("id").primaryKey(),
  smtpHost: text("smtp_host").notNull().default("smtp.ionos.de"),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpUser: text("smtp_user"),
  smtpPass: text("smtp_pass"),
  fromName: text("from_name").default("EDEKA Dallmann HACCP"),
  defaultRecipient: text("default_recipient").default("qm.suedbayern@edeka.de"),
  enabled: boolean("enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EmailSettings = typeof emailSettingsTable.$inferSelect;
