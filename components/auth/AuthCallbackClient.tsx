"use client";

import { completeAuthCallback } from "@/app/auth/callback/actions";
import { useT } from "@/components/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const emailOtpTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "recovery",
  "email_change",
  "email",
]);

function isRecoverableCallbackError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already been used") ||
    normalized.includes("already used") ||
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("code verifier")
  );
}

function isSignupFlow(search: URLSearchParams) {
  const flow = search.get("flow");
  const next = search.get("next") ?? "";
  return flow === "signup" || next === "/login" || next.startsWith("/login?");
}

function isRecoveryFlow(search: URLSearchParams) {
  const flow = search.get("flow");
  const next = search.get("next") ?? "";
  return flow === "recovery" || next.startsWith("/reset-password");
}

export default function AuthCallbackClient() {
  const t = useT();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const search = new URLSearchParams(window.location.search);
      const signupFlow = isSignupFlow(search);
      const recoveryFlow = isRecoveryFlow(search);
      const nextParam = search.get("next") ?? (recoveryFlow ? "/reset-password" : "/home");
      const next = nextParam.startsWith("/") ? nextParam : "/home";

      if (search.get("error")) {
        router.replace(signupFlow ? "/login?verified=1" : "/login?error=auth-callback-failed");
        return;
      }

      const code = search.get("code");
      const tokenHash = search.get("token_hash");
      const typeParam = search.get("type");
      let exchangeError: { message: string } | null = null;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        exchangeError = error;
      } else if (window.location.hash.length > 1) {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          exchangeError = error;
        }
      } else if (tokenHash && typeParam && emailOtpTypes.has(typeParam as EmailOtpType)) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: typeParam as EmailOtpType,
        });
        exchangeError = error;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        if (recoveryFlow) {
          window.location.replace(next);
          return;
        }

        const result = await completeAuthCallback();
        if (!result.ok) {
          await supabase.auth.signOut({ scope: "local" });
          router.replace(`/login?error=${result.error}`);
          return;
        }

        if (signupFlow) {
          await supabase.auth.signOut({ scope: "local" });
          router.replace("/login?verified=1");
          return;
        }

        window.location.replace(next);
        return;
      }

      if (signupFlow && exchangeError && isRecoverableCallbackError(exchangeError.message)) {
        router.replace("/login?verified=1");
        return;
      }

      if (recoveryFlow && exchangeError && isRecoverableCallbackError(exchangeError.message)) {
        router.replace("/forgot-password?error=reset-link-expired");
        return;
      }

      if (!code && !tokenHash && window.location.hash.length <= 1) {
        if (recoveryFlow) {
          router.replace("/forgot-password?error=reset-link-expired");
          return;
        }
        router.replace(signupFlow ? "/login?verified=1" : "/login?error=auth-callback-failed");
        return;
      }

      if (exchangeError) {
        if (recoveryFlow) {
          router.replace("/forgot-password?error=reset-link-expired");
          return;
        }
        router.replace(signupFlow ? "/login?verified=1" : "/login?error=auth-callback-failed");
        return;
      }

      setStatus("error");
      if (recoveryFlow) {
        router.replace("/forgot-password?error=reset-link-expired");
        return;
      }
      router.replace(signupFlow ? "/login?verified=1" : "/login?error=auth-callback-failed");
    })();
  }, [router]);

  return (
    <div className="feed-page flex min-h-screen items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">
        {status === "loading" ? t("login.callbackLoading") : t("login.authCallbackFailed")}
      </p>
    </div>
  );
}
