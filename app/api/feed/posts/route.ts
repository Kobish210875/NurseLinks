import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { FEED_PAGE_SIZE, getFeedPage } from "@/lib/data/feed";
import { getLocale } from "@/lib/i18n/get-locale";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : FEED_PAGE_SIZE;

  const supabase = await createClient();
  const locale = await getLocale();
  const page = await getFeedPage(supabase, user.id, locale, {
    cursor,
    limit,
  });

  return NextResponse.json(page);
}
