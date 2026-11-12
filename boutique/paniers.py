"""Détail des paniers (sessions de paiement) : payés, abandonnés, et tentatives de paiement refusées. Affiche sans e-mail ni donnée de carte."""
import os, json, datetime, requests
K = os.environ['STRIPE_KEY'].strip(); A = (K, '')
ses, apres = [], None
while True:
    p = {'limit': 100}
    if apres: p['starting_after'] = apres
    d = requests.get('https://api.stripe.com/v1/checkout/sessions', auth=A, params=p, timeout=60).json()
    ses += d.get('data', [])
    if not d.get('has_more'): break
    apres = d['data'][-1]['id']
print(f'{len(ses)} sessions au total')
for s in sorted(ses, key=lambda s: s['created']):
    md = s.get('metadata') or {}
    quand = datetime.datetime.fromtimestamp(s['created'], datetime.timezone.utc).astimezone(datetime.timezone(datetime.timedelta(hours=1))).strftime('%d.%m %H:%M')
    pi, err = s.get('payment_intent'), ''
    if pi:
        r = requests.get(f'https://api.stripe.com/v1/payment_intents/{pi}', auth=A, timeout=30)
        if r.ok:
            j = r.json(); e = j.get('last_payment_error') or {}
            err = f"tentative: {j.get('status')} {e.get('code') or ''} {e.get('decline_code') or ''} {(e.get('message') or '')[:90]}"
        else: err = f'tentative: (détail non lisible {r.status_code})'
    test = 'TEST' if 'test' in (s.get('client_reference_id') or '') else ''
    champs = {c['key']: (c.get('text') or c.get('dropdown') or {}).get('value') for c in s.get('custom_fields', [])}
    print(f"{quand} | {s['status']:8} {s['payment_status']:8} | {(s.get('amount_total') or 0)/100:6.2f} € | {md.get('maison') or '-':7} P{md.get('parcelle') or '?':>3} | {md.get('options') or ''} | pseudo={champs.get('pseudo') or ''} | e-mail saisi={'oui' if (s.get('customer_details') or {}).get('email') or s.get('customer_email') else 'non'} | {err} {test}")
