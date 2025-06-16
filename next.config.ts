import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile ESM packages that ship uncompiled code
  transpilePackages: [
    "react-big-calendar"
  ]
};

export default nextConfig;
