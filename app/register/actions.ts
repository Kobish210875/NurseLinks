"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { confirmUserEmail } from "@/lib/auth/confirm-user-email";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification-config";
import { ensureAuthUserProfile } from "@/lib/auth/ensure-auth-user-profile";
import { findAuthUserByEmail } from "@/lib/auth/find-auth-user-by-email";
import { revokeOtherAuthSessions } from "@/lib/auth/single-session";
import {
  EMAIL_RATE_LIMIT_ERROR,
  normalizeSupabaseAuthError,
} from "@/lib/auth/supabase-auth-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateHebrewNamePart } from "@/lib/validation/hebrew-name";
import { validatePassword } from "@/lib/validation/password";
import { truncateHeadline } from "@/lib/profile/field-limits";

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

function isEmailRateLimitError(message: string) {
  return normalizeSupabaseAuthError(message) === EMAIL_RATE_LIMIT_ERROR;
}

async function upsertProfileForUser(
  userId: string,
  fullName: string,
  profession: string,
) {
  const admin = createAdminClient();
  if (!admin) {
    return;
  }

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

async function finishRegistrationAndEnter(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string,
  password: string,
  fullName: string,
  profession: string,
) {
  await upsertProfileForUser(userId, fullName, profession);
  await confirmUserEmail(userId);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError || !signInData.user) {
      redirect("/login?error=auth-profile-failed");
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=auth-profile-failed");
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

function redirectAfterRegistration(
  hint?: "existing-unverified" | "rate-limit",
) {
  if (hint === "rate-limit") {
    redirect("/register?success=check-email&hint=rate-limit");
  }
  if (hint === "existing-unverified") {
    redirect("/register?success=check-email&hint=existing");
  }
  redirect("/register?success=check-email");
}

export async function signUp(formData: FormData) {
  const firstName = getRequiredString(formData, "firstName");
  const lastName = getRequiredString(formData, "lastName");
  const fullName = `${firstName} ${lastName}`.trim();
  const email = getRequiredString(formData, "email").toLowerCase();
  const password = getRequiredString(formData, "password");
  const profession = truncateHeadline(
    getRequiredString(formData, "profession") || getRequiredString(formData, "headline"),
  );
  const requireEmailVerification = isEmailVerificationRequired();

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
  const existingUser = await findAuthUserByEmail(email);
  const supabase = await createClient();

  if (existingUser?.email_confirmed_at) {
    redirect("/register?error=email-already-registered");
  }

  if (existingUser && !existingUser.email_confirmed_at) {
    await upsertProfileForUser(existingUser.id, fullName, profession);
    if (!requireEmailVerification) {
      await finishRegistrationAndEnter(
        supabase,
        existingUser.id,
        email,
        password,
        fullName,
        profession,
      );
    }
    redirectAfterRegistration("existing-unverified");
  }

  const signUpResult = await (async () => {
    try {
      return await supabase.auth.signUp({
        email,
        password,
        options: {
          ...(requireEmailVerification
            ? { emailRedirectTo: `${origin}/auth/callback?flow=signup` }
            : {}),
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
      if (!requireEmailVerification) {
        const user = await findAuthUserByEmail(email);
        if (user) {
          await finishRegistrationAndEnter(
            supabase,
            user.id,
            email,
            password,
            fullName,
            profession,
          );
        }
      }
      redirectAfterRegistration("existing-unverified");
    }

    if (isEmailRateLimitError(signUpResult.error.message)) {
      const userAfterLimit = (await findAuthUserByEmail(email)) ?? existingUser;
      if (userAfterLimit) {
        await upsertProfileForUser(userAfterLimit.id, fullName, profession);
        if (!requireEmailVerification) {
          await finishRegistrationAndEnter(
            supabase,
            userAfterLimit.id,
            email,
            password,
            fullName,
            profession,
          );
        }
        redirectAfterRegistration("rate-limit");
      }
      redirect("/register?error=email-rate-limit");
    }

    const errorMessage =
      signUpResult.error.message === "supabase-connection-failed"
        ? "supabase-connection-failed"
        : normalizeSupabaseAuthError(signUpResult.error.message);
    redirect(`/register?error=${errorMessage}`);
  }

  const identities = signUpResult.data?.user?.identities;
  if (identities && identities.length === 0) {
    if (!requireEmailVerification) {
      const user = await findAuthUserByEmail(email);
      if (user) {
        await finishRegistrationAndEnter(
          supabase,
          user.id,
          email,
          password,
          fullName,
          profession,
        );
      }
    }
    redirectAfterRegistration("existing-unverified");
  }

  const userId = signUpResult.data?.user?.id;
  if (!userId) {
    redirect("/register?error=missing-fields");
  }

  if (!requireEmailVerification) {
    await finishRegistrationAndEnter(supabase, userId, email, password, fullName, profession);
  }

  await upsertProfileForUser(userId, fullName, profession);
  redirectAfterRegistration();
}
