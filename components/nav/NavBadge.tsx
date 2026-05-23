type NavBadgeProps = {
  count: number;
  ariaLabel: string;
};

export default function NavBadge({ count, ariaLabel }: NavBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      className="absolute -top-1 end-0 flex min-w-[1.125rem] -translate-y-0.5 translate-x-1/4 items-center justify-center rounded-full border-2 border-nav-bg bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
      aria-label={ariaLabel}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
