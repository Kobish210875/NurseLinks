import { revokeOtherAuthSessions } from "@/lib/auth/single-session";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") ?? "/home";
  const next = nextParam.startsWith("/") ? nextParam : "/home";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth-callback-failed", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth-callback-failed", requestUrl.origin));
  }

  await revokeOtherAuthSessions(supabase);
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
