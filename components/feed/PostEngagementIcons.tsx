type IconProps = {
  className?: string;
  filled?: boolean;
};

/** Thumbs-up — NurseLinks like (outline / filled primary blue). */
export function PostLikeIcon({ className = "", filled = false }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      className={className}
      aria-hidden="true"
    >
      {filled ? (
        <path
          fill="currentColor"
          d="M9.5 3.75c-.55 0-1 .45-1 1v7.25H5.75c-.97 0-1.75.78-1.75 1.75v1.5c0 2.35 1.9 4.25 4.25 4.25h5.9c1.55 0 2.95-.85 3.65-2.2l2.35-4.7c.35-.7.55-1.5.55-2.3V8.5c0-1.65-1.35-3-3-3h-3.35c-.55 0-1-.45-1-1 0-1.1-.9-2-2-2h-.2Z"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.5 4.25V12H6.5a1.75 1.75 0 0 0-1.75 1.75v1.5c0 2.35 1.9 4.25 4.25 4.25h5.9c1.55 0 2.95-.85 3.65-2.2l2.35-4.7c.35-.7.55-1.5.55-2.3V9c0-1.65-1.35-3-3-3H9.5v-1.75c0-1.1-.9-2-2-2s-2 .9-2 2Z"
        />
      )}
    </svg>
  );
}

/** Rounded chat bubble with reply tail. */
export function PostCommentIcon({ className = "" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 6.5a3.5 3.5 0 0 1 3.5-3.5h7A3.5 3.5 0 0 1 19 6.5v5.5a3.5 3.5 0 0 1-3.5 3.5H11l-3.5 3v-3H8.5A3.5 3.5 0 0 1 5 12V6.5Z" />
      <circle cx="9.25" cy="10" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="14.75" cy="10" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Send link to colleague (plane + link ring). */
export function PostShareIcon({ className = "" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.5 12 19 5.5 14.5 19l-2.2-5.3L4.5 12Z" />
      <circle cx="18" cy="18" r="2.75" />
      <path d="M16.6 16.6 13.5 13.5" />
    </svg>
  );
}

export function formatEngagementCount(value: number): string {
  if (value < 1_000) {
    return String(value);
  }
  if (value < 1_000_000) {
    const k = value / 1000;
    return k >= 10 ? `${Math.round(k)}K` : `${k.toFixed(1).replace(/\.0$/, "")}K`;
  }
  const m = value / 1_000_000;
  return m >= 10 ? `${Math.round(m)}M` : `${m.toFixed(1).replace(/\.0$/, "")}M`;
}
