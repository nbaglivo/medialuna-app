'use server';

import Link from 'next/link';
import IndexPageClient from '@/components/index-page-client';
import { normalizeLinearProject } from '@/lib/task-source';
import { getLinearData } from './actions/linear';
import { getOpenDayPlan } from './actions/day-plan';

export default async function Index() {
  const linearData = await getLinearData();
  const linearProjects = linearData.projects.map(normalizeLinearProject);
  const openDayPlan = await getOpenDayPlan();

  if (!linearData.connected) {
    return <div className="text-sm text-zinc-500 flex items-center gap-1">
      No project sources are connected. 
      <span>Configure one in {' '}<Link className="underline" href="/settings?integration=linear">settings</Link>
      </span>
    </div>;
  }

  const statusOptions = [...new Set(linearProjects.map(p => p.state).filter(Boolean))].sort((a, b) => (a ?? '').localeCompare(b ?? ''));
  return <IndexPageClient allProjects={linearProjects} statusOptions={statusOptions as string[]} openDayPlan={openDayPlan} />;
}
