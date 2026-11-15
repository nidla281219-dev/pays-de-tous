// ================= JEU VULKARIS — étape 1 : balade solo (ajouté après le décor de scene.html) =================
const D = window.JEU_DATA;
const $ = id => document.getElementById(id);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });

// ---- le monde (même décor que la vidéo) ----
const HAUTS = D.hauts; // {x, z, rot}
PADDEF.jeu_hauts = [0, 0, 66, 39];
const E = JSON.parse(JSON.stringify(D.etat));
E.batiments = (E.batiments || []).filter(b => b.type !== 'quartier_hauts').concat([{ type: 'jeu_hauts', pos: [HAUTS.x, HAUTS.z], rot: HAUTS.rot }]);
setup({ etat: E, habitants: { n: D.habitants, t0: 0 }, vis: () => false, prog: () => 1 });
for (const o of [city, villA, villB, cloudLayer, pinA, pinB, toi]) o.visible = false;
for (const g of speciaux) { g.visible = true; g.userData.inner.scale.set(1, 1, 1); }

// ---- collisions (boîtes orientées) ----
const COL = [];
function colliderDe(obj, cx, cz, w, d) { // boîte w×d centrée en (cx,cz) dans le repère local de obj
  obj.updateWorldMatrix(true, false);
  const c = new THREE.Vector3(cx, 0, cz).applyMatrix4(obj.matrixWorld), ax = new THREE.Vector3(1, 0, 0).transformDirection(obj.matrixWorld);
  const yaw = Math.atan2(-ax.z, ax.x); COL.push({ x: c.x, z: c.z, c: Math.cos(yaw), s: Math.sin(yaw), hw: w / 2, hd: d / 2, r: Math.hypot(w, d) / 2 });
}
function colliderMesh(m, max = 24) { m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; const w = b.max.x - b.min.x, d = b.max.z - b.min.z; if (w > max || d > max) return; colliderDe(m, (b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2, w, d); }
if (capitale) capitale.children.forEach(m => { if (m.isMesh && m.userData.d > 0) colliderMesh(m); });
for (const g of speciaux) { const m = g.userData.inner && g.userData.inner.children[0]; if (m && m.isMesh) colliderMesh(m, 26); }

// ---- Les Hauts de Plavulca : les maisons achetées, code EXACT de la boutique ----
const parcelle = window.fabriqueBoutique(THREE, renderer);
sansArbres(HAUTS.x, HAUTS.z, 85);
const hy = height(HAUTS.x, HAUTS.z);
const hauts = new THREE.Group(); hauts.position.set(HAUTS.x, hy, HAUTS.z); hauts.rotation.y = HAUTS.rot; scene.add(hauts);
{ const L = [];
  bx(L, 134, 1, 80, 0, -.52, 0, '#7fb35f');                                   // dalle verte
  bx(L, 128, .1, 9, 0, .03, 0, '#cbbfa6'); for (let i = 0; i < 64; i++) bx(L, .08, .11, 9, -63 + i * 2, .04, 0, '#b9ad94');   // avenue pavée
  for (const s of [-1, 1]) { bx(L, 128, .22, .3, 0, .1, s * 4.6, '#9a948a'); }
  for (let x = -54; x <= 54; x += 18) for (const s of [-1, 1]) lampadaire(L, x + 9, s * 4.2);
  for (const s of [-1, 1]) { bx(L, 1.8, 7, 1.8, -64, 3.5, s * 5.6, '#d6cfc2'); bx(L, 2.2, .5, 2.2, -64, 7.2, s * 5.6, '#bdb6a8'); sph(L, .7, -64, 8, s * 5.6, '#f2c14e'); }
  bx(L, 1, 1, 13, -64, 7.6, 0, '#6b4a2e');
  for (const x of [-66, 66]) for (const z of [-22, 22]) arbreB(L, x, z, .8);
  hauts.add(new THREE.Mesh(merge(L), VMAT));
  const pn = panneau(['LES HAUTS DE PLAVULCA'], 12, 1.7, '#1f4a6e', '#ffd34d'); pn.position.set(-64.6, 8.9, 0); pn.rotation.y = -Math.PI / 2; hauts.add(pn);
  const pn2 = panneau(['LES HAUTS DE PLAVULCA'], 12, 1.7, '#1f4a6e', '#ffd34d'); pn2.position.set(-63.4, 8.9, 0); pn2.rotation.y = Math.PI / 2; hauts.add(pn2);
}
function etiquette(txt, couleur = '#ffd34d') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  let f = 72; x.font = `${f}px L`; while (x.measureText(txt).width > 480 && f > 24) { f -= 4; x.font = `${f}px L`; }
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = 12; x.strokeStyle = '#3b2412'; x.strokeText(txt, 256, 66); x.fillStyle = couleur; x.fillText(txt, 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true })); s.scale.set(10, 2.5, 1); return s;
}
const LOTS = [];  // {n, zone, info, monde:[x,z]}
const SLOTS = []; for (const s of [-1, 1]) for (const x of [-45, -15, 15, 45]) SLOTS.push([x, s]);
D.lots.forEach((lot, i) => {
  const [x, s] = SLOTS[i]; const g = new THREE.Group(); g.position.set(x, 0, s * 20); g.rotation.y = s > 0 ? Math.PI : 0; hauts.add(g);
  if (lot.etat) {
    const p = parcelle(lot.etat); g.add(p.g); const e = lot.etat, w = p.w, d = p.d, F = -7.5;
    colliderDe(g, 0, F, w + .6, d + .6);
    if (e.maison === 'villa') colliderDe(g, w / 2 + 3 - .3, F - d / 2 + 3 - 2.5, 6, 6);
    if (e.maison === 'cabane') colliderDe(g, 0, F + d / 2 + 1.1, w + 1, 2.2 + .4);
    if (e.options.includes('voiture')) { colliderDe(g, -w / 2 - 3.2, F + .5, 4.4, 6); colliderDe(g, -w / 2 - 3.2, F + 5.1, 2.2, 3.8); }
    if (e.options.includes('fontaine')) colliderDe(g, -5, 10.5, 3.6, 3.6);
    if (e.options.includes('piscine')) colliderDe(g, 8, 5, 6, 8);
    if (e.statue) colliderDe(g, -9.5, 8.5, 3.4, 3.4);
    const et = etiquette('⭐ ' + lot.pseudo); et.position.set(0, (e.maison === 'cabane' ? 9 : 14), F); g.add(et);
  } else {
    const L = []; bx(L, 30, .4, 30, 0, -.2, 0, '#86c06a'); for (let k = 0; k < 6; k++) bx(L, 30, .41, 2, 0, -.2, -12 + k * 5, '#7db662');
    cloture(L, 0, -14.6, 29, 0, '#f4f1ea'); cloture(L, -14.6, 0, 29, Math.PI / 2, '#f4f1ea'); cloture(L, 14.6, 0, 29, Math.PI / 2, '#f4f1ea'); cloture(L, -8.5, 14.6, 12, 0, '#f4f1ea'); cloture(L, 8.5, 14.6, 12, 0, '#f4f1ea');
    for (const dx of [-2.6, 2.6]) bx(L, .22, 3.2, .22, dx, 1.6, 9, '#5a3a22');
    g.add(new THREE.Mesh(merge(L), VMAT));
    for (const [ry, dz] of [[0, .03], [Math.PI, -.03]]) { const pn = panneau(['À VENDRE', 'Parcelle ' + lot.n], 5.4, 2.4, '#c0281e', '#ffffff'); pn.position.set(0, 2.6, 9 + dz); pn.rotation.y = ry; g.add(pn); }
  }
  g.updateWorldMatrix(true, false); const c = new THREE.Vector3(0, 0, 0).applyMatrix4(g.matrixWorld);
  LOTS.push({ ...lot, monde: [c.x, c.z] });
});

// ---- le perso (tête ronde) ----
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
perso.scale.setScalar(.9);

// ---- sol et déplacements ----
const place = capitale ? capitale.userData.place : null;
function sol(x, z) {
  const lx = x - HAUTS.x, lz = z - HAUTS.z, c = Math.cos(HAUTS.rot), s = Math.sin(HAUTS.rot), ux = lx * c - lz * s, uz = lx * s + lz * c;
  if (Math.abs(ux) < 66 && Math.abs(uz) < 39) return hy;
  let h = height(x, z); if (place && Math.hypot(x - place[0], z - place[2]) < 12.6) h = Math.max(h, place[1] - .05);
  return h;
}
function libre(x, z) { return height(x, z) > -.7; }
function pousser(p, r = .55) {
  for (const b of COL) { const dx = p.x - b.x, dz = p.z - b.z; if (Math.abs(dx) > b.r + 2 || Math.abs(dz) > b.r + 2) continue;
    const lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c, px = b.hw + r - Math.abs(lx), pz = b.hd + r - Math.abs(lz);
    if (px > 0 && pz > 0) { let nx = lx, nz = lz; if (px < pz) nx = Math.sign(lx || 1) * (b.hw + r); else nz = Math.sign(lz || 1) * (b.hd + r);
      p.x = b.x + nx * b.c + nz * b.s; p.z = b.z - nx * b.s + nz * b.c; } }
}
const P = { x: 0, z: 0, y: 0, dir: 0, phase: 0, v: 0 };
let yaw = 0, pitch = .5, dist = 13;
function tp(lieu) {
  if (lieu === 'ville' && place) { P.x = place[0]; P.z = place[2] + 16; P.dir = Math.PI; yaw = 0; }
  else { const a = new THREE.Vector3(-58, 0, 0).applyMatrix4(hauts.matrixWorld), b = new THREE.Vector3(0, 0, 0).applyMatrix4(hauts.matrixWorld);
    P.x = a.x; P.z = a.z; P.dir = Math.atan2(b.x - a.x, b.z - a.z); yaw = P.dir + Math.PI; }
  P.y = sol(P.x, P.z); pitch = .5;
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
  else if (e.pointerId === camT.id) { yaw -= (e.clientX - camT.x) * .006; pitch = Math.max(.08, Math.min(1.25, pitch + (e.clientY - camT.y) * .004)); camT.x = e.clientX; camT.y = e.clientY; }
});
const fin = e => { if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; base.classList.remove('on'); } if (e.pointerId === camT.id) camT.id = null; };
cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
cv.addEventListener('wheel', e => { dist = Math.max(5, Math.min(22, dist + e.deltaY * .01)); }, { passive: true });
const K = {}; addEventListener('keydown', e => { K[e.key.toLowerCase()] = true; $('aide').classList.add('cache'); }); addEventListener('keyup', e => { K[e.key.toLowerCase()] = false; });
$('tp-hauts').onclick = () => tp('hauts'); $('tp-ville').onclick = () => tp('ville');
$('zoom').onclick = () => { dist = dist > 16 ? 8 : dist > 10 ? 20 : 13; };

// ---- carte d'info près d'une maison achetée ----
let infoLot = null;
function majInfo() {
  let best = null, bd = 19; for (const l of LOTS) { const d = Math.hypot(P.x - l.monde[0], P.z - l.monde[1]); if (d < bd) { bd = d; best = l; } }
  if (best === infoLot) return; infoLot = best; const c = $('info');
  if (!best) { c.classList.remove('on'); return; }
  c.innerHTML = best.etat ? `<b>⭐ ${esc(best.pseudo)}</b><span>${esc(best.desc)}</span><small>Parcelle ${best.n} · ${esc(best.zone)}</small>`
    : `<b>Parcelle ${best.n} à vendre</b><span>${esc(best.zone)}</span><a href="/" target="_blank">Choisir ma maison →</a>`;
  c.classList.add('on');
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// ---- boucle ----
let t = 0, last = performance.now(), n = 0;
const vise = new THREE.Vector3();
function boucle(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; n++;
  // déplacement
  let jx = joy.x, jy = joy.y;
  const kx = (K.d || K.arrowright ? 1 : 0) - (K.q || K.a || K.arrowleft ? 1 : 0), ky = (K.s || K.arrowdown ? 1 : 0) - (K.z || K.w || K.arrowup ? 1 : 0);
  if (kx || ky) { const l = Math.hypot(kx, ky); jx = kx / l * (K.shift ? 1 : .6); jy = ky / l * (K.shift ? 1 : .6); }
  const amp = Math.min(1, Math.hypot(jx, jy));
  if (amp > .08) {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let mx = fx * -jy + rx * jx, mz = fz * -jy + rz * jx; const l = Math.hypot(mx, mz) || 1; mx /= l; mz /= l;
    const vit = 4 + 10 * amp * amp; const nx = P.x + mx * vit * dt, nz = P.z + mz * vit * dt;
    if (libre(nx, nz)) { const q = { x: nx, z: nz }; pousser(q); P.x = q.x; P.z = q.z; }
    const cible = Math.atan2(mx, mz); let d = ((cible - P.dir + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; P.dir += d * Math.min(1, dt * 12);
    P.phase += dt * vit * 1.6; P.v = amp;
  } else { P.v *= .8; P.phase *= .9; }
  P.y += (sol(P.x, P.z) - P.y) * Math.min(1, dt * 15);
  perso.position.set(P.x, P.y + Math.abs(Math.sin(P.phase)) * .12 * Math.min(1, P.v * 2), P.z); perso.rotation.y = P.dir;
  const sw = Math.sin(P.phase) * .7 * Math.min(1, P.v * 1.5); jambes[0].rotation.x = sw; jambes[1].rotation.x = -sw; bras[0].rotation.x = -sw * .8; bras[1].rotation.x = sw * .8;
  // caméra 3e personne
  vise.set(P.x, P.y + 2.2, P.z);
  const cx = P.x + Math.sin(yaw) * Math.cos(pitch) * dist, cz = P.z + Math.cos(yaw) * Math.cos(pitch) * dist;
  let cy = vise.y + Math.sin(pitch) * dist; cy = Math.max(cy, sol(cx, cz) + 1.2, -.0);
  cam.position.lerp(new THREE.Vector3(cx, cy, cz), Math.min(1, dt * 10)); cam.lookAt(vise);
  // décor vivant
  if (n % 2 === 0) waves(t);
  waveFlag(t);
  for (const g of clouds.children) { g.position.x = g.userData.x0 ?? (g.userData.x0 = g.position.x); g.position.x = g.userData.x0 + t * g.userData.v; }
  smoke.children.forEach((s, i) => { const ph = (t * .25 + i / 10) % 1; s.position.set(VOLC.x + Math.sin(i * 3 + t * .5) * 4 + ph * 20, height(VOLC.x, VOLC.y) + 10 + ph * 60, VOLC.y - ph * 8); s.scale.setScalar(1 + ph * 3); s.material.opacity = .7 * (1 - ph); });
  bougerGens(t); for (const g of GENS) g.scale.multiplyScalar(.62);
  for (const g of speciaux) { g.traverse(o => { if (o.userData && o.userData.barber) o.userData.barber.offset.y = -t * .6 });
    if (g.userData.flotte) { g.position.y = g.userData.y0 + Math.sin(t * 1.4) * .35; g.rotation.z = Math.sin(t * 1.1) * .04; }
    if (g.userData.karts) for (const m of g.userData.karts) { const K2 = m.userData.kart, a = -(t * .35 + K2.ph) * Math.PI * 2, x = Math.cos(a) * K2.RX, z = Math.sin(a) * K2.RZ * (1 + .35 * Math.sin(a * 2)), a2 = a - .05, x2 = Math.cos(a2) * K2.RX, z2 = Math.sin(a2) * K2.RZ * (1 + .35 * Math.sin(a2 * 2)); m.position.set(x, 0, z); m.rotation.y = Math.atan2(-(z2 - z), x2 - x); } }
  if (n % 10 === 0) majInfo();
  renderer.render(scene, cam);
  if (n === 2) $('charge').classList.add('cache');
  requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);
window.JEU = { P, tp, renderer, cam, set dist(v) { dist = v; }, get yaw() { return yaw; }, set yaw(v) { yaw = v; }, set pitch(v) { pitch = v; }, LOTS, COL };
