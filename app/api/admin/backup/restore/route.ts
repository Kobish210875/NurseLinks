import { NextResponse } from "next/server";
import {
  assertBackupEnvironmentAllowed,
  getWorkflowRefForBackupEnvironment,
} from "@/lib/admin/backup-environment";
import { requireAdmin } from "@/lib/auth/admin";

const GITHUB_REPO = "Kobish210875/NurseLinks";
const RESTORE_WORKFLOW = "restore-backup.yml";

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    return NextResponse.json(
      { error: "GITHUB_PAT env var is not set on this server." },
      { status: 500 },
    );
  }

  const body = (await req.json()) as {
    environment?: string;
    backup_file_path?: string;
    backup_log_id?: string;
  };

  if (!body.backup_file_path) {
    return NextResponse.json(
      { error: "backup_file_path is required" },
      { status: 400 },
    );
  }

  let environment: "dev" | "prod";
  try {
    environment = assertBackupEnvironmentAllowed(body.environment ?? "dev");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "invalid environment" },
      { status: 403 },
    );
  }

  const ghRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${RESTORE_WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        ref: getWorkflowRefForBackupEnvironment(environment),
        inputs: {
          environment,
          backup_file_path: body.backup_file_path,
          backup_log_id: body.backup_log_id ?? "",
          confirm: "RESTORE",
        },
      }),
    },
  );

  if (!ghRes.ok) {
    const text = await ghRes.text().catch(() => "");
    return NextResponse.json(
      { error: `GitHub API error ${ghRes.status}: ${text}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
