#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const files = [
  ["04", "feed-social.sql"],
  // 05 feed-post-delete.sql omitted — same policy as feed-social; caused duplicate errors
  ["06", "post-comment-likes.sql"],
  ["07", "post-comment-replies.sql"],
  ["08", "post-shares.sql"],
  ["09", "jobs.sql"],
  ["10", "job-applications.sql"],
  ["11", "jobs-scaling.sql"],
  ["12", "job-applications-seen.sql"],
  ["13", "job-applications-read.sql"],
  ["14", "job-applications-cv.sql"],
  ["15", "profile-workplace.sql"],
  ["16", "medical-institutions.sql"],
  ["17", "connections-messaging.sql"],
  ["18", "messages-open-send.sql"],
  ["19", "connection-remove-friend.sql"],
  ["20", "profile-cv.sql"],
  ["21", "account-deletion-and-recommendations.sql"],
  ["22", "recommendation-snapshots.sql"],
  ["23", "recommendation-workplace.sql"],
  ["24", "admin.sql"],
  ["25", "moderation.sql"],
];

const header = `-- NurseLinks dev setup: migrations 04-25 in one run
-- Prerequisite: run 01 schema.sql, 02 storage.sql, 03 post-images.sql first.
-- Paste this entire file into Supabase SQL Editor (dev project) and click Run once.

`;

let out = header;
for (const [num, file] of files) {
  const body = readFileSync(join("supabase", file), "utf8").trim();
  out += `\n-- ${"=".repeat(72)}\n`;
  out += `-- ${num}. ${file}\n`;
  out += `-- ${"=".repeat(72)}\n\n`;
  out += `${body}\n\n`;
}

out += `-- Done. Optional: add yourself as admin:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_EMAIL';
`;

const outPath = "supabase/dev-setup-04-to-25.sql";
writeFileSync(outPath, out);
console.log(`Wrote ${outPath} (${out.split("\n").length} lines, ${Math.round(out.length / 1024)} KB)`);
