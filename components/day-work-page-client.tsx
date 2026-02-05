'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import UnifiedProjectsList from '@/components/unified-projects-list';
import WorkLog from '@/components/work-log';
import { 
  type UnifiedProject, 
  type LinearProject,
  normalizeLinearProject 
} from '@/lib/task-source';
import { getDayWorkSession, WorkLogItem } from '@/lib/focus-storage';

export default function DayWorkPageClient() {
  const router = useRouter();
  const [focusedProjects, setFocusedProjects] = useState<UnifiedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workLog, setWorkLog] = useState<WorkLogItem[] | []>([]);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadFocusedProjects() {
      setIsLoading(true);
      setError(null);

      // Get focus session
      const session = getDayWorkSession();
      
      if (!session || session.projectIds.length === 0) {
        // No focus session or expired, redirect to main page
        router.push('/');
        return;
      }

      // Fetch all projects
      const projectsFromAllSources: UnifiedProject[] = [];

      // Fetch Linear projects
      try {
        const linearResponse = await fetch('/api/linear/projects', {
          signal: abortController.signal
        });

        if (linearResponse.ok) {
          const linearPayload = await linearResponse.json();
          const linearProjects: LinearProject[] = linearPayload.projects ?? [];
          const normalizedLinear = linearProjects.map(normalizeLinearProject);
          projectsFromAllSources.push(...normalizedLinear);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.warn('Error loading Linear projects:', error);
        }
      }

      // TODO: Add GitHub projects fetch when API is ready
      // TODO: Add App projects fetch when API is ready

      // Filter to only focused projects
      const focused = projectsFromAllSources.filter(project => 
        session.projectIds.includes(project.id)
      );

      if (!abortController.signal.aborted) {
        setFocusedProjects(focused);
        setIsLoading(false);
      }
    }

    loadFocusedProjects();

    return () => {
      abortController.abort();
    };
  }, [router]);

  return (
    <div className="flex flex-col bg-[#141414] h-full w-full">
      {/* Header */}
      <div className="border-b border-[#333] px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="p-2 rounded-full hover:bg-[#252525] transition-colors"
                  title="Back to all projects"
                >
                  <ArrowLeftIcon className="text-zinc-400 size-4" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-white">Today's work</h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => router.push('/day-summary')}>
                Close the Day
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="size-4 border-2 border-t-transparent border-zinc-400 rounded-full animate-spin" />
                <span>Loading your focus...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-sm text-red-400">{error}</div>
            </div>
          ) : focusedProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground">No focused projects found.</p>
              <p className="text-sm text-zinc-500 mt-2">
                The projects you selected may no longer be available.
              </p>
              <Link
                href="/"
                className="mt-4 px-4 py-2 rounded-md bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                Select New Projects
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Focused Projects Section */}
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white">Focus Projects</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    {focusedProjects.length > 1 ? 'Projects you\'re focusing on today' : 'Project you\'re focusing on today'}
                  </p>
                </div>
                <UnifiedProjectsList
                  projects={focusedProjects}
                  isLoading={false}
                  error={null}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-[#333]" />

              {/* Work Log Section */}
              <div className="flex w-full gap-4 mb-4">
                <div className="flex-1">
                  <WorkLog focusedProjects={focusedProjects} onWorkLogChange={setWorkLog} />
                </div>
                <div className="flex-1 border-l border-[#333] pl-4">
                  <WorkLogSummary workLog={workLog} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkLogSummary({ workLog }: { workLog: WorkLogItem[] }) {
  const workLogSummary = getWorkLogSummary(workLog);
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-white">Summary of your day so far</h3>

      <div className="flex flex-col gap-2 mt-4">
        <div className="text-sm text-zinc-400">Time invested today: {workLogSummary.timeInvested} minutes</div>
      </div>
    </div>
  );
}

type WorkLogSummary = {
  timeInvested: number; // in minutes
};

function getWorkLogSummary(workLog: WorkLogItem[]): WorkLogSummary {
  return {
    timeInvested: workLog.reduce((acc, item) => acc + (item.duration ?? 0), 0),
  };
}

function Button({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded-lg text-white font-medium cursor-pointer transition-colors hover:bg-[#252525]"
    >
      {children}
    </button>
  );
}
