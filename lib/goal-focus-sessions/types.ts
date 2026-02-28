export type UpdateType = "start" | "stopped" | "finished" | "abandoned";

export type GoalFocusSession = {
  id: string;
  goalId: string;
  createdAt: string;
};

export type GoalFocusSessionUpdate = {
  id: string;
  sessionId: string;
  type: UpdateType;
  note: string | null;
  feeling: string | null;
  createdAt: string;
};

export type GoalFocusSessionWithUpdates = GoalFocusSession & {
  updates: GoalFocusSessionUpdate[];
};

export type AddUpdateInput = {
  type: UpdateType;
  note?: string | null;
  feeling?: string | null;
};
