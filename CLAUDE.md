# Le Pays de Tous — contexte pour Claude (à lire en premier)

Série quotidienne : les abonnés construisent un pays sur une île (1 abonné = 1 habitant). Même propriétaire qu'Énigmo (dépôt nidla281219-dev/enigmo : ne rien y mélanger). Il lit sur téléphone : tutoiement, réponses COURTES en français.
Plateformes : YouTube Shorts (envoi automatique), TikTok @le.pays.de.tous et Instagram @lepaysdetous (il publie à la main). Inspiration concept seulement : @gerantduparc.
Autres docs (n'ouvrir QUE si besoin) : docs/TIMELINE.md (format timeline, à l'étape 5), docs/TECHNIQUE.md (organisation, Instagram officiel, secrets YouTube — en cas de panne), docs/JOURNAL.md (historique), banque_questions.md (règles de décision).

## Règles de l'utilisateur
- ZONE VISIBLE : texte et éléments importants dans x 60–960, y 130–1600 ; ligne ≤ 840 px (centre x ≈ 510). Vérifier avec --cadre.
- 2 à 3 questions MAX par vidéo. Vidéo 55–65 s.
- CONSTRUIRE CE QUE LES GENS DEMANDENT, avec le NOM de la personne sur le bâtiment, dit à voix haute. Bâtiments BEAUX et détaillés (jamais des boîtes).
- Habitants visibles quand la voix annonce leur nombre.
- Trésor : 1 like = 1 pièce (likes des 3 vidéos) ; toujours inciter à liker.
- Chiffres TOUS RÉSEAUX CONFONDUS (« au total », « sur tous les réseaux ») mais NE JAMAIS NOMMER une plateforme (vidéo, descriptions, épinglés).
- Vote : compter le NOMBRE de personnes qui proposent la même chose, plus les likes. Chef = candidature la plus likée.
- Pas de voix chuchotée. Secrets uniquement dans GitHub, jamais dans le dépôt ni le chat. Ne jamais scraper avec le compte de l'utilisateur.

## Procédure quotidienne (tâche programmée 14h45, publication 17h00) — ÉCONOMISER LES TOKENS
Ne pas lire les gros fichiers (commentaires_*.json, scene.html, mots.json en entier) : utiliser les scripts et grep.
PARTIE 1
1. N = etat.jour + 1. Lancer commentaires.yml (jour N-1) ; attendre avec UNE seule commande en arrière-plan (pas de vérifications répétées) ; git pull.
2. `python3 studio/compter.py N-1 --opt "A=mots|…" "B=mots|…"` → chiffres par réseau + total, votes, propositions répétées, top commentaires. Lire commentaires_autres.txt s'il existe. Décider (banque_questions.md), mettre à jour etat.json (+ historique court).
3. Écrire jours/jourN/script.md (1re ligne « # titre » ; ~60 s) : « Jour N… », ce qui a changé, merci aux gagnants (pseudo), construction, nouvelle(s) question(s), « Commente… », « Like = pièce pour le trésor », « Abonne-toi pour devenir habitant », « Demain, jour N+1 ». Commit/push.
4. Envoyer à l'utilisateur (court) : chiffres, gagnants, ce qui sera construit, trésor, questions, SCRIPT COMPLET, « Réponds OK pour lancer la vidéo ». ATTENDRE son OK. Sans OK : rien fabriquer.
PARTIE 2 (après OK)
5. Lancer voix.yml (jour N), attendre, git pull. Nouveau bâtiment : le modéliser dans scene.html (comme boulangerie()/universite()). Écrire timeline.json (docs/TIMELINE.md ; partir du timeline de la veille) calé sur mots.json (lire avec un petit script : mot + temps). Rendre et REGARDER seulement 3–4 images test : `cd studio && node render.js --jour N t/f --test a,b,c --cadre`.
6. Miniatures : `node render.js --jour N t/m --test <t> --propre` puis `python3 miniature.py t/m_<t>.jpg ../jours/jourN/miniature_youtube.jpg --style youtube "JOUR N" "*MOT*" "…"` (+ copie miniature.jpg) et `--style tiktok` → miniature_tiktok.jpg. Regarder chaque miniature une fois.
7. publication.json (YouTube : titre ≤ 100 car. « … Jour N : … », description, tags) + publication.md (YouTube / TikTok / Instagram, 3 hashtags max, un commentaire à épingler par réseau). CRÉDITS : gagnant du même réseau → @pseudo ; d'un autre réseau → pseudo sans @ et sans nommer le réseau.
8. Commit/push, lancer publier_rapide.yml (jour N, heure 17:00 ; 6 morceaux en parallèle, ~20 min). Attendre avec UNE commande en arrière-plan. (publier.yml = ancien rendu en un seul morceau, ~1 h, secours.)
9. git pull, envoyer ICI : jours/jourN/video.mp4 + les 2 miniatures, puis les textes prêts à copier. Ajouter 1 ligne à docs/JOURNAL.md.
Si une étape échoue : réparer, sinon prévenir clairement (jamais de vidéo cassée publiée). La miniature YouTube peut être refusée (403) tant que la chaîne n'est pas vérifiée : il la met à la main.
