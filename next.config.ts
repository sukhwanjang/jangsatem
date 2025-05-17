import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ESLint 에러가 있어도 빌드 막지 않음
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 필요시 추가 옵션 여기에...
};

export default nextConfig;
