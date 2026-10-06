import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
          // Derivatives keep their names: a day fresh, then revalidated in the background.
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
