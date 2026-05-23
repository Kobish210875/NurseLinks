export type PasswordValidationError =
  | "password-non-english"
  | "password-weak";

const ENGLISH_PASSWORD_PATTERN = /^[\x21-\x7E]+$/;
const HAS_LETTER = /[a-zA-Z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[^a-zA-Z0-9]/;

export function validatePassword(password: string): PasswordValidationError | null {
  if (!ENGLISH_PASSWORD_PATTERN.test(password)) {
    return "password-non-english";
  }

  if (
    password.length < 8 ||
    !HAS_LETTER.test(password) ||
    !HAS_DIGIT.test(password) ||
    !HAS_SPECIAL.test(password)
  ) {
    return "password-weak";
  }

  return null;
}
