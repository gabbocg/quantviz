#!/usr/bin/env bash
# check-render.sh — post-render acceptance checks for quantviz deck
set -euo pipefail

OUT="${1:-_site/index.html}"

if [[ ! -f "$OUT" ]]; then
  echo "FAIL: $OUT not found — run quarto render first"; exit 1
fi

# --- Section IDs ---
for n in 00-title 00b-about \
         01-get-data 02-first-plot 03-transform 04-tidy \
         05-workflow 06-dates-ts 07-functions 08-iteration \
         09-capm 10-communicate 11-resources; do
  if ! grep -q "s${n}" "$OUT"; then
    echo "FAIL: missing section id s${n}"; exit 1
  fi
  echo "OK: s${n}"
done

# --- Demo slide IDs ---
for demo in demo-mutate-slide demo-filter-slide demo-pivot-longer-slide \
            demo-pivot-wider-slide demo-ggplot-slide \
            demo-first-plot-1 demo-first-plot-2 demo-first-plot-3 demo-first-plot-4; do
  if ! grep -q "$demo" "$OUT"; then
    echo "FAIL: missing demo id $demo"; exit 1
  fi
  echo "OK: $demo"
done

echo "All checks passed."
