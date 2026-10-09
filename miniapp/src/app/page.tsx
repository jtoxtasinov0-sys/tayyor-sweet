'use client';
// Bosh sahifa: mini ilova qobig'i (ekranlar + oynalar)
import { useEffect, useState } from 'react';
import { TelegramProvider, loadBootstrap } from '@/providers/TelegramProvider';
import { useApp } from '@/store/appStore';
import { Splash, Onboarding, BottomNavigation } from '@/components/layout';
import { Toast, Empty, useT } from '@/components/ui';
import { Home, Catalog } from '@/components/features/Home';
import { Cart } from '@/components/features/Cart';
import { Orders, OrderSheet } from '@/components/features/Orders';
import { Profile } from '@/components/features/Profile';
import { ProductSheet } from '@/components/features/ProductSheet';
import { CheckoutSheet, PaymentSheet } from '@/components/features/Checkout';
import { StoryViewer } from '@/components/features/Stories';

function Screens() {
  const t = useT();
  const data = useApp((s) => s.data);
  const loadError = useApp((s) => s.loadError);
  const tab = useApp((s) => s.tab);
  const [minSplash, setMinSplash] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMinSplash(true), 1100);
    return () => clearTimeout(id);
  }, []);

  if (loadError && !data) {
    return (
      <Empty
        emoji="📡"
        title={t.error}
        text="Internet aloqasini tekshiring"
        action={<button className="btn btn-primary" onClick={loadBootstrap}>{t.retry}</button>}
      />
    );
  }

  return (
    <>
      <Splash done={!!data && minSplash} />
      {data && (
        <>
          <Onboarding />
          <main key={tab}>
            {tab === 'home' && <Home />}
            {tab === 'catalog' && <Catalog />}
            {tab === 'cart' && <Cart />}
            {tab === 'orders' && <Orders />}
            {tab === 'profile' && <Profile />}
          </main>
          <BottomNavigation />
          <ProductSheet />
          <CheckoutSheet />
          <PaymentSheet />
          <OrderSheet />
          <StoryViewer />
        </>
      )}
      <Toast />
    </>
  );
}

export default function Page() {
  return (
    <TelegramProvider>
      <div className="app">
        <Screens />
      </div>
    </TelegramProvider>
  );
}
