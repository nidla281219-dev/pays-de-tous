# Outils disponibles (catalogue) — liberté totale sur la façon de faire la vidéo
Ce fichier liste seulement CE QUI EXISTE. Aucune méthode imposée : style, format, durée, montage, outils externes… au choix.

- VOIX (ElevenLabs, voix de la chaîne) : dossier jours/jour<nom>/script.md (1re ligne « # titre », puis le texte) → `gh api -X POST repos/nidla281219-dev/pays-de-tous/actions/workflows/voix.yml/dispatches -f ref=main -f 'inputs[jour]=<nom>'` → voix.mp3 + mots.json (temps de chaque mot). La fonction tts() de studio/voix.py peut aussi servir dans un autre workflow (secret ELEVENLABS_API_KEY).
- MOTEUR 3D de l'île de Vulkaris (Three.js, rendu image par image) : studio/scene.html + studio/render.js (`node render.js --jour <nom> sortie.mp4 [--test t1,t2] [--cadre] [--propre]`), format décrit dans docs/TIMELINE.md. Rendu rapide en 6 morceaux : workflow publier_rapide.yml (envoyer=non pour ne rien publier).
- MAISONS DES ACHETEURS identiques au site : studio/vitrines.py, studio/vitrine_maison.js.
- SONS : sons/lib + sons/earshot (whoosh, pop, foule, canon, vagues… liste dans studio/mix.py), musique sons/musique_epic_score.mp3, mixage studio/mix.py.
- IMAGES : studio/miniature.py (miniatures, options --zoom/--cercle/--fleche), studio/recap_carrousel.py (carrousels), studio/passeport.py, assets/ (site_demo.mp4…).
- YOUTUBE : studio/publier.py + publier.yml (verifier, publier, maintenant, supprimer, lien). Secrets YT_* dans GitHub.
- Machine : ffmpeg, Python (PIL…), Node, Chromium/Playwright déjà installés ; GitHub Actions pour les calculs longs.

Seules règles : secrets uniquement dans GitHub (jamais dans le chat ni le dépôt) ; ne pas toucher aux épisodes quotidiens (jours/jourN, etat.json) ; ne rien publier sans l'accord de l'utilisateur.
