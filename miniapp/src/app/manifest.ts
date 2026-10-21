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
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
