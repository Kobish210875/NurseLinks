"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { getPasswordResetCallbackUrl } from "@/lib/auth/reset-password-url";
import { normalizeSupabaseAuthError } from "@/lib/auth/supabase-auth-errors";
import { createClient } from "@/lib/supabase/client";
import RequiredLabel from "@/components/register/RequiredLabel";

const inputClassName =
  "w-full max-w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 md:text-sm";

type ForgotPasswordFormProps = {
  errorMessage?: string | null;
  sent?: boolean;
};

export default function ForgotPasswordForm({ errorMessage, sent: sentFromUrl }: ForgotPasswordFormProps) {
  const t = useT();
  const router = useRouter();
  const emailId = useId();
  const [clientError, setClientError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const displayError = clientError ?? errorMessage;
  const displaySent = sent || sentFromUrl;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);
    setSent(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    if (!email) {
      setClientError(t("login.missing-email"));
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    const siteUrl = configured || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetCallbackUrl(siteUrl),
    });
    setSubmitting(false);

    if (error) {
      const code = normalizeSupabaseAuthError(error.message);
      if (code === "email-rate-limit") {
        setClientError(t("errors.email-rate-limit"));
        return;
      }
      if (code === "missing-email") {
        setClientError(t("login.missing-email"));
        return;
      }
      setClientError(t("errors.network-error"));
      return;
    }

    setSent(true);
    router.replace("/forgot-password?sent=1");
  }

  return (
    <form onSubmit={handleSubmit} className="feed-card w-full max-w-md p-6 text-start">
      <h1 className="mb-1 text-2xl font-bold text-foreground">{t("login.forgotTitle")}</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {t("login.forgotSubtitle")}
      </p>

      {displayError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {displayError}
        </p>
      ) : null}
      {displaySent ? (
        <p className="mb-4 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-foreground">
          {t("login.resetEmailSent")}
        </p>
      ) : null}

      <label className="grid gap-1.5" htmlFor={emailId}>
        <RequiredLabel>{t("register.email")}</RequiredLabel>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          className={inputClassName}
          placeholder="you@example.com"
          dir="ltr"
          autoComplete="email"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? t("login.resetSending") : t("login.sendResetLink")}
      </button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t("login.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
