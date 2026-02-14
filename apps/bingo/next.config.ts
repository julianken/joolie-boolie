import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  serverExternalPackages: ["esbuild-wasm"],
  transpilePackages: [
    '@beak-gaming/sync',
    '@beak-gaming/ui',
    '@beak-gaming/theme',
    '@beak-gaming/auth',
    '@beak-gaming/database',
  ],
  turbopack: {
    resolveAlias: {
      '@beak-gaming/database/api': '../../packages/database/src/api/index.ts',
      '@beak-gaming/database/tables': '../../packages/database/src/tables/index.ts',
    },
  },
async rewrites() {
    return [
      { source: "/sw.js", destination: "/serwist/sw.js" },
      { source: "/sw.js.map", destination: "/serwist/sw.js.map" },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

// Bundle analyzer is enabled via ANALYZE=true environment variable
const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withAnalyzer(withSerwist(nextConfig));
