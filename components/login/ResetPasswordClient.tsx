"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import PasswordInput from "@/components/register/PasswordInput";
import RequiredLabel from "@/components/register/RequiredLabel";
import { normalizeSupabaseAuthError } from "@/lib/auth/supabase-auth-errors";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/validation/password";
import type { EmailOtpType } from "@supabase/supabase-js";

const emailOtpTypes = new Set<EmailOtpType>([
  "recovery",
  "email",
  "signup",
  "invite",
  "email_change",
]);

type ResetPasswordClientProps = {
  serverError?: string | null;
};

type Phase = "loading" | "form" | "expired";

export default function ResetPasswordClient({ serverError }: ResetPasswordClientProps) {
  const t = useT();
  const router = useRouter();
  const passwordId = useId();
  const passwordConfirmId = useId();
  const [phase, setPhase] = useState<Phase>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      let recoveryFromEvent = false;
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          recoveryFromEvent = true;
        }
      });

      const search = new URLSearchParams(window.location.search);
      const code = search.get("code");
      const tokenHash = search.get("token_hash");
      const typeParam = search.get("type");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState(null, "", window.location.pathname);
      } else if (window.location.hash.length > 1) {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          window.history.replaceState(null, "", window.location.pathname);
        }
      } else if (tokenHash && typeParam && emailOtpTypes.has(typeParam as EmailOtpType)) {
        await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: typeParam as EmailOtpType,
        });
        window.history.replaceState(null, "", window.location.pathname);
      }

      subscription.unsubscribe();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setEmail(session.user.email ?? null);
        setPhase("form");
        return;
      }

      if (recoveryFromEvent) {
        const retry = await supabase.auth.getSession();
        if (retry.data.session?.user) {
          setEmail(retry.data.session.user.email ?? null);
          setPhase("form");
          return;
        }
      }

      setPhase("expired");
    })();
  }, []);

  function resolveAuthErrorCode(code: string) {
    if (code === "missing-password") return t("login.missing-password");
    if (code === "password-mismatch") return t("login.passwordMismatch");
    if (code === "reset-session-expired") return t("login.resetSessionExpired");
    if (code.startsWith("password-")) return t(`errors.${code}`);
    if (code === "email-rate-limit") return t("errors.email-rate-limit");
    try {
      return decodeURIComponent(code);
    } catch {
      return code;
    }
  }

  const displayError = clientError ?? serverError ?? null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "").trim();
    const passwordConfirm = String(formData.get("passwordConfirm") ?? "").trim();

    if (!password || !passwordConfirm) {
      setClientError(t("login.missing-password"));
      return;
    }

    if (password !== passwordConfirm) {
      setClientError(t("login.passwordMismatch"));
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setClientError(t(`errors.${passwordError}`));
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setSubmitting(false);
      setPhase("expired");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitting(false);
      const normalized = normalizeSupabaseAuthError(error.message);
      setClientError(resolveAuthErrorCode(normalized));
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    router.replace("/login?reset=success");
  }

  if (phase === "loading") {
    return (
      <p className="text-sm text-muted-foreground">{t("login.resetSessionLoading")}</p>
    );
  }

  if (phase === "expired") {
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

  return (
    <form
      onSubmit={handleSubmit}
      className="feed-card w-full max-w-md p-6 text-start"
    >
      <h1 className="mb-1 text-2xl font-bold text-foreground">{t("login.resetTitle")}</h1>
      <p className="mb-2 text-sm leading-relaxed text-muted-foreground">
        {t("login.resetSubtitle")}
      </p>
      {email ? (
        <p className="mb-6 text-sm font-medium text-foreground" dir="ltr">
          {email}
        </p>
      ) : (
        <div className="mb-6" />
      )}

      {displayError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {displayError}
        </p>
      ) : null}

      <label className="grid gap-1.5" htmlFor={passwordId}>
        <RequiredLabel>{t("login.newPassword")}</RequiredLabel>
        <PasswordInput
          id={passwordId}
          name="password"
          onValueChange={() => {}}
        />
      </label>
      <span className="mt-2 block text-xs text-muted-foreground">{t("register.passwordHint")}</span>

      <label className="mt-4 grid gap-1.5" htmlFor={passwordConfirmId}>
        <RequiredLabel>{t("login.confirmNewPassword")}</RequiredLabel>
        <PasswordInput
          id={passwordConfirmId}
          name="passwordConfirm"
          onValueChange={() => {}}
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {submitting ? t("login.resetSaving") : t("login.updatePassword")}
      </button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t("login.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
