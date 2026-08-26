import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

const backendOrigin = BACKEND_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (backendOrigin.startsWith("http")) {
      return [
        {
          source: "/api/:path*",
          destination: `${backendOrigin}/api/:path*`,
        },
        {
          source: "/uploads/:path*",
          destination: `${backendOrigin}/uploads/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
