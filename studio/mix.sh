# bash mix.sh [N] → mixe la voix du jour N + musique + whooshs sur pays_jN_video.mp4 → le_pays_de_tous_jourN.mp4
# (les instants des whooshs/pops ci-dessous sont ceux du jour 1 : à recaler pour chaque nouveau jour)
set -e
J=${1:-1}
S=../sons
V=../jours/jour$J/voix.mp3
M=$S/musique_epic_score.mp3
W1=$S/swipe_whoosh_b7ae.wav; P=$S/pop_01_b715.wav
args=(-i pays_j${J}_video.mp4 -i $V -i $M)
f="[1:a]apad[vo];[2:a]volume=0.13,afade=t=in:d=1.5,afade=t=out:st=53.5:d=2[mu]"
n=3; mixin="[vo][mu]"
for t in 2.9 6.8 7.9 8.9 10.1 12.2 15.3 17.9 21.6 24.3 30.6 33.8 36.8 40.4 44.3 48.5 51.1; do args+=(-i $W1); ms=$(python3 -c "print(int(max(0,$t-0.15)*1000))"); f="$f;[$n:a]volume=0.35,adelay=$ms|$ms[s$n]"; mixin="$mixin[s$n]"; n=$((n+1)); done
for t in 25.0 25.3 25.6 25.9 34.0 48.5 52.6; do args+=(-i $P); ms=$(python3 -c "print(int(($t)*1000))"); f="$f;[$n:a]volume=0.5,adelay=$ms|$ms[s$n]"; mixin="$mixin[s$n]"; n=$((n+1)); done
f="$f;${mixin}amix=inputs=$((n-1)):normalize=0:duration=first,atrim=0:55.9,loudnorm=I=-14:TP=-1.5[a]"
ffmpeg -v error -y "${args[@]}" -filter_complex "$f" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest le_pays_de_tous_jour$J.mp4
