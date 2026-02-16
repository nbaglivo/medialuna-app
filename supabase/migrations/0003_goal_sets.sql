-- Goal set: a container for goals. Only one can be open at a time (per user, or globally when no user).
create table if not exists public.goal_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- One open set per user; when user_id is null, coalesce to sentinel so only one open set globally
create unique index goal_sets_user_open_unique
  on public.goal_sets (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where (is_open = true);

create index goal_sets_user_id_idx on public.goal_sets (user_id);
create index goal_sets_is_open_idx on public.goal_sets (is_open);

-- Individual goals within a goal set
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  goal_set_id uuid not null references public.goal_sets(id) on delete cascade,
  text text not null,
  time_invested_minutes integer not null default 0 check (time_invested_minutes >= 0),
  state text not null default 'pending',
  project_id text,
  project_source text,
  issue_id text,
  issue_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_goal_set_id_idx on public.goals (goal_set_id);
create index goals_project_idx on public.goals (project_id);
create index goals_issue_idx on public.goals (issue_id);
