#!/usr/bin/env bash
# Qo'llanma videolarini to'liq yig'ish: kadrlar → ovoz → ovoz balandligini me'yorlash → mp4 + muqova rasmlari.
# Natija: miniapp/public/video/ilova-<iphone|samsung>-<uz|ru>.mp4, .jpg (sayt muqovasi), -thumb.jpg (Telegram)
# Ishlatish: ./build.sh [posters]   — "posters" faqat muqovalarni chizadi (sahifa rasmlarini olishdan oldin kerak)
set -uo pipefail
cd "$(dirname "$0")"
OUT=../miniapp/public/video
TMP=${TMPDIR:-/tmp}/ilova-video
mkdir -p "$OUT" "$TMP"

one() {
  local D=$1 LG=$2 N=ilova-$1-$2
  # muqova: intro kadri (logo + sarlavha)
  node render.mjs --device $D --lang $LG --from 1.6 --to 1.61 --fps 100 --out "$TMP/$N-poster" >/dev/null
  ffmpeg -v error -y -i "$TMP/$N-poster/00000.jpg" -vf scale=720:-2 -q:v 4 "$OUT/$N.jpg"
  ffmpeg -v error -y -i "$TMP/$N-poster/00000.jpg" -vf scale=180:-2 -q:v 5 "$OUT/$N-thumb.jpg"
  [ "$POSTERS" = 1 ] && return

  node render.mjs --device $D --lang $LG --mp4 "$TMP/$N-video.mp4" --cues "$TMP/$N.json" >/dev/null
  python3 audio.py "$TMP/$N.json" "$TMP/$N.wav" >/dev/null
  # ovoz balandligi: -15 LUFS, eng baland nuqta -1.5 dBTP (ikki bosqichli loudnorm)
  local M AF
  M=$(ffmpeg -hide_banner -i "$TMP/$N.wav" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  get() { echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
  AF="loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000"
  ffmpeg -v error -y -i "$TMP/$N-video.mp4" -i "$TMP/$N.wav" -map 0:v -map 1:a -af "$AF" \
    -c:v libx264 -preset slow -crf 26 -profile:v high -pix_fmt yuv420p -r 30 \
    -c:a aac -b:a 128k -ar 48000 -movflags +faststart -shortest "$OUT/$N.mp4"
  echo "✓ $OUT/$N.mp4 ($(du -h "$OUT/$N.mp4" | cut -f1))"
}

POSTERS=0
[ "${1:-}" = posters ] && POSTERS=1
# 4 ta video parallel (har biri alohida Chromium)
for D in iphone samsung; do
  for LG in uz ru; do one $D $LG & done
done
wait
