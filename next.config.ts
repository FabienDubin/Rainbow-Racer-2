import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Fix for multiple lockfiles warning - explicitly set the project root
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
