import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Empty turbopack config to allow webpack config from next-pwa
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
};

const config = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);

export default config;
