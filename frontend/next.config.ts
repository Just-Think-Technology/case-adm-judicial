import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Backend is source of truth — frontend never talks to DB/storage directly
  async rewrites() {
    return [
      // In local dev without Caddy, proxy /api to backend directly
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
