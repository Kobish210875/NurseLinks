/** True when discussion tables are missing or PostgREST schema cache is stale. */
export function isDiscussionsNotConfigured(message: string, code?: string | null) {
  const normalizedCode = code?.toUpperCase() ?? "";
  const lower = message.toLowerCase();

  if (normalizedCode === "PGRST205" || normalizedCode === "42P01") {
    return true;
  }

  if (lower.includes("could not find the table") && lower.includes("discussion")) {
    return true;
  }

  if (lower.includes("relation") && lower.includes("does not exist") && lower.includes("discussion")) {
    return true;
  }

  return false;
}
