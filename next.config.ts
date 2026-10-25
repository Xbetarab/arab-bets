import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // removed: not using Docker for deployment, this was breaking Server Actions with next start — see incident 2026-07-04
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        // Restrict embedding and unsafe document features without breaking Next's inline scripts.
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
        ...(process.env.NODE_ENV === "production"
          ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
          : []),
      ],
    }];
  },
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
