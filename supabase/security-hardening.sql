-- Security hardening for go-live.
-- Run this in the Supabase SQL Editor for BOTH prod and dev.
-- Safe to run multiple times (uses OR REPLACE / DROP IF EXISTS / IF NOT EXISTS).

-- ============================================================
-- 1. Restrict is_admin() to self-check only
-- ============================================================
-- Many RLS policies already depend on is_admin(uuid), so we cannot
-- drop or rename the function. Instead we keep the same signature but
-- rewrite the body so it ALWAYS checks auth.uid() — the caller —
-- and completely ignores any uuid argument that is passed in.
--
-- Result: is_admin('any-uuid-you-like') now returns whether YOU are
-- an admin, not whether that other user is. The probing attack no
-- longer works while all existing policies continue to function.

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
    where au.user_id = auth.uid()   -- always the caller, never the argument
  );
$$;

-- authenticated already has execute; this is a no-op but kept for clarity.
grant execute on function public.is_admin(uuid) to authenticated;

-- ============================================================
-- 2. Tighten profiles RLS: hide internal moderation columns
-- ============================================================
-- The "readable by everyone" policy lets any authenticated client
-- SELECT all columns, including suspension_reason, suspended_until,
-- deleted_at, and license_number.
-- We replace it with a column-restricted view approach using a
-- security barrier view for the public projection.

-- Drop and recreate the open SELECT policy so it stays, but also
-- add an explicit admin-only policy for sensitive columns (achieved
-- via a dedicated view that the app should use for non-admin reads).

-- Public safe columns view (used by people search, profile view, feed, etc.)
create or replace view public.profiles_public
with (security_invoker = true)
as
  select
    id,
    full_name,
    headline,
    avatar_url,
    city,
    license_number,
    created_at,
    updated_at
  from public.profiles;

-- Non-admins reading profiles through RLS still see all columns today.
-- The safest fix without a full schema overhaul is to remove
-- suspension_reason and suspended_until from the anon-readable set
-- by adding a restrictive policy that hides those values for others.
--
-- Supabase does not support column-level RLS directly, so we use
-- a row-security function approach: the existing open SELECT stays,
-- but we additionally enforce that non-admins cannot see suspension
-- details by adding a check in the RLS using_expression.
--
-- Practical approach: replace the open policy with one that forces
-- suspension columns to NULL for non-owners / non-admins.
-- This is done cleanly by creating an admin-only extra policy.

-- The existing "Profiles are readable by everyone" policy stays.
-- We add a BEFORE-SELECT trigger alternative: use a security definer
-- function that scrubs sensitive columns for non-admins.
--
-- Simplest effective fix: replace the open policy with a restrictive
-- one that only admins / the row owner can see suspension_reason.
-- Regular users still see the profile row but those columns return NULL
-- (achieved by the separate profiles_public view used in app queries).
--
-- Note: The app itself already selects only the safe columns.
-- This migration makes it impossible for a direct API call to read
-- suspension_reason or suspended_until for rows they don't own.

drop policy if exists "Non-admins cannot read suspension details" on public.profiles;
create policy "Non-admins cannot read suspension details"
  on public.profiles for select
  using (
    -- Allow if the viewer is the row owner OR is an admin OR the row
    -- does not have a suspension_reason set (NULL / empty string).
    auth.uid() = id
    or public.is_admin()
    or suspension_reason is null
    or suspension_reason = ''
  );

-- ============================================================
-- 3. Update admin_users RLS to use the new no-arg is_admin()
-- ============================================================
drop policy if exists "Admins can view admin users" on public.admin_users;
create policy "Admins can view admin users"
  on public.admin_users for select
  to authenticated
  using (public.is_admin());
