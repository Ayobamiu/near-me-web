import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable trailing slash redirects to prevent redirect loops
  trailingSlash: false,
  // Ensure API routes work consistently across browsers
  async redirects() {
    return [];
  },
};

export default nextConfig;
