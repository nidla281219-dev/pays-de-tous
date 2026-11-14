"""Clips « vitrine » des maisons achetées, prêts à insérer dans la vidéo (inserts de mix.py).
python3 studio/vitrines.py N pseudo1 [pseudo2 …]   (commandes lues dans boutique/ventes.json)
→ jours/jourN/maison_<pseudo>.mp4 (1080×1920, ~6–8 s) : orbite DEVANT la maison + gros plan panneau (+ statue), carte « ⭐ MERCI pseudo », description de la commande, feu d'artifice si acheté.
Même code 3D que l'aperçu du site → la maison est exactement celle commandée. Regarder 2 images par clip avant de l'utiliser."""
import json, os, sys, subprocess, shutil, math, random, re
from PIL import Image, ImageDraw, ImageFont
ICI = os.path.dirname(os.path.abspath(__file__)); N = sys.argv[1]; D = os.path.join(ICI, '..', 'jours', f'jour{N}'); os.makedirs(D, exist_ok=True)
V = {v['pseudo']: v for v in json.load(open(os.path.join(ICI, '..', 'boutique', 'ventes.json')))['ventes'] if v.get('pseudo')}
FT = os.path.join(ICI, 't', 'lilita.ttf'); font = lambda s: ImageFont.truetype(FT, s)
NOMS = {'cabane': 'Cabane', 'petite': 'Petite maison', 'grande': 'Grande maison', 'villa': 'Villa'}
STY = {'classique': 'classique', 'chalet': 'chalet', 'moderne': 'moderne', 'med': 'méditerranéenne'}
OPT = {'piscine': 'piscine', 'jardin': 'jardin fleuri', 'voiture': 'garage', 'fontaine': 'fontaine', 'drapeau': 'drapeau', 'feu': "feu d'artifice"}
MAT = {'or': 'en or', 'bronze': 'en bronze', 'marbre': 'en marbre', 'pierre': 'en pierre'}
for pseudo in sys.argv[2:]:
    v = V[pseudo]; c = v['choix'].split('-'); tmp = os.path.join(ICI, 't', 'vit_' + re.sub(r'\W', '_', pseudo)); shutil.rmtree(tmp, ignore_errors=True)
    r = subprocess.run(['node', os.path.join(ICI, 'vitrine_maison.js'), tmp, json.dumps({'choix': v['choix'], 'panneau': v.get('panneau') or pseudo, 'plaque': v.get('plaque') or ''})], capture_output=True, text=True, cwd=ICI)
    if r.returncode: sys.exit(r.stderr[-800:])
    opts = [OPT[o] for o in (c[7].split('_') if c[7] != 'x' else []) if o in OPT]; st = c[8].split('_') if len(c) > 8 and c[8] != 'x' else None
    desc = f"{NOMS.get(c[1], c[1])} {STY.get(c[2], '')}".strip(); details = opts + ([f"statue {MAT.get(st[2], '')}".strip()] if st else [])
    feu = 'feu' in (c[7].split('_') if c[7] != 'x' else []); rnd = random.Random(pseudo)
    bursts = [(rnd.uniform(.1, 2.6), rnd.uniform(180, 900), rnd.uniform(420, 820), rnd.choice([(255, 214, 64), (255, 90, 90), (120, 200, 255), (180, 255, 140), (255, 140, 220)])) for _ in range(9)] if feu else []
    imgs = sorted(os.listdir(tmp)); out = os.path.join(tmp, 'o'); os.makedirs(out)
    for i, f in enumerate(imgs):
        t = i / 30; im = Image.open(os.path.join(tmp, f)).convert('RGB')
        g = Image.new('L', (1, 1920)); [g.putpixel((0, y), int(150 * max(0, (1 - y / 520)) ** 1.5 + 170 * max(0, (y - 1240) / 680) ** 1.4)) for y in range(1920)]
        im.paste(Image.new('RGB', (1080, 1920), (8, 16, 30)), (0, 0), g.resize((1080, 1920))); d = ImageDraw.Draw(im, 'RGBA')
        for (t0, x, y, col) in bursts:
            k = (t - t0) / 1.1
            if 0 <= k <= 1:
                for j in range(26):
                    a = j / 26 * 2 * math.pi; rr = 30 + 260 * (1 - (1 - k) ** 2); px, py = x + math.cos(a) * rr, y + math.sin(a) * rr + 80 * k * k
                    s = 9 * (1 - k) + 2; d.ellipse([px - s, py - s, px + s, py + s], fill=col + (int(255 * (1 - k)),))
        a = min(1, t / .35); y0 = 150 + (1 - a) * -40
        tf = font(56); txt = '⭐ MERCI'.replace('⭐ ', ''); w = d.textlength(txt, font=tf)
        d.rounded_rectangle([510 - w / 2 - 70, y0, 510 + w / 2 + 34, y0 + 84], radius=42, fill=(255, 214, 64, int(255 * a)))
        d.text((510 - w / 2 - 8, y0 + 12), txt, font=tf, fill=(29, 27, 24, int(255 * a))); d.regular_polygon((510 - w / 2 - 38, y0 + 42, 20), 5, fill=(226, 83, 29, int(255 * a)))
        pf = font(96); ps = pseudo
        while d.textlength(ps, font=pf) > 860: pf = font(pf.size - 4)
        d.text((510 - d.textlength(ps, font=pf) / 2, y0 + 104), ps, font=pf, fill=(255, 255, 255, int(255 * a)), stroke_width=10, stroke_fill=(20, 20, 30, int(255 * a)))
        b = min(1, max(0, (t - .4) / .35)); yb = 1330 + (1 - b) * 40
        lignes_d = [details[i:i + 3] for i in range(0, len(details), 3)] or [[f"parcelle {c[0][1:]}"]]
        for k, (txt, sz, col) in enumerate([(desc, 62, (255, 255, 255))] + [(' · '.join(l), 46, (255, 214, 64)) for l in lignes_d]):
            ff = font(sz)
            while d.textlength(txt, font=ff) > 840: ff = font(ff.size - 2)
            d.text((510 - d.textlength(txt, font=ff) / 2, yb + k * 74), txt, font=ff, fill=col + (int(255 * b),), stroke_width=8, stroke_fill=(20, 20, 30, int(255 * b)))
        im.save(os.path.join(out, f'{i:04d}.jpg'), quality=92)
    dst = os.path.join(D, 'maison_' + re.sub(r'[^\w.-]', '_', pseudo) + '.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '30', '-i', os.path.join(out, '%04d.jpg'), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', dst], check=True)
    print(pseudo, '→', dst, f'{len(imgs) / 30:.1f} s')
