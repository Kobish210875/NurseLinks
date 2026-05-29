import { normalizeForModeration } from "@/lib/moderation/normalize";
import { MODERATION_PHRASES, MODERATION_TERMS } from "@/lib/moderation/wordlist";

export type ModerationScanResult = {
  flagged: boolean;
  matchedTerm: string | null;
};

export function scanTextForModeration(text: string): ModerationScanResult {
  const normalized = normalizeForModeration(text);
  if (!normalized) {
    return { flagged: false, matchedTerm: null };
  }

  for (const phrase of MODERATION_PHRASES) {
    const needle = normalizeForModeration(phrase);
    if (needle.length >= 2 && normalized.includes(needle)) {
      return { flagged: true, matchedTerm: phrase };
    }
  }

  for (const term of MODERATION_TERMS) {
    const needle = normalizeForModeration(term);
    if (needle.length >= 2 && normalized.includes(needle)) {
      return { flagged: true, matchedTerm: term };
    }
  }

  return { flagged: false, matchedTerm: null };
}
