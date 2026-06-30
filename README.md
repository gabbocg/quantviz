# Intro to R — Quarto Reveal.js Deck

English-language Quarto Reveal.js port of the *Introduction to R* course
originally delivered at Universidad de Chile (2021). 17 modules covering R/RStudio
setup through tidyverse, with live-executed R chunks and subtle anime.js animations.

## Bootstrap

```bash
# 1. R dependencies (run once, in R)
R -e 'install.packages("renv"); renv::restore()'

# 2. Render the deck
quarto render

# 3. Live preview while editing
quarto preview
```

Output goes to `_site/`. The deck entry point is `index.qmd`; module partials
live under `sections/`.

## Verifying a build

```bash
./scripts/check-render.sh
```

See `docs/superpowers/specs/2026-06-30-quarto-revealjs-r-deck-design.md` for the
full design.
