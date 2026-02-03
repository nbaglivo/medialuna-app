export const TaskSources = {
  Github: 'github',
  Linear: 'linear',
  App: 'app'
} as const;

export type TaskSource = (typeof TaskSources)[keyof typeof TaskSources];

export const taskSourceValues = new Set<TaskSource>(Object.values(TaskSources));
