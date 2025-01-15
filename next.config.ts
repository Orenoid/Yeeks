import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/Yeeks',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
