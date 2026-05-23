/** Hebrew letters (א–ת), spaces, hyphen, apostrophe, geresh/gershayim, period. */
const HEBREW_NAME_CHARS = /^[\u05D0-\u05EA\s\-'׳״.]+$/u;

const MAX_NAME_PART_LEN = 40;

export type HebrewNameValidationError = "empty" | "too-long" | "invalid";

export function validateHebrewNamePart(value: string): HebrewNameValidationError | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "empty";
  }
  if (trimmed.length > MAX_NAME_PART_LEN) {
    return "too-long";
  }
  if (!/[\u05D0-\u05EA]/.test(trimmed)) {
    return "invalid";
  }
  if (/[A-Za-z\u0400-\u04FF]/.test(trimmed)) {
    return "invalid";
  }
  if (!HEBREW_NAME_CHARS.test(trimmed)) {
    return "invalid";
  }
  return null;
}

export function isHebrewPersonalName(value: string): boolean {
  return validateHebrewNamePart(value) === null;
}

export function isHebrewDisplayName(value: string, maxLen = MAX_NAME_PART_LEN * 2 + 1): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) {
    return false;
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 1) {
    return false;
  }
  return parts.every((part) => validateHebrewNamePart(part) === null);
}
