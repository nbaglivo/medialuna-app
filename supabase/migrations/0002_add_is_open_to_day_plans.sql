-- Add is_open column to track if a day plan is currently being worked on
alter table public.day_plans
  add column if not exists is_open boolean not null default false;

-- Create an index for faster queries on is_open
create index if not exists day_plans_is_open_idx
  on public.day_plans (is_open);

-- Create a partial unique index to ensure only one open day plan per user at a time
create unique index if not exists day_plans_user_open_unique
  on public.day_plans (user_id)
  where (is_open = true);
