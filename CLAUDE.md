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
- 2 à 3 questions MAXIMUM par vidéo (07.11), dont « Qui sera le chef ? » au jour 2.
- CONSTRUIRE CE QUE LES GENS DEMANDENT (07.11) : une idée aimée dans les commentaires (ex. « une boutique de croissant » de @RL_Ham) est construite en 3D avec le NOM DE LA PERSONNE sur l'enseigne (« Boulangerie de RL_Ham 🥐 ») et on le dit à voix haute. Champ etat.batiments dans timeline.json.
- Secrets uniquement dans les secrets GitHub de CE dépôt. Ne jamais écrire une clé dans le dépôt ni la demander dans le chat.

## Organisation du dépôt
- etat.json : état du pays (jour, habitants, nom, drapeau, capitale, chef, lois, constructions, vote en cours, historique). Mis à jour chaque jour.
- banque_questions.md : plan des prochaines questions + règles de décision (modération, égalités, pseudos).
- studio/ : scene.html (Three.js), render.js, mix.py, voix.py (+ align.py), commentaires.py, publier.py, miniature.py, chaine_visuels.py, presets.json (plans caméra nommés), exemple_timeline.json (exemple complet d'un jour 2).
  Test : `cd studio && mkdir -p t && node render.js --jour N t/f --test 1,8,15 --cadre` (--cadre dessine la zone visible en rouge). Complet : `node render.js --jour N pays_jN_video.mp4` (~20 min) puis `python mix.py N`.
- jours/jourN/ : script.md (1re ligne « # titre », puis le texte dit), voix.mp3 + mots.json (temps de chaque mot), timeline.json, publication.json (titre/description/tags YouTube), publication.md (textes TikTok + Insta, 3 hashtags max chacun), miniature.jpg, commentaires_youtube.json (votes lus), commentaires_autres.txt (TikTok/Insta, ajoutés par l'utilisateur), video.mp4 (vidéo finale), youtube.txt.
- sons/ : sons CC0 (CREDITS.json). chaine/ : logo + bannière.

## Format de jours/jourN/timeline.json (lu par render.js, mix.py)
- dur (s, = fin de la voix + ~1 s). etat : {nom, drapeau, capitale:{site, maisons, rayon}} = état du pays MONTRÉ dans cette vidéo (copie figée, pas de lien vers etat.json).
- hud : {jour, pop (nombre ou {de,a,t0,t1} qui compte), nom, drapeau, changements:[{t, nom, drapeau}]} (ex. le nom apparaît dans le compteur au moment de la révélation).
- shots : [{t, preset:"nom"} ou {t, from:{p:[x,y,z], l:[x,y,z]}, to:{…}, rel?}] — un plan toutes les 2–4 s. Presets dans studio/presets.json. Sites (x,z) : plage[-48,198] volcan[26,-12] centre[-120,20] foret[100,120] riviere[-20,60] baie[-70,235] nord[-20,-180] est[170,10].
- VILLE (refaite le 07.11 : l'utilisateur veut du BEAU, pas des boîtes) : capitale = place pavée + fontaine + arbres au centre, rues en étoile, maisons détaillées (fenêtres, volets, jardinières, toits à deux pans, cheminées) alignées face aux rues ; terrain aplani sous la ville, sapins retirés. Capitale au pied du volcan : site pied_volcan [-18,-34] (centre de la place). Drapeau au bord de la place (dx -9, dz 3). Plans : rel:1 avec l = [c0, 5, c1] (c = centre de la place) — exemples dans jours/jourtest2/timeline.json (large, haut, rue, gros plan drapeau, boulangerie).
- caps : [{t0, t1, lignes:["UN *PAYS*…"], y?}] (*mot* = jaune ; y par défaut 560, garder entre 400 et 1000 si une carte est en bas).
- cards : [{kind, t0, t1, data}] — gagnant {titre, pseudo, texte, likes} (+ confettis), drapeau {nom, sous, confettis, drapeau?}, resultat {options:[{lettre,titre,pct,couleur?}], gagnant}, vs {A:{titre,sous,couleur?}, B:{…}}, comment {pseudo, lignes, likes} (exemple de commentaire pour montrer comment voter), fin {demain:"DEMAIN : JOUR N+1", ligne?}, vote (jour 1 seulement).
- win : fenêtres de visibilité {clé:[[t0,t1],…]} ; grow : {clé:[t0,t1]} (pousse). Clés : capitale (construction animée ; sans grow = déjà construite), drapeau / sansDrapeau, nuages, nuagesIntro, fin, + les clés des fantomes/epingles.
- etat.batiments : [{nom (texte de l'enseigne, ex. « Boulangerie de RL_Ham »), place: angle (radians) autour de la place de la capitale (la façade regarde la fontaine ; -1.5708 = côté nord, face caméra depuis le sud), key?, couleur, toit, store}] — pour l'instant un seul modèle : boutique avec vitrine (pains, croissants, baguettes), auvent rayé, terrasse, enseigne peinte au nom de l'abonné. Avec key + grow[key] elle pousse à ce moment-là, sinon elle est déjà là (garder les bâtiments des jours d'avant dans etat). Pour un AUTRE type de bâtiment demandé (stade, hôpital…), le modéliser avec le même soin dans scene.html (fonction comme boulangerie()), le tester en images avant le rendu.
- fantomes : [{key, site, n, rayon, hauteur}] (bâtiments transparents = projet à voter) ; epingles : [{key, site, lettre, couleur}].
- flashes : [t…] (flash blanc) ; pops : [t…] (sons en plus des cartes). mix.py met un whoosh à chaque plan et un pop à chaque carte.
- drapeau (spec) : {fond:'uni'|'h'|'v'|'diag'|'croix'|'triangle', couleurs:[…], bande:{couleur, sens:'montante'|'descendante'|'h'|'v', epaisseur}, bordure:'#couleur', symboles:[plusieurs symboles], symbole:{forme:'etoile'|'cercle'|'soleil'|'volcan'|'palmier'|'vague'|'lune'|'coeur'|'couronne'|'triangle'|'poisson'|'feuille'|'aucun', couleur, taille 0–1, x, y}}. Traduire fidèlement la description du commentaire gagnant.

## Procédure quotidienne (tâche programmée 16h41, publication 18h00 — décidé par l'utilisateur le 07.11 : tout automatique, il reçoit la vidéo + textes vers 17h45)
1. N = etat.jour + 1. Lancer le workflow commentaires.yml (jour N-1) : il lit YouTube (API) + TikTok @le.pays.de.tous + Instagram @lepaysdetous (Apify, secret APIFY_TOKEN) → jours/jour(N-1)/commentaires_youtube.json, commentaires_tiktok.json, commentaires_instagram.json. Attendre, git pull. Lire aussi commentaires_autres.txt s'il existe. ADDITIONNER les 3 plateformes (1 voix par personne et par plateforme ; likes additionnés pour les égalités ; le gagnant peut venir de n'importe quelle plateforme : dire « sur TikTok, @… »). HABITANTS = abonnés YouTube + TikTok + Instagram.
2. Décider selon banque_questions.md (règles de décision) : résultat du vote, propositions gagnantes (pseudo exact). Mettre à jour etat.json (+ historique).
3. Écrire jours/jourN/script.md (45–60 s) : accroche « Jour N… » + ce qui a changé (« hier vous avez voté… »), remercier à voix haute le(s) gagnant(s) par leur pseudo, construction/révélation, puis la nouvelle question (A/B ou proposition) + « Commente… » + « Abonne-toi pour devenir habitant » + « Demain, jour N+1 ». Pas de voix chuchotée.
4. Commit/push, lancer « Voix du jour » (jour N), attendre, git pull → mots.json.
5. Écrire jours/jourN/timeline.json calé sur mots.json (textes au mot près, un plan toutes les 2–4 s, ≥ 3 décors différents). Rendre 6–8 images test avec --cadre, les regarder, corriger (tout le texte dans la zone visible, rien sous le HUD).
6. publication.json (YouTube : titre « … Jour N : … », description, tags), publication.md (TikTok + Instagram, 3 hashtags max, commentaire à épingler), miniature.jpg (image test sans texte + miniature.py).
7. Commit/push, lancer « Publier sur YouTube » (action publier, jour N, heure 18:00), attendre (~25 min), git pull → jours/jourN/video.mp4.
8. Envoyer à l'utilisateur : la vidéo, le résultat du vote, le gagnant, la nouvelle question, les textes TikTok + Instagram prêts à copier.
Si une étape échoue : réparer si possible, sinon prévenir l'utilisateur clairement (ne jamais publier une vidéo cassée).

## Publication YouTube
- Workflow « Publier sur YouTube » (.github/workflows/publier.yml, lancement manuel) : action `verifier` (affiche la chaîne liée au jeton) ou `publier` (rendu + son + envoi + miniature, programmé à l'heure choisie, défaut 18:00 ; publié tout de suite si l'heure est passée).
- publier.py refuse d'envoyer si la chaîne du jeton ne contient pas « Pays de Tous ».
- Secrets : YT_CLIENT_ID / YT_CLIENT_SECRET (client OAuth « Pays de Tous », type Application Web, redirection https://developers.google.com/oauthplayground, dans le projet Google Cloud d'Énigmo), YT_REFRESH_TOKEN (obtenu via OAuth Playground en choisissant la chaîne Le Pays de Tous). Ne jamais toucher au client « Enigmo » (Ordinateur de bureau).
- Claude ne peut ni créer de release ni lire/écrire les secrets depuis ses sessions : la vidéo est refaite dans Actions.

## Journal
- Jour 1 (07.11) : présentation de l'île, appel au nom + drapeau en commentaire, vote 1 : capitale A (plage, port) ou B (pied du volcan, terres fertiles). Vidéo faite (55,6 s), publiée à la main sur TikTok le 07.11 ; YouTube : via le workflow une fois le jeton en place.
- 07.11 soir : projet déplacé depuis enigmo/projets/pays_de_tous vers ce dépôt.
- 07.11 21h : scène pilotable par timeline.json, drapeau généré, capitale, cartes gagnant/résultat/drapeau, voix et commentaires automatiques, tâche quotidienne 16h41. Jour 1 sur YouTube (posté à la main) : 901 vues, 53 abonnés, 0 commentaire YouTube à 20h50.
