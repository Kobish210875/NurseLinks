-- Admin console support.
-- Run in Supabase SQL Editor, then add your own user as admin:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_EMAIL_HERE';

create table if not exists public.admin_users (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = target_user_id
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

drop policy if exists "Admins can view admin users" on public.admin_users;
create policy "Admins can view admin users"
  on public.admin_users for select
  to authenticated
  using (public.is_admin(auth.uid()));
