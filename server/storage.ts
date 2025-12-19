import { db } from "./db";
import {
  projects, files, messages,
  type Project, type InsertProject,
  type File, type InsertFile,
  type Message, type InsertMessage
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;

  // Files
  createFile(file: InsertFile): Promise<File>;
  getFiles(projectId: number): Promise<File[]>;
  updateFile(id: number, content: string): Promise<File>;
  deleteFile(id: number): Promise<void>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(projectId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  // Files
  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(insertFile).returning();
    return file;
  }

  async getFiles(projectId: number): Promise<File[]> {
    return await db.select().from(files).where(eq(files.projectId, projectId));
  }

  async updateFile(id: number, content: string): Promise<File> {
    const [file] = await db.update(files)
      .set({ content })
      .where(eq(files.id, id))
      .returning();
    return file;
  }

  async deleteFile(id: number): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  // Messages
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getMessages(projectId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(messages.createdAt);
  }
}

export const storage = new DatabaseStorage();
