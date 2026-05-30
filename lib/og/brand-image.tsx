import { ImageResponse } from "next/og";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

async function loadRubik(weight: 400 | 700) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Rubik:wght@${weight}&display=swap`,
    { next: { revalidate: 60 * 60 * 24 } },
  ).then((res) => res.text());

  const match = css.match(/src: url\((.+)\) format\('(?:opentype|truetype)'\)/);
  if (!match?.[1]) {
    throw new Error(`Rubik ${weight} font URL not found`);
  }

  return fetch(match[1]).then((res) => res.arrayBuffer());
}

function StethoscopeIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}

type BrandImageOptions = {
  width: number;
  height: number;
  titleSize: number;
  subtitleSize: number;
  iconSize: number;
  padding: number;
  subtitle: string;
};

export async function renderNurseLinksBrandImage({
  width,
  height,
  titleSize,
  subtitleSize,
  iconSize,
  padding,
  subtitle,
}: BrandImageOptions) {
  const [rubikRegular, rubikBold] = await Promise.all([loadRubik(400), loadRubik(700)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding,
          background: "linear-gradient(135deg, #1e4f7a 0%, #2b6cb0 55%, #3d7ec4 100%)",
          color: "#ffffff",
          fontFamily: "Rubik",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: width - iconSize - padding * 2 - 48,
          }}
        >
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            NurseLinks
          </div>
          <div
            style={{
              fontSize: subtitleSize,
              fontWeight: 400,
              lineHeight: 1.45,
              opacity: 0.95,
            }}
          >
            {subtitle}
          </div>
          <div
            style={{
              fontSize: Math.round(subtitleSize * 0.82),
              fontWeight: 400,
              opacity: 0.82,
            }}
          >
            nurselinks.net
          </div>
        </div>

        <StethoscopeIcon size={iconSize} />
      </div>
    ),
    {
      width,
      height,
      fonts: [
        { name: "Rubik", data: rubikRegular, weight: 400, style: "normal" },
        { name: "Rubik", data: rubikBold, weight: 700, style: "normal" },
      ],
    },
  );
}

export async function renderNurseLinksAppIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2b6cb0",
        }}
      >
        <StethoscopeIcon size={Math.round(size * 0.58)} />
      </div>
    ),
    { width: size, height: size },
  );
}
