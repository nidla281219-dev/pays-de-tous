# Technique (à lire seulement en cas de panne)

## Organisation du dépôt
- etat.json : état du pays (jour, habitants, nom, drapeau, capitale, chef, lois, constructions, vote en cours, historique). Mis à jour chaque jour.
- banque_questions.md : plan des prochaines questions + règles de décision (modération, égalités, pseudos).
- studio/ : scene.html (Three.js), render.js, mix.py, voix.py (+ align.py), commentaires.py, publier.py, miniature.py, chaine_visuels.py, presets.json (plans caméra nommés), exemple_timeline.json (exemple complet d'un jour 2).
  Test : `cd studio && mkdir -p t && node render.js --jour N t/f --test 1,8,15 --cadre` (--cadre dessine la zone visible en rouge). Complet : `node render.js --jour N pays_jN_video.mp4` (~20 min) puis `python mix.py N`.
- jours/jourN/ : script.md (1re ligne « # titre », puis le texte dit), voix.mp3 + mots.json (temps de chaque mot), timeline.json, publication.json (titre/description/tags YouTube), publication.md (textes TikTok + Insta, 3 hashtags max chacun), miniature.jpg, commentaires_youtube.json (votes lus), commentaires_autres.txt (TikTok/Insta, ajoutés par l'utilisateur), video.mp4 (vidéo finale), youtube.txt.
- sons/ : sons CC0 (CREDITS.json). chaine/ : logo + bannière.

## Lecture Instagram officielle (08.11)
- studio/instagram_officiel.py (Instagram API with Instagram Login, graph.instagram.com) : tous les commentaires + likes + abonnés. Utilisé automatiquement si le secret IG_TOKEN existe (sinon Apify, limité à 15 commentaires).
- Jeton 60 jours, prolongé à chaque lecture ; réenregistré tout seul si le secret GH_SECRETS_TOKEN existe (jeton GitHub fine-grained, dépôt pays-de-tous, droit « Secrets : Read and write »). Sinon le regénérer tous les ~55 jours.
- TikTok : pas d'accès officiel aux commentaires pour un petit créateur → Apify (clockworks/tiktok-comments-scraper) ; ne jamais scraper avec le compte de l'utilisateur (risque de blocage).

## Publication YouTube
- Workflow « Publier sur YouTube » (.github/workflows/publier.yml, lancement manuel) : action `verifier` (affiche la chaîne liée au jeton) ou `publier` (rendu + son + envoi + miniature, programmé à l'heure choisie, défaut 18:00 dans le workflow, mais TOUJOURS passer 17:00 ; publié tout de suite si l'heure est passée).
- publier.py refuse d'envoyer si la chaîne du jeton ne contient pas « Pays de Tous ».
- Secrets : YT_CLIENT_ID / YT_CLIENT_SECRET (client OAuth « Pays de Tous », type Application Web, redirection https://developers.google.com/oauthplayground, dans le projet Google Cloud d'Énigmo), YT_REFRESH_TOKEN (obtenu via OAuth Playground en choisissant la chaîne Le Pays de Tous). Ne jamais toucher au client « Enigmo » (Ordinateur de bureau).
- Claude ne peut ni créer de release ni lire/écrire les secrets depuis ses sessions : la vidéo est refaite dans Actions.
