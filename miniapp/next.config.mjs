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
  // Service worker yangilanishi telefonlarga darhol yetib borishi uchun keshlanmaydi
  async headers() {
    return [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }];
  },
};

export default nextConfig;
