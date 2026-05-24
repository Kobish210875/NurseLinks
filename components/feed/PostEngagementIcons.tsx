/**
 * Social-style engagement icons (generic geometry).
 */

type IconProps = {
  className?: string;
  filled?: boolean;
  size?: number;
};

/** Hand thumb-up outline (Heroicons 24 — clear at small sizes). */
const THUMB_PATH =
  "M6.633 10.25c.806 0 1.533-.184 2.154-.518l1.847-1.11A2.25 2.25 0 0013.5 6.75V4.5A2.25 2.25 0 0011.25 2.25h-1.5m0 0V1.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V4.5m0 0V6.75m-6 0h12.75c.621 0 1.125.504 1.125 1.125v7.125c0 .621-.504 1.125-1.125 1.125H9.033a2.25 2.25 0 01-2.144-1.556l-.905-2.715m0 0A2.251 2.251 0 005.25 12.75v-1.5c0-.83.672-1.5 1.5-1.5h.878m-3.75 3.75h.008v.008H6.878v-.008z";

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

/** Small blue badge thumb (summary row). */
export function PostLikeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`post-like-badge inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-white ${className}`}
    >
      <svg {...svgProps(11, "block")}>
        <path fill="currentColor" d={THUMB_PATH} />
      </svg>
    </span>
  );
}

/** Thumbs up — action button (outline / filled blue). */
export function PostLikeIcon({ className = "", filled = false, size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size, `post-engagement-svg ${filled ? "post-engagement-svg--liked" : ""} ${className}`)}>
      <path
        d={THUMB_PATH}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.35}
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
