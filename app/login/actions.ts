"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revokeOtherAuthSessions } from "@/lib/auth/single-session";
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
    const message = error.message.toLowerCase();
    if (message.includes("invalid login credentials")) {
      redirect("/login?error=account-not-found");
    }
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const userId = signInData.user?.id;
  if (!userId) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/login?error=account-not-found");
  }

  const profileWithDeletedAt = await supabase
    .from("profiles")
    .select("id, deleted_at")
    .eq("id", userId)
    .maybeSingle<{ id: string; deleted_at: string | null }>();

  if (profileWithDeletedAt.error?.message.toLowerCase().includes("deleted_at")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle<{ id: string }>();

    if (!profile) {
      await supabase.auth.signOut({ scope: "local" });
      redirect("/login?error=account-not-found");
    }
  } else if (!profileWithDeletedAt.data || profileWithDeletedAt.data.deleted_at) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/login?error=account-not-found");
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
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
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
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?reset=success");
}
