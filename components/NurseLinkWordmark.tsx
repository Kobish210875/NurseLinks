import LogoIcon from "@/components/LogoIcon";

export default function NurseLinkWordmark({
  className = "",
  textClassName = "",
  iconClassName = "size-[0.9em] shrink-0 text-primary",
}: {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
}) {
  return (
    <span dir="ltr" lang="en" className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={textClassName} aria-hidden="true">
        NurseLinks
      </span>
      <LogoIcon className={iconClassName} />
    </span>
  );
}
