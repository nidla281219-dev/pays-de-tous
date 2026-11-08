# python3 miniature.py fond.jpg sortie.jpg --style youtube|tiktok "JOUR 2" "*REGASTAN*" "EST NÉ !"
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
src, out, lignes = a[0], a[1], a[2:] or ['ON CRÉE', 'UN *PAYS*', 'ENSEMBLE']
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 't', 'lilita.ttf')
im = ImageEnhance.Contrast(ImageEnhance.Color(Image.open(src).convert('RGB')).enhance(1.3)).enhance(1.08)
BLANC, JAUNE, NOIR = (255, 255, 255), (255, 214, 64), (15, 15, 30)
CX, MAXW = 510, 860
d0 = ImageDraw.Draw(im)
# mise en page : tailles puis hauteur totale
blocs = []
for l in lignes:
    parts = [(p[1:-1], JAUNE) if p.startswith('*') else (p, BLANC) for p in re.split(r'(\*[^*]+\*)', l) if p]
    taille = 200 if any(c == JAUNE for _, c in parts) else 150
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
im.save(out, quality=93)
