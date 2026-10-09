// Asosiy karkas va shriftlar
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Onest } from 'next/font/google';
import '@/styles/globals.css';

const onest = Onest({ subsets: ['latin', 'cyrillic'], variable: '--font-onest', display: 'swap' });

export const metadata: Metadata = {
  title: 'Tayyor & Sweet',
  description: 'Shirinliklar, tortlar va yarim tayyor mahsulotlar — Koreya bo‘ylab 택배',
  icons: { icon: '/images/logo.png' },
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
