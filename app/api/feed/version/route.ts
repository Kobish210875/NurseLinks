import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFeedVersion } from "@/lib/data/feed";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const version = await getFeedVersion(supabase);
  return NextResponse.json({ version });
}
