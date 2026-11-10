#!/bin/sh
# Régénère assets/sfx_earshot/ avec la banque de sons d'earshot (https://github.com/Leonxlnx/earshot, MIT), sans modèle ni réseau.
# Installation : git clone https://github.com/Leonxlnx/earshot && cd earshot && python -m venv .venv && .venv/bin/pip install -e .
# Usage : EARSHOT=/chemin/earshot/.venv/bin/python sh pipeline/sfx_earshot.sh
E=$(dirname "$0")/../sons/earshot; PY=${EARSHOT:-python}
for pair in pop:pro_pop/bloop pop:pro_pop/boop pop:pro_pop/thup pop:pro_pop/tink pop:pro_pop_in/round pop:pro_pop_in/deep pop:ui_pop/soft pop:ui_pop/wide \
  hit:pro_impact/deep hit:pro_impact/short hit:pro_impact/rumble hit:cut_hit/punch hit:cut_hit/sub chime:pro_notify/ding_1930 chime:pro_notify/ding_2167 \
  chime:mallet/glock tick:pro_hover_tick/detent tick:knock/wood riser:riser/tension riser:riser/dark riser:reverse_swell/dark drop:sub_drop/pro \
  whoosh:whoosh_fast/tight whoosh:whoosh_big/thump; do
  role=${pair%%:*}; id=${pair#*:}; mkdir -p "$E/$role"
  $PY -m earshot sfx render "$id" -o "$E/$role/earshot_$(echo "$id" | tr / _).wav"
done
