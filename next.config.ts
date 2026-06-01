import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Job application CV uploads allow up to 5MB; default Next.js limit is 1MB.
      bodySizeLimit: "6mb",
    },
    // Keep dynamic-page RSC payloads in the client router cache for 30s.
    // Without this, navigating back to /network re-fetches from the server every time.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
