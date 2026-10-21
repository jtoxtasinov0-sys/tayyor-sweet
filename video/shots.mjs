// Videoda ko'rinadigan haqiqiy sahifa rasmlari: /ilova va do'kon (iPhone va Samsung o'lchamida)
// Ishlatish: mini ilova ishga tushgan bo'lsin (npx next start -p 3100), keyin: node shots.mjs [http://localhost:3100]
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
const base = process.argv[2] || 'http://localhost:3100';
const UA = {
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
};
// [nom, platforma, yo'l, en, bo'y, standalone, til]
const shots = [
  ['ilova-ios-uz', 'ios', '/ilova', 390, 700, false, 'uz'],
  ['ilova-ios-ru', 'ios', '/ilova?lang=ru', 390, 700, false, 'ru'],
  ['ilova-android-uz', 'android', '/ilova', 384, 700, false, 'uz'],
  ['ilova-android-ru', 'android', '/ilova?lang=ru', 384, 700, false, 'ru'],
  ['shop-ios-uz', 'ios', '/', 390, 800, true, 'uz'],
  ['shop-ios-ru', 'ios', '/', 390, 800, true, 'ru'],
  ['shop-android-uz', 'android', '/', 384, 800, true, 'uz'],
  ['shop-android-ru', 'android', '/', 384, 800, true, 'ru'],
];
await mkdir('assets/shots', { recursive: true });
const browser = await chromium.launch();
const layout = {};
for (const [name, os, path, width, height, standalone, lang] of shots) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA[os] });
  await ctx.route(/telegram\.org/, (r) => r.abort());
  await ctx.addInitScript(([standalone, lang, os]) => {
    localStorage.setItem('ts-onboarded', '1');
    localStorage.setItem('ts-lang', lang);
    if (standalone) {
      const mm = window.matchMedia.bind(window);
      window.matchMedia = (q) => (q.includes('display-mode: standalone') ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : mm(q));
    }
    // Android: Chrome'ning "o'rnatish" hodisasi (sahifa tugmasini ko'rsatish uchun)
    if (os === 'android' && !standalone)
      addEventListener('load', () => setTimeout(() => {
        const e = new Event('beforeinstallprompt');
        e.prompt = async () => {};
        e.userChoice = Promise.resolve({ outcome: 'accepted' });
        dispatchEvent(e);
      }, 50));
  }, [standalone, lang, os]);
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `assets/shots/${name}.png` });
  const btn = await page.$('.inst-big');
  if (btn) layout[name] = await btn.boundingBox();
  console.log('✓', name);
  await ctx.close();
}
await browser.close();
await writeFile('assets/shots/layout.json', JSON.stringify(layout, null, 1));
