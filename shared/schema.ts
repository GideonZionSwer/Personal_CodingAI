import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  path: text("path").notNull(),
  content: text("content").notNull(),
  language: text("language").default("plaintext"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  files: many(files),
  messages: many(messages),
}));

export const filesRelations = relations(files, ({ one }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
}));

export const insertProjectSchema = createInsertSchema(projects);
export const insertFileSchema = createInsertSchema(files);
export const insertMessageSchema = createInsertSchema(messages);

export type Project = typeof projects.$inferSelect;
export type File = typeof files.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
