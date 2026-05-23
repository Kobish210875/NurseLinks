-- Run if other users see "no CV published" but the owner filled it in (legacy auth metadata)

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
