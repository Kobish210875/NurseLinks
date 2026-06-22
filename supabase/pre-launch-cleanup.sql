-- ============================================================
-- NURSELINKS — PRE-LAUNCH DATABASE CLEANUP
-- ============================================================
-- Run this ONCE in the Supabase SQL Editor on PROD.
-- It wipes all test content and test users.
-- Your admin account and all reference data are preserved.
--
-- SAFE TO RUN: uses transactions and prints a summary at the end.
-- ============================================================

begin;

-- ----------------------------------------------------------------
-- Step 0: Confirm the admin user exists before we do anything
-- ----------------------------------------------------------------
do $$
declare
  admin_count int;
begin
  select count(*) into admin_count from public.admin_users;
  if admin_count = 0 then
    raise exception
      'ABORT: no rows found in admin_users. Make sure you are on the correct project and your admin row exists before running this script.';
  end if;
  raise notice 'Admin user check OK (% admin row(s) found).', admin_count;
end $$;

-- ----------------------------------------------------------------
-- Step 1: Delete all user-generated content
--         (cascade handles child rows automatically)
-- ----------------------------------------------------------------

-- Moderation flags (no FK cascade on content_id since it stores mixed types)
delete from public.moderation_flags;

-- Recommendation engine state
delete from public.connection_recommendation_dismissals;
delete from public.connection_recommendation_snapshots;

-- Messaging
delete from public.direct_messages;

-- Social graph
delete from public.follows;
delete from public.connections;

-- Job applications (cascade deletes from job_list_views too)
delete from public.job_applications;
delete from public.job_list_views;
delete from public.jobs;

-- Feed (cascade deletes post_likes, post_comments, post_comment_likes, post_shares)
delete from public.posts;

-- Profile extras for non-admin users
delete from public.user_workplaces
  where user_id not in (select user_id from public.admin_users);

delete from public.user_specialties
  where user_id not in (select user_id from public.admin_users);

-- ----------------------------------------------------------------
-- Step 2: Delete all non-admin profiles
--         (cascade deletes user_specialties, user_workplaces,
--          connections, follows, posts, jobs, etc. for those users)
-- ----------------------------------------------------------------
delete from public.profiles
  where id not in (select user_id from public.admin_users);

-- ----------------------------------------------------------------
-- Step 3: Delete all non-admin auth users
--         (cascade deletes the auth.identities rows too)
-- ----------------------------------------------------------------
delete from auth.users
  where id not in (select user_id from public.admin_users);

-- ----------------------------------------------------------------
-- Step 4: Clear backup_logs (test runs, not real operational data)
-- ----------------------------------------------------------------
delete from public.backup_logs;

-- ----------------------------------------------------------------
-- Step 5: Sanity check — print what remains
-- ----------------------------------------------------------------
do $$
declare
  v_auth_users       int;
  v_profiles         int;
  v_admin_users      int;
  v_posts            int;
  v_jobs             int;
  v_messages         int;
  v_connections      int;
  v_applications     int;
  v_mod_flags        int;
begin
  select count(*) into v_auth_users   from auth.users;
  select count(*) into v_profiles     from public.profiles;
  select count(*) into v_admin_users  from public.admin_users;
  select count(*) into v_posts        from public.posts;
  select count(*) into v_jobs         from public.jobs;
  select count(*) into v_messages     from public.direct_messages;
  select count(*) into v_connections  from public.connections;
  select count(*) into v_applications from public.job_applications;
  select count(*) into v_mod_flags    from public.moderation_flags;

  raise notice '-------- CLEANUP RESULT --------';
  raise notice 'auth.users:       % (expected: 1 = admin only)', v_auth_users;
  raise notice 'profiles:         % (expected: 1 = admin only)', v_profiles;
  raise notice 'admin_users:      % (expected: 1)', v_admin_users;
  raise notice 'posts:            % (expected: 0)', v_posts;
  raise notice 'jobs:             % (expected: 0)', v_jobs;
  raise notice 'direct_messages:  % (expected: 0)', v_messages;
  raise notice 'connections:      % (expected: 0)', v_connections;
  raise notice 'job_applications: % (expected: 0)', v_applications;
  raise notice 'moderation_flags: % (expected: 0)', v_mod_flags;
  raise notice '--------------------------------';

  if v_auth_users != 1 or v_profiles != 1 or v_admin_users != 1 then
    raise exception
      'Unexpected counts after cleanup — rolling back. auth_users=%, profiles=%, admin_users=%',
      v_auth_users, v_profiles, v_admin_users;
  end if;

  raise notice 'All checks passed. Committing cleanup.';
end $$;

commit;

-- ----------------------------------------------------------------
-- Step 6 (MANUAL — cannot be done in SQL):
-- Delete Storage files in the Supabase dashboard.
-- Go to: Storage -> avatars bucket -> select all -> delete
--         Storage -> posts bucket   -> select all -> delete
--         Storage -> cvs bucket     -> select all -> delete
-- Keep only YOUR avatar if you have one set.
-- ----------------------------------------------------------------
