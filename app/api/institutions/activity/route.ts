import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getInstitutionActivityForUser } from "@/lib/data/institution-activity";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const activity = await getInstitutionActivityForUser(supabase, user.id);

  return NextResponse.json({ activity });
}
