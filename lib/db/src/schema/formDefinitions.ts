import { pgTable, serial, text, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sectionsTable } from "./sections";

export const formDefinitionsTable = pgTable("form_definitions", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull().references(() => sectionsTable.id),
  fieldName: text("field_name").notNull(),
  fieldType: text("field_type").notNull(),
  label: text("label").notNull(),
  required: boolean("required").notNull().default(false),
  validationMin: real("validation_min"),
  validationMax: real("validation_max"),
  warningThreshold: real("warning_threshold"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFormDefinitionSchema = createInsertSchema(formDefinitionsTable).omit({ id: true, createdAt: true });
export type InsertFormDefinition = z.infer<typeof insertFormDefinitionSchema>;
export type FormDefinition = typeof formDefinitionsTable.$inferSelect;
