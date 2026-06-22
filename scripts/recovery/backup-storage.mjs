#!/usr/bin/env node
import { resolve } from "node:path";
import {
  backupStorage,
  loadRecoveryEnv,
  parseArgs,
  writeManifest,
} from "./recovery-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const outDir = resolve(args.out || args._[0] || "");
if (!outDir) {
  console.error("Usage: node scripts/recovery/backup-storage.mjs --out <archive>/storage");
  process.exit(1);
}

const env = loadRecoveryEnv();
const storageManifest = await backupStorage(outDir, env);
writeManifest(outDir, { storage: storageManifest, projectRef: env.projectRef });
console.log("Storage backup done:", outDir);
