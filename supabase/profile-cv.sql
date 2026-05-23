-- Store CV on profile so other users can view it (run in Supabase SQL Editor)

alter table public.profiles
  add column if not exists cv_draft jsonb;

-- Read CV saved in auth metadata (legacy) for profile pages — authenticated users only
create or replace function public.get_profile_cv_draft(target_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.cv_draft from public.profiles p where p.id = target_id),
    (select u.raw_user_meta_data -> 'cv_draft' from auth.users u where u.id = target_id)
  );
$$;

grant execute on function public.get_profile_cv_draft(uuid) to authenticated;
