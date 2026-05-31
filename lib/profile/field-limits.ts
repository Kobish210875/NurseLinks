export const PROFILE_HEADLINE_MAX_LENGTH = 30;
export const PROFILE_LICENSE_NUMBER_MAX_LENGTH = 9;
export const PROFILE_CV_TEXT_MAX_LENGTH = 2000;

export function truncateHeadline(value: string): string {
  return value.trim().slice(0, PROFILE_HEADLINE_MAX_LENGTH);
}

export function truncateProfileText(value: string): string {
  return value.trim().slice(0, PROFILE_CV_TEXT_MAX_LENGTH);
}
