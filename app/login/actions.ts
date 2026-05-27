"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
      redirect("/login?error=email-not-confirmed");
    }

    const message = error.message.toLowerCase();
    if (message.includes("invalid login credentials")) {
      redirect("/login?error=account-not-found");
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

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${normalizeSupabaseAuthError(error.message)}`);
  }

  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = getRequiredString(formData, "password");
  const passwordError = validatePassword(password);

  if (!password) {
    redirect("/reset-password?error=missing-password");
  }

  if (passwordError) {
    redirect(`/reset-password?error=${passwordError}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${normalizeSupabaseAuthError(error.message)}`);
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?reset=success");
}
