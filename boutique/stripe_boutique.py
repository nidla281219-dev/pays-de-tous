"""Crée (ou retrouve) dans Stripe les produits, prix et liens de paiement de la boutique « Les Hauts de Plavulca ».
Secret : STRIPE_KEY (clé restreinte : Products, Prices, Payment Links, Checkout Sessions). Relançable sans doublons.
python boutique/stripe_boutique.py  → boutique/stripe_liens.json  {cabane: url, petite: url, grande: url, villa: url}
"""
import os, json, sys, requests
K = os.environ['STRIPE_KEY']; API = 'https://api.stripe.com/v1'; ICI = os.path.dirname(os.path.abspath(__file__))
TAX = 'txcd_10000000'  # services fournis par voie électronique
MAISONS = [('cabane', 'Cabane', 199), ('petite', 'Petite maison', 299), ('grande', 'Grande maison', 499), ('villa', 'Villa', 799)]
OPTIONS = [('statue', 'Ta statue', 999), ('piscine', 'Piscine', 299), ('voiture', 'Voiture et garage', 199), ('fontaine', 'Fontaine', 199),
           ('feu', "Feu d'artifice dans la vidéo", 199), ('jardin', 'Jardin fleuri', 99), ('drapeau', 'Drapeau', 99),
           ('terrain_mer', 'Terrain bord de mer', 299), ('terrain_centre', 'Terrain cœur du quartier', 99)]

def req(m, path, **data):
    r = requests.request(m, API + path, auth=(K, ''), data=data if m == 'POST' else None, params=data if m == 'GET' else None, timeout=60)
    if not r.ok: raise RuntimeError(f'{m} {path} : {r.status_code} {r.text[:400]}')
    return r.json()

def prix(cle, nom, cents, desc):
    pid = 'vulk_' + cle
    try: req('GET', f'/products/{pid}')
    except RuntimeError: req('POST', '/products', id=pid, name=nom, description=desc, tax_code=TAX, **{'metadata[boutique]': 'hauts_de_plavulca'})
    lk = f'vulk_{cle}_{cents}'
    l = req('GET', '/prices', **{'lookup_keys[]': lk})['data']
    if l: return l[0]['id']
    return req('POST', '/prices', product=pid, unit_amount=cents, currency='eur', lookup_key=lk, tax_behavior='inclusive')['id']

opts = {c: prix(c, n, p, 'Option pour ta maison sur l\'île de Vulkaris (Le Pays de Tous).') for c, n, p in OPTIONS}
liens = {}
ancien = json.load(open(os.path.join(ICI, 'stripe_liens.json'))) if os.path.exists(os.path.join(ICI, 'stripe_liens.json')) else {}
for cle, nom, cents in MAISONS:
    pm = prix(cle, nom, cents, 'Ta maison sur l\'île de Vulkaris, modélisée en 3D à ton goût et montrée dans une vidéo du Pays de Tous.')
    if ancien.get(cle, {}).get('prix') == pm: liens[cle] = ancien[cle]; continue
    d = {'line_items[0][price]': pm, 'line_items[0][quantity]': 1, 'metadata[maison]': cle,
         'after_completion[type]': 'hosted_confirmation',
         'after_completion[hosted_confirmation][custom_message]': "Merci ! Ta maison sera construite et montrée dans une vidéo du Pays de Tous sous 7 jours. Bienvenue aux Hauts de Plavulca 🏡",
         'custom_fields[0][key]': 'pseudo', 'custom_fields[0][label][type]': 'custom', 'custom_fields[0][label][custom]': 'Ton pseudo (TikTok, Insta ou YouTube)', 'custom_fields[0][type]': 'text',
         'custom_fields[1][key]': 'boite', 'custom_fields[1][label][type]': 'custom', 'custom_fields[1][label][custom]': 'Nom sur la boîte aux lettres', 'custom_fields[1][type]': 'text', 'custom_fields[1][optional]': 'true',
         'custom_fields[2][key]': 'plaque', 'custom_fields[2][label][type]': 'custom', 'custom_fields[2][label][custom]': 'Texte de la plaque (si statue)', 'custom_fields[2][type]': 'text', 'custom_fields[2][optional]': 'true'}
    oi = dict(d)
    for i, (c, *_ ) in enumerate(OPTIONS):
        oi[f'optional_items[{i}][price]'] = opts[c]; oi[f'optional_items[{i}][quantity]'] = 1
    try: pl = req('POST', '/payment_links', **oi); avec = True
    except RuntimeError as e: print('  options facultatives refusées :', e); pl = req('POST', '/payment_links', **d); avec = False
    liens[cle] = {'url': pl['url'], 'id': pl['id'], 'prix': pm, 'options_facultatives': avec}
    print(nom, '→', pl['url'], '(options cochables)' if avec else '(SANS options)')
json.dump(liens, open(os.path.join(ICI, 'stripe_liens.json'), 'w'), indent=1)
