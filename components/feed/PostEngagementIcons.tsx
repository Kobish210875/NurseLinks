/**
 * Social-style engagement icons (generic geometry).
 */

type IconProps = {
  className?: string;
  filled?: boolean;
  size?: number;
};

/** Classic thumb silhouette (reads clearly at small sizes). */
const THUMB_PATH =
  "M2 21h4V9H2v12zm4-12c0-1.1.9-2 2-2h1V5c0-1.66 1.34-3 3-3s3 1.34 3 3v2h3.5c.82 0 1.5.67 1.5 1.5v6.9l-1.85 5.55c-.2.6-.74 1.05-1.35 1.05H6V9z";

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
        stroke={filled ? "none" : "currentColor"}
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
