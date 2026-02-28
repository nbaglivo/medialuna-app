-- One focus session per goal (can have multiple over time; one active at a time)
create table public.goal_focus_sessions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index goal_focus_sessions_goal_id_idx on public.goal_focus_sessions (goal_id);

-- Updates within a session: start, stopped, finished, abandoned
create table public.goal_focus_session_updates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.goal_focus_sessions(id) on delete cascade,
  type text not null check (type in ('start', 'stopped', 'finished', 'abandoned')),
  note text,
  feeling text,
  created_at timestamptz not null default now()
);

create index goal_focus_session_updates_session_id_idx on public.goal_focus_session_updates (session_id);
