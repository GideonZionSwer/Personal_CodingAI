import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Load config from config.json
const configPath = path.join(process.cwd(), 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const REPLICATE_API_TOKEN = config.replicate.apiToken;

async function generateCode(prompt: string, currentFiles: any[]) {
  const filesSummary = currentFiles.map(f => ({ 
    path: f.path, 
    lines: f.content.split('\n').length,
    language: f.language 
  }));
  
  const isEmpty = currentFiles.length === 0 || currentFiles.every(f => f.content.trim() === '' || f.content === '// New file');

  const systemPrompt = `You are an expert full-stack developer assistant.
  
CURRENT PROJECT STATE:
- Files: ${JSON.stringify(filesSummary)}
- Is empty: ${isEmpty}
- Total files: ${currentFiles.length}

FULL FILE CONTENTS (for context):
${currentFiles.map(f => `[${f.path}]\n${f.content}`).join('\n\n---\n\n')}

USER REQUEST: "${prompt}"

INSTRUCTIONS:
1. If the project is EMPTY, CREATE a complete starter project with all necessary files
2. If files exist, MODIFY them intelligently based on the request
3. UNDERSTAND CONTEXT: If user says "generate nodejs code with html webview" and project is empty, create:
   - server.js or main.js (Node.js backend)
   - index.html (frontend/webview)
   - package.json (dependencies)
4. Always check if files need to be created first before assuming they exist
5. Create logical file structure (e.g., src/, public/, etc.) when appropriate
6. Include all necessary dependencies and configurations

OUTPUT JSON STRUCTURE:
{
  "message": "Brief explanation of what you built/modified",
  "files": [
    { "path": "filename.ext", "content": "full file content..." }
  ]
}

RULES:
- Include FULL content for all files in the 'files' array
- Create additional files if needed to complete the project
- If modifying existing files, provide complete new content
- Output ONLY valid JSON, no markdown or extra text`;

  const response = await fetch("https://api.replicate.com/v1/models/anthropic/claude-4.5-sonnet/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      "Prefer": "wait"
    },
    body: JSON.stringify({
      input: {
        prompt: prompt,
        system_prompt: systemPrompt,
        max_tokens: 4000
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Replicate API error: ${text}`);
  }

  const result = await response.json();
  let outputText = result.output;
  if (Array.isArray(outputText)) {
    outputText = outputText.join("");
  }
  
  outputText = outputText.replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(outputText);
  } catch (e) {
    console.error("Failed to parse AI response:", outputText);
    return {
      message: "I generated some code but failed to parse it correctly. Here is the raw output: " + outputText,
      files: []
    };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Projects
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.post(api.projects.create.path, async (req, res) => {
    const input = api.projects.create.input.parse(req.body);
    const project = await storage.createProject(input);
    
    // Create default files
    await storage.createFile({
      projectId: project.id,
      path: "index.html",
      content: '<!DOCTYPE html>\n<html>\n<head>\n<title>My App</title>\n</head>\n<body>\n<h1>Hello World</h1>\n</body>\n</html>',
      language: "html"
    });
    
    res.status(201).json(project);
  });

  app.get(api.projects.get.path, async (req, res) => {
    const projectId = Number(req.params.id);
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    const files = await storage.getFiles(projectId);
    const messages = await storage.getMessages(projectId);
    const uploads = await storage.getUploads(projectId);
    
    res.json({ ...project, files, messages, uploads });
  });

  app.delete(api.projects.delete.path, async (req, res) => {
    const projectId = Number(req.params.id);
    await storage.deleteProject(projectId);
    res.status(204).send();
  });

  // Files
  app.post(api.files.create.path, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const input = api.files.create.input.parse(req.body);
    const file = await storage.createFile({ ...input, projectId });
    res.status(201).json(file);
  });

  app.put(api.files.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const { content } = api.files.update.input.parse(req.body);
    
    // Get file to find projectId
    const currentFiles = await storage.getFiles(0); // This won't work, need to fix
    const file = await storage.updateFile(id, content, 0);
    res.json(file);
  });

  app.delete(api.files.delete.path, async (req, res) => {
    await storage.deleteFile(Number(req.params.id));
    res.status(204).send();
  });

  // File Versions
  app.get(api.versions.list.path, async (req, res) => {
    const fileId = Number(req.params.fileId);
    const versions = await storage.getFileVersions(fileId);
    res.json(versions);
  });

  // File Suggestions
  app.get(api.files.suggest.path, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const query = req.params.query;
    const files = await storage.getFiles(projectId);
    const suggested = files.filter(f => f.path.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
    res.json(suggested);
  });

  // Downloads - return JSON that frontend can download
  app.get(api.files.download.path, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const project = await storage.getProject(projectId);
    const files = await storage.getFiles(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Return files as downloadable object
    const downloadData = {
      projectName: project.name,
      files: files.map(f => ({
        path: f.path,
        content: f.content,
        language: f.language
      }))
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${project.name}.json"`);
    res.json(downloadData);
  });

  // Uploads
  app.post(api.uploads.create.path, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const input = api.uploads.create.input.parse(req.body);
    const upload = await storage.createUpload({ ...input, projectId });
    res.status(201).json(upload);
  });

  app.get(api.uploads.list.path, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const uploads = await storage.getUploads(projectId);
    res.json(uploads);
  });

  app.delete(api.uploads.delete.path, async (req, res) => {
    await storage.deleteUpload(Number(req.params.id));
    res.status(204).send();
  });

  // Templates
  app.get(api.templates.list.path, async (req, res) => {
    const templates = await storage.getTemplates();
    res.json(templates);
  });

  app.post(api.templates.create.path, async (req, res) => {
    const input = api.templates.create.input.parse(req.body);
    const template = await storage.createTemplate(input);
    res.status(201).json(template);
  });

  app.delete(api.templates.delete.path, async (req, res) => {
    await storage.deleteTemplate(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.templates.useTemplate.path, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const templateId = Number(req.params.templateId);
    const template = await storage.getTemplate(templateId);

    if (!template) return res.status(404).json({ message: "Template not found" });

    const createdFiles = [];
    const templateFiles = template.files as any[];
    
    for (const fileData of templateFiles) {
      const file = await storage.createFile({
        projectId,
        path: fileData.path,
        content: fileData.content,
        language: fileData.language || fileData.path.split('.').pop() || 'plaintext'
      });
      createdFiles.push(file);
    }

    res.json(createdFiles);
  });

  // Chat / AI
  app.post(api.chat.send.path, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const { prompt } = api.chat.send.input.parse(req.body);

    const userMessage = await storage.createMessage({
      projectId,
      role: "user",
      content: prompt
    });

    const currentFiles = await storage.getFiles(projectId);

    try {
      const aiResponse = await generateCode(prompt, currentFiles);
      
      const assistantMessage = await storage.createMessage({
        projectId,
        role: "assistant",
        content: aiResponse.message
      });

      const generatedFiles = [];
      if (aiResponse.files && Array.isArray(aiResponse.files)) {
        for (const fileData of aiResponse.files) {
          const existingFile = currentFiles.find(f => f.path === fileData.path);
          if (existingFile) {
            const updated = await storage.updateFile(existingFile.id, fileData.content, projectId);
            generatedFiles.push(updated);
          } else {
            const created = await storage.createFile({
              projectId,
              path: fileData.path,
              content: fileData.content,
              language: fileData.path.split('.').pop() || 'plaintext'
            });
            generatedFiles.push(created);
          }
        }
      }

      res.json({
        message: assistantMessage,
        generatedFiles
      });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ message: "Failed to generate code: " + error.message });
    }
  });

  return httpServer;
}
