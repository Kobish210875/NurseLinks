/** Canonical public site URL for metadata, emails, and OG tags. */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) {
    return configured;
  }
  return "https://nurselinks.net";
}
