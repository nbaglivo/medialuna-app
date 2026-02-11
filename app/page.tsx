'use server';

import IndexPageClient from '@/components/index-page-client';
import { normalizeLinearProject } from '@/lib/task-source';
import { getLinearData } from './actions/linear';

export default async function Index() {
  const linearData = await getLinearData();
  const linearProjects = linearData.projects.map(normalizeLinearProject);
  return <IndexPageClient allProjects={linearProjects} />;
}
