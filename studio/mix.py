"""Son du jour N : voix + musique + VRAIS bruitages (bibliothèque sons/lib = Openverse CC0, sons/earshot = earshot).
python mix.py N   (dans studio/, après node render.js --jour N pays_jN_video.mp4) → le_pays_de_tous_jourN.mp4
Automatique (lu dans la timeline) : whoosh à chaque plan, pop à chaque carte, foule sur les cartes gagnant/drapeau/resultat,
pièces sur la carte trésor, chantier au début de chaque « grow » (construction).
En plus, à la main dans timeline.json :
  "sons": [{"t": 12.3, "type": "canon", "vol": 0.6, "dur": 3}]   types = dossiers de sons/lib ou sons/earshot
          (whoosh, pop, hit, chime, riser, tick, foule, epee, construction, pieces, vagues, mouettes, tambours, cor,
           canon, cloche, feu_artifice, moteur, ferme, oiseaux, feu)
  "ambiance": "vagues"   (fond sonore discret sur toute la vidéo ; ou ["vagues", "mouettes"])
  "inserts": [{"t0": 30, "t1": 38, "fichier": "assets/site_demo.mp4", "debut": 0}]   (clip plein écran 1080×1920 qui remplace l'image entre t0 et t1, ex. démo du site)
Un type sans fichier est ignoré sans erreur.
"""
import os, sys, json, glob, zlib, subprocess
n = sys.argv[1]; ICI = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(ICI, '..', 'jours', f'jour{n}'); S = os.path.join(ICI, '..', 'sons')
TL = json.load(open(os.path.join(D, 'timeline.json'))); dur = TL['dur']

def fichier(typ, t):
    """Un son du type demandé, choisi de façon stable (même t → même son) pour varier sans hasard."""
    fs = sorted(glob.glob(os.path.join(S, 'lib', typ, '*.wav')) + glob.glob(os.path.join(S, 'earshot', typ, '*.wav')))
    if not fs: return None
    return fs[zlib.crc32(f'{typ}{t:.2f}'.encode()) % len(fs)]

VIEUX = {'whoosh': 'swipe_whoosh_b7ae.wav', 'pop': 'pop_01_b715.wav'}
ev = []  # (t, type, vol, durée max)
ev += [(s['t'] - .15, 'whoosh', .35, 1.2) for s in TL['shots'] if s['t'] > 0.5]
for c in TL.get('cards', []):
    if c['kind'] == 'fin': continue
    ev.append((c['t0'], 'pop', .5, .6))
    if c['kind'] in ('gagnant', 'drapeau', 'resultat'): ev.append((c['t0'] + .1, 'foule', .35, 3.5))
    if c['kind'] == 'tresor': ev.append((c['t0'] + .2, 'pieces', .55, 2.5))
ev += [(t, 'pop', .5, .6) for t in TL.get('pops', [])]
ev += [(g[0], 'construction', .45, min(4, max(1.5, g[1] - g[0]))) for k, g in TL.get('grow', {}).items()]
ev += [(s['t'], s['type'], s.get('vol', .5), s.get('dur', 4)) for s in TL.get('sons', [])]

args = ['-i', os.path.join(ICI, f'pays_j{n}_video.mp4'), '-i', os.path.join(D, 'voix.mp3'), '-i', os.path.join(S, 'musique_epic_score.mp3')]
f = f"[1:a]apad[vo];[2:a]volume=0.13,afade=t=in:d=1.5,afade=t=out:st={dur-2.1:.2f}:d=2[mu]"; mix = '[vo][mu]'; k = 3
amb = TL.get('ambiance'); amb = [amb] if isinstance(amb, str) else (amb or [])
for a in amb:
    fa = fichier(a, 0)
    if not fa: continue
    args += ['-stream_loop', '-1', '-i', fa]; f += f";[{k}:a]volume=0.10,atrim=0:{dur:.2f},afade=t=in:d=1,afade=t=out:st={dur-1.5:.2f}:d=1.5[s{k}]"; mix += f'[s{k}]'; k += 1
compte = {}
for t, typ, vol, dmax in sorted(ev):
    fs = fichier(typ, t) or (os.path.join(S, VIEUX[typ]) if typ in VIEUX else None)
    if not fs: continue
    ms = int(max(0, t) * 1000)
    args += ['-i', fs]; f += f";[{k}:a]atrim=0:{dmax},afade=t=out:st={max(0, dmax - .3):.2f}:d=0.3,volume={vol},adelay={ms}|{ms}[s{k}]"; mix += f'[s{k}]'; k += 1
    compte[typ] = compte.get(typ, 0) + 1
f += f";{mix}amix=inputs={k-1}:normalize=0:duration=first,atrim=0:{dur+.3:.2f},loudnorm=I=-14:TP=-1.5[a]"
vmap, vcodec = '0:v', ['-c:v', 'copy']
ins = TL.get('inserts', [])
if ins:
    base = '[0:v]'
    for j, it in enumerate(ins):
        args += ['-ss', str(it.get('debut', 0)), '-i', os.path.join(ICI, '..', it['fichier'])]
        f += f";[{k}:v]scale=1080:1920,setpts=PTS-STARTPTS+{it['t0']}/TB[i{j}];{base}[i{j}]overlay=0:0:eof_action=pass:enable='between(t,{it['t0']},{it['t1']})'[v{j}]"
        base = f'[v{j}]'; k += 1
    vmap, vcodec = base, ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p']
subprocess.run(['ffmpeg', '-v', 'error', '-y', *args, '-filter_complex', f, '-map', vmap, '-map', '[a]', *vcodec, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest',
                os.path.join(ICI, f'le_pays_de_tous_jour{n}.mp4')], check=True)
print(f'le_pays_de_tous_jour{n}.mp4 :', ', '.join(f'{v} {k}' for k, v in compte.items()), '| ambiance :', amb or 'aucune')
