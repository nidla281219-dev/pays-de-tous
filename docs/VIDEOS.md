# Fabriquer N'IMPORTE QUELLE vidéo (hors épisode quotidien) — à lire en premier dans une discussion « vidéos »
Pour : pub du site, vidéo spéciale, bande-annonce du jeu, récap de la semaine, test de format… L'épisode quotidien, lui, reste à la tâche de 14h45 (CLAUDE.md).
Lire aussi : CLAUDE.md (règles de l'utilisateur : zone visible, accroche, durée, pas de plateforme nommée), docs/VIRAL.md, docs/TIMELINE.md (format du timeline).

## Dossier
`jours/jour<nom>/` (ex. `jours/jourpub_jeu/`), nom sans espace. Le moteur accepte un nom à la place du numéro partout (`--jour pub_jeu`).

## Chaîne de fabrication
1. `script.md` : 1re ligne « # titre », puis le texte dit (25–35 s ≈ ≤ 95 mots). Commit/push.
2. Voix (ElevenLabs, secret GitHub) : `gh api -X POST repos/nidla281219-dev/pays-de-tous/actions/workflows/voix.yml/dispatches -f ref=main -f 'inputs[jour]=<nom>'` → voix.mp3 + mots.json (temps de chaque mot). git pull.
3. `timeline.json` calé sur mots.json : partir du timeline d'un jour récent (ex. jours/jour16/timeline.json) ; plans (shots), textes (caps), cartes (cards), sons, inserts (clips plein écran : maisons des acheteurs via `python3 studio/vitrines.py <nom> pseudo…`, assets/site_demo.mp4…).
4. Images test : `cd studio && node render.js --jour <nom> t/x --test 0,1.5,10,20 --cadre` → REGARDER (Read) avant tout rendu complet.
5. Rendu + son : workflow `publier_rapide.yml` avec `inputs[jour]=<nom>`, `inputs[envoyer]=non` (pas d'envoi YouTube) → jours/jour<nom>/video.mp4 (~20 min). Ou en local : `node render.js --jour <nom> pays_j<nom>_video.mp4 && python3 mix.py <nom>`.
6. Miniature : `python3 studio/miniature.py <image> <sortie> --style youtube|tiktok "*MOT*" …` (options putaclic --zoom/--cercle/--fleche, ~rouge~).
7. Envoyer la vidéo à l'utilisateur (SendUserFile). Il la publie lui-même sur TikTok/Instagram. Envoi YouTube automatique seulement pour un épisode numéroté (publier.py attend un numéro) ; sinon il la poste à la main, ou demander avant d'adapter publier.py.

## Autres outils du dépôt
- studio/recap_carrousel.py (carrousels 1080×1440), studio/passeport.py (passeports Fondateurs), studio/vitrines.py (clip de la maison d'un acheteur, identique au site), boutique/ (site + Stripe), docs/JEU.md (jeu web), docs/SITE.md (site).
- Bruitages : sons/lib + sons/earshot (types listés dans studio/mix.py). Musique : sons/musique_epic_score.mp3.
- Supprimer une vidéo YouTube : publier.yml action=supprimer video=<id>. Rendre publique tout de suite : action=maintenant.

## Règles
- Secrets uniquement dans GitHub (ELEVENLABS_API_KEY, YT_*, STRIPE_KEY) : jamais dans le chat ni le dépôt.
- Ne jamais lire en entier scene.html, boutique/index.html, mots.json, commentaires_*.json : grep / petits scripts.
- Ne pas toucher aux dossiers jours/jourN des épisodes ni à etat.json (c'est la tâche quotidienne).
- Rien publier sans l'accord de l'utilisateur. Tutoiement, réponses courtes en français.
