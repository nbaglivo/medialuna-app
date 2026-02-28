import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AddUpdateInput,
  GoalFocusSession,
  GoalFocusSessionUpdate,
  GoalFocusSessionWithUpdates,
  UpdateType,
} from "./types";

function mapSession(row: {
  id: string;
  goal_id: string;
  created_at: string;
}): GoalFocusSession {
  return {
    id: row.id,
    goalId: row.goal_id,
    createdAt: row.created_at,
  };
}

function mapUpdate(row: {
  id: string;
  session_id: string;
  type: string;
  note: string | null;
  feeling: string | null;
  created_at: string;
}): GoalFocusSessionUpdate {
  return {
    id: row.id,
    sessionId: row.session_id,
    type: row.type as UpdateType,
    note: row.note ?? null,
    feeling: row.feeling ?? null,
    createdAt: row.created_at,
  };
}

const TERMINAL_UPDATE_TYPES: UpdateType[] = ["finished", "abandoned"];

export async function getOrCreateFocusSessionForGoal(
  goalId: string
): Promise<GoalFocusSessionWithUpdates> {
  const supabase = createServerSupabaseClient();

  const { data: sessions, error: sessionsError } = await supabase
    .from("goal_focus_sessions")
    .select("id, goal_id, created_at")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: false });

  if (sessionsError) throw new Error(sessionsError.message);

  if (sessions && sessions.length > 0) {
    for (const sessionRow of sessions) {
      const session = mapSession(sessionRow);
      const { data: updatesRows, error: updatesError } = await supabase
        .from("goal_focus_session_updates")
        .select("id, session_id, type, note, feeling, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true });

      if (updatesError) throw new Error(updatesError.message);

      const updates = (updatesRows ?? []).map(mapUpdate);
      const lastUpdate = updates[updates.length - 1];

      const isClosed =
        lastUpdate && TERMINAL_UPDATE_TYPES.includes(lastUpdate.type);

      if (!isClosed) {
        return { ...session, updates };
      }
    }
  }

  const { data: newSession, error: insertSessionError } = await supabase
    .from("goal_focus_sessions")
    .insert({ goal_id: goalId })
    .select("id, goal_id, created_at")
    .single();

  if (insertSessionError || !newSession) {
    throw new Error(insertSessionError?.message ?? "Failed to create focus session");
  }

  const session = mapSession(newSession);

  const { data: startUpdate, error: insertUpdateError } = await supabase
    .from("goal_focus_session_updates")
    .insert({
      session_id: session.id,
      type: "start",
    })
    .select("id, session_id, type, note, feeling, created_at")
    .single();

  if (insertUpdateError || !startUpdate) {
    throw new Error(insertUpdateError?.message ?? "Failed to create start update");
  }

  return {
    ...session,
    updates: [mapUpdate(startUpdate)],
  };
}

export async function getFocusSessionWithUpdates(
  sessionId: string
): Promise<GoalFocusSessionWithUpdates | null> {
  const supabase = createServerSupabaseClient();

  const { data: sessionRow, error: sessionError } = await supabase
    .from("goal_focus_sessions")
    .select("id, goal_id, created_at")
    .eq("id", sessionId)
    .single();

  if (sessionError || !sessionRow) {
    if (sessionError) throw new Error(sessionError.message);
    return null;
  }

  const { data: updatesRows, error: updatesError } = await supabase
    .from("goal_focus_session_updates")
    .select("id, session_id, type, note, feeling, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (updatesError) throw new Error(updatesError.message);

  const session = mapSession(sessionRow);
  const updates = (updatesRows ?? []).map(mapUpdate);

  return { ...session, updates };
}

export async function addUpdate(
  sessionId: string,
  input: AddUpdateInput
): Promise<GoalFocusSessionUpdate> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("goal_focus_session_updates")
    .insert({
      session_id: sessionId,
      type: input.type,
      note: input.note ?? null,
      feeling: input.feeling ?? null,
    })
    .select("id, session_id, type, note, feeling, created_at")
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to add update");

  return mapUpdate(data);
}

export async function removeUpdate(updateId: string): Promise<{ ok: boolean }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("goal_focus_session_updates")
    .delete()
    .eq("id", updateId);

  if (error) throw new Error(error.message);

  return { ok: true };
}
