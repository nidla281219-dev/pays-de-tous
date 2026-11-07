# Le Pays de Tous — contexte pour Claude (à lire en premier)

Compte créé le 07.11.2026, du même propriétaire que la chaîne Énigmo (dépôt séparé nidla281219-dev/enigmo : ne rien y mélanger).
Il lit sur téléphone : tutoiement, réponses courtes en français.

## Le concept
Une série quotidienne où les abonnés construisent un pays ensemble sur une île déserte (océan, plages, forêt, rivière, volcan endormi).
- 1 abonné = 1 habitant. Compteur « JOUR n » + « HABITANTS » + nom du pays en haut de l'écran.
- Chaque vidéo : on montre ce qui a changé depuis la veille (résultat du vote d'hier, construit en 3D), puis UN nouveau vote (A ou B) en commentaire, et « Demain, jour n+1 ».
- Le vote gagnant = l'option la plus commentée / le commentaire le plus liké. On le respecte toujours.
- Inspiration (concept seulement, ne jamais copier textes ou visuels) : TikTok @gerantduparc.
- Plateformes : YouTube Shorts (automatique, workflow ci-dessous), TikTok et Instagram Reels (l'utilisateur publie à la main ; pas de Metricool pour l'instant). TikTok : 3 hashtags max.

## Règles de l'utilisateur
- ZONE VISIBLE (07.11) — référence assets/zone_visible_tiktok.png. Vidéo 1080×1920 : texte et éléments importants dans x 60–960, y 130–1600 (haut ≥ 108 = barre « Abonnements | Pour toi » ; droite ≤ 960 sous y ≈ 300 = colonne j'aime/commentaires/partage ; bas ≤ 1600 = pseudo/description). Ligne de texte ≤ 840 px de large. Vérifier quelques images test avec ce cadre dessiné avant chaque rendu complet.
  Défauts du jour 1 à corriger dès le jour 2 : HUD qui commence à y ≈ 90 (trop haut) ; légende « PORT, PÊCHE, COMMERCE » jusqu'à x ≈ 1015.
- Secrets uniquement dans les secrets GitHub de CE dépôt. Ne jamais écrire une clé dans le dépôt ni la demander dans le chat.

## Organisation du dépôt
- studio/ : scene.html (Three.js : île, océan animé, arbres, nuages, volcan qui fume, villes « fantômes » qui poussent, épingles A/B, drapeau), render.js (caméra par plans calés sur la voix, textes, cartes de vote, HUD ; rendu image par image Playwright + SwiftShader, page servie par python http.server port 8765), mix.sh N (voix + musique + whooshs → le_pays_de_tous_jourN.mp4), miniature.py, chaine_visuels.py (logo/bannière), publier.py.
  Test rapide : `cd studio && mkdir -p t && node render.js t/f --test 1,13.8,42`. Rendu complet : `node render.js pays_j1_video.mp4` (~20 min) puis `bash mix.sh 1`.
  ⚠️ render.js et les instants de mix.sh sont encore ceux du jour 1 : pour chaque nouveau jour, faire la timeline du jour (idéalement jours/jourN/timeline.json lu par render.js).
- jours/jourN/ : voix.mp3, script.md, mots.json (calage Whisper), publication.json (titre, description, tags YouTube), publication.md (textes 3 plateformes), miniature.jpg, youtube.txt (résultat de l'envoi).
- sons/ : sons CC0 (CREDITS.json). chaine/ : logo_chaine.png (800×800), banniere_youtube.jpg (2560×1440).
- Voix : ElevenLabs (voix Leo AfbuxQ9DVtS4azaxN1W7), secret ELEVENLABS_API_KEY. Script de voix pas encore copié ici (il est dans enigmo/pipeline/tts.py, voix_longue.py) : à faire pour le jour 2.
- État du pays : etat.json (jour, habitants, nom, drapeau, constructions, votes passés) — à créer au jour 2.

## Publication YouTube
- Workflow « Publier sur YouTube » (.github/workflows/publier.yml, lancement manuel) : action `verifier` (affiche la chaîne liée au jeton) ou `publier` (rendu + son + envoi + miniature, programmé à l'heure choisie, défaut 18:00 ; publié tout de suite si l'heure est passée).
- publier.py refuse d'envoyer si la chaîne du jeton ne contient pas « Pays de Tous ».
- Secrets : YT_CLIENT_ID / YT_CLIENT_SECRET (client OAuth « Pays de Tous », type Application Web, redirection https://developers.google.com/oauthplayground, dans le projet Google Cloud d'Énigmo), YT_REFRESH_TOKEN (obtenu via OAuth Playground en choisissant la chaîne Le Pays de Tous). Ne jamais toucher au client « Enigmo » (Ordinateur de bureau).
- Claude ne peut ni créer de release ni lire/écrire les secrets depuis ses sessions : la vidéo est refaite dans Actions.

## Journal
- Jour 1 (07.11) : présentation de l'île, appel au nom + drapeau en commentaire, vote 1 : capitale A (plage, port) ou B (pied du volcan, terres fertiles). Vidéo faite (55,6 s), publiée à la main sur TikTok le 07.11 ; YouTube : via le workflow une fois le jeton en place.
- 07.11 soir : projet déplacé depuis enigmo/projets/pays_de_tous vers ce dépôt.
