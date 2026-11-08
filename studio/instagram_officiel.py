"""Lecteur Instagram OFFICIEL (Instagram API with Instagram Login) — remplace Apify pour Instagram quand le secret IG_TOKEN existe.
Donne TOUS les commentaires avec leurs likes, les likes de la vidéo et le nombre d'abonnés.
Jeton : compte @lepaysdetous professionnel → app Meta (developers.facebook.com) → produit Instagram → « Generate access token »
(autorisations instagram_business_basic + instagram_business_manage_comments). Le jeton dure 60 jours ;
il est prolongé à chaque lecture (refresh_access_token). Si le secret GH_SECRETS_TOKEN existe (jeton GitHub avec droit « Secrets : écriture »),
le nouveau jeton est réenregistré automatiquement dans IG_TOKEN ; sinon, il faut le regénérer tous les ~55 jours.
"""
import os, re, subprocess, requests

API = 'https://graph.instagram.com/v22.0'

def _get(url, **p):
    params = p if 'access_token=' in url else {'access_token': os.environ['IG_TOKEN'], **p}
    r = requests.get(url, params=params, timeout=30)
    if not r.ok: raise RuntimeError(f'Instagram {r.status_code} : {r.text[:300]}')
    return r.json()

def prolonger():
    """Prolonge le jeton (valable 60 jours de plus) et le réenregistre dans les secrets GitHub si possible."""
    try:
        r = requests.get('https://graph.instagram.com/refresh_access_token', params={'grant_type': 'ig_refresh_token', 'access_token': os.environ['IG_TOKEN']}, timeout=30)
        if not r.ok: return f'prolongation refusée ({r.status_code})'
        nouveau = r.json()['access_token']
        if os.environ.get('GH_SECRETS_TOKEN') and os.environ.get('GITHUB_REPOSITORY'):
            subprocess.run(['gh', 'secret', 'set', 'IG_TOKEN', '--repo', os.environ['GITHUB_REPOSITORY'], '--body', nouveau],
                           env={**os.environ, 'GH_TOKEN': os.environ['GH_SECRETS_TOKEN']}, check=True, capture_output=True)
            return 'jeton prolongé et réenregistré (60 jours)'
        return 'jeton prolongé côté Instagram (à réenregistrer à la main avant expiration)'
    except Exception as e:
        return f'prolongation impossible : {e}'

def instagram(n):
    me = _get(f'{API}/me', fields='user_id,username,followers_count')
    out = {'abonnes': int(me.get('followers_count', 0)), 'compte': me.get('username'), 'videos': []}
    medias = _get(f'{API}/me/media', fields='id,caption,timestamp,like_count,comments_count,permalink,media_type', limit=12).get('data', [])
    cible = [m for m in medias if re.search(rf'jour\s*{n}\b', m.get('caption') or '', re.I)] or medias[:1]
    for m in cible[:1]:
        coms, url = [], f"{API}/{m['id']}/comments"
        p = {'fields': 'id,text,username,like_count,timestamp,replies{id}', 'limit': 50}
        while url:
            d = _get(url, **p)
            for c in d.get('data', []):
                coms.append({'auteur': '@' + c.get('username', '?'), 'texte': c.get('text', ''), 'likes': int(c.get('like_count', 0)),
                             'reponses': len((c.get('replies') or {}).get('data', [])), 'date': c.get('timestamp', '')})
            url = (d.get('paging') or {}).get('next'); p = {}
        out['videos'].append({'url': m.get('permalink'), 'titre': (m.get('caption') or '')[:120], 'likes': int(m.get('like_count', 0)),
                              'nb_commentaires_annonce': m.get('comments_count'), 'commentaires': sorted(coms, key=lambda c: -c['likes'])})
    out['jeton'] = prolonger()
    return out
