#!/usr/bin/env bash
# Bir nechta alohida kadr: ./frames.sh iphone outdir 4.2 8.4 ...
set -e
D=$1; OUT=$2; shift 2
cd "$(dirname "$0")"
for t in "$@"; do
  node render.mjs --device "$D" --from "$t" --to "$(python3 -c "print($t+0.01)")" --fps 100 --scale 0.5 --out "$OUT/f_$t" >/dev/null
  mv "$OUT/f_$t/00000.jpg" "$OUT/${D}_$t.jpg"; rmdir "$OUT/f_$t"
done
