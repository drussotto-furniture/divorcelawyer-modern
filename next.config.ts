import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fdkbpedvibbblvrmwaeg.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.divorcelawyer.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'divorcelawyer.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
