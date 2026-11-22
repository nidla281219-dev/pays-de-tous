// node render.js --jour N sortie.mp4 [--test t1,t2,...] [--fps 30] [--cadre] [--propre] [--morceau k/n]
// Lit ../jours/jourN/timeline.json (plans caméra, textes, cartes, état du pays) — format décrit dans ../CLAUDE.md.
// --test : écrit seulement quelques images JPG (sortie_t.jpg) ; --cadre : dessine la zone visible TikTok par-dessus (vérification).
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const jour = opt('--jour') || '1';
const out = args.find((a, i) => !a.startsWith('--') && !['--jour', '--test', '--fps', '--morceau'].includes(args[i - 1]));
const test = opt('--test') ? opt('--test').split(',').map(Number) : null;
const fps = +(opt('--fps') || 30);
const cadre = args.includes('--cadre');
const propre = args.includes('--propre'); // sans textes ni cartes (fond de miniature)

const TL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'jours', `jour${jour}`, 'timeline.json'), 'utf8'));
const PRESETS = JSON.parse(fs.readFileSync(path.join(__dirname, 'presets.json'), 'utf8'));
// plans : {t, preset:"nom"} ou {t, from:{p,l}, to:{p,l}, rel?}
TL.shots = TL.shots.map(s => {
  if (!s.preset) return s;
  const p = PRESETS[s.preset]; if (!p) throw new Error('preset inconnu : ' + s.preset);
  return { ...p, ...s };
});
// textes : format court {t0,t1,lignes:["UN *PAYS*…"], y?} → *mot* en jaune
TL.caps = (TL.caps || []).map(c => {
  if (!c.lignes) return c;
  const lines = c.lignes.map(l => l.split(/(\*[^*]+\*)/).filter(Boolean).map(s => s.startsWith('*') ? [s.slice(1, -1), 1] : [s, 0]));
  return { t0: c.t0, t1: c.t1, lines, y: c.y, taille: c.taille };
});
TL.cards = TL.cards || []; TL.flashes = TL.flashes || [];
if (propre) { TL.caps = []; TL.cards = []; TL.bandeaux = []; TL.flashes = []; TL.win.fin = [[0, 999]]; } TL.win = TL.win || {}; TL.grow = TL.grow || {};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()) });
  const srv = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], { cwd: __dirname, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 800));
  await p.goto('http://127.0.0.1:8765/scene.html'); await p.waitForFunction(() => window.ready); await p.evaluate(() => document.fonts.ready);
  await p.evaluate((tl) => {
    tl.vis = (t, k) => (tl.win[k] || []).some(([a, b]) => t >= a && t < b);
    tl.prog = (t, k) => { if (!tl.vis(t, k)) return 0; const g = tl.grow[k]; if (!g) return 1; return Math.max(0, Math.min(1, (t - g[0]) / (g[1] - g[0]))); };
    window.setup(tl);
  }, TL);
  let times = test || Array.from({ length: Math.round(TL.dur * fps) }, (_, i) => i / fps);
  if (opt('--morceau') && !test) { const [k, n] = opt('--morceau').split('/').map(Number); const L = Math.ceil(times.length / n); times = times.slice((k - 1) * L, k * L); } // --morceau k/n : seulement la k-ième part
  let ff = null; if (!test) ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (const [i, t] of times.entries()) {
    let url = await p.evaluate((t) => window.frame(t), t);
    if (cadre) url = await p.evaluate(() => { const c = document.getElementById('out'), x = c.getContext('2d'); x.save(); x.strokeStyle = 'red'; x.lineWidth = 6; x.beginPath(); x.moveTo(60, 130); x.lineTo(1020, 130); x.lineTo(1020, 300); x.lineTo(960, 300); x.lineTo(960, 1600); x.lineTo(60, 1600); x.closePath(); x.stroke(); x.restore(); return c.toDataURL('image/jpeg', .9) });
    const buf = Buffer.from(url.split(',')[1], 'base64');
    if (test) fs.writeFileSync(`${out}_${t}.jpg`, buf); else { if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
    if (i % 150 === 0) console.log(i, '/', times.length, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  if (ff) { ff.stdin.end(); await new Promise(r => ff.on('close', r)); }
  await b.close(); srv.kill();
})();
