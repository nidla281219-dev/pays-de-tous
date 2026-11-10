"""Construit la bibliothèque de VRAIS bruitages (enregistrements CC0) depuis Openverse (api.openverse.org, sans clé).
Sortie : sons/lib/<rôle>/<source>_<id>.wav (44,1 kHz, début de silence retiré, longueur limitée)
         sons/lib/CREDITS.json (titre, auteur, licence, lien de chaque son).
Le nom du dossier = le rôle lu par le skill real-sfx (whoosh, hit, pop, chime, tick, riser, heartbeat, ambience, foley…).
Usage : python studio/sfx_openverse.py [--par-role 6]
"""
import os, re, json, time, argparse, subprocess, unicodedata, requests
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, 'sons', 'lib'); API = 'https://api.openverse.org/v1/audio/'
# rôle → (recherches, durée max gardée en s, durée min/max de l'original en s)
ROLES = {
    'construction': (['hammer nails', 'construction site', 'building construction'], 4.0, (0.5, 30)),
    'pieces':       (['coins', 'coin drop', 'cash register'], 2.5, (0.2, 8)),
    'vagues':       (['ocean waves', 'sea waves beach'], 30.0, (8, 300)),
    'mouettes':     (['seagulls', 'seagull'], 8.0, (1, 60)),
    'tambours':     (['war drums', 'epic drums', 'taiko drums'], 8.0, (2, 60)),
    'cor':          (['war horn', 'horn blow', 'ship horn'], 4.0, (0.5, 15)),
    'canon':        (['cannon', 'cannon fire', 'explosion distant'], 4.0, (0.3, 15)),
    'cloche':       (['church bell', 'bell toll'], 5.0, (1, 30)),
    'feu_artifice': (['fireworks'], 6.0, (1, 60)),
    'moteur':       (['go kart', 'race car pass by', 'engine rev'], 5.0, (1, 30)),
    'ferme':        (['rooster', 'farm animals', 'cow moo'], 4.0, (0.5, 30)),
    'oiseaux':      (['forest birds'], 20.0, (5, 200)),
    'feu':          (['campfire crackling', 'fire crackling'], 20.0, (5, 200)),
    'foule':        (['crowd cheering', 'crowd applause'], 8.0, (2, 120)),
}
H = {'User-Agent': 'pays-de-tous-sfx/1.0 (GitHub Actions)'}

def chercher(q, n):
    for essai in range(3):
        try:
            r = requests.get(API, params={'q': q, 'license': 'cc0', 'page_size': n}, headers=H, timeout=60)
        except Exception as e:
            print('  recherche impossible', q, e); time.sleep(10); continue
        if r.status_code == 429: time.sleep(30); continue
        if not r.ok: print('  recherche refusée', q, r.status_code, r.text[:300]); return []
        time.sleep(3.5); return r.json().get('results', [])
    return []

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--par-role', type=int, default=6); a = ap.parse_args()
    cred_p = os.path.join(LIB, 'CREDITS.json')
    credits = json.load(open(cred_p)) if os.path.exists(cred_p) else {}
    for role, (qs, garder, (dmin, dmax)) in ROLES.items():
        d = os.path.join(LIB, role); os.makedirs(d, exist_ok=True)
        deja = len([f for f in os.listdir(d) if f.endswith('.wav')])
        for q in qs:
            if deja >= a.par_role: break
            for r in chercher(q, 20):
                if deja >= a.par_role: break
                dur = (r.get('duration') or 0) / 1000
                if r.get('license') != 'cc0' or not (dmin <= dur <= dmax) or not r.get('url'): continue
                slug = re.sub(r'[^a-z0-9]+', '_', unicodedata.normalize('NFKD', r.get('title') or 'son').encode('ascii', 'ignore').decode().lower()).strip('_')[:28]; nom = f"{slug}_{r['id'][:4]}.wav"; out = os.path.join(d, nom)
                if os.path.exists(out): continue
                try:
                    raw = requests.get(r['url'], headers=H, timeout=120).content
                    tmp = '/tmp/sfx_brut'; open(tmp, 'wb').write(raw)
                    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af',
                                    f'silenceremove=start_periods=1:start_threshold=-50dB,atrim=0:{garder},afade=t=out:st={max(0, garder - 0.15):.2f}:d=0.15',
                                    '-ar', '44100', '-ac', '2', out], check=True, timeout=120)
                except Exception as e:
                    print('  échec', q, r['id'], e); continue
                credits[f'{role}/{nom}'] = {'titre': r.get('title'), 'auteur': r.get('creator'), 'licence': 'CC0',
                                            'lien': r.get('foreign_landing_url'), 'source': r.get('source'), 'recherche': q}
                deja += 1; print(f'  {role}/{nom} ← « {r.get("title")} » ({dur:.1f} s)')
        print(f'{role} : {deja} sons')
    json.dump(credits, open(cred_p, 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main()
