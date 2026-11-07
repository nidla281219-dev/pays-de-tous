# python3 miniature.py fond.jpg sortie.jpg "ON CRÉE" "UN *PAYS*" "ENSEMBLE" ...
# Miniature 1080×1920 : lignes de texte énormes (blanc, *mot* en jaune), centrées dans la zone visible (x ≈ 510).
# Police : t/lilita.ttf (créée une fois depuis lilita.woff2 : pip install brotli fonttools, puis
#   python3 -c "from fontTools.ttLib import TTFont; f=TTFont('lilita.woff2'); f.flavor=None; f.save('t/lilita.ttf')")
import sys, re, os
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

src, out, lignes = sys.argv[1], sys.argv[2], sys.argv[3:] or ['ON CRÉE', 'UN *PAYS*', 'ENSEMBLE']
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 't', 'lilita.ttf')
im = ImageEnhance.Color(Image.open(src).convert('RGB')).enhance(1.25)
d = ImageDraw.Draw(im)
BLANC, JAUNE, NOIR = (255, 255, 255), (255, 214, 64), (20, 20, 35)
CX, MAXW = 510, 860
y = 560
for i, l in enumerate(lignes):
    parts = [(p[1:-1], JAUNE) if p.startswith('*') else (p, BLANC) for p in re.split(r'(\*[^*]+\*)', l) if p]
    taille = 190 if any(c == JAUNE for _, c in parts) else 150
    while True:
        f = ImageFont.truetype(FONT, taille); larg = sum(d.textlength(t, font=f) for t, _ in parts)
        if larg <= MAXW or taille < 60: break
        taille -= 6
    x = CX - larg / 2
    for t, c in parts:
        d.text((x, y), t, font=f, fill=c, stroke_width=max(8, taille // 11), stroke_fill=NOIR); x += d.textlength(t, font=f)
    y += int(taille * 1.08)
im.save(out, quality=92)
