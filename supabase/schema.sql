create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  headline text,
  license_number text,
  city text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, headline, city)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'headline', ''),
    nullif(new.raw_user_meta_data ->> 'city', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.workplaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  created_at timestamptz not null default now(),
  unique (name, city)
);

create table if not exists public.user_specialties (
  user_id uuid not null references public.profiles (id) on delete cascade,
  specialty_id uuid not null references public.specialties (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, specialty_id)
);

create table if not exists public.user_workplaces (
  user_id uuid not null references public.profiles (id) on delete cascade,
  workplace_id uuid not null references public.workplaces (id) on delete cascade,
  role text,
  start_year int,
  end_year int,
  created_at timestamptz not null default now(),
  primary key (user_id, workplace_id),
  constraint user_workplaces_years_check check (
    start_year is null
    or end_year is null
    or start_year <= end_year
  )
);

create table if not exists public.connections (
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  constraint connections_no_self_check check (requester_id <> addressee_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_check check (follower_id <> following_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_city_idx on public.profiles (city);
create index if not exists user_specialties_specialty_id_idx on public.user_specialties (specialty_id);
create index if not exists user_workplaces_workplace_id_idx on public.user_workplaces (workplace_id);
create index if not exists connections_addressee_id_status_idx on public.connections (addressee_id, status);
create index if not exists follows_following_id_idx on public.follows (following_id);
create index if not exists posts_author_id_created_at_idx on public.posts (author_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.specialties enable row level security;
alter table public.workplaces enable row level security;
alter table public.user_specialties enable row level security;
alter table public.user_workplaces enable row level security;
alter table public.connections enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;

create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Specialties are readable by everyone"
  on public.specialties for select
  using (true);

create policy "Workplaces are readable by everyone"
  on public.workplaces for select
  using (true);

create policy "Users can read profile specialties"
  on public.user_specialties for select
  using (true);

create policy "Users can manage their specialties"
  on public.user_specialties for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read workplace history"
  on public.user_workplaces for select
  using (true);

create policy "Users can manage their workplaces"
  on public.user_workplaces for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can see their own connection requests"
  on public.connections for select
  using (auth.uid() in (requester_id, addressee_id));

create policy "Users can create connection requests"
  on public.connections for insert
  with check (auth.uid() = requester_id);

create policy "Users can update connections addressed to them"
  on public.connections for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

create policy "Follows are readable by everyone"
  on public.follows for select
  using (true);

create policy "Users can manage their follows"
  on public.follows for all
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

create policy "Posts are readable by everyone"
  on public.posts for select
  using (true);

create policy "Users can create their own posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = author_id);
