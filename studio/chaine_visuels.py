# python3 chaine_visuels.py → banniere_youtube.jpg (2560x1440) + logo_chaine.png (800x800)
# Fonds : rendus 3D t/b2_0.5.jpg (île de loin, 3400x1440) et t/b2_2.5.jpg (île vue du dessus)
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

FONT = 't/lilita.ttf'
BLANC, JAUNE, NOIR = (255, 255, 255), (255, 214, 64), (20, 20, 35)

# --- Bannière : zone visible partout = 1546x423 au centre (x 507-2053, y 508-931)
ile = ImageEnhance.Color(Image.open('t/b2_0.5.jpg').convert('RGB')).enhance(1.2)
ban = ile.crop((740, 0, 740 + 2560, 1440))
d = ImageDraw.Draw(ban)

def bloc(lignes, cx, ytop, gauche=True):
    y = ytop
    for parts, taille in lignes:
        f = ImageFont.truetype(FONT, taille)
        larg = sum(d.textlength(t, font=f) for t, _ in parts)
        x = cx - larg if gauche else cx
        for t, c in parts:
            d.text((x, y), t, font=f, fill=c, stroke_width=max(6, taille // 11), stroke_fill=NOIR)
            x += d.textlength(t, font=f)
        y += int(taille * 1.12)

bloc([([("LE PAYS", BLANC)], 132), ([("DE ", BLANC), ("TOUS", JAUNE)], 132), ([("1 ABONNÉ", JAUNE), (" = 1 HABITANT", BLANC)], 50)], 1450, 540, gauche=False)
ban.save('banniere_youtube.jpg', quality=92)

# --- Logo : île vue du dessus, recadrée en carré (YouTube l'affiche en rond)
dessus = ImageEnhance.Color(Image.open('t/b2_2.5.jpg').convert('RGB')).enhance(1.25)
logo = dessus.crop((1084, 21, 1084 + 1300, 21 + 1300)).resize((800, 800), Image.LANCZOS)
logo.save('logo_chaine.png')
