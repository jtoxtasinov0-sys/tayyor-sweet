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
  icons: { icon: '/images/logo.png', apple: '/images/logo.png' },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={onest.variable} suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
