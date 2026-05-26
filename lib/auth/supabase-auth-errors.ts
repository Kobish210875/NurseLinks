export const EMAIL_RATE_LIMIT_ERROR = "email-rate-limit";

export function normalizeSupabaseAuthError(message: string) {
  const normalized = message.toLowerCase();

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
