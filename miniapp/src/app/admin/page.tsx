import type { Metadata } from 'next';
import AdminApp from '@/components/admin/AdminApp';
import '@/styles/admin.css';

// Bosh ekranga alohida ilova bo'lib qo'shiladi: o'z nomi va "Admin" yozuvli ikonkasi bilan
export const metadata: Metadata = {
  title: 'Admin · Tayyor & Sweet',
  robots: { index: false },
  manifest: '/admin.webmanifest',
  icons: { icon: '/images/logo.png', apple: '/icons/admin-apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Tayyor Admin', statusBarStyle: 'default' },
};

export default function AdminPage() {
  return <AdminApp />;
}
