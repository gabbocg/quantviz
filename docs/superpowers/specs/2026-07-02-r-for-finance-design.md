# R for Finance Deck — Design Spec

**Date:** 2026-07-02
**Status:** Approved (pending spec review)
**Owner:** Gabriel Cabrera

## 1 · Purpose & Scope

Pivot the current "Intro to R" Quarto Reveal.js deck into an **R for Finance** deck. Structure follows the core arc of *R for Data Science 2e* (Wickham, Çetinkaya-Rundel, Grolemund) but every example uses financial data: stock prices, returns, factor models, portfolio metrics.

The deck must:

- **Reuse** the existing infrastructure — theme (Sandstone-inspired, white bg, editorial syntax), animation engine, all five Emil-style demo animations (`mutate`, `filter`, `pivot_longer`, `pivot_wider`, ggplot2-deconstructed), footer + ORCID + about-me slide
- **Replace** all module content with 10 finance-flavored modules following R4DS core order
- **Remove** every "Module N · Recap" slide from the existing content (user directive)
- **Render deterministically offline** — no live API calls at render time; committed CSVs under `data/`
- Assume audience is **finance students with no prior R** — start from data-loading basics, build up to CAPM

Out of scope: quizzes, exercises, backtesting frameworks, multi-language support, mobile-tuned layout, CI workflows.

## 2 · Audience & Data

**Audience:** MSc / senior BSc finance students. Assumes finance vocabulary (returns, volatility, CAPM, alpha, beta) and math (linear regression). Does NOT assume R, RStudio, or programming.

**Data:**

| File | Content | Approx. size |
|------|---------|-------------|
| `data/AAPL.csv` | Apple daily OHLCV + adjusted close | ~200 KB |
| `data/MSFT.csv` | Microsoft daily OHLCV + adjusted close | ~200 KB |
| `data/SPY.csv` | S&P 500 ETF daily OHLCV + adjusted close (market proxy) | ~200 KB |
| `data/TLT.csv` | Long Treasury ETF daily OHLCV + adjusted close (bond proxy) | ~200 KB |
| `data/GLD.csv` | Gold ETF daily OHLCV + adjusted close (commodity proxy) | ~200 KB |
| `data/ff_factors.csv` | Fama-French 3-factor daily data (`Mkt-RF`, `SMB`, `HML`, `RF`) | ~150 KB |
| `data/README.md` | Provenance, date range, columns, refresh instructions | — |

**Date range:** 2015-01-01 → 2024-12-31 (~2500 daily observations per ticker). Covers COVID-era volatility, useful for risk teaching.

**Data provenance:** Yahoo Finance via `tidyquant::tq_get()`, downloaded once by `scripts/refresh-data.R` and committed to `data/`. Slides read via `readr::read_csv()` — no network at render time.

## 3 · Content Map (12 partials, ~10 content modules)

Each partial is one `sections/NN-*.qmd` file. No recap slides.

| # | File | R4DS analog | Finance content | Reused animation |
|---|------|-------------|-----------------|------------------|
| 0 | `00-title.qmd` | — | "R for Finance" title | none |
| 0b | `00b-about-me.qmd` | — | Existing about-me slide, kept as-is | none |
| 1 | `01-get-data.qmd` | Import (§7) | `tidyquant::tq_get()` shown, then load committed CSVs; introduce the 5 tickers | none |
| 2 | `02-first-plot.qmd` | Visualize (§2) | Price time series intro; ggplot2 grammar | **ggplot2 deconstructed** — retargeted to `close ~ date`, colored by ticker (AAPL, SPY, GLD) |
| 3 | `03-transform.qmd` | Transform (§4) | `mutate` returns, `filter` by ticker + date, `group_by`+`summarise` for per-asset stats | **mutate demo** (log-return calc), **filter demo** (`ticker == "AAPL", date >= "2024-01-01"`) |
| 4 | `04-tidy.qmd` | Tidy (§5) | Wide panel (one col per ticker) ↔ long panel | **pivot_longer demo**, **pivot_wider demo** (retargeted to price panels) |
| 5 | `05-workflow.qmd` | Workflow (§3, §6) | Pipes `|>` and `%>%`, code style, project structure | none |
| 6 | `06-dates-timeseries.qmd` | (folded into R4DS ch 17) | `lubridate`, `zoo::rollmean`, `xts` vs `tibble` briefly | none |
| 7 | `07-functions.qmd` | Program (§25) | Write `sharpe_ratio()`, `max_drawdown()`, `annualise()` | none |
| 8 | `08-iteration.qmd` | Iteration (§26) | `purrr::map_dfr` over the 5 tickers to compute per-asset metrics | none |
| 9 | `09-capm.qmd` | Model (light) | `lm(excess ~ mkt_excess)` on SPY/AAPL, `broom::tidy`, α + β interpretation | none |
| 10 | `10-communicate.qmd` | Communicate (§29) | Quarto reports of a mini portfolio analysis; `gt::gt` for tables | none |
| 11 | `11-resources.qmd` | — | R4DS, Advanced R, *Reproducible Finance with R* (Regenstein), tidyquant docs, Fama-French factor library | none |

**Total: ~50 slides** (title + about + 10 modules × ~4 slides each + resources). No recaps.

**Sub-slide pattern per module:**
1. Module hero (H1, gradient badge)
2. 1–3 content slides (concept + live R chunk showing real output)
3. Optional demo animation (for modules 2, 3, 4)

## 4 · Infrastructure Reuse

### 4.1 Kept unchanged (no edits required)

- `_quarto.yml` — theme, footer `gcabrerag.rbind.io`, transitions, controls, navigation-mode: linear
- `assets/theme.scss` — Sandstone palette, code-block chrome, all demo class styling (`.fi-*`, `.mu-*`, `.pl-*`, `.pw-*`, `.gg-*`)
- `assets/head.html` — Google Fonts (Roboto + JetBrains Mono), anime.js v4 CDN + vendor fallback
- `assets/animations.js` / `animations.html` — 8-effect engine, dispatch, TM.gate infrastructure (via `mutate-anim.js` etc.)
- All five `assets/js/*-anim.js` + wrappers — mutate, filter, pivot_longer, pivot_wider, ggplot deconstructed. Only their `window.*_DATA` config globals in the qmd files change; the JS logic stays 1:1
- `assets/syntax.theme` — 3-color editorial R syntax
- ORCID / title-slide / footer CSS overrides
- `.gitignore`, `renv.lock`, `_freeze/` conventions

### 4.2 New dependencies added to `renv.lock`

- `tidyquant` — used only by `scripts/refresh-data.R` at CSV download time (not needed at render)
- `lubridate` — dates (§6)
- `broom` — `tidy()` on `lm()` output (§9)
- `PerformanceAnalytics` — reference implementations of Sharpe, drawdown (§7 shows how to write your own then compares)
- `gt` — polished tables in the Communicate module (§10)

Installed via `renv::install(...)` then `renv::snapshot(prompt = FALSE)`.

### 4.3 Deleted (or renamed / rewritten in place)

| Old file | Action |
|----------|--------|
| `sections/00-title.qmd` | Rewrite: R for Finance title (keep hero style) |
| `sections/00b-about-me.qmd` | Keep as-is |
| `sections/01-installation.qmd` … `16-resources.qmd` | Delete all 16 original section partials |
| `sections/demo-mutate.qmd` | Keep file; rewrite `window.MU_DATA` block with finance data |
| `sections/demo-filter.qmd` | Keep file; rewrite `window.FI_DATA` + `FI_HITS` blocks |
| `sections/demo-pivot-longer.qmd` | Keep file; rewrite `window.PL_DATA` block |
| `sections/demo-pivot-wider.qmd` | Keep file; rewrite `window.PW_LONG_DATA` block |
| `sections/demo-ggplot.qmd` | Keep file; retarget ggplot animation module to price time series |
| All "Module N · Recap" slides in kept files | Remove (user directive) |

### 4.4 New files created

```
data/
├── AAPL.csv MSFT.csv SPY.csv TLT.csv GLD.csv
├── ff_factors.csv
└── README.md
scripts/
└── refresh-data.R      # tidyquant::tq_get() once, writes CSVs
sections/
├── 01-get-data.qmd
├── 02-first-plot.qmd    # embeds retargeted demo-ggplot
├── 03-transform.qmd     # embeds retargeted demo-mutate + demo-filter
├── 04-tidy.qmd          # embeds retargeted pivot demos
├── 05-workflow.qmd
├── 06-dates-timeseries.qmd
├── 07-functions.qmd
├── 08-iteration.qmd
├── 09-capm.qmd
├── 10-communicate.qmd
└── 11-resources.qmd
```

`index.qmd` — update the `{{< include >}}` list to point at the 12 new files instead of the 17 old ones.

`scripts/check-render.sh` — update section-id greps to `s01-get-data … s11-resources`.

## 5 · Animation Retargeting (data-only edits)

The five demo animations reuse their existing JS modules. Only the inline `<script>window.*_*</script>` blocks inside each `sections/demo-*.qmd` change.

### 5.1 `mutate` demo → log returns

- Left table: 6 rows, columns `date | close` (2024-01-02 … 2024-01-09, AAPL closes)
- Right table: 6 rows, columns `date | log_return`
- Code line: `mutate(log_return = log(close / lag(close)))` — substring `log(close / lag(close))` highlighted navy
- `TRANSFORM` function: `function(x, prev) { return Math.log(x/prev).toFixed(4); }` (approximate — first row is NA)

### 5.2 `filter` demo → ticker + date filter

- Data: 9 rows spanning 3 tickers × 3 dates
- Conditions: `ticker == "AAPL"` (navy), `date >= "2024-01-01"` (brick)
- 3 rows survive both

### 5.3 `pivot_longer` demo → wide prices → long

- Left (wide): 3 dates × (AAPL, MSFT, SPY) — 3 rows × 4 cols
- Right (long): 9 rows × (date, ticker, close)
- Ticker colors: AAPL navy, MSFT brick, SPY olive

### 5.4 `pivot_wider` demo → long returns → wide

- Left (long): 9 rows × (date, ticker, log_return)
- Right (wide): 3 rows × (date, AAPL, MSFT, SPY)
- Same ticker colors

### 5.5 ggplot2 deconstructed → price time series

- Coord layer: date on x, price on y, 3 tickers as color scale (AAPL, SPY, GLD)
- Points layer → **line segments** (`geom_line` semantics)
- Smooth layer: `geom_smooth(method = "loess")` — a slow moving trend
- Labs: title "Daily closing prices (2015–2024)", x = "Date", y = "Close (USD)", color = "Ticker"
- Data: ~50 monthly-sampled points per ticker so the SVG stays performant

## 6 · Build & Render Workflow

Unchanged from the current deck:

```yaml
project:
  render: ["index.qmd"]
  output-dir: _site
format:
  revealjs:
    theme: [default, assets/theme.scss]
    footer: "[gcabrerag.rbind.io](https://gcabrerag.rbind.io)"
    navigation-mode: linear
    # ... (as-is)
execute:
  freeze: auto
```

- `quarto preview` — live-reload while editing
- `quarto render` — one-shot build
- `./scripts/check-render.sh` — updated to grep for `s01-get-data … s11-resources` and confirm the five retargeted demo IDs are present
- `_freeze/` caches R chunks so rebuilds only re-execute changed code

## 7 · Acceptance Criteria

Work is done when **all** of the following hold:

- `quarto render` exits 0 from a clean checkout (after `renv::restore()`)
- `./scripts/check-render.sh` passes with the updated section-id list
- All 10 module heroes render with badge + title
- No "Recap" heading appears anywhere in `_site/index.html`
- All five demo animations play correctly with finance data — arrows draw, code substring highlights match cell colors, `mutate` computes real log-returns, ggplot2 tilt/explode works
- Live R chunks show real output (not stale) — spot-check §9 CAPM shows real α, β, R² for SPY-vs-AAPL

## 8 · Out of Scope (Explicit YAGNI)

- Backtesting engine or trading strategies beyond CAPM
- Options / derivatives math
- Cryptocurrency data
- Live API calls at render time
- Multi-language versions
- Extended time series methods (ARIMA, GARCH) — mentioned only in Resources
- Bootstrap / Monte Carlo simulation
- Machine learning / tidymodels (folded into "Resources" as a pointer)
- CI/CD workflow beyond the existing `check-render.sh`
- Per-slide speaker notes
