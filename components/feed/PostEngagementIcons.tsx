/**
 * Social-style engagement icons (generic geometry, MIT-compatible).
 */

type IconProps = {
  className?: string;
  filled?: boolean;
  size?: number;
};

function svgProps(size: number, className: string) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={11} height={11} aria-hidden="true">
        <path
          fill="currentColor"
          d="M9.2 2.8V5a2 2 0 0 0-3.7-.9L3 8.5v5.5h4.6a1.4 1.4 0 0 0 1.36-1.06l.5-2.5A1.4 1.4 0 0 0 8.5 9H9.2V2.8Z"
        />
        <path
          fill="currentColor"
          d="M3 8.5V14H2.1A1.2 1.2 0 0 1 1 12.8V9.2A1.2 1.2 0 0 1 2.1 8h.9Z"
        />
      </svg>
    </span>
  );
}

/** Thumbs up — action button (outline / filled blue). */
export function PostLikeIcon({ className = "", filled = false, size = 20 }: IconProps) {
  if (filled) {
    return (
      <svg {...svgProps(size, `post-engagement-svg post-engagement-svg--liked ${className}`)}>
        <path
          fill="currentColor"
          stroke="none"
          d="M14 9V5a3 3 0 0 0-5.6-1.4L4 12v8h7.5a2 2 0 0 0 1.94-1.515l.81-4.046A2 2 0 0 0 14.47 14H14V9z"
        />
        <path
          fill="currentColor"
          stroke="none"
          d="M4 12v8H3a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h1"
        />
      </svg>
    );
  }

  return (
    <svg {...svgProps(size, `post-engagement-svg ${className}`)}>
      <path d="M14 9V5a3 3 0 0 0-5.6-1.4L4 12v8h7.5a2 2 0 0 0 1.94-1.515l.81-4.046A2 2 0 0 0 14.47 14H14V9z" />
      <path d="M4 12v8H3a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h1" />
    </svg>
  );
}

/** Speech bubble — comment. */
export function PostCommentIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg {...svgProps(size, `post-engagement-svg ${className}`)}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 3V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Forward arrow — share with a colleague. */
export function PostShareIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg {...svgProps(size, `post-engagement-svg ${className}`)}>
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
