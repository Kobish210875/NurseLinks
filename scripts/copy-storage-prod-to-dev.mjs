#!/usr/bin/env node
/**
 * Copies storage objects from production public URLs into the dev project.
 * Usage: node scripts/copy-storage-prod-to-dev.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PROD_REF = "ljfycjqawngzzrahyxsl";
const DEV_REF = "yegxabegsjdklxuvfgvi";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) throw new Error(".env.local not found");
  const vars = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq > 0) vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return vars;
}

const env = loadEnv();
const devBase = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const svc = env.SUPABASE_SERVICE_ROLE_KEY;
if (!devBase || !svc) throw new Error("Missing dev URL or service role in .env.local");

const hdr = { apikey: svc, Authorization: `Bearer ${svc}` };
const pathRe = /\/object\/public\/(.+)$/;

async function uploadFromProd(storagePath) {
  const prodPublic = `https://${PROD_REF}.supabase.co/storage/v1/object/public/${storagePath}`;
  const res = await fetch(prodPublic);
  if (!res.ok) {
    console.log("skip (prod)", storagePath, res.status);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const up = await fetch(`${devBase}/storage/v1/object/${storagePath}`, {
    method: "POST",
    headers: {
      ...hdr,
      "Content-Type": res.headers.get("content-type") || "application/octet-stream",
      "x-upsert": "true",
    },
    body: buf,
  });
  console.log(storagePath, up.status, up.ok ? "ok" : await up.text());
}

function pathsFromRows(rows, field) {
  const out = new Set();
  for (const row of rows) {
    const url = row[field];
    if (!url) continue;
    const m = url.match(pathRe);
    if (m) out.add(m[1].split("?")[0]);
  }
  return out;
}

async function fetchAll(table, field) {
  const res = await fetch(`${devBase}/rest/v1/${table}?select=${field}`, { headers: hdr });
  if (!res.ok) throw new Error(`${table}: ${res.status}`);
  return res.json();
}

const paths = new Set();
for (const [table, field] of [
  ["profiles", "avatar_url"],
  ["posts", "image_url"],
  ["job_applications", "cv_url"],
]) {
  const rows = await fetchAll(table, field);
  for (const p of pathsFromRows(rows, field)) paths.add(p);
}

console.log(`Uploading ${paths.size} storage files to dev...`);
for (const p of paths) {
  await uploadFromProd(p);
}
console.log("Done.");
