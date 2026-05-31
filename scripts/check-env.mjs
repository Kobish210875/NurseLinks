#!/usr/bin/env node
/**
 * Validates local .env.local points at a dev Supabase project (not production).
 * Usage: npm run check:env
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), ".env.local");

function parseEnvFile(path) {
  if (!existsSync(path)) {
    return null;
  }
  const vars = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    vars[key] = value;
  }
  return vars;
}

const env = parseEnvFile(root);
const errors = [];
const warnings = [];

if (!env) {
  console.error("ERROR: .env.local not found.");
  console.error("Copy .env.example to .env.local and fill in your DEV Supabase keys.");
  process.exit(1);
}

const appEnv = env.NEXT_PUBLIC_APP_ENV?.toLowerCase();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const appUrl = env.NEXT_PUBLIC_APP_URL ?? "";

if (appEnv !== "development" && appEnv !== "dev") {
  errors.push('NEXT_PUBLIC_APP_ENV must be "development" in .env.local');
}

if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
}

if (!supabaseUrl.includes("supabase.co")) {
  errors.push("NEXT_PUBLIC_SUPABASE_URL must be a Supabase project URL");
}

if (appUrl && !appUrl.includes("localhost")) {
  warnings.push(`NEXT_PUBLIC_APP_URL is "${appUrl}" — use http://localhost:3000 for local dev`);
}

if (env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true") {
  warnings.push("AUTH_REQUIRE_EMAIL_VERIFICATION=true — set false on dev for faster testing");
}

console.log("Environment check (.env.local)");
console.log("─".repeat(40));
console.log(`  APP_ENV:      ${appEnv ?? "(not set)"}`);
console.log(`  SUPABASE:     ${supabaseUrl.replace(/https:\/\//, "").split(".")[0] || "(not set)"}...`);
console.log(`  APP_URL:      ${appUrl || "(not set)"}`);

if (warnings.length) {
  console.log("\nWarnings:");
  for (const w of warnings) {
    console.log(`  ⚠ ${w}`);
  }
}

if (errors.length) {
  console.log("\nErrors:");
  for (const e of errors) {
    console.log(`  ✗ ${e}`);
  }
  console.log("\nFix .env.local before running npm run dev.");
  console.log("See docs/DEV-WORKFLOW.md Step 1.");
  process.exit(1);
}

console.log("\n✓ Local dev environment looks correct.");
console.log("  Run: npm run dev");
console.log("  Open: http://localhost:3000");
