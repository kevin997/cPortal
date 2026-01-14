declare module "next-pwa" {
  import { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    skipWaiting?: boolean;
    runtimeCaching?: unknown[];
    publicExcludes?: string[];
    buildExcludes?: (string | RegExp)[];
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    cacheOnFrontEndNav?: boolean;
    reloadOnOnline?: boolean;
    customWorkerDir?: string;
    customWorkerSrc?: string;
    customWorkerDest?: string;
    customWorkerPrefix?: string;
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}
