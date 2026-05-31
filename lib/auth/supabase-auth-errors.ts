export const EMAIL_RATE_LIMIT_ERROR = "email-rate-limit";
export const EMAIL_NOT_CONFIRMED_ERROR = "email-not-confirmed";
export const RESET_SESSION_EXPIRED_ERROR = "reset-session-expired";

export function normalizeSupabaseAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed") ||
    normalized.includes("email is not confirmed")
  ) {
    return EMAIL_NOT_CONFIRMED_ERROR;
  }

  if (
    normalized.includes("auth session missing") ||
    normalized.includes("session missing") ||
    normalized.includes("jwt expired") ||
    normalized.includes("invalid refresh token")
  ) {
    return RESET_SESSION_EXPIRED_ERROR;
  }

  if (
    normalized.includes("email rate limit") ||
    normalized.includes("over_email_send_rate_limit") ||
    (normalized.includes("rate limit") && normalized.includes("email")) ||
    normalized.includes("only request this after")
  ) {
    return EMAIL_RATE_LIMIT_ERROR;
  }

  return encodeURIComponent(message);
}
