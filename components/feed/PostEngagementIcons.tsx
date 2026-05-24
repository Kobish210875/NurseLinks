/**
 * Social-style engagement icons (generic geometry).
 */

type IconProps = {
  className?: string;
  filled?: boolean;
  size?: number;
};

/** Classic heart — reads clearly at 16–24px (filled = liked). */
const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

function svgProps(size: number, className: string) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    className,
    "aria-hidden": true as const,
  };
}

/** Small heart badge in brand blue (summary row). */
export function PostLikeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`post-like-badge inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--like-heart)] text-white ${className}`}
    >
      <svg {...svgProps(11, "block")}>
        <path fill="currentColor" d={HEART_PATH} />
      </svg>
    </span>
  );
}

/** Heart — outline when idle, filled brand blue when liked. */
export function PostLikeIcon({ className = "", filled = false, size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size, `post-engagement-svg ${filled ? "post-engagement-svg--liked" : ""} ${className}`)}>
      <path
        d={HEART_PATH}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Speech bubble — comment. */
export function PostCommentIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg
      {...svgProps(size, `post-engagement-svg ${className}`)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 3V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Forward arrow — share with a colleague. */
export function PostShareIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg
      {...svgProps(size, `post-engagement-svg ${className}`)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 5l4 4-4 4" />
      <path d="M19 9H9a4 4 0 0 0-4 4v1" />
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
