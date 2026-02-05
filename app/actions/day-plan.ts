'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export type DayPlanProjectInput = {
  projectId: string;
  projectSource: string;
  projectName?: string | null;
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

export async function startDayPlan({ planDate, timezone, projects }: StartDayPlanInput) {
  const supabase = createServerSupabaseClient();

  const { data: dayPlan, error: dayPlanError } = await supabase
    .from('day_plans')
    .insert({
      plan_date: planDate,
      timezone: timezone ?? null,
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

type SyncProjectsInput = {
  dayPlanId: string;
  projects: DayPlanProjectInput[];
};

export async function syncDayPlanProjects({ dayPlanId, projects }: SyncProjectsInput) {
  const supabase = createServerSupabaseClient();

  const { error: deleteError } = await supabase
    .from('day_plan_projects')
    .delete()
    .eq('day_plan_id', dayPlanId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (projects.length === 0) {
    return { ok: true };
  }

  const { error: insertError } = await supabase
    .from('day_plan_projects')
    .insert(
      projects.map(project => ({
        day_plan_id: dayPlanId,
        project_id: project.projectId,
        project_source: project.projectSource,
        project_name: project.projectName ?? null,
      }))
    );

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { ok: true };
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
