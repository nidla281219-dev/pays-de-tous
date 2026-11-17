// ================= JEU VULKARIS — balade solo (ajouté après le décor de scene.html, dans un bloc) =================
const D = window.JEU_DATA;
const $ = id => document.getElementById(id);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });
const STEP = .6;            // hauteur de marche franchissable
const TAILLE = 1.9;         // taille du perso (porte ≈ 2,3)

// ================= L'ÎLE DU JEU : 2× plus large que la maquette des vidéos (4× la surface), relief plus doux =================
const ECH = 2, DEMI = 640;          // l'île tient dans [-DEMI, DEMI]
VOLC.multiplyScalar(ECH); for (const p of RIVER) { p[0] *= ECH; p[1] *= ECH; } for (const k in SITES) SITES[k] = SITES[k].map(v => v * ECH);
riverDist = (x, z) => { let best = 1e9; for (let i = 0; i < RIVER.length - 1; i++) { const [ax, az] = RIVER[i], [bx2, bz] = RIVER[i + 1], vx = bx2 - ax, vz = bz - az; let t = ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz); t = Math.max(0, Math.min(1, t)); best = Math.min(best, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return best; };
height0 = (x, z) => {
  const ang = Math.atan2(z, x), r = Math.hypot(x, z);
  const Rb = (230 + 38 * Math.sin(ang * 3 + .7) + 22 * Math.sin(ang * 5 + 2.1) + 30 * (fbm(Math.cos(ang) * 2 + 5, Math.sin(ang) * 2 + 5) - .5)) * ECH;
  let h = (1 - Math.pow(r / Rb, 2.2)) * 30; if (r > Rb) h = -(r - Rb) * .18 - 1;
  const dedans = Math.max(0, Math.min(1, (Rb - r) / 110));
  h += (fbm(x * .006 + 3, z * .006 + 7) - .5) * 18 * dedans + (fbm(x * .022 + 11, z * .022 + 5) - .5) * 2.5 * dedans;   // collines + petites ondulations
  const dv = Math.hypot(x - VOLC.x, z - VOLC.y); h += 120 * Math.exp(-dv * dv / (2 * 100 * 100)); if (dv < 40) h -= (40 - dv) * 1.5;   // volcan + cratère
  const rd = riverDist(x, z); if (rd < 20 && h > 1) h = Math.min(h, h - (20 - rd) * .5 * Math.min(1, h / 6));                        // vallée de la rivière
  if (Math.hypot(x + 70 * ECH, z - 235 * ECH) < 55 * ECH) h = Math.min(h, -2);                                                    // baie du port
  return h; };
buildTerrain = () => {};            // le sol du jeu est reconstruit plus bas, en morceaux
terrain.visible = false; trees.visible = trunks.visible = false; trees.count = trunks.count = 0;
{ const op = ocean.geometry.attributes.position, oc = ocean.geometry.attributes.color, C1 = new THREE.Color('#1f6fb2'), C2 = new THREE.Color('#3fd0d6'), Cx = new THREE.Color();
  for (let i = 0; i < op.count; i++) { const r = Math.hypot(op.getX(i), op.getZ(i)); Cx.copy(C1).lerp(C2, Math.max(0, 1 - (r - 380) / 420)); oc.setXYZ(i, Cx.r, Cx.g, Cx.b); } oc.needsUpdate = true; }

// ---- le monde (bâtiments des vidéos, posés sur l'île du jeu) ----
const HAUTS = { ...D.hauts, x: D.hauts.x * ECH, z: D.hauts.z * ECH }; // {x, z, rot}
PADDEF.jeu_hauts = [0, 0, 66, 39];
const E = JSON.parse(JSON.stringify(D.etat));
for (const b of E.batiments || []) if (b.pos) b.pos = b.pos.map(v => v * ECH);
E.batiments = (E.batiments || []).filter(b => b.type !== 'quartier_hauts').concat([{ type: 'jeu_hauts', pos: [HAUTS.x, HAUTS.z], rot: HAUTS.rot }]);
const TL0 = { etat: E, habitants: { n: D.habitants, t0: 0 }, vis: () => false, prog: () => 1 };
// 1er passage : on construit pour MESURER l'emprise réelle de chaque bâtiment, puis on aplanit le terrain dessous (fini les socles en falaise)
setup(TL0);
{ const pads = {}, tailles = [];   // speciaux[k] ↔ E.batiments[k] (même ordre de construction)
  const RADB = { universite: 18, ferme: 16, karting: 34, caserne_pompiers: 10, mine: 12, forge: 8, prison: 16, aeroport: 50, chantier_naval: 8, labo_marin: 12, defense: 34, base_militaire: 40, observatoire: 14, explorateurs: 18, reserve: 22 };
  E.batiments.forEach((b, k) => { const g = speciaux[k], m = g && g.userData.inner && g.userData.inner.children[0]; if (!m || !m.isMesh) return;
    m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox; if (![bb.min.x, bb.min.z, bb.max.x, bb.max.z].every(isFinite)) return;
    tailles[k] = [bb.max.x - bb.min.x, bb.max.z - bb.min.z];
    if (b.pos && !g.userData.flotte && !g.userData.monde && !['port', 'bateau', 'sentier', 'jeu_hauts', 'chantier_naval', 'quartier_hauts'].includes(b.type))
      pads[b.type] = [(bb.min.x + bb.max.x) / 2, (bb.min.z + bb.max.z) / 2, (bb.max.x - bb.min.x) / 2 + 1.5, (bb.max.z - bb.min.z) / 2 + 1.5]; });
  Object.assign(PADDEF, pads);
  // bâtiments autour de la place : répartis entre les rues sans se chevaucher
  if (capitale) { const [px, , pz] = capitale.userData.place, NR = (E.capitale && E.capitale.rues) || 5, SP = Math.PI * 2 / NR, rue0 = .3;
    const autour = E.batiments.map((b, k) => ({ b, k })).filter(o => o.b.place !== undefined && tailles[o.k]);
    const secteur = a => { const u = (((a - rue0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return Math.floor(u / SP); };
    const S = [...Array(NR)].map(() => []), charge = S.map(() => 0), penal = S.map((_, si) => { const a = rue0 + si * SP + SP / 2; let p = 0;   // secteurs déjà occupés par un grand bâtiment : évités
      for (const b of E.batiments) if (b.pos && b.place === undefined && RADB[b.type]) for (const r of [24, 34, 44]) if (Math.hypot(px + Math.cos(a) * r - b.pos[0], pz + Math.sin(a) * r - b.pos[1]) < RADB[b.type] + 10) p = 200; return p; });
    charge.forEach((_, i) => charge[i] = penal[i]);
    autour.sort((u, v) => u.b.place - v.b.place).forEach(o => { const s0 = secteur(o.b.place); let best = s0; for (const d of [-1, 1]) { const s1 = (s0 + d + NR) % NR; if (charge[s1] + 4 < charge[best]) best = s1; } S[best].push(o); charge[best] += tailles[o.k][0] + 2; });
    S.forEach((liste, si) => { if (!liste.length) return; const prof = Math.max(...liste.map(o => tailles[o.k][1]));
      const ch = charge[si] - penal[si], r = Math.max(13.5 + prof / 2, (ch + 9) / SP); const a0 = rue0 + si * SP + SP / 2; let arc = -ch / 2;
      for (const o of liste) { const w = tailles[o.k][0] + 2, a = a0 + (arc + w / 2) / r; arc += w; const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
        delete o.b.place; o.b.pos = [x, z]; o.b.rot = Math.atan2(px - x, pz - z); delete PADDEF[o.b.type || 'boulangerie']; } }); }   // sur le plateau de la ville : pas de socle propre
  if (capitale) scene.remove(capitale); for (const g of speciaux) scene.remove(g); speciaux.length = 0; for (const g of GENS) scene.remove(g); GENS.length = 0;
}
setup(TL0);
// bâtiments du bord de mer : une digue de terre relie leur socle à la côte la plus proche (plus d'îlots isolés)
const DIGUES = [];
for (const p of PADS) { const rr = Math.max(p.hw, p.hd) + 22; let mer = 0; for (let k = 0; k < 16; k++) if (height0(p.x + Math.cos(k / 16 * 6.283) * rr, p.z + Math.sin(k / 16 * 6.283) * rr) < .5) mer++; if (mer < 5) continue; let best = null;
  for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2; for (let d = 10; d < 300; d += 4) { const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d; if (height(x, z) > 2.5 && [15, 30, 45].every(e => height0(x + Math.cos(a) * e, z + Math.sin(a) * e) > 2.5)) { if (!best || d < best.d) best = { d, a }; break; } } }
  if (!best) continue; const d2 = best.d + 18, L = [p.x + Math.cos(best.a) * d2, p.z + Math.sin(best.a) * d2];
  DIGUES.push({ ax: p.x, az: p.z, bx: L[0], bz: L[1], h0: Math.max(1.8, p.h), h1: height(...L), w: Math.max(9, Math.min(p.hw, p.hd) * .8) }); }
{ const hBase = height; height = (x, z) => { let h = hBase(x, z);
  for (const c of DIGUES) { const vx = c.bx - c.ax, vz = c.bz - c.az, t = Math.max(0, Math.min(1, ((x - c.ax) * vx + (z - c.az) * vz) / (vx * vx + vz * vz))), d = Math.hypot(x - c.ax - vx * t, z - c.az - vz * t);
    if (d < c.w + 14) { const y = c.h0 + (c.h1 - c.h0) * t, u = Math.max(0, Math.min(1, (c.w + 14 - d) / 14)), k = u * u * (3 - 2 * u); h = Math.max(h, h + (y - h) * k); } }
  return h; }; }
// ---- le sol : grille de 481×481 points (2,7 m), découpée en 8×8 morceaux (seuls ceux à l'écran sont dessinés) ----
const SOL3D = new THREE.Group(); scene.add(SOL3D);
{ const N = 480, st = 2 * DEMI / N, Hs = new Float32Array((N + 1) * (N + 1));
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) Hs[j * (N + 1) + i] = height(-DEMI + i * st, -DEMI + j * st);
  const hA = (i, j) => Hs[Math.max(0, Math.min(N, j)) * (N + 1) + Math.max(0, Math.min(N, i))];
  terrain.material.vertexColors = false;
  const M = 8, n = N / M;
  for (let cj = 0; cj < M; cj++) for (let cI = 0; cI < M; cI++) { const pos = [], nor = [], idx = [];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const gi = cI * n + i, gj = cj * n + j; pos.push(-DEMI + gi * st, hA(gi, gj), -DEMI + gj * st);
      const nx = hA(gi - 1, gj) - hA(gi + 1, gj), nz = hA(gi, gj - 1) - hA(gi, gj + 1), l = Math.hypot(nx, 2 * st, nz); nor.push(nx / l, 2 * st / l, nz / l); }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, terrain.material); m.receiveShadow = true; SOL3D.add(m); }
}
// maisons de la ville qui chevauchent un bâtiment ou une autre maison : retirées
if (capitale) { const B = [], boite = o => { const b = new THREE.Box3().setFromObject(o); return b; };
  for (const g of speciaux) { const m = g.userData.inner && g.userData.inner.children[0]; if (m && !g.userData.monde) B.push(boite(m).expandByScalar(-.5)); }
  const garder = [];
  for (const m of [...capitale.children]) { if (!m.isMesh || !(m.userData.d > 0)) continue; const b = boite(m).expandByScalar(-.3); b.min.y = -1e9; b.max.y = 1e9;
    if (B.some(o => o.intersectsBox(b)) || garder.some(o => o.intersectsBox(b))) { capitale.remove(m); window.RETIRES = (window.RETIRES || 0) + 1; } else garder.push(b); }
  window.NB_B = B.length; window.NB_G = garder.length;
}
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
const LOTS = [], BOITES_H = [];
const SLOTS = []; for (const s of [-1, 1]) for (const x of [-45, -15, 15, 45]) SLOTS.push([x, s]);
D.lots.forEach((lot, i) => {
  const [x, s] = SLOTS[i]; const g = new THREE.Group(); g.position.set(x, 0, s * 20); g.rotation.y = s > 0 ? Math.PI : 0; hauts.add(g);
  if (lot.etat) {
    const p = parcelle(lot.etat); g.add(p.g); BOITES_H.push([g, 0, -7.5, p.w + .6, p.d + .6, ({ cabane: 6, petite: 7, grande: 10, villa: 10 })[lot.etat.maison] || 9]);
    if (lot.etat.maison === 'villa') BOITES_H.push([g, p.w / 2 + 2.7, -7.5 - p.d / 2 + .5, 6, 6, 5.5]);
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
const GN = 320, GS = 4, gx = i => -DEMI + (i + .5) * GS;
const GH = new Float32Array(GN * GN), GB = new Uint8Array(GN * GN), GO = new Uint8Array(GN * GN), USE = new Uint8Array(GN * GN);
const obst = (E.batiments || []).filter(b => b.pos && b.type !== 'sentier' && b.type !== 'jeu_hauts').map(b => ({ x: b.pos[0], z: b.pos[1], r: (RAD[b.type] || 8) + 3 }));
for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const x = gx(i), z = gx(j), k = j * GN + i; GH[k] = height(x, z);
  if (GH[k] < .9 || Math.hypot(x - cap[0], z - cap[1]) < RV + 2 || dansHauts(x, z, 2, 2)) GB[k] = 1; if (obst.some(o => Math.hypot(x - o.x, z - o.z) < o.r)) GO[k] = 1; }
const node = (x, z) => Math.max(0, Math.min(GN - 1, Math.floor((x + DEMI) / GS))) + Math.max(0, Math.min(GN - 1, Math.floor((z + DEMI) / GS))) * GN;
function astar(a, b) {
  const g = new Float32Array(GN * GN).fill(1e9), from = new Int32Array(GN * GN).fill(-1), shut = new Uint8Array(GN * GN), H = [];
  const push = (k, f) => { H.push([f, k]); let i = H.length - 1; while (i) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return top; };
  const bi = b % GN, bj = (b / GN) | 0, hh = k => Math.hypot(k % GN - bi, ((k / GN) | 0) - bj) * GS * .8;
  g[a] = 0; push(a, hh(a));
  while (H.length) { const [, k] = pop(); if (k === b) break; if (shut[k]) continue; shut[k] = 1; const i = k % GN, j = (k / GN) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= GN || nj >= GN) continue; const n = nj * GN + ni;
      if (GB[n] && n !== b) continue; const d = GS * (di && dj ? 1.414 : 1); let c = d + Math.abs(GH[n] - GH[k]) * 7 + (riverDist(gx(ni), gx(nj)) < 14 ? 30 : 0) + (GO[n] && n !== b ? 60 : 0); if (USE[n]) c *= .55;
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
const pxm = v => (v + DEMI) / (2 * DEMI) * MSZ;
for (const [w, a] of [[4.6, .45], [3.4, 1]]) { mctx.strokeStyle = `rgba(255,255,255,${a})`; mctx.lineWidth = w / (2 * DEMI) * MSZ;
  for (const pts of CHEMINS) { mctx.beginPath(); pts.forEach(([x, z], i) => i ? mctx.lineTo(pxm(x), pxm(z)) : mctx.moveTo(pxm(x), pxm(z))); mctx.stroke(); } }
// ponts sur la rivière + arbres retirés le long des chemins
{ const L = [];
  for (const pts of CHEMINS) {
    for (let i = 0; i < pts.length; i += 3) sansArbres(pts[i][0], pts[i][1], 3.5);
    let run = null; const runs = [];
    pts.forEach((p, i) => { const r = riverDist(p[0], p[1]) < 13; if (r && !run) run = [Math.max(0, i - 1)]; if (!r && run) { run.push(i); runs.push(run); run = null; } });
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

// ================= FORÊTS de l'île du jeu (4×4 groupes → seuls ceux à l'écran sont dessinés) =================
const masqueChemins = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.drawImage(mcv, 0, 0, 512, 512); return x.getImageData(0, 0, 512, 512).data; })();
const surChemin = (x, z, seuil = 40) => masqueChemins[(Math.floor((z + DEMI) / (2 * DEMI) * 512) * 512 + Math.floor((x + DEMI) / (2 * DEMI) * 512)) * 4] > seuil;
const FORETS = [];
{ const G = 4, cap2 = 900, tcol = new THREE.Color(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3(), P3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const grp = [...Array(G * G)].map(() => ({ a: new THREE.InstancedMesh(treeG, trees.material, cap2), t: new THREE.InstancedMesh(trunkG, trunks.material, cap2), n: 0 }));
  const dansPad = (x, z) => PADS.some(p => { const dx = x - p.x, dz = z - p.z, lx = dx * p.c - dz * p.s - p.cx, lz = dx * p.s + dz * p.c - p.cz; return Math.abs(lx) < p.hw + 8 && Math.abs(lz) < p.hd + 8; });
  for (let i = 0; i < 160000; i++) { const x = (hash(i, 1) - .5) * 2 * (DEMI - 60), z = (hash(i, 2) - .5) * 2 * (DEMI - 60), h = height(x, z);
    if (h < 3 || h > 80 || riverDist(x, z) < 22 || Math.hypot(x - VOLC.x, z - VOLC.y) < 150) continue;
    if (fbm(x * .01 + 11, z * .01 + 3) < .47) continue;
    if (Math.hypot(x - cap[0], z - cap[1]) < RV + 25 || dansHauts(x, z, 18, 18) || dansPad(x, z) || surChemin(x, z, 10)) continue;
    const g = grp[Math.min(G - 1, Math.floor((x + DEMI) / (2 * DEMI) * G)) + Math.min(G - 1, Math.floor((z + DEMI) / (2 * DEMI) * G)) * G]; if (g.n >= cap2) continue;
    const sc = .7 + hash(i, 3) * .8; P3.set(x, h - .3, z); S3.set(sc, sc * (.9 + hash(i, 4) * .5), sc); Q.setFromAxisAngle(up, hash(i, 5) * 6); M4.compose(P3, Q, S3);
    g.a.setMatrixAt(g.n, M4); g.t.setMatrixAt(g.n, M4); tcol.set(hash(i, 6) > .5 ? '#2f7d3a' : '#3b8f3f').offsetHSL(0, 0, (hash(i, 7) - .5) * .08); g.a.setColorAt(g.n, tcol); g.n++; }
  for (const g of grp) { if (!g.n) continue; g.a.count = g.t.count = g.n; g.a.computeBoundingSphere(); g.t.computeBoundingSphere(); scene.add(g.a, g.t); FORETS.push(g.a, g.t); }
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
// bruit doux tuilable (taches de prairie, variations)
const BRUIT = (() => { const n = 256, c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), im = x.createImageData(n, n), V = [];
  for (const g of [8, 16, 32, 64]) { const v = new Float32Array(g * g).map(() => rnd()); V.push([g, v]); }
  for (let y = 0; y < n; y++) for (let X = 0; X < n; X++) { let s = 0, a = .5, tot = 0;
    for (const [g, v] of V) { const fx = X / n * g, fy = y / n * g, i0 = Math.floor(fx), j0 = Math.floor(fy), tx = fx - i0, ty = fy - j0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), q = (i, j) => v[((j % g + g) % g) * g + ((i % g + g) % g)];
      s += a * ((q(i0, j0) * (1 - sx) + q(i0 + 1, j0) * sx) * (1 - sy) + (q(i0, j0 + 1) * (1 - sx) + q(i0 + 1, j0 + 1) * sx) * sy); tot += a; a *= .5; }
    const k = (y * n + X) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = s / tot * 255; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
terrain.material.flatShading = false;
const RIV = RIVER.map(([x, z]) => new THREE.Vector2(x, z));
terrain.material.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, { uH: { value: HERBE }, uG: { value: GRAVIER }, uM: { value: MASQUE }, uN: { value: BRUIT }, uV: { value: new THREE.Vector2(VOLC.x, VOLC.y) }, uR: { value: RIV } });
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW3; varying vec3 vWN;')
    .replace('#include <project_vertex>', '#include <project_vertex>\nvW3 = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
    varying vec3 vW3; varying vec3 vWN; uniform sampler2D uH, uG, uM, uN; uniform vec2 uV; uniform vec2 uR[${RIV.length}];
    float rivD(vec2 p){ float d = 1e9; for (int i = 0; i < ${RIV.length - 1}; i++) { vec2 a = uR[i], b = uR[i + 1], ab = b - a; float t = clamp(dot(p - a, ab) / dot(ab, ab), 0., 1.); d = min(d, length(p - a - ab * t)); } return d; }`)
    .replace('#include <color_fragment>', `
      vec2 vW = vW3.xz; float y = vW3.y, pente = 1.0 - clamp(vWN.y, 0., 1.);
      float n1 = texture2D(uN, vW / 140.0).r, n2 = texture2D(uN, vW / 37.0).r, n3 = texture2D(uN, vW / 9.0).r;
      float bl = texture2D(uH, vW / 3.2).r, bl2 = texture2D(uH, vW / 1.3).r, gr = texture2D(uG, vW / 2.2).r, gr2 = texture2D(uG, vW / 6.0).r;
      vec3 herbeA = vec3(.33, .58, .22), herbeB = vec3(.47, .68, .28), seche = vec3(.66, .67, .34), foncee = vec3(.24, .45, .18);
      vec3 c = mix(herbeA, herbeB, smoothstep(.38, .66, n1));
      c = mix(c, seche, smoothstep(.58, .78, n2) * .45); c = mix(c, foncee, smoothstep(.55, .75, n3) * .25);
      c *= .74 + .34 * bl + .14 * bl2;
      vec3 terre = vec3(.50, .40, .28) * (.78 + .3 * gr + .15 * n3);
      vec3 roche = vec3(.52, .49, .46) * (.7 + .45 * n3) * (.82 + .3 * gr2);
      vec3 sable = vec3(.91, .84, .64) * (.86 + .2 * gr + .08 * n3);
      float k = pente + (n3 - .5) * .12;
      c = mix(c, terre, smoothstep(.13, .22, k));
      c = mix(c, roche, smoothstep(.28, .40, k));
      c = mix(c, mix(c, roche, .75), smoothstep(60.0, 85.0, y + (n2 - .5) * 14.0));
      float plage = 1.0 - smoothstep(.9, 1.9, y + (n2 - .5) * 1.4); c = mix(c, sable, plage); c *= mix(1.0, .72, 1.0 - smoothstep(-.3, .45, y));
      float dv = length(vW - uV); c = mix(c, vec3(.20, .17, .16) * (.7 + .6 * n3) * (.85 + .3 * gr2), 1.0 - smoothstep(42.0, 60.0, dv + (n2 - .5) * 16.0));
      float rd = rivD(vW); c = mix(c, mix(sable * .75, roche, .45) * (.8 + .3 * gr), 1.0 - smoothstep(10.0, 16.0, rd + (n3 - .5) * 3.0));
      float m = texture2D(uM, (vW + ${DEMI}.0) / ${2 * DEMI}.0).r;
      vec3 chemin = vec3(.78, .69, .53) * (.8 + .3 * gr + .1 * n3);
      c = mix(c, chemin, m * .95);
      diffuseColor.rgb = pow(c, vec3(2.2));`);
};
terrain.material.needsUpdate = true;
// la rivière : vraie eau entre les berges
{ let pts = RIVER.map(p => [...p]); pts = chaikin(pts, 3); const pos = [], idx = [];
  const P2 = []; for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l / 1.5)); for (let k = 0; k < n; k++) P2.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } P2.push(pts[pts.length - 1]);
  let okPrec = false;
  P2.forEach((p, i) => { const q = P2[Math.min(i + 1, P2.length - 1)], o = P2[Math.max(i - 1, 0)], dx = q[0] - o[0], dz = q[1] - o[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    const h0 = height(p[0], p[1]), berge = Math.min(height(p[0] + nx * 18, p[1] + nz * 18), height(p[0] - nx * 18, p[1] - nz * 18)), y = Math.max(-.2, h0 + 2.4);
    const ok = berge - h0 > 3.5 && Math.hypot(p[0] - cap[0], p[1] - cap[1]) > RV + 12 && !dansHauts(p[0], p[1], 8, 8);   // seulement là où la rivière est vraiment creusée
    for (const s of [-1, 1]) pos.push(p[0] + nx * 11 * s, y, p[1] + nz * 11 * s); if (i && ok && okPrec) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } okPrec = ok; });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const eau = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#3d9ccc', roughness: .12, metalness: .1, transparent: true, opacity: .82, side: THREE.DoubleSide }));
  eau.renderOrder = 1; scene.add(eau); window.__eauRiviere = eau; }
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
const exclus = new Set([terrain, ocean, clouds, cloudLayer, smoke, trees, trunks, ...FORETS]);
scene.traverse(o => { if (!o.isMesh) return; for (let p = o; p; p = p.parent) if (exclus.has(p)) return; o.castShadow = true; o.receiveShadow = true; });
terrain.receiveShadow = true;

// ================= CAMÉRA : boîtes des vrais bâtiments (on ignore arbres, haies, lampadaires, panneaux) =================
const CAMB = [];
function boiteCam(o, cx, cz, w, d, top) { o.updateWorldMatrix(true, false); const c = new THREE.Vector3(cx, 0, cz).applyMatrix4(o.matrixWorld), ax = new THREE.Vector3(1, 0, 0).transformDirection(o.matrixWorld), yw = Math.atan2(-ax.z, ax.x);
  CAMB.push({ x: c.x, z: c.z, c: Math.cos(yw), s: Math.sin(yw), hw: w / 2, hd: d / 2, r: Math.hypot(w, d) / 2, top }); }
function boiteMesh(m, max) { m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; if (![b.min.x, b.max.x, b.min.z, b.max.z, b.max.y].every(isFinite)) return; const w = b.max.x - b.min.x, d = b.max.z - b.min.z; if (w > max || d > max) return;
  m.updateWorldMatrix(true, false); const top = new THREE.Vector3(0, b.max.y, 0).applyMatrix4(m.matrixWorld).y; boiteCam(m, (b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2, w * .92, d * .92, top); }
if (capitale) capitale.children.forEach(m => { if (m.isMesh && m.userData.d > 0) boiteMesh(m, 30); });
for (const g of speciaux) { const m = g.userData.inner && g.userData.inner.children[0]; if (m && m.isMesh && !g.userData.monde) boiteMesh(m, 34); }
for (const [g, cx, cz, w, d, h] of BOITES_H) { boiteCam(g, cx, cz, w, d, 0); CAMB[CAMB.length - 1].top = hy + h; }
function murCam(x, y, z, proches) { for (const b of proches) { if (y > b.top) continue; const dx = x - b.x, dz = z - b.z, lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c; if (Math.abs(lx) < b.hw && Math.abs(lz) < b.hd) return true; } return false; }
let camD = 8;

// ================= COLLISIONS : grille 2,5D (sols + murs) calculée depuis la vraie géométrie =================
const CELL = .5, CH = 32, NC = 2 * DEMI / CELL, NF = 4, NW = 3, VIDE = -32768, CHK = new Map();
function chunk(i, j, cree) { const k = (i >> 5) * 128 + (j >> 5); let c = CHK.get(k); if (!c && cree) { c = { f: new Int16Array(CH * CH * NF).fill(VIDE), w: new Int16Array(CH * CH * NW * 2).fill(VIDE) }; CHK.set(k, c); } return c; }
const ci = v => Math.floor((v + DEMI) / CELL);
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
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = -DEMI + (i + .5) * CELL, z = -DEMI + (j + .5) * CELL;
      const l1 = ((B.z - C.z) * (x - C.x) + (C.x - B.x) * (z - C.z)) / d, l2 = ((C.z - A.z) * (x - C.x) + (A.x - C.x) * (z - C.z)) / d, l3 = 1 - l1 - l2;
      if (l1 >= -.02 && l2 >= -.02 && l3 >= -.02) fn(i, j, l1 * A.y + l2 * B.y + l3 * C.y); } };
  const visible = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const ignore = new Set([terrain, SOL3D, ocean, clouds, cloudLayer, smoke, trees, trunks, ...FORETS, ...GENS]);
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
  for (const F of FORETS) if (F.geometry === treeG) for (let k = 0; k < F.count; k++) { F.getMatrixAt(k, m4); m4.decompose(pp, qq, ss); if (ss.x < .05) continue; const r = .9 * ss.x;
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

// ================= herbe et fleurs autour du joueur =================
const masquePetit = masqueChemins;
function touffe() { const pos = [], col = [], C1 = new THREE.Color('#2f5a1c'), C2 = new THREE.Color('#8cc44e');
  for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283 + rnd(), r = .05 + rnd() * .12, h = .28 + rnd() * .3, w = .045, cx = Math.cos(a) * r, cz = Math.sin(a) * r, px2 = -Math.sin(a) * w, pz2 = Math.cos(a) * w, lean = .12 + rnd() * .15;
    pos.push(cx - px2, 0, cz - pz2, cx + px2, 0, cz + pz2, cx + Math.cos(a) * lean, h, cz + Math.sin(a) * lean); col.push(C1.r, C1.g, C1.b, C1.r, C1.g, C1.b, C2.r, C2.g, C2.b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g; }
function fleur() { const g = new THREE.OctahedronGeometry(.075, 0); g.scale(1, .6, 1); g.translate(0, .32, 0); const t = new THREE.CylinderGeometry(.012, .012, .32, 3); t.translate(0, .16, 0); return mergeG([g, t]); }
function mergeG(L) { let n = 0; for (const g of L) n += (g.index ? g.toNonIndexed() : g).attributes.position.count; const P = new Float32Array(n * 3), N = new Float32Array(n * 3); let o = 0;
  for (let g of L) { g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals(); P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(P, 3)); m.setAttribute('normal', new THREE.BufferAttribute(N, 3)); return m; }
const NH = 2400, NFL = 420;
const herbes = new THREE.InstancedMesh(touffe(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), NH);
const fleurs = new THREE.InstancedMesh(fleur(), new THREE.MeshLambertMaterial({ color: '#ffffff' }), NFL);
for (const m of [herbes, fleurs]) { m.frustumCulled = false; m.count = 0; scene.add(m); }
const FC = ['#ffffff', '#ffd23f', '#e85d9a', '#b06ad9', '#ff7a45', '#7fb2ff'].map(c => new THREE.Color(c));
const herbeC = [1e9, 1e9];
function replanter() {
  const S = 1.45, R = 30, cx0 = Math.round(P.x / S), cz0 = Math.round(P.z / S); herbeC[0] = P.x; herbeC[1] = P.z;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sc = new THREE.Vector3(), Ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0); let nh = 0, nf = 0;
  const hs = (i, j, k) => { const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v); };
  for (let j = -R / S; j <= R / S; j++) for (let i = -R / S; i <= R / S; i++) { if (i * i + j * j > (R / S) * (R / S)) continue; const gi = cx0 + i, gj = cz0 + j;
    if (hs(gi, gj, 9) < .12) continue;
    const x = (gi + hs(gi, gj, 1) - .5) * S, z = (gj + hs(gi, gj, 2) - .5) * S, y = height(x, z);
    if (y < 1.8 || y > 70 || Math.hypot(x - VOLC.x, z - VOLC.y) < 70 || riverDist(x, z) < 17) continue;
    if (Math.abs(height(x + .9, z) - y) + Math.abs(height(x, z + .9) - y) > .55) continue;
    const mi = Math.floor((x + DEMI) / (2 * DEMI) * 512), mj = Math.floor((z + DEMI) / (2 * DEMI) * 512); if (masquePetit[(mj * 512 + mi) * 4] > 40) continue;
    const ii = ci(x), jj = ci(z), c = chunk(ii, jj); if (c) { const b = ((jj & 31) * CH + (ii & 31)); let objet = false; for (let k = 0; k < NF; k++) { const v = c.f[b * NF + k]; if (v !== VIDE && v / 20 > y - .3) objet = Math.abs(v / 20 - y) > .02 || objet; } if (objet || c.w[b * NW * 2] !== VIDE) continue; }
    const yy = sol(x, z, y);
    Q.setFromAxisAngle(up, hs(gi, gj, 3) * 6.28); const sc = .7 + hs(gi, gj, 4) * .7; Ps.set(x, yy - .02, z);
    if (hs(gi, gj, 5) < .15 && nf < NFL) { Sc.set(sc, sc, sc); M.compose(Ps, Q, Sc); fleurs.setMatrixAt(nf, M); fleurs.setColorAt(nf, FC[Math.floor(hs(gi, gj, 6) * FC.length)]); nf++; }
    else if (nh < NH) { Sc.set(sc, sc * (.8 + hs(gi, gj, 7) * .6), sc); M.compose(Ps, Q, Sc); herbes.setMatrixAt(nh, M); nh++; } }
  herbes.count = nh; fleurs.count = nf; herbes.instanceMatrix.needsUpdate = true; fleurs.instanceMatrix.needsUpdate = true; if (fleurs.instanceColor) fleurs.instanceColor.needsUpdate = true;
}

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
function libreAutour(x, z, r0 = 0) { for (let r = r0; r < 18; r += .7) for (let a = 0; a < 6.28; a += .5) { const X = x + Math.cos(a) * r, Z = z + Math.sin(a) * r, g = sol(X, Z, height(X, Z) + .5); if (height(X, Z) > -.5 && !bloque(X, Z, g)) return [X, Z, g]; } return [x, z, sol(x, z)]; }
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
// ---- 🐞 signaler : code de position à copier + capture d'écran ; ?ici=CODE ramène exactement au même endroit ----
$('bug').onclick = () => { const code = ['V1', P.x.toFixed(1), P.z.toFixed(1), P.y.toFixed(1), yaw.toFixed(2), pitch.toFixed(2), dist.toFixed(0)].join(':');
  $('bug-code').textContent = code; $('bug-boite').classList.add('on'); copier(code); };
function copier(code) { $('bug-copie').textContent = 'Copier'; try { navigator.clipboard.writeText('🐞 Vulkaris ' + code).then(() => $('bug-copie').textContent = '✅ Code copié', () => {}); } catch (e) {} }
$('bug-copie').onclick = () => copier($('bug-code').textContent);
$('bug-ok').onclick = () => $('bug-boite').classList.remove('on');
{ const m = /[?&]ici=(V1:[-\d.:]+)/.exec(location.search); if (m) { const v = m[1].split(':').slice(1).map(Number); P.x = v[0]; P.z = v[1]; P.y = v[2]; yaw = v[3]; pitch = v[4]; dist = v[5] || dist; } }
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
// le terrain se remonte toujours ; seuls les murs/objets bloquent. Si on est déjà coincé dans un mur, on peut en sortir.
let coince = false;
function essai(x, z) { if (height(x, z) < -.6) return null; const g = sol(x, z, P.y); if (!coince && bloque(x, z, g)) return null; return g; }
let suivi = { t: 0, x: 0, z: 0 };
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
    coince = bloque(P.x, P.z, P.y, .3);
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
  vise.set(P.x, P.y + TAILLE * .75, P.z);
  // caméra : garde l'angle choisi ; seul un vrai bâtiment entre elle et le perso la rapproche (jamais à moins de 3 m)
  const ox = Math.sin(yaw) * Math.cos(pitch), oy = Math.sin(pitch), oz = Math.cos(yaw) * Math.cos(pitch);
  const proches = CAMB.filter(b => Math.abs(b.x - P.x) < b.r + dist + 2 && Math.abs(b.z - P.z) < b.r + dist + 2);
  let dd = dist; for (let s = 1; s <= dist; s += .3) { if (murCam(vise.x + ox * s, vise.y + oy * s, vise.z + oz * s, proches)) { dd = Math.max(3, s - .4); break; } }
  camD += (dd - camD) * Math.min(1, dt * (dd < camD ? 9 : 2.5));
  camCible.set(vise.x + ox * camD, vise.y + oy * camD, vise.z + oz * camD);
  camCible.y = Math.max(camCible.y, height(camCible.x, camCible.z) + .6, sol(camCible.x, camCible.z, camCible.y - .3) + .4);
  cam.position.lerp(camCible, Math.min(1, dt * 12)); cam.lookAt(vise);
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
  // anti-blocage : on pousse depuis 1,5 s sans avancer → on se dégage vers l'endroit libre le plus proche
  suivi.t += dt; if (amp < .3) suivi = { t: 0, x: P.x, z: P.z }; else if (suivi.t > 1.5) { if (Math.hypot(P.x - suivi.x, P.z - suivi.z) < .25 && (coince || height(P.x, P.z) < .3)) { const [X, Z, g] = libreAutour(P.x, P.z, 1.2); P.x = X; P.z = Z; P.y = g; } suivi = { t: 0, x: P.x, z: P.z }; }
  if (Math.hypot(P.x - herbeC[0], P.z - herbeC[1]) > 8) replanter();
  renderer.render(scene, cam);
  if (n === 2) $('charge').classList.add('cache');
  requestAnimationFrame(boucle);
}
window.T_CHARGE = performance.now();
requestAnimationFrame(boucle);
window.JEU = { P, tp, renderer, place, height, DIGUES, height0: (x, z) => height0(x, z), get pads() { return PADS.map(p => [+p.x.toFixed(0), +p.z.toFixed(0), +p.hw.toFixed(1), +p.hd.toFixed(1), +p.h.toFixed(1)]); }, PADDEF, murs: (x, z) => { const i = ci(x), j = ci(z), c = chunk(i, j); if (!c) return []; const b = ((j & 31) * CH + (i & 31)) * NW * 2, f = ((j & 31) * CH + (i & 31)) * NF; return [[...c.w.slice(b, b + 6)].map(v => v / 20), [...c.f.slice(f, f + 4)].map(v => v / 20)]; }, LOTS, CHEMINS, sol, bloque, hauts, get chunks() { return CHK.size; }, set yaw(v) { yaw = v; }, set pitch(v) { pitch = v; }, set dist(v) { dist = v; } };
