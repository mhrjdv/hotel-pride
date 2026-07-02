import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1:3000', 'localhost:3000'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wogaznwixkywbdkppqxs.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
