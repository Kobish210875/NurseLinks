const nonDigitChars = /\D/g;

export function sanitizeLicenseNumber(value: string): string {
  return value.replace(nonDigitChars, "");
}
