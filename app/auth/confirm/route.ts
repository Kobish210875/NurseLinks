import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { completeAuthCallback } from "@/app/auth/callback/actions";

const otpTypes = new Set<EmailOtpType>([
  "recovery",
  "signup",
  "invite",
  "email_change",
  "email",
]);

function classifyOtpFailure(errorMessage: string) {
  const normalized = errorMessage.toLowerCase();
  if (normalized.includes("already been used") || normalized.includes("already used")) {
    return "magic-link-used";
  }
  if (normalized.includes("expired")) {
    return "magic-link-expired";
  }
  return "magic-link-invalid";
}

/** Server-side exchange of Supabase email link tokens → session cookies → reset page. */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const code = requestUrl.searchParams.get("code");
  const flow = requestUrl.searchParams.get("flow");
  const nextParam = requestUrl.searchParams.get("next") ?? "/reset-password";
  const nextPath = nextParam.startsWith("/") ? nextParam : "/reset-password";

  const failUrl =
    flow === "magic-link"
      ? new URL("/login?error=magic-link-invalid", requestUrl.origin)
      : new URL("/forgot-password?error=reset-link-expired", requestUrl.origin);
  const successUrl = new URL(nextPath, requestUrl.origin);

  const supabase = await createClient();

  if (tokenHash && type && otpTypes.has(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      if (flow === "magic-link") {
        const result = await completeAuthCallback();
        if (!result.ok) {
          await supabase.auth.signOut({ scope: "local" });
          return NextResponse.redirect(new URL(`/login?error=${result.error}`, requestUrl.origin));
        }
      }
      return NextResponse.redirect(successUrl);
    }
    if (flow === "magic-link") {
      return NextResponse.redirect(
        new URL(`/login?error=${classifyOtpFailure(error.message)}`, requestUrl.origin),
      );
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (flow === "magic-link") {
        const result = await completeAuthCallback();
        if (!result.ok) {
          await supabase.auth.signOut({ scope: "local" });
          return NextResponse.redirect(new URL(`/login?error=${result.error}`, requestUrl.origin));
        }
      }
      return NextResponse.redirect(successUrl);
    }
    if (flow === "magic-link") {
      return NextResponse.redirect(
        new URL(`/login?error=${classifyOtpFailure(error.message)}`, requestUrl.origin),
      );
    }
  }

  return NextResponse.redirect(failUrl);
}
