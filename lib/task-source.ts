export const TaskSources = {
  Github: 'github',
  Linear: 'linear',
  App: 'app'
} as const;

export type TaskSource = (typeof TaskSources)[keyof typeof TaskSources];

export const taskSourceValues = new Set<TaskSource>(Object.values(TaskSources));

// Unified project type that combines projects from all sources
export type UnifiedProject = {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  source: TaskSource;
  icon?: string | null;
  color?: string | null;
  state?: string;
  progress?: number;
  targetDate?: string | null;
  startDate?: string | null;
};

// Linear-specific project type
export type LinearProject = {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  state: string;
  progress: number;
  icon?: string | null;
  color?: string | null;
  targetDate?: string | null;
  startDate?: string | null;
};

// GitHub-specific project type (placeholder for future)
export type GithubProject = {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  state?: string;
};

// App-specific project type (placeholder)
export type AppProject = {
  id: string;
  name: string;
  description?: string | null;
  url: string;
};

// Normalization helpers
export function normalizeLinearProject(project: LinearProject): UnifiedProject {
  return {
    id: `linear-${project.id}`,
    name: project.name,
    description: project.description,
    url: project.url,
    source: TaskSources.Linear,
    icon: project.icon,
    color: project.color,
    state: project.state,
    progress: project.progress,
    targetDate: project.targetDate,
    startDate: project.startDate,
  };
}

export function normalizeGithubProject(project: GithubProject): UnifiedProject {
  return {
    id: `github-${project.id}`,
    name: project.name,
    description: project.description,
    url: project.url,
    source: TaskSources.Github,
    state: project.state,
  };
}

export function normalizeAppProject(project: AppProject): UnifiedProject {
  return {
    id: `app-${project.id}`,
    name: project.name,
    description: project.description,
    url: project.url,
    source: TaskSources.App,
  };
}
