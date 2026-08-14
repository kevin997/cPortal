import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Present only to silence Next 16's hard error about next-pwa injecting a
  // webpack config. It does NOT make the PWA plugin run: next-pwa is
  // webpack-only, Next 16 defaults to Turbopack, and under Turbopack no sw.js
  // is emitted -- which is why PWAUpdatePrompt's register("/sw.js") 404s in
  // production. The build script passes --webpack to actually generate it.
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
};

const config = withPWA({
  dest: "public",
  register: false,
  skipWaiting: false,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);

export default config;
