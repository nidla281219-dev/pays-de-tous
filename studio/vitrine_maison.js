// Plans « vitrine » d'une maison achetée, rendus avec le MÊME code que l'aperçu du site (boutique/index.html) → identique à la commande.
// node vitrine_maison.js <dossier_sortie> '<json commande>'   commande = {choix:"P18-grande-med-…", panneau, plaque}
// Écrit dossier/0000.jpg… (1080×1920, 30 i/s) : orbite lente DEVANT la maison, puis gros plan sur le panneau au nom, puis la statue si achetée.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [out, cmdJson] = process.argv.slice(2); const cmd = JSON.parse(cmdJson); fs.mkdirSync(out, { recursive: true });
const p_ = cmd.choix.split('-'); const [lot, maison, style, facade, toit, volet, cloture, opts, st] = [p_[0].slice(1), ...p_.slice(1)];
const statue = st && st !== 'x' ? st.split('_').slice(1) : null;
const ETAT = { lot: +lot, maison, style, facade, toit, volet, cloture, options: opts && opts !== 'x' ? opts.split('_') : [], statue: !!statue, pose: statue ? statue[0] : 'debout', matiere: statue ? statue[1] : 'bronze', acc: statue ? statue[2] : 'aucun' };
const FPS = 30; const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; const lerp = (a, b, t) => a + (b - a) * t; const L = (A, B, t) => A.map((v, i) => lerp(v, B[i], t));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 900 } });
  await p.route('**/three.module.min.js', r => r.fulfill({ body: fs.readFileSync(path.join(__dirname, 'three.js')), contentType: 'application/javascript' }));
  await p.route('**/fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: "@font-face{font-family:'Lilita One';src:url(https://fonts.gstatic.com/local/lilita.ttf)}" }));
  await p.route('**/fonts.gstatic.com/local/lilita.ttf', r => r.fulfill({ contentType: 'font/ttf', body: fs.readFileSync(path.join(__dirname, 't', 'lilita.ttf')) }));
  await p.route('**/gc.zgo.at/**', r => r.abort());
  await p.setContent('<!doctype html><meta charset="utf-8">' + fs.readFileSync(path.join(__dirname, '..', 'boutique', 'index.html'), 'utf8'), { waitUntil: 'load' });
  await p.waitForTimeout(1200); await p.evaluate(() => document.fonts.load("60px 'Lilita One'"));
  await p.evaluate(() => window.decorVitrine && window.decorVitrine());
  await p.evaluate(([E, pan, pla]) => { document.getElementById('boite').value = pan || ''; document.getElementById('plaque').value = pla || ''; Object.assign(window.ETAT, E, { options: new Set(E.options) }); window.redessiner(); }, [ETAT, cmd.panneau, cmd.plaque]);
  // plans : [durée, angle0, angle1, dist0, dist1, haut0, haut1, vise0, vise1]   (angle 0 = face avant de la maison ; jamais derrière)
  const P = [[3.0, -.55, .3, 62, 52, 26, 20, [0, 1.5, -1], [0, 2, -2]],
             [1.7, .1, -.25, 22, 17, 6, 4.8, [4.3, 3.1, 12.6], [4.3, 3.2, 12.6]]];
  if (ETAT.statue) P.push([1.7, .75, .45, 22, 17, 8, 7, [-9.5, 5, 8.5], [-9.5, 5.3, 8.5]]);
  P.push([1.4, .3, .65, 54, 64, 24, 30, [0, 1.5, 0], [0, 1.5, 1]]);
  let i = 0;
  for (const [d, a0, a1, d0, d1, h0, h1, v0, v1] of P) for (let k = 0, n = Math.round(d * FPS); k < n; k++, i++) {
    const t = ease(k / (n - 1));
    const u = await p.evaluate(([a, di, h, v]) => window.photo(a, 1080, 1920, di, h, v), [lerp(a0, a1, t), lerp(d0, d1, t), lerp(h0, h1, t), L(v0, v1, t)]);
    fs.writeFileSync(path.join(out, String(i).padStart(4, '0') + '.jpg'), Buffer.from(u.split(',')[1], 'base64'));
  }
  console.log(JSON.stringify({ images: i, plans: P.map(x => x[0]) }));
  await b.close();
})();
