import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ✅ swcMinify는 삭제! → Next 15에서 경고 없이 동작
};

export default nextConfig;
