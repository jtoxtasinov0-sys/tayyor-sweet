// Kadrlarni Chromium'da chizib ffmpeg'ga uzatadi.
// node render.mjs --device iphone|samsung --lang uz|ru [--from s] [--to s] [--fps 30] [--scale 1]
//   [--out kadrlar_papkasi --jpg]   — alohida JPEG kadrlar (oldindan ko'rish uchun)
//   [--mp4 fayl.mp4]                — ovozsiz video
//   [--cues fayl.json]              — ovoz effektlari vaqtlari
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const a = process.argv.slice(2);
const opt = (k, d) => {
  const i = a.indexOf('--' + k);
  return i >= 0 ? a[i + 1] : d;
};
const device = opt('device', 'iphone');
const lang = opt('lang', 'uz');
const fps = +opt('fps', 30);
const scale = +opt('scale', 1);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = createServer(async (req, res) => {
  try {
    const p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(root)) throw new Error('forbidden');
    res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Math.round(1080 * scale), height: Math.round(1920 * scale) } });
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
await page.goto(`http://127.0.0.1:${port}/video/index.html?device=${device}&lang=${lang}&scale=${scale}`);
const info = await page.evaluate(() => window.ready);
const from = +opt('from', 0);
const to = Math.min(+opt('to', info.dur), info.dur);
const n = Math.round((to - from) * fps);

if (opt('cues')) await writeFile(opt('cues'), JSON.stringify(info, null, 1));

let ff = null;
const outDir = opt('out');
if (outDir) await mkdir(outDir, { recursive: true });
if (opt('mp4')) {
  ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', opt('mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
}
const t0 = Date.now();
for (let i = 0; i < n; i++) {
  const t = from + i / fps;
  const b64 = await page.evaluate((t) => window.frame(t, 0.93), t);
  const buf = Buffer.from(b64, 'base64');
  if (outDir) await writeFile(join(outDir, String(i).padStart(5, '0') + '.jpg'), buf);
  if (ff && !ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 60 === 0 && !outDir) process.stdout.write(`\r${device}-${lang}: ${i}/${n}`);
}
if (ff) {
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
}
console.log(`\n${n} kadr, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close();
server.close();
