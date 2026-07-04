import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // removed: not using Docker for deployment, this was breaking Server Actions with next start — see incident 2026-07-04
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gbokwhuvqfciopaubwod.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
