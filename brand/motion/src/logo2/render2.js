// Render the v2 logo scene: node render2.js <outDir> <fps> [scale] [workers]
// Frames go to <outDir>/frames, then ffmpeg encodes <outDir>/logo-v2_<fps>fps.mp4
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
(async () => {
  const [, , outDir, fpsArg = '60', scaleArg = '1', workersArg = '4'] = process.argv;
  const fps = +fpsArg, scale = +scaleArg, workers = +workersArg, dur = 8, N = Math.round(fps * dur);
  const dir = path.join(outDir, 'frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch(); const t0 = Date.now();
  await Promise.all([...Array(workers)].map(async (_, w) => {
    const p = await b.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: scale });
    p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto('file://' + path.resolve(__dirname, 'stage2.html')); await p.waitForFunction('window.READY===true');
    for (let f = w; f < N; f += workers) { await p.evaluate(t => renderAt(t), f / fps); await p.screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.png') }); }
    await p.close();
  }));
  await b.close();
  const out = path.join(outDir, `logo-v2_${fps}fps${scale !== 1 ? '_x' + scale : ''}.mp4`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', path.join(dir, '%04d.png'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's', N, 'frames');
})();
