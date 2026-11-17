#!/usr/bin/env python3
"""Construit le jeu web Vulkaris (étape 1 : balade solo) → <site>/jeu/index.html
Décor = code de studio/scene.html (dernier timeline.json) ; maisons achetées = code EXACT de boutique/index.html
(maison(), terrain(), opts(), statue(), panneauNom()) avec les choix de boutique/ventes.json.
Usage : python3 studio/jeu_build.py [dossier_du_site]   (défaut : ../lepaysdetous.github.io)
À relancer après chaque nouvelle vente ou nouveau jour, puis commit/push du site."""
import json, os, re, shutil, sys, glob

ICI = os.path.dirname(os.path.abspath(__file__)); RACINE = os.path.dirname(ICI)
SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(RACINE), 'lepaysdetous.github.io')
OUT = os.path.join(SITE, 'jeu'); os.makedirs(OUT, exist_ok=True)

def remplace(s, a, b):
    assert a in s, 'introuvable dans scene.html : ' + a[:60]
    return s.replace(a, b, 1)

# ---------- 1. décor : script de scene.html ----------
scene = open(os.path.join(ICI, 'scene.html'), encoding='utf8').read()
js = scene.split('<script type="module">', 1)[1].rsplit('</script>', 1)[0]
js = js.split('window.frame=', 1)[0]
js = remplace(js, "import * as THREE from './three.js';", "import * as THREE from './three.js';\nawait Promise.all([document.fonts.load('40px L'), document.fonts.load(\"40px 'Lilita One'\")]).catch(() => {});")
js = remplace(js, "const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});",
              "const renderer=new THREE.WebGLRenderer({antialias:(devicePixelRatio||1)<2,powerPreference:'high-performance'});document.getElementById('jeu').appendChild(renderer.domElement);")
js = remplace(js, "renderer.setSize(W,H);renderer.setPixelRatio(1);", "renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));renderer.setSize(innerWidth,innerHeight);")
js = remplace(js, "scene.fog=new THREE.Fog('#bfe3f7',600,1900);", "scene.fog=new THREE.Fog('#bfe3f7',160,650);")
js = remplace(js, "const cam=new THREE.PerspectiveCamera(50,W/H,1,5000);", "const cam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.3,900);")
js = remplace(js, "function special(b){", "function special(b){if(b.type==='jeu_hauts')return;")
js = remplace(js, "Math.min(.32,(d-15)*.03)", "Math.min(.1,(d-15)*.01)")   # ville plus plate pour marcher
js = remplace(js, "Math.max(1.6,height0(wx,wz))", "Math.max(1.6,heightT(wx,wz))")   # socles au niveau du plateau de la ville
js += '\n{\n' + open(os.path.join(ICI, 'jeu', 'jeu.js'), encoding='utf8').read() + '\n}\n'   # bloc : ses noms ne gênent pas ceux du décor

# ---------- 2. maisons : code 3D de la boutique ----------
bq = open(os.path.join(RACINE, 'boutique', 'index.html'), encoding='utf8').read()
debut = bq.index("const MAT = new THREE.MeshStandardMaterial({ vertexColors")
fin = bq.index("let groupe = new THREE.Group(); scene.add(groupe);")
code3d = bq[debut:fin]
for a, b in [("document.getElementById('boite').value", "etat.panneau"), ("document.getElementById('plaque').value", "etat.plaque")]:
    assert a in code3d; code3d = code3d.replace(a, b)
tables = '\n'.join(re.findall(r"^const (?:FACADES|TOITS|VOLETS|MATIERES) = .*;$", bq, re.M))
assert tables.count('const ') == 4
boutique_js = ("window.fabriqueBoutique = (THREE, renderer) => {\nlet etat;\n" + tables + "\nconst T = { FACADES, TOITS, VOLETS, MATIERES };\n"
    + code3d + "\nconst FOND = -7.5;\nreturn e => { etat = { ...e, options: new Set(e.options) }; const g = new THREE.Group(); const m = maison(); m.mesh.position.z = FOND;"
    " g.add(terrain(m.w, m.d)); g.add(m.mesh); g.add(opts(m.w, m.d)); return { g, w: m.w, d: m.d }; };\n};")

# ---------- 3. données : ventes + noms ----------
VENDUES = {int(k): v for k, v in re.findall(r'(\d+): "([^"]+)"', re.search(r'const VENDUES = \{([^}]*)\}', bq).group(1))}
ZONES = [(z, nom, int(de), int(a)) for z, nom, de, a in re.findall(r"\{ id:'(\w+)', nom:'([^']+)', sup:[\d.]+, de:(\d+), a:(\d+) \}", bq)]
NOMS = dict(re.findall(r"\{ id:'(\w+)', nom:'((?:[^'\\]|\\')+)'", bq)); NOMS = {k: v.replace("\\'", "'") for k, v in NOMS.items()}
STY = dict(re.findall(r"\['(\w+)','([^']+)'\]", re.search(r"const STYLES = \[(.*?)\];", bq).group(1)))
zone = lambda n: next((nom for _, nom, de, a in ZONES if de <= n <= a), '')
ventes = {int(v['parcelle']): v for v in json.load(open(os.path.join(RACINE, 'boutique', 'ventes.json'), encoding='utf8'))['ventes']}
lots = []
for n, pseudo in sorted(VENDUES.items()):
    v = ventes.get(n); c = (v or {}).get('choix') or f'P{n}-petite-classique-creme-tuile-bleu-haie-x-x'
    p = c.split('-'); opts = [] if p[7] == 'x' else p[7].split('_'); st = p[8].split('_')[1:] if len(p) > 8 and p[8] != 'x' else None
    e = dict(maison=p[1], style=p[2], facade=p[3], toit=p[4], volet=p[5], cloture=p[6], options=opts, statue=bool(st),
             pose=st[0] if st else 'debout', matiere=st[1] if st else 'bronze', acc=st[2] if st else 'aucun',
             panneau=(v or {}).get('panneau') or pseudo, plaque=(v or {}).get('plaque') or pseudo)
    desc = f"{NOMS.get(p[1], p[1])} {STY.get(p[2], p[2]).lower()}" + ''.join(' · ' + NOMS.get(o, o) for o in opts if o != 'feu') + (' · Statue' if st else '')
    lots.append(dict(n=n, zone=zone(n), pseudo=pseudo, etat=e, desc=desc))   # jamais d'e-mail dans le site public
libres = [n for _, _, de, a in ZONES for n in range(de, a + 1) if n not in VENDUES]
par_zone = [[n for n in libres if de <= n <= a] for _, _, de, a in ZONES]
i = 0
while len(lots) < 8 and any(par_zone):
    if par_zone[i % 3]: n = par_zone[i % 3].pop(0); lots.append(dict(n=n, zone=zone(n)))
    i += 1
lots = lots[:8]

tls = sorted(glob.glob(os.path.join(RACINE, 'jours', 'jour*', 'timeline.json')), key=lambda f: int(re.sub(r'\D', '', os.path.basename(os.path.dirname(f))) or 0))
tl = json.load(open(tls[-1], encoding='utf8'))
hb = next((b for b in tl['etat'].get('batiments', []) if b.get('type') == 'quartier_hauts'), None)
DATA = dict(etat=tl['etat'], habitants=min(60, (tl.get('habitants') or {}).get('n', 40)), lots=lots,
            hauts=dict(x=hb['pos'][0] if hb else -55, z=hb['pos'][1] if hb else 0, rot=hb.get('rot', 1.5708) if hb else 1.5708))

# ---------- 4. page ----------
HTML = """<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#9fd3f2"><title>Vulkaris — le jeu (bêta)</title>
<style>
@font-face{font-family:L;src:url(lilita.woff2)}@font-face{font-family:'Lilita One';src:url(lilita.woff2)}
html,body{margin:0;height:100%;overflow:hidden;background:#9fd3f2;font-family:L,system-ui,sans-serif;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;overscroll-behavior:none}
#jeu canvas{display:block;position:fixed;inset:0;width:100vw;height:100vh;touch-action:none}
#out{display:none}
.haut{position:fixed;top:max(10px,env(safe-area-inset-top));left:10px;right:10px;display:flex;gap:8px;justify-content:space-between;align-items:center;pointer-events:none}
.titre{color:#fff;font-size:20px;text-shadow:0 2px 0 #3b2412,0 0 6px rgba(0,0,0,.4)}
.btns{display:flex;gap:6px;pointer-events:auto}
.btns button{font:15px L,sans-serif;border:0;border-radius:14px;padding:9px 9px;background:rgba(15,25,40,.62);color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25)}
#joy{position:fixed;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;background:rgba(255,255,255,.18);border:3px solid rgba(255,255,255,.55);display:none;pointer-events:none}
#joy.on{display:block}#joyb{position:absolute;left:50%;top:50%;width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.85);transform:translate(-50%,-50%)}
#info{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translate(-50%,calc(100% + 40px));transition:transform .3s;background:#fffaf0;border:3px solid #e8c35a;border-radius:18px;padding:10px 16px;text-align:center;width:min(340px,86vw);box-sizing:border-box;box-shadow:0 6px 18px rgba(0,0,0,.3);pointer-events:auto}
#info.on{transform:translate(-50%,0)}#info b{display:block;font-size:20px;color:#b8862b;font-weight:normal}#info span{display:block;font-family:system-ui,sans-serif;font-size:14px;color:#333;margin-top:2px}#info small{display:block;font-family:system-ui,sans-serif;color:#777;margin-top:2px}#info a{display:inline-block;margin-top:6px;color:#fff;background:#c0281e;border-radius:10px;padding:5px 10px;text-decoration:none;font-size:15px}
#aide{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);background:rgba(15,25,40,.7);color:#fff;border-radius:16px;padding:14px 18px;font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;text-align:center;pointer-events:none;transition:opacity .4s;width:min(300px,80vw)}
#charge{position:fixed;inset:0;background:#9fd3f2;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:30px;text-shadow:0 3px 0 #3b2412;transition:opacity .5s;z-index:9}
#charge small{font-size:16px;margin-top:10px;font-family:system-ui,sans-serif;text-shadow:none;opacity:.9}
.cache{opacity:0;pointer-events:none!important}
#bug-boite{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.9);opacity:0;pointer-events:none;transition:.2s;background:#fffaf0;border:3px solid #e8c35a;border-radius:18px;padding:14px 16px;text-align:center;width:min(320px,86vw);box-sizing:border-box;font-family:system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);z-index:8}
#bug-boite.on{opacity:1;pointer-events:auto;transform:translate(-50%,-50%)}#bug-boite b{display:block;font:22px L,sans-serif;color:#b8862b;font-weight:normal}#bug-boite span{display:block;font-size:14px;color:#333;margin:6px 0}#bug-boite code{display:block;background:#efe6d2;border-radius:8px;padding:6px;font-size:14px;margin:6px 0;user-select:all;-webkit-user-select:all}#bug-boite button{font:15px L,sans-serif;border:0;border-radius:12px;padding:8px 14px;margin:4px;background:#1f4a6e;color:#fff}
</style></head><body>
<div id="jeu"></div><canvas id="out" width="4" height="4"></canvas>
<div class="haut"><div class="titre">🌋 Vulkaris</div><div class="btns"><button id="tp-hauts">🏡 Hauts</button><button id="tp-ville">🏙️ Ville</button><button id="zoom">🔍</button><button id="bug">🐞</button></div></div>
<div id="bug-boite"><b>🐞 Un souci ici ?</b><span>Code copié ✅<br>Touche Fermer, fais une capture d'écran, puis envoie-la à Claude en collant le code :</span><code id="bug-code"></code><div><button id="bug-copie">Copier</button><button id="bug-ok">Fermer</button></div></div>
<div id="joy"><div id="joyb"></div></div>
<div id="aide">👈 Glisse à <b>gauche</b> pour marcher<br>👉 Glisse à <b>droite</b> pour tourner la caméra<br>🏡 Visite les maisons des Fondateurs !</div>
<div id="info"></div>
<div id="charge">🌋 Vulkaris<small>Chargement de l'île…</small></div>
<script>window.JEU_DATA = __DATA__;</script>
<script type="module">
__BOUTIQUE__
</script>
<script type="module">
__JEU__
</script>
</body></html>"""
page = HTML.replace('__DATA__', json.dumps(DATA, ensure_ascii=False)).replace('__BOUTIQUE__', boutique_js).replace('__JEU__', js)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(page)
shutil.copy(os.path.join(ICI, 'three.js'), os.path.join(OUT, 'three.js'))
shutil.copy(os.path.join(ICI, 'lilita.woff2'), os.path.join(OUT, 'lilita.woff2'))
print(f"OK → {OUT}/index.html ({len(page)//1024} Ko) · {sum(1 for l in lots if 'etat' in l)} maisons achetées · décor {os.path.basename(os.path.dirname(tls[-1]))}")
