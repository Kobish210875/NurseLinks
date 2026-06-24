"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import { signIn } from "@/app/login/actions";
import { useId } from "react";
import { useFormStatus } from "react-dom";
import PasswordInput from "@/components/register/PasswordInput";
import RequiredLabel from "@/components/register/RequiredLabel";

const inputClassName =
  "w-full max-w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 md:text-sm";

type LoginFormProps = {
  errorMessage?: string | null;
  successMessage?: string | null;
  defaultEmail?: string;
};

function LoginSubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? t("login.submitting") : t("login.submit")}
    </button>
  );
}

export default function LoginForm({ errorMessage, successMessage, defaultEmail }: LoginFormProps) {
  const t = useT();
  const emailId = useId();
  const passwordId = useId();

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
            defaultValue={defaultEmail}
          />
        </label>

        <label className="grid gap-1.5" htmlFor={passwordId}>
          <RequiredLabel>{t("register.password")}</RequiredLabel>
          <PasswordInput
            id={passwordId}
            name="password"
            autoComplete="current-password"
            onValueChange={() => {}}
          />
        </label>
        <Link
          href="/forgot-password"
          className="-mt-2 w-fit text-sm font-semibold text-primary hover:underline"
        >
          {t("login.forgotPassword")}
        </Link>
      </div>

      <LoginSubmitButton />

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
