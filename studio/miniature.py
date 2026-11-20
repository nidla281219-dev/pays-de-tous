# python3 miniature.py fond.jpg sortie.jpg --style youtube|tiktok "JOUR 2" "*REGASTAN*" "EST NÉ !"
# Options putaclic : ~mot~ en ROUGE, --zoom x,y,f (gros plan sur le sujet), --cercle x,y,r, --fleche x1,y1,x2,y2 (vers le sujet)
# Miniature / couverture 1080×1920, texte énorme (blanc, *mot* en jaune), contour noir épais + bandeau sombre derrière.
#  youtube : texte dans le tiers haut-centre (y ≈ 330–900), lisible en petit dans les Shorts.
#  tiktok  : (aussi Instagram) texte centré dans le carré 3:4 du milieu (y 240–1680), car le profil TikTok/Insta coupe le haut et le bas ;
#            jamais sous y 1600 (description) ni à droite de x 960 (boutons).
# Police : t/lilita.ttf (créée une fois depuis lilita.woff2 : pip install brotli fonttools, puis
#   python3 -c "from fontTools.ttLib import TTFont; f=TTFont('lilita.woff2'); f.flavor=None; f.save('t/lilita.ttf')")
import sys, re, os
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

a = sys.argv[1:]
style = 'youtube'
if '--style' in a: i = a.index('--style'); style = a[i + 1]; del a[i:i + 2]
if '--y' in a: i = a.index('--y'); del a[i:i + 2]
def opt(nom):
    if nom in a: i = a.index(nom); v = [float(x) for x in a[i + 1].split(',')]; del a[i:i + 2]; return v
ZOOM, CERCLE, FLECHE = opt('--zoom'), opt('--cercle'), opt('--fleche')
src, out, lignes = a[0], a[1], a[2:] or ['ON CRÉE', 'UN *PAYS*', 'ENSEMBLE']
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 't', 'lilita.ttf')
im = ImageEnhance.Contrast(ImageEnhance.Color(Image.open(src).convert('RGB')).enhance(1.45)).enhance(1.15)
if ZOOM:  # --zoom x,y,f : gros plan centré sur (x,y) de l'image source, facteur f
    zx, zy, zf = ZOOM; W, Hs = im.size; w, h = W / zf, Hs / zf
    l = min(max(zx - w / 2, 0), W - w); t = min(max(zy - h / 2, 0), Hs - h)
    im = im.crop((int(l), int(t), int(l + w), int(t + h))).resize((W, Hs), Image.LANCZOS)
ROUGE = (235, 40, 40)
BLANC, JAUNE, NOIR = (255, 255, 255), (255, 214, 64), (15, 15, 30)
CX, MAXW = 510, 860
d0 = ImageDraw.Draw(im)
# mise en page : tailles puis hauteur totale
blocs = []
for l in lignes:
    parts = [(p[1:-1], JAUNE if p[0] == '*' else ROUGE) if p[0] in '*~' else (p, BLANC) for p in re.split(r'(\*[^*]+\*|~[^~]+~)', l) if p]
    taille = 200 if any(c != BLANC for _, c in parts) else 150
    while True:
        f = ImageFont.truetype(FONT, taille); larg = sum(d0.textlength(t, font=f) for t, _ in parts)
        if larg <= MAXW or taille < 60: break
        taille -= 6
    blocs.append((parts, f, taille, larg))
H = sum(int(t * 1.05) for _, _, t, _ in blocs)
y0 = 330 if style == 'youtube' else int(960 - H / 2 - 40)
if '--y' in sys.argv: y0 = int(sys.argv[sys.argv.index('--y') + 1])
# bandeau sombre flou derrière le texte (lisibilité sur n'importe quel décor)
ov = Image.new('L', im.size, 0); dv = ImageDraw.Draw(ov)
dv.rounded_rectangle((CX - MAXW / 2 - 40, y0 - 40, CX + MAXW / 2 + 40, y0 + H + 60), radius=60, fill=150)
ov = ov.filter(ImageFilter.GaussianBlur(40))
im = Image.composite(Image.new('RGB', im.size, (10, 15, 30)), im, ov)
d = ImageDraw.Draw(im)
y = y0
for parts, f, taille, larg in blocs:
    x = CX - larg / 2
    for t, c in parts:
        d.text((x + 6, y + 8), t, font=f, fill=(0, 0, 0), stroke_width=max(9, taille // 10), stroke_fill=(0, 0, 0))  # ombre
        d.text((x, y), t, font=f, fill=c, stroke_width=max(9, taille // 10), stroke_fill=NOIR); x += d.textlength(t, font=f)
    y += int(taille * 1.05)
# cercle rouge / flèche rouge (style « putaclic ») : coordonnées dans l'image finale 1080×1920
def trait(x1, y1, x2, y2, w):
    d.line((x1, y1, x2, y2), fill=(255, 255, 255), width=w + 14); d.line((x1, y1, x2, y2), fill=ROUGE, width=w)
if CERCLE:
    cx, cy, r = CERCLE
    for k, (c, w) in enumerate([((255, 255, 255), 30), (ROUGE, 18)]): d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=c, width=w)
if FLECHE:
    import math
    x1, y1, x2, y2 = FLECHE; ang = math.atan2(y2 - y1, x2 - x1); L = 90
    trait(x1, y1, x2, y2, 26)
    for s_ in (2.6, -2.6): trait(x2, y2, x2 + L * math.cos(ang + s_), y2 + L * math.sin(ang + s_), 26)
im.save(out, quality=93)
