"""Résumé court des votes du jour N (3 réseaux additionnés) — à lire AU LIEU des gros fichiers commentaires_*.json.
python3 studio/compter.py N [--opt "A=stade|foot" "B=karting|kart"] [--top 25]
Affiche : abonnés + likes + vues par réseau et total ; votes par option (1 voix par personne et par réseau, likes additionnés) ;
propositions répétées (même texte court chez plusieurs personnes) ; les commentaires les plus likés de tous les réseaux.
"""
import json, os, re, sys, unicodedata
from collections import defaultdict

ICI = os.path.dirname(os.path.abspath(__file__))
a = sys.argv[1:]
n = a[0]
top = int(a[a.index('--top') + 1]) if '--top' in a else 25
opts = []
if '--opt' in a:
    for x in a[a.index('--opt') + 1:]:
        if x.startswith('--'): break
        k, v = x.split('=', 1); opts.append((k, re.compile(v, re.I)))

def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]+', ' ', s).split()

D = os.path.join(ICI, '..', 'jours', f'jour{n}')
res = {}
for r, f in [('YT', 'youtube'), ('TT', 'tiktok'), ('IG', 'instagram')]:
    p = os.path.join(D, f'commentaires_{f}.json')
    if os.path.exists(p): res[r] = json.load(open(p))
autres = os.path.join(D, 'commentaires_autres.txt')

tot = defaultdict(int)
print(f'== JOUR {n} : chiffres ==')
for r, d in res.items():
    v = d.get('videos') or [{}]; v0 = v[0] if v else {}
    nb = sum(len(x.get('commentaires', [])) for x in v)
    print(f"{r}: {d.get('abonnes', 0)} abonnés · {v0.get('likes', 0)} likes · {v0.get('vues', 0)} vues · {nb} commentaires lus · lu {d.get('lu_le', '?')}")
    tot['abonnes'] += int(d.get('abonnes', 0) or 0); tot['likes'] += int(v0.get('likes', 0) or 0); tot['vues'] += int(v0.get('vues', 0) or 0)
print(f"TOTAL: {tot['abonnes']} habitants · {tot['likes']} likes (= pièces) · {tot['vues']} vues")
manque = [r for r in ('YT', 'TT', 'IG') if r not in res]
if manque: print('MANQUE :', manque)
if os.path.exists(autres): print('+ commentaires_autres.txt présent (à lire)')

MOI = {'@lepaysdetous', '@le.pays.de.tous', '@LePaysdeTous', '@lepaysdetous-v4s'}
coms = [(r, c) for r, d in res.items() for v in d.get('videos', []) for c in v.get('commentaires', []) if c['auteur'] not in MOI and 'paysdetous' not in c['auteur'].lower().replace('.', '').replace('-', '')]

if opts:
    print('\n== VOTES (1 voix par personne et par réseau) ==')
    for k, rx in opts:
        gens = {}
        for r, c in coms:
            if rx.search(c['texte']) and not any(rx2.search(c['texte']) for k2, rx2 in opts if k2 != k):
                gens[(r, c['auteur'])] = max(gens.get((r, c['auteur']), 0), c['likes'])
        par = defaultdict(int)
        for (r, _), _l in gens.items(): par[r] += 1
        print(f"{k}: {len(gens)} voix ({', '.join(f'{r} {x}' for r, x in par.items())}) · {sum(gens.values())} likes")

print('\n== PROPOSITIONS RÉPÉTÉES (textes courts identiques, nb de personnes) ==')
grp = defaultdict(lambda: [set(), 0, ''])
for r, c in coms:
    m = norm(c['texte'])
    if 1 <= len(m) <= 4:
        g = grp[' '.join(m)]; g[0].add((r, c['auteur'])); g[1] += c['likes']; g[2] = g[2] or c['texte'][:40]
for k, (p, l, t) in sorted(grp.items(), key=lambda x: (-len(x[1][0]), -x[1][1]))[:15]:
    if len(p) >= 2: print(f'{len(p)} pers. · {l} likes · « {t} »')

print(f'\n== TOP {top} COMMENTAIRES (tous réseaux) ==')
for r, c in sorted(coms, key=lambda x: -x[1]['likes'])[:top]:
    t = ' '.join(c['texte'].split())
    print(f"❤{c['likes']} [{r}] {c['auteur']} : {t[:160]}")
