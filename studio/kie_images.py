#!/usr/bin/env python3
"""Génère des images avec Kie.ai (clé : variable d'environnement KIE_API_KEY, secret GitHub) — lancé par .github/workflows/kie_images.yml.
Usage : python3 studio/kie_images.py studio/jeu/textures.json [nom1,nom2…]   → studio/jeu/textures/<nom>.jpg (1024, rendue raccordable) + <nom>_brut.jpg
Les images de textures sont rendues « sans couture » (fondu avec une copie décalée d'une demi-image)."""
import json, os, sys, time, urllib.request
import numpy as np
from PIL import Image

API = 'https://api.kie.ai/api/v1/jobs'
CLE = os.environ['KIE_API_KEY']

def appel(url, corps=None):
    req = urllib.request.Request(url, data=json.dumps(corps).encode() if corps is not None else None,
                                 headers={'Authorization': f'Bearer {CLE}', 'Content-Type': 'application/json', 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r: return json.load(r)

def raccordable(im):
    a = np.asarray(im.convert('RGB').resize((1024, 1024), Image.LANCZOS)).astype(np.float32); n = a.shape[0]
    b = np.roll(np.roll(a, n // 2, 0), n // 2, 1)                                   # copie décalée : ses bords sont au centre
    t = np.abs(np.linspace(-1, 1, n)); m = np.clip(np.maximum.outer(t, t) * 1.6 - .6, 0, 1)[..., None]   # 0 au centre → 1 vers les bords
    m = m * m * (3 - 2 * m)
    return Image.fromarray(np.clip(a * (1 - m) + b * m, 0, 255).astype(np.uint8))

def main():
    spec = json.load(open(sys.argv[1], encoding='utf8')); seuls = set(sys.argv[2].split(',')) if len(sys.argv) > 2 and sys.argv[2] else None
    out = os.path.join(os.path.dirname(sys.argv[1]), spec.get('dossier', 'textures')); os.makedirs(out, exist_ok=True)
    taches = {}
    for it in spec['images']:
        if seuls and it['nom'] not in seuls: continue
        r = appel(f'{API}/createTask', {'model': spec.get('modele', 'nano-banana-2'), 'input': {'prompt': it['prompt'] + '. ' + spec.get('style', ''),
              'aspect_ratio': it.get('ratio', '1:1'), 'resolution': it.get('resolution', '1K'), 'output_format': 'jpg', 'google_search': False, 'image_input': []}})
        if r.get('code') != 200: print('ÉCHEC création', it['nom'], r); continue
        taches[r['data']['taskId']] = it; print('tâche', it['nom'], r['data']['taskId'], flush=True)
    t0 = time.time(); ok = 0
    while taches and time.time() - t0 < 900:
        time.sleep(8)
        for tid, it in list(taches.items()):
            d = appel(f'{API}/recordInfo?taskId={tid}').get('data') or {}; st = d.get('state')
            if st == 'success':
                url = json.loads(d.get('resultJson') or '{}').get('resultUrls', [None])[0]
                brut = os.path.join(out, it['nom'] + '_brut.jpg'); urllib.request.urlretrieve(url, brut)
                im = Image.open(brut); (raccordable(im) if it.get('raccord', True) else im.convert('RGB')).save(os.path.join(out, it['nom'] + '.jpg'), quality=88)
                print('OK', it['nom'], flush=True); ok += 1; del taches[tid]
            elif st in ('fail', 'failed'):
                print('ÉCHEC', it['nom'], d.get('failCode'), d.get('failMsg'), flush=True); del taches[tid]
    for it in taches.values(): print('TROP LONG', it['nom'])
    print(f'{ok} image(s) prêtes dans {out}')
    if not ok: sys.exit(1)

main()
