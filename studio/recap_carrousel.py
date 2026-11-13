"""Récap du jour en CARROUSEL visuel : python3 studio/recap_carrousel.py N
Lit jours/jourN/recap.json → "slides": [{img, haut, titre, jaune?, sous?, badge?, liste?, tresor?}] (images = rendus --propre copiés dans jours/jourN/)
→ jours/jourN/carrousel/01.jpg … (1080×1440). Une image plein cadre par diapo, peu de texte, gros."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
ICI = os.path.dirname(os.path.abspath(__file__)); n = sys.argv[1]; D = os.path.join(ICI, '..', 'jours', f'jour{n}')
R = json.load(open(os.path.join(D, 'recap.json'))); S = R['slides']; O = os.path.join(D, 'carrousel'); os.makedirs(O, exist_ok=True)
FT = os.path.join(ICI, 't', 'lilita.ttf')
W, H = 1080, 1440; JAUNE, BLANC, ENCRE, ORANGE = (255, 214, 64), (255, 255, 255), (20, 20, 30), (226, 83, 29)
font = lambda s: ImageFont.truetype(FT, s)
def degrade(h, haut=True):
    g = Image.new('L', (1, h)); [g.putpixel((0, y), int(215 * ((1 - y / h) if haut else (y / h)) ** 1.6)) for y in range(h)]; return g.resize((W, h))
for i, s in enumerate(S, 1):
    f = Image.open(os.path.join(D, s['img'])).convert('RGB'); r = max(W / f.width, H / f.height); f = f.resize((int(f.width * r) + 1, int(f.height * r) + 1))
    oy = int((f.height - H) * s.get('cadre', .45)); im = f.crop(((f.width - W) // 2, oy, (f.width - W) // 2 + W, oy + H))
    noir = Image.new('RGB', (W, 520), (8, 16, 30)); im.paste(noir, (0, 0), degrade(520, True)); im.paste(Image.new('RGB', (W, 560), (8, 16, 30)), (0, H - 560), degrade(560, False))
    d = ImageDraw.Draw(im)
    def centre(t, y, size, fill, stroke=9, maxw=960):
        ff = font(size)
        while d.textlength(t, font=ff) > maxw and size > 24: size -= 3; ff = font(size)
        d.text(((W - d.textlength(t, font=ff)) / 2, y), t, font=ff, fill=fill, stroke_width=stroke, stroke_fill=ENCRE); return ff.size
    pf = font(30); pg = f'{i}/{len(S)}'; d.text((W - 50 - d.textlength(pg, font=pf), 40), pg, font=pf, fill=BLANC)
    tf = font(40); t = s.get('haut', ''); w = d.textlength(t, font=tf)
    d.rounded_rectangle([(W - w) / 2 - 26, 70, (W + w) / 2 + 26, 132], radius=31, fill=JAUNE); d.text(((W - w) / 2, 79), t, font=tf, fill=ENCRE)
    y = 150; sz = centre(s['titre'], y, 150 if len(s['titre']) <= 8 else 110, BLANC, 11)
    if s.get('jaune'): centre(s['jaune'], y + sz + 6, 120 if len(s['jaune']) <= 10 else 96, JAUNE, 11)
    yb = H - 70
    if s.get('sous'): centre(s['sous'], yb - 64, 50, BLANC, 7); yb -= 84
    if s.get('badge'):
        bf = font(64); w = d.textlength(s['badge'], font=bf); d.rounded_rectangle([(W - w) / 2 - 40, yb - 112, (W + w) / 2 + 40, yb - 12], radius=50, fill=ORANGE); d.text(((W - w) / 2, yb - 100), s['badge'], font=bf, fill=BLANC); yb -= 130
    if s.get('tresor') and R.get('tresor'):
        a, b, nom = R['tresor']; x0, x1 = 90, W - 90
        d.rounded_rectangle([x0, yb - 34, x1, yb], radius=17, fill=(255, 255, 255)); d.rounded_rectangle([x0, yb - 34, x0 + max(34, (x1 - x0) * min(1, a / b)), yb], radius=17, fill=JAUNE)
        t = f"Trésor {a:,} / {b:,} pièces → {nom} · 1 like = 1 pièce".replace(',', ' '); centre(t, yb - 92, 42, BLANC, 6); yb -= 120
    for k, l in enumerate(reversed(s.get('liste', []))):
        lf = font(56); w = d.textlength(l, font=lf); y0 = yb - 86 - k * 100
        d.rounded_rectangle([(W - w) / 2 - 34, y0, (W + w) / 2 + 34, y0 + 84], radius=42, fill=ORANGE if k == len(s['liste']) - 1 - 0 and False else (226, 83, 29)); d.text(((W - w) / 2, y0 + 10), l, font=lf, fill=BLANC)
    im.save(os.path.join(O, f'{i:02d}.jpg'), quality=92)
print(len(S), 'diapos →', O)
