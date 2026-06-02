#!/usr/bin/env node
/**
 * Writes dev Supabase keys into .env.local (localhost only).
 * Called by clone-prod-to-dev.ps1 or: node scripts/apply-dev-env.mjs --dev-ref ...
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    out[name] = args[i + 1] ?? "";
    i++;
  }
  return out;
}

const {
  "dev-ref": devRef,
  "dev-url": devUrl,
  "dev-anon": devAnon,
  "dev-service": devService,
} = parseArgs();

if (!devRef || !devUrl || !devAnon || !devService) {
  console.error("Usage: node scripts/apply-dev-env.mjs --dev-ref REF --dev-url URL --dev-anon KEY --dev-service KEY");
  process.exit(1);
}

const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.error(".env.local not found");
  process.exit(1);
}

let text = readFileSync(envPath, "utf8");

const replacements = {
  NEXT_PUBLIC_APP_ENV: "development",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: devUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: devAnon,
  SUPABASE_SERVICE_ROLE_KEY: devService,
  AUTH_REQUIRE_EMAIL_VERIFICATION: "false",
};

for (const [key, value] of Object.entries(replacements)) {
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) {
    text = text.replace(re, `${key}=${value}`);
  } else {
    text += `\n${key}=${value}`;
  }
}

const marker = "# --- Supabase (DEV project";
if (!text.includes(marker)) {
  text = text.replace(
    /# --- Supabase[\s\S]*?(?=\n# --- |\n*$)/,
    `# --- Supabase (DEV project ${devRef} — cloned from production) ---\n` +
      `NEXT_PUBLIC_SUPABASE_URL=${devUrl}\n` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${devAnon}\n` +
      `SUPABASE_SERVICE_ROLE_KEY=${devService}\n`,
  );
}

writeFileSync(envPath, text, "utf8");
console.log(`Updated .env.local → dev project ${devRef}`);
