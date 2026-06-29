"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import { completeAuthCallback } from "@/app/auth/callback/actions";
import { createClient } from "@/lib/supabase/client";
import {
  EMAIL_NOT_CONFIRMED_ERROR,
  NETWORK_ERROR,
  normalizeSupabaseAuthError,
} from "@/lib/auth/supabase-auth-errors";
import { useEffect, useId, useState, type FormEvent } from "react";
import PasswordInput from "@/components/register/PasswordInput";
import RequiredLabel from "@/components/register/RequiredLabel";

const inputClassName =
  "w-full max-w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 md:text-sm";

type LoginFormProps = {
  errorMessage?: string | null;
  successMessage?: string | null;
  defaultEmail?: string;
};

function mapAuthCallbackError(
  error: "auth-callback-failed" | "account-not-found" | "auth-profile-failed",
  t: ReturnType<typeof useT>,
) {
  if (error === "account-not-found") {
    return t("login.accountNotFound");
  }
  if (error === "auth-profile-failed") {
    return t("login.authProfileFailed");
  }
  return t("login.authCallbackFailed");
}

export default function LoginForm({ errorMessage, successMessage, defaultEmail }: LoginFormProps) {
  const t = useT();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [password, setPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  const displayError = clientError ?? errorMessage;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setClientError(t("login.missing-fields"));
      return;
    }

    setClientError(null);
    setPending(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const code = normalizeSupabaseAuthError(error.message);
        if (code === EMAIL_NOT_CONFIRMED_ERROR) {
          setClientError(t("login.emailNotConfirmed").replace("{email}", normalizedEmail));
          return;
        }
        if (code === NETWORK_ERROR) {
          setClientError(t("errors.network-error"));
          return;
        }
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setClientError(t("login.wrongPassword"));
          return;
        }
        try {
          setClientError(decodeURIComponent(code));
        } catch {
          setClientError(t("login.authCallbackFailed"));
        }
        return;
      }

      const result = await completeAuthCallback();
      if (!result.ok) {
        await supabase.auth.signOut({ scope: "local" });
        setClientError(mapAuthCallbackError(result.error, t));
        return;
      }

      // Full navigation ensures auth cookies are visible to middleware on mobile.
      window.location.replace(result.redirectTo);
    } catch {
      setClientError(t("errors.network-error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="feed-card w-full max-w-md p-6 text-start">
      <h1 className="mb-1 text-2xl font-bold text-foreground">{t("login.title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("login.subtitle")}</p>

      {displayError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {displayError}
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="grid gap-1.5" htmlFor={passwordId}>
          <RequiredLabel>{t("register.password")}</RequiredLabel>
          <PasswordInput
            id={passwordId}
            name="password"
            autoComplete="current-password"
            onValueChange={setPassword}
          />
        </label>
        <Link
          href="/forgot-password"
          className="-mt-2 w-fit text-sm font-semibold text-primary hover:underline"
        >
          {t("login.forgotPassword")}
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? t("login.submitting") : t("login.submit")}
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
