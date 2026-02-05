'use client';

import { ExternalLinkIcon, GitHubLogoIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { TaskSources, type UnifiedProject } from '@/lib/task-source';

type UnifiedProjectsListProps = {
  projects: UnifiedProject[];
  isLoading: boolean;
  error: string | null;
  selectedProjectIds?: Set<string>;
  onProjectToggle?: (projectId: string) => void;
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
  selectedProjectIds = new Set(),
  onProjectToggle,
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

  const handleProjectToggle = (projectId: string) => {
    if (onProjectToggle) {
      onProjectToggle(projectId);
    }
  };

  return (
    <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {projects.map((project) => {
        const isSelected = selectedProjectIds.has(project.id);

        return (
          <div
            key={project.id}
            role="button"
            tabIndex={0}
            onClick={() => handleProjectToggle(project.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleProjectToggle(project.id);
              }
            }}
            className={`group relative rounded-lg border px-4 py-3 transition-all duration-200 cursor-pointer hover:bg-[#252525] hover:border-[#444] ${isSelected
                ? 'border-purple-500 bg-[#252525] scale-[0.97] hover:border-purple-500'
                : 'border-[#333] bg-[#1e1e1e]'
              }`}
          >

            {/* Source logo badge */}
            <div className="absolute top-3 right-3 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
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

            {project.source !== TaskSources.App && project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open in Linear"
                  title="Open in Linear"
                  className="inline-flex mt-2 items-center gap-1 rounded px-1.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-[#2a2a2a]"
                >
                  <ExternalLinkIcon className="size-3.5" />
                  Open in {project.source}
                </a>
              )}
          </div>
        );
      })}
    </div>
  );
}
