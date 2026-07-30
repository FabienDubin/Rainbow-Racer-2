import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the project root. Next infers it from the nearest lockfile walking upward,
    // so a stray package-lock.json in a parent folder silently moves the root and
    // breaks module resolution with "Could not find the module ... in the React
    // Client Manifest". Pinning it makes the dev server immune to that.
    root: __dirname,
  },
};

export default nextConfig;
