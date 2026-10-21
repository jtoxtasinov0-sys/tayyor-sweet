#!/usr/bin/env bash
# Tez tekshiruv: oraliqni kichik o'lchamda chizib, bitta varaqqa (contact sheet) yig'adi
# ./preview.sh iphone uz 0 6 [fps=4] [cols=6] [scale=0.3] [outdir]
set -e
D=$1; LG=$2; FROM=$3; TO=$4; FPS=${5:-4}; COLS=${6:-6}; SC=${7:-0.3}; OUT=${8:-renders/previews}
cd "$(dirname "$0")"
TMP="$OUT/frames_${D}_${LG}_${FROM}-${TO}"
rm -rf "$TMP"; mkdir -p "$TMP"
node render.mjs --device "$D" --lang "$LG" --from "$FROM" --to "$TO" --fps "$FPS" --scale "$SC" --out "$TMP" >/dev/null
N=$(ls "$TMP" | wc -l); ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -v error -y -framerate "$FPS" -i "$TMP/%05d.jpg" -vf "setpts=PTS+${FROM}/TB,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='%{pts\:hms}':x=6:y=h-th-6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4,tile=${COLS}x${ROWS}:padding=4:margin=4:color=0x202020" -frames:v 1 -q:v 3 "$OUT/sheet_${D}_${LG}_${FROM}-${TO}.jpg"
echo "$OUT/sheet_${D}_${LG}_${FROM}-${TO}.jpg ($N kadr)"
