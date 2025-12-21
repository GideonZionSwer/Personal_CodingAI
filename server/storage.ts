import {
  projects, files, messages, fileVersions, uploads, templates,
  type Project, type InsertProject,
  type File, type InsertFile,
  type FileVersion, type InsertFileVersion,
  type Upload, type InsertUpload,
  type Template, type InsertTemplate,
  type Message, type InsertMessage
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { fileStorage } from "./fileStorage";

export interface IStorage {
  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  // Files
  createFile(file: InsertFile & { projectId: number }): Promise<File>;
  getFiles(projectId: number): Promise<File[]>;
  updateFile(id: number, content: string, projectId: number): Promise<File>;
  deleteFile(id: number): Promise<void>;

  // File Versions
  createFileVersion(version: InsertFileVersion & { fileId: number; projectId: number }): Promise<FileVersion>;
  getFileVersions(fileId: number): Promise<FileVersion[]>;

  // Uploads
  createUpload(upload: InsertUpload & { projectId: number }): Promise<Upload>;
  getUploads(projectId: number): Promise<Upload[]>;
  deleteUpload(id: number): Promise<void>;

  // Templates
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<void>;

  // Messages
  createMessage(message: InsertMessage & { projectId: number }): Promise<Message>;
  getMessages(projectId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  private db: any = null;

  private async getDb() {
    if (!this.db) {
      const { db } = await import("./db");
      this.db = db;
    }
    return this.db;
  }

  // Projects
  async createProject(insertProject: InsertProject): Promise<Project> {
    const db = await this.getDb();
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async getProjects(): Promise<Project[]> {
    const db = await this.getDb();
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const db = await this.getDb();
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    const db = await this.getDb();
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Files
  async createFile(insertFile: InsertFile & { projectId: number }): Promise<File> {
    const db = await this.getDb();
    const [file] = await db.insert(files).values(insertFile).returning();
    return file;
  }

  async getFiles(projectId: number): Promise<File[]> {
    const db = await this.getDb();
    return await db.select().from(files).where(eq(files.projectId, projectId)).orderBy(files.path);
  }

  async updateFile(id: number, content: string, projectId: number): Promise<File> {
    const db = await this.getDb();
    // Create version before updating
    const [file] = await db.select().from(files).where(eq(files.id, id));
    if (file) {
      await db.insert(fileVersions).values({
        fileId: id,
        projectId,
        content: file.content,
      });
    }

    const [updated] = await db.update(files)
      .set({ content })
      .where(eq(files.id, id))
      .returning();
    return updated;
  }

  async deleteFile(id: number): Promise<void> {
    const db = await this.getDb();
    await db.delete(files).where(eq(files.id, id));
  }

  // File Versions
  async createFileVersion(version: InsertFileVersion & { fileId: number; projectId: number }): Promise<FileVersion> {
    const db = await this.getDb();
    const [created] = await db.insert(fileVersions).values(version).returning();
    return created;
  }

  async getFileVersions(fileId: number): Promise<FileVersion[]> {
    const db = await this.getDb();
    return await db.select().from(fileVersions).where(eq(fileVersions.fileId, fileId)).orderBy(desc(fileVersions.timestamp));
  }

  // Uploads
  async createUpload(upload: InsertUpload & { projectId: number }): Promise<Upload> {
    const db = await this.getDb();
    const [created] = await db.insert(uploads).values(upload).returning();
    return created;
  }

  async getUploads(projectId: number): Promise<Upload[]> {
    const db = await this.getDb();
    return await db.select().from(uploads).where(eq(uploads.projectId, projectId)).orderBy(desc(uploads.uploadedAt));
  }

  async deleteUpload(id: number): Promise<void> {
    const db = await this.getDb();
    await db.delete(uploads).where(eq(uploads.id, id));
  }

  // Templates
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const db = await this.getDb();
    const [created] = await db.insert(templates).values(template).returning();
    return created;
  }

  async getTemplates(): Promise<Template[]> {
    const db = await this.getDb();
    return await db.select().from(templates).orderBy(desc(templates.createdAt));
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const db = await this.getDb();
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async deleteTemplate(id: number): Promise<void> {
    const db = await this.getDb();
    await db.delete(templates).where(eq(templates.id, id));
  }

  // Messages
  async createMessage(message: InsertMessage & { projectId: number }): Promise<Message> {
    const db = await this.getDb();
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async getMessages(projectId: number): Promise<Message[]> {
    const db = await this.getDb();
    return await db.select().from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(messages.createdAt);
  }
}

// Use file storage if DATABASE_URL is not set, otherwise use database storage
export const storage: IStorage = process.env.DATABASE_URL ? new DatabaseStorage() : fileStorage;
