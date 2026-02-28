"use server";

import {
  addUpdate as addUpdateCrud,
  getOrCreateFocusSessionForGoal as getOrCreateFocusSessionForGoalCrud,
  removeUpdate as removeUpdateCrud,
  getFocusSessionWithUpdates as getFocusSessionWithUpdatesCrud,
} from "@/lib/goal-focus-sessions";
import type { AddUpdateInput } from "@/lib/goal-focus-sessions";
import {
  closeGoalSet as closeGoalSetCrud,
  createGoal as createGoalCrud,
  deleteGoal as deleteGoalCrud,
  getGoalById as getGoalByIdCrud,
  getOpenGoalSet as getOpenGoalSetCrud,
  openNewGoalSet as openNewGoalSetCrud,
  updateGoal as updateGoalCrud,
} from "@/lib/goal-sets";
import type { GoalInput } from "@/lib/goal-sets";
import { revalidatePath } from "next/cache";

export async function getOpenGoalSet() {
  return getOpenGoalSetCrud();
}

export async function closeGoalSet(goalSetId: string) {
  const result = await closeGoalSetCrud(goalSetId);
  revalidatePath("/new-flow");
  return result;
}

export async function openNewGoalSet() {
  const result = await openNewGoalSetCrud();
  revalidatePath("/new-flow");
  return result;
}

export async function getGoalById(goalId: string) {
  const result = await getGoalByIdCrud(goalId);
  return result;
}

export async function createGoal(goalSetId: string, input: GoalInput) {
  const result = await createGoalCrud(goalSetId, input);
  revalidatePath("/new-flow");
  return result;
}

export async function updateGoal(id: string, input: Partial<GoalInput>) {
  const result = await updateGoalCrud(id, input);
  revalidatePath("/new-flow");
  return result;
}

export async function deleteGoal(id: string) {
  const result = await deleteGoalCrud(id);
  revalidatePath("/new-flow");
  return result;
}

export async function getOrCreateFocusSessionForGoal(goalId: string) {
  return getOrCreateFocusSessionForGoalCrud(goalId);
}

export async function addFocusSessionUpdate(
  sessionId: string,
  input: AddUpdateInput,
  goalId: string
) {
  const result = await addUpdateCrud(sessionId, input);
  revalidatePath("/new-flow");
  revalidatePath(`/new-flow/focus/${goalId}`);
  return result;
}

export async function removeFocusSessionUpdate(updateId: string, goalId: string) {
  const result = await removeUpdateCrud(updateId);
  revalidatePath("/new-flow");
  revalidatePath(`/new-flow/focus/${goalId}`);
  return result;
}

export async function getFocusSessionWithUpdates(focusSessionId: string) {
  return getFocusSessionWithUpdatesCrud(focusSessionId);
}