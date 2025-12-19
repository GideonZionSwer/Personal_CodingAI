import { useParams } from "wouter";
import { useProject } from "@/hooks/use-projects";
import { useCreateFile, useUpdateFile, useDeleteFile, useDownloadProject, useFileVersions, useSuggestFiles, useTemplates, useUseTemplate, useUploadFile } from "@/hooks/use-files";
import { FileTree } from "@/components/FileTree";
import { CodeEditor } from "@/components/CodeEditor";
import { Preview } from "@/components/Preview";
import { ChatInterface } from "@/components/ChatInterface";
import { Terminal } from "@/components/Terminal";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Layout, MessageSquare, Save, Download, Plus, Package, History, Upload, Terminal as TerminalIcon } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { File } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectView() {
  const { id } = useParams();
  const projectId = Number(id);
  const { data: project, isLoading, error } = useProject(projectId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [code, setCode] = useState<string>("");
  const updateFile = useUpdateFile();
  const createFile = useCreateFile(projectId);
  const deleteFile = useDeleteFile();
  const downloadProject = useDownloadProject(projectId);
  const templates = useTemplates();
  const useTemplate = useUseTemplate(projectId);
  const uploadFile = useUploadFile(projectId);
  const { toast } = useToast();
  
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showVersions, setShowVersions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedFileVersions, setSelectedFileVersions] = useState<any[]>([]);
  const [terminalOpen, setTerminalOpen] = useState(false);
  
  const fileVersions = useFileVersions(selectedFile?.id ?? 0);

  useEffect(() => {
    if (selectedFile) {
      fileVersions.refetch();
    }
  }, [selectedFile?.id]);

  useEffect(() => {
    if (project?.files.length && !selectedFile) {
      const main = project.files.find(f => ['index.tsx', 'App.tsx', 'main.tsx', 'index.html'].some(n => f.path.endsWith(n)));
      const fileToSelect = main || project.files[0];
      setSelectedFile(fileToSelect);
      setCode(fileToSelect.content);
    }
  }, [project?.files]);

  useEffect(() => {
    if (selectedFile) {
      const freshFile = project?.files.find(f => f.id === selectedFile.id);
      if (freshFile && freshFile.content !== code) {
        setCode(freshFile.content);
        setSelectedFile(freshFile);
      }
    }
  }, [project?.files, selectedFile?.id]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCode(file.content);
  };

  const handleSave = () => {
    if (!selectedFile) return;
    updateFile.mutate({ 
      id: selectedFile.id, 
      content: code,
      projectId 
    }, {
      onSuccess: () => {
        toast({ title: "Saved successfully" });
      }
    });
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    createFile.mutate({
      path: newFileName,
      content: "// New file",
      language: newFileName.split('.').pop() || 'plaintext'
    }, {
      onSuccess: () => {
        setIsNewFileOpen(false);
        setNewFileName("");
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile.mutate(file);
    }
  };

  const handleUseTemplate = (templateId: number) => {
    useTemplate.mutate(templateId, {
      onSuccess: () => {
        setShowTemplates(false);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border/50 flex items-center px-4 justify-between bg-secondary/20">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{project.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">IDE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedFile && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleSave}
              disabled={updateFile.isPending || code === selectedFile.content}
              className="h-8 gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
              {code !== selectedFile.content && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Button>
          )}
          
          <div className="h-4 w-px bg-border/50 mx-2" />
          
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => downloadProject.mutate()}
            disabled={downloadProject.isPending}
            className="h-8 gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>

          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowTemplates(true)}
            className="h-8 gap-2"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </Button>

          {selectedFile && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setShowVersions(true)}
              className="h-8 gap-2"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </Button>
          )}

          <label>
            <Button 
              size="sm" 
              variant="ghost"
              className="h-8 gap-2"
              asChild
            >
              <span>
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </span>
            </Button>
            <input 
              type="file" 
              hidden 
              onChange={handleFileUpload}
              accept="*/*"
            />
          </label>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          
          {/* Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden md:block">
            <FileTree 
              files={project.files} 
              selectedFileId={selectedFile?.id ?? null} 
              onSelectFile={handleFileSelect}
              projectId={projectId}
              onNewFile={() => setIsNewFileOpen(true)}
            />
          </ResizablePanel>
          
          <ResizableHandle className="bg-border/50 w-[1px]" />
          
          {/* Editor Area */}
          <ResizablePanel defaultSize={45}>
            {selectedFile ? (
              <div className="h-full flex flex-col">
                <div className="h-9 border-b border-border/50 flex items-center px-4 bg-secondary/10">
                  <span className="text-xs font-mono text-muted-foreground">{selectedFile.path}</span>
                </div>
                <div className="flex-1 relative">
                  <CodeEditor 
                    code={code} 
                    language={selectedFile.path} 
                    onChange={(val) => setCode(val || "")} 
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Code2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Select a file to edit</p>
                </div>
              </div>
            )}
          </ResizablePanel>
          
          <ResizableHandle className="bg-border/50 w-[1px]" />
          
          {/* Right Panel: Chat */}
          <ResizablePanel defaultSize={35}>
            <ChatInterface projectId={projectId} messages={project.messages} files={project.files} />
          </ResizablePanel>
          
        </ResizablePanelGroup>
      </div>

      {/* New File Dialog */}
      <Dialog open={isNewFileOpen} onOpenChange={setIsNewFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFile} className="space-y-4">
            <Input 
              placeholder="e.g. src/components/Header.tsx" 
              value={newFileName} 
              onChange={e => setNewFileName(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button type="submit" disabled={!newFileName.trim() || createFile.isPending}>
                Create File
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Templates</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {templates.data?.map(template => (
              <Button
                key={template.id}
                variant="outline"
                onClick={() => handleUseTemplate(template.id)}
                disabled={useTemplate.isPending}
                className="justify-start flex-col items-start h-auto p-3"
              >
                <span className="font-semibold">{template.type}</span>
                <span className="text-xs text-muted-foreground">{template.description}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="max-w-2xl max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Version History - {selectedFile?.path}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto">
            {fileVersions.data?.map((version, idx) => (
              <div 
                key={version.id} 
                className="p-3 border rounded-lg text-xs font-mono bg-secondary/20"
              >
                <div className="text-muted-foreground mb-2">
                  Version {fileVersions.data!.length - idx} • {new Date(version.timestamp!).toLocaleString()}
                </div>
                <pre className="overflow-x-auto text-[11px] max-h-24 line-clamp-6">
                  {version.content}
                </pre>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Terminal */}
      <Terminal isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />
    </div>
  );
}

function Code2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </svg>
  );
}
