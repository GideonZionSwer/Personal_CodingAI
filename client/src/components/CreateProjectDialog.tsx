import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateProject } from "@/hooks/use-projects";
import { Plus, Loader2 } from "lucide-react";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createProject = useCreateProject();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    createProject.mutate({ name }, {
      onSuccess: () => {
        setOpen(false);
        setName("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/40 font-semibold gap-2">
          <Plus className="w-5 h-5" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Create Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="e.g. Portfolio Website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50 border-border focus:ring-primary/20 font-medium text-lg h-12"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold"
              disabled={createProject.isPending || !name.trim()}
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
