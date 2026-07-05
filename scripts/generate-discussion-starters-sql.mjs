#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const scriptPath = resolve(process.cwd(), "scripts/seed-discussion-starters.mjs");
const script = readFileSync(scriptPath, "utf8");
const match = script.match(/const STARTERS = \[([\s\S]*?)\];/);
if (!match) throw new Error("STARTERS not found");

// eslint-disable-next-line no-eval
const STARTERS = eval(`[${match[1]}]`);

function esc(value) {
  return value.replace(/'/g, "''");
}

let out = `-- Anonymous discussion starters — run in Supabase SQL Editor (DEV first).
-- Safe to re-run: skips titles that already exist.

grant select, insert, update, delete on public.discussion_threads to service_role;
grant select, insert, update, delete on public.discussion_replies to service_role;

do $$
declare
  author uuid;
begin
  select coalesce(
    (select user_id from public.admin_users limit 1),
    (select id from public.profiles limit 1)
  ) into author;

  if author is null then
    raise exception 'No author profile found';
  end if;
`;

for (const starter of STARTERS) {
  out += `
  if not exists (select 1 from public.discussion_threads where title = '${esc(starter.title)}') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, '${esc(starter.title)}', '${esc(starter.body)}', true, '${esc(starter.nickname)}');
  end if;`;
}

out += `
end $$;

notify pgrst, 'reload schema';
`;

const outPath = resolve(process.cwd(), "supabase/discussion-starters-seed.sql");
writeFileSync(outPath, out, "utf8");
console.log(`Wrote ${STARTERS.length} starters to ${outPath}`);
