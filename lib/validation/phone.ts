/** Israeli mobile: 05xxxxxxxx or 5xxxxxxxx (9 digits after 5). */
export function isValidIsraeliMobile(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("05")) {
    return true;
  }
  if (digits.length === 9 && digits.startsWith("5")) {
    return true;
  }
  return false;
}

export function normalizeIsraeliMobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("05")) {
    return digits;
  }
  if (digits.length === 9 && digits.startsWith("5")) {
    return `0${digits}`;
  }
  return phone.trim();
}
