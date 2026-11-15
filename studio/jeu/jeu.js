// ================= JEU VULKARIS — balade solo (ajouté après le décor de scene.html, dans un bloc) =================
const D = window.JEU_DATA;
const $ = id => document.getElementById(id);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });
const STEP = .6;            // hauteur de marche franchissable
const TAILLE = 1.9;         // taille du perso (porte ≈ 2,3)

// ---- le monde (même décor que la vidéo) ----
const HAUTS = D.hauts; // {x, z, rot}
PADDEF.jeu_hauts = [0, 0, 66, 39];
const E = JSON.parse(JSON.stringify(D.etat));
E.batiments = (E.batiments || []).filter(b => b.type !== 'quartier_hauts').concat([{ type: 'jeu_hauts', pos: [HAUTS.x, HAUTS.z], rot: HAUTS.rot }]);
setup({ etat: E, habitants: { n: D.habitants, t0: 0 }, vis: () => false, prog: () => 1 });
for (const o of [city, villA, villB, cloudLayer, pinA, pinB, toi]) o.visible = false;
for (const g of speciaux) { g.visible = true; g.userData.inner.scale.set(1, 1, 1); }

// ================= Les Hauts de Plavulca : maisons achetées, code EXACT de la boutique =================
const parcelle = window.fabriqueBoutique(THREE, renderer);
sansArbres(HAUTS.x, HAUTS.z, 85);
const hy = height(HAUTS.x, HAUTS.z);
const hauts = new THREE.Group(); hauts.position.set(HAUTS.x, hy, HAUTS.z); hauts.rotation.y = HAUTS.rot; scene.add(hauts);
{ const L = [];
  bx(L, 134, 1, 80, 0, -.52, 0, '#7fb35f');
  bx(L, 128, .1, 9, 0, .03, 0, '#cbbfa6'); for (let i = 0; i < 64; i++) bx(L, .08, .11, 9, -63 + i * 2, .04, 0, '#b9ad94');
  for (const s of [-1, 1]) bx(L, 128, .22, .3, 0, .1, s * 4.6, '#9a948a');
  for (let x = -54; x <= 54; x += 18) for (const s of [-1, 1]) lampadaire(L, x + 9, s * 4.2);
  for (const s of [-1, 1]) { bx(L, 1.8, 7, 1.8, -64, 3.5, s * 5.6, '#d6cfc2'); bx(L, 2.2, .5, 2.2, -64, 7.2, s * 5.6, '#bdb6a8'); sph(L, .7, -64, 8, s * 5.6, '#f2c14e'); }
  bx(L, 1, 1, 13, -64, 7.6, 0, '#6b4a2e');
  for (const x of [-66, 66]) for (const z of [-22, 22]) arbreB(L, x, z, .8);
  hauts.add(new THREE.Mesh(merge(L), VMAT));
  for (const ry of [-Math.PI / 2, Math.PI / 2]) { const pn = panneau(['LES HAUTS DE PLAVULCA'], 12, 1.7, '#1f4a6e', '#ffd34d'); pn.position.set(-64 + (ry < 0 ? -.6 : .6), 8.9, 0); pn.rotation.y = ry; hauts.add(pn); }
}
function etiquette(txt, couleur = '#ffd34d') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  let f = 72; x.font = `${f}px L`; while (x.measureText(txt).width > 480 && f > 24) { f -= 4; x.font = `${f}px L`; }
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = 12; x.strokeStyle = '#3b2412'; x.strokeText(txt, 256, 66); x.fillStyle = couleur; x.fillText(txt, 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); s.scale.set(10, 2.5, 1); return s;
}
const LOTS = [];
const SLOTS = []; for (const s of [-1, 1]) for (const x of [-45, -15, 15, 45]) SLOTS.push([x, s]);
D.lots.forEach((lot, i) => {
  const [x, s] = SLOTS[i]; const g = new THREE.Group(); g.position.set(x, 0, s * 20); g.rotation.y = s > 0 ? Math.PI : 0; hauts.add(g);
  if (lot.etat) {
    const p = parcelle(lot.etat); g.add(p.g);
    const et = etiquette('⭐ ' + lot.pseudo); et.position.set(0, lot.etat.maison === 'cabane' ? 9 : 14, -7.5); g.add(et);
  } else {
    const L = []; bx(L, 30, .4, 30, 0, -.2, 0, '#86c06a'); for (let k = 0; k < 6; k++) bx(L, 30, .41, 2, 0, -.2, -12 + k * 5, '#7db662');
    cloture(L, 0, -14.6, 29, 0, '#f4f1ea'); cloture(L, -14.6, 0, 29, Math.PI / 2, '#f4f1ea'); cloture(L, 14.6, 0, 29, Math.PI / 2, '#f4f1ea'); cloture(L, -8.5, 14.6, 12, 0, '#f4f1ea'); cloture(L, 8.5, 14.6, 12, 0, '#f4f1ea');
    for (const dx of [-2.6, 2.6]) bx(L, .22, 3.2, .22, dx, 1.6, 9, '#5a3a22');
    g.add(new THREE.Mesh(merge(L), VMAT));
    for (const [ry, dz] of [[0, .03], [Math.PI, -.03]]) { const pn = panneau(['À VENDRE', 'Parcelle ' + lot.n], 5.4, 2.4, '#c0281e', '#ffffff'); pn.position.set(0, 2.6, 9 + dz); pn.rotation.y = ry; g.add(pn); }
  }
  g.updateWorldMatrix(true, false); const c = new THREE.Vector3().applyMatrix4(g.matrixWorld);
  LOTS.push({ ...lot, monde: [c.x, c.z], g });
});
const versHauts = (lx, lz) => new THREE.Vector3(lx, 0, lz).applyMatrix4(hauts.matrixWorld);
function dansHauts(x, z, mx = 0, mz = 0) { const lx = x - HAUTS.x, lz = z - HAUTS.z, c = Math.cos(HAUTS.rot), s = Math.sin(HAUTS.rot); return Math.abs(lx * c - lz * s) < 66 + mx && Math.abs(lx * s + lz * c) < 39 + mz; }

// ================= CHEMINS : de la ville vers chaque lieu (A* sur grille, contourne bâtiments et mer) =================
const place = capitale ? capitale.userData.place : [SITES.plage[0], height(...SITES.plage), SITES.plage[1]];
const cap = capSite || [place[0], place[2]], RV = (E.capitale && E.capitale.rayon) || 42, NRUES = (E.capitale && E.capitale.rues) || 5;
const RAD = { universite: 18, ferme: 16, karting: 34, caserne_pompiers: 10, mine: 12, forge: 8, port: 6, prison: 16, aeroport: 50, chantier_naval: 8, labo_marin: 12, defense: 34, base_militaire: 40, hopital: 14, observatoire: 14, explorateurs: 18, reserve: 22 };
const GN = 160, GS = 4, gx = i => -320 + (i + .5) * GS;
const GH = new Float32Array(GN * GN), GB = new Uint8Array(GN * GN), GO = new Uint8Array(GN * GN), USE = new Uint8Array(GN * GN);
const obst = (E.batiments || []).filter(b => b.pos && b.type !== 'sentier' && b.type !== 'jeu_hauts').map(b => ({ x: b.pos[0], z: b.pos[1], r: (RAD[b.type] || 8) + 3 }));
for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const x = gx(i), z = gx(j), k = j * GN + i; GH[k] = height(x, z);
  if (GH[k] < .9 || Math.hypot(x - cap[0], z - cap[1]) < RV + 2 || dansHauts(x, z, 2, 2)) GB[k] = 1; if (obst.some(o => Math.hypot(x - o.x, z - o.z) < o.r)) GO[k] = 1; }
const node = (x, z) => Math.max(0, Math.min(GN - 1, Math.floor((x + 320) / GS))) + Math.max(0, Math.min(GN - 1, Math.floor((z + 320) / GS))) * GN;
function astar(a, b) {
  const g = new Float32Array(GN * GN).fill(1e9), from = new Int32Array(GN * GN).fill(-1), shut = new Uint8Array(GN * GN), H = [];
  const push = (k, f) => { H.push([f, k]); let i = H.length - 1; while (i) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return top; };
  const bi = b % GN, bj = (b / GN) | 0, hh = k => Math.hypot(k % GN - bi, ((k / GN) | 0) - bj) * GS * .8;
  g[a] = 0; push(a, hh(a));
  while (H.length) { const [, k] = pop(); if (k === b) break; if (shut[k]) continue; shut[k] = 1; const i = k % GN, j = (k / GN) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= GN || nj >= GN) continue; const n = nj * GN + ni;
      if (GB[n] && n !== b) continue; const d = GS * (di && dj ? 1.414 : 1); let c = d + Math.abs(GH[n] - GH[k]) * 7 + (riverDist(gx(ni), gx(nj)) < 7 ? 30 : 0) + (GO[n] && n !== b ? 60 : 0); if (USE[n]) c *= .55;
      const ng = g[k] + c; if (ng < g[n]) { g[n] = ng; from[n] = k; push(n, ng + hh(n)); } } }
  if (from[b] < 0) return null; const out = []; for (let k = b; k >= 0; k = from[k]) out.push(k); return out.reverse();
}
const chaikin = (P, n) => { for (let r = 0; r < n; r++) { const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++) { const [a, b] = [P[i], P[i + 1]]; Q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } Q.push(P[P.length - 1]); P = Q; } return P; };
const CHEMINS = [], PANNEAUX = {};
const cibles = (E.batiments || []).filter(b => b.pos && RAD[b.type] && b.type !== 'port' && height(b.pos[0], b.pos[1]) > .9).map(b => ({ x: b.pos[0], z: b.pos[1], r: RAD[b.type] + 3.5, nom: b.nom || b.type }));
{ const a = versHauts(-75, 0); cibles.unshift({ x: a.x, z: a.z, r: 0, nom: 'Les Hauts de Plavulca' }); }
for (const c of cibles) {
  const ang = Math.atan2(c.z - cap[1], c.x - cap[0]);
  const rues = [...Array(NRUES).keys()].map(i => { const a = (i / NRUES) * Math.PI * 2 + .3; return [i, a, Math.abs(((ang - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI)]; }).sort((u, v) => u[2] - v[2]);
  for (const [best, a] of rues) {
    const se = [cap[0] + Math.cos(a) * (RV + 5), cap[1] + Math.sin(a) * (RV + 5)];
    const dx = se[0] - c.x, dz = se[1] - c.z, l = Math.hypot(dx, dz) || 1, but = [c.x + dx / l * c.r, c.z + dz / l * c.r];
    if (Math.hypot(but[0] - se[0], but[1] - se[1]) < 8) break;
    const s0 = node(...se), f0 = node(...but), gb = GB[s0]; GB[s0] = 0; GO[s0] = 0; const p = astar(s0, f0); if (!p) { GB[s0] = gb; continue; }
    for (const k of p) USE[k] = 1;
    CHEMINS.push(chaikin([se, ...p.slice(1, -1).map(k => [gx(k % GN), gx((k / GN) | 0)]), but], 3)); (PANNEAUX[best] = PANNEAUX[best] || { a, noms: [] }).noms.push(c.nom);
    break;
  }
}
// masque des chemins peint sur le sol
const MSZ = 2048, mcv = document.createElement('canvas'); mcv.width = mcv.height = MSZ; const mctx = mcv.getContext('2d');
mctx.fillStyle = '#000'; mctx.fillRect(0, 0, MSZ, MSZ); mctx.lineCap = mctx.lineJoin = 'round';
const pxm = v => (v + 320) / 640 * MSZ;
for (const [w, a] of [[4.6, .45], [3.4, 1]]) { mctx.strokeStyle = `rgba(255,255,255,${a})`; mctx.lineWidth = w / 640 * MSZ;
  for (const pts of CHEMINS) { mctx.beginPath(); pts.forEach(([x, z], i) => i ? mctx.lineTo(pxm(x), pxm(z)) : mctx.moveTo(pxm(x), pxm(z))); mctx.stroke(); } }
// ponts sur la rivière + arbres retirés le long des chemins
{ const L = [];
  for (const pts of CHEMINS) {
    for (let i = 0; i < pts.length; i += 3) sansArbres(pts[i][0], pts[i][1], 3.5);
    let run = null; const runs = [];
    pts.forEach((p, i) => { const r = riverDist(p[0], p[1]) < 6.5; if (r && !run) run = [Math.max(0, i - 1)]; if (!r && run) { run.push(i); runs.push(run); run = null; } });
    for (const [i0, i1] of runs) { const A = pts[i0], B = pts[i1], ya = height(...A) + .3, yb = height(...B) + .3;
      for (let i = i0; i < i1; i++) { const p = pts[i], q = pts[i + 1], tt = (i - i0) / Math.max(1, i1 - i0), y = Math.max(ya + (yb - ya) * tt, .8), ddx = q[0] - p[0], ddz = q[1] - p[1], ll = Math.hypot(ddx, ddz), ry = Math.atan2(ddx, ddz), cx = (p[0] + q[0]) / 2, cz = (p[1] + q[1]) / 2;
        bx(L, 3.8, .3, ll + .15, cx, y - .15, cz, i % 2 ? '#8a6a48' : '#7d5f40', ry);
        for (const s of [-1, 1]) { const ox = Math.cos(ry) * 1.85 * s, oz = -Math.sin(ry) * 1.85 * s; bx(L, .15, .12, ll + .15, cx + ox, y + .85, cz + oz, '#6b4a2e', ry); cyl(L, .08, .08, 2.6, p[0] + ox, y - .4, p[1] + oz, '#6b4a2e', 6); } } }
  }
  if (L.length) scene.add(new THREE.Mesh(merge(L), VMAT));
}
// panneaux indicateurs au bout des rues
for (const k in PANNEAUX) { const { a, noms } = PANNEAUX[k]; const L = [];
  const x = cap[0] + Math.cos(a) * (RV + 3) - Math.sin(a) * 3.4, z = cap[1] + Math.sin(a) * (RV + 3) + Math.cos(a) * 3.4, y = height(x, z), n = Math.min(noms.length, 5);
  cyl(L, .14, .16, 1.9 + n * .8, x, y + (1.9 + n * .8) / 2 - .2, z, '#5a3a22', 8); scene.add(new THREE.Mesh(merge(L), VMAT));
  noms.slice(0, 5).forEach((nm, i) => { for (const [ry, o] of [[a + Math.PI / 2, .03], [a - Math.PI / 2, -.03]]) { const pn = panneau([nm], 4.4, .7, '#fbf7ef', '#6e4630'); pn.position.set(x + Math.sin(a + Math.PI / 2) * o, y + 1.6 + i * .8, z + Math.cos(a + Math.PI / 2) * o); pn.rotation.y = ry; scene.add(pn); } });
}

// ================= RENDU : sol texturé, chemins, ombres, grain sur les bâtiments =================
function texBruit(fn, n = 256) { const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); fn(x, n); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); return t; }
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const HERBE = texBruit((x, n) => { x.fillStyle = 'rgb(128,128,128)'; x.fillRect(0, 0, n, n);
  for (let i = 0; i < 2600; i++) { const v = 70 + rnd() * 140 | 0, X = rnd() * n, Y = rnd() * n, l = 3 + rnd() * 7, a = -.4 + rnd() * .8; x.strokeStyle = `rgb(${v},${v},${v})`; x.lineWidth = 1 + rnd() * 1.5;
    for (const [ox, oy] of [[0, 0], [n, 0], [-n, 0], [0, n], [0, -n]]) { x.beginPath(); x.moveTo(X + ox, Y + oy); x.lineTo(X + ox + Math.sin(a) * l, Y + oy - Math.cos(a) * l); x.stroke(); } } });
const GRAVIER = texBruit((x, n) => { x.fillStyle = 'rgb(140,140,140)'; x.fillRect(0, 0, n, n);
  for (let i = 0; i < 1800; i++) { const v = 80 + rnd() * 150 | 0, X = rnd() * n, Y = rnd() * n, r = .8 + rnd() * 2.6; x.fillStyle = `rgb(${v},${v},${v})`; for (const [ox, oy] of [[0, 0], [n, 0], [-n, 0], [0, n], [0, -n]]) { x.beginPath(); x.arc(X + ox, Y + oy, r, 0, 7); x.fill(); } } });
const MASQUE = new THREE.CanvasTexture(mcv); MASQUE.flipY = false;
terrain.material.flatShading = false;
terrain.material.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, { uH: { value: HERBE }, uG: { value: GRAVIER }, uM: { value: MASQUE } });
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vW;').replace('#include <project_vertex>', '#include <project_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vW; uniform sampler2D uH, uG, uM;')
    .replace('#include <color_fragment>', `#include <color_fragment>
      float vert = clamp((vColor.g - vColor.b) * 5.0 - .2, 0., 1.);
      float h = texture2D(uH, vW / 3.5).r, h2 = texture2D(uH, vW / 23.0).r, s = texture2D(uG, vW / 2.0).r;
      diffuseColor.rgb *= mix(.86 + .28 * s, (.7 + .6 * h) * (.85 + .3 * h2), vert);
      float m = texture2D(uM, (vW + 320.0) / 640.0).r;
      vec3 chemin = vec3(.80, .71, .55) * (.78 + .4 * texture2D(uG, vW / 2.5).r);
      diffuseColor.rgb = mix(diffuseColor.rgb, chemin, m);`);
};
terrain.material.needsUpdate = true;
VMAT.onBeforeCompile = sh => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
    varying vec3 vWP;
    float h3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
      return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
    .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= .9 + .13 * n3(vWP * 2.2) + .05 * n3(vWP * 8.0);');
};
VMAT.needsUpdate = true;
// ombres qui suivent le joueur
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 400 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .04; scene.add(sun.target);
const SUN_DIR = sun.position.clone().normalize();
const exclus = new Set([terrain, ocean, clouds, cloudLayer, smoke, trees, trunks]);
scene.traverse(o => { if (!o.isMesh) return; for (let p = o; p; p = p.parent) if (exclus.has(p)) return; o.castShadow = true; o.receiveShadow = true; });
terrain.receiveShadow = true;

// ================= COLLISIONS : grille 2,5D (sols + murs) calculée depuis la vraie géométrie =================
const CELL = .5, CH = 32, NC = 1280, NF = 4, NW = 3, VIDE = -32768, CHK = new Map();
function chunk(i, j, cree) { const k = (i >> 5) * 64 + (j >> 5); let c = CHK.get(k); if (!c && cree) { c = { f: new Int16Array(CH * CH * NF).fill(VIDE), w: new Int16Array(CH * CH * NW * 2).fill(VIDE) }; CHK.set(k, c); } return c; }
const ci = v => Math.floor((v + 320) / CELL);
function addSol(i, j, y) { if (i < 0 || j < 0 || i >= NC || j >= NC) return; const c = chunk(i, j, true), b = ((j & 31) * CH + (i & 31)) * NF, q = Math.round(y * 20); let libre = -1, haut = -1;
  for (let k = 0; k < NF; k++) { const v = c.f[b + k]; if (v === VIDE) { if (libre < 0) libre = k; continue; } if (Math.abs(v - q) <= 3) { if (q > v) c.f[b + k] = q; return; } if (haut < 0 || v > c.f[b + haut]) haut = k; }
  if (libre >= 0) c.f[b + libre] = q; else if (q < c.f[b + haut]) c.f[b + haut] = q; }
function addMur(i, j, a, z) { if (i < 0 || j < 0 || i >= NC || j >= NC) return; const c = chunk(i, j, true), b = ((j & 31) * CH + (i & 31)) * NW * 2, qa = Math.floor(a * 20), qb = Math.ceil(z * 20); let best = 0, bg = 1e9;
  for (let k = 0; k < NW; k++) { const w0 = c.w[b + 2 * k], w1 = c.w[b + 2 * k + 1]; if (w0 === VIDE) { c.w[b + 2 * k] = qa; c.w[b + 2 * k + 1] = qb; return; }
    const gap = Math.max(qa - w1, w0 - qb); if (gap <= 6) { c.w[b + 2 * k] = Math.min(w0, qa); c.w[b + 2 * k + 1] = Math.max(w1, qb); return; } if (gap < bg) { bg = gap; best = k; } }
  c.w[b + 2 * best] = Math.min(c.w[b + 2 * best], qa); c.w[b + 2 * best + 1] = Math.max(c.w[b + 2 * best + 1], qb); }
{ const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3(), U = new THREE.Vector3(), V2 = new THREE.Vector3();
  const segMur = (p, q, a, z) => { const l = Math.hypot(q.x - p.x, q.z - p.z), n = Math.max(1, Math.ceil(l / .2)); for (let s = 0; s <= n; s++) { const t = s / n; addMur(ci(p.x + (q.x - p.x) * t), ci(p.z + (q.z - p.z) * t), a, z); } };
  const remplir = (fn) => { const i0 = ci(Math.min(A.x, B.x, C.x)), i1 = ci(Math.max(A.x, B.x, C.x)), j0 = ci(Math.min(A.z, B.z, C.z)), j1 = ci(Math.max(A.z, B.z, C.z));
    const d = (B.z - C.z) * (A.x - C.x) + (C.x - B.x) * (A.z - C.z); if (Math.abs(d) < 1e-6) return;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = -320 + (i + .5) * CELL, z = -320 + (j + .5) * CELL;
      const l1 = ((B.z - C.z) * (x - C.x) + (C.x - B.x) * (z - C.z)) / d, l2 = ((C.z - A.z) * (x - C.x) + (A.x - C.x) * (z - C.z)) / d, l3 = 1 - l1 - l2;
      if (l1 >= -.02 && l2 >= -.02 && l3 >= -.02) fn(i, j, l1 * A.y + l2 * B.y + l3 * C.y); } };
  const visible = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const ignore = new Set([terrain, ocean, clouds, cloudLayer, smoke, trees, trunks, ...GENS]);
  scene.updateMatrixWorld(true);
  scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || !visible(o)) return; for (let p = o; p; p = p.parent) if (ignore.has(p)) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, n = idx ? idx.count : pos.count, M = o.matrixWorld;
    const eau = o.material && o.material.transparent && o.material.opacity < 1;
    for (let t = 0; t < n; t += 3) {
      const a = idx ? idx.getX(t) : t, b = idx ? idx.getX(t + 1) : t + 1, c = idx ? idx.getX(t + 2) : t + 2;
      A.fromBufferAttribute(pos, a).applyMatrix4(M); B.fromBufferAttribute(pos, b).applyMatrix4(M); C.fromBufferAttribute(pos, c).applyMatrix4(M);
      if (!isFinite(A.x + B.x + C.x + A.y + B.y + C.y)) continue;
      const lo = Math.min(A.y, B.y, C.y), hi = Math.max(A.y, B.y, C.y);
      if (eau) { remplir((i, j, y) => addMur(i, j, y - .8, y + 1.5)); continue; }
      N.crossVectors(U.subVectors(B, A), V2.subVectors(C, A)); const l = N.length(); if (l < 1e-8) continue; const ny = N.y / l;
      if (ny > .7) remplir(addSol);
      else if (ny > -.7) { segMur(A, B, lo, hi); segMur(B, C, lo, hi); segMur(C, A, lo, hi); }
    }
  });
  const m4 = new THREE.Matrix4(), pp = new THREE.Vector3(), qq = new THREE.Quaternion(), ss = new THREE.Vector3();
  for (let k = 0; k < trees.count; k++) { trees.getMatrixAt(k, m4); m4.decompose(pp, qq, ss); if (ss.x < .05) continue; const r = .9 * ss.x;
    for (let j = ci(pp.z - r); j <= ci(pp.z + r); j++) for (let i = ci(pp.x - r); i <= ci(pp.x + r); i++) addMur(i, j, pp.y - .5, pp.y + 4 * ss.y); }
}
function sol(x, z, yRef = 1e9) { let g = height(x, z); const i = ci(x), j = ci(z), c = chunk(i, j); if (c) { const b = ((j & 31) * CH + (i & 31)) * NF; for (let k = 0; k < NF; k++) { const v = c.f[b + k]; if (v !== VIDE) { const y = v / 20; if (y <= yRef + STEP && y > g) g = y; } } } return g; }
function bloque(x, z, g, r = .4) {
  for (let j = ci(z - r); j <= ci(z + r); j++) for (let i = ci(x - r); i <= ci(x + r); i++) { const c = chunk(i, j); if (!c) continue; const b = ((j & 31) * CH + (i & 31)) * NW * 2;
    for (let k = 0; k < NW; k++) { const a = c.w[b + 2 * k]; if (a === VIDE) continue; if (c.w[b + 2 * k + 1] / 20 > g + STEP && a / 20 < g + TAILLE) return true; } }
  return false;
}
function obstacleCam(x, y, z) { const i = ci(x), j = ci(z), c = chunk(i, j); if (!c) return false; const b = ((j & 31) * CH + (i & 31)) * NW * 2;
  for (let k = 0; k < NW; k++) { const a = c.w[b + 2 * k]; if (a !== VIDE && a / 20 - .3 < y && c.w[b + 2 * k + 1] / 20 + .3 > y) return true; } return false; }

// ================= le perso (tête ronde) =================
const perso = new THREE.Group(); scene.add(perso);
const COUL = ['#e8452c', '#2f7fe0', '#2fb36b', '#ffd34d', '#8a5cf6', '#f08a24', '#e0245e'];
const mt = c => new THREE.MeshStandardMaterial({ color: c, roughness: .7 });
const peau = mt('#f1c9a5'), habit = mt(COUL[Math.floor(Math.random() * COUL.length)]), pant = mt('#2c3e75'), noir = mt('#1d1d1d');
const corps = new THREE.Mesh(new THREE.CapsuleGeometry(.42, .55, 4, 12), habit); corps.position.y = 1.05; perso.add(corps);
const tete = new THREE.Mesh(new THREE.SphereGeometry(.6, 20, 14), peau); tete.position.y = 2.05; perso.add(tete);
const cheveux = new THREE.Mesh(new THREE.SphereGeometry(.63, 20, 10, 0, Math.PI * 2, 0, Math.PI * .45), mt(['#3a2a20', '#c06a2e', '#1e1e1e', '#e0b85a'][Math.floor(Math.random() * 4)])); cheveux.position.y = 2.08; cheveux.rotation.x = -.25; perso.add(cheveux);
for (const dx of [-.2, .2]) { const o = new THREE.Mesh(new THREE.SphereGeometry(.085, 10, 8), noir); o.position.set(dx, 2.08, .54); perso.add(o); const j = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), mt('#f2939b')); j.position.set(dx * 1.6, 1.9, .47); j.scale.set(1, .6, .5); perso.add(j); }
const jambes = [-.2, .2].map(dx => { const p = new THREE.Group(); p.position.set(dx, .62, 0); const m = new THREE.Mesh(new THREE.CapsuleGeometry(.15, .4, 4, 8), pant); m.position.y = -.3; p.add(m); perso.add(p); return p; });
const bras = [-.55, .55].map(dx => { const p = new THREE.Group(); p.position.set(dx, 1.38, 0); const m = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .4, 4, 8), habit); m.position.y = -.3; p.add(m); perso.add(p); return p; });
perso.scale.setScalar(TAILLE / 2.7); perso.traverse(o => { if (o.isMesh) o.castShadow = true; });

// ================= déplacements =================
const P = { x: 0, z: 0, y: 0, dir: 0, phase: 0, v: 0 };
let yaw = 0, pitch = .45, dist = 8;
function libreAutour(x, z) { for (let r = 0; r < 14; r += .7) for (let a = 0; a < 6.28; a += .5) { const X = x + Math.cos(a) * r, Z = z + Math.sin(a) * r, g = sol(X, Z, height(X, Z) + .5); if (height(X, Z) > -.5 && !bloque(X, Z, g)) return [X, Z, g]; } return [x, z, sol(x, z)]; }
function tp(lieu) {
  let x, z, cible;
  if (lieu === 'ville') { const a = .3 + Math.PI * 2 / NRUES; x = place[0] + Math.cos(a) * 8; z = place[2] + Math.sin(a) * 8; cible = [place[0] + Math.cos(a) * 30, place[2] + Math.sin(a) * 30]; }
  else { const a = versHauts(-58, 0), b = versHauts(0, 0); x = a.x; z = a.z; cible = [b.x, b.z]; }
  const [X, Z, g] = libreAutour(x, z); P.x = X; P.z = Z; P.y = g; P.dir = Math.atan2(cible[0] - X, cible[1] - Z); yaw = P.dir + Math.PI; pitch = .45;
}
tp('hauts');

// ---- commandes : joystick (gauche), caméra (droite), clavier ----
const joy = { id: null, x0: 0, y0: 0, x: 0, y: 0 }, camT = { id: null, x: 0, y: 0 }, base = $('joy'), bouton = $('joyb');
const cv = renderer.domElement; cv.style.touchAction = 'none';
cv.addEventListener('pointerdown', e => {
  $('aide').classList.add('cache');
  if (e.clientX < innerWidth * .5 && joy.id === null && e.pointerType !== 'mouse') { joy.id = e.pointerId; joy.x0 = e.clientX; joy.y0 = e.clientY; joy.x = joy.y = 0; base.style.left = e.clientX + 'px'; base.style.top = e.clientY + 'px'; base.classList.add('on'); bouton.style.transform = 'translate(-50%,-50%)'; }
  else if (camT.id === null) { camT.id = e.pointerId; camT.x = e.clientX; camT.y = e.clientY; }
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', e => {
  if (e.pointerId === joy.id) { let dx = e.clientX - joy.x0, dy = e.clientY - joy.y0; const l = Math.hypot(dx, dy), m = 55; if (l > m) { dx *= m / l; dy *= m / l; } joy.x = dx / m; joy.y = dy / m; bouton.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; }
  else if (e.pointerId === camT.id) { yaw -= (e.clientX - camT.x) * .006; pitch = Math.max(.05, Math.min(1.25, pitch + (e.clientY - camT.y) * .004)); camT.x = e.clientX; camT.y = e.clientY; }
});
const lacher = e => { if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; base.classList.remove('on'); } if (e.pointerId === camT.id) camT.id = null; };
cv.addEventListener('pointerup', lacher); cv.addEventListener('pointercancel', lacher);
cv.addEventListener('wheel', e => { dist = Math.max(4, Math.min(18, dist + e.deltaY * .01)); }, { passive: true });
const K = {}; addEventListener('keydown', e => { K[e.key.toLowerCase()] = true; $('aide').classList.add('cache'); }); addEventListener('keyup', e => { K[e.key.toLowerCase()] = false; });
$('tp-hauts').onclick = () => tp('hauts'); $('tp-ville').onclick = () => tp('ville');
$('zoom').onclick = () => { dist = dist > 11 ? 5.5 : dist > 7 ? 14 : 8; };

// ---- carte d'info près d'une maison ----
let infoLot = null;
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function majInfo() {
  let best = null, bd = 19; for (const l of LOTS) { const d = Math.hypot(P.x - l.monde[0], P.z - l.monde[1]); if (d < bd) { bd = d; best = l; } }
  if (best === infoLot) return; infoLot = best; const c = $('info');
  if (!best) { c.classList.remove('on'); return; }
  c.innerHTML = best.etat ? `<b>⭐ ${esc(best.pseudo)}</b><span>${esc(best.desc)}</span><small>Parcelle ${best.n} · ${esc(best.zone)}</small>`
    : `<b>Parcelle ${best.n} à vendre</b><span>${esc(best.zone)}</span><a href="/" target="_blank">Choisir ma maison →</a>`;
  c.classList.add('on');
}

// ================= boucle =================
let t = 0, last = performance.now(), n = 0;
const vise = new THREE.Vector3(), camCible = new THREE.Vector3();
function essai(x, z) { if (height(x, z) < -.6) return null; const g = sol(x, z, P.y); if (g > P.y + STEP || bloque(x, z, g)) return null; return g; }
function boucle(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; n++;
  let jx = joy.x, jy = joy.y;
  const kx = (K.d || K.arrowright ? 1 : 0) - (K.q || K.a || K.arrowleft ? 1 : 0), ky = (K.s || K.arrowdown ? 1 : 0) - (K.z || K.w || K.arrowup ? 1 : 0);
  if (kx || ky) { const l = Math.hypot(kx, ky); jx = kx / l * (K.shift ? 1 : .6); jy = ky / l * (K.shift ? 1 : .6); }
  const amp = Math.min(1, Math.hypot(jx, jy));
  if (amp > .08) {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let mx2 = fx * -jy + rx * jx, mz2 = fz * -jy + rz * jx; const l = Math.hypot(mx2, mz2) || 1; mx2 /= l; mz2 /= l;
    const vit = 2.6 + 6 * amp * amp, sx = mx2 * vit * dt, sz = mz2 * vit * dt;
    if (essai(P.x + sx, P.z + sz) !== null) { P.x += sx; P.z += sz; }
    else if (essai(P.x + sx, P.z) !== null) P.x += sx;            // glisse le long du mur
    else if (essai(P.x, P.z + sz) !== null) P.z += sz;
    const cible = Math.atan2(mx2, mz2); let d = ((cible - P.dir + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; P.dir += d * Math.min(1, dt * 12);
    P.phase += dt * vit * 2.2; P.v = amp;
  } else { P.v *= .8; P.phase *= .9; }
  const gs = sol(P.x, P.z, P.y); P.y = gs > P.y ? gs : Math.max(gs, P.y - dt * 14);
  perso.position.set(P.x, P.y + Math.abs(Math.sin(P.phase)) * .08 * Math.min(1, P.v * 2), P.z); perso.rotation.y = P.dir;
  const sw = Math.sin(P.phase) * .7 * Math.min(1, P.v * 1.5); jambes[0].rotation.x = sw; jambes[1].rotation.x = -sw; bras[0].rotation.x = -sw * .8; bras[1].rotation.x = sw * .8;
  // caméra 3e personne (ne traverse pas les murs)
  vise.set(P.x, P.y + TAILLE * .8, P.z);
  let ox, oy, oz, dd;   // si un mur est derrière, la caméra monte au-dessus plutôt que de se coller au perso
  for (let pt = pitch; ; pt += .15) { const p2 = Math.min(1.35, pt); ox = Math.sin(yaw) * Math.cos(p2); oy = Math.sin(p2); oz = Math.cos(yaw) * Math.cos(p2); dd = dist;
    for (let s = .8; s <= dist; s += .35) { const x = vise.x + ox * s, y = vise.y + oy * s, z = vise.z + oz * s; if (obstacleCam(x, y, z) || y < sol(x, z) + .4) { dd = Math.max(1.2, s - .5); break; } }
    if (dd >= Math.min(dist, 4.5) || p2 >= 1.35) break; }
  camCible.set(vise.x + ox * dd, vise.y + oy * dd, vise.z + oz * dd);
  cam.position.lerp(camCible, Math.min(1, dt * (dd < dist ? 20 : 8))); cam.lookAt(vise);
  sun.target.position.set(P.x, P.y, P.z); sun.position.copy(SUN_DIR).multiplyScalar(150).add(sun.target.position);
  // décor vivant
  if (n % 2 === 0) waves(t);
  waveFlag(t);
  for (const g of clouds.children) { g.position.x = g.userData.x0 ?? (g.userData.x0 = g.position.x); g.position.x = g.userData.x0 + t * g.userData.v; }
  smoke.children.forEach((s, i) => { const ph = (t * .25 + i / 10) % 1; s.position.set(VOLC.x + Math.sin(i * 3 + t * .5) * 4 + ph * 20, height(VOLC.x, VOLC.y) + 10 + ph * 60, VOLC.y - ph * 8); s.scale.setScalar(1 + ph * 3); s.material.opacity = .7 * (1 - ph); });
  bougerGens(t); for (const g of GENS) { if (!g.visible) continue; g.scale.multiplyScalar(TAILLE / 4.05); const bob = Math.abs(Math.sin(t * 7 + g.userData.ph)); g.position.y = sol(g.position.x, g.position.z, g.position.y) + bob * .07; }
  for (const g of speciaux) { g.traverse(o => { if (o.userData && o.userData.barber) o.userData.barber.offset.y = -t * .6 });
    if (g.userData.flotte) { g.position.y = g.userData.y0 + Math.sin(t * 1.4) * .35; g.rotation.z = Math.sin(t * 1.1) * .04; }
    if (g.userData.karts) for (const m of g.userData.karts) { const K2 = m.userData.kart, a = -(t * .35 + K2.ph) * Math.PI * 2, x = Math.cos(a) * K2.RX, z = Math.sin(a) * K2.RZ * (1 + .35 * Math.sin(a * 2)), a2 = a - .05, x2 = Math.cos(a2) * K2.RX, z2 = Math.sin(a2) * K2.RZ * (1 + .35 * Math.sin(a2 * 2)); m.position.set(x, 0, z); m.rotation.y = Math.atan2(-(z2 - z), x2 - x); } }
  if (n % 10 === 0) majInfo();
  renderer.render(scene, cam);
  if (n === 2) $('charge').classList.add('cache');
  requestAnimationFrame(boucle);
}
window.T_CHARGE = performance.now();
requestAnimationFrame(boucle);
window.JEU = { P, tp, renderer, place, murs: (x, z) => { const i = ci(x), j = ci(z), c = chunk(i, j); if (!c) return []; const b = ((j & 31) * CH + (i & 31)) * NW * 2, f = ((j & 31) * CH + (i & 31)) * NF; return [[...c.w.slice(b, b + 6)].map(v => v / 20), [...c.f.slice(f, f + 4)].map(v => v / 20)]; }, LOTS, CHEMINS, sol, bloque, hauts, get chunks() { return CHK.size; }, set yaw(v) { yaw = v; }, set pitch(v) { pitch = v; }, set dist(v) { dist = v; } };
