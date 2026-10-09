/** @type {import('next').NextConfig} */
const backend = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // /api/* so'rovlari backendga (Render yoki localhost:4000) uzatiladi —
  // mini ilova va API bitta domenda bo'ladi, CORS kerak emas
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
