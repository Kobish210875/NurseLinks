/**
 * Custom engagement icons (Feather-style geometry, MIT — not Meta/IG assets).
 * @see https://github.com/feathericons/feather
 */

type IconProps = {
  className?: string;
  filled?: boolean;
};

const SVG_BASE = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  width: 24,
  height: 24,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Thumbs up — outline; filled with brand blue when liked. */
export function PostLikeIcon({ className = "", filled = false }: IconProps) {
  if (filled) {
    return (
      <svg
        {...SVG_BASE}
        className={`post-engagement-svg post-engagement-svg--liked ${className}`}
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          stroke="none"
          d="M14 8.5V5.2a2.8 2.8 0 0 0-5.2-1.2L4.5 11.8V20h7.1a1.9 1.9 0 0 0 1.85-1.45l.76-3.8a1.9 1.9 0 0 0-1.85-2.35H14V8.5Z"
        />
        <path
          fill="currentColor"
          stroke="none"
          d="M4.5 11.8V20H3.2a1.7 1.7 0 0 1-1.7-1.7v-5.2a1.7 1.7 0 0 1 1.7-1.7h1.3Z"
        />
      </svg>
    );
  }

  return (
    <svg
      {...SVG_BASE}
      className={`post-engagement-svg ${className}`}
      aria-hidden="true"
    >
      <path d="M14 9V5a3 3 0 0 0-5.6-1.4L4 12v8h7.5a2 2 0 0 0 1.94-1.515l.81-4.046A2 2 0 0 0 14.47 14H14V9z" />
      <path d="M4 12v8H3a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h1" />
    </svg>
  );
}

/** Speech bubble — comment. */
export function PostCommentIcon({ className = "" }: IconProps) {
  return (
    <svg
      {...SVG_BASE}
      className={`post-engagement-svg ${className}`}
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

/** Send — share link with a colleague (not repost). */
export function PostShareIcon({ className = "" }: IconProps) {
  return (
    <svg
      {...SVG_BASE}
      className={`post-engagement-svg ${className}`}
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4 20-7z" />
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
