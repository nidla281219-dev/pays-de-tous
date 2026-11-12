"""Copie boutique/index.html vers le site public (dépôt Lepaysdetous/lepaysdetous.github.io) avec l'enveloppe HTML complète.
python boutique/vers_site.py /chemin/lepaysdetous.github.io  (puis commit + push dans ce dépôt)"""
import sys, os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')).read().replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
i = src.index('<style>'); j = src.index('</style>') + len('</style>')
head = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="description" content="Achète ta maison sur l\'île de Vulkaris : choisis ta parcelle, personnalise ta maison en 3D, et elle apparaît dans une vidéo du Pays de Tous.">\n')
open(os.path.join(sys.argv[1], 'index.html'), 'w').write(head + src[:j] + '\n</head>\n<body>\n' + src[j:] + '\n</body>\n</html>\n')
