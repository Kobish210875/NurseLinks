"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const emailOtpTypes = new Set<EmailOtpType>(["recovery", "email", "signup", "invite", "email_change"]);

type ResetPasswordSessionGateProps = {
  children: React.ReactNode;
};

export default function ResetPasswordSessionGate({ children }: ResetPasswordSessionGateProps) {
  const t = useT();
  const [status, setStatus] = useState<"loading" | "ready" | "no-session">("loading");

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const search = new URLSearchParams(window.location.search);
      const code = search.get("code");
      const tokenHash = search.get("token_hash");
      const typeParam = search.get("type");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      } else if (window.location.hash.length > 1) {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            window.history.replaceState(null, "", window.location.pathname);
          }
        }
      } else if (tokenHash && typeParam && emailOtpTypes.has(typeParam as EmailOtpType)) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: typeParam as EmailOtpType,
        });
        if (!error) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      setStatus(session?.user ? "ready" : "no-session");
    })();
  }, []);

  if (status === "loading") {
    return (
      <p className="text-sm text-muted-foreground">{t("login.resetSessionLoading")}</p>
    );
  }

  if (status === "no-session") {
    return (
      <div className="feed-card w-full max-w-md p-6 text-start">
        <h1 className="mb-2 text-2xl font-bold text-foreground">{t("login.resetTitle")}</h1>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          {t("login.resetSessionExpired")}
        </p>
        <Link
          href="/forgot-password"
          className="btn-primary inline-block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
        >
          {t("login.sendResetLink")}
        </Link>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t("login.backToLogin")}
          </Link>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
