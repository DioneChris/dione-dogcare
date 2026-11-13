// 디오네 홍보영상 초안(애니매틱) 렌더러
// 사용법 (저장소 루트에서):
//   node promo-video/draft/render.mjs                    → promo-video/dione-a-day-draft.mp4 (촬영 메모 포함)
//   node promo-video/draft/render.mjs --clean            → 촬영 메모 없이 렌더
//   node promo-video/draft/render.mjs --stills 6,20,48   → 해당 초(sec)의 스틸만 저장
//   node promo-video/draft/render.mjs --page whoosh-test.html --fps 60 --out promo-video/whoosh-test.mp4
// 필요: Node, Playwright(Chromium), ffmpeg
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

const clean = flag('--clean');
const stills = opt('--stills', null);
const workers = +opt('--workers', Math.max(1, Math.min(4, os.cpus().length - 1)));
const out = path.resolve(opt('--out', path.join(root, 'promo-video', clean ? 'dione-a-day-draft-clean.mp4' : 'dione-a-day-draft.mp4')));
const stillDir = path.resolve(opt('--still-dir', path.join(here, 'stills')));
const fpsOverride = opt('--fps', null);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const pageName = opt('--page', 'animatic.html');
const url = `http://127.0.0.1:${server.address().port}/promo-video/draft/${pageName}?render=1${clean ? '&clean=1' : ''}`;

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => window.ready);
  return page;
}

const browser = await chromium.launch();
try {
  if (stills) {
    fs.mkdirSync(stillDir, { recursive: true });
    const page = await openPage(browser);
    for (const s of stills.split(',').map(Number)) {
      await page.evaluate(t => window.seek(t), s);
      const f = path.join(stillDir, `t${String(s.toFixed(1)).padStart(5, '0')}.jpg`);
      await page.screenshot({ path: f, type: 'jpeg', quality: 88 });
      console.log('still', f);
    }
  } else {
    const probe = await openPage(browser);
    const { DURATION, FPS } = await probe.evaluate(() => ({ DURATION: window.DURATION, FPS: window.FPS }));
    await probe.close();
    const fps = fpsOverride ? +fpsOverride : FPS;
    const total = Math.round(DURATION * fps);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dione-render-'));
    const chunk = Math.ceil(total / workers);
    console.log(`rendering ${total} frames @${fps}fps with ${workers} workers → ${out}`);
    const t0 = Date.now();
    const parts = await Promise.all(Array.from({ length: workers }, async (_, w) => {
      const from = w * chunk, to = Math.min(total, from + chunk);
      const part = path.join(tmp, `part${w}.mp4`);
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', String(fps), part], { stdio: ['pipe', 'inherit', 'inherit'] });
      const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
      const page = await openPage(browser);
      for (let f = from; f < to; f++) {
        await page.evaluate(t => window.seek(t), f / fps);
        const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
        if (w === 0 && (f - from) % 150 === 0) console.log(`  ${Math.round((f - from) / (to - from) * 100)}% (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
      }
      ff.stdin.end();
      await done;
      await page.close();
      return part;
    }));
    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
    await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' })
      .on('close', c => c === 0 ? res() : rej(new Error('concat ' + c))));
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${out}`);
  }
} finally {
  await browser.close();
  server.close();
}
