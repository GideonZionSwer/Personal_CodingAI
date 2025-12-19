import { pgTable, text, serial, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  template: text("template").default("blank"), // nodejs, typescript, react, python, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  path: text("path").notNull(),
  content: text("content").notNull(),
  language: text("language").default("plaintext"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fileVersions = pgTable("file_versions", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull(),
  projectId: integer("project_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // nodejs, typescript, react, python, etc.
  description: text("description"),
  files: json("files").notNull(), // JSON array of {path, content, language}
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  files: many(files),
  messages: many(messages),
  versions: many(fileVersions),
  uploads: many(uploads),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
  versions: many(fileVersions),
}));

export const fileVersionsRelations = relations(fileVersions, ({ one }) => ({
  file: one(files, {
    fields: [fileVersions.fileId],
    references: [files.id],
  }),
  project: one(projects, {
    fields: [fileVersions.projectId],
    references: [projects.id],
  }),
}));

export const uploadsRelations = relations(uploads, ({ one }) => ({
  project: one(projects, {
    fields: [uploads.projectId],
    references: [projects.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
}));

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true, createdAt: true, projectId: true });
export const insertFileVersionSchema = createInsertSchema(fileVersions).omit({ id: true, timestamp: true, projectId: true });
export const insertUploadSchema = createInsertSchema(uploads).omit({ id: true, uploadedAt: true, projectId: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, projectId: true, createdAt: true });

export type Project = typeof projects.$inferSelect;
export type File = typeof files.$inferSelect;
export type FileVersion = typeof fileVersions.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type InsertFileVersion = z.infer<typeof insertFileVersionSchema>;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
