export const JOB_TITLE_MAX_LENGTH = 30;
export const JOB_BODY_MAX_LENGTH = 100;

export function truncateJobTitle(value: string): string {
  return value.trim().slice(0, JOB_TITLE_MAX_LENGTH);
}

export function truncateJobBody(value: string): string {
  return value.trim().slice(0, JOB_BODY_MAX_LENGTH);
}
