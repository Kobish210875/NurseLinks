type NavUnreadDotProps = {
  ariaLabel: string;
  className?: string;
};

/** Small unread indicator for nav labels and tabs. */
export default function NavUnreadDot({ ariaLabel, className = "" }: NavUnreadDotProps) {
  return (
    <span
      className={`inline-block size-2.5 shrink-0 rounded-full bg-primary ring-2 ring-white ${className}`.trim()}
      aria-label={ariaLabel}
      role="status"
    />
  );
}
