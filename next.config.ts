import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // The dev server only answers its own hostname unless told otherwise.
  allowedDevOrigins: ["192.168.*.*", "*.local"],
  // Originals are read from /media-src by the download route, never from /public.
  outputFileTracingIncludes: {
    "/api/download/[id]": ["./media-src/**/*"],
  },
  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noimageindex" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
