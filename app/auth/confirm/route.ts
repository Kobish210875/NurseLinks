import { completeAuthCallback } from "@/app/auth/callback/actions";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

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

function recoveryFailUrl(origin: string) {
  return new URL("/forgot-password?error=reset-link-expired", origin);
}

function clientRecoveryFallbackUrl(requestUrl: URL) {
  const callbackUrl = new URL("/auth/callback", requestUrl.origin);
  callbackUrl.searchParams.set("next", "/reset-password");
  for (const [key, value] of requestUrl.searchParams.entries()) {
    if (key !== "next") {
      callbackUrl.searchParams.set(key, value);
    }
  }
  return callbackUrl;
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
  const isRecovery =
    type === "recovery" || nextPath.startsWith("/reset-password") || flow === "recovery";

  const failUrl =
    flow === "magic-link"
      ? new URL("/login?error=magic-link-invalid", requestUrl.origin)
      : recoveryFailUrl(requestUrl.origin);
  const successUrl = new URL(nextPath, requestUrl.origin);
  let response = NextResponse.redirect(successUrl);
  const supabase = createRouteHandlerClient(request, response);

  if (tokenHash && type && otpTypes.has(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      if (flow === "magic-link") {
        const result = await completeAuthCallback();
        if (!result.ok) {
          await supabase.auth.signOut({ scope: "local" });
          response = NextResponse.redirect(new URL(`/login?error=${result.error}`, requestUrl.origin));
          return response;
        }
        response = NextResponse.redirect(new URL(result.redirectTo, requestUrl.origin));
        return response;
      }
      return response;
    }
    if (flow === "magic-link") {
      return NextResponse.redirect(
        new URL(`/login?error=${classifyOtpFailure(error.message)}`, requestUrl.origin),
      );
    }
    if (isRecovery) {
      return NextResponse.redirect(recoveryFailUrl(requestUrl.origin));
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (flow === "magic-link") {
        const result = await completeAuthCallback();
        if (!result.ok) {
          await supabase.auth.signOut({ scope: "local" });
          response = NextResponse.redirect(new URL(`/login?error=${result.error}`, requestUrl.origin));
          return response;
        }
        response = NextResponse.redirect(new URL(result.redirectTo, requestUrl.origin));
        return response;
      }
      return response;
    }
    if (flow === "magic-link") {
      return NextResponse.redirect(
        new URL(`/login?error=${classifyOtpFailure(error.message)}`, requestUrl.origin),
      );
    }
    if (isRecovery) {
      // PKCE verifier may only exist in the browser — let the client callback retry.
      return NextResponse.redirect(clientRecoveryFallbackUrl(requestUrl));
    }
  }

  if (isRecovery && !tokenHash && !code) {
    return NextResponse.redirect(clientRecoveryFallbackUrl(requestUrl));
  }

  return NextResponse.redirect(failUrl);
}
