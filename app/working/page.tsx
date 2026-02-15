import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeftIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import WorkLog from '@/components/work-log';
import { UnifiedProject } from '@/lib/task-source';
import {
  getOpenDayPlan,
  getDayPlanProjectsWithSource,
  getDayPlanWorkLog,
  type WorkLogItem,
} from '../actions/day-plan';
import CurrentFocusItem from '@/components/current-focus-item';

export default async function DayWorkPage() {
  // Check if there's an open day plan
  const openDayPlan = await getOpenDayPlan();
  
  // If no open day plan, redirect to start a new one
  if (!openDayPlan) {
    redirect('/');
  }

  const dayPlanId = openDayPlan.id;
  const dayPlanWorkLog = await getDayPlanWorkLog(dayPlanId);
  const workLogItems: WorkLogItem[] = dayPlanWorkLog.map((workLogItem) => ({
    id: workLogItem.id,
    description: workLogItem.description,
    timestamp: workLogItem.timestamp,
    projectId: workLogItem.projectId  ,
    projectSource: workLogItem.projectSource,
    unplannedReason: workLogItem.unplannedReason ?? undefined,
    mentionedIssues: workLogItem.mentionedIssues ?? undefined,
    duration: workLogItem.durationMinutes ?? undefined,
  }));

  const focusedProjects = await getDayPlanProjectsWithSource(dayPlanId);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#141414]">
      {/* Header */}
      <div className="border-b border-[#333] bg-[#212121] px-4 pt-4 pb-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/?mode=projects"
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
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-6 sm:px-6">
        <div className="mx-auto h-full max-w-7xl">
        {focusedProjects.length === 0 ? (
          <NoFocusedProjects />
        ) : (
          <div className="flex h-full flex-col gap-4 md:flex-row">

            <div className="flex min-h-0 flex-[1.5] bg-[#171717] flex-col p-4">
              <h2 className="font-semibold text-zinc-400 mb-2">Currently Focusing On</h2>
              <CurrentFocusItem workLogItem={workLogItems[workLogItems.length - 1]} project={focusedProjects[0]} />
            </div>

            {/* Work Log Section */}
            <div className="flex min-h-0 flex-[1.5] bg-[#171717] flex-col p-4">
              <h2 className="font-semibold text-zinc-400 mb-2">Time invested today</h2>
              <WorkLog
                focusedProjects={focusedProjects}
                workLogItems={workLogItems.slice(0, workLogItems.length - 1)}
                openDayPlanId={dayPlanId}
              />
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

function NoFocusedProjects() {
  return (
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
  );
}

function FocusedProjectsSection({ projects }: { projects: UnifiedProject[] }) {
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
