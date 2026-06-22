import { searchPeopleByNamePrefix } from "@/lib/data/people-search";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const callerIsAdmin = await isCurrentUserAdmin();
  const results = await searchPeopleByNamePrefix(supabase, user.id, q, 8, callerIsAdmin);
  return NextResponse.json({ results });
}
