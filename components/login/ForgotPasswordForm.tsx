"use client";

import Link from "next/link";
import { requestPasswordReset } from "@/app/login/actions";
import { useT } from "@/components/i18n/LocaleProvider";
import RequiredLabel from "@/components/register/RequiredLabel";

const inputClassName =
  "w-full max-w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 md:text-sm";

type ForgotPasswordFormProps = {
  errorMessage?: string | null;
  sent?: boolean;
};

export default function ForgotPasswordForm({ errorMessage, sent }: ForgotPasswordFormProps) {
  const t = useT();

  return (
    <form action={requestPasswordReset} className="feed-card w-full max-w-md p-6 text-start">
      <h1 className="mb-1 text-2xl font-bold text-foreground">{t("login.forgotTitle")}</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {t("login.forgotSubtitle")}
      </p>

      {errorMessage ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {sent ? (
        <p className="mb-4 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-foreground">
          {t("login.resetEmailSent")}
        </p>
      ) : null}

      <label className="grid gap-1.5">
        <RequiredLabel>{t("register.email")}</RequiredLabel>
        <input
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
        className="btn-primary mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground"
      >
        {t("login.sendResetLink")}
      </button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t("login.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
