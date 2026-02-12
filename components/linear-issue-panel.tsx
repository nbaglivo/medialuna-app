import { CircleIcon } from "@radix-ui/react-icons";
import Link from "next/link";

type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  priority?: number | null;
  estimate?: number | null;
  state?: {
    name: string;
  } | null;
  project?: {
    name: string;
  } | null;
};

type LinearTaskPanelProps = {
  issues: LinearIssue[];
  isLoading: boolean;
  error: string | null;
  needsConnection: boolean;
};

export default function LinearTaskPanel({
  issues,
  isLoading,
  error,
  needsConnection
}: LinearTaskPanelProps) {
  return (
    <div className="w-[432px] h-full bg-background border-l border-border flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <img src="https://linear.app/favicon.ico" alt="Linear icon" width={16} height={16} />
        <h2 className="text-lg font-semibold">Linear Tasks</h2>
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
        ) : issues.length === 0 ? (
          <div className="text-muted-foreground">No Linear issues assigned.</div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue) => (
              <a
                key={issue.id}
                href={issue.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-[#333] bg-[#1e1e1e] px-3 py-2 hover:bg-[#252525] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-white">
                    {issue.identifier} · {issue.title}
                  </div>
                  {issue.state?.name && (
                    <span className="text-xs text-zinc-400">{issue.state.name}</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  {issue.project?.name && <span>Project: {issue.project.name}</span>}
                  {issue.estimate != null && <span>Estimate: {issue.estimate}</span>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
