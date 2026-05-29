const HEBREW_NIKUD = /[\u0591-\u05C7]/g;
const SEPARATORS = /[\s\u00A0._\-*~|/\\]+/g;
const NON_LETTER = /[^\p{L}\p{N}]/gu;

/** Prepare text for substring matching against the word list. */
export function normalizeForModeration(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(HEBREW_NIKUD, "")
    .replace(SEPARATORS, " ")
    .replace(NON_LETTER, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptForModeration(text: string, maxLen = 280): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLen) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLen - 1)}…`;
}
