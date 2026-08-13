import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Goal, GoalInput, GoalSet, GoalSetWithGoals } from "./types";
import { getGoalLatestState, GoalFocusSessionUpdate } from "../goal-focus-sessions";

function mapGoalSet(row: {
  id: string;
  is_open: boolean;
  created_at: string;
  closed_at: string | null;
}): GoalSet {
  return {
    id: row.id,
    isOpen: row.is_open,
    createdAt: row.created_at,
    closedAt: row.closed_at ?? null,
  };
}

function mapGoal(row: {
  id: string;
  goal_set_id: string;
  text: string;
  time_invested_minutes: number;
  state: string;
  project_id: string | null;
  project_source: string | null;
  issue_id: string | null;
  issue_source: string | null;
  created_at: string;
  updated_at: string;
  latestState?: GoalFocusSessionUpdate | null;
}): Goal {
  return {
    id: row.id,
    goalSetId: row.goal_set_id,
    text: row.text,
    timeInvestedMinutes: row.time_invested_minutes,
    state: row.state as Goal["state"],
    projectId: row.project_id ?? null,
    projectSource: row.project_source ?? null,
    issueId: row.issue_id ?? null,
    issueSource: row.issue_source ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    latestState: row.latestState ?? null,
  };
}

export async function getOpenGoalSet(): Promise<GoalSetWithGoals | null> {
  const supabase = createServerSupabaseClient();

  const { data: goalSetRow, error: goalSetError } = await supabase
    .from("goal_sets")
    .select("id, is_open, created_at, closed_at")
    .eq("is_open", true)
    .maybeSingle();

  if (goalSetError || !goalSetRow) {
    if (goalSetError) throw new Error(goalSetError.message);
    return null;
  }

  const { data: goalsRows, error: goalsError } = await supabase
    .from("goals")
    .select(
      "id, goal_set_id, text, time_invested_minutes, state, project_id, project_source, issue_id, issue_source, created_at, updated_at"
    )
    .eq("goal_set_id", goalSetRow.id)
    .order("created_at", { ascending: true });

  if (goalsError) throw new Error(goalsError.message);
  
  const goalsWithLatestState = await Promise.all(goalsRows.map(async (goal) => {
    const latestState = await getGoalLatestState(goal.id);
    return mapGoal({ ...goal, latestState });
  }));

  const goalSet = mapGoalSet(goalSetRow);

  return { ...goalSet, goals: goalsWithLatestState };
}

export async function closeGoalSet(goalSetId: string): Promise<{ ok: boolean }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("goal_sets")
    .update({ is_open: false, closed_at: new Date().toISOString() })
    .eq("id", goalSetId);

  if (error) throw new Error(error.message);

  return { ok: true };
}

export async function openNewGoalSet(): Promise<GoalSetWithGoals> {
  const supabase = createServerSupabaseClient();

  // Close any currently open goal set
  await supabase
    .from("goal_sets")
    .update({ is_open: false, closed_at: new Date().toISOString() })
    .eq("is_open", true);

  const { data: newGoalSet, error: insertError } = await supabase
    .from("goal_sets")
    .insert({ is_open: true })
    .select("id, is_open, created_at, closed_at")
    .single();

  if (insertError || !newGoalSet) {
    throw new Error(insertError?.message ?? "Failed to create goal set");
  }

  const goalSet = mapGoalSet(newGoalSet);
  return { ...goalSet, goals: [] };
}

export async function getGoalsByGoalSetId(
  goalSetId: string
): Promise<Goal[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("goals")
    .select(
      "id, goal_set_id, text, time_invested_minutes, state, project_id, project_source, issue_id, issue_source, created_at, updated_at"
    )
    .eq("goal_set_id", goalSetId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapGoal);
}

export async function getGoalById(goalId: string): Promise<Goal | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("goals")
    .select("id, goal_set_id, text, time_invested_minutes, state, project_id, project_source, issue_id, issue_source, created_at, updated_at")
    .eq("id", goalId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapGoal(data);
}

export async function createGoal(
  goalSetId: string,
  input: GoalInput
): Promise<Goal> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("goals")
    .insert({
      goal_set_id: goalSetId,
      text: input.text,
      time_invested_minutes: input.timeInvestedMinutes ?? 0,
      state: input.state ?? "pending",
      project_id: input.projectId ?? null,
      project_source: input.projectSource ?? null,
      issue_id: input.issueId ?? null,
      issue_source: input.issueSource ?? null,
    })
    .select(
      "id, goal_set_id, text, time_invested_minutes, state, project_id, project_source, issue_id, issue_source, created_at, updated_at"
    )
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to create goal");

  return mapGoal(data);
}

export async function updateGoal(
  id: string,
  input: Partial<GoalInput>
): Promise<Goal> {
  const supabase = createServerSupabaseClient();

  const updates: Record<string, unknown> = {};
  if (input.text !== undefined) updates.text = input.text;
  if (input.timeInvestedMinutes !== undefined)
    updates.time_invested_minutes = input.timeInvestedMinutes;
  if (input.state !== undefined) updates.state = input.state;
  if (input.projectId !== undefined) updates.project_id = input.projectId;
  if (input.projectSource !== undefined)
    updates.project_source = input.projectSource;
  if (input.issueId !== undefined) updates.issue_id = input.issueId;
  if (input.issueSource !== undefined) updates.issue_source = input.issueSource;

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", id)
    .select(
      "id, goal_set_id, text, time_invested_minutes, state, project_id, project_source, issue_id, issue_source, created_at, updated_at"
    )
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to update goal");

  return mapGoal(data);
}

export async function deleteGoal(id: string): Promise<{ ok: boolean }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from("goals").delete().eq("id", id);

  if (error) throw new Error(error.message);

  return { ok: true };
}
