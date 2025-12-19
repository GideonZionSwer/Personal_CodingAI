import { Project } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Code2, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useDeleteProject } from "@/hooks/use-projects";
import { useState } from "react";

export function ProjectCard({ project }: { project: Project }) {
  const deleteProject = useDeleteProject();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteProject.mutate(project.id);
  };

  return (
    <Link href={`/project/${project.id}`} className="block h-full group">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card className="h-full bg-secondary/30 border-border/50 hover:bg-secondary/50 hover:border-primary/50 transition-all duration-300 backdrop-blur-sm overflow-hidden group-hover:shadow-lg group-hover:shadow-primary/5 cursor-pointer relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300" />
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <Code2 className="w-6 h-6" />
              </div>
              {!showConfirm ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleDelete}
                  data-testid="button-delete-project"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                    onClick={confirmDelete}
                    disabled={deleteProject.isPending}
                    data-testid="button-confirm-delete"
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowConfirm(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            <CardTitle className="text-xl font-display group-hover:text-primary transition-colors duration-200">
              {project.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4" />
              <span>
                {project.createdAt 
                  ? format(new Date(project.createdAt), 'MMM d, yyyy') 
                  : 'Just now'}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-1 bg-border/30 rounded-full overflow-hidden mt-4">
              <div className="w-1/3 h-full bg-primary/50 rounded-full group-hover:w-2/3 transition-all duration-500 ease-out" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
