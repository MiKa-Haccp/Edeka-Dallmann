import { pgTable, serial, varchar, jsonb, integer, timestamp } from "drizzle-orm/pg-core";

export const planEditorStateTable = pgTable("plan_editor_state", {
  id:        serial("id").primaryKey(),
  planKey:   varchar("plan_key", { length: 100 }).notNull().unique(),
  rects:     jsonb("rects").notNull().default([]),
  nextId:    integer("next_id").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PlanEditorState = typeof planEditorStateTable.$inferSelect;
