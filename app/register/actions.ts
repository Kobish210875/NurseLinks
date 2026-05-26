"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeSupabaseAuthError } from "@/lib/auth/supabase-auth-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateHebrewNamePart } from "@/lib/validation/hebrew-name";
import { validatePassword } from "@/lib/validation/password";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getSupabaseConfigError() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return "missing-supabase-env";
  }

  if (url.includes("your-project-ref") || anonKey === "your-anon-key") {
    return "invalid-supabase-env";
  }

  return null;
}

export async function signUp(formData: FormData) {
  const firstName = getRequiredString(formData, "firstName");
  const lastName = getRequiredString(formData, "lastName");
  const fullName = `${firstName} ${lastName}`.trim();
  const email = getRequiredString(formData, "email").toLowerCase();
  const password = getRequiredString(formData, "password");
  const profession =
    getRequiredString(formData, "profession") || getRequiredString(formData, "headline");

  if (!firstName || !lastName || !email || !password) {
    redirect("/register?error=missing-fields");
  }

  if (validateHebrewNamePart(firstName) || validateHebrewNamePart(lastName)) {
    redirect("/register?error=invalid-hebrew-name");
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    redirect(`/register?error=${passwordError}`);
  }

  const supabaseConfigError = getSupabaseConfigError();
  if (supabaseConfigError) {
    redirect(`/register?error=${supabaseConfigError}`);
  }

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();

  const signUpResult = await (async () => {
    try {
      return await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/home`,
          data: {
            full_name: fullName,
            headline: profession || null,
          },
        },
      });
    } catch {
      return { error: new Error("supabase-connection-failed") };
    }
  })();

  if (signUpResult.error) {
    const message = signUpResult.error.message.toLowerCase();
    if (message.includes("already registered") || message.includes("already been registered")) {
      redirect("/register?error=email-already-registered");
    }

    const errorMessage =
      signUpResult.error.message === "supabase-connection-failed"
        ? "supabase-connection-failed"
        : normalizeSupabaseAuthError(signUpResult.error.message);
    redirect(`/register?error=${errorMessage}`);
  }

  const identities = signUpResult.data?.user?.identities;
  if (identities && identities.length === 0) {
    redirect("/register?error=email-already-registered");
  }

  const userId = signUpResult.data?.user?.id;
  const admin = createAdminClient();
  if (userId && admin) {
    await admin.from("profiles").upsert(
      [
        {
          id: userId,
          full_name: fullName,
          headline: profession || null,
        },
      ] as never,
      { onConflict: "id" },
    );
  }

  redirect("/register?success=check-email");
}
