import { revokeOtherAuthSessions } from "@/lib/auth/single-session";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { ensureAuthUserProfile } from "@/lib/auth/ensure-auth-user-profile";
import { createClient } from "@/lib/supabase/server";

const emailOtpTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const typeParam = requestUrl.searchParams.get("type");
  const nextParam = requestUrl.searchParams.get("next") ?? "/home";
  const next = nextParam.startsWith("/") ? nextParam : "/home";

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/login?error=auth-callback-failed", requestUrl.origin));
  }

  const supabase = await createClient();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=auth-callback-failed", requestUrl.origin));
    }
  } else if (tokenHash && typeParam && emailOtpTypes.has(typeParam as EmailOtpType)) {
    const type = typeParam as EmailOtpType;
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      return NextResponse.redirect(new URL("/login?error=auth-callback-failed", requestUrl.origin));
    }
  } else {
    return NextResponse.redirect(new URL("/login?error=auth-callback-failed", requestUrl.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=auth-callback-failed", requestUrl.origin));
  }

  const profileStatus = await ensureAuthUserProfile(supabase, user);
  if (profileStatus === "deleted") {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(new URL("/login?error=account-not-found", requestUrl.origin));
  }
  if (profileStatus === "failed") {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(new URL("/login?error=auth-profile-failed", requestUrl.origin));
  }

  await revokeOtherAuthSessions(supabase);
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
