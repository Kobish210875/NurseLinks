"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import PasswordInput from "@/components/register/PasswordInput";
import RequiredLabel from "@/components/register/RequiredLabel";
import { normalizeSupabaseAuthError } from "@/lib/auth/supabase-auth-errors";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/validation/password";

export default function ProfileChangePasswordSection() {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resolveAuthErrorCode(code: string) {
    if (code === "password-mismatch") return t("login.passwordMismatch");
    if (code.startsWith("password-")) return t(`errors.${code}`);
    if (code === "reset-session-expired") return t("profile.changePasswordSessionExpired");
    try {
      return decodeURIComponent(code);
    } catch {
      return code;
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "").trim();
    const passwordConfirm = String(formData.get("passwordConfirm") ?? "").trim();

    if (!password || !passwordConfirm) {
      setError(t("login.missing-password"));
      return;
    }

    if (password !== passwordConfirm) {
      setError(t("login.passwordMismatch"));
      return;
    }

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setError(t(`errors.${passwordValidation}`));
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setSubmitting(false);
      setError(t("profile.changePasswordSessionExpired"));
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setSubmitting(false);
      setError(resolveAuthErrorCode(normalizeSupabaseAuthError(updateError.message)));
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    router.replace("/login?reset=success");
  }

  return (
    <section className="feed-card mx-auto max-w-xl space-y-4 p-6 text-start">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{t("profile.changePasswordTitle")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t("profile.changePasswordDescription")}
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="grid gap-1.5">
          <RequiredLabel>{t("login.newPassword")}</RequiredLabel>
          <PasswordInput id="profile-new-password" name="password" onValueChange={() => {}} />
        </label>
        <span className="block text-xs text-muted-foreground">{t("register.passwordHint")}</span>

        <label className="grid gap-1.5">
          <RequiredLabel>{t("login.confirmNewPassword")}</RequiredLabel>
          <PasswordInput id="profile-confirm-password" name="passwordConfirm" onValueChange={() => {}} />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t("login.resetSaving") : t("profile.changePasswordSubmit")}
        </button>
      </form>
    </section>
  );
}
