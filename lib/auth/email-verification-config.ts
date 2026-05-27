/**
 * Set AUTH_REQUIRE_EMAIL_VERIFICATION=false in .env.local for testing
 * (instant sign-up without email link). Keep enabled in production.
 *
 * Also disable "Confirm email" in Supabase:
 * Authentication → Providers → Email.
 */
export function isEmailVerificationRequired() {
  return process.env.AUTH_REQUIRE_EMAIL_VERIFICATION !== "false";
}
