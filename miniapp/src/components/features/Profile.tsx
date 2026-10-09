'use client';
// Profil: "TS MEMBER" kartasi, til, aloqa, do'kon haqida
import { useEffect, useState } from 'react';
import { useT } from '@/components/ui';
import { DecorShape } from '@/components/layout';
import { useApp } from '@/store/appStore';
import { useTelegram, openLink, haptic } from '@/hooks/useTelegram';
import { saveLang } from '@/providers/TelegramProvider';
import { api } from '@/lib/api';
import { won, fmtDate } from '@/lib/utils';

export function Profile() {
  const t = useT();
  const { user } = useTelegram();
  const lang = useApp((s) => s.lang);
  const me = useApp((s) => s.me);
  const shop = useApp((s) => s.data?.shop);
  const lang_ = lang === 'ru' ? 'ru' : 'uz';
  const [stats, setStats] = useState({ count: 0, sum: 0 });

  useEffect(() => {
    api
      .orders()
      .then((o) => setStats({ count: o.length, sum: o.filter((x) => x.status !== 'cancelled').reduce((s, x) => s + x.total, 0) }))
      .catch(() => {});
  }, []);

  const name = [user?.first_name || me?.first_name, user?.last_name || me?.last_name].filter(Boolean).join(' ') || 'Mehmon';
  const about = lang_ === 'ru' ? shop?.about_ru || shop?.about_uz : shop?.about_uz;

  return (
    <div className="page">
      <div className="home-hero">
        <DecorShape />
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{t.profile}</h1>
      </div>

      <div className="member">
        <span className="tag">{shop?.short_name || 'TS'} {t.member}</span>
        <h2>{name}</h2>
        {user?.username && <span style={{ opacity: 0.75, position: 'relative' }}>@{user.username}</span>}
        <img src={user?.photo_url || '/images/logo.png'} alt="" />
        <div className="meta">
          <span><b>{stats.count}</b>{t.orders_count}</span>
          <span><b>{won(stats.sum)}</b>{t.spent}</span>
          {me?.created_at && <span><b>{fmtDate(me.created_at, lang, false)}</b>{t.member_since}</span>}
        </div>
      </div>

      <div className="menu-list">
        <div>
          <span className="ic">🌐</span>
          <span>{t.language}</span>
          <span className="spacer" />
          <div className="row" style={{ gap: 6 }}>
            {(['uz', 'ru'] as const).map((l) => (
              <button key={l} className={`chip ${lang === l ? 'active' : ''}`} style={{ height: 32 }} onClick={() => { haptic.select(); saveLang(l); }}>
                {l === 'uz' ? "🇺🇿 O'zb" : '🇷🇺 Рус'}
              </button>
            ))}
          </div>
        </div>
        {shop?.owner_link && (
          <button onClick={() => openLink(shop.owner_link!)}>
            <span className="ic">✍️</span><span>{t.contact_owner}</span><span className="val">›</span>
          </button>
        )}
        {shop?.instagram && (
          <button onClick={() => openLink(`https://instagram.com/${shop.instagram!.replace('@', '')}`)}>
            <span className="ic">📸</span><span>{t.instagram}</span><span className="val">{shop.instagram}</span>
          </button>
        )}
        {me?.is_admin && (
          <button onClick={() => (window.location.href = '/admin')}>
            <span className="ic">🛠</span><span>{t.admin_panel}</span><span className="val">›</span>
          </button>
        )}
      </div>

      <div className="opt-title">{t.about}</div>
      <div className="menu-list" style={{ marginTop: 0 }}>
        {about && <div style={{ display: 'block', lineHeight: 1.5 }}>{about}</div>}
        {shop?.address && <div><span className="ic">📍</span><span>{shop.address}</span></div>}
        {shop?.working_hours && <div><span className="ic">🕘</span><span>{t.hours}</span><span className="val">{shop.working_hours}</span></div>}
        {shop?.phone && <a href={`tel:${shop.phone}`}><span className="ic">☎️</span><span>{shop.phone}</span></a>}
      </div>
      <p className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 24 }}>{shop?.name} · v1.0</p>
    </div>
  );
}
