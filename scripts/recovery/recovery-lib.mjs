#!/usr/bin/env node
/**
 * Shared helpers for NurseLinks disaster-recovery scripts.
 */
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { pipeline } from "node:stream/promises";

export const STORAGE_BUCKETS = ["avatars", "post-images", "job-applications"];

export function loadRecoveryEnv() {
  const path = resolve(process.cwd(), "env.recovery.local");
  if (!existsSync(path)) {
    throw new Error("env.recovery.local not found. Copy scripts/recovery/env.recovery.example");
  }
  const vars = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq > 0) vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  const base = vars.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = vars.SERVICE_ROLE_KEY;
  const projectRef = vars.PROJECT_REF;
  if (!base || !serviceKey || !projectRef) {
    throw new Error("env.recovery.local needs PROJECT_REF, SUPABASE_URL, SERVICE_ROLE_KEY");
  }
  return {
    ...vars,
    supabaseUrl: base,
    serviceKey,
    projectRef,
    environment: vars.ENVIRONMENT || "prod",
  };
}

function headers(serviceKey, extra = {}) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    ...extra,
  };
}

async function storageRequest(url, serviceKey, init = {}) {
  const res = await fetch(url, { ...init, headers: headers(serviceKey, init.headers) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${init.method || "GET"} ${url} failed (${res.status}): ${text}`);
  }
  return res;
}

export async function listBucketObjects(supabaseUrl, serviceKey, bucket, prefix = "") {
  const objects = [];
  let offset = 0;
  while (true) {
    const res = await storageRequest(
      `${supabaseUrl}/storage/v1/object/list/${bucket}`,
      serviceKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix,
          limit: 100,
          offset,
          sortBy: { column: "name", order: "asc" },
        }),
      },
    );
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const item of batch) {
      const name = item.name || "";
      if (!name) continue;
      const fullPath = prefix ? `${prefix}${name}` : name;
      const isFolder = item.id == null && !name.includes(".");
      if (isFolder) {
        objects.push(...(await listBucketObjects(supabaseUrl, serviceKey, bucket, `${fullPath}/`)));
        continue;
      }
      objects.push({ bucket, name: fullPath, size: item.metadata?.size ?? item.size ?? 0 });
    }
    if (batch.length < 100) break;
    offset += batch.length;
  }
  return objects;
}

export async function downloadObject(supabaseUrl, serviceKey, bucket, name, destPath) {
  mkdirSync(dirname(destPath), { recursive: true });
  const res = await storageRequest(
    `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(name)}`,
    serviceKey,
  );
  await pipeline(res.body, createWriteStream(destPath));
}

export async function uploadObject(supabaseUrl, serviceKey, bucket, name, sourcePath, contentType) {
  const body = readFileSync(sourcePath);
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(name)}`, {
    method: "POST",
    headers: {
      ...headers(serviceKey),
      "Content-Type": contentType || "application/octet-stream",
      "x-upsert": "true",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`upload ${bucket}/${name} failed (${res.status}): ${text}`);
  }
}

function guessContentType(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".gz")) return "application/gzip";
  return "application/octet-stream";
}

export async function backupStorage(outDir, { supabaseUrl, serviceKey }, buckets = STORAGE_BUCKETS) {
  mkdirSync(outDir, { recursive: true });
  const manifest = { buckets: {} };
  for (const bucket of buckets) {
    console.log(`Listing ${bucket}...`);
    const objects = await listBucketObjects(supabaseUrl, serviceKey, bucket);
    manifest.buckets[bucket] = { count: objects.length, bytes: 0 };
    for (const obj of objects) {
      const dest = join(outDir, bucket, obj.name);
      process.stdout.write(`  ${bucket}/${obj.name}\n`);
      await downloadObject(supabaseUrl, serviceKey, bucket, obj.name, dest);
      manifest.buckets[bucket].bytes += statSync(dest).size;
    }
    console.log(`  ${bucket}: ${objects.length} file(s)`);
  }
  return manifest;
}

async function walkFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(full)));
    else files.push(full);
  }
  return files;
}

export async function restoreStorageAsync(storageDir, { supabaseUrl, serviceKey }) {
  if (!existsSync(storageDir)) throw new Error(`Storage dir missing: ${storageDir}`);
  let uploaded = 0;
  for (const bucket of readdirSync(storageDir)) {
    const bucketDir = join(storageDir, bucket);
    if (!statSync(bucketDir).isDirectory()) continue;
    console.log(`Restoring bucket ${bucket}...`);
    for (const full of await walkFiles(bucketDir)) {
      const rel = relative(bucketDir, full).replace(/\\/g, "/");
      await uploadObject(
        supabaseUrl,
        serviceKey,
        bucket,
        rel,
        full,
        guessContentType(rel),
      );
      uploaded += 1;
      if (uploaded % 25 === 0) console.log(`  ${uploaded} files uploaded...`);
    }
  }
  console.log(`Storage restore complete (${uploaded} files).`);
  return uploaded;
}

export function writeManifest(archiveDir, manifest) {
  writeFileSync(join(archiveDir, "manifest.json"), JSON.stringify(manifest, null, 2));
}

export function readManifest(archiveDir) {
  const path = join(archiveDir, "manifest.json");
  if (!existsSync(path)) throw new Error(`manifest.json missing in ${archiveDir}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) args[key] = true;
      else {
        args[key] = next;
        i += 1;
      }
    } else args._.push(token);
  }
  return args;
}
