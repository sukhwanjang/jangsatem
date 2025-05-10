import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true, // ✅ 경고 없이 허용되는 형식
};

export default nextConfig;
