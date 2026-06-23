"use client";

import { useEffect, useRef, useState } from "react";

type Liker = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
};

type PostLikersPopupProps = {
  apiUrl: string;
  likeCount: number;
  children: React.ReactNode;
};

export default function PostLikersPopup({ apiUrl, likeCount, children }: PostLikersPopupProps) {
  const [open, setOpen] = useState(false);
  const [likers, setLikers] = useState<Liker[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [openUpward, setOpenUpward] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedForUrl = useRef<string | null>(null);

  function prefetch() {
    if (fetchedForUrl.current === apiUrl) return;
    fetchedForUrl.current = apiUrl;
    fetch(apiUrl)
      .then((res) => (res.ok ? (res.json() as Promise<{ likers?: Liker[] }>) : null))
      .then((data) => setLikers(data?.likers ?? []))
      .catch(() => setLikers([]));
  }

  function handleMouseEnter() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    prefetch();
    openTimerRef.current = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setOpenUpward(window.innerHeight - rect.bottom < 220);
      }
      setOpen(true);
    }, 300);
  }

  function handleMouseLeave() {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOpen(false), 200);
  }

  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Reset cache when apiUrl or likeCount changes so the list stays fresh after toggling a like
  useEffect(() => {
    fetchedForUrl.current = null;
    setLikers(null);
  }, [apiUrl, likeCount]);

  if (likeCount === 0) return <>{children}</>;

  const showPopup = open && likers !== null && likers.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {showPopup ? (
        <ul
          role="tooltip"
          className={`absolute right-0 z-50 min-w-[10rem] max-w-[18rem] overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {likers.map((liker) => (
            <li key={liker.userId}>
              <a
                href={`/profile/${liker.userId}`}
                className="block truncate px-3 py-1 text-xs text-gray-800 hover:bg-gray-100"
              >
                {liker.fullName}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
