import { File } from "@shared/schema";
import { cn } from "@/lib/utils";
import { FileCode, FileJson, FileType, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeleteFile } from "@/hooks/use-files";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FileTreeProps {
  files: File[];
  selectedFileId: number | null;
  onSelectFile: (file: File) => void;
  projectId: number;
  onNewFile: () => void;
}

const getFileIcon = (filename: string) => {
  if (filename.endsWith('.json')) return <FileJson className="w-4 h-4 text-yellow-500" />;
  if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return <FileCode className="w-4 h-4 text-blue-500" />;
  if (filename.endsWith('.css')) return <FileCode className="w-4 h-4 text-pink-500" />;
  if (filename.endsWith('.html')) return <FileCode className="w-4 h-4 text-orange-500" />;
  return <FileType className="w-4 h-4 text-muted-foreground" />;
};

export function FileTree({ files, selectedFileId, onSelectFile, projectId, onNewFile }: FileTreeProps) {
  const deleteFile = useDeleteFile();

  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  return (
    <div className="flex flex-col h-full bg-secondary/20 border-r border-border/50">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Explorer</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onNewFile}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {sortedFiles.map((file) => (
            <div
              key={file.id}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all duration-200 text-sm font-medium",
                selectedFileId === file.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
              onClick={() => onSelectFile(file)}
            >
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(file.path)}
                <span className="truncate font-mono text-[13px]">{file.path}</span>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete file?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete <span className="font-mono text-foreground">{file.path}</span>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile.mutate({ id: file.id, projectId });
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {files.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No files yet. Start chatting or create one manually.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
