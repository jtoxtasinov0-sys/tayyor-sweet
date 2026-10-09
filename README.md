# Tayyor & Sweet — Telegram do'kon

Shirinliklar, tortlar va yarim tayyor mahsulotlar uchun Telegram bot, mini ilova va admin panel.
Ma'lumotlar `tayyor_sweet_telegram_app.html` dan olingan: 24 ta mahsulot, 3 ta kategoriya, brend ranglari.

```
tayyor_sweet/
├── backend/        Node.js: Telegram bot (Telegraf) + API (Express) + PostgreSQL (Neon)
├── miniapp/        Next.js (App Router) + Zustand: mini ilova (/) va admin panel (/admin)
├── rasmlar/        Mahsulot rasmlari — "Papkadan yuklash" shu yerdan o'qiydi
├── 1_setup.bat     Paketlarni o'rnatish + bazaga 24 ta mahsulotni yuklash
├── 2_start.bat     Backend va mini ilovani ishga tushirish
├── 3_tunnel.bat    Telefonda sinash uchun https tunnel (cloudflared)
└── render.yaml     Backend'ni Render'ga joylash
```

## Ranglar

Hammasi bitta joyda — `miniapp/src/styles/globals.css` boshidagi `:root`:

| O'zgaruvchi | Rang | Qayerda |
|---|---|---|
| `--pink` | `#F8A0D0` | asosiy pushti (logo foni) |
| `--ribbon` | `#F48FB8` | tugmalar, aksent |
| `--plum` | `#4A2444` | matn, to'q fon |
| `--bg` | `#FFF0F7` | och fon |
| `--accent` | `#D94F93` | narxlar |

Admin panel ham shu o'zgaruvchilardan foydalanadi.

## Mahalliy ishga tushirish

1. `backend/.env` — `.env.example` asosida (bot tokeni, Neon `DATABASE_URL`, admin paroli).
2. `1_setup.bat` → `2_start.bat`.
3. Mini ilova: http://localhost:3000, admin: http://localhost:3000/admin.
   Brauzerda (Telegramsiz) sinash uchun `backend/.env` da `ALLOW_DEV_AUTH=1`.
4. Telegram ichida sinash: `3_tunnel.bat` → chiqqan `https://...trycloudflare.com` ni
   `backend/.env` dagi `MINIAPP_URL` ga yozib, backend'ni qayta ishga tushiring.

## Deploy

**Neon (baza)** — `neon link --project-id little-star-77658471 --branch production`, ulanish satri: `neon connection-string`.

**Render (backend + bot)** — New → Blueprint → shu repo (`render.yaml`). Kiritish kerak:
`BOT_TOKEN`, `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_IDS`, `MINIAPP_URL` (Vercel manzili), `OWNER_LINK`.
Render'da bot webhook rejimida ishlaydi (`RENDER_EXTERNAL_URL` avtomatik).

**Vercel (mini ilova + admin)** — repo'ni import qiling:
- Root Directory: `miniapp`
- Framework: Next.js
- Environment: `BACKEND_URL=https://<render-manzil>.onrender.com`

So'ng Render'dagi `MINIAPP_URL` ni Vercel manziliga o'rnating — bot menyu tugmasini o'zi sozlaydi.

## Bot buyruqlari

| Buyruq | Vazifasi |
|---|---|
| `/start` | til tanlash → telefon raqam → do'kon tugmasi |
| `/narxlar` | narxlar jadvali (bazadan) |
| `/buyurtmalar` | oxirgi buyurtmalar va holati |
| `/til` | tilni o'zgartirish |
| `/admin parol` | admin huquqini olish (5 xato → 15 daqiqa blok) |
| `/panel` | statistika + tekshirilishi kerak bo'lgan buyurtmalar (tugmalar bilan) |

Buyurtma holatlari: **To'lov kutilmoqda → Chek yuborildi → Tasdiqlandi → Jo'natildi → Yetkazildi** (yoki Bekor qilindi).
Holat o'zgarganda mijozga Telegram'da xabar boradi (택배 trek raqami va kuzatish havolasi bilan).

## Admin panel (7 bo'lim)

1. **Dashboard** — bugungi buyurtmalar, tushum, 14 kunlik grafik, top mahsulotlar
2. **Buyurtmalar** — filtr, chekni ko'rish, holat, kuryer + trek raqam, mijozga izoh
3. **Mahsulotlar** — rasm ramkasini sozlash, tezkor o'lcham tugmalari, ranglar, o'lcham jadvali, "📸 Story qilish", papkadan yuklash, narxlar jadvali
4. **Kategoriyalar**
5. **Story va bannerlar** (karusel)
6. **Mijozlar va rassilka**
7. **Sozlamalar** — do'kon, bank rekvizitlari, yetkazish narxlari, e'lon
