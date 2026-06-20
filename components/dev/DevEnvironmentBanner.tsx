import type { AppEnvironment } from "@/lib/env/app-environment";

type DevEnvironmentBannerProps = {
  label: string;
  variant: Extract<AppEnvironment, "development" | "preview">;
};

const variantClasses: Record<DevEnvironmentBannerProps["variant"], string> = {
  development:
    "border-b border-amber-300 bg-amber-100 px-3 py-1.5 text-center text-xs font-semibold text-amber-950",
  preview:
    "border-b border-red-300 bg-red-100 px-3 py-1.5 text-center text-xs font-semibold text-red-950",
};

/** Server-rendered so env banner is in first HTML (not a client LCP delay). */
export default function DevEnvironmentBanner({ label, variant }: DevEnvironmentBannerProps) {
  return (
    <div className={variantClasses[variant]} role="status">
      {label}
    </div>
  );
}
