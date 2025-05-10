/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // ✅ 그냥 true로만 써야 함 (객체 ❌)
  images: {
    domains: ['your-project-id.supabase.co'], // ✅ supabase public URL 도메인 넣어야 함
  },
};

export default nextConfig;
