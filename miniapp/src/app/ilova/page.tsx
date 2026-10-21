// Ilovani telefonga o'rnatish sahifasi — bot shu linkni yuboradi
import type { Metadata } from 'next';
import { InstallGuide } from '@/components/features/InstallGuide';
import '@/styles/install.css';

// Sarlavha umumiy ("Tayyor & Sweet") qoladi — iPhone "Ulashish" oynasida shu nom chiqadi
export const metadata: Metadata = {
  description: 'Tayyor & Sweet do‘konini iPhone yoki Samsung telefoningiz bosh ekraniga o‘rnating',
};

export default function Page() {
  return <InstallGuide />;
}
