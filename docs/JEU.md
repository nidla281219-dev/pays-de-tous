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
