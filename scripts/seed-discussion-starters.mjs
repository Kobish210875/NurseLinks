#!/usr/bin/env node
/**
 * Seed anonymous community discussion starters (one unique nickname each).
 *
 * Usage:
 *   node scripts/seed-discussion-starters.mjs
 *   node scripts/seed-discussion-starters.mjs --dry-run
 *   node scripts/seed-discussion-starters.mjs --target prod
 *
 * Uses direct Postgres when DB_PASSWORD is set (.env.local, env.clone.local for dev,
 * or env.recovery.local for prod), otherwise Supabase service role REST.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const targetProd = args.includes("--target") && args[args.indexOf("--target") + 1] === "prod";

/** @type {{ title: string; body: string; nickname: string }[]} */
const STARTERS = [
  {
    title: "איזה נעליים הכי נוחות למשמרת של 12 שעות?",
    body: "מחפשת המלצות מהשטח — מה באמת עובד אחרי יום ארוך על הרגליים?",
    nickname: "אחות בט\"נ",
  },
  {
    title: "איך מתמודדים עם משמרת לילה בלי לשבור את השינה בימים חופשיים?",
    body: "אשמח לשמוע שגרות שעובדות לכם — אוכל, אור, שינה, משפחה.",
    nickname: "אח משמרת לילה",
  },
  {
    title: "מה הטריק שלכם לשמור על אנרגיה באמצע משמרת ארוכה?",
    body: "12+ שעות — מה עוזר לכם לא לקרוס באמצע?",
    nickname: "אחות מחלקה פנימית",
  },
  {
    title: "איך אתם מארגנים את תחילת המשמרת?",
    body: "יש לכם checklist או הרגל קבוע שחוסך בלאגן בהמשך?",
    nickname: "אחות חדר ניתוח",
  },
  {
    title: "משמרות בוקר, ערב או לילה — מה הכי מתאים לכם?",
    body: "סקר קטן מהקהילה — ולמה בחרתם בזה?",
    nickname: "אחות דינמית",
  },
  {
    title: "איזו מחלקה לדעתכם הכי מאתגרת פיזית?",
    body: "לא רק רגשית — באמת על הגוף. מה הכי קשה לכם?",
    nickname: "אח מט\"נ",
  },
  {
    title: "מחלקה שפתחה לכם את הלב למקצוע — מה היה שם מיוחד?",
    body: "איזו חוויה או צוות גרמו לכם להרגיש שזה המקום שלכם?",
    nickname: "אחות מיון",
  },
  {
    title: "איך מתמודדים עם עומס חריג כשאין מספיק צוות?",
    body: "מה עושים בפועל כשהמציאות לא תואמת את התקן?",
    nickname: "אחות ב-ICU",
  },
  {
    title: "מה עוזר לשמור על קשר טוב עם צוות רב־מקצועי?",
    body: "רופאים, פראמדיקים, סיעוד — טיפים לעבודה חלקה יותר.",
    nickname: "אחות פגייה",
  },
  {
    title: "מתי הזמן הנכון לעבור מחלקה או מוסד?",
    body: "ולמתי עדיף להישאר ולתת לזה עוד זמן?",
    nickname: "אחות עם 5 שנות ניסיון",
  },
  {
    title: "הכשרה או התמחות ששינתה לכם את הקריירה?",
    body: "מה הייתם ממליצים לקולגה שחושב על צעד הבא?",
    nickname: "אחות מומחית",
  },
  {
    title: "איך מתכוננים לראיון עבודה במחלקה שחלמתם עליה?",
    body: "שאלות, תרגול, מה לשאול את המראיין/ת?",
    nickname: "אח/אחות חדש/ה",
  },
  {
    title: "עבודה במוסד ציבורי מול פרטי — מה היתרונות והחסרונות?",
    body: "מניסיון אישי — מה surprised אתכם?",
    nickname: "אחות מהשטח",
  },
  {
    title: "מה עוזר לכם \"לנתק\" אחרי משמרת קשה?",
    body: "איך לא לקחת את הביתה את כל מה שראיתם?",
    nickname: "אחות אחרי משמרת",
  },
  {
    title: "איך מדברים עם משפחות במצבים רגישים?",
    body: "מה עוזר לכם להישאר נוכחים ואנושיים?",
    nickname: "אחות אונקולוגיה",
  },
  {
    title: "סימנים שאתם מתקרבים לשחיקה — ומה עשיתם כשזיהיתם?",
    body: "אין בושה לדבר על זה. מה עזר לכם?",
    nickname: "אחות שמקשיבה לעצמה",
  },
  {
    title: "איזה ציוד אישי לא הייתם מוותרים עליו במשמרת?",
    body: "מד לחץ, תיק, עט, כלים — מה חייב להיות איתכם?",
    nickname: "אחות עם תיק מלא",
  },
  {
    title: "אפליקציות או כלים דיגיטליים שעוזרים לכם בעבודה?",
    body: "מה באמת שווה את זה ולא רק hype?",
    nickname: "אח דיגיטלי",
  },
  {
    title: "טיפים לשמירה על הגב, הברכיים והרגליים אחרי שנים על הרגליים?",
    body: "מי שעבר את זה — מה הייתם אומרים לעצמכם בהתחלה?",
    nickname: "אחות 15 שנים במקצוע",
  },
  {
    title: "איך מסבירים לחברים ולמשפחה מה באמת קורה במשמרת?",
    body: "מי שלא במקצוע — איך גורמים להם להבין?",
    nickname: "אחות עם משפחה",
  },
  {
    title: "איך מוצאים איזון בין חיים אישיים לעבודה במשמרות?",
    body: "זוגיות, ילדים, חברים — מה עובד לכם?",
    nickname: "אחות אמא למשמרות",
  },
];

function parseEnvFile(path) {
  if (!existsSync(path)) return null;
  const vars = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

function refFromUrl(url) {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) throw new Error(`Invalid Supabase URL: ${url}`);
  return match[1];
}

function loadEnv() {
  const path = targetProd
    ? resolve(process.cwd(), "env.recovery.local")
    : resolve(process.cwd(), ".env.local");
  const vars = parseEnvFile(path) ?? {};
  if (!vars || Object.keys(vars).length === 0) throw new Error(`Missing ${path}`);

  if (!targetProd) {
    const clone = parseEnvFile(resolve(process.cwd(), "env.clone.local"));
    if (clone?.DEV_DB_PASSWORD && !vars.DB_PASSWORD) {
      vars.DB_PASSWORD = clone.DEV_DB_PASSWORD;
    }
  }

  const url = vars.NEXT_PUBLIC_SUPABASE_URL || vars.SUPABASE_URL;
  const key = vars.SUPABASE_SERVICE_ROLE_KEY || vars.SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Missing Supabase URL or service role key in ${path}`);
  return { url, key, path, vars };
}

async function resolveAuthorIdPg(client, vars) {
  if (vars.SEED_AUTHOR_ID) return vars.SEED_AUTHOR_ID;

  const admin = await client.query("select user_id from public.admin_users limit 1");
  if (admin.rows[0]?.user_id) return admin.rows[0].user_id;

  const profile = await client.query("select id from public.profiles limit 1");
  if (profile.rows[0]?.id) return profile.rows[0].id;

  throw new Error("Could not resolve author_id — set SEED_AUTHOR_ID in env file");
}

async function resolveAuthorIdRest(supabase, vars) {
  if (vars.SEED_AUTHOR_ID) return vars.SEED_AUTHOR_ID;

  const { data: admins } = await supabase.from("admin_users").select("user_id").limit(1);
  if (admins?.[0]?.user_id) return admins[0].user_id;

  const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
  if (profiles?.[0]?.id) return profiles[0].id;

  throw new Error("Could not resolve author_id — set SEED_AUTHOR_ID in env file");
}

async function seedViaPostgres(env) {
  const { Client } = await import("pg");
  const ref = refFromUrl(env.url);
  const client = new Client({
    host: env.vars.DB_POOLER_HOST || "aws-1-eu-central-1.pooler.supabase.com",
    port: 6543,
    user: `postgres.${ref}`,
    password: env.vars.DB_PASSWORD,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const authorId = await resolveAuthorIdPg(client, env.vars);
    console.log(`Target: ${targetProd ? "PROD" : "DEV"} (${env.url}) [postgres]`);
    console.log(`Author: ${authorId}${dryRun ? " [dry-run]" : ""}`);

    const existing = await client.query("select title from public.discussion_threads");
    const existingTitles = new Set(existing.rows.map((row) => row.title));

    let created = 0;
    let skipped = 0;

    for (const starter of STARTERS) {
      if (existingTitles.has(starter.title)) {
        console.log(`  skip (exists): ${starter.title}`);
        skipped += 1;
        continue;
      }

      if (dryRun) {
        console.log(`  would create [${starter.nickname}]: ${starter.title}`);
        created += 1;
        continue;
      }

      await client.query(
        `insert into public.discussion_threads
          (id, author_id, title, body, is_anonymous, anonymous_label)
         values ($1, $2, $3, $4, true, $5)`,
        [randomUUID(), authorId, starter.title, starter.body, starter.nickname],
      );
      console.log(`  created [${starter.nickname}]: ${starter.title}`);
      created += 1;
    }

    console.log(`\nDone: ${created} created, ${skipped} skipped (already exist).`);
  } finally {
    await client.end();
  }
}

async function seedViaRest(env) {
  const supabase = createClient(env.url, env.key, { auth: { persistSession: false } });
  const authorId = await resolveAuthorIdRest(supabase, env.vars);
  console.log(`Target: ${targetProd ? "PROD" : "DEV"} (${env.url}) [rest]`);
  console.log(`Author: ${authorId}${dryRun ? " [dry-run]" : ""}`);

  const { data: existing, error: listErr } = await supabase.from("discussion_threads").select("title");
  if (listErr) throw new Error(listErr.message);

  const existingTitles = new Set((existing ?? []).map((row) => row.title));
  let created = 0;
  let skipped = 0;

  for (const starter of STARTERS) {
    if (existingTitles.has(starter.title)) {
      console.log(`  skip (exists): ${starter.title}`);
      skipped += 1;
      continue;
    }

    const row = {
      id: randomUUID(),
      author_id: authorId,
      title: starter.title,
      body: starter.body,
      is_anonymous: true,
      anonymous_label: starter.nickname,
    };

    if (dryRun) {
      console.log(`  would create [${starter.nickname}]: ${starter.title}`);
      created += 1;
      continue;
    }

    const { error } = await supabase.from("discussion_threads").insert(row);
    if (error) {
      console.error(`  FAIL: ${starter.title} — ${error.message}`);
      continue;
    }
    console.log(`  created [${starter.nickname}]: ${starter.title}`);
    created += 1;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped (already exist).`);
}

async function main() {
  const env = loadEnv();
  if (env.vars.DB_PASSWORD) {
    await seedViaPostgres(env);
    return;
  }
  await seedViaRest(env);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
