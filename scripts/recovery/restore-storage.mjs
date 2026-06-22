#!/usr/bin/env node
import { resolve } from "node:path";
import { loadRecoveryEnv, parseArgs, restoreStorageAsync } from "./recovery-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const storageDir = resolve(args.dir || args._[0] || "");
if (!storageDir) {
  console.error("Usage: node scripts/recovery/restore-storage.mjs --dir <archive>/storage");
  process.exit(1);
}

const env = loadRecoveryEnv();
await restoreStorageAsync(storageDir, env);
