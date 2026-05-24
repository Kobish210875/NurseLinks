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

function linkClass(isMine: boolean) {
  return isMine
    ? "font-medium underline decoration-primary-foreground/50 underline-offset-2 hover:decoration-primary-foreground"
    : "font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary";
}

type MessageBodyProps = {
  body: string;
  isMine: boolean;
};

/** Renders message text with clickable URLs; post share links open the feed post. */
export default function MessageBody({ body, isMine }: MessageBodyProps) {
  const parts = body.split(URL_SPLIT_RE).filter((part) => part.length > 0);

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (!/^https?:\/\//i.test(part)) {
          return <span key={index}>{part}</span>;
        }

        const postId = postIdFromUrl(part);
        if (postId) {
          return (
            <Link
              key={index}
              href={`/home#post-${postId}`}
              className={linkClass(isMine)}
            >
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
            className={linkClass(isMine)}
          >
            {part}
          </a>
        );
      })}
    </span>
  );
}
