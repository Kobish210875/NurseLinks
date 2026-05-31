import Link from "next/link";

const URL_SPLIT_RE = /(https?:\/\/[^\s]+)/g;
const POST_HASH_RE = /#post-([0-9a-f-]{36})/i;
const POST_PATH_RE = /\/home#post-([0-9a-f-]{36})/i;

function postIdFromUrl(url: string): string | null {
  const hash = url.match(POST_HASH_RE);
  if (hash) {
    return hash[1];
  }
  const path = url.match(POST_PATH_RE);
  return path ? path[1] : null;
}

export type LinkifiedTextProps = {
  text: string;
  className?: string;
  linkClassName?: string;
};

/** Renders plain text with clickable http(s) URLs; internal post links open on the feed. */
export default function LinkifiedText({
  text,
  className,
  linkClassName = "font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary",
}: LinkifiedTextProps) {
  const parts = text.split(URL_SPLIT_RE).filter((part) => part.length > 0);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!/^https?:\/\//i.test(part)) {
          return <span key={index}>{part}</span>;
        }

        const postId = postIdFromUrl(part);
        if (postId) {
          return (
            <Link key={index} href={`/home#post-${postId}`} className={linkClassName}>
              {part}
            </Link>
          );
        }

        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {part}
          </a>
        );
      })}
    </span>
  );
}
