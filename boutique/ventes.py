"""Tableau des ventes de la boutique (Stripe Checkout Sessions des liens de paiement) → boutique/VENTES.md + ventes.json
Paniers ouverts (clic sur Acheter → page Stripe), payés, abandonnés, chiffre d'affaires, détail des maisons vendues (pseudo, parcelle, options).
"""
import os, json, datetime, requests
K = os.environ['STRIPE_KEY'].strip(); ICI = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(os.path.join(ICI, 'stripe_liens.json'))); pl = {v['id']: k for k, v in L.items()}
ses, apres = [], None
while True:
    p = {'limit': 100, 'expand[]': 'data.line_items'}
    if apres: p['starting_after'] = apres
    d = requests.get('https://api.stripe.com/v1/checkout/sessions', auth=(K, ''), params=p, timeout=60).json()
    ses += [s for s in d.get('data', []) if s.get('payment_link') in pl or (s.get('metadata') or {}).get('maison')]
    if not d.get('has_more'): break
    apres = d['data'][-1]['id']
paye = [s for s in ses if s['payment_status'] == 'paid']
ca = sum(s['amount_total'] for s in paye) / 100
champs = lambda s: {**{c['key']: (c.get('text') or c.get('dropdown') or {}).get('value') for c in s.get('custom_fields', [])}, **{k: v for k, v in (s.get('metadata') or {}).items() if k in ('panneau', 'plaque')}}
ventes = [{'date': datetime.datetime.fromtimestamp(s['created']).strftime('%d.%m %H:%M'), 'maison': pl.get(s.get('payment_link')) or s['metadata'].get('maison'), 'parcelle': (s.get('metadata') or {}).get('parcelle'), 'email': ((s.get('customer_details') or {}).get('email') or '')[:3] + '…', 'total': s['amount_total'] / 100,
           'choix': s.get('client_reference_id'), **champs(s), 'articles': [i['description'] for i in (s.get('line_items') or {}).get('data', [])]} for s in paye]
json.dump({'paniers': len(ses), 'payes': len(paye), 'ca_eur': ca, 'ventes': ventes}, open(os.path.join(ICI, 'ventes.json'), 'w'), ensure_ascii=False, indent=1)
md = [f'# Ventes — Les Hauts de Plavulca (mis à jour {datetime.datetime.now():%d.%m.%Y %H:%M} UTC)', '',
      f'- Paniers ouverts (page de paiement affichée) : **{len(ses)}**', f'- Payés : **{len(paye)}** · abandonnés ou en cours : {len(ses) - len(paye)}',
      f'- Chiffre d\'affaires : **{ca:.2f} €** (avant frais Stripe)', f"- Acheteurs d'accord pour les e-mails (sortie du jeu) : **{sum(1 for v in ventes if v.get('nouvelles') == 'oui')}** (adresses uniquement dans Stripe)", '', '| Date | Maison | Total | Pseudo | Choix (parcelle…) | Articles |', '|---|---|---|---|---|---|']
md += [f"| {v['date']} | {v['maison']} | {v['total']:.2f} € | {v.get('pseudo') or ''} | {v.get('choix') or ''} | {', '.join(v['articles'])} |" for v in ventes]
open(os.path.join(ICI, 'VENTES.md'), 'w').write('\n'.join(md) + '\n'); print('\n'.join(md))
