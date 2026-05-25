"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import { signIn } from "@/app/login/actions";
import PasswordInput from "@/components/register/PasswordInput";
import RequiredLabel from "@/components/register/RequiredLabel";

const inputClassName =
  "w-full max-w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 md:text-sm";

type LoginFormProps = {
  errorMessage?: string | null;
  successMessage?: string | null;
};

export default function LoginForm({ errorMessage, successMessage }: LoginFormProps) {
  const t = useT();

  return (
    <form action={signIn} className="feed-card w-full max-w-md p-6 text-start">
      <h1 className="mb-1 text-2xl font-bold text-foreground">{t("login.title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("login.subtitle")}</p>

      {errorMessage ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="mb-4 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-foreground">
          {successMessage}
        </p>
      ) : null}

      <div className="grid gap-4">
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

        <label className="grid gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <RequiredLabel>{t("register.password")}</RequiredLabel>
            <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
              {t("login.forgotPassword")}
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            onValueChange={() => {}}
          />
        </label>
      </div>

      <button
        type="submit"
        className="btn-primary mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground"
      >
        {t("login.submit")}
      </button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          {t("feed.joinFree")}
        </Link>
      </p>

      <p className="mt-2 text-center text-sm text-muted-foreground">
        <Link href="/" className="font-semibold text-primary hover:underline">
          {t("login.backToLanding")}
        </Link>
      </p>
    </form>
  );
}
