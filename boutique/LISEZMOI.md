# Boutique « Les Hauts de Plavulca » (maisons payantes)
SITE PUBLIC : https://lepaysdetous.github.io (dépôt public Lepaysdetous/lepaysdetous.github.io, GitHub Pages). Après chaque modification de boutique/index.html : le copier dans ce dépôt (index.html = même contenu entouré de <!doctype html><html lang="fr"><head>…</head><body>…</body></html>), puis push.
Page : boutique/index.html (publiée en artifact claude.ai). Commerces de la ville = toujours gratuits (votes).
- Maisons : cabane 1,99 · petite 2,99 · grande 4,99 · villa 7,99 (+0,50 € tous les 10 terrains vendus).
- Terrain : forêt (lots 1–16) inclus · centre (17–32) +0,99 · bord de mer (33–48) +2,99.
- Options : jardin 0,99 · drapeau 0,99 · voiture+garage 1,99 · fontaine 1,99 · piscine 2,99 · feu d'artifice 1,99 · statue 9,99 (pose, matière, accessoire, plaque).
- Stripe : 1 lien de paiement par maison (EUR), options + suppléments de terrain en « articles facultatifs », champs perso : pseudo, nom boîte aux lettres, texte de la plaque.
- client_reference_id = P<lot>-<maison>-<style>-<façade>-<toit>-<volets>-<clôture>-<options séparées par _ ou x>-<S_pose_matière_accessoire ou x>
- Après chaque vente : ajouter le lot dans VENDUES (index.html), republier ; construire la maison dans le quartier (à modéliser dans scene.html avec le même code que l'aperçu).
- L'argent récolté sert à développer notre propre jeu (dit sur la page).
