import Link from 'next/link';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import DayWorkPageClient from '@/components/day-work-page-client';
import { type WorkLogItem } from '@/app/actions/day-plan';
import { getDayPlanId, getDayPlanProjectsWithSource, getDayPlanWorkLog } from '../actions/day-plan';

export default async function DayWorkPage() {
  const dayPlanId = await getDayPlanId();
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
      <DayWorkPageClient workLogItems={workLogItems} focusedProjects={focusedProjects} />
    </div>
  )
}
