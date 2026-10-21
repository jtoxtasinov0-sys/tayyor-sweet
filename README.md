# Tayyor & Sweet — Telegram do'kon

Shirinliklar, tortlar va yarim tayyor mahsulotlar uchun Telegram bot, mini ilova va admin panel.
Ma'lumotlar `tayyor_sweet_telegram_app.html` dan olingan: 24 ta mahsulot, 3 ta kategoriya, brend ranglari.

```
tayyor_sweet/
├── backend/        Node.js: Telegram bot (Telegraf) + API (Express) + PostgreSQL (Neon)
├── miniapp/        Next.js (App Router) + Zustand: mini ilova (/) va admin panel (/admin)
├── rasmlar/        Mahsulot rasmlari — "Papkadan yuklash" shu yerdan o'qiydi (nusxasi: miniapp/public/rasmlar)
├── video/          "Ilovani o'rnatish" video qo'llanmalarini yasovchi kod (kanvas + ovoz sintezi)
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
Bepul tarifda server 15 daqiqada uxlab qolmasligi uchun o'ziga har 10 daqiqada ping yuboradi (o'chirish: `KEEP_ALIVE=0`).

**Vercel (mini ilova + admin)** — repo'ni import qiling:
- Root Directory: `miniapp`
- Framework: Next.js
- Environment: `BACKEND_URL=https://<render-manzil>.onrender.com`

So'ng Render'dagi `MINIAPP_URL` ni Vercel manziliga o'rnating — bot menyu tugmasini o'zi sozlaydi.

Mini ilova do'kon ma'lumotlarini Vercel'da keshlaydi (ISR, har 60 soniyada fonda yangilanadi) — backend uyg'onishini kutmasdan darhol ochiladi.

**Rasmlar backendga bog'liq emas.** `rasmlar/` dagi mahsulot rasmlarining nusxasi `miniapp/public/rasmlar/` da turadi —
brauzer ularni Vercel CDN'dan oladi, backend uxlab qolsa ham ko'rinadi. `rasmlar/` ga yangi rasm qo'shsangiz, nusxasini
`miniapp/public/rasmlar/` ga ham qo'ying (qo'yilmasa rasm backenddan olinadi). Admin yuklagan rasmlar backenddan keladi.

**Backend ishlamasa.** Build paytida backend javob bermasa, sahifa `miniapp/src/lib/fallback-bootstrap.json` dagi
zaxira ma'lumot bilan yig'iladi: katalog, narxlar va rasmlar ko'rinadi (buyurtma va admin panel uchun backend kerak).

## Bot buyruqlari

| Buyruq | Vazifasi |
|---|---|
| `/start` | rasm (do'kon banneri `miniapp/public/og.jpg`) + matn, ostida tugmalar: do'kon, ilovani o'rnatish, buyurtmalar, aloqa, Instagram, til. Til Telegram tilidan tanlanadi; raqami yo'qlardan telefon so'raladi |
| `/narxlar` | narxlar jadvali (bazadan) |
| `/buyurtmalar` | oxirgi buyurtmalar va holati |
| `/til` | tilni o'zgartirish |
| `/ilova` | ilovani telefonga o'rnatish: link + iPhone / Samsung video qo'llanma (/start xabari ostida ham bor) |
| `/admin parol` | admin huquqini olish (5 xato → 15 daqiqa blok) |
| `/panel` | statistika + tekshirilishi kerak bo'lgan buyurtmalar (tugmalar bilan) |

Saytdan (Telegramsiz, oddiy brauzerda) ham buyurtma berish mumkin: brauzer o'ziga "mehmon" kaliti yaratadi,
buyurtmalar shu brauzerda "Buyurtmalar" bo'limida ko'rinadi. Bunday buyurtmalarda adminga "🌐 Saytdan" belgisi chiqadi —
mijozga Telegram xabar bormaydi, telefon orqali bog'laning. O'chirish: Render'da `ALLOW_GUEST_ORDERS=0`.

Buyurtma holatlari: **To'lov kutilmoqda → Chek yuborildi → Tasdiqlandi → Jo'natildi → Yetkazildi** (yoki Bekor qilindi).
Holat o'zgarganda mijozga Telegram'da xabar boradi (택배 trek raqami va kuzatish havolasi bilan).

## Ilovani telefonga o'rnatish

Mini ilova — PWA: telefonda bosh ekranga "ilova" bo'lib o'rnatiladi va Telegram'siz ochiladi (mehmon rejimida buyurtma).

- Botda /start xabari ostidagi **📲 Ilovani o'rnatish** tugmasi (yoki `/ilova`) → link `…/ilova` + iPhone / Samsung video tugmalari.
- `/ilova` sahifasi telefonni o'zi aniqlaydi: Samsung/Chrome'da **O'rnatish** tugmasi, iPhone'da 3 qadam,
  Telegram/Instagram/KakaoTalk ichidagi brauzerda "Safari / Chrome'da oching" ogohlantirishi.
- Mini ilovada Profil → **Ilovani telefonga o'rnatish** (Telegram ichidan tashqi brauzerni ochadi).
- Fayllar: `miniapp/src/app/manifest.ts`, `miniapp/public/sw.js`, `miniapp/public/icons/`.
- Videolar (yozuvlar o'zbekcha, telefon interfeysi ruscha — ko'pchilik telefonni rus tilida ishlatadi;
  Instagram Reels uchun ham mos — matn va telefon xavfsiz hududda):
  `miniapp/public/video/ilova-<iphone|samsung>-uz.mp4` (+ `.jpg` muqova, `-thumb.jpg` Telegram uchun).
  Bot videoni bir marta yuklaydi, keyin Telegram `file_id` orqali yuboradi.

**Videoni qayta yasash** (matn yoki dizayn o'zgarsa) — `video/` papkasida:

```
npm i                                  # playwright (Chromium) o'rnatiladi
(cd ../miniapp && npm run build && npx next start -p 3100)   # alohida oynada
node shots.mjs                         # sahifa rasmlari (videodagi /ilova va do'kon)
./build.sh                             # 2 ta video (iPhone, Samsung): kadrlar → ovoz → -15 LUFS → mp4
./preview.sh iphone 0 10               # tez tekshiruv: oraliq kadrlari bitta rasmda
```

Matnlar `video/src/strings.js` da, sahnalar vaqti `video/src/main.js` da. Ovoz effektlari va fon musiqasi
`video/audio.py` da kod bilan sintez qilinadi — tashqi fayl va litsenziya talab qilinmaydi. Shrift: Onest (OFL).

## Admin panel (8 bo'lim)

1. **Dashboard** — bugungi buyurtmalar, tushum, 14 kunlik grafik, top mahsulotlar
2. **Buyurtmalar** — filtr, chekni ko'rish, holat, kuryer + trek raqam, mijozga izoh
3. **Mahsulotlar** — rasm ramkasini sozlash, tezkor o'lcham tugmalari, ranglar, o'lcham jadvali, "📸 Story qilish", papkadan yuklash, narxlar jadvali
4. **Ombor** — qoldiqlar, kirim / chiqim / sanoq, "kam qoldi" chegarasi, harakatlar tarixi.
   Buyurtmada qoldiq o'zi kamayadi, bekor qilinsa qaytadi, tugasa mahsulot "Tugagan" bo'ladi, kam qolsa adminga xabar boradi.
   Hisob yuritilmagan mahsulotlar (masalan, buyurtmaga tayyorlanadigan tortlar) avvalgidek cheklovsiz sotiladi.
5. **Kategoriyalar**
6. **Story va bannerlar** (karusel)
7. **Mijozlar va rassilka**
8. **Sozlamalar** — do'kon, bank rekvizitlari, yetkazish narxlari, e'lon
