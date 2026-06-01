import { NextResponse } from "next/server";
import { getJobsVersion } from "@/lib/data/sync-versions";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const version = await getJobsVersion(supabase, user.id);
  return NextResponse.json({ version });
}
