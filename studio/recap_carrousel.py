"""Récap du jour en CARROUSEL visuel : python3 studio/recap_carrousel.py N
Lit jours/jourN/recap.json → "slides": [{img, haut, titre, jaune?, sous?, badge?, liste?, tresor?}] (images = rendus --propre copiés dans jours/jourN/)
→ jours/jourN/carrousel/01.jpg … (1080×1440). Une image plein cadre par diapo, peu de texte, gros."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
ICI = os.path.dirname(os.path.abspath(__file__)); n = sys.argv[1]; D = os.path.join(ICI, '..', 'jours', f'jour{n}')
R = json.load(open(os.path.join(D, 'recap.json'))); S = R['slides'] + ([dict(R['fin'], fin=True)] if R.get('fin') else []); O = os.path.join(D, 'carrousel'); os.makedirs(O, exist_ok=True)
FT = os.path.join(ICI, 't', 'lilita.ttf')
W, H = 1080, 1440; JAUNE, BLANC, ENCRE, ORANGE = (255, 214, 64), (255, 255, 255), (20, 20, 30), (226, 83, 29)
font = lambda s: ImageFont.truetype(FT, s)
def degrade(h, haut=True):
    g = Image.new('L', (1, h)); [g.putpixel((0, y), int(215 * ((1 - y / h) if haut else (y / h)) ** 1.6)) for y in range(h)]; return g.resize((W, h))
for i, s in enumerate(S, 1):
    f = Image.open(os.path.join(D, s['img'])).convert('RGB'); r = max(W / f.width, H / f.height); f = f.resize((int(f.width * r) + 1, int(f.height * r) + 1))
    oy = int((f.height - H) * s.get('cadre', .45)); im = f.crop(((f.width - W) // 2, oy, (f.width - W) // 2 + W, oy + H))
    im = ImageEnhance.Color(im).enhance(1.18); im = ImageEnhance.Contrast(im).enhance(1.08)
    flou = im.filter(ImageFilter.GaussianBlur(9 if not s.get('fin') else 22)); m = Image.new('L', (1, H))
    for y in range(H): u = abs(y - H * .56) / (H * .5); m.putpixel((0, y), 255 if s.get('fin') else int(255 * max(0, min(1, (u - .45) / .45)) ** 1.3))
    im = Image.composite(flou, im, m.resize((W, H)))
    vig = Image.new('L', (W, H), 0); ImageDraw.Draw(vig).ellipse([-W * .25, -H * .2, W * 1.25, H * 1.2], fill=255); vig = vig.filter(ImageFilter.GaussianBlur(160))
    im = Image.composite(im, ImageEnhance.Brightness(im).enhance(.55), vig)
    noir = Image.new('RGB', (W, 520), (8, 16, 30)); im.paste(noir, (0, 0), degrade(520, True)); im.paste(Image.new('RGB', (W, 560), (8, 16, 30)), (0, H - 560), degrade(560, False))
    d = ImageDraw.Draw(im)
    def centre(t, y, size, fill, stroke=9, maxw=960):
        ff = font(size)
        while d.textlength(t, font=ff) > maxw and size > 24: size -= 3; ff = font(size)
        d.text(((W - d.textlength(t, font=ff)) / 2, y), t, font=ff, fill=fill, stroke_width=stroke, stroke_fill=ENCRE); return ff.size
    pf = font(30); pg = f'{i}/{len(S)}'; d.text((W - 50 - d.textlength(pg, font=pf), 40), pg, font=pf, fill=BLANC)
    tf = font(40); t = s.get('haut', '') or f"JOUR {R.get('jour', '')}"; w = d.textlength(t, font=tf)
    d.rounded_rectangle([(W - w) / 2 - 26, 70, (W + w) / 2 + 26, 132], radius=31, fill=JAUNE); d.text(((W - w) / 2, 79), t, font=tf, fill=ENCRE)
    y = 150; sz = centre(s['titre'], y, 150 if len(s['titre']) <= 8 else 110, BLANC, 11)
    if s.get('jaune'): centre(s['jaune'], y + sz + 6, 120 if len(s['jaune']) <= 10 else 96, JAUNE, 11)
    if s.get('fin'):
        cx, cy, R0 = W // 2, H // 2 - 40, 120; d.ellipse([cx - R0, cy - R0, cx + R0, cy + R0], fill=(226, 83, 29), outline=BLANC, width=10); d.polygon([(cx - 38, cy - 60), (cx - 38, cy + 60), (cx + 66, cy)], fill=BLANC)
    yb = H - 70
    if s.get('texte'):
        tf2 = font(40); mots = s['texte'].split(); lignes, l = [], ''
        for m_ in mots:
            if d.textlength((l + ' ' + m_).strip(), font=tf2) > 860: lignes.append(l); l = m_
            else: l = (l + ' ' + m_).strip()
        lignes.append(l); hcarte = 34 + 52 * len(lignes)
        yt = (H - 70 - (84 if s.get('sous') else 0) - (130 if s.get('badge') else 0) - (120 if s.get('tresor') else 0) - 100 * len(s.get('liste', [])) - hcarte - 20) if not s.get('fin') else H // 2 + 130
        carte = Image.new('RGBA', (920, hcarte), (8, 16, 30, 165)); mk = Image.new('L', (920, hcarte), 0); ImageDraw.Draw(mk).rounded_rectangle([0, 0, 919, hcarte - 1], radius=28, fill=165)
        im.paste(carte.convert('RGB'), (80, yt), mk); d = ImageDraw.Draw(im)
        for k, li in enumerate(lignes): d.text(((W - d.textlength(li, font=tf2)) / 2, yt + 18 + k * 52), li, font=tf2, fill=BLANC)
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
