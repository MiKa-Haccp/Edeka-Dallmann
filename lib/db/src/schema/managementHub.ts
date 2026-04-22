import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const TASK_COLUMNS = ["todo_kai", "todo_michi", "todo_sonja", "wiedervorlage"] as const;
export type TaskColumn = typeof TASK_COLUMNS[number];

export const APPLICANT_STATUSES = [
  "eingang",
  "einladung",
  "gespraech",
  "vertrag",
  "absage",
] as const;
export type ApplicantStatus = typeof APPLICANT_STATUSES[number];

export const managementTasksTable = pgTable("management_tasks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1),
  title: text("title").notNull(),
  description: text("description"),
  column: text("column").notNull().default("todo_kai"),
  priority: text("priority").default("normal"),
  dueDate: text("due_date"),
  createdBy: text("created_by"),
  assignee: text("assignee"),
  sortOrder: integer("sort_order").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ManagementTask = typeof managementTasksTable.$inferSelect;
export type ManagementTaskInsert = typeof managementTasksTable.$inferInsert;

export const managementTaskCommentsTable = pgTable("management_task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ManagementTaskComment = typeof managementTaskCommentsTable.$inferSelect;

export const applicantsTable = pgTable("applicants", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  source: text("source"),
  experienceKasse: boolean("experience_kasse").default(false),
  experienceLaden: boolean("experience_laden").default(false),
  experienceObst: boolean("experience_obst").default(false),
  experienceMopro: boolean("experience_mopro").default(false),
  experienceMetzgerei: boolean("experience_metzgerei").default(false),
  flexibility: text("flexibility"),
  hoursWish: text("hours_wish"),
  entryDate: text("entry_date"),
  salaryWish: text("salary_wish"),
  status: text("status").notNull().default("eingang"),
  notes: text("notes"),
  photoBase64: text("photo_base64"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Applicant = typeof applicantsTable.$inferSelect;
export type ApplicantInsert = typeof applicantsTable.$inferInsert;

export const applicantCommentsTable = pgTable("applicant_comments", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").notNull(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApplicantComment = typeof applicantCommentsTable.$inferSelect;
