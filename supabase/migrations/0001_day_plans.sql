create extension if not exists "pgcrypto";

create table if not exists public.day_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  plan_date date not null,
  reflection text not null default '',
  timezone text,
  created_at timestamptz not null default now()
);

create unique index if not exists day_plans_user_date_unique
  on public.day_plans (user_id, plan_date);

create table if not exists public.day_plan_projects (
  id uuid primary key default gen_random_uuid(),
  day_plan_id uuid not null references public.day_plans(id) on delete cascade,
  project_id text not null,
  project_source text not null,
  project_name text,
  created_at timestamptz not null default now()
);

create index if not exists day_plan_projects_day_plan_id_idx
  on public.day_plan_projects (day_plan_id);

create index if not exists day_plan_projects_source_idx
  on public.day_plan_projects (project_source);

create index if not exists day_plan_projects_project_id_idx
  on public.day_plan_projects (project_id);

create table if not exists public.work_log_items (
  id uuid primary key default gen_random_uuid(),
  day_plan_id uuid not null references public.day_plans(id) on delete cascade,
  description text not null,
  timestamp timestamptz not null,
  project_id text,
  project_source text,
  unplanned_reason text,
  mentioned_issues jsonb,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists work_log_items_day_plan_id_idx
  on public.work_log_items (day_plan_id);

create index if not exists work_log_items_project_id_idx
  on public.work_log_items (project_id);

create index if not exists work_log_items_project_source_idx
  on public.work_log_items (project_source);

create index if not exists work_log_items_timestamp_idx
  on public.work_log_items (timestamp);
