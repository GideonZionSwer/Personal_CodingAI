import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { InsertFile, File, FileVersion, Template } from "@shared/schema";

export function useCreateFile(projectId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<InsertFile, "id" | "projectId">) => {
      const url = buildUrl(api.files.create.path, { projectId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error("Failed to create file");
      return api.files.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, projectId] });
      toast({ title: "File created" });
    },
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, content, projectId }: { id: number; content: string; projectId: number }) => {
      const url = buildUrl(api.files.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (!res.ok) throw new Error("Failed to update file");
      return api.files.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, variables.projectId] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: number; projectId: number }) => {
      const url = buildUrl(api.files.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete file");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, variables.projectId] });
      toast({ title: "File deleted" });
    },
  });
}

export function useFileVersions(fileId: number) {
  return useQuery({
    queryKey: [api.versions.list.path, fileId],
    queryFn: async () => {
      const url = buildUrl(api.versions.list.path, { fileId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch versions");
      return res.json() as Promise<FileVersion[]>;
    },
  });
}

export function useSuggestFiles(projectId: number, query: string) {
  return useQuery({
    queryKey: [api.files.suggest.path, projectId, query],
    queryFn: async () => {
      if (!query) return [];
      const url = buildUrl(api.files.suggest.path, { projectId, query });
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json() as Promise<File[]>;
    },
    enabled: !!query && query.length > 0,
  });
}

export function useDownloadProject(projectId: number) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const url = buildUrl(api.files.download.path, { projectId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to download project");
      return res;
    },
    onSuccess: async (res) => {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Project downloaded" });
    },
    onError: () => {
      toast({ title: "Failed to download project", variant: "destructive" });
    },
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: [api.templates.list.path],
    queryFn: async () => {
      const res = await fetch(api.templates.list.path);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json() as Promise<Template[]>;
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.templates.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.templates.list.path] });
      toast({ title: "Template created" });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (templateId: number) => {
      const url = buildUrl(api.templates.delete.path, { id: templateId });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.templates.list.path] });
      toast({ title: "Template deleted" });
    },
  });
}

export function useUseTemplate(projectId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (templateId: number) => {
      const url = buildUrl(api.templates.useTemplate.path, { projectId, templateId });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed to use template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, projectId] });
      toast({ title: "Template files created" });
    },
  });
}

export function useUploadFile(projectId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('fileType', file.type);
      formData.append('fileSize', file.size.toString());
      formData.append('filePath', file.name);

      const url = buildUrl(api.uploads.create.path, { projectId });
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload file");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, projectId] });
      toast({ title: "File uploaded" });
    },
    onError: () => {
      toast({ title: "Upload failed", variant: "destructive" });
    },
  });
}
