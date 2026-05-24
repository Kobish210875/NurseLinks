/** Canonical public URL for sharing a feed post (always production site, not preview deploy). */
export function postShareUrl(postId: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://nurselinks.vercel.app";
  return `${base}/home#post-${postId}`;
}
