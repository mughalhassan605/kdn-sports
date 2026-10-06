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
        headers: [{ key: "X-Robots-Tag", value: "noimageindex" }],
      },
    ];
  },
};

export default nextConfig;
