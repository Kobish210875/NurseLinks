/** Resend "from" header — ensures NurseLinks display name when only an address is configured. */
export function notificationsFromEmail(): string | undefined {
  const raw = process.env.NOTIFICATIONS_FROM_EMAIL?.trim();
  if (!raw) {
    return undefined;
  }
  if (raw.includes("<")) {
    return raw;
  }
  return `NurseLinks <${raw}>`;
}
