export type GoalState = "pending" | "in_progress" | "completed" | "cancelled";

export type GoalSet = {
  id: string;
  isOpen: boolean;
  createdAt: string;
  closedAt: string | null;
};

export type Goal = {
  id: string;
  goalSetId: string;
  text: string;
  timeInvestedMinutes: number;
  state: GoalState;
  projectId: string | null;
  projectSource: string | null;
  issueId: string | null;
  issueSource: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GoalInput = {
  text: string;
  timeInvestedMinutes?: number;
  state?: GoalState;
  projectId?: string | null;
  projectSource?: string | null;
  issueId?: string | null;
  issueSource?: string | null;
};

export type GoalSetWithGoals = GoalSet & {
  goals: Goal[];
};
