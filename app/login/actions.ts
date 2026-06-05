"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_SIGN_IN_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";
import { isTimeoutError, withTimeout } from "@/lib/async/with-timeout";
import { getPasswordResetCallbackUrl } from "@/lib/auth/reset-password-url";
import { getSiteUrl } from "@/lib/site-url";
import { confirmUserEmail } from "@/lib/auth/confirm-user-email";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification-config";
import { findAuthUserByEmail } from "@/lib/auth/find-auth-user-by-email";
import { ensureAuthUserProfile } from "@/lib/auth/ensure-auth-user-profile";
import { revokeOtherAuthSessions } from "@/lib/auth/single-session";
import { normalizeSupabaseAuthError } from "@/lib/auth/supabase-auth-errors";
import { validatePassword } from "@/lib/validation/password";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAGIC_LINK_WINDOW_MS = 15 * 60 * 1000;
const MAGIC_LINK_MAX_REQUESTS = 5;
const MAGIC_LINK_COOLDOWN_MS = 60 * 1000;

type MagicLinkRateBucket = {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
};

function getMagicLinkRateStore() {
  const globalWithStore = globalThis as typeof globalThis & {
    __magicLinkRateStore?: Map<string, MagicLinkRateBucket>;
  };
  if (!globalWithStore.__magicLinkRateStore) {
    globalWithStore.__magicLinkRateStore = new Map<string, MagicLinkRateBucket>();
  }
  return globalWithStore.__magicLinkRateStore;
}

function getClientIp(rawForwardedFor: string | null, rawRealIp: string | null) {
  if (rawForwardedFor) {
    const [first] = rawForwardedFor.split(",");
    if (first?.trim()) {
      return first.trim();
    }
  }
  if (rawRealIp?.trim()) {
    return rawRealIp.trim();
  }
  return "unknown";
}

function isMagicLinkRateLimited(key: string, now = Date.now()) {
  const store = getMagicLinkRateStore();
  for (const [storeKey, bucket] of store.entries()) {
    if (now - bucket.firstAttemptAt > MAGIC_LINK_WINDOW_MS * 2) {
      store.delete(storeKey);
    }
  }
  const current = store.get(key);
  if (!current) {
    store.set(key, { count: 1, firstAttemptAt: now, lastAttemptAt: now });
    return false;
  }

  if (now - current.lastAttemptAt < MAGIC_LINK_COOLDOWN_MS) {
    current.lastAttemptAt = now;
    store.set(key, current);
    return true;
  }

  if (now - current.firstAttemptAt > MAGIC_LINK_WINDOW_MS) {
    store.set(key, { count: 1, firstAttemptAt: now, lastAttemptAt: now });
    return false;
  }

  const nextCount = current.count + 1;
  store.set(key, {
    count: nextCount,
    firstAttemptAt: current.firstAttemptAt,
    lastAttemptAt: now,
  });
  return nextCount > MAGIC_LINK_MAX_REQUESTS;
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function requestMagicLink(formData: FormData) {
  const email = getRequiredString(formData, "email").toLowerCase();
  if (!email) {
    redirect("/login?error=missing-email");
  }

  const requestHeaders = await headers();
  const ip = getClientIp(
    requestHeaders.get("x-forwarded-for"),
    requestHeaders.get("x-real-ip"),
  );
  const limiterKey = `${ip}:${email}`;
  if (isMagicLinkRateLimited(limiterKey)) {
    redirect("/login?error=email-rate-limit");
  }

  const siteUrl = getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${siteUrl}/auth/confirm?flow=magic-link&next=/home`,
    },
  });

  if (error) {
    redirect(`/login?error=${normalizeSupabaseAuthError(error.message)}`);
  }

  redirect("/login?sent=magic-link");
}

export async function signIn(formData: FormData) {
  const email = getRequiredString(formData, "email").toLowerCase();
  const password = getRequiredString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=login-missing-fields");
  }

  const supabase = await createClient();

  let signInData;
  let error;
  try {
    ({ data: signInData, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      AUTH_SIGN_IN_TIMEOUT_MS,
    ));
  } catch (signInTimeout) {
    if (isTimeoutError(signInTimeout)) {
      redirect("/login?error=network-error");
    }
    throw signInTimeout;
  }

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
      // findAuthUserByEmail requires the service-role admin client.
      // If it is not configured (e.g. missing SUPABASE_SERVICE_ROLE_KEY in dev),
      // we cannot distinguish "user not found" from "wrong password", so fall
      // back to the generic wrong-password message rather than misleading the user.
      const admin = createAdminClient();
      if (!admin) {
        redirect("/login?error=wrong-password");
      }

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
    redirectTo: getPasswordResetCallbackUrl(siteUrl),
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
