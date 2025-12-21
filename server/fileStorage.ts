import * as fs from 'fs';
import * as path from 'path';
import {
  type Project, type InsertProject,
  type File, type InsertFile,
  type FileVersion, type InsertFileVersion,
  type Upload, type InsertUpload,
  type Template, type InsertTemplate,
  type Message, type InsertMessage
} from "@shared/schema";
import { IStorage } from "./storage";

interface DataStore {
  projects: Project[];
  files: File[];
  fileVersions: FileVersion[];
  uploads: Upload[];
  templates: Template[];
  messages: Message[];
  nextIds: {
    projects: number;
    files: number;
    fileVersions: number;
    uploads: number;
    templates: number;
    messages: number;
  };
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

class FileStorage implements IStorage {
  private data: DataStore;
  private initialized: boolean = false;

  constructor() {
    this.data = {
      projects: [],
      files: [],
      fileVersions: [],
      uploads: [],
      templates: [],
      messages: [],
      nextIds: {
        projects: 1,
        files: 1,
        fileVersions: 1,
        uploads: 1,
        templates: 1,
        messages: 1,
      }
    };
  }

  private ensureInitialized() {
    if (this.initialized) return;

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      try {
        const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(fileData);
      } catch (error) {
        console.warn('Failed to load data file, starting with empty data:', error);
      }
    }

    this.initialized = true;
  }

  private saveData() {
    this.ensureInitialized();
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
  }

  // Projects
  async createProject(insertProject: InsertProject): Promise<Project> {
    this.ensureInitialized();
    const project: Project = {
      ...insertProject,
      id: this.data.nextIds.projects++,
      createdAt: new Date(),
    };
    this.data.projects.push(project);
    this.saveData();
    return project;
  }

  async getProjects(): Promise<Project[]> {
    this.ensureInitialized();
    return [...this.data.projects].sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getProject(id: number): Promise<Project | undefined> {
    this.ensureInitialized();
    return this.data.projects.find(p => p.id === id);
  }

  async deleteProject(id: number): Promise<void> {
    this.ensureInitialized();
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.data.files = this.data.files.filter(f => f.projectId !== id);
    this.data.messages = this.data.messages.filter(m => m.projectId !== id);
    this.data.fileVersions = this.data.fileVersions.filter(v => v.projectId !== id);
    this.data.uploads = this.data.uploads.filter(u => u.projectId !== id);
    this.saveData();
  }

  // Files
  async createFile(insertFile: InsertFile & { projectId: number }): Promise<File> {
    this.ensureInitialized();
    const file: File = {
      ...insertFile,
      id: this.data.nextIds.files++,
      createdAt: new Date(),
    };
    this.data.files.push(file);
    this.saveData();
    return file;
  }

  async getFiles(projectId: number): Promise<File[]> {
    this.ensureInitialized();
    return this.data.files
      .filter(f => f.projectId === projectId)
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  async updateFile(id: number, content: string, projectId: number): Promise<File> {
    this.ensureInitialized();
    const fileIndex = this.data.files.findIndex(f => f.id === id);
    if (fileIndex === -1) {
      throw new Error(`File with id ${id} not found`);
    }

    // Create version before updating
    const file = this.data.files[fileIndex];
    const version: FileVersion = {
      id: this.data.nextIds.fileVersions++,
      fileId: id,
      projectId,
      content: file.content,
      timestamp: new Date(),
    };
    this.data.fileVersions.push(version);

    // Update file
    this.data.files[fileIndex].content = content;
    this.saveData();
    return this.data.files[fileIndex];
  }

  async deleteFile(id: number): Promise<void> {
    this.ensureInitialized();
    this.data.files = this.data.files.filter(f => f.id !== id);
    this.data.fileVersions = this.data.fileVersions.filter(v => v.fileId !== id);
    this.saveData();
  }

  // File Versions
  async createFileVersion(version: InsertFileVersion & { fileId: number; projectId: number }): Promise<FileVersion> {
    this.ensureInitialized();
    const fileVersion: FileVersion = {
      ...version,
      id: this.data.nextIds.fileVersions++,
      timestamp: new Date(),
    };
    this.data.fileVersions.push(fileVersion);
    this.saveData();
    return fileVersion;
  }

  async getFileVersions(fileId: number): Promise<FileVersion[]> {
    this.ensureInitialized();
    return this.data.fileVersions
      .filter(v => v.fileId === fileId)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  // Uploads
  async createUpload(upload: InsertUpload & { projectId: number }): Promise<Upload> {
    this.ensureInitialized();
    const uploadRecord: Upload = {
      ...upload,
      id: this.data.nextIds.uploads++,
      uploadedAt: new Date(),
    };
    this.data.uploads.push(uploadRecord);
    this.saveData();
    return uploadRecord;
  }

  async getUploads(projectId: number): Promise<Upload[]> {
    this.ensureInitialized();
    return this.data.uploads
      .filter(u => u.projectId === projectId)
      .sort((a, b) => new Date(b.uploadedAt!).getTime() - new Date(a.uploadedAt!).getTime());
  }

  async deleteUpload(id: number): Promise<void> {
    this.ensureInitialized();
    this.data.uploads = this.data.uploads.filter(u => u.id !== id);
    this.saveData();
  }

  // Templates
  async createTemplate(template: InsertTemplate): Promise<Template> {
    this.ensureInitialized();
    const templateRecord: Template = {
      ...template,
      id: this.data.nextIds.templates++,
      createdAt: new Date(),
    };
    this.data.templates.push(templateRecord);
    this.saveData();
    return templateRecord;
  }

  async getTemplates(): Promise<Template[]> {
    this.ensureInitialized();
    return [...this.data.templates].sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    this.ensureInitialized();
    return this.data.templates.find(t => t.id === id);
  }

  async deleteTemplate(id: number): Promise<void> {
    this.ensureInitialized();
    this.data.templates = this.data.templates.filter(t => t.id !== id);
    this.saveData();
  }

  // Messages
  async createMessage(message: InsertMessage & { projectId: number }): Promise<Message> {
    this.ensureInitialized();
    const messageRecord: Message = {
      ...message,
      id: this.data.nextIds.messages++,
      createdAt: new Date(),
    };
    this.data.messages.push(messageRecord);
    this.saveData();
    return messageRecord;
  }

  async getMessages(projectId: number): Promise<Message[]> {
    this.ensureInitialized();
    return this.data.messages
      .filter(m => m.projectId === projectId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }
}

export const fileStorage = new FileStorage();