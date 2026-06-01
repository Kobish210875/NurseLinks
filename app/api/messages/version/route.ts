import { NextResponse } from "next/server";
import { getMessagesVersion } from "@/lib/data/sync-versions";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const peerId = new URL(request.url).searchParams.get("peerId") ?? undefined;
  const version = await getMessagesVersion(supabase, user.id, peerId || undefined);

  return NextResponse.json({ version });
}
