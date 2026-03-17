import { pgTable, serial, integer, text, timestamp, date, boolean, unique } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";
import { usersTable } from "./users";

export const trainingTopicsTable = pgTable("training_topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  responsible: text("responsible"),
  trainingMaterial: text("training_material"),
  sortOrder: integer("sort_order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trainingSessionsTable = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id),
  marketId: integer("market_id").notNull(),
  sessionDate: date("session_date").notNull(),
  trainerId: integer("trainer_id").references(() => usersTable.id),
  trainerName: text("trainer_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trainingSessionTopicsTable = pgTable("training_session_topics", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => trainingSessionsTable.id, { onDelete: "cascade" }),
  topicId: integer("topic_id").notNull().references(() => trainingTopicsTable.id),
  customTitle: text("custom_title"),
  checked: boolean("checked").notNull().default(false),
});

export const trainingAttendancesTable = pgTable("training_attendances", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => trainingSessionsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  initials: text("initials").notNull(),
  confirmedAt: timestamp("confirmed_at").defaultNow().notNull(),
}, (table) => [
  unique("training_attendance_unique").on(table.sessionId, table.userId),
]);
