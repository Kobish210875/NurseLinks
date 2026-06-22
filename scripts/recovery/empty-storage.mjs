#!/usr/bin/env node
/**
 * Empty all Supabase Storage buckets (avatars, post-images, job-applications).
 * Use before going live to remove all test files in one command.
 *
 * Usage:
 *   node scripts/recovery/empty-storage.mjs
 *   node scripts/recovery/empty-storage.mjs --bucket avatars   (single bucket)
 *   node scripts/recovery/empty-storage.mjs --dry-run          (preview only)
 */

import { loadRecoveryEnv, STORAGE_BUCKETS } from "./recovery-lib.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const bucketArg = args.includes("--bucket") ? args[args.indexOf("--bucket") + 1] : null;

const env = loadRecoveryEnv();
const SUPABASE_URL = env.SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in env.recovery.local");
  process.exit(1);
}

const bucketsToEmpty = bucketArg ? [bucketArg] : STORAGE_BUCKETS;

async function apiFetch(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  return json;
}

/** List every object in a bucket (recurses via prefix). */
async function listAll(bucket, prefix = "") {
  const results = [];
  let offset = 0;
  while (true) {
    const batch = await apiFetch("POST", `/storage/v1/object/list/${bucket}`, {
      prefix,
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (!Array.isArray(batch) || batch.length === 0) break;

    for (const item of batch) {
      if (item.id == null) {
        // folder — recurse
        const sub = await listAll(bucket, prefix ? `${prefix}/${item.name}` : item.name);
        results.push(...sub);
      } else {
        results.push(prefix ? `${prefix}/${item.name}` : item.name);
      }
    }
    if (batch.length < 100) break;
    offset += batch.length;
  }
  return results;
}

/** Delete a batch of paths from a bucket (max 100 per request). */
async function deleteBatch(bucket, paths) {
  return apiFetch("DELETE", `/storage/v1/object/${bucket}`, { prefixes: paths });
}

async function emptyBucket(bucket) {
  console.log(`\n--- Bucket: ${bucket} ---`);
  const files = await listAll(bucket);

  if (files.length === 0) {
    console.log("  Already empty.");
    return;
  }

  console.log(`  Found ${files.length} file(s).`);
  files.forEach(f => console.log(`    ${f}`));

  if (dryRun) {
    console.log("  [dry-run] No files deleted.");
    return;
  }

  // Delete in batches of 100
  let deleted = 0;
  for (let i = 0; i < files.length; i += 100) {
    const batch = files.slice(i, i + 100);
    await deleteBatch(bucket, batch);
    deleted += batch.length;
  }
  console.log(`  Deleted ${deleted} file(s). Bucket is now empty.`);
}

console.log(dryRun ? "[DRY RUN — no files will be deleted]\n" : "");
console.log(`Emptying ${bucketsToEmpty.join(", ")}...`);

for (const bucket of bucketsToEmpty) {
  await emptyBucket(bucket);
}

console.log("\nDone.");
