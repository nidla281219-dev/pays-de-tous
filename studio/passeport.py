"""Passeport de Fondateur (avantage promis aux acheteurs) : python3 studio/passeport.py [pseudo …]  (sans argument : tous les acheteurs)
→ boutique/passeports/<pseudo>.jpg (1080×1350, à envoyer à l'acheteur / à partager en story). Numéro = ordre d'achat (boutique/ventes.json).
Exemple neutre : python3 studio/passeport.py --exemple N  → boutique/passeports/exemple.jpg"""
import json, os, sys, subprocess, re
from PIL import Image, ImageDraw, ImageFont
ICI = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(ICI, '..', 'boutique'); O = os.path.join(B, 'passeports'); os.makedirs(O, exist_ok=True)
FT = os.path.join(ICI, 't', 'lilita.ttf'); font = lambda s: ImageFont.truetype(FT, s)
V = sorted([v for v in json.load(open(os.path.join(B, 'ventes.json')))['ventes'] if v.get('pseudo')], key=lambda v: (v['date'][3:5], v['date'][:2], v['date'][6:]))
NOMS = {'cabane': 'Cabane', 'petite': 'Petite maison', 'grande': 'Grande maison', 'villa': 'Villa'}
ZONE = lambda n: 'lisière de la forêt' if n <= 16 else ('cœur du quartier' if n <= 32 else 'bord de mer')
OR, OR2, NUIT, BLANC = (242, 193, 78), (184, 134, 43), (12, 30, 54), (255, 255, 255)
def photo(v):
    tmp = os.path.join(ICI, 't', 'pass_' + re.sub(r'\W', '_', v['pseudo']))
    subprocess.run(['node', os.path.join(ICI, 'vitrine_maison.js'), tmp, json.dumps({'choix': v['choix'], 'panneau': v.get('panneau') or v['pseudo'], 'plaque': v.get('plaque') or ''})], check=True, cwd=ICI, env={**os.environ, 'PHOTO': '1'}, capture_output=True)
    return Image.open(os.path.join(tmp, 'photo.jpg')).convert('RGB')
def carte(pseudo, num, v, sortie, ligne=None):
    W, H = 1080, 1350; im = Image.new('RGB', (W, H), NUIT); d = ImageDraw.Draw(im)
    for y in range(H): t = y / H; d.line([(0, y), (W, y)], fill=(int(12 + 10 * t), int(30 + 26 * t), int(54 + 40 * t)))
    d.rounded_rectangle([28, 28, W - 28, H - 28], radius=56, outline=OR, width=8); d.rounded_rectangle([48, 48, W - 48, H - 48], radius=42, outline=OR2, width=2)
    def c(t, y, s, col, st=0):
        f = font(s)
        while d.textlength(t, font=f) > 900: f = font(f.size - 3)
        d.text(((W - d.textlength(t, font=f)) / 2, y), t, font=f, fill=col, stroke_width=st, stroke_fill=(6, 14, 28)); return f.size
    c('ÎLE DE VULKARIS', 84, 40, OR); c('PASSEPORT DE FONDATEUR', 134, 76, BLANC)
    ph = photo(v).resize((760, 760)).crop((0, 110, 760, 650)); m = Image.new('L', ph.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, ph.width - 1, ph.height - 1], radius=36, fill=255)
    im.paste(ph, (160, 250), m); d.rounded_rectangle([156, 246, 160 + 764, 250 + 544], radius=38, outline=OR, width=6)
    d.ellipse([W - 300, 700, W - 110, 890], fill=OR, outline=NUIT, width=6); f1 = font(34); t = 'N°'; d.text((W - 205 - d.textlength(t, font=f1) / 2, 718), t, font=f1, fill=NUIT)
    f2 = font(96 if num < 100 else 70); t = str(num); d.text((W - 205 - d.textlength(t, font=f2) / 2, 752 if num < 100 else 768), t, font=f2, fill=NUIT)
    c(pseudo, 900, 110, OR, 6); c('FONDATEUR DE VULKARIS', 1030, 50, BLANC)
    k = v['choix'].split('-'); lot = int(k[0][1:]); c(ligne or f"{NOMS.get(k[1], k[1])} · parcelle {lot} · {ZONE(lot)}", 1110, 40, (200, 214, 232))
    c('lepaysdetous.github.io', 1226, 34, OR)
    im.save(sortie, quality=93); print(sortie)
a = sys.argv[1:]
if a and a[0] == '--exemple':
    v = dict(next(x for x in V if x['pseudo'] == 'Hidroway'), panneau='Ton nom ici', plaque='Ton nom ici'); carte('TON PSEUDO', int(a[1]), v, os.path.join(O, 'exemple.jpg'), 'Ta maison · ta parcelle')
else:
    for i, v in enumerate(V, 1):
        if not a or v['pseudo'] in a: carte(v['pseudo'], i, v, os.path.join(O, re.sub(r'[^\w.-]', '_', v['pseudo']) + '.jpg'))
