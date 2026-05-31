"use server";

import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/site-url";
import { confirmUserEmail } from "@/lib/auth/confirm-user-email";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification-config";
import { findAuthUserByEmail } from "@/lib/auth/find-auth-user-by-email";
import { ensureAuthUserProfile } from "@/lib/auth/ensure-auth-user-profile";
import { revokeOtherAuthSessions } from "@/lib/auth/single-session";
import { normalizeSupabaseAuthError } from "@/lib/auth/supabase-auth-errors";
import { validatePassword } from "@/lib/validation/password";
import { createClient } from "@/lib/supabase/server";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(formData: FormData) {
  const email = getRequiredString(formData, "email").toLowerCase();
  const password = getRequiredString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=login-missing-fields");
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const normalizedError = normalizeSupabaseAuthError(error.message);
    if (normalizedError === "email-not-confirmed") {
      if (!isEmailVerificationRequired()) {
        const existingUser = await findAuthUserByEmail(email);
        if (existingUser && !existingUser.email_confirmed_at) {
          await confirmUserEmail(existingUser.id);
          const retry = await supabase.auth.signInWithPassword({ email, password });
          if (!retry.error && retry.data.user) {
            const profileStatus = await ensureAuthUserProfile(supabase, retry.data.user);
            if (profileStatus === "ok") {
              await revokeOtherAuthSessions(supabase);
              redirect("/home");
            }
          }
        }
      }
      redirect("/login?error=email-not-confirmed");
    }

    const message = error.message.toLowerCase();
    if (message.includes("invalid login credentials")) {
      const existingUser = await findAuthUserByEmail(email);
      if (!existingUser) {
        redirect("/login?error=account-not-found");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("deleted_at")
        .eq("id", existingUser.id)
        .maybeSingle<{ deleted_at: string | null }>();

      if (profile?.deleted_at) {
        redirect("/login?error=account-not-found");
      }

      redirect("/login?error=wrong-password");
    }
    redirect(`/login?error=${normalizedError}`);
  }

  const user = signInData.user;
  if (!user?.id) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/login?error=account-not-found");
  }

  const profileStatus = await ensureAuthUserProfile(supabase, user);
  if (profileStatus === "deleted") {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/login?error=account-not-found");
  }
  if (profileStatus === "failed") {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/login?error=auth-profile-failed");
  }

  await revokeOtherAuthSessions(supabase);

  redirect("/home");
}

export async function requestPasswordReset(formData: FormData) {
  const email = getRequiredString(formData, "email").toLowerCase();

  if (!email) {
    redirect("/forgot-password?error=missing-email");
  }

  const siteUrl = getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${normalizeSupabaseAuthError(error.message)}`);
  }

  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = getRequiredString(formData, "password");
  const passwordConfirm = getRequiredString(formData, "passwordConfirm");
  const passwordError = validatePassword(password);

  if (!password || !passwordConfirm) {
    redirect("/reset-password?error=missing-password");
  }

  if (password !== passwordConfirm) {
    redirect("/reset-password?error=password-mismatch");
  }

  if (passwordError) {
    redirect(`/reset-password?error=${passwordError}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/reset-password?error=reset-session-expired");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${normalizeSupabaseAuthError(error.message)}`);
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?reset=success");
}
