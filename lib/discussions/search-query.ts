/** Escape `%`, `_`, `\` for safe use inside PostgREST ilike patterns. */
export function escapeDiscussionIlikePattern(input: string) {
  return input.replace(/[%_\\]/g, (char) => `\\${char}`);
}

export function normalizeDiscussionSearchQuery(raw: string | undefined | null) {
  const trimmed = raw?.trim() ?? "";
  return trimmed.length > 0 ? trimmed.slice(0, 80) : "";
}
