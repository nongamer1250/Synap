import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow large file uploads for transcription
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
  // Increase API route body size limit
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
