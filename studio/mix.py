"""Son du jour N : voix + musique + un whoosh à chaque changement de plan + un « pop » à chaque carte (lus dans la timeline).
python mix.py N   (dans studio/, après node render.js --jour N pays_jN_video.mp4) → le_pays_de_tous_jourN.mp4
"""
import os, sys, json, subprocess
n = sys.argv[1]; ICI = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(ICI, '..', 'jours', f'jour{n}'); S = os.path.join(ICI, '..', 'sons')
TL = json.load(open(os.path.join(D, 'timeline.json'))); dur = TL['dur']
whoosh = [s['t'] for s in TL['shots'] if s['t'] > 0.5]
pops = [c['t0'] for c in TL.get('cards', []) if c['kind'] != 'fin'] + TL.get('pops', [])
args = ['-i', os.path.join(ICI, f'pays_j{n}_video.mp4'), '-i', os.path.join(D, 'voix.mp3'), '-i', os.path.join(S, 'musique_epic_score.mp3')]
f = f"[1:a]apad[vo];[2:a]volume=0.13,afade=t=in:d=1.5,afade=t=out:st={dur-2.1:.2f}:d=2[mu]"; mix = '[vo][mu]'; k = 3
for t, fich, vol in [(t, 'swipe_whoosh_b7ae.wav', .35) for t in whoosh] + [(t, 'pop_01_b715.wav', .5) for t in pops]:
    ms = int(max(0, t - (.15 if 'whoosh' in fich else 0)) * 1000)
    args += ['-i', os.path.join(S, fich)]; f += f";[{k}:a]volume={vol},adelay={ms}|{ms}[s{k}]"; mix += f'[s{k}]'; k += 1
f += f";{mix}amix=inputs={k-1}:normalize=0:duration=first,atrim=0:{dur+.3:.2f},loudnorm=I=-14:TP=-1.5[a]"
subprocess.run(['ffmpeg', '-v', 'error', '-y', *args, '-filter_complex', f, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest',
                os.path.join(ICI, f'le_pays_de_tous_jour{n}.mp4')], check=True)
print(f'le_pays_de_tous_jour{n}.mp4 : {len(whoosh)} whooshs, {len(pops)} pops')
