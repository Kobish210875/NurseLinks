import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Job application CV uploads allow up to 5MB; default Next.js limit is 1MB.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
