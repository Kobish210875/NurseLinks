type NavUnreadDotProps = {
  ariaLabel: string;
};

/** Small indicator beside nav label (does not overlap text). */
export default function NavUnreadDot({ ariaLabel }: NavUnreadDotProps) {
  return (
    <span
      className="inline-block size-2 shrink-0 rounded-full bg-primary"
      aria-label={ariaLabel}
      role="status"
    />
  );
}
