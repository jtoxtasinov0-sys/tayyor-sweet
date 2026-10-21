// Asosiy karkas va shriftlar
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Onest } from 'next/font/google';
import '@/styles/globals.css';

const onest = Onest({ subsets: ['latin', 'cyrillic'], variable: '--font-onest', display: 'swap' });

const description = 'Shirinliklar, tortlar va yarim tayyor mahsulotlar — Koreya bo‘ylab 택배';
// Link ulashilganda (Telegram, Instagram, WhatsApp) chiqadigan rasm: public/og.jpg
const ogImage = { url: '/og.jpg', width: 1200, height: 630, alt: 'Tayyor & Sweet' };

export const metadata: Metadata = {
  metadataBase: new URL('https://tayyor-sweet.vercel.app'),
  title: 'Tayyor & Sweet',
  description,
  icons: { icon: '/images/logo.png', apple: '/icons/apple-touch-icon.png?v=2' },
  // iPhone: "Bosh ekranga qo'shish" dan keyin alohida ilova bo'lib ochiladi
  appleWebApp: { capable: true, title: 'Tayyor&Sweet', statusBarStyle: 'default' },
  openGraph: {
    type: 'website',
    siteName: 'Tayyor & Sweet',
    title: 'Tayyor & Sweet 🍰',
    description,
    url: '/',
    locale: 'uz_UZ',
    images: [ogImage],
  },
  twitter: { card: 'summary_large_image', title: 'Tayyor & Sweet 🍰', description, images: [ogImage.url] },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FFF0F7',
};

// Ilovani o'rnatish (PWA): service worker faqat oddiy brauzerda (Telegram ichida emas).
// Chrome/Samsung Internet'ning "o'rnatish" hodisasi sahifa yuklanishida keladi — /ilova uni keyin ishlatadi
const pwaScript = `
addEventListener('beforeinstallprompt', function (e) {
  if (location.pathname.indexOf('/ilova') === 0) e.preventDefault();
  window.__bip = e;
  dispatchEvent(new Event('ts-bip'));
});
if ('serviceWorker' in navigator) addEventListener('load', function () {
  var w = window.Telegram && window.Telegram.WebApp;
  if (!(w && w.initData)) navigator.serviceWorker.register('/sw.js').catch(function () {});
});`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={onest.variable} suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <script dangerouslySetInnerHTML={{ __html: pwaScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
