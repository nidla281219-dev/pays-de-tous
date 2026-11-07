"""Lit les commentaires YouTube du jour N (vidéo dont le titre contient « Jour N ») + le nombre d'abonnés.
python commentaires.py N → jours/jourN/commentaires_youtube.json
Même jeton que publier.py (YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN).
"""
import os, sys, re, json, datetime, requests
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from publier import jeton, verifier, API, ICI

def main(n):
    h = jeton(); cid = verifier(h)
    ch = requests.get(f'{API}/channels', headers=h, params={'part': 'statistics,contentDetails', 'id': cid}, timeout=30).json()['items'][0]
    abonnes = int(ch['statistics'].get('subscriberCount', 0))
    up = ch['contentDetails']['relatedPlaylists']['uploads']
    items = requests.get(f'{API}/playlistItems', headers=h, params={'part': 'snippet', 'playlistId': up, 'maxResults': 50}, timeout=30).json().get('items', [])
    vids = [(i['snippet']['resourceId']['videoId'], i['snippet']['title']) for i in items]
    cible = [v for v in vids if re.search(rf'jour\s*{n}\b', v[1], re.I)] or vids[:1]
    out = {'lu_le': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='minutes'), 'abonnes': abonnes, 'videos': []}
    for vid, titre in cible:
        st = requests.get(f'{API}/videos', headers=h, params={'part': 'statistics', 'id': vid}, timeout=30).json()['items'][0]['statistics']
        coms, page = [], None
        while True:
            p = {'part': 'snippet', 'videoId': vid, 'maxResults': 100, 'order': 'relevance', 'textFormat': 'plainText'}
            if page: p['pageToken'] = page
            r = requests.get(f'{API}/commentThreads', headers=h, params=p, timeout=30)
            if not r.ok:
                print(f'ERREUR commentaires ({r.status_code}) : {r.text[:400]}')
                k = os.environ.get('YT_API_KEY')
                if not k: sys.exit('Lecture des commentaires refusée : voir l\'erreur ci-dessus.')
                r = requests.get(f'{API}/commentThreads', params={**p, 'key': k}, timeout=30)
                if not r.ok: sys.exit(f'Refusé aussi avec la clé API ({r.status_code}) : {r.text[:300]}')
            d = r.json()
            for it in d.get('items', []):
                s = it['snippet']['topLevelComment']['snippet']
                coms.append({'auteur': s.get('authorDisplayName', ''), 'texte': s.get('textOriginal', ''), 'likes': s.get('likeCount', 0),
                             'reponses': it['snippet'].get('totalReplyCount', 0), 'date': s.get('publishedAt', '')})
            page = d.get('nextPageToken')
            if not page or len(coms) >= 1000: break
        coms.sort(key=lambda c: -c['likes'])
        out['videos'].append({'id': vid, 'titre': titre, 'vues': int(st.get('viewCount', 0)), 'likes': int(st.get('likeCount', 0)), 'commentaires': coms})
        print(f'{titre} : {st.get("viewCount")} vues, {len(coms)} commentaires')
        for c in coms[:10]: print(f'  ❤{c["likes"]} {c["auteur"]} : {c["texte"][:120]!r}')
    print('abonnés :', abonnes)
    d = os.path.join(ICI, '..', 'jours', f'jour{n}'); os.makedirs(d, exist_ok=True)
    json.dump(out, open(os.path.join(d, 'commentaires_youtube.json'), 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main(int(sys.argv[1]))
