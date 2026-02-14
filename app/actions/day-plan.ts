'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeLinearProject, TaskSource, TaskSources, UnifiedProject } from '@/lib/task-source';
import { revalidatePath } from 'next/cache';
import { getLinearData } from './linear';

export type DayPlanProjectInput = {
  projectId: string;
  projectSource: string;
  projectName?: string | null;
};

export type WorkLogItem = {
  id: string;
  description: string;
  timestamp: number;
  projectId: string | null; // null for unplanned work
  unplannedReason?: string;
  mentionedIssues?: Record<string, string>; // Map of issue identifier or project name to URL
  duration?: number; // Duration in minutes
};

export type WorkLogItemInput = {
  id: string;
  description: string;
  timestamp: number;
  projectId: string | null;
  projectSource?: string | null;
  unplannedReason?: string | null;
  mentionedIssues?: Record<string, string> | null;
  durationMinutes?: number | null;
};

export type DayPlanProjectRecord = {
  projectId: string;
  projectSource: string;
  projectName: string | null;
};

export type DayPlanWorkLogRecord = {
  id: string;
  description: string;
  timestamp: number;
  projectId: string | null;
  projectSource: string | null;
  unplannedReason: string | null;
  mentionedIssues: Record<string, string> | null;
  durationMinutes: number | null;
};

type StartDayPlanInput = {
  planDate: string;
  timezone?: string | null;
  projects: DayPlanProjectInput[];
};

export async function getDayPlanProjectsWithSource(dayPlanId: string): Promise<any> {
  const dayPlanProjects: DayPlanProjectRecord[] = await getDayPlanProjects(dayPlanId);
  
  const projectsFromAllSources: UnifiedProject[] = [];

  // Fetch Linear projects
  const linearData = await getLinearData();

  const normalizedLinear = linearData.projects.map(normalizeLinearProject);
  projectsFromAllSources.push(...normalizedLinear);

  // TODO: Add GitHub projects fetch when API is ready
  // TODO: Add App projects fetch when API is ready

  return dayPlanProjects.map(project => {
    const match = projectsFromAllSources.find(sourceProject => sourceProject.id === project.projectId);
    if (match) return match;

    return {
      id: project.projectId,
      name: project.projectName ?? 'Unknown Project',
      url: '',
      source: (project.projectSource ? project.projectSource as TaskSource : TaskSources.App),
    };
  });
}

export type OpenDayPlan = {
  id: string;
  planDate: string;
  createdAt: string;
};

/**
 * Gets the currently open day plan (is_open = true)
 * Returns null if no open day plan exists
 */
export async function getOpenDayPlan(): Promise<OpenDayPlan | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('day_plans')
    .select('id, plan_date, created_at')
    .eq('is_open', true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    planDate: data.plan_date,
    createdAt: data.created_at,
  };
}

/**
 * Closes the specified day plan by setting is_open = false
 */
export async function closeDayPlan(dayPlanId: string): Promise<{ ok: boolean }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('day_plans')
    .update({ is_open: false })
    .eq('id', dayPlanId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/day-work');
  revalidatePath('/day-summary');

  return { ok: true };
}

export async function getDayPlanId(): Promise<string> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('day_plans')
    .select('id')
    .order('plan_date', { ascending: false })
    .limit(1)
    .maybeSingle();  // Returns null instead of error when 0 rows

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('No day plan found');
  }

  return data.id;
}

export async function startDayPlan({ planDate, timezone, projects }: StartDayPlanInput) {
  const supabase = createServerSupabaseClient();

  const { data: dayPlan, error: dayPlanError } = await supabase
    .from('day_plans')
    .insert({
      plan_date: planDate,
      timezone: timezone ?? null,
      is_open: true,
    })
    .select('id')
    .single();

  if (dayPlanError || !dayPlan) {
    throw new Error(dayPlanError?.message || 'Failed to create day plan.');
  }

  if (projects.length > 0) {
    const { error: projectError } = await supabase
      .from('day_plan_projects')
      .insert(
        projects.map(project => ({
          day_plan_id: dayPlan.id,
          project_id: project.projectId,
          project_source: project.projectSource,
          project_name: project.projectName ?? null,
        }))
      );

    if (projectError) {
      throw new Error(projectError.message);
    }
  }

  return { dayPlanId: dayPlan.id };
}

type UpsertWorkLogItemInput = {
  dayPlanId: string;
  item: WorkLogItemInput;
};

export async function upsertWorkLogItem({ dayPlanId, item }: UpsertWorkLogItemInput) {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('work_log_items')
    .upsert(
      {
        id: item.id,
        day_plan_id: dayPlanId,
        description: item.description,
        timestamp: new Date(item.timestamp).toISOString(),
        project_id: item.projectId,
        project_source: item.projectSource ?? null,
        unplanned_reason: item.unplannedReason ?? null,
        mentioned_issues: item.mentionedIssues ?? null,
        duration_minutes: item.durationMinutes ?? null,
      },
      {
        onConflict: 'id',
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/day-work');

  return { ok: true };
}

type DeleteWorkLogItemInput = {
  dayPlanId: string;
  itemId: string;
};

export async function deleteWorkLogItem({ dayPlanId, itemId }: DeleteWorkLogItemInput) {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('work_log_items')
    .delete()
    .eq('id', itemId)
    .eq('day_plan_id', dayPlanId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/day-work');

  return { ok: true };
}

type UpdateDayPlanReflectionInput = {
  dayPlanId: string;
  reflection: string;
};

export async function updateDayPlanReflection({ dayPlanId, reflection }: UpdateDayPlanReflectionInput) {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('day_plans')
    .update({ reflection })
    .eq('id', dayPlanId);

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}

export async function getDayPlanProjects(dayPlanId: string): Promise<DayPlanProjectRecord[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('day_plan_projects')
    .select('project_id, project_source, project_name')
    .eq('day_plan_id', dayPlanId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(project => ({
    projectId: project.project_id,
    projectSource: project.project_source,
    projectName: project.project_name ?? null,
  }));
}

export async function getDayPlanWorkLog(dayPlanId: string): Promise<DayPlanWorkLogRecord[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('work_log_items')
    .select('id, description, timestamp, project_id, project_source, unplanned_reason, mentioned_issues, duration_minutes')
    .eq('day_plan_id', dayPlanId)
    .order('timestamp', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(item => ({
    id: item.id,
    description: item.description,
    timestamp: new Date(item.timestamp).getTime(),
    projectId: item.project_id,
    projectSource: item.project_source ?? null,
    unplannedReason: item.unplanned_reason ?? null,
    mentionedIssues: item.mentioned_issues ?? null,
    durationMinutes: item.duration_minutes ?? null,
  }));
}
