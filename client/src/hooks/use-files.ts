import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { InsertFile } from "@shared/schema";

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
      // Refresh project to get updated file content in list if needed, 
      // but mostly to ensure consistency
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
