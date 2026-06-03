/**
 * Prefer IPv4 for outbound requests (Supabase, etc.) on Windows where IPv6
 * routes can cause intermittent "fetch failed" from Node / Next.js.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
