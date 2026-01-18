import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@beak-gaming/ui',
    '@beak-gaming/theme',
    '@beak-gaming/auth',
  ],
};

export default nextConfig;
