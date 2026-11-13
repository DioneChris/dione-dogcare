// Render scenes to MP4: node render.js <outDir> <scene...>
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
(async () => {
  const [, , outDir, ...scenes] = process.argv; const FPS = 30, DUR = 7, N = FPS * DUR;
  const b = await chromium.launch();
  for (const scene of scenes) {
    const t0 = Date.now(), dir = path.join(outDir, 'frames_' + scene); fs.mkdirSync(dir, { recursive: true });
    const p = await b.newPage({ viewport: { width: 1080, height: 1440 } });
    p.on('pageerror', e => console.log('ERR', scene, e.message));
    await p.goto('file://' + path.resolve(__dirname, 'stage.html') + '?scene=' + scene); await p.waitForFunction('window.READY===true');
    for (let f = 0; f < N; f++) { await p.evaluate(([t, f]) => renderAt(t, f), [f / FPS, f]); await p.screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.png') }); }
    await p.close();
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(dir, '%04d.png'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(outDir, scene + '.mp4')]);
    console.log(scene, 'done', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  await b.close();
})();
