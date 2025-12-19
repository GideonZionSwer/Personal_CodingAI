import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

const REPLICATE_API_TOKEN = "";

async function generateCode(prompt: string, currentFiles: any[]) {
  const systemPrompt = `You are an expert full-stack developer.
  You are given a request to build or modify a web application.
  You currently have these files: ${JSON.stringify(currentFiles.map(f => ({ path: f.path, content: f.content })))}
  
  You must output a JSON object with the following structure:
  {
    "message": "A brief explanation of what you did",
    "files": [
      { "path": "filename.ext", "content": "file content..." }
    ]
  }
  
  If you need to modify a file, include the full new content in the 'files' array.
  If you need to create a file, include it in the 'files' array.
  If no code changes are needed, 'files' can be empty.
  Only output valid JSON.`;

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
  // Replicate output for Claude is usually a string or array of strings
  let outputText = result.output;
  if (Array.isArray(outputText)) {
    outputText = outputText.join("");
  }
  
  // Clean up markdown code blocks if present
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
    
    // Create default files for a web project
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
    
    res.json({ ...project, files, messages });
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
    const file = await storage.updateFile(id, content);
    res.json(file);
  });

  app.delete(api.files.delete.path, async (req, res) => {
    await storage.deleteFile(Number(req.params.id));
    res.status(204).send();
  });

  // Chat / AI
  app.post(api.chat.send.path, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const { prompt } = api.chat.send.input.parse(req.body);

    // Save user message
    const userMessage = await storage.createMessage({
      projectId,
      role: "user",
      content: prompt
    });

    // Get current files context
    const currentFiles = await storage.getFiles(projectId);

    try {
      // Call AI
      const aiResponse = await generateCode(prompt, currentFiles);
      
      // Save AI message
      const assistantMessage = await storage.createMessage({
        projectId,
        role: "assistant",
        content: aiResponse.message
      });

      // Update/Create files
      const generatedFiles = [];
      if (aiResponse.files && Array.isArray(aiResponse.files)) {
        for (const fileData of aiResponse.files) {
          const existingFile = currentFiles.find(f => f.path === fileData.path);
          if (existingFile) {
            const updated = await storage.updateFile(existingFile.id, fileData.content);
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
