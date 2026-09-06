# R for Empirical Finance — Quarto Reveal.js Deck

A Quarto Reveal.js deck teaching R to finance students with no prior R. Follows
the arc of *R for Data Science 2e* but every example uses financial data —
stock prices, returns, factor models, CAPM. Renders offline against
committed CSVs (2015–2024 daily bars for AAPL, MSFT, SPY, TLT, GLD +
Fama-French factors).

Features live-executed R chunks (webR), subtle anime.js demo animations
(`mutate`, `filter`, `pivot_longer`, `pivot_wider`, ggplot2 deconstructed),
and a Sandstone-inspired editorial theme.

## Contents

`index.qmd` composes ~12 partials from `sections/`:

| # | Module | R4DS analog |
|---|--------|-------------|
| 0 | Title + about-me | — |
| 0c–0g | Installation, packages, projects, data structures, subsetting | Prelude |
| 1 | Get data (`tidyquant::tq_get` → CSVs) | Import |
| 2 | First plot (ggplot2 grammar) | Visualize |
| 3 | Transform (`mutate`, `filter`, `group_by`) | Transform |
| 4 | Tidy (`pivot_longer` / `pivot_wider`) | Tidy |
| 5 | Workflow (pipes, project structure) | Workflow |
| 6 | Dates & time series (`lubridate`, `zoo`) | — |
| 7 | Functions (`sharpe_ratio`, `max_drawdown`) | Program |
| 8 | Iteration (`purrr::map_dfr` over tickers) | Iteration |
| 9 | CAPM regression (`lm`, `broom::tidy`) | Model |
| 10 | Communicate (Quarto reports, `gt`) | Communicate |
| 11 | Resources | — |

## Bootstrap

```bash
# 1. Restore R dependencies (run once, in R)
R -e 'install.packages("renv"); renv::restore()'

# 2. Render the deck
quarto render

# 3. Live preview while editing
quarto preview
```

Output goes to `_site/index.html`.

## Layout

```
index.qmd              Deck entry point
_quarto.yml            Reveal.js format, webR filter, theme wiring
sections/              Module partials + demo fragments
assets/
  theme.scss           Sandstone-inspired palette + demo styling
  animations.js        anime.js engine + dispatch
  js/*-anim.{js,html}  Per-demo animation modules
  head.html            Fonts + anime.js
  vendor/              Pinned anime.min.js
data/                  Committed CSVs (see data/README.md)
scripts/
  refresh-data.R       Re-pull data from Yahoo + FF
  check-render.sh      Post-render acceptance checks
docs/superpowers/      Design specs + plans
```

## Verifying a build

```bash
./scripts/check-render.sh
```

Checks that all module and demo slide IDs made it into `_site/index.html`.
