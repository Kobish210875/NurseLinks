import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const otpTypes = new Set<EmailOtpType>([
  "recovery",
  "signup",
  "invite",
  "email_change",
  "email",
]);

/** Server-side exchange of Supabase email link tokens → session cookies → reset page. */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") ?? "/reset-password";
  const nextPath = nextParam.startsWith("/") ? nextParam : "/reset-password";

  const failUrl = new URL("/forgot-password?error=reset-link-expired", requestUrl.origin);
  const successUrl = new URL(nextPath, requestUrl.origin);

  const supabase = await createClient();

  if (tokenHash && type && otpTypes.has(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(successUrl);
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(successUrl);
    }
  }

  return NextResponse.redirect(failUrl);
}
