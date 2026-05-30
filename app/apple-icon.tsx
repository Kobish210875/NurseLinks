import { renderNurseLinksAppIcon } from "@/lib/og/brand-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function Image() {
  return renderNurseLinksAppIcon(180);
}
