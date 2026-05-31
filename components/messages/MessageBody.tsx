import LinkifiedText from "@/components/ui/LinkifiedText";

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
  return (
    <LinkifiedText
      text={body}
      className="whitespace-pre-wrap break-words"
      linkClassName={linkClass(isMine)}
    />
  );
}
