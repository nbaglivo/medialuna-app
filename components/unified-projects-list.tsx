'use client';

import { type UnifiedProject } from '@/lib/task-source';
import ProjectCard from './project-card';

type UnifiedProjectsListProps = {
  projects: UnifiedProject[];
  selectedProjectIds?: Set<string>;
  onProjectToggle?: (projectId: string) => void;
};

export default function UnifiedProjectsList({
  projects,
  selectedProjectIds = new Set(),
  onProjectToggle,
}: UnifiedProjectsListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground">No projects found.</p>
        <p className="text-sm text-zinc-500 mt-2">
          Connect your integrations in settings to see your projects here.
        </p>
      </div>
    );
  }

  const handleProjectToggle = (projectId: string) => {
    if (onProjectToggle) {
      onProjectToggle(projectId);
    }
  };

  return (
    <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {projects.map((project) => 
          (
            <ProjectCard
              key={project.id}
              project={project}
              isSelected={selectedProjectIds.has(project.id)}
              onProjectToggle={handleProjectToggle}
          />
        ))}
    </div>
  );
}
