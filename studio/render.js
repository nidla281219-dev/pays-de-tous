// node render.js out.mp4 [--test t1,t2] [--fps 30]
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
const args = process.argv.slice(2); const out = args[0]; const ti = args.indexOf('--test'); const test = ti > 0 ? args[ti + 1].split(',').map(Number) : null;
const fps = args.includes('--fps') ? +args[args.indexOf('--fps') + 1] : 30;
const DUR = 55.6;
const Y = (s) => [s, 1], N = (s) => [s, 0];
const TL = {
  dur: DUR,
  shots: [
    { t: 0, from: { p: [0, 900, 2], l: [0, 0, 0] }, to: { p: [0, 430, 140], l: [0, 0, 20] } },
    { t: 2.9, from: { p: [-420, 260, 380], l: [0, 0, 0] }, to: { p: [-90, 240, 520], l: [0, 0, 0] } },
    { t: 6.8, from: { p: [-300, 14, 150], l: [-170, 2, 20] }, to: { p: [-270, 12, 80], l: [-160, 2, -40] } },
    { t: 7.9, from: { p: [210, 34, 160], l: [100, 12, 50] }, to: { p: [180, 30, 125], l: [80, 12, 30] } },
    { t: 8.9, from: { p: [40, 48, 30], l: [-40, 0, 190] }, to: { p: [-15, 40, 115], l: [-60, 0, 240] } },
    { t: 10.1, from: { p: [210, 85, 70], l: [60, 90, -70] }, to: { p: [140, 140, 0], l: [60, 90, -70] } },
    { t: 12.2, from: { p: [40, 150, 190], l: [-120, 10, 20] }, to: { p: [-10, 115, 145], l: [-120, 10, 20] } },
    { t: 15.3, rel: 1, from: { p: [-120, 6, 85], l: [-120, 8, 0] }, to: { p: [-120, 5, 68], l: [-120, 8, -10] } },
    { t: 17.9, from: { p: [-210, 110, 150], l: [-120, 10, 20] }, to: { p: [-170, 90, 120], l: [-120, 10, 20] } },
    { t: 21.6, rel: 1, from: { p: [-120, 12, 75], l: [-120, 6, 35] }, to: { p: [-120, 10, 64], l: [-120, 6, 35] } },
    { t: 24.3, from: { p: [230, 170, 320], l: [0, 0, 0] }, to: { p: [60, 160, 290], l: [0, 0, 0] } },
    { t: 30.6, rel: 1, from: { p: [-108, 14, 36], l: [-135, 20, 0] }, to: { p: [-117, 12, 25], l: [-135, 20, 0] } },
    { t: 33.8, rel: 1, from: { p: [-165, 12, 32], l: [-135, 20, 0] }, to: { p: [-168, 16, 12], l: [-135, 20, 0] } },
    { t: 36.8, from: { p: [-160, 430, 340], l: [-10, 0, 80] }, to: { p: [-90, 380, 300], l: [-10, 0, 80] } },
    { t: 40.4, from: { p: [-20, 95, 320], l: [-50, 25, 205] }, to: { p: [-35, 70, 290], l: [-50, 25, 205] } },
    { t: 44.3, from: { p: [40, 150, 110], l: [28, 30, -12] }, to: { p: [32, 115, 75], l: [28, 30, -12] } },
    { t: 48.5, from: { p: [-210, 380, 320], l: [-10, 0, 80] }, to: { p: [-160, 400, 270], l: [-10, 0, 80] } },
    { t: 51.1, from: { p: [-160, 400, 270], l: [-10, 0, 80] }, to: { p: [0, 760, 10], l: [0, 0, 0] } },
  ],
  win: { nuagesIntro: [[0, 2.9], [52.3, 99]], ville: [[12.3, 15.25]], villA: [[40.6, 51.1]], villB: [[44.5, 51.1]], pins: [[36.8, 51.1]], pinA: [[40.4, 44.3]], pinB: [[44.3, 48.5]],
    drapeau: [[30.6, 36.8]], nuages: [[0, 36.8], [51.1, 99]], toi: [[21.6, 24.3]], fin: [[52.6, 99]] },
  grow: { ville: [12.3, 14.8], villA: [40.6, 43.0], villB: [44.5, 47.0] },
  caps: [
    [0.0, 2.9, [[N('ET SI ON CRÉAIT')], [N('UN '), Y('PAYS…')], [Y('TOUS ENSEMBLE ?')]]],
    [2.95, 6.7, [[N('UNE '), Y('ÎLE DÉSERTE')], [N("AU MILIEU DE L'OCÉAN")]]],
    [6.8, 7.85, [[N('DES '), Y('PLAGES')]]], [7.9, 8.85, [[N('UNE '), Y('FORÊT')]]], [8.9, 10.05, [[N('UNE '), Y('RIVIÈRE')]]],
    [10.1, 12.15, [[N('UN '), Y('VOLCAN')], [N('ENDORMI')]]],
    [12.2, 15.2, [[N('LA PLACE POUR')], [Y('UNE VILLE IMMENSE')]]],
    [15.3, 17.85, [[N("MAIS POUR L'INSTANT…")], [N("IL N'Y A "), Y('PERSONNE')]]],
    [17.9, 19.95, [[N('1 '), Y('ABONNÉ')], [N('= 1 '), Y('HABITANT')]]],
    [20.0, 21.55, [[N("AUJOURD'HUI")], [N('ON EST '), Y('ZÉRO')]]],
    [21.6, 24.25, [[N('LE 1er CITOYEN')], [N('ÇA PEUT ÊTRE '), Y('TOI ?')]]],
    [24.3, 30.55, [[N('CHAQUE JOUR,')], [N("C'EST VOUS QUI "), Y('VOTEZ')]], 470],
    [30.6, 33.75, [[N('IL NOUS FAUT')], [N('UN '), Y('NOM'), N(' + UN '), Y('DRAPEAU')]]],
    [33.8, 36.75, [[N('EN COMMENTAIRE :')], [N('LE PLUS '), Y('LIKÉ'), N(' GAGNE')]]],
    [36.8, 40.35, [[N('1er VOTE :')], [N('OÙ FONDER')], [Y('LA CAPITALE ?')]]],
    [40.4, 44.25, [[Y('A'), N(' · LA PLAGE')], [N('PORT, PÊCHE, COMMERCE')]]],
    [44.3, 48.45, [[Y('B'), N(' · LE VOLCAN')], [N('TERRES FERTILES')], [N('ET PROTÉGÉES')]]],
    [48.5, 51.05, [[N('COMMENTE '), Y('A'), N(' OU '), Y('B')], [N('+ TON IDÉE DE NOM')]]],
    [51.1, 52.6, [[Y('ABONNE-TOI')], [N('POUR VIVRE ICI')]]],
  ].map(([t0, t1, lines, y]) => ({ t0, t1, lines, y })),
  cards: [{ kind: 'vote', t0: 25.0, t1: 30.55 }, { kind: 'comment', t0: 34.0, t1: 36.75 }, { kind: 'vs', t0: 48.5, t1: 51.05 }, { kind: 'fin', t0: 52.6, t1: 99 }],
  flashes: [2.9, 12.2, 30.6, 40.4, 44.3],
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()) });
  const srv = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], { cwd: __dirname, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 800));
  await p.goto('http://127.0.0.1:8765/scene.html'); await p.waitForFunction(() => window.ready); await p.evaluate(() => document.fonts.ready);
  await p.evaluate((tl) => {
    tl.vis = (t, k) => (tl.win[k] || []).some(([a, b]) => t >= a && t < b);
    tl.prog = (t, k) => { if (!tl.vis(t, k)) return 0; const g = tl.grow[k]; return Math.max(0, Math.min(1, (t - g[0]) / (g[1] - g[0]))); };
    window.setup(tl);
  }, TL);
  const times = test || Array.from({ length: Math.round(DUR * fps) }, (_, i) => i / fps);
  let ff = null; if (!test) ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (const [i, t] of times.entries()) {
    const url = await p.evaluate((t) => window.frame(t), t); const buf = Buffer.from(url.split(',')[1], 'base64');
    if (test) require('fs').writeFileSync(`${out}_${t}.jpg`, buf); else { if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
    if (i % 150 === 0) console.log(i, '/', times.length, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  if (ff) { ff.stdin.end(); await new Promise(r => ff.on('close', r)); }
  await b.close(); srv.kill();
})();
