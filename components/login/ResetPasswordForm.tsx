"use client";

import Link from "next/link";
import { updatePassword } from "@/app/login/actions";
import { useT } from "@/components/i18n/LocaleProvider";
import PasswordInput from "@/components/register/PasswordInput";
import RequiredLabel from "@/components/register/RequiredLabel";

type ResetPasswordFormProps = {
  errorMessage?: string | null;
};

export default function ResetPasswordForm({ errorMessage }: ResetPasswordFormProps) {
  const t = useT();

  return (
    <form action={updatePassword} className="feed-card w-full max-w-md p-6 text-start">
      <h1 className="mb-1 text-2xl font-bold text-foreground">{t("login.resetTitle")}</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {t("login.resetSubtitle")}
      </p>

      {errorMessage ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <label className="grid gap-1.5">
        <RequiredLabel>{t("login.newPassword")}</RequiredLabel>
        <PasswordInput id="new-password" name="password" onValueChange={() => {}} />
      </label>
      <span className="mt-2 block text-xs text-muted-foreground">{t("register.passwordHint")}</span>

      <button
        type="submit"
        className="btn-primary mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground"
      >
        {t("login.updatePassword")}
      </button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t("login.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
