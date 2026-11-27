// ================= LA VILLE DU JEU (« le réel » ; la vidéo reste la maquette) =================
// Boutiques à étages visitables, place pavée, rues, mobilier, textures. Même structure que la vidéo : chaque boutique garde son nom et ses couleurs.

// ---- textures procédurales (tuilables), plaquées en coordonnées monde (triplanaire) ----
function texV(fn, n = 256) { const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); fn(x, n); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); return t; }
const rv = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const gris = v => `rgb(${v | 0},${v | 0},${v | 0})`;
function grain(x, n, k, a) { for (let i = 0; i < k; i++) { x.fillStyle = `rgba(${rv() < .5 ? '0,0,0' : '255,255,255'},${a * rv()})`; x.fillRect(rv() * n, rv() * n, 1 + rv() * 2, 1 + rv() * 2); } }
const TX = {
  brique: texV((x, n) => { x.fillStyle = gris(205); x.fillRect(0, 0, n, n); const rows = 12, h = n / rows, w = n / 4;
    for (let r = 0; r < rows; r++) for (let c = -1; c < 5; c++) { const o = r % 2 ? w / 2 : 0; x.fillStyle = gris(120 + rv() * 60); x.fillRect(c * w + o + 2, r * h + 2, w - 4, h - 4); } grain(x, n, 3000, .18); }),
  enduit: texV((x, n) => { x.fillStyle = gris(185); x.fillRect(0, 0, n, n); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(${rv() < .5 ? '0,0,0' : '255,255,255'},${.015 + rv() * .025})`; x.beginPath(); x.arc(rv() * n, rv() * n, 10 + rv() * 40, 0, 7); x.fill(); } grain(x, n, 5000, .1); }),
  pierre: texV((x, n) => { x.fillStyle = gris(150); x.fillRect(0, 0, n, n); const rows = 4, h = n / rows;
    for (let r = 0; r < rows; r++) { let u = r % 2 ? -40 : 0; while (u < n) { const w = 60 + rv() * 50; x.fillStyle = gris(175 + rv() * 45); x.fillRect(u + 2, r * h + 2, w - 4, h - 4); u += w; } } grain(x, n, 4000, .15); }),
  tuile: texV((x, n) => { x.fillStyle = gris(90); x.fillRect(0, 0, n, n); const rows = 8, h = n / rows, w = n / 6;
    for (let r = 0; r < rows; r++) for (let c = -1; c < 7; c++) { const o = r % 2 ? w / 2 : 0, v = 150 + rv() * 50, g = x.createLinearGradient(0, r * h, 0, r * h + h); g.addColorStop(0, gris(v * .75)); g.addColorStop(.7, gris(v)); g.addColorStop(1, gris(v * .6));
      x.fillStyle = g; x.beginPath(); x.moveTo(c * w + o + 2, r * h); x.lineTo(c * w + o + w - 2, r * h); x.lineTo(c * w + o + w - 2, r * h + h - 3); x.quadraticCurveTo(c * w + o + w / 2, r * h + h + 2, c * w + o + 2, r * h + h - 3); x.fill(); } }),
  bois: texV((x, n) => { const k = 8, w = n / k; for (let i = 0; i < k; i++) { x.fillStyle = gris(140 + rv() * 50); x.fillRect(i * w, 0, w, n); x.fillStyle = gris(70); x.fillRect(i * w, 0, 2, n);
    for (let j = 0; j < 14; j++) { x.strokeStyle = `rgba(0,0,0,${.05 + rv() * .08})`; x.beginPath(); const xx = i * w + rv() * w; x.moveTo(xx, 0); x.bezierCurveTo(xx + 6, n / 3, xx - 6, n * 2 / 3, xx, n); x.stroke(); } } }),
  pave: texV((x, n) => { x.fillStyle = gris(95); x.fillRect(0, 0, n, n); const k = 8, s = n / k;
    for (let r = 0; r < k; r++) for (let c = -1; c <= k; c++) { const o = r % 2 ? s / 2 : 0; x.fillStyle = gris(150 + rv() * 60); x.beginPath(); x.roundRect(c * s + o + 3, r * s + 3, s - 6, s - 6, 6); x.fill(); } grain(x, n, 3000, .15); }),
  dalle: texV((x, n) => { x.fillStyle = gris(120); x.fillRect(0, 0, n, n); const k = 4, s = n / k; for (let r = 0; r < k; r++) for (let c = 0; c < k; c++) { x.fillStyle = gris(185 + rv() * 35); x.fillRect(c * s + 2, r * s + 2, s - 4, s - 4); } grain(x, n, 4000, .12); }),
  carrelage: texV((x, n) => { const k = 8, s = n / k; for (let r = 0; r < k; r++) for (let c = 0; c < k; c++) { x.fillStyle = (r + c) % 2 ? gris(235) : gris(150); x.fillRect(c * s, r * s, s, s); } x.fillStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i <= k; i++) { x.fillRect(i * s - 1, 0, 2, n); x.fillRect(0, i * s - 1, n, 2); } }),
};
// matériau : couleur par sommet × texture plaquée selon l'orientation de la face (échelle en mètres par motif)
function matTex(tex, ech, o = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.rough ?? .85, metalness: 0, emissive: o.emissive || '#000000', emissiveIntensity: o.ei ?? 1 });
  m.onBeforeCompile = sh => { sh.uniforms.uT = { value: tex }; sh.uniforms.uS = { value: ech };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vP; varying vec3 vNw;').replace('#include <project_vertex>', '#include <project_vertex>\nvP = (modelMatrix * vec4(transformed, 1.0)).xyz; vNw = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vP; varying vec3 vNw; uniform sampler2D uT; uniform float uS;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 an = abs(vNw); vec2 uv = an.y > max(an.x, an.z) ? vP.xz : (an.x > an.z ? vec2(vP.z, vP.y) : vP.xy);
        diffuseColor.rgb *= texture2D(uT, uv / uS).rgb * 1.6;`); };
  return m;
}
const MV = {
  enduit: matTex(TX.enduit, 3), brique: matTex(TX.brique, 2.4), pierre: matTex(TX.pierre, 2.2), tuile: matTex(TX.tuile, 2.2), bois: matTex(TX.bois, 1.6),
  pave: matTex(TX.pave, 2.4), dalle: matTex(TX.dalle, 2.4), detail: VMAT,
  interieur: matTex(TX.enduit, 3, { emissive: '#5a4a34', ei: .8 }), parquet: matTex(TX.bois, 1.6, { emissive: '#3a2614', ei: .5 }), carrelage: matTex(TX.carrelage, 2, { emissive: '#2e2e2e', ei: .5 }),
  meuble: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7, emissive: '#2a2016', emissiveIntensity: .6 }),
  lumiere: new THREE.MeshStandardMaterial({ vertexColors: true, emissive: '#ffd890', emissiveIntensity: 1.2 }),
};
const VITRE = new THREE.MeshStandardMaterial({ color: '#bfe2f2', roughness: .05, metalness: .2, transparent: true, opacity: .28, depthWrite: false });
const VITRE_ETAGE = new THREE.MeshStandardMaterial({ color: '#4f7f9c', roughness: .08, metalness: .6, emissive: '#1d2c36' });
const EAU_V = new THREE.MeshStandardMaterial({ color: '#4fb3dc', roughness: .1, metalness: .1, transparent: true, opacity: .8 });
function seaux() { const B = {}; for (const k in MV) B[k] = []; B.vitre = []; B.vitreEtage = []; B.eau = []; return B; }
function maillages(B) { const out = [];
  for (const k of ['enduit', 'brique', 'pierre', 'tuile', 'bois', 'pave', 'dalle', 'detail', 'interieur', 'parquet', 'carrelage', 'meuble', 'lumiere']) if (B[k].length) { const m = new THREE.Mesh(merge(B[k]), MV[k]); m.userData.mat = k; out.push(m); }
  for (const [k, mat] of [['vitre', VITRE], ['vitreEtage', VITRE_ETAGE], ['eau', EAU_V]]) if (B[k].length) { const m = new THREE.Mesh(merge(B[k]), mat); m.userData.verre = k !== 'eau'; out.push(m); }
  return out; }
function roue(L, x, y, z, ry, r = .34) { const g = new THREE.CylinderGeometry(r, r, .26, 12).toNonIndexed(); g.deleteAttribute('uv'); g.rotateZ(Math.PI / 2); g.rotateY(ry); g.translate(x, y, z); L.push(paint(g, '#1b1b1b')); }
const ombreV = (c, k) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();

// ---- dimensions d'une boutique (pour la répartition autour de la place) ----
const TERRASSE = { bistro: 1, kebab: 1, poulet: 1, boulangerie: 1 };
function dimsBoutique(b) { const t = b.type || 'boulangerie', W = { barber: 12, bistro: 15, chaussures: 14, boulangerie: 14 }[t] || 13; return [W, 11 + (TERRASSE[t] ? 3.8 : 0)]; }

// ---- un mur percé d'ouvertures : face 'av' (z+), 'ar' (z-), 'g' (x-), 'd' (x+) ----
function murTroue(L, face, W, D, t, u0, u1, y0, y1, trous, col) {
  const box = (ua, ub, ya, yb) => { if (ub - ua < .01 || yb - ya < .01) return; const uc = (ua + ub) / 2, yc = (ya + yb) / 2;
    if (face === 'av') bx(L, ub - ua, yb - ya, t, uc, yc, D / 2 - t / 2, col); else if (face === 'ar') bx(L, ub - ua, yb - ya, t, uc, yc, -D / 2 + t / 2, col);
    else if (face === 'g') bx(L, t, yb - ya, ub - ua, -W / 2 + t / 2, yc, uc, col); else bx(L, t, yb - ya, ub - ua, W / 2 - t / 2, yc, uc, col); };
  const ys = [...new Set([y0, y1, ...trous.flatMap(h => [h[2], h[3]])])].filter(y => y >= y0 && y <= y1).sort((a, b) => a - b);
  for (let i = 0; i < ys.length - 1; i++) { const ya = ys[i], yb = ys[i + 1], ym = (ya + yb) / 2; const tr = trous.filter(h => h[2] <= ym && h[3] >= ym).map(h => [h[0] - h[1] / 2, h[0] + h[1] / 2]).sort((a, b) => a[0] - b[0]);
    let u = u0; for (const [a, b] of tr) { box(u, a, ya, yb); u = Math.max(u, b); } box(u, u1, ya, yb); }
}
// fenêtre dans une ouverture (cadre, vitre, appui, volets)
function fenetreV(B, face, W, D, t, uc, w, yb, yt, o) {
  const pose = (L, du, dy, dd, u, y, n) => { // n = décalage vers l'extérieur depuis le nu du mur
    if (face === 'av') bx(L, du, dy, dd, u, y, D / 2 + n); else if (face === 'ar') bx(L, du, dy, dd, u, y, -D / 2 - n); else if (face === 'g') bx(L, dd, dy, du, -W / 2 - n, y, u); else bx(L, dd, dy, du, W / 2 + n, y, u); };
  const col = o.cadre || '#f7f3ea', h = yt - yb, ym = (yb + yt) / 2;
  pose(B.detail, w, .1, t, uc, yt - .05, -t / 2); pose(B.detail, w, .1, t, uc, yb + .05, -t / 2);
  pose(B.detail, .1, h, t, uc - w / 2 + .05, ym, -t / 2); pose(B.detail, .1, h, t, uc + w / 2 - .05, ym, -t / 2);
  if (o.croisillon !== false) { pose(B.detail, .07, h, .08, uc, ym, -t * .55); pose(B.detail, w, .07, .08, uc, yb + h * .62, -t * .55); }
  pose(o.vitrine ? B.vitre : B.vitreEtage, w - .1, h - .1, .04, uc, ym, -t * .6);
  if (!o.vitrine) pose(B.pierre, w + .3, .12, .3, uc, yb - .06, .1);                       // appui
  if (o.volets) for (const s of [-1, 1]) pose(B.bois, w * .5, h + .05, .06, uc + s * (w * .75 + .02), ym, .04);
  if (o.jardiniere) { pose(B.bois, w * .9, .28, .3, uc, yb + .1, .25); for (let i = 0; i < 5; i++) pose(B.detail, .2, .2, .2, uc - w * .36 + i * w * .18, yb + .32, .27); }
}

// ---- LA BOUTIQUE (rez-de-chaussée visitable + 2 étages) ----
function construireBoutique(b) {
  const t = b.type || 'boulangerie';
  const C = { boulangerie: ['#f6e3c4', '#9e3f2f', '#c0392b'], barber: ['#e9eef2', '#2b2b33', '#1f5fbf'], kebab: ['#f3d9a4', '#7a3b22', '#1f8a4c'], poulet: ['#fff4e0', '#b8261f', '#e8392c'],
    bistro: ['#e9dcc4', '#3e5c45', '#7a1f2b'], chaussures: ['#eef0f4', '#24324a', '#ff6a1a'] }[t] || ['#efe2cc', '#8a4a32', '#2f6fa8'];
  const mur = b.couleur || C[0], toitC = b.toit || C[1], store = b.store || C[2];
  const [W, Dt] = dimsBoutique(b), D = 11, terr = Dt - D, oz = -terr / 2;   // la terrasse est devant (z+), l'ensemble centré
  const t0 = .3, R0 = 4.2, E = 3.2, NE = 2, H = R0 + NE * E, B = seaux();
  const g = new THREE.Group();
  // --- rez-de-chaussée : pierre, grande vitrine, porte ouverte ---
  const porte = [0, 1.8, 0, 2.9], vit = [[-W / 4 - .4, W / 2 - 3.2, .7, 3.0], [W / 4 + .4, W / 2 - 3.2, .7, 3.0]];
  murTroue(B.pierre, 'av', W, D, t0, -W / 2, W / 2, 0, R0, [porte, ...vit], '#e6ddcb');
  murTroue(B.pierre, 'ar', W, D, t0, -W / 2, W / 2, 0, R0, [], '#e6ddcb');
  murTroue(B.pierre, 'g', W, D, t0, -D / 2 + t0, D / 2 - t0, 0, R0, [[0, 2.2, 1.2, 2.9]], '#e6ddcb');
  murTroue(B.pierre, 'd', W, D, t0, -D / 2 + t0, D / 2 - t0, 0, R0, [[0, 2.2, 1.2, 2.9]], '#e6ddcb');
  for (const [u, w, yb, yt] of vit) fenetreV(B, 'av', W, D, t0, u, w, yb, yt, { vitrine: true, cadre: '#2b2b2b' });
  for (const f of ['g', 'd']) fenetreV(B, f, W, D, t0, 0, 2.2, 1.2, 2.9, { vitrine: true, cadre: '#2b2b2b' });
  bx(B.bois, 1.9, .12, .14, 0, 2.95, D / 2 + .02, '#3a2a1c'); for (const s of [-1, 1]) bx(B.bois, .12, 2.9, .14, s * .95, 1.45, D / 2 + .02, '#3a2a1c');   // encadrement de porte
  bx(B.detail, 1.6, .03, 1, 0, .17, D / 2 + .6, '#7a2a20');                                                                                     // paillasson
  // --- étages : enduit coloré, fenêtres à volets, balcon ---
  const nf = W >= 14 ? 3 : 2, us = nf === 3 ? [-W / 3, 0, W / 3] : [-W / 4, W / 4];
  for (let e = 0; e < NE; e++) { const y0 = R0 + e * E, y1 = y0 + E, fb = y0 + .9, ft = y0 + 2.6, tr = us.map(u => [u, 1.25, fb, ft]);
    murTroue(B.enduit, 'av', W, D, t0, -W / 2, W / 2, y0, y1, tr, mur); murTroue(B.enduit, 'ar', W, D, t0, -W / 2, W / 2, y0, y1, tr, mur);
    murTroue(B.enduit, 'g', W, D, t0, -D / 2 + t0, D / 2 - t0, y0, y1, [[-2, 1.2, fb, ft], [2, 1.2, fb, ft]], mur); murTroue(B.enduit, 'd', W, D, t0, -D / 2 + t0, D / 2 - t0, y0, y1, [[-2, 1.2, fb, ft], [2, 1.2, fb, ft]], mur);
    us.forEach((u, i) => { fenetreV(B, 'av', W, D, t0, u, 1.25, fb, ft, { volets: true, jardiniere: e === 1 && i !== 1 }); fenetreV(B, 'ar', W, D, t0, u, 1.25, fb, ft, { volets: true }); });
    for (const f of ['g', 'd']) for (const u of [-2, 2]) fenetreV(B, f, W, D, t0, u, 1.2, fb, ft, {});
    bx(B.pierre, W + .2, .22, D + .2, 0, y0, 0, '#d9cfbd'); }                                                                                     // bandeaux d'étage
  // balcon du 1er étage (fenêtre du milieu)
  { const u = nf === 3 ? 0 : us[1], y = R0 + .02; bx(B.pierre, 2.4, .18, 1, u, y, D / 2 + .5, '#d9cfbd');
    for (let i = 0; i <= 8; i++) bx(B.detail, .05, .9, .05, u - 1.15 + i * .2875, y + .55, D / 2 + .95, '#2b2b2b'); bx(B.detail, 2.4, .06, .08, u, y + 1, D / 2 + .95, '#2b2b2b');
    for (const s of [-1, 1]) { bx(B.detail, .06, .9, .9, u + s * 1.18, y + .55, D / 2 + .5, '#2b2b2b'); } bx(B.bois, 1.8, .25, .25, u, y + .25, D / 2 + .8, '#6b4a2e'); for (let i = 0; i < 7; i++) sph(B.detail, .14, u - .75 + i * .25, y + .45, D / 2 + .8, ['#e04a6b', '#ffd23f', '#ffffff', '#b06ad9'][i % 4]); }
  // chaînages d'angle, corniche, toit en tuiles, cheminée, gouttières
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let y = R0; y < H; y += .6) bx(B.pierre, .5 + (Math.round(y / .6) % 2) * .2, .55, .5 + (Math.round(y / .6) % 2 ? 0 : .2), sx * (W / 2 - .2), y + .3, sz * (D / 2 - .2), '#ddd3c1');
  bx(B.pierre, W + .7, .35, D + .7, 0, H + .15, 0, '#e3dacb'); bx(B.pierre, W + .5, .2, D + .5, 0, H - .1, 0, '#cfc5b3');
  prism(B.tuile, W + .9, D + 1.2, 3.8, H + .3, toitC);
  bx(B.brique, 1, 2.6, 1, W * .28, H + 3.2, -D * .18, '#a0503a'); bx(B.pierre, 1.2, .2, 1.2, W * .28, H + 4.5, -D * .18, '#cfc5b3');
  for (const sx of [-1, 1]) { cyl(B.detail, .07, .07, H, sx * (W / 2 + .05), H / 2, D / 2 + .05, '#6f747a', 6); }
  // enseigne lumineuse + lampes, store rayé
  const ens = b.enseigne || enseigneDe(b.nom || 'BOUTIQUE');
  bx(B.bois, W - 2.6, 1.1, .14, 0, 3.55, D / 2 + .1, '#1f2a24');
  for (const s of [-1, 0, 1]) { bx(B.detail, .05, .05, .5, s * (W / 3), 4.2, D / 2 + .35, '#2b2b2b'); bx(B.lumiere, .3, .12, .2, s * (W / 3), 4.12, D / 2 + .6, '#fff2c8'); }
  { const n = Math.round((W - 1) / .55), w = (W - 1) / n; for (let i = 0; i < n; i++) { const c = i % 2 ? '#ffffff' : store; bx(B.detail, w, .05, 1.6, -W / 2 + .5 + w * (i + .5), 2.75, D / 2 + .75, c, 0, .38); bx(B.detail, w, .3, .04, -W / 2 + .5 + w * (i + .5), 2.32, D / 2 + 1.5, c); } }
  for (const s of [-1, 1]) { bx(B.detail, .08, .4, .08, s * 1.3, 2.2, D / 2 + .1, '#2b2b2b'); sph(B.lumiere, .13, s * 1.3, 2.45, D / 2 + .2, '#fff2c8'); }                   // appliques
  // --- intérieur visitable ---
  bx(B[t === 'barber' || t === 'poulet' || t === 'kebab' ? 'carrelage' : 'parquet'], W - .6, .15, D - .6, 0, .075, 0, t === 'barber' ? '#ffffff' : '#c99a6a');
  bx(B.interieur, W - .6, .3, D - .6, 0, R0 - .15, 0, '#f5efe4');                                          // plafond
  for (const [x, z] of [[-W / 4, 0], [W / 4, 0]]) { bx(B.lumiere, 1.6, .06, .5, x, R0 - .33, z, '#fff6dc'); }
  { const W2 = W - 2 * t0 - .02, D2 = D - 2 * t0 - .02, peint = ombreV(mur, 1.04), trA = [porte, ...vit], trS = [[0, 2.2, 1.2, 2.9]];   // doublage intérieur peint + lambris bois
    for (const [f, tr, u0, u1] of [['av', trA, -W2 / 2, W2 / 2], ['ar', [], -W2 / 2, W2 / 2], ['g', trS, -D2 / 2, D2 / 2], ['d', trS, -D2 / 2, D2 / 2]]) {
      murTroue(B.interieur, f, W2, D2, .03, u0, u1, 1.1, R0 - .3, tr, peint); murTroue(B.bois, f, W2 - .06, D2 - .06, .05, u0 + .03, u1 - .03, .15, 1.1, tr, '#8a5a3a'); } }
  const zf = -D / 2 + .8, M = B.meuble;
  const etageres = (x, w, cols) => { bx(M, w, 2.6, .5, x, 1.45, zf, '#6b4a2e'); for (let k = 0; k < 4; k++) { bx(M, w, .05, .5, x, .5 + k * .6, zf + .02, '#8a6a48'); for (let i = 0; i < Math.floor(w / .35); i++) bx(M, .24, .26, .3, x - w / 2 + .25 + i * .35, .66 + k * .6, zf + .05, cols[(i + k) % cols.length]); } };
  const comptoir = (x, z, w, col) => { bx(M, w, 1.05, .8, x, .6, z, col); bx(M, w + .1, .06, .9, x, 1.15, z, '#2b2b2b'); };
  if (t === 'boulangerie') { etageres(-W / 4, 4, ['#c98a3e', '#a8662a', '#e0b06a']); comptoir(W / 6, -.5, 4.5, '#7a4a2e'); bx(B.vitre, 4.3, .6, .6, W / 6, 1.5, -.3, '#fff');
    for (let i = 0; i < 8; i++) sph(M, .18, W / 6 - 1.8 + i * .5, 1.28, -.4, '#d79a4a', 1.6, .6, .8); }
  else if (t === 'barber') { for (const x of [-3, 0, 3]) { bx(M, .9, .5, .8, x, .55, -2.5, '#b8261f'); bx(M, .9, .9, .15, x, 1.2, -2.85, '#b8261f'); cyl(M, .25, .35, .3, x, .2, -2.5, '#cfcfcf', 10); bx(B.vitreEtage, 1.4, 1.2, .05, x, 1.9, zf - .2, '#fff'); }
    comptoir(W / 2 - 1.6, 1.5, 1.6, '#2b2b33'); }
  else if (t === 'kebab' || t === 'poulet') { comptoir(0, -1.6, W - 3, t === 'kebab' ? '#1f8a4c' : '#b8261f'); if (t === 'kebab') { cyl(M, .1, .1, 1.4, -1.5, 1.9, -2.6, '#888', 6); cyl(M, .32, .5, 1.1, -1.5, 1.8, -2.6, '#8a4a22', 10); }
    else for (let i = 0; i < 3; i++) bx(M, .8, .7, .7, -2 + i * 1.2, 1.5, -2.7, '#aab0b5');
    bx(B.lumiere, W - 4, 1, .06, 0, 3.1, zf - .2, '#2b2b2b'); for (const x of [-3, 0, 3]) { cyl(M, .3, .3, .05, x, .75, 1.2, '#eee', 12); cyl(M, .05, .05, .75, x, .38, 1.2, '#333', 6); } }
  else if (t === 'bistro') { comptoir(-W / 4, -2.2, 5, '#5a2a1c'); for (let i = 0; i < 9; i++) bx(M, .12, .35, .12, -W / 4 - 2 + i * .5, 2.2, zf + .05, ['#2f6b3a', '#7a1f2b', '#c9a33a'][i % 3]); bx(M, 5, .06, .4, -W / 4, 2, zf, '#6b4a2e');
    for (const x of [W / 6, W / 3]) for (const z of [-1.5, 1.5]) { cyl(M, .45, .45, .05, x, .78, z, '#5a2a1c', 12); cyl(M, .05, .05, .78, x, .39, z, '#222', 6); for (const s of [-1, 1]) bx(M, .4, .45, .4, x + s * .7, .25, z, '#3a2a1c'); } }
  else if (t === 'chaussures') { etageres(-W / 4, 4.5, ['#ff6a1a', '#ffffff', '#1f5fbf', '#2b2b2b', '#e8392c']); etageres(W / 4, 4.5, ['#2b2b2b', '#ffd23f', '#ffffff', '#2fb36b']); bx(M, 3, .45, .9, 0, .3, .5, '#24324a'); bx(B.vitreEtage, 1, 1.8, .05, W / 2 - .45, 1.5, 0, '#fff'); }
  else { etageres(-W / 4, 4, ['#e8452c', '#2f7fe0', '#2fb36b', '#ffd34d']); comptoir(W / 5, -.8, 3, '#6b4a2e'); }
  // --- terrasse ---
  if (terr > 0) { const z0 = D / 2 + 1.7 + terr / 2; bx(B.bois, W - 1, .1, terr - .2, 0, .05, z0, '#a07a52');
    for (const x of [-W / 3, 0, W / 3]) { cyl(B.detail, .5, .5, .05, x, .78, z0, '#f4f1ea', 14); cyl(B.detail, .05, .05, .78, x, .4, z0, '#2b2b2b', 6); for (const s of [-1, 1]) { bx(B.detail, .42, .05, .42, x + s * .8, .46, z0, '#2b2b2b'); bx(B.detail, .42, .45, .05, x + s * .8, .7, z0 - s * .0 - .2, '#2b2b2b'); }
      if (t === 'bistro' || t === 'boulangerie') { cyl(B.detail, .04, .04, 2.4, x, 1.2, z0, '#ddd', 6); const pg = new THREE.ConeGeometry(1.4, .6, 8).toNonIndexed(); pg.deleteAttribute('uv'); pg.translate(x, 2.5, z0); B.detail.push(paint(pg, store)); } }
    for (const s of [-1, 1]) { bx(B.bois, .5, .5, .5, s * (W / 2 - .7), .25, z0 + terr / 2 - .4, '#6b4a2e'); sph(B.detail, .45, s * (W / 2 - .7), .8, z0 + terr / 2 - .4, '#3f7f3a'); } }
  const ms = maillages(B); for (const m of ms) { m.position.z = oz; g.add(m); }
  // le 1er enfant doit être le mur principal (emprise) : on met la pierre du rez-de-chaussée en tête
  g.children.sort((a, c) => (a.userData.mat === 'pierre' ? -1 : 0) - (c.userData.mat === 'pierre' ? -1 : 0));
  const pn = panneau(Array.isArray(ens) ? ens : [ens], W - 2.8, 1.0, '#1f2a24', '#f2c14e'); pn.position.set(0, 3.55, D / 2 + .18 + oz); g.add(pn);
  return g;
}

// ---- arbres en 3D (modèle Higgsfield instancié) ----
const ARBRES3D = [];
function planterArbres3D() { if (!MOD.arbre || !ARBRES3D.length) return; MOD.arbre.scene.updateMatrixWorld(true); let mesh = null; MOD.arbre.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; }); if (!mesh) return;
  const geo = new THREE.BufferGeometry(), src = mesh.geometry;   // attributs « quantifiés » → flottants (sinon l'échelle est écrêtée)
  for (const k in src.attributes) { const a = src.attributes[k], f = new Float32Array(a.count * a.itemSize); for (let i = 0; i < a.count; i++) for (let c = 0; c < a.itemSize; c++) f[i * a.itemSize + c] = a.getComponent(i, c); geo.setAttribute(k, new THREE.BufferAttribute(f, a.itemSize)); }
  if (src.index) geo.setIndex(src.index.clone()); geo.applyMatrix4(mesh.matrixWorld); geo.computeBoundingBox(); const b = geo.boundingBox, k = 1 / (b.max.y - b.min.y);
  geo.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); geo.scale(k, k, k);   // 1 m de haut, posé à y = 0
  const im = new THREE.InstancedMesh(geo, mesh.material, ARBRES3D.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  ARBRES3D.forEach(([x, y, z, h], i) => { Q.setFromAxisAngle(up, hash(i, 61) * 6.28); const s2 = h * (.85 + hash(i, 62) * .3); M.compose(new THREE.Vector3(x, y, z), Q, new THREE.Vector3(s2, s2, s2)); im.setMatrixAt(i, M); });
  im.castShadow = true; im.receiveShadow = true; scene.add(im); return im; }

// ---- la place, les rues et le mobilier ----
function lampadaireV(L, Lm, x, y, z) { cyl(L, .09, .14, 4.4, x, y + 2.2, z, '#22262a', 8); cyl(L, .2, .26, .35, x, y + .17, z, '#22262a', 8); bx(L, .5, .08, .5, x, y + 4.45, z, '#22262a'); bx(Lm, .34, .5, .34, x, y + 4.15, z, '#fff0c4'); bx(L, .44, .06, .44, x, y + 3.88, z, '#22262a'); }
function bancV(L, x, y, z, ry) { const H = []; for (let i = 0; i < 4; i++) bx(H, 1.9, .06, .13, 0, .48, -.24 + i * .16, '#8a5a3a'); for (let i = 0; i < 3; i++) bx(H, 1.9, .12, .05, 0, .65 + i * .16, -.33, '#8a5a3a'); for (const s of [-1, 1]) { bx(H, .07, .5, .55, s * .82, .25, 0, '#22262a'); bx(H, .07, .55, .06, s * .82, .7, -.33, '#22262a'); }
  for (const g of H) { g.rotateY(ry); g.translate(x, y, z); L.push(g); } }
function poubelleV(L, x, y, z) { cyl(L, .26, .24, .8, x, y + .4, z, '#2f5d3a', 10); cyl(L, .29, .29, .06, x, y + .82, z, '#22262a', 10); }
function voitureV(L, x, y, z, ry, col) { const H = [], c2 = ombreV(col, .8);
  bx(H, 1.8, .55, 4.1, 0, .6, 0, col); bx(H, 1.75, .25, 4.0, 0, .3, 0, '#2b2b2b'); bx(H, 1.62, .62, 2.1, 0, 1.18, -.2, c2); bx(H, 1.66, .5, 1.9, 0, 1.2, -.2, '#2c3e4f');
  bx(H, 1.64, .06, 2.15, 0, 1.52, -.2, col); for (const s of [-1, 1]) { bx(H, .35, .16, .05, s * .6, .7, 2.06, '#fff6d0'); bx(H, .35, .14, .05, s * .6, .7, -2.06, '#c0281e'); }
  for (const g of H) { g.rotateY(ry); g.translate(x, y, z); L.push(g); }
  for (const [a, b2] of [[-.9, 1.3], [.9, 1.3], [-.9, -1.3], [.9, -1.3]]) roue(L, x + a * Math.cos(ry) + b2 * Math.sin(ry), y + .34, z - a * Math.sin(ry) + b2 * Math.cos(ry), ry); }
function arbreV(L, x, y, z, s = 1) { cyl(L, .18 * s, .28 * s, 2.6 * s, x, y + 1.3 * s, z, '#5a3d26', 7); for (const [dx, dy, dz, r, c] of [[0, 3.2, 0, 1.5, '#3f8a3a'], [.7, 3.7, .3, 1.1, '#4f9a45'], [-.6, 3.5, -.4, 1.1, '#38803a'], [.1, 4.2, -.2, .9, '#5fae52']]) {
  const g = new THREE.IcosahedronGeometry(r * s, 1).toNonIndexed(); g.deleteAttribute('uv'); g.translate(x + dx * s, y + dy * s, z + dz * s); L.push(paint(g, c)); } }

function construireVille(boutiques) {
  if (!capitale) return; const [px, hp, pz] = capitale.userData.place, NR = (E.capitale && E.capitale.rues) || 5, RV2 = (E.capitale && E.capitale.rayon) || 42, R = 13.5, y = hp + .3;
  for (const m of capitale.children) if (m.isMesh && !(m.userData.d > 0)) m.visible = false;        // ancienne place + rues de la maquette
  const B = seaux(), Lm = B.lumiere;
  // emprises des boutiques (pour ne rien poser dedans)
  const boites = boutiques.map(g => { const a = g.rotation.y; return { x: g.position.x, z: g.position.z, c: Math.cos(a), s: Math.sin(a), hw: 8.5, hd: 8.5 }; });
  const libre = (x, z, m = 1) => !boites.some(o => { const dx = x - o.x, dz = z - o.z, lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c; return Math.abs(lx) < o.hw + m && Math.abs(lz) < o.hd + m; })
    && !(flagG && Math.hypot(x - flagG.position.x, z - flagG.position.z) < 2.2);
  // place : grand disque pavé + bordure, fontaine à deux vasques
  cyl(B.pierre, R + .5, R + .5, 7, px, y - 3.55, pz, '#bfb5a3', 48); cyl(B.pave, R, R, .1, px, y + .02, pz, '#c9bfae', 48);
  for (let r = 5; r < R; r += 2.6) cyl(B.dalle, r + .25, r + .25, .11, px, y + .025, pz, '#d8cfbf', 48), cyl(B.pave, r, r, .12, px, y + .03, pz, '#c4b9a6', 48);
  { const geo = (G, yy) => { const g2 = G.toNonIndexed(); g2.deleteAttribute('uv'); g2.translate(px, yy, pz); return paint(g2, '#ddd3c1'); };   // vasque en anneau : on voit l'eau dedans
    B.pierre.push(geo(new THREE.CylinderGeometry(4.1, 4.3, .75, 32, 1, true), y + .37), geo(new THREE.CylinderGeometry(3.7, 3.7, .75, 32, 1, true).scale(-1, 1, 1), y + .37), geo(new THREE.RingGeometry(3.7, 4.1, 32).rotateX(-Math.PI / 2), y + .75));
    const e2 = new THREE.CylinderGeometry(3.7, 3.7, .1, 32).toNonIndexed(); e2.deleteAttribute('uv'); e2.translate(px, y + .55, pz); B.eau.push(paint(e2, '#fff')); }
  cyl(B.pierre, .5, .7, 2.4, px, y + 1.6, pz, '#e3dacb', 12); cyl(B.pierre, 1.8, .6, .45, px, y + 2.9, pz, '#e3dacb', 18); cyl(B.pierre, .25, .35, 1, px, y + 3.6, pz, '#e3dacb', 10); sph(B.pierre, .35, px, y + 4.2, pz, '#e8c35a');
  B.eau.push(paint((() => { const g2 = new THREE.CylinderGeometry(1.6, 1.6, .08, 18).toNonIndexed(); g2.deleteAttribute('uv'); g2.translate(px, y + 3.1, pz); return g2; })(), '#fff'));
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, g2 = new THREE.CylinderGeometry(.05, .09, 2.3, 6).toNonIndexed(); g2.deleteAttribute('uv'); g2.translate(px + Math.cos(a) * 1.65, y + 1.85, pz + Math.sin(a) * 1.65); B.eau.push(paint(g2, '#fff')); }   // filets d'eau
  // massifs, bancs, arbres, lampadaires autour de la fontaine (entre les rues)
  for (let i = 0; i < NR; i++) { const a = .3 + (i + .5) / NR * Math.PI * 2, cx = px + Math.cos(a) * 8.5, cz = pz + Math.sin(a) * 8.5;
    if (libre(cx, cz)) { cyl(B.pierre, 1.6, 1.7, .4, cx, y + .2, cz, '#cfc5b3', 16); cyl(B.detail, 1.45, 1.45, .3, cx, y + .32, cz, '#4a3626', 16); if (MOD.arbre) ARBRES3D.push([cx, y + .4, cz, 6.5]); else arbreV(B.detail, cx, y + .4, cz, .9);
      for (let k = 0; k < 10; k++) sph(B.detail, .15, cx + Math.cos(k) * 1.1, y + .55, cz + Math.sin(k) * 1.1, ['#e04a6b', '#ffd23f', '#ffffff', '#b06ad9'][k % 4]); }
    for (const s of [-1, 1]) { const b2 = a + s * .32, bx2 = px + Math.cos(b2) * 6.3, bz2 = pz + Math.sin(b2) * 6.3; if (libre(bx2, bz2)) bancV(B.detail, bx2, y, bz2, -b2 - Math.PI / 2); }
    const la = .3 + i / NR * Math.PI * 2; for (const s of [-1, 1]) { const lx = px + Math.cos(la) * 12 - Math.sin(la) * s * 3.6, lz = pz + Math.sin(la) * 12 + Math.cos(la) * s * 3.6; if (libre(lx, lz, .3)) lampadaireV(B.detail, Lm, lx, y, lz); } }
  // rues : chaussée pavée + trottoirs dallés + bordures, qui suivent le terrain
  const ruban = (L, a, d0, d1, o0, o1, dy, col) => { const pos = [], c3 = new THREE.Color(col); const ca = Math.cos(a), sa = Math.sin(a);
    for (let r = d0; r < d1 - .01; r += 2) { const r2 = Math.min(d1, r + 2), P4 = [[r, o0], [r, o1], [r2, o0], [r2, o1]].map(([rr, o]) => { const x = px + ca * rr - sa * o, z = pz + sa * rr + ca * o; return [x, height(x, z) + dy, z]; });
      for (const q of [P4[0], P4[1], P4[2], P4[1], P4[3], P4[2]]) pos.push(...q); }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g2.computeVertexNormals(); L.push(paint(g2, col)); };
  for (let i = 0; i < NR; i++) { const a = .3 + i / NR * Math.PI * 2, d0 = R - .2, d1 = RV2 + 6;
    ruban(B.pave, a, d0, d1, -2.6, 2.6, .3, '#9d9488'); for (const s of [-1, 1]) { const [o0, o1] = s < 0 ? [-4.4, -2.6] : [2.6, 4.4]; ruban(B.dalle, a, d0, d1, o0, o1, .42, '#d6cdbd'); ruban(B.pierre, a, d0, d1, s < 0 ? -2.75 : 2.55, s < 0 ? -2.55 : 2.75, .43, '#b9b0a0'); }
    for (let r = 18; r < d1 - 2; r += 11) for (const s of [-1, 1]) { const o = s * 3.9, x = px + Math.cos(a) * r - Math.sin(a) * o, z = pz + Math.sin(a) * r + Math.cos(a) * o, yy = height(x, z) + .42;
      if (Math.round(r / 11) % 2 === (s > 0 ? 0 : 1)) { if (libre(x, z, .3)) lampadaireV(B.detail, Lm, x, yy, z); } else if (libre(x, z, .3)) { bancV(B.detail, x - Math.sin(a) * s * .1, yy, z + Math.cos(a) * s * .1, -a + (s > 0 ? Math.PI : 0) - Math.PI / 2); const x2 = x + Math.cos(a) * 1.4, z2 = z + Math.sin(a) * 1.4; if (libre(x2, z2, .2)) poubelleV(B.detail, x2, yy, z2); } }
    if (i % 2 === 0) for (const [r, s] of [[24, 1], [36, -1]]) { const o = s * 1.6, x = px + Math.cos(a) * r - Math.sin(a) * o, z = pz + Math.sin(a) * r + Math.cos(a) * o; voitureV(B.detail, x, height(x, z) + .3, z, Math.atan2(Math.cos(a), Math.sin(a)) + (s > 0 ? 0 : Math.PI), ['#c0392b', '#2f6fa8', '#f2c14e', '#2b2b2b', '#ecf0f1', '#27ae60'][(i * 2 + (s > 0 ? 0 : 1)) % 6]); } }
  if (MOD.arbre) for (let i = 0, n = 0; i < 400 && n < 30; i++) { const a = hash(i, 71) * Math.PI * 2, r = RV2 + 12 + hash(i, 72) * 40, x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r, h = height(x, z);
    if (h < 1.5 || riverDist(x, z) < 20 || !libre(x, z, 6) || PADS.some(q => Math.hypot(q.x - x, q.z - z) < Math.max(q.hw, q.hd) + 6)) continue; ARBRES3D.push([x, h - .2, z, 6 + hash(i, 73) * 3]); n++; }
  planterArbres3D();
  const grp = new THREE.Group(); grp.name = 'ville-jeu'; for (const m of maillages(B)) grp.add(m); scene.add(grp); return grp;
}
