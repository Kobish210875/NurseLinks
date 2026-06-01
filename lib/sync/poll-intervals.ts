import { isProductionApp } from "@/lib/env/app-environment";

/** Polling when the browser tab is visible (keeps Supabase load reasonable). */
const prod = isProductionApp();

export const POLL_FEED_MS = prod ? 60_000 : 15_000;
export const POLL_MESSAGES_MS = prod ? 45_000 : 10_000;
export const POLL_NAV_MS = prod ? 30_000 : 12_000;
export const POLL_JOBS_MS = prod ? 60_000 : 15_000;

/** Min time between full-page router.refresh() from version polling. */
export const VERSION_REFRESH_MIN_MS = prod ? 45_000 : 15_000;
