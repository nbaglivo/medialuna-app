'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import UnifiedProjectsList from '@/components/unified-projects-list';
import WorkLog from '@/components/work-log';
import { 
  TaskSources,
  type TaskSource,
  type UnifiedProject, 
  type LinearProject,
  normalizeLinearProject 
} from '@/lib/task-source';
import { getDayPlanSession, WorkLogItem } from '@/lib/focus-storage';
import { type DayPlanProjectRecord, getDayPlanProjects, getDayPlanWorkLog } from '@/app/actions/day-plan';

export default function DayWorkPageClient() {
  const router = useRouter();
  const [focusedProjects, setFocusedProjects] = useState<UnifiedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workLog, setWorkLog] = useState<WorkLogItem[] | []>([]);
  const [initialWorkLog, setInitialWorkLog] = useState<WorkLogItem[] | []>([]);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadFocusedProjects() {
      setIsLoading(true);
      setError(null);

      const session = getDayPlanSession();
      if (!session) {
        router.replace('/');
        return;
      }

      let dayPlanProjects: DayPlanProjectRecord[] = [];
      try {
        dayPlanProjects = await getDayPlanProjects(session.dayPlanId);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.warn('Error loading day plan projects:', error);
        }
      }

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

      const focused = dayPlanProjects.map(project => {
        const match = projectsFromAllSources.find(sourceProject => sourceProject.id === project.projectId);
        if (match) return match;

        return {
          id: project.projectId,
          name: project.projectName ?? 'Unknown Project',
          url: '',
          source: (project.projectSource ? project.projectSource as TaskSource : TaskSources.App),
        };
      });

      let workLogItems: WorkLogItem[] = [];
      try {
        const dayPlanWorkLog = await getDayPlanWorkLog(session.dayPlanId);
        workLogItems = dayPlanWorkLog.map(item => ({
          id: item.id,
          description: item.description,
          timestamp: item.timestamp,
          projectId: item.projectId,
          unplannedReason: item.unplannedReason ?? undefined,
          mentionedIssues: item.mentionedIssues ?? undefined,
          duration: item.durationMinutes ?? undefined,
        }));
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.warn('Error loading work log:', error);
        }
      }

      if (!abortController.signal.aborted) {
        setFocusedProjects(focused);
        setInitialWorkLog(workLogItems);
        setWorkLog(workLogItems);
        setIsLoading(false);
      }
    }

    loadFocusedProjects();

    return () => {
      abortController.abort();
    };
  }, [router]);

  return (
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
            <div className="space-y-8 flex flex-col md:flex-row gap-4">

              {/* Work Log Section */}
              <div className="flex-[1.5]">
                <WorkLog
                  focusedProjects={focusedProjects}
                  initialItems={initialWorkLog}
                  onWorkLogChange={setWorkLog}
                />
              </div>

              <div className="flex-1 ">
                {/* Focused Projects Section */}
                <FocusedProjects projects={focusedProjects} />
                <WorkLogSummary workLog={workLog} />
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

function FocusedProjects({ projects }: { projects: UnifiedProject[] }) {
  return (
    <div>
    <div className="mb-4">
      <p className="text-sm text-zinc-400 mt-1">
        {projects.length > 1 ? 'Projects you\'re focusing on today' : 'Project you\'re focusing on today'}
      </p>
    </div>
    <div className="flex flex-col gap-2">
      {projects.map(project => (
        <div key={project.id} className="flex flex-row items-center justify-between gap-2 bg-[#1A1A1A] p-2 rounded-md">
          <h3 className="text-md font-semibold text-white">{project.name}</h3>
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 p-1 rounded-sm hover:bg-zinc-800 transition-colors flex items-center gap-1">
            <ExternalLinkIcon className="size-4" />
          </a>
        </div>
      ))}
    </div>
  </div>
  );
}

function WorkLogSummary({ workLog }: { workLog: WorkLogItem[] }) {
  const workLogSummary = getWorkLogSummary(workLog);
  return (
    <div className="mt-4">
      <div className="flex flex-col gap-2 mt-4">
        <div className="text-sm text-zinc-400">Today you've invested {workLogSummary.timeInvestedInProjects} minutes in these projects and {workLogSummary.timeInvestedInOther} minutes in unplanned activities</div>
      </div>
    </div>
  );
}

type WorkLogSummary = {
  timeInvested: number; // in minutes
  timeInvestedInProjects: number; // in minutes
  timeInvestedInOther: number; // in minutes
};

function getWorkLogSummary(workLog: WorkLogItem[]): WorkLogSummary {
  return {
    timeInvested: workLog.reduce((acc, item) => acc + (item.duration ?? 0), 0),
    timeInvestedInProjects: workLog.reduce((acc, item) => item.projectId ? acc + (item.duration ?? 0) : acc, 0),
    timeInvestedInOther: workLog.reduce((acc, item) => !item.projectId ? acc + (item.duration ?? 0) : acc, 0),
  };
}
