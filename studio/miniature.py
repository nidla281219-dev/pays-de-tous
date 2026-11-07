# python3 miniature.py fond.jpg sortie.jpg  → miniature 1080x1920 (texte énorme blanc + jaune)
import sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

src, out = sys.argv[1], sys.argv[2]
FONT = sys.argv[3] if len(sys.argv) > 3 else 't/lilita.ttf'
im = ImageEnhance.Color(Image.open(src).convert('RGB')).enhance(1.25)
W, H = im.size
d = ImageDraw.Draw(im)

def ligne(parts, y, taille):
    f = ImageFont.truetype(FONT, taille)
    larg = sum(d.textlength(t, font=f) for t, _ in parts)
    x = (W - larg) / 2
    for t, c in parts:
        d.text((x, y), t, font=f, fill=c, stroke_width=max(8, taille // 11), stroke_fill=(20, 20, 35))
        x += d.textlength(t, font=f)

BLANC, JAUNE = (255, 255, 255), (255, 214, 64)
ligne([("ON CRÉE", BLANC)], 560, 150)
ligne([("UN ", BLANC), ("PAYS", JAUNE)], 720, 190)
ligne([("ENSEMBLE", BLANC)], 920, 150)
ligne([("A", (110, 180, 255)), (" OU ", BLANC), ("B", (255, 170, 60)), (" ?", BLANC)], 1110, 130)
im.save(out, quality=92)
