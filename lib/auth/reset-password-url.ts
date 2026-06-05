import { getSiteUrl } from "@/lib/site-url";

/** Where Supabase sends the user after a reset link (ConfirmationURL / PKCE fallback). */
export function getPasswordResetCallbackUrl(siteUrl = getSiteUrl()) {
  return `${siteUrl}/auth/callback?next=/reset-password`;
}

/** Direct token_hash link for the Reset password email template (works across browsers). */
export function getPasswordResetConfirmUrl(siteUrl = getSiteUrl()) {
  return `${siteUrl}/auth/confirm?type=recovery&next=/reset-password`;
}
