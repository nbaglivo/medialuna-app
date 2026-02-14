import { redirect } from 'next/navigation';
import DaySummary from '@/components/day-summary';
import { type WorkLogItem, getOpenDayPlan, getDayPlanProjectsWithSource, getDayPlanWorkLog } from '../actions/day-plan';

export default async function DaySummaryPage() {
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

  return <DaySummary dayPlanId={dayPlanId} workLogItems={workLogItems} focusedProjects={focusedProjects} />;
}
