'use client';

import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { TaskSources, type UnifiedProject } from '@/lib/task-source';

type UnifiedProjectsListProps = {
  projects: UnifiedProject[];
  isLoading: boolean;
  error: string | null;
};

function SourceLogo({ source }: { source: string }) {
  switch (source) {
    case TaskSources.Linear:
      return (
        <img
          src="https://linear.app/favicon.ico"
          alt="Linear"
          width={16}
          height={16}
          className="rounded-sm"
        />
      );
    case TaskSources.Github:
      return <GitHubLogoIcon className="size-4 text-zinc-400" />;
    case TaskSources.App:
      return (
        <img
          src="/logo-transparent.png"
          alt="Medialuna"
          width={16}
          height={16}
        />
      );
    default:
      return null;
  }
}

export default function UnifiedProjectsList({
  projects,
  isLoading,
  error,
}: UnifiedProjectsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="size-4 border-2 border-t-transparent border-zinc-400 rounded-full animate-spin" />
          <span>Loading projects...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-red-400">{error}</div>
      </div>
    );
  }

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {projects.map((project) => (
        <a
          key={project.id}
          href={project.url}
          target="_blank"
          rel="noreferrer"
          className="group relative block rounded-lg border border-[#333] bg-[#1e1e1e] px-4 py-3 hover:bg-[#252525] hover:border-[#444] transition-all duration-200"
        >
          {/* Source logo badge */}
          <div className="absolute top-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity">
            <SourceLogo source={project.source} />
          </div>

          {/* Project icon and name */}
          <div className="flex items-start gap-2 pr-6">
            {project.icon && (
              <span className="text-lg flex-shrink-0 mt-0.5">{project.icon}</span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-white truncate">
                {project.name}
              </h3>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <p className="mt-2 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {project.state && (
              <span className="capitalize px-2 py-0.5 rounded bg-[#2a2a2a] text-zinc-400">
                {project.state}
              </span>
            )}
            
            {project.progress !== undefined && (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.round(project.progress * 100)}%` }}
                  />
                </div>
                <span className="text-zinc-400 text-xs">
                  {Math.round(project.progress * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Dates */}
          {project.targetDate && (
            <div className="mt-2 text-xs text-zinc-500">
              Due: {new Date(project.targetDate).toLocaleDateString()}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
