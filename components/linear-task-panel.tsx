import { CircleIcon } from "@radix-ui/react-icons";
import Link from "next/link";

type LinearProject = {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  state: string;
  progress: number;
  icon?: string | null;
  color?: string | null;
  targetDate?: string | null;
  startDate?: string | null;
};

type LinearTaskPanelProps = {
  projects: LinearProject[];
  isLoading: boolean;
  error: string | null;
  needsConnection: boolean;
};

export default function LinearTaskPanel({
  projects,
  isLoading,
  error,
  needsConnection
}: LinearTaskPanelProps) {
  return (
    <div className="w-[432px] h-full bg-background border-l border-border flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <img src="https://linear.app/favicon.ico" alt="Linear icon" width={16} height={16} />
        <h2 className="text-lg font-semibold">Linear Projects</h2>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center justify-center h-full">
            <CircleIcon className="size-4 animate-spin" />
          </div>
        ) : needsConnection ? (
          <div className="space-y-2">
            <Link
              href="/settings?integration=linear"
              className="inline-flex items-center rounded-md text-muted-foreground text-sm font-medium px-3 py-2 underline transition-colors"
            >
              Configure Linear Integration
            </Link>
          </div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : projects.length === 0 ? (
          <div className="text-muted-foreground">No Linear projects found.</div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <a
                key={project.id}
                href={project.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-[#333] bg-[#1e1e1e] px-3 py-2 hover:bg-[#252525] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {project.icon && (
                      <span className="text-base">{project.icon}</span>
                    )}
                    <div className="text-sm font-medium text-white">
                      {project.name}
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 capitalize">{project.state}</span>
                </div>
                {project.description && (
                  <div className="mt-1 text-xs text-zinc-500 line-clamp-2">
                    {project.description}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <span>Progress:</span>
                    <span className="text-zinc-400">{Math.round(project.progress * 100)}%</span>
                  </div>
                  {project.targetDate && (
                    <span>Due: {new Date(project.targetDate).toLocaleDateString()}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
