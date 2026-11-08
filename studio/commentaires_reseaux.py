"""Commentaires TikTok (@le.pays.de.tous) et Instagram (@lepaysdetous) de la vidéo du jour N, via Apify (secret APIFY_TOKEN).
python commentaires_reseaux.py N → jours/jourN/commentaires_tiktok.json + commentaires_instagram.json
Même format que commentaires_youtube.json : {lu_le, abonnes, videos:[{url, titre, commentaires:[{auteur, texte, likes, reponses, date}]}]}
Sans APIFY_TOKEN : n'écrit rien et le dit (la routine continue avec YouTube seul).
"""
import os, sys, re, json, datetime, requests

TIKTOK, INSTA = 'le.pays.de.tous', 'lepaysdetous'
ICI = os.path.dirname(os.path.abspath(__file__))
TOKEN = os.environ.get('APIFY_TOKEN')

def actor(nom, entree, timeout=300):
    r = requests.post(f'https://api.apify.com/v2/acts/{nom.replace("/", "~")}/run-sync-get-dataset-items', params={'token': TOKEN, 'timeout': timeout - 20},
                      json=entree, timeout=timeout)
    if not r.ok: raise RuntimeError(f'{nom} : {r.status_code} {r.text[:300]}')
    return r.json()

def du_jour(items, n, texte, date):
    """Garde la vidéo dont la légende contient « Jour N », sinon la plus récente."""
    ok = [i for i in items if re.search(rf'jour\s*{n}\b', texte(i) or '', re.I)]
    return (ok or sorted(items, key=lambda i: date(i) or '', reverse=True))[:1]

def g(d, *cles, defaut=None):
    for c in cles:
        v = d
        for k in c.split('.'):
            v = v.get(k) if isinstance(v, dict) else None
        if v not in (None, ''): return v
    return defaut

def tiktok(n):
    vids = actor('clockworks/tiktok-scraper', {'profiles': [TIKTOK], 'resultsPerPage': 6, 'profileScrapeSections': ['videos'],
                                                'shouldDownloadVideos': False, 'shouldDownloadCovers': False})
    abonnes = int(g(vids[0], 'authorMeta.fans', defaut=0)) if vids else 0
    out = {'abonnes': abonnes, 'videos': []}
    for v in du_jour(vids, n, lambda i: i.get('text'), lambda i: i.get('createTimeISO')):
        url = g(v, 'webVideoUrl', 'videoUrl')
        coms = actor('clockworks/tiktok-comments-scraper', {'postURLs': [url], 'commentsPerPost': 500, 'topLevelCommentsPerPost': 500, 'maxRepliesPerComment': 0})
        out['videos'].append({'url': url, 'titre': v.get('text', ''), 'vues': g(v, 'playCount', defaut=0), 'likes': int(g(v, 'diggCount', defaut=0)), 'commentaires': sorted([
            {'auteur': '@' + str(g(c, 'uniqueId', 'user.uniqueId', 'authorMeta.name', defaut='?')), 'texte': g(c, 'text', defaut=''),
             'likes': int(g(c, 'diggCount', 'likes', defaut=0)), 'reponses': int(g(c, 'replyCommentTotal', defaut=0)), 'date': g(c, 'createTimeISO', defaut='')}
            for c in coms if g(c, 'text')], key=lambda c: -c['likes'])})
    return out

def instagram(n):
    prof = actor('apify/instagram-scraper', {'directUrls': [f'https://www.instagram.com/{INSTA}/'], 'resultsType': 'details', 'resultsLimit': 1})
    abonnes = int(g(prof[0], 'followersCount', defaut=0)) if prof else 0
    posts = actor('apify/instagram-scraper', {'directUrls': [f'https://www.instagram.com/{INSTA}/'], 'resultsType': 'posts', 'resultsLimit': 6})
    out = {'abonnes': abonnes, 'videos': []}
    for p in du_jour(posts, n, lambda i: i.get('caption'), lambda i: i.get('timestamp')):
        url = p.get('url')
        coms = []
        try:  # 1) lecteur trié par popularité (les plus likés d'abord)
            coms = actor('scrapesmith/instagram-comments-scraper', {'postUrls': [url], 'maxCommentsPerPost': 300, 'sortOrder': 'popular'})
            print(f'  instagram (tri popularité) : {len(coms)} commentaires')
        except Exception as e: print('  lecteur popularité indisponible :', str(e)[:200])
        if len(coms) < 5:  # 2) secours : lecteur officiel Apify
            coms = actor('apify/instagram-comment-scraper', {'directUrls': [url], 'resultsLimit': 400})
            print(f'  instagram (lecteur officiel) : {len(coms)} commentaires')
        out['videos'].append({'url': url, 'titre': (p.get('caption') or '')[:120], 'vues': g(p, 'videoPlayCount', 'videoViewCount', defaut=0), 'likes': int(g(p, 'likesCount', defaut=0)), 'commentaires': sorted([
            {'auteur': '@' + str(g(c, 'ownerUsername', 'owner.username', 'username', 'user.username', defaut='?')), 'texte': g(c, 'text', 'comment', defaut=''),
             'likes': int(g(c, 'likesCount', 'likeCount', 'likes', defaut=0)), 'reponses': int(g(c, 'repliesCount', 'replyCount', defaut=0)), 'date': g(c, 'timestamp', 'createdAt', defaut='')}
            for c in coms if g(c, 'text', 'comment')], key=lambda c: -c['likes'])})
    return out

if __name__ == '__main__':
    n = int(sys.argv[1])
    if not TOKEN: sys.exit(print('APIFY_TOKEN absent : commentaires TikTok/Instagram non lus (YouTube seul).') or 0)
    d = os.path.join(ICI, '..', 'jours', f'jour{n}'); os.makedirs(d, exist_ok=True)
    for nom, f in [('tiktok', tiktok), ('instagram', instagram)]:
        try:
            res = {'lu_le': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='minutes'), **f(n)}
            json.dump(res, open(os.path.join(d, f'commentaires_{nom}.json'), 'w'), ensure_ascii=False, indent=1)
            print(f'{nom} : {res["abonnes"]} abonnés')
            for v in res['videos']:
                print(f'  {v["url"]} : {v.get("vues")} vues, {v.get("likes")} likes, {len(v["commentaires"])} commentaires')
                for c in v['commentaires'][:8]: print(f'    ❤{c["likes"]} {c["auteur"]} : {c["texte"][:100]!r}')
        except Exception as e:
            print(f'ERREUR {nom} : {e}')
