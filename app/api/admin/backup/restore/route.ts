import { NextResponse } from "next/server";
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

  if (!body.environment || !body.backup_file_path) {
    return NextResponse.json(
      { error: "environment and backup_file_path are required" },
      { status: 400 },
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
        ref: "main",
        inputs: {
          environment: body.environment,
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
