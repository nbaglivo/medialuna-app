'use server';

import Link from 'next/link';
import IndexPageClient from '@/components/index-page-client';
import { normalizeLinearProject } from '@/lib/task-source';
import { getLinearData } from './actions/linear';

export default async function Index() {
  const linearData = await getLinearData();
  const linearProjects = linearData.projects.map(normalizeLinearProject);

  if (!linearData.connected) {
    return <div className="text-sm text-zinc-500 flex items-center gap-1">
      No project sources are connected. 
      <span>Configure one in {' '}<Link className="underline" href="/settings?integration=linear">settings</Link>
      </span>
    </div>;
  }

  return <IndexPageClient allProjects={linearProjects} />;
}
