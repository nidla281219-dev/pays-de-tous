# Jeu Vulkaris — brief (à lire en premier dans la discussion « jeu »)

But : un jeu où les abonnés se promènent dans Vulkaris, discutent, vivent des événements. Les acheteurs de maisons (Fondateurs) y ont leur maison et des avantages promis (boutique/LISEZMOI.md : bêta-test, maison dans le jeu, nom doré + badge, n° de Fondateur, passeport, Mur des Fondateurs).

## Choix validés (15.11)
- Jeu WEB d'abord (navigateur mobile, Three.js), plus tard emballé avec Capacitor pour Play Store / App Store (même code).
- Pas de Fable (forfait 20 €) : petites étapes, l'utilisateur teste sur son téléphone et répond en une ligne.
- Discussion séparée de l'épisode quotidien (tâche 14h45 à ne pas gêner).

## Feuille de route
1. **ÉTAPE 1 (faite 15.11, en test)** — https://lepaysdetous.github.io/jeu/ — reconstruire après une vente ou un nouveau jour : `python3 studio/jeu_build.py` (lit scene.html + dernier timeline.json + boutique/index.html + ventes.json, sans e-mails) puis commit/push du site. Code du jeu : studio/jeu/jeu.js. Les Hauts : 8 parcelles le long d'une avenue (achetées + « À vendre »), à agrandir au-delà de 8 ventes.
   15.11 après-midi (retour utilisateur) : persos à l'échelle des portes (1,9), collisions solides calculées depuis la géométrie (grille 2,5D murs+sols : haies, fontaines, murs, arbres), caméra qui ne traverse plus les murs, sol texturé (herbe/sable) + grain sur les bâtiments + ombres, chemins A* ville → chaque lieu (ponts sur la rivière, panneaux au bout des rues).
   17.11 (retour : sol médiocre, maisons mal placées, on tombe sans remonter) : terrain aplani sous chaque bâtiment (emprise mesurée au 1er passage de setup, socles au niveau de la ville), bâtiments de la place redistribués entre les rues, ville plus plate, sol peint par pixel (herbe/terre/roche/sable/lave selon pente et hauteur), touffes d'herbe + fleurs autour du joueur, vraie eau dans la rivière creusée, terrain toujours remontable + déblocage auto. Test « pièges » (BFS aller/retour sur la grille de collision) : 1388 → 5 cases.
   17.11 matin — ÉTAPE TERRAIN (choix utilisateur : île du jeu SÉPARÉE des vidéos, ×4 en surface, « les vidéos = la maquette, le jeu = le réel », même structure mais beaucoup plus beau ; on avance par étapes) : height0/riverDist redéfinis dans jeu.js (ECH = 2, DEMI = 640), positions des vidéos ×2, sol en 8×8 morceaux (2,7 m), forêts régénérées (4×4 groupes), digues qui relient les bâtiments du bord de mer à la côte. Prochaines étapes à décider avec lui : ville, Hauts, grands bâtiments (refaits plus beaux). Bouton 🐞 : code V1:x:z:y:yaw:pitch:dist, ouvrir /jeu/?ici=CODE pour s'y placer.
   17.11 — ÉTAPE VILLE (choix : détails dehors + intérieurs visitables + plus grands/réalistes + vie autour + textures) : studio/jeu/ville.js (construireBoutique = RDC pierre visitable + 2 étages enduit, balcon, store, enseigne lumineuse, intérieur par type, terrasse ; construireVille = place pavée, fontaine à 2 vasques, massifs, bancs, lampadaires, rues pavées + trottoirs, voitures garées) ; textures procédurales triplanaires (brique, enduit, pierre, tuiles, bois, pavés, dalles, carrelage). Restent : maisons de la ville (ancien style), habitants, hôpital et grands bâtiments.
   26.11 — NOUVEAU TERRAIN (semi-réaliste) : relief refait (plaine autour de la ville, collines arrondies, falaises au nord-est, coulées de lave, vallée de rivière douce), textures Kie.ai (workflow kie_images.yml + studio/kie_images.py + studio/jeu/textures.json ; secret KIE_API_KEY) mélangées par pente/hauteur/eau/volcan/chemins avec anti-répétition, mer en shader (vagues, turquoise selon la profondeur, écume), rivière continue qui coule (rapides écumeux), lave dans le cratère, rochers + buissons. Règle ajoutée : sur un socle, le terrain = hauteur exacte du socle (un socle voisin ne la modifie plus). Kie.ai = images/vidéo/musique, PAS de 3D (pour les modèles 3D : Higgsfield/Meshy/Tripo).
   27.11 — MODÈLES 3D HIGGSFIELD (MCP connecté, forfait Plus) : test boulangerie + habitant animé + arbre (Meshy 6 texte→3D, 25 crédits chacun). Le dossier de l'espace de travail ne peut PAS télécharger les GLB (cloudfront bloqué) → workflow modeles_3d.yml (nom=url…) les télécharge, les allège (gltf-transform : quantize + textures webp 1024) et les range dans studio/jeu/modeles/ ; jeu_build les copie + GLTFLoader/SkeletonUtils (studio/jeu/lib, importmap). Attention : attributs quantifiés → convertir en flottants avant d'appliquer une matrice (sinon écrêtage). Boulangerie = modèle + emprise invisible (règles de pose) + enseigne au nom ; 16 habitants animés autour de la place ; le joueur utilise aussi le modèle.
   Demande initiale : balade solo sur mobile. Joystick tactile + glisser pour tourner la caméra, perso tête ronde, la ville (décor de studio/scene.html) + les Hauts de Plavulca avec les maisons achetées (code exact de boutique/index.html : maison(), terrain(), opts(), statue(), panneauNom() ; liste VENDUES + choix dans boutique/ventes.json). Fluide sur téléphone moyen (peu d'ombres, géométries fusionnées, pixelRatio ≤ 1.5). Hébergé sur le site : Lepaysdetous/lepaysdetous.github.io → page /jeu/. Lien à envoyer à l'utilisateur.
2. Multijoueur : voir les autres en temps réel (serveur WebSocket, ex. Colyseus/PartyKit), pseudo au-dessus de la tête, phrases toutes faites + émotes (pas de chat libre au début : modération).
3. Comptes, pièces, métiers, votes en jeu, nom doré des Fondateurs.
4. Événements (feu d'artifice, élection, marché…).
5. Stores (Capacitor) : signaler/bloquer, suppression de compte, classification d'âge, règles d'achat in-app à vérifier.

## Règles de pose des bâtiments dans le jeu (17.11, demande utilisateur : jamais dans le sol ni en l'air)
1. Le TERRAIN s'adapte au bâtiment, jamais l'inverse : chaque bâtiment (grands bâtiments, boutiques, maisons de la ville, Hauts) a un socle de terrain plat à sa hauteur de base sur toute son emprise + 1 m, raccordé en pente douce (`socle()` dans studio/jeu/jeu.js).
2. Aucun chevauchement : les boutiques de la place sont réparties entre les rues (largeurs mesurées côté place), les maisons de la ville qui touchent un bâtiment sont retirées.
3. Rien dans l'eau sauf bateau/port ; un bâtiment au bord de mer est relié à la côte par une digue qui ne touche jamais un socle.
4. Contrôle automatique au chargement : `window.CONTROLE` (en l'air / enfoncé / dans l'eau / chevauchement) DOIT être vide avant de publier, + test « pièges » (BFS) = 0. Tout nouveau bâtiment du jeu passe par ces règles.

## Règles
- Ne JAMAIS lire scene.html (110 Ko) ou index.html (130 Ko) en entier : grep les fonctions, extraire avec un script.
- Secrets uniquement dans GitHub/Vercel. Tutoiement, réponses courtes en français.

### 27.11 — Perso simple + mouvements
- Nouveau perso joueur Higgsfield (chibi « jouet ») : modeles/perso.glb (repos) + perso_marche / perso_course / perso_saut (même squelette, avance du bassin supprimée).
- Mouvements : accélération/freinage progressifs, marche lente → marche → course selon le joystick, animations mélangées et calées sur la vitesse, demi-tours doux, saut (bouton ⤴ / Espace) avec gravité, caméra plus douce.
- Bug corrigé : dt négatif au chargement faisait monter le perso dans le ciel au départ.
