import { pgTable, serial, integer, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { formInstancesTable } from "./formInstances";
import { formDefinitionsTable } from "./formDefinitions";

export const formEntriesTable = pgTable("form_entries", {
  id: serial("id").primaryKey(),
  formInstanceId: integer("form_instance_id").notNull().references(() => formInstancesTable.id),
  formDefinitionId: integer("form_definition_id").notNull().references(() => formDefinitionsTable.id),
  value: text("value"),
  signature: text("signature"),
  pin: text("pin"),
  photoUrl: text("photo_url"),
  entryDate: date("entry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFormEntrySchema = createInsertSchema(formEntriesTable).omit({ id: true, createdAt: true });
export type InsertFormEntry = z.infer<typeof insertFormEntrySchema>;
export type FormEntry = typeof formEntriesTable.$inferSelect;
