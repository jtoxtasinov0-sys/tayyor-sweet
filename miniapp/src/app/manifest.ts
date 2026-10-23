// PWA manifest (/manifest.webmanifest): telefonga "ilova" sifatida o'rnatish uchun
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Tayyor & Sweet',
    // Bosh ekrandagi yozuv — 12 belgidan oshsa telefon qisqartiradi
    short_name: 'Tayyor&Sweet',
    description: 'Shirinliklar, tortlar va yarim tayyor mahsulotlar — Koreya bo‘ylab 택배',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFF0F7',
    theme_color: '#FFF0F7',
    lang: 'uz',
    // Android Chrome: sahifa ilova telefonda allaqachon o'rnatilganini bilishi uchun (getInstalledRelatedApps)
    related_applications: [{ platform: 'webapp', url: '/manifest.webmanifest' }],
    icons: [
      { src: '/icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
