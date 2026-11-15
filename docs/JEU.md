# Jeu Vulkaris — brief (à lire en premier dans la discussion « jeu »)

But : un jeu où les abonnés se promènent dans Vulkaris, discutent, vivent des événements. Les acheteurs de maisons (Fondateurs) y ont leur maison et des avantages promis (boutique/LISEZMOI.md : bêta-test, maison dans le jeu, nom doré + badge, n° de Fondateur, passeport, Mur des Fondateurs).

## Choix validés (15.11)
- Jeu WEB d'abord (navigateur mobile, Three.js), plus tard emballé avec Capacitor pour Play Store / App Store (même code).
- Pas de Fable (forfait 20 €) : petites étapes, l'utilisateur teste sur son téléphone et répond en une ligne.
- Discussion séparée de l'épisode quotidien (tâche 14h45 à ne pas gêner).

## Feuille de route
1. **ÉTAPE 1 (faite 15.11, en test)** — https://lepaysdetous.github.io/jeu/ — reconstruire après une vente ou un nouveau jour : `python3 studio/jeu_build.py` (lit scene.html + dernier timeline.json + boutique/index.html + ventes.json, sans e-mails) puis commit/push du site. Code du jeu : studio/jeu/jeu.js. Les Hauts : 8 parcelles le long d'une avenue (achetées + « À vendre »), à agrandir au-delà de 8 ventes.
   Demande initiale : balade solo sur mobile. Joystick tactile + glisser pour tourner la caméra, perso tête ronde, la ville (décor de studio/scene.html) + les Hauts de Plavulca avec les maisons achetées (code exact de boutique/index.html : maison(), terrain(), opts(), statue(), panneauNom() ; liste VENDUES + choix dans boutique/ventes.json). Fluide sur téléphone moyen (peu d'ombres, géométries fusionnées, pixelRatio ≤ 1.5). Hébergé sur le site : Lepaysdetous/lepaysdetous.github.io → page /jeu/. Lien à envoyer à l'utilisateur.
2. Multijoueur : voir les autres en temps réel (serveur WebSocket, ex. Colyseus/PartyKit), pseudo au-dessus de la tête, phrases toutes faites + émotes (pas de chat libre au début : modération).
3. Comptes, pièces, métiers, votes en jeu, nom doré des Fondateurs.
4. Événements (feu d'artifice, élection, marché…).
5. Stores (Capacitor) : signaler/bloquer, suppression de compte, classification d'âge, règles d'achat in-app à vérifier.

## Règles
- Ne JAMAIS lire scene.html (110 Ko) ou index.html (130 Ko) en entier : grep les fonctions, extraire avec un script.
- Secrets uniquement dans GitHub/Vercel. Tutoiement, réponses courtes en français.
