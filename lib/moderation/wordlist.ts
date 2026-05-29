/**
 * Starter word list for auto-flagging (admin queue only — content is still published).
 *
 * Expand with terms your team approves. Keep entries lowercase; matching uses
 * normalization (no nikud, collapsed spaces, stripped punctuation).
 *
 * @see lib/moderation/README.md
 */

/** Single words or stems — matched as substrings after normalization. */
export const MODERATION_TERMS: readonly string[] = [
  // הוסיפו מונחים בעברית, לדוגמה:
  // "מונח",
];

/** Multi-word phrases — matched as substrings after normalization. */
export const MODERATION_PHRASES: readonly string[] = [
  // הוסיפו ביטויים שלמים, לדוגמה:
  // "ביטוי שלם",
];
