"""Le Pays de Tous — publication YouTube (chaîne séparée d'Énigmo).
python publier.py verifier                      → affiche la chaîne liée au jeton (rien n'est envoyé)
python publier.py supprimer ID                   → supprime une vidéo de la chaîne (remplacement)
python publier.py publier N video.mp4 [HH:MM]   → envoie le jour N, programmé à HH:MM heure suisse (publié tout de suite si l'heure est passée)
Secrets GitHub du dépôt pays-de-tous : YT_CLIENT_ID, YT_CLIENT_SECRET (client OAuth « Pays de Tous ») + YT_REFRESH_TOKEN (autorisation donnée sur la chaîne Le Pays de Tous).
Sécurité : refuse d'envoyer si la chaîne du jeton ne s'appelle pas « … Pays de Tous … » (jamais sur Énigmo par erreur).
"""
import os, sys, json, datetime, requests
from zoneinfo import ZoneInfo

ICI = os.path.dirname(os.path.abspath(__file__))
JOURS = os.path.join(ICI, '..', 'jours')
API, UP = 'https://www.googleapis.com/youtube/v3', 'https://www.googleapis.com/upload/youtube/v3'
TZ = ZoneInfo('Europe/Zurich')

def jeton():
    r = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': os.environ['YT_CLIENT_ID'], 'client_secret': os.environ['YT_CLIENT_SECRET'],
        'refresh_token': os.environ['YT_REFRESH_TOKEN'], 'grant_type': 'refresh_token'}, timeout=30)
    if not r.ok: sys.exit(f'Jeton refusé ({r.status_code}) : {r.text[:300]}')
    return {'Authorization': 'Bearer ' + r.json()['access_token']}

def chaine(h):
    d = requests.get(f'{API}/channels', headers=h, params={'part': 'snippet', 'mine': 'true'}, timeout=30).json()
    if not d.get('items'): sys.exit(f'Aucune chaîne pour ce jeton : {json.dumps(d)[:300]}')
    s = d['items'][0]['snippet']; return d['items'][0]['id'], s['title'], s.get('customUrl', '')

def verifier(h):
    cid, titre, url = chaine(h)
    print(f'Chaîne liée au jeton : {titre} {url} ({cid})')
    if 'pays de tous' not in titre.lower(): sys.exit('⚠️ Ce n\'est PAS la chaîne Le Pays de Tous : refais l\'autorisation en choisissant la bonne chaîne.')
    return cid

def publier(n, video, heure='18:00'):
    h = jeton(); verifier(h)
    D = os.path.join(JOURS, f'jour{n}'); M = json.load(open(os.path.join(D, 'publication.json')))
    hh, mm = map(int, heure.split(':'))
    quand = datetime.datetime.combine(datetime.datetime.now(TZ).date(), datetime.time(hh, mm), TZ)
    tout_de_suite = quand <= datetime.datetime.now(TZ) + datetime.timedelta(minutes=15)
    status = {'privacyStatus': 'public' if tout_de_suite else 'private', 'selfDeclaredMadeForKids': False, 'containsSyntheticMedia': False}
    if not tout_de_suite: status['publishAt'] = quand.astimezone(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    body = {'snippet': {'title': M['titre'][:100], 'description': M['description'][:4900], 'tags': M.get('tags', []),
                        'categoryId': '24', 'defaultLanguage': 'fr', 'defaultAudioLanguage': 'fr'}, 'status': status}
    r = requests.post(f'{UP}/videos?uploadType=resumable&part=snippet,status', headers={**h, 'Content-Type': 'application/json; charset=UTF-8',
                      'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': str(os.path.getsize(video))}, data=json.dumps(body), timeout=60)
    if not r.ok: sys.exit(f'Envoi refusé ({r.status_code}) : {r.text[:400]}')
    with open(video, 'rb') as f:
        r2 = requests.put(r.headers['Location'], headers={**h, 'Content-Type': 'video/mp4'}, data=f, timeout=900)
    if not r2.ok: sys.exit(f'Envoi refusé ({r2.status_code}) : {r2.text[:400]}')
    vid = r2.json()['id']
    mini = os.path.join(D, M.get('miniature', 'miniature.jpg')); etat_mini = 'aucune'
    if os.path.exists(mini):
        with open(mini, 'rb') as f:
            r3 = requests.post(f'{UP}/thumbnails/set', headers={**h, 'Content-Type': 'image/jpeg'}, params={'videoId': vid}, data=f.read(), timeout=120)
        etat_mini = 'ok' if r3.ok else f'refusée ({r3.status_code}) — vérifie la chaîne par téléphone pour débloquer les miniatures'
    quand_txt = 'tout de suite' if tout_de_suite else quand.strftime('%d.%m à %H:%M')
    out = f'Jour {n} envoyé : https://youtube.com/shorts/{vid} — publication {quand_txt} — miniature {etat_mini}'
    print(out); open(os.path.join(D, 'youtube.txt'), 'w').write(out + '\n')

def maintenant(vid):
    h = jeton(); verifier(h)
    v = requests.get(f'{API}/videos', headers=h, params={'part': 'status', 'id': vid}, timeout=30).json()['items'][0]
    st = v['status']; st.pop('publishAt', None); st['privacyStatus'] = 'public'
    r = requests.put(f'{API}/videos?part=status', headers={**h, 'Content-Type': 'application/json'}, data=json.dumps({'id': vid, 'status': st}), timeout=30)
    if not r.ok: sys.exit(f'Refusé ({r.status_code}) : {r.text[:300]}')
    print(f'{vid} est maintenant publique : https://youtube.com/shorts/{vid}')

def supprimer(vid):
    h = jeton(); verifier(h)
    r = requests.delete(f'{API}/videos', headers=h, params={'id': vid}, timeout=30)
    if not r.ok: sys.exit(f'Suppression refusée ({r.status_code}) : {r.text[:300]}')
    print(f'{vid} supprimée')

if __name__ == '__main__':
    a = sys.argv[1:]
    if a[0] == 'verifier': verifier(jeton())
    elif a[0] == 'maintenant': maintenant(a[1])
    elif a[0] == 'supprimer': supprimer(a[1])
    else: publier(int(a[1]), a[2], a[3] if len(a) > 3 else '18:00')
