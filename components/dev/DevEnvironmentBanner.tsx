type DevEnvironmentBannerProps = {
  label: string;
};

/** Server-rendered so dev banner is in first HTML (not a client LCP delay). */
export default function DevEnvironmentBanner({ label }: DevEnvironmentBannerProps) {
  return (
    <div
      className="border-b border-amber-300 bg-amber-100 px-3 py-1.5 text-center text-xs font-semibold text-amber-950"
      role="status"
    >
      {label}
    </div>
  );
}
