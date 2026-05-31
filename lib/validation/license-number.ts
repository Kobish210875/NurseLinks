import { PROFILE_LICENSE_NUMBER_MAX_LENGTH } from "@/lib/profile/field-limits";

const nonDigitChars = /\D/g;

export function sanitizeLicenseNumber(value: string): string {
  return value.replace(nonDigitChars, "").slice(0, PROFILE_LICENSE_NUMBER_MAX_LENGTH);
}
