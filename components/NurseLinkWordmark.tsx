import LogoIcon from "@/components/LogoIcon";

export default function NurseLinkWordmark({
  className = "",
  textClassName = "",
  iconClassName = "shrink-0 text-primary",
}: {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
}) {
  return (
    <span dir="ltr" lang="en" className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`text-base font-semibold leading-none ${textClassName}`} aria-hidden="true">
        NurseLinks
      </span>
      <LogoIcon className={iconClassName} />
    </span>
  );
}
