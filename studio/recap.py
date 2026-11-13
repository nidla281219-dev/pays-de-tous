"""Récapitulatif du jour en image : python3 studio/recap.py N
Lit jours/jourN/recap.json (+ image de fond « fond » = image --propre d'un beau plan) →
jours/jourN/recap_post.jpg (1080×1440, post Insta / photo TikTok) et recap_story.jpg (1080×1920, story).
Ne jamais nommer une plateforme ; pseudos sans @."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ICI = os.path.dirname(os.path.abspath(__file__)); n = sys.argv[1]; D = os.path.join(ICI, '..', 'jours', f'jour{n}')
R = json.load(open(os.path.join(D, 'recap.json')))
FT = os.path.join(ICI, 't', 'lilita.ttf')
if not os.path.exists(FT): FT = os.path.join(ICI, 'lilita.ttf')
JAUNE, BLANC, ENCRE, ORANGE, CARTE = (255, 214, 64), (255, 255, 255), (20, 20, 30), (226, 83, 29), (255, 250, 240)
def font(s): return ImageFont.truetype(FT, s)
def sans_emoji(t): return ''.join(ch for ch in t if ord(ch) < 0x2190 or 0x2460 <= ord(ch) < 0x2600 and False or ch in '·…–—’«»')
def fabrique(W, H, safe_top, safe_bot, sortie, ratio=.62):
    im = Image.new('RGB', (W, H)); d = ImageDraw.Draw(im)
    for y in range(H): t = y / H; d.line([(0, y), (W, y)], fill=(int(14 + 16 * t), int(64 + 40 * t), int(118 + 34 * t)))
    f = Image.open(os.path.join(D, R['fond'])).convert('RGB'); hf = int(W * ratio)
    r = max(W / f.width, hf / f.height); f = f.resize((int(f.width * r) + 1, int(f.height * r) + 1)); f = f.crop(((f.width - W) // 2, (f.height - hf) // 2, (f.width - W) // 2 + W, (f.height - hf) // 2 + hf))
    im.paste(f, (0, 0)); g = Image.new('L', (1, hf)); [g.putpixel((0, y), int(255 * max(0, (y - hf * .45) / (hf * .55)) ** 1.4)) for y in range(hf)]
    fond = Image.new('RGB', (W, hf), (14, 64, 118)); im.paste(fond, (0, 0), g.resize((W, hf)))
    d = ImageDraw.Draw(im); cx = 510 if W == 1080 else W // 2
    def centre(txt, y, size, fill, stroke=8, maxw=900):
        txt = sans_emoji(txt); ff = font(size)
        while d.textlength(txt, font=ff) > maxw and size > 20: size -= 2; ff = font(size)
        d.text((cx - d.textlength(txt, font=ff) / 2, y), txt, font=ff, fill=fill, stroke_width=stroke, stroke_fill=ENCRE); return size
    y = safe_top
    tf = font(40); t = 'LE JOURNAL DE VULKARIS'; w = d.textlength(t, font=tf)
    d.rounded_rectangle([cx - w / 2 - 28, y, cx + w / 2 + 28, y + 64], radius=32, fill=JAUNE); d.text((cx - w / 2, y + 10), t, font=tf, fill=ENCRE)
    centre(f"JOUR {R['jour']}", y + 80, 120, BLANC, 10)
    # chiffres
    y = int(hf * .78); cw = 280; gx = cx - (3 * cw + 2 * 20) // 2
    for i, (lab, val) in enumerate(R['chiffres'][:3]):
        x = gx + i * (cw + 20); d.rounded_rectangle([x, y, x + cw, y + 140], radius=26, fill=CARTE)
        lf = font(30); vv = sans_emoji(val).strip(); vf = font(64)
        while d.textlength(vv, font=vf) > cw - 30: vf = font(vf.size - 4)
        d.text((x + (cw - d.textlength(lab, font=lf)) / 2, y + 16), lab, font=lf, fill=(110, 98, 85)); d.text((x + (cw - d.textlength(vv, font=vf)) / 2, y + 54), vv, font=vf, fill=ENCRE)
    y += 170
    if R.get('tresor'):
        a, b, nom = R['tresor']; w = 3 * cw + 40
        d.text((gx, y), sans_emoji(f"Prochain chantier : {nom}"), font=font(36), fill=BLANC); s = f"{a:,} / {b:,}".replace(',', ' '); sf = font(36)
        d.text((gx + w - d.textlength(s, font=sf), y), s, font=sf, fill=JAUNE)
        d.rounded_rectangle([gx, y + 50, gx + w, y + 76], radius=13, fill=(255, 255, 255, 60)); d.rounded_rectangle([gx, y + 50, gx + max(26, w * min(1, a / b)), y + 76], radius=13, fill=JAUNE); y += 110
    def bloc(titre, lignes, couleur):
        nonlocal y
        if not lignes: return
        d.text((gx, y), titre, font=font(42), fill=couleur, stroke_width=5, stroke_fill=ENCRE); y += 56
        for l in lignes:
            l = sans_emoji(l); lf = font(36)
            while d.textlength('• ' + l, font=lf) > 3 * cw + 40: lf = font(lf.size - 2)
            d.text((gx + 6, y), '• ' + l, font=lf, fill=BLANC); y += 48
        y += 14
    bloc('HIER, VOUS AVEZ DÉCIDÉ', R.get('decisions'), JAUNE)
    bloc('CONSTRUIT POUR VOUS', R.get('construits'), JAUNE)
    if H > 1500: bloc('NOUVEAUX HABITANTS DES HAUTS', R.get('quartier'), JAUNE)
    # question
    qh = 70 + 50 * len(R.get('options', [])); yq = max(y + 10, H - safe_bot - qh - 20)
    d.rounded_rectangle([gx - 10, yq, gx + 3 * cw + 50, yq + qh], radius=30, fill=ORANGE)
    qf = font(44); q = sans_emoji(R['question'])
    while d.textlength(q, font=qf) > 3 * cw: qf = font(qf.size - 2)
    d.text((cx - d.textlength(q, font=qf) / 2, yq + 14), q, font=qf, fill=BLANC)
    for i, o in enumerate(R.get('options', [])): of = font(36); o = sans_emoji(o); d.text((cx - d.textlength(o, font=of) / 2, yq + 72 + i * 48), o, font=of, fill=BLANC)
    im.save(os.path.join(D, sortie), quality=92); print(sortie, 'bas du contenu', yq + qh)
fabrique(1080, 1440, 40, 40, 'recap_post.jpg')
fabrique(1080, 1920, 180, 320, 'recap_story.jpg', ratio=.70)
