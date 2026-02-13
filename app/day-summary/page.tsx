import DaySummary from '@/components/day-summary';
import { type WorkLogItem, getDayPlanId, getDayPlanProjectsWithSource, getDayPlanWorkLog } from '../actions/day-plan';

export default async function DaySummaryPage() {
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

  return <DaySummary dayPlanId={dayPlanId} workLogItems={workLogItems} focusedProjects={focusedProjects} />;
}
