# Site / boutique — brief (à lire en premier dans la discussion « site »)

Site public : https://lepaysdetous.github.io (dépôt Lepaysdetous/lepaysdetous.github.io, GitHub Pages ; Vercel pour api/panier.js).
Source de la boutique : boutique/index.html (ici) → copiée vers le site par `python3 boutique/vers_site.py`, puis commit/push du dépôt du site.
Tout le détail (prix, Stripe, Vercel, ventes, Fondateurs, passeports) : boutique/LISEZMOI.md.

## Repères
- Paiement : Stripe (liens + API panier exact sur Vercel : api/panier.js, clé STRIPE_KEY dans Vercel/GitHub, jamais dans le chat).
- Panier gardé dans localStorage (vulkaris-panier-v1). Stats : GoatCounter « lepaysdetous ».
- Parcelles vendues : constante VENDUES dans index.html (+ ventes.yml → boutique/ventes.json, sans e-mails).
- Page /jeu/ : le jeu (voir docs/JEU.md), ne pas casser.
- Confidentialité : confidentialite.html (consentement e-mails).

## Règles
- Mobile d'abord (l'utilisateur teste sur téléphone), marge 90 %, barre panier compacte.
- Ne JAMAIS lire index.html (130 Ko) en entier : grep, extraire avec un script.
- Tester l'API avec test_boutique.yml après un changement de prix/panier. Ne jamais casser le paiement en production.
- Toujours dire que tout reste gratuit, l'argent finance le jeu Vulkaris.
- Tutoiement, réponses courtes en français.
