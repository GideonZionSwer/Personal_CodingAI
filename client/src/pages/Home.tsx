import { useProjects } from "@/hooks/use-projects";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { ProjectCard } from "@/components/ProjectCard";
import { Loader2, Zap } from "lucide-react";

export default function Home() {
  const { data: projects, isLoading } = useProjects();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/25">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                CODE GENERATOR
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-lg">
              Generate full-stack React applications with AI. Start building your next big idea in seconds.
            </p>
          </div>
          <CreateProjectDialog />
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            
            {projects?.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-border/50 rounded-2xl bg-secondary/5">
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">Create your first project to get started</p>
                <CreateProjectDialog />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
