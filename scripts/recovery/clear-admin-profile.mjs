#!/usr/bin/env node
/**
 * Clear admin user's personal profile details and replace with generic "Admin" identity.
 *
 * What it does:
 *   1. Finds the admin user ID from admin_users table
 *   2. Deletes their avatar from Supabase Storage
 *   3. Clears all personal profile fields (name -> "Admin", no headline/city/workplace/cv)
 *   4. Updates auth.users metadata to match
 *
 * Usage:
 *   node scripts/recovery/clear-admin-profile.mjs
 *   node scripts/recovery/clear-admin-profile.mjs --dry-run
 */

import { loadRecoveryEnv } from "./recovery-lib.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const env = loadRecoveryEnv();
const BASE = env.supabaseUrl;
const KEY = env.serviceKey;

function h(extra = {}) {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function pgRest(method, table, body, query = "") {
  const url = `${BASE}/rest/v1/${table}${query}`;
  const res = await fetch(url, { method, headers: h(), body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} /rest/v1/${table} failed (${res.status}): ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function authAdmin(method, path, body) {
  const url = `${BASE}/auth/v1/admin${path}`;
  const res = await fetch(url, { method, headers: h(), body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} /auth/v1/admin${path} failed (${res.status}): ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function deleteStorageObject(bucket, path) {
  const url = `${BASE}/storage/v1/object/${bucket}/${encodeURI(path)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 404 || text.includes("not_found") || text.includes("Object not found")) {
      return false;
    }
    throw new Error(`DELETE storage/${bucket}/${path} failed (${res.status}): ${text}`);
  }
  return res.status !== 404;
}

// ── 1. Find admin user ID ──────────────────────────────────────────────────
console.log("Looking up admin user...");
const adminRows = await pgRest("GET", "admin_users", null, "?select=user_id&limit=1");
if (!adminRows || adminRows.length === 0) {
  console.error("No rows found in admin_users table.");
  process.exit(1);
}
const adminId = adminRows[0].user_id;
console.log(`  Admin user ID: ${adminId}`);

if (dryRun) {
  console.log("\n[dry-run] Would perform:");
  console.log(`  - Delete avatars/${adminId}/avatar.jpg from Storage`);
  console.log(`  - Update profiles set full_name='Admin', headline=null, city=null,`);
  console.log(`            license_number=null, avatar_url=null, cv_draft='{}',`);
  console.log(`            workplace_institution_slug=null  where id='${adminId}'`);
  console.log(`  - Update auth.users metadata: { full_name: 'Admin', headline: null, city: null, cv_draft: {} }`);
  console.log("\nRe-run without --dry-run to apply.");
  process.exit(0);
}

// ── 2. Delete avatar from Storage ─────────────────────────────────────────
console.log("\nDeleting avatar from Storage...");
const deleted = await deleteStorageObject("avatars", `${adminId}/avatar.jpg`);
console.log(deleted ? "  Avatar deleted." : "  No avatar file found (already gone).");

// ── 3. Clear the profiles row ──────────────────────────────────────────────
console.log("\nClearing profile data...");
await pgRest(
  "PATCH",
  "profiles",
  {
    full_name: "Admin",
    headline: null,
    city: null,
    license_number: null,
    avatar_url: null,
    cv_draft: {},
    workplace_institution_slug: null,
  },
  `?id=eq.${adminId}`,
);
console.log("  Profile cleared.");

// ── 4. Clear workplace link rows ───────────────────────────────────────────
console.log("Clearing user_workplaces rows...");
await pgRest("DELETE", "user_workplaces", null, `?user_id=eq.${adminId}`);
console.log("  Done.");

// ── 5. Update auth.users metadata ─────────────────────────────────────────
console.log("Updating auth metadata...");
await authAdmin("PUT", `/users/${adminId}`, {
  user_metadata: {
    full_name: "Admin",
    headline: null,
    city: null,
    cv_draft: {},
  },
});
console.log("  Auth metadata updated.");

console.log("\nAdmin profile cleared. The admin avatar now shows initials 'A'.");
console.log("Log out and back in to see the change in the app.");
