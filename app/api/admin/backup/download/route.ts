import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getBackupDownloadUrl } from "@/lib/admin/backups";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");
  if (!filePath) {
    return NextResponse.json({ error: "missing path" }, { status: 400 });
  }

  const { url, error } = await getBackupDownloadUrl(filePath);
  if (error || !url) {
    return NextResponse.json({ error: error ?? "not found" }, { status: 404 });
  }

  return NextResponse.json({ url });
}
