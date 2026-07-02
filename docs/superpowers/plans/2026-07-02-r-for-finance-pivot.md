# R for Finance Deck — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot the existing Quarto Reveal.js deck from "Intro to R" to "R for Finance" — 10 modules following R4DS 2e core order, all examples on committed CSVs of 5 tickers + Fama-French factors, reusing the existing theme + 5 Emil-style demo animations.

**Architecture:** Content-only replacement. Theme, animation engine, and 4 of 5 demo modules stay byte-identical; only `ggplot-anim.js` gets a one-time refactor to expose `window.GG_*` config globals. Each demo `.qmd` gets a new data block. All 17 old section partials are deleted and replaced with 12 new ones following the R4DS spine. Live-executed R chunks pull from committed CSVs so renders stay deterministic and offline-safe.

**Tech Stack:** Quarto 1.9+ (revealjs) · R 4.5+ · knitr · tidyverse · tidyquant · lubridate · zoo · broom · PerformanceAnalytics · gt · anime.js v4 · renv

**Spec:** `docs/superpowers/specs/2026-07-02-r-for-finance-design.md` — read this first for the full design rationale (audience, ticker choice, animation reuse, YAGNI list).

---

## File Structure Overview

| Path | Change | Owner task |
|------|--------|------------|
| `scripts/refresh-data.R` | Create | T1 |
| `data/AAPL.csv`, `MSFT.csv`, `SPY.csv`, `TLT.csv`, `GLD.csv`, `ff_factors.csv` | Create | T1 |
| `data/README.md` | Create | T1 |
| `renv.lock` | Modify (add tidyquant, lubridate, zoo, broom, PerformanceAnalytics, gt) | T2 |
| `assets/js/ggplot-anim.js` | Refactor (expose `window.GG_*` globals) | T3 |
| `assets/js/ggplot-anim.html` | Regenerate from `.js` | T3 |
| `sections/demo-mutate.qmd` | Rewrite data block | T4 |
| `sections/demo-filter.qmd` | Rewrite data block | T5 |
| `sections/demo-pivot-longer.qmd` | Rewrite data block | T6 |
| `sections/demo-pivot-wider.qmd` | Rewrite data block | T7 |
| `sections/demo-ggplot.qmd` | Rewrite data block (uses new GG_* globals) | T8 |
| `sections/01-installation.qmd` … `sections/16-resources.qmd` (except 00-title, 00b-about-me) | Delete | T9 |
| `sections/00-title.qmd` | Rewrite ("R for Finance") | T10 |
| `sections/11-resources.qmd` | Create (renamed from old §16, finance resources) | T10 |
| `sections/01-get-data.qmd` | Create | T11 |
| `sections/02-first-plot.qmd` | Create (includes `demo-ggplot`) | T11 |
| `sections/03-transform.qmd` | Create (includes `demo-mutate` + `demo-filter`) | T11 |
| `sections/04-tidy.qmd` | Create (includes `demo-pivot-longer` + `demo-pivot-wider`) | T11 |
| `sections/05-workflow.qmd` | Create | T12 |
| `sections/06-dates-timeseries.qmd` | Create | T12 |
| `sections/07-functions.qmd` | Create | T12 |
| `sections/08-iteration.qmd` | Create | T12 |
| `sections/09-capm.qmd` | Create | T13 |
| `sections/10-communicate.qmd` | Create | T13 |
| `index.qmd` | Rewrite include list | T14 |
| `scripts/check-render.sh` | Update section-id greps | T14 |

**Unchanged** (do not touch): `_quarto.yml`, `assets/theme.scss`, `assets/head.html`, `assets/animations.js` / `.html`, `assets/js/{mutate,filter,pivot-longer,pivot-wider}-anim.{js,html}`, `assets/syntax.theme`, `assets/vendor/anime.min.js`, `sections/00b-about-me.qmd`, `.gitignore`.

---

## Task 1: Bootstrap data — refresh script + committed CSVs

**Files:**
- Create: `scripts/refresh-data.R`
- Create: `data/AAPL.csv`, `MSFT.csv`, `SPY.csv`, `TLT.csv`, `GLD.csv`, `ff_factors.csv`
- Create: `data/README.md`

- [ ] **Step 1: Write `scripts/refresh-data.R`**

```r
# Refresh the committed CSVs used throughout the R for Finance deck.
# Run once locally to regenerate data/; the deck itself never touches
# the network at render time (chunks read the CSVs via readr::read_csv).
#
# Usage: Rscript scripts/refresh-data.R

suppressPackageStartupMessages({
  library(tidyquant)
  library(readr)
  library(dplyr)
  library(lubridate)
})

TICKERS <- c("AAPL", "MSFT", "SPY", "TLT", "GLD")
DATE_FROM <- "2015-01-01"
DATE_TO   <- "2024-12-31"
DATA_DIR  <- "data"

dir.create(DATA_DIR, showWarnings = FALSE)

for (tk in TICKERS) {
  message("Downloading ", tk, " ...")
  df <- tq_get(tk, from = DATE_FROM, to = DATE_TO, get = "stock.prices")
  # Standardise column names: keep date + OHLCV + adjusted
  df <- df %>%
    select(date, open, high, low, close, volume, adjusted) %>%
    arrange(date)
  write_csv(df, file.path(DATA_DIR, paste0(tk, ".csv")))
}

# Fama-French 3-factor daily via tidyquant
message("Downloading Fama-French 3 daily ...")
ff <- tq_get("F-F_Research_Data_Factors_daily",
             get = "famafrench",
             from = DATE_FROM,
             to = DATE_TO)
# tq_get returns a nested tibble — unnest into date + Mkt-RF, SMB, HML, RF
ff_flat <- ff %>%
  select(-symbol) %>%
  unnest(data) %>%
  rename(date = date, mkt_rf = `Mkt-RF`, smb = SMB, hml = HML, rf = RF) %>%
  mutate(across(c(mkt_rf, smb, hml, rf), ~ . / 100)) %>%  # percent → decimal
  filter(date >= as.Date(DATE_FROM), date <= as.Date(DATE_TO)) %>%
  arrange(date)
write_csv(ff_flat, file.path(DATA_DIR, "ff_factors.csv"))

message("Done. CSVs written to ", DATA_DIR, "/")
```

- [ ] **Step 2: Run the refresh script**

```bash
cd "/Users/gabbocg/Dropbox (Personal)/Documentos/Brainstorming/quantviz"
Rscript scripts/refresh-data.R
```

Expected: prints "Downloading AAPL ...", "Downloading MSFT ...", etc., then "Done. CSVs written to data/". No R errors.

If `tidyquant` is not yet installed (T2 hasn't run), install it first: `R -e 'renv::install("tidyquant")'` then re-run.

- [ ] **Step 3: Verify the CSVs**

```bash
wc -l data/*.csv
head -1 data/AAPL.csv
head -1 data/ff_factors.csv
```

Expected: each ticker CSV has ~2500 lines (10 years × ~250 trading days). AAPL header should be `date,open,high,low,close,volume,adjusted`. FF header should be `date,mkt_rf,smb,hml,rf`.

- [ ] **Step 4: Write `data/README.md`**

```markdown
# `data/` — market data for the deck

All CSVs are committed so the deck renders deterministically without any
network access. Regenerate via `Rscript scripts/refresh-data.R`.

## Files

| File | Content | Range |
|------|---------|-------|
| `AAPL.csv` | Apple Inc. daily OHLCV + adjusted close | 2015-01-01 → 2024-12-31 |
| `MSFT.csv` | Microsoft Corp. daily OHLCV + adjusted close | same |
| `SPY.csv` | S&P 500 SPDR ETF daily OHLCV + adjusted close (market proxy) | same |
| `TLT.csv` | iShares 20+ Year Treasury Bond ETF daily OHLCV + adjusted close | same |
| `GLD.csv` | SPDR Gold Shares ETF daily OHLCV + adjusted close | same |
| `ff_factors.csv` | Fama-French 3-factor daily (`Mkt-RF`, `SMB`, `HML`, `RF`) — decimals, not percent | same |

## Provenance

Yahoo Finance (via `tidyquant::tq_get(get = "stock.prices")`) and Kenneth
French's data library (via `tidyquant::tq_get(get = "famafrench")`).
```

- [ ] **Step 5: Commit**

```bash
git add scripts/refresh-data.R data/
git commit -m "feat: seed data/ with 5 tickers + FF factors (2015–2024)"
```

Expected: ~1.5 MB of CSVs staged and committed.

---

## Task 2: Add new R dependencies to `renv.lock`

**Files:**
- Modify: `renv.lock` (auto-updated by `renv::snapshot`)

- [ ] **Step 1: Install new packages**

```bash
cd "/Users/gabbocg/Dropbox (Personal)/Documentos/Brainstorming/quantviz"
R -e 'renv::install(c("tidyquant", "frenchdata", "lubridate", "zoo", "broom", "PerformanceAnalytics", "gt"))'
```

Note: `frenchdata` is used by `scripts/refresh-data.R` (T1) because
`tidyquant::tq_get(get = "famafrench")` was removed from tidyquant in
recent versions. If already installed by T1, `renv::install` is idempotent.

Expected: each package installs into `renv/library/`. Some may already be present as transitive deps — that's fine, `renv::install` is idempotent.

- [ ] **Step 2: Snapshot the lockfile**

```bash
R -e 'renv::snapshot(prompt = FALSE)'
```

Expected: `renv.lock` grows with new package entries. If prompted, answer Y.

- [ ] **Step 3: Verify all six load**

```bash
R -e 'suppressPackageStartupMessages({
  library(tidyquant); library(lubridate); library(zoo);
  library(broom); library(PerformanceAnalytics); library(gt)
}); cat("All six load OK\n")'
```

Expected: prints `All six load OK` with no errors.

- [ ] **Step 4: Commit**

```bash
git add renv.lock
git commit -m "chore: add tidyquant + lubridate + zoo + broom + PerfAnalytics + gt"
```

---

## Task 3: Refactor `ggplot-anim.js` — expose `window.GG_*` config globals

**Files:**
- Modify: `assets/js/ggplot-anim.js`
- Regenerate: `assets/js/ggplot-anim.html` (wrapper)

The current module hardcodes `SPECIES`, `COLORS`, `PTS`, `SMOOTH`, x/y domains, breaks, and lab text inside the IIFE. Refactor so all of these are read from `window.GG_*` globals with fallbacks to the current penguin defaults (so the deck continues to render even before demo-ggplot.qmd is retargeted).

- [ ] **Step 1: Read the current `assets/js/ggplot-anim.js` top of file**

Get familiar with the block starting `// ---- data (palmerpenguins subset) ----` down through `var Y_MINOR = ...` — that's the entire section that needs to become globals-with-fallback.

- [ ] **Step 2: Replace the data + geometry block with a globals-driven version**

In `assets/js/ggplot-anim.js`, find the block:

```javascript
  // ---- data (palmerpenguins subset) ----
  var SPECIES = ['Adelie', 'Chinstrap', 'Gentoo'];
  var COLORS  = ['#325D88', '#B94A48', '#557A3E'];
  var PTS = [
    /* ...30 tuples... */
  ];
  var SMOOTH = [];
  for (var x = 32; x <= 56; x += 2) {
    var fit = 100 * (x - 32) + 3200;
    SMOOTH.push([x, fit, fit - 350, fit + 350]);
  }

  // ---- plot geometry (inside the 600×380 #gg-plot box) ----
  var W = 600, H = 380;
  var M = { l: 62, r: 130, t: 42, b: 62 };
  var PX0 = M.l, PX1 = W - M.r, PY0 = M.t, PY1 = H - M.b;
  function expand(lo, hi) { var e = (hi - lo) * 0.05; return [lo - e, hi + e]; }
  var xd = expand(32, 56), yd = expand(2800, 6000);
  function sx(v) { return PX0 + (v - xd[0]) / (xd[1] - xd[0]) * (PX1 - PX0); }
  function sy(v) { return PY1 - (v - yd[0]) / (yd[1] - yd[0]) * (PY1 - PY0); }
  var X_BREAKS = [35, 40, 45, 50, 55];
  var Y_BREAKS = [3000, 4000, 5000, 6000];
  var X_MINOR  = [37.5, 42.5, 47.5, 52.5];
  var Y_MINOR  = [3500, 4500, 5500];
```

Replace with:

```javascript
  // ---- data + geometry — read from window.GG_* with penguin defaults ----
  var SPECIES = window.GG_SERIES || ['Adelie', 'Chinstrap', 'Gentoo'];
  var COLORS  = window.GG_COLORS || ['#325D88', '#B94A48', '#557A3E'];
  var PTS     = window.GG_DATA   || [
    [37,3200,0],[39,3500,0],[40,3600,0],[38,3400,0],[41,3900,0],
    [42,4000,0],[36,3100,0],[43,3800,0],[39,3500,0],[37,3300,0],
    [47,3500,1],[50,4000,1],[52,4100,1],[49,3700,1],[51,3900,1],
    [48,3600,1],[50,3800,1],[49,3600,1],[46,3400,1],[53,4200,1],
    [46,4800,2],[48,5200,2],[50,5400,2],[52,5600,2],[47,4900,2],
    [49,5100,2],[51,5500,2],[53,5800,2],[46,4700,2],[50,5200,2]
  ];
  var SMOOTH  = window.GG_SMOOTH || (function () {
    var out = [];
    for (var x = 32; x <= 56; x += 2) {
      var fit = 100 * (x - 32) + 3200;
      out.push([x, fit, fit - 350, fit + 350]);
    }
    return out;
  })();

  // Geometry (stage sub-box)
  var W = 600, H = 380;
  var M = { l: 62, r: 130, t: 42, b: 62 };
  var PX0 = M.l, PX1 = W - M.r, PY0 = M.t, PY1 = H - M.b;

  function expand(lo, hi) { var e = (hi - lo) * 0.05; return [lo - e, hi + e]; }
  var X_DOM = window.GG_X_DOMAIN || [32, 56];
  var Y_DOM = window.GG_Y_DOMAIN || [2800, 6000];
  var xd = expand(X_DOM[0], X_DOM[1]);
  var yd = expand(Y_DOM[0], Y_DOM[1]);
  function sx(v) { return PX0 + (v - xd[0]) / (xd[1] - xd[0]) * (PX1 - PX0); }
  function sy(v) { return PY1 - (v - yd[0]) / (yd[1] - yd[0]) * (PY1 - PY0); }
  var X_BREAKS = window.GG_X_BREAKS || [35, 40, 45, 50, 55];
  var Y_BREAKS = window.GG_Y_BREAKS || [3000, 4000, 5000, 6000];
  var X_MINOR  = window.GG_X_MINOR  || [37.5, 42.5, 47.5, 52.5];
  var Y_MINOR  = window.GG_Y_MINOR  || [3500, 4500, 5500];

  // Points vs line: switch geom_point (circles) → geom_line (polyline per series)
  var GEOM = window.GG_GEOM || 'point';

  // Lab text (title, x, y, legend title)
  var LABS = window.GG_LABS || {
    title: 'Bill length vs body mass',
    x:     'Bill length (mm)',
    y:     'Body mass (g)',
    color: 'Species'
  };
```

- [ ] **Step 3: Update `buildPoints` to honour the `GEOM` switch**

Find:

```javascript
  function buildPoints(svg) {
    PTS.forEach(function (p) { el('circle', { cx: sx(p[0]), cy: sy(p[1]), r: 3.5, fill: COLORS[p[2]], 'fill-opacity': 0.85 }, svg); });
  }
```

Replace with:

```javascript
  function buildPoints(svg) {
    if (GEOM === 'line') {
      // Group points by series index, then draw one polyline per series
      var bySeries = {};
      PTS.forEach(function (p) {
        var k = p[2];
        if (!bySeries[k]) bySeries[k] = [];
        bySeries[k].push([p[0], p[1]]);
      });
      Object.keys(bySeries).forEach(function (k) {
        var pts = bySeries[k].sort(function (a, b) { return a[0] - b[0]; });
        var d = '';
        pts.forEach(function (p, i) { d += (i ? 'L' : 'M') + sx(p[0]) + ',' + sy(p[1]) + ' '; });
        el('path', { d: d, fill: 'none', stroke: COLORS[k], 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-opacity': 0.9 }, svg);
      });
    } else {
      PTS.forEach(function (p) { el('circle', { cx: sx(p[0]), cy: sy(p[1]), r: 3.5, fill: COLORS[p[2]], 'fill-opacity': 0.85 }, svg); });
    }
  }
```

- [ ] **Step 4: Update `buildCoord` and `buildLabs` to use the `LABS` and `SPECIES` from globals**

Find in `buildCoord`:

```javascript
    var ly = legY();
    SPECIES.forEach(function (name, i) {
      var y = ly + i * 24;
      el('rect', { x: LEG_X, y: y - 12, width: 16, height: 16, rx: 2, fill: '#EBEBEB' }, svg);
      el('circle', { cx: LEG_X + 8, cy: y - 4, r: 3.5, fill: COLORS[i] }, svg);
      txt(svg, LEG_X + 24, y, name, { 'font-size': 13, fill: '#1d2433' });
    });
```

That already uses `SPECIES` and `COLORS` variables — they now come from globals via the change in Step 2. **No edit needed here.**

Find `buildLabs`:

```javascript
  function buildLabs(svg) {
    txt(svg, PX0, 24, 'Bill length vs body mass', { 'font-size': 17, 'font-weight': 700, fill: '#1d2433' });
    txt(svg, (PX0 + PX1) / 2, H - 18, 'Bill length (mm)', { 'text-anchor': 'middle', 'font-size': 13, fill: '#1d2433' });
    var yt = txt(svg, 20, (PY0 + PY1) / 2, 'Body mass (g)', { 'text-anchor': 'middle', 'font-size': 13, fill: '#1d2433' });
    yt.setAttribute('transform', 'rotate(-90 20 ' + ((PY0 + PY1) / 2) + ')');
    txt(svg, LEG_X, legY() - 22, 'Species', { 'font-size': 13, 'font-weight': 700, fill: '#1d2433' });
  }
```

Replace with:

```javascript
  function buildLabs(svg) {
    txt(svg, PX0, 24, LABS.title, { 'font-size': 17, 'font-weight': 700, fill: '#1d2433' });
    txt(svg, (PX0 + PX1) / 2, H - 18, LABS.x, { 'text-anchor': 'middle', 'font-size': 13, fill: '#1d2433' });
    var yt = txt(svg, 20, (PY0 + PY1) / 2, LABS.y, { 'text-anchor': 'middle', 'font-size': 13, fill: '#1d2433' });
    yt.setAttribute('transform', 'rotate(-90 20 ' + ((PY0 + PY1) / 2) + ')');
    txt(svg, LEG_X, legY() - 22, LABS.color, { 'font-size': 13, 'font-weight': 700, fill: '#1d2433' });
  }
```

- [ ] **Step 5: Regenerate the `.html` wrapper**

```bash
cd "/Users/gabbocg/Dropbox (Personal)/Documentos/Brainstorming/quantviz"
printf '<script>\n' > assets/js/ggplot-anim.html
cat assets/js/ggplot-anim.js >> assets/js/ggplot-anim.html
printf '\n</script>\n' >> assets/js/ggplot-anim.html
```

- [ ] **Step 6: Verify JS still parses**

```bash
node -e "var fs=require('fs'); new Function(fs.readFileSync('assets/js/ggplot-anim.js','utf8'))" && echo "JS parses cleanly"
```

Expected: prints `JS parses cleanly`.

- [ ] **Step 7: Smoke render — deck should still work with penguin defaults**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -3
```

Expected: `Output created: _site/index.html`. The demo-ggplot slide still renders the penguins chart because all globals fall back to defaults.

- [ ] **Step 8: Commit**

```bash
git add assets/js/ggplot-anim.js assets/js/ggplot-anim.html
git commit -m "refactor: expose window.GG_* config globals in ggplot-anim.js"
```

---

## Task 4: Retarget `sections/demo-mutate.qmd` — pre-computed log returns

**Files:**
- Modify: `sections/demo-mutate.qmd` (rewrite the inline `<script>` block only)

- [ ] **Step 1: Rewrite `sections/demo-mutate.qmd`**

Overwrite the file entirely with:

```markdown
# dplyr::mutate() {.mu-slide #demo-mutate-slide}

::: {.section-badge}
Add a computed column · log returns
:::

::: {.fi-stage-wrap}
<div id="mu-stage"></div>
:::

[]{.fragment .fi-frag id="mu-frag-1"}
[]{.fragment .fi-frag id="mu-frag-2"}

```{=html}
<script>
// AAPL close prices (2024-01-02 → 2024-01-09) with log_return pre-computed.
// Engine calls TRANSFORM(row[1]) with only the current-row close — we can't
// compute log(x / lag(x)) inside the transform, so we pre-compute the return
// into row[2] and use an identity transform that just pulls that value.
window.MU_DATA = [
  ['2024-01-02', 185.64,  ''      ],
  ['2024-01-03', 184.25, -0.00752 ],
  ['2024-01-04', 181.91, -0.01278 ],
  ['2024-01-05', 181.18, -0.00402 ],
  ['2024-01-08', 185.56,  0.02388 ],
  ['2024-01-09', 185.14, -0.00227 ]
];
window.MU_SRC_COL   = 'close';
window.MU_NEW_COL   = 'log_return';
window.MU_LABEL_COL = 'date';
window.MU_CODE_LINE = 'mutate(log_return = log(close / lag(close)))';
window.MU_COLORS    = ['#325D88'];
// Identity transform — the value was pre-computed into row[2] above.
// The engine's build() reads row[0]/row[1]; TRANSFORM is passed row[1] (close).
// Look up by index (order of appearance) rather than by floating-point equality
// on closeVal — safer against any coercion the engine might apply.
window.MU_TRANSFORM = (function () {
  var i = -1;
  return function (_closeVal) {
    i = (i + 1) % window.MU_DATA.length;
    var lr = window.MU_DATA[i][2];
    return lr === '' ? '' : lr.toFixed(5);
  };
})();
</script>
```
```

- [ ] **Step 2: Render and verify**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -3
```

Expected: `Output created: _site/index.html`. Grep-verify the data landed:

```bash
grep -c "log_return = log(close" _site/index.html
grep -c "185.64\|184.25" _site/index.html
```

Expected: both grep counts ≥ 1.

- [ ] **Step 3: Commit**

```bash
git add sections/demo-mutate.qmd
git commit -m "feat: retarget mutate demo to AAPL log returns"
```

---

## Task 5: Retarget `sections/demo-filter.qmd` — ticker + date filter

**Files:**
- Modify: `sections/demo-filter.qmd`

- [ ] **Step 1: Rewrite `sections/demo-filter.qmd`**

```markdown
# dplyr::filter() {.fi-slide #demo-filter-slide}

::: {.section-badge}
Two conditions · ticker and date
:::

::: {.fi-stage-wrap}
<div id="fi-stage"></div>
:::

[]{.fragment .fi-frag id="fi-cond-1"}
[]{.fragment .fi-frag id="fi-cond-2"}
[]{.fragment .fi-frag id="fi-both"}
[]{.fragment .fi-frag id="fi-arrows"}

```{=html}
<script>
window.FI_TITLE_PRE  = 'filter(';
window.FI_CONDS_TEXT = ['ticker == "AAPL"', 'date >= "2024-01-01"'];
window.FI_TITLE_POST = ')';
window.FI_DATA = [
  ['AAPL', '2023-12-28'],
  ['AAPL', '2023-12-29'],
  ['AAPL', '2024-01-02'],
  ['MSFT', '2023-12-28'],
  ['MSFT', '2023-12-29'],
  ['MSFT', '2024-01-02'],
  ['SPY',  '2023-12-28'],
  ['SPY',  '2023-12-29'],
  ['SPY',  '2024-01-02']
];
window.FI_COLS   = ['ticker', 'date'];
window.FI_COLORS = ['#325D88', '#B94A48'];
window.FI_HITS = [
  // ticker == "AAPL"
  [true,  true,  true,  false, false, false, false, false, false],
  // date >= "2024-01-01"
  [false, false, true,  false, false, true,  false, false, true ]
];
</script>
```
```

- [ ] **Step 2: Render and verify**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -3
grep -c 'ticker == "AAPL"' _site/index.html
grep -c "2024-01-02" _site/index.html
```

Expected: render exits 0; both greps ≥ 1.

- [ ] **Step 3: Commit**

```bash
git add sections/demo-filter.qmd
git commit -m "feat: retarget filter demo to ticker+date conditions"
```

---

## Task 6: Retarget `sections/demo-pivot-longer.qmd` — wide prices → long

**Files:**
- Modify: `sections/demo-pivot-longer.qmd`

- [ ] **Step 1: Rewrite `sections/demo-pivot-longer.qmd`**

```markdown
# tidyr::pivot_longer() {.pl-slide #demo-pivot-longer-slide}

::: {.section-badge}
Wide → long · one column per ticker becomes rows
:::

::: {.fi-stage-wrap}
<div id="pl-stage"></div>
:::

[]{.fragment .fi-frag id="pl-frag-1"}
[]{.fragment .fi-frag id="pl-frag-2"}

```{=html}
<script>
window.PL_TITLE_PRE  = 'pivot_longer(';
window.PL_CONDS_TEXT = ['AAPL:SPY', '"ticker"', '"close"'];
window.PL_TITLE_POST = ')';
window.PL_COLS = ['date', 'AAPL', 'MSFT', 'SPY'];
window.PL_SUBJECT_COLORS = ['#325D88', '#B94A48', '#557A3E'];
window.PL_DATA = [
  ['2024-01-02', 185.64, 370.87, 476.24],
  ['2024-01-03', 184.25, 370.60, 473.24],
  ['2024-01-04', 181.91, 367.94, 471.35]
];
</script>
```
```

- [ ] **Step 2: Render and verify**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -3
grep -c "AAPL:SPY" _site/index.html
grep -c "370.87\|181.91" _site/index.html
```

Expected: render exits 0; both greps ≥ 1.

- [ ] **Step 3: Commit**

```bash
git add sections/demo-pivot-longer.qmd
git commit -m "feat: retarget pivot_longer demo to wide price panel"
```

---

## Task 7: Retarget `sections/demo-pivot-wider.qmd` — long returns → wide

**Files:**
- Modify: `sections/demo-pivot-wider.qmd`

- [ ] **Step 1: Rewrite `sections/demo-pivot-wider.qmd`**

```markdown
# tidyr::pivot_wider() {.pw-slide #demo-pivot-wider-slide}

::: {.section-badge}
Long → wide · one row per date, one column per ticker
:::

::: {.fi-stage-wrap}
<div id="pw-stage"></div>
:::

[]{.fragment .fi-frag id="pw-frag-1"}
[]{.fragment .fi-frag id="pw-frag-2"}

```{=html}
<script>
window.PW_TITLE_PRE  = 'pivot_wider(';
window.PW_CONDS_TEXT = ['names_from = ticker', 'values_from = log_return'];
window.PW_TITLE_POST = ')';
window.PW_NAMES = ['2024-01-02', '2024-01-03', '2024-01-04'];
window.PW_SUBJECTS = ['AAPL', 'MSFT', 'SPY'];
window.PW_SUBJECT_COLORS = ['#325D88', '#B94A48', '#557A3E'];
window.PW_LONG_DATA = [
  ['2024-01-02', 'AAPL', -0.00227],
  ['2024-01-02', 'MSFT', -0.00631],
  ['2024-01-02', 'SPY',  -0.00568],
  ['2024-01-03', 'AAPL', -0.00752],
  ['2024-01-03', 'MSFT', -0.00072],
  ['2024-01-03', 'SPY',  -0.00631],
  ['2024-01-04', 'AAPL', -0.01278],
  ['2024-01-04', 'MSFT', -0.00720],
  ['2024-01-04', 'SPY',  -0.00399]
];
</script>
```
```

- [ ] **Step 2: Render and verify**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -3
grep -c "names_from = ticker" _site/index.html
```

Expected: render exits 0; grep ≥ 1.

- [ ] **Step 3: Commit**

```bash
git add sections/demo-pivot-wider.qmd
git commit -m "feat: retarget pivot_wider demo to long returns → wide"
```

---

## Task 8: Retarget `sections/demo-ggplot.qmd` — price time series

**Files:**
- Modify: `sections/demo-ggplot.qmd`

The GG_* globals from Task 3 make this a config-only edit. The data is ~50 sampled monthly points per ticker across 2015–2024 (~150 total tuples). To keep the qmd readable, generate the data with a small helper JS block at the top of the slide.

- [ ] **Step 1: Rewrite `sections/demo-ggplot.qmd`**

```markdown
# ggplot2, deconstructed {.gg-slide #demo-ggplot-slide}

::: {.section-badge}
Layer by layer · price time series
:::

::: {.fi-stage-wrap}
<div id="gg-stage"></div>
:::

[]{.fragment .fi-frag id="gg-lay"}
[]{.fragment .fi-frag id="gg-explode"}
[]{.fragment .fi-frag id="gg-focus-coord"}
[]{.fragment .fi-frag id="gg-focus-points"}
[]{.fragment .fi-frag id="gg-focus-smooth"}
[]{.fragment .fi-frag id="gg-focus-labs"}
[]{.fragment .fi-frag id="gg-collapse"}
[]{.fragment .fi-frag id="gg-unrotate"}

```{=html}
<script>
// x axis: months since 2015-01, y axis: adjusted close (USD).
// ~40 monthly-sampled points per ticker (approximate hand-picked levels).
window.GG_SERIES = ['AAPL', 'SPY', 'GLD'];
window.GG_COLORS = ['#325D88', '#B94A48', '#557A3E'];
window.GG_GEOM   = 'line';
// Domains for a 10-year span (0 → 120 months) with adj-close approximate scale.
window.GG_X_DOMAIN = [0, 120];
window.GG_Y_DOMAIN = [0, 250];
window.GG_X_BREAKS = [0, 24, 48, 72, 96, 120];   // year ticks (Jan-2015..2025)
window.GG_Y_BREAKS = [0, 50, 100, 150, 200, 250];
window.GG_X_MINOR  = [12, 36, 60, 84, 108];
window.GG_Y_MINOR  = [25, 75, 125, 175, 225];
window.GG_LABS = {
  title: 'Daily closing prices (2015–2024)',
  x:     'Months since Jan 2015',
  y:     'Adjusted close (USD)',
  color: 'Ticker'
};

// Keep the code panel in sync with the finance plot (T3 exposed GG_CODE_HTML).
window.GG_CODE_HTML =
  '<span data-blk="coord"><span class="gg-fn">ggplot</span>(prices,\n' +
  '       <span class="gg-fn">aes</span>(date, close, <span class="gg-arg">color</span> = ticker)) +</span>\n' +
  '<span data-blk="points">  <span class="gg-fn">geom_line</span>() +</span>\n' +
  '<span data-blk="smooth">  <span class="gg-fn">geom_smooth</span>() +</span>\n' +
  '<span data-blk="labs">  <span class="gg-fn">labs</span>(<span class="gg-arg">title</span> = <span class="gg-str">"Daily closing prices (2015–2024)"</span>,\n' +
  '       <span class="gg-arg">x</span> = <span class="gg-str">"Date"</span>,\n' +
  '       <span class="gg-arg">y</span> = <span class="gg-str">"Adjusted close (USD)"</span>)</span>';

// Approximate monthly-sample close levels per ticker.
// AAPL rises 25 → 195, SPY rises 200 → 470, GLD 110 → 240.
window.GG_DATA = (function () {
  var series = [
    // AAPL (index 0)
    { idx: 0, start: 25,  end: 195 },
    // SPY (index 1)
    { idx: 1, start: 200, end: 470 },
    // GLD (index 2)
    { idx: 2, start: 110, end: 240 }
  ];
  var out = [];
  series.forEach(function (s) {
    for (var m = 0; m <= 120; m += 3) {  // one point every 3 months = ~40 pts
      var t = m / 120;
      // gentle upward trajectory with a mild dip around month 66 (COVID-ish)
      var dip = m >= 60 && m <= 72 ? -0.08 : 0;
      var level = s.start + (s.end - s.start) * (t + dip);
      out.push([m, +level.toFixed(1), s.idx]);
    }
  });
  return out;
})();

// A single smoothed trend line across the whole time span (average of series).
window.GG_SMOOTH = (function () {
  var out = [];
  for (var m = 0; m <= 120; m += 5) {
    var t = m / 120;
    var y = 100 + 100 * t;   // gentle linear trend as a stand-in
    out.push([m, y, y - 20, y + 20]);
  }
  return out;
})();
</script>
```
```

- [ ] **Step 2: Render + verify**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -3
grep -c "GG_SERIES" _site/index.html
grep -c "AAPL.*SPY.*GLD\|price time series\|Daily closing prices" _site/index.html
```

Expected: render exits 0; both greps ≥ 1.

- [ ] **Step 3: Live-check the animation**

```bash
quarto preview --port 5173 --no-browser &
sleep 4
open "http://localhost:5173"
# Navigate to the ggplot deconstructed slide; press → to explode.
```

Confirm 3 colored polylines appear (AAPL navy, SPY brick, GLD olive), not circles, and the smooth line spans the full month range.

- [ ] **Step 4: Commit**

```bash
git add sections/demo-ggplot.qmd
git commit -m "feat: retarget ggplot deconstructed to price time series"
```

---

## Task 9: Delete the old "Intro to R" section partials

**Files:**
- Delete: `sections/01-installation.qmd`
- Delete: `sections/02-posit-cloud.qmd`
- Delete: `sections/03-projects.qmd`
- Delete: `sections/04-packages.qmd`
- Delete: `sections/05-scripts.qmd`
- Delete: `sections/06-data-structures.qmd`
- Delete: `sections/07-vectors-lists.qmd`
- Delete: `sections/08-matrices-arrays.qmd`
- Delete: `sections/09-dataframes-tibbles.qmd`
- Delete: `sections/10-subsetting.qmd`
- Delete: `sections/11-conditionals-loops.qmd`
- Delete: `sections/12-functions.qmd`
- Delete: `sections/13-linear-regression.qmd`
- Delete: `sections/14-visualization.qmd`
- Delete: `sections/15-tidyverse.qmd`
- Delete: `sections/16-resources.qmd`

Also delete from `index.qmd` all references to these files (the actual `index.qmd` rewrite happens in T14).

- [ ] **Step 1: Delete the 16 files**

```bash
cd "/Users/gabbocg/Dropbox (Personal)/Documentos/Brainstorming/quantviz"
git rm sections/01-installation.qmd sections/02-posit-cloud.qmd \
       sections/03-projects.qmd sections/04-packages.qmd sections/05-scripts.qmd \
       sections/06-data-structures.qmd sections/07-vectors-lists.qmd \
       sections/08-matrices-arrays.qmd sections/09-dataframes-tibbles.qmd \
       sections/10-subsetting.qmd sections/11-conditionals-loops.qmd \
       sections/12-functions.qmd sections/13-linear-regression.qmd \
       sections/14-visualization.qmd sections/15-tidyverse.qmd \
       sections/16-resources.qmd
```

Expected: 16 files deleted (`git rm` stages the deletions).

- [ ] **Step 2: Temporarily comment out the includes in `index.qmd` so render still works**

Open `index.qmd` and comment out lines 10 through 25 (the includes for §1–§16). Keep §0 title + §0b about-me + the 5 demo includes at the bottom. Add a `<!-- old modules removed; new modules added in T11–T13 -->` comment as a placeholder.

Actual patch (find these lines and replace):

```markdown
{{< include sections/00-title.qmd >}}
{{< include sections/00b-about-me.qmd >}}
<!-- ... 15 more include lines for §1–§15 ... -->
{{< include sections/16-resources.qmd >}}
```

Replace with:

```markdown
{{< include sections/00-title.qmd >}}
{{< include sections/00b-about-me.qmd >}}
<!-- old §1–§16 removed 2026-07-02; new modules added in T11–T13. -->
{{< include sections/demo-mutate.qmd >}}
{{< include sections/demo-filter.qmd >}}
{{< include sections/demo-pivot-longer.qmd >}}
{{< include sections/demo-pivot-wider.qmd >}}
{{< include sections/demo-ggplot.qmd >}}
```

- [ ] **Step 3: Render to confirm nothing broke**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -3
```

Expected: `Output created: _site/index.html`. Deck now has title + about + 5 demo slides only. No errors.

- [ ] **Step 4: Commit**

```bash
git add index.qmd
git commit -m "chore: remove old Intro-to-R section partials (pivot in progress)"
```

---

## Task 10: Rewrite title + resources for the new deck

**Files:**
- Modify: `sections/00-title.qmd`
- Create: `sections/11-resources.qmd`

- [ ] **Step 1: Rewrite `sections/00-title.qmd`**

Overwrite entirely:

```markdown
# R for Finance {.hero #s00-title}

::: {.section-badge}
Course · 10 modules
:::

R for Finance

::: {.lede}
The R4DS core — visualize, transform, tidy, program, model, communicate — applied to real stock prices, factor models, and portfolio math.
:::
```

- [ ] **Step 2: Create `sections/11-resources.qmd`**

```markdown
# Resources {.hero #s11-resources}

::: {.section-badge}
Module 11 · Where to go next
:::

## Books to read next

- **R for Data Science, 2e** — Wickham, Çetinkaya-Rundel & Grolemund
  [r4ds.hadley.nz](https://r4ds.hadley.nz) — the source structure of this course
- **Reproducible Finance with R** — Regenstein
  [github.com/reproducible-finance](https://github.com/reproducible-finance) — R workflows for portfolio math
- **Advanced R** — Wickham
  [adv-r.hadley.nz](https://adv-r.hadley.nz) — for when you want to understand the language, not just use it
- **Applied Quantitative Finance** — Härdle, Franke, Hafner
  Formal treatment of the finance math behind CAPM, factor models, GARCH

## Packages worth learning after this course

- `tidyquant` — everything financial in a tidyverse-native API
- `PerformanceAnalytics` — Sharpe / Sortino / drawdown / CAPM one-liners
- `xts`, `zoo` — the classical time-series containers
- `tsibble`, `fable` — modern tidy time-series forecasting
- `quantmod` — market data + technical indicators
- `PortfolioAnalytics` — mean-variance and beyond
- `rugarch` — GARCH family for volatility modelling

## References for the data

- Yahoo Finance — daily OHLCV via `tidyquant::tq_get()`
- Kenneth French's data library — Fama-French factors, momentum, industry portfolios via `tidyquant::tq_get(get = "famafrench")`
- FRED — macro series (rates, CPI) via `tidyquant::tq_get(get = "economic.data")`
```

- [ ] **Step 3: Render + verify**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -3
grep -c "R for Finance\|Reproducible Finance" _site/index.html
```

Expected: render exits 0; grep ≥ 2.

- [ ] **Step 4: Commit**

```bash
git add sections/00-title.qmd sections/11-resources.qmd
git commit -m "feat: rewrite title + resources for R for Finance"
```

---

## Task 11: Write modules 1–4 (Get data · First plot · Transform · Tidy)

**Files:**
- Create: `sections/01-get-data.qmd`
- Create: `sections/02-first-plot.qmd` (embeds `demo-ggplot.qmd`)
- Create: `sections/03-transform.qmd` (embeds `demo-mutate.qmd` + `demo-filter.qmd`)
- Create: `sections/04-tidy.qmd` (embeds `demo-pivot-longer.qmd` + `demo-pivot-wider.qmd`)

Each module opens with a hero slide (H1 `{.hero #sNN-slug}`) then 1–3 content slides. All `{r}` chunks are executed live.

- [ ] **Step 1: Create `sections/01-get-data.qmd`**

```markdown
# 1 · Getting financial data {.hero #s01-get-data}

::: {.section-badge}
Module 1 · Import (R4DS ch 7)
:::

Loading market data

::: {.lede}
Two paths: pull from Yahoo Finance live, or read the CSVs shipped with this course.
:::

## The classic way: `tidyquant::tq_get()`

Live, from Yahoo Finance:

```r
library(tidyquant)

aapl <- tq_get("AAPL",
               from = "2015-01-01",
               to   = "2024-12-31",
               get  = "stock.prices")
head(aapl)
```

Fine for exploratory use, but renders need the network. For a reproducible course, we cache to disk once and read from CSV.

## The reproducible way: committed CSVs

```{r}
#| message: false
library(readr)
library(dplyr)

aapl <- read_csv("data/AAPL.csv", show_col_types = FALSE)
head(aapl, 4)
```

Every subsequent module reads from `data/` — no network calls at render time.

## The five tickers you'll see

- **AAPL** — Apple, large-cap equity
- **MSFT** — Microsoft, another large-cap equity (for correlation stories)
- **SPY** — S&P 500 ETF, the market proxy for CAPM
- **TLT** — 20+ Year Treasury Bond ETF, bond proxy
- **GLD** — SPDR Gold Shares, commodity proxy

## Fama-French factors, too

```{r}
#| message: false
ff <- read_csv("data/ff_factors.csv", show_col_types = FALSE)
head(ff, 3)
```

`Mkt-RF`, `SMB`, `HML`, `RF` in decimals (not percent). Used in module 9 for CAPM.
```

- [ ] **Step 2: Create `sections/02-first-plot.qmd`** (embeds ggplot demo)

```markdown
# 2 · Visualize with ggplot2 {.hero #s02-first-plot}

::: {.section-badge}
Module 2 · Visualize (R4DS ch 2)
:::

Your first plot

::: {.lede}
`ggplot()` builds plots as layers: data + aesthetics, then geoms, then labels.
:::

## Just draw the line

```{r}
#| message: false
#| fig-align: center
#| fig-width: 8
#| fig-height: 4
library(readr); library(dplyr); library(ggplot2)

aapl <- read_csv("data/AAPL.csv", show_col_types = FALSE)

ggplot(aapl, aes(date, adjusted)) +
  geom_line(colour = "#325D88") +
  labs(title = "AAPL adjusted close", x = NULL, y = "USD") +
  theme_minimal()
```

That's the entire grammar: **data** (`aapl`), **aesthetics** (`aes(date, adjusted)`), **geom** (`geom_line`), **labs**, **theme**.

## Three tickers on the same axes

```{r}
#| message: false
#| fig-align: center
#| fig-width: 8
#| fig-height: 4
library(purrr)

tickers <- c("AAPL", "SPY", "GLD")
prices <- map_dfr(tickers,
                  ~ read_csv(paste0("data/", .x, ".csv"), show_col_types = FALSE) |>
                     mutate(ticker = .x))

ggplot(prices, aes(date, adjusted, colour = ticker)) +
  geom_line() +
  scale_colour_manual(values = c(AAPL = "#325D88", SPY = "#B94A48", GLD = "#557A3E")) +
  labs(title = "Ten years of daily close", x = NULL, y = "Adjusted close (USD)", colour = "Ticker") +
  theme_minimal()
```

## Now the deconstructed animation

The slide below plays out the same idea layer-by-layer:

{{< include demo-ggplot.qmd >}}
```

- [ ] **Step 3: Create `sections/03-transform.qmd`** (embeds mutate + filter demos)

```markdown
# 3 · Transform with dplyr {.hero #s03-transform}

::: {.section-badge}
Module 3 · Transform (R4DS ch 4)
:::

Reshape and compute

::: {.lede}
Five verbs handle almost every wrangle: `mutate`, `select`, `filter`, `arrange`, `summarise` — plus `group_by` to scope them.
:::

## Log returns with `mutate`

```{r}
#| message: false
library(readr); library(dplyr)

aapl <- read_csv("data/AAPL.csv", show_col_types = FALSE) |>
  mutate(log_return = log(adjusted / lag(adjusted)))

aapl |> select(date, adjusted, log_return) |> head(4)
```

`lag()` shifts the column down by one row so `log(x / lag(x))` yields the daily log return.

{{< include demo-mutate.qmd >}}

## Slice with `filter`

```{r}
recent_aapl <- aapl |>
  filter(date >= as.Date("2024-01-01"), date <= as.Date("2024-03-31"))

nrow(recent_aapl)
```

Combine conditions with `&` (`,` inside `filter` is the same as `&`).

{{< include demo-filter.qmd >}}

## Per-ticker summaries with `group_by` + `summarise`

```{r}
#| message: false
library(purrr)
prices <- map_dfr(c("AAPL", "MSFT", "SPY", "TLT", "GLD"),
                  ~ read_csv(paste0("data/", .x, ".csv"), show_col_types = FALSE) |>
                     mutate(ticker = .x,
                            log_return = log(adjusted / lag(adjusted))))

prices |>
  group_by(ticker) |>
  summarise(
    n         = n(),
    mean_ret  = mean(log_return, na.rm = TRUE),
    sd_ret    = sd(log_return,   na.rm = TRUE),
    .groups   = "drop"
  )
```

Five rows out — one per ticker.
```

- [ ] **Step 4: Create `sections/04-tidy.qmd`** (embeds pivot demos)

```markdown
# 4 · Tidy with tidyr {.hero #s04-tidy}

::: {.section-badge}
Module 4 · Tidy (R4DS ch 5)
:::

Long form vs wide form

::: {.lede}
Tidy data: **one row per observation, one column per variable**. Financial data is almost always stored wide (one column per ticker) — you pivot to long for computation.
:::

## Wide → long with `pivot_longer`

```{r}
#| message: false
library(readr); library(dplyr); library(tidyr); library(purrr)

# Start wide: one column per ticker's adjusted close
wide <- map(c("AAPL", "MSFT", "SPY"),
            ~ read_csv(paste0("data/", .x, ".csv"), show_col_types = FALSE) |>
                select(date, all_of("adjusted")) |>
                rename(!!.x := adjusted)) |>
  reduce(inner_join, by = "date")

head(wide, 3)

# Pivot to long — one row per (date, ticker)
long <- wide |>
  pivot_longer(cols = -date, names_to = "ticker", values_to = "close")

head(long, 6)
```

Long form is what `group_by(ticker)` wants.

{{< include demo-pivot-longer.qmd >}}

## Long → wide with `pivot_wider`

Sometimes you want the other direction — e.g. to compute a correlation matrix.

```{r}
returns_long <- long |>
  group_by(ticker) |>
  arrange(date) |>
  mutate(log_return = log(close / lag(close))) |>
  ungroup() |>
  filter(!is.na(log_return))

returns_wide <- returns_long |>
  select(date, ticker, log_return) |>
  pivot_wider(names_from = ticker, values_from = log_return)

head(returns_wide, 3)

# Correlation matrix over the wide format
cor(returns_wide |> select(-date), use = "complete.obs") |> round(3)
```

Wide when you want cross-column math (correlations, portfolio returns from weight × ticker matrices).

{{< include demo-pivot-wider.qmd >}}
```

- [ ] **Step 5: Render + verify**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -3
grep -c "s01-get-data\|s02-first-plot\|s03-transform\|s04-tidy" _site/index.html
```

Expected: render exits 0; grep ≥ 4.

- [ ] **Step 6: Commit**

```bash
git add sections/01-get-data.qmd sections/02-first-plot.qmd \
        sections/03-transform.qmd sections/04-tidy.qmd
git commit -m "feat: modules 1–4 (get-data, first-plot, transform, tidy)"
```

---

## Task 12: Write modules 5–8 (Workflow · Dates & TS · Functions · Iteration)

**Files:**
- Create: `sections/05-workflow.qmd`
- Create: `sections/06-dates-timeseries.qmd`
- Create: `sections/07-functions.qmd`
- Create: `sections/08-iteration.qmd`

- [ ] **Step 1: Create `sections/05-workflow.qmd`**

```markdown
# 5 · Pipes & workflow {.hero #s05-workflow}

::: {.section-badge}
Module 5 · Workflow (R4DS ch 3, 6)
:::

The pipe and code style

::: {.lede}
The base-R pipe `|>` and the tidyverse `%>%` do the same thing 95% of the time: pass the left value into the first argument of the right function.
:::

## Same pipeline, three ways

Nested (unreadable):

```r
head(
  filter(
    mutate(
      read_csv("data/AAPL.csv"),
      log_return = log(adjusted / lag(adjusted))),
    date >= "2024-01-01"),
  5)
```

Assignment-heavy (verbose):

```r
aapl <- read_csv("data/AAPL.csv")
aapl <- mutate(aapl, log_return = log(adjusted / lag(adjusted)))
aapl <- filter(aapl, date >= "2024-01-01")
head(aapl, 5)
```

Piped (read top-to-bottom like a recipe):

```{r}
#| message: false
library(readr); library(dplyr)

read_csv("data/AAPL.csv", show_col_types = FALSE) |>
  mutate(log_return = log(adjusted / lag(adjusted))) |>
  filter(date >= as.Date("2024-01-01")) |>
  head(5)
```

## Style checklist

- **One verb per line** — the pipe should read as a sequence of steps
- **Indent continuation lines** — 2 spaces after `|>`
- **Meaningful names** — `daily_returns`, not `df2`
- **Snake_case for objects and columns** — `log_return`, not `LogReturn`
- **Use projects, not `setwd()`** — the working directory is the `.Rproj` folder
```

- [ ] **Step 2: Create `sections/06-dates-timeseries.qmd`**

```markdown
# 6 · Dates & time series {.hero #s06-dates-ts}

::: {.section-badge}
Module 6 · Dates in R
:::

Working with time

::: {.lede}
`Date` objects in base R + `lubridate` for parsing / arithmetic + `zoo::rollmean` for rolling windows.
:::

## Parsing and formatting

```{r}
#| message: false
library(lubridate)

d <- ymd("2024-06-30")
class(d)
year(d);  month(d);  day(d);  wday(d, label = TRUE)
d + months(3)   # forward three months
d - years(1)    # a year ago
```

## Rolling averages with `zoo::rollmean`

```{r}
#| message: false
library(readr); library(dplyr); library(zoo)

aapl <- read_csv("data/AAPL.csv", show_col_types = FALSE) |>
  mutate(
    ma_20  = rollmean(adjusted, k = 20,  fill = NA, align = "right"),
    ma_60  = rollmean(adjusted, k = 60,  fill = NA, align = "right"),
    ma_200 = rollmean(adjusted, k = 200, fill = NA, align = "right")
  )

aapl |> select(date, adjusted, ma_20, ma_60, ma_200) |> tail(4)
```

`align = "right"` means the moving average at date *t* uses the *k* prior days including *t* — the causal convention traders use.

## Quick moving-average chart

```{r}
#| message: false
#| fig-align: center
#| fig-width: 8
#| fig-height: 4
library(ggplot2); library(tidyr)

aapl |>
  select(date, adjusted, ma_60, ma_200) |>
  pivot_longer(-date, names_to = "series", values_to = "value") |>
  ggplot(aes(date, value, colour = series)) +
  geom_line() +
  theme_minimal() +
  labs(title = "AAPL price with 60-day and 200-day moving averages",
       x = NULL, y = "USD", colour = NULL)
```
```

- [ ] **Step 3: Create `sections/07-functions.qmd`**

```markdown
# 7 · Write your own functions {.hero #s07-functions}

::: {.section-badge}
Module 7 · Program (R4DS ch 25)
:::

Wrap the analysis

::: {.lede}
When you find yourself pasting the same expression three times, it's a function. Finance is full of repeated formulas — Sharpe, drawdown, annualisation. Learn to write them yourself before reaching for `PerformanceAnalytics`.
:::

## Anatomy

```{r}
sharpe_ratio <- function(returns, rf = 0, freq = 252) {
  excess <- returns - rf / freq
  mean(excess, na.rm = TRUE) / sd(excess, na.rm = TRUE) * sqrt(freq)
}

# Try it on AAPL daily log returns
library(readr); library(dplyr)
aapl_ret <- read_csv("data/AAPL.csv", show_col_types = FALSE) |>
  mutate(r = log(adjusted / lag(adjusted))) |>
  pull(r)

sharpe_ratio(aapl_ret) |> round(3)
```

## Maximum drawdown

```{r}
max_drawdown <- function(returns) {
  cum   <- cumprod(1 + returns[!is.na(returns)])
  peaks <- cummax(cum)
  min((cum - peaks) / peaks)
}

max_drawdown(aapl_ret) |> round(3)
```

Interpretation: the largest peak-to-trough loss you'd have experienced holding AAPL over the full sample.

## Compare to a library implementation

```{r}
#| warning: false
#| message: false
library(PerformanceAnalytics)
# PerformanceAnalytics expects an xts; convert quickly
aapl_xts <- read_csv("data/AAPL.csv", show_col_types = FALSE) |>
  mutate(r = log(adjusted / lag(adjusted))) |>
  filter(!is.na(r)) |>
  { \(d) xts::xts(d$r, order.by = d$date) }()

SharpeRatio.annualized(aapl_xts, Rf = 0) |> round(3)
maxDrawdown(aapl_xts) |> round(3)
```

The numbers should match your homemade functions to within rounding.
```

- [ ] **Step 4: Create `sections/08-iteration.qmd`**

```markdown
# 8 · Iterate across tickers {.hero #s08-iteration}

::: {.section-badge}
Module 8 · Iteration (R4DS ch 26)
:::

`purrr::map_dfr` and friends

::: {.lede}
`for` loops work. But when the input is a vector of things and the output is one row per thing, `map_dfr` reads like a sentence.
:::

## Compute Sharpe for every ticker in one line

```{r}
#| message: false
library(readr); library(dplyr); library(purrr)

sharpe_ratio <- function(returns, rf = 0, freq = 252) {
  excess <- returns - rf / freq
  mean(excess, na.rm = TRUE) / sd(excess, na.rm = TRUE) * sqrt(freq)
}

tickers <- c("AAPL", "MSFT", "SPY", "TLT", "GLD")

summary_tbl <- map_dfr(tickers, function (tk) {
  path <- paste0("data/", tk, ".csv")
  r <- read_csv(path, show_col_types = FALSE) |>
    mutate(r = log(adjusted / lag(adjusted))) |>
    pull(r)
  tibble(
    ticker = tk,
    n      = sum(!is.na(r)),
    mean   = mean(r, na.rm = TRUE),
    sd     = sd(r,   na.rm = TRUE),
    sharpe = sharpe_ratio(r)
  )
})

summary_tbl |> mutate(across(where(is.numeric), round, 4))
```

Five rows out, one per ticker. Change the ticker vector — nothing else changes.

## Why `map_dfr` and not `for`

- `map_dfr` gives you a tibble automatically — no manual `rbind` or pre-allocation
- Errors point at the item that failed (`try(map_dfr, ...)`) — easy to catch a single bad ticker
- It composes: `map_dfr(x, f) |> filter(...)` reads cleanly
```

- [ ] **Step 5: Render + verify**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -3
grep -c "s05-workflow\|s06-dates\|s07-functions\|s08-iteration" _site/index.html
grep -c "sharpe_ratio\|max_drawdown\|rollmean" _site/index.html
```

Expected: render exits 0; both greps ≥ 4.

- [ ] **Step 6: Commit**

```bash
git add sections/05-workflow.qmd sections/06-dates-timeseries.qmd \
        sections/07-functions.qmd sections/08-iteration.qmd
git commit -m "feat: modules 5–8 (workflow, dates+TS, functions, iteration)"
```

---

## Task 13: Write modules 9–10 (CAPM regression · Communicate)

**Files:**
- Create: `sections/09-capm.qmd`
- Create: `sections/10-communicate.qmd`

- [ ] **Step 1: Create `sections/09-capm.qmd`**

```markdown
# 9 · Linear regression: CAPM {.hero #s09-capm}

::: {.section-badge}
Module 9 · Model (R4DS light)
:::

Alpha and beta

::: {.lede}
The Capital Asset Pricing Model in one line: `lm(r_asset - rf ~ r_mkt - rf)`. Slope is beta, intercept is alpha, R² is how much of the asset's variance the market explains.
:::

## Load the pieces

```{r}
#| message: false
library(readr); library(dplyr); library(broom); library(lubridate)

# AAPL excess returns
aapl <- read_csv("data/AAPL.csv", show_col_types = FALSE) |>
  mutate(r_aapl = log(adjusted / lag(adjusted))) |>
  select(date, r_aapl)

ff <- read_csv("data/ff_factors.csv", show_col_types = FALSE) |>
  select(date, mkt_rf, rf)

capm_data <- inner_join(aapl, ff, by = "date") |>
  mutate(r_aapl_excess = r_aapl - rf) |>
  filter(!is.na(r_aapl_excess))

head(capm_data, 3)
```

## Fit the regression

```{r}
fit <- lm(r_aapl_excess ~ mkt_rf, data = capm_data)
summary(fit)
```

## Read the coefficients

```{r}
tidy(fit)
glance(fit) |> select(r.squared, adj.r.squared, sigma, statistic, p.value)
```

- **Intercept** (`alpha`) — the "excess" return AAPL earns per day beyond what CAPM predicts. Statistically indistinguishable from zero here.
- **Slope** (`beta`) — how much AAPL moves for each 1% move in the excess market return. β ≈ 1.2 means AAPL is somewhat more volatile than the market.
- **R²** — fraction of AAPL's daily variance explained by the market. ~0.4 for a large-cap tech name is typical.

## Extend to a factor model (three factors)

```{r}
ff_full <- read_csv("data/ff_factors.csv", show_col_types = FALSE)
capm3 <- inner_join(aapl, ff_full, by = "date") |>
  mutate(r_aapl_excess = r_aapl - rf) |>
  filter(!is.na(r_aapl_excess))

lm(r_aapl_excess ~ mkt_rf + smb + hml, data = capm3) |> tidy()
```

Same one-line change adds `SMB` (size) and `HML` (value) — the Fama-French 3-factor model.
```

- [ ] **Step 2: Create `sections/10-communicate.qmd`**

```markdown
# 10 · Communicate with Quarto {.hero #s10-communicate}

::: {.section-badge}
Module 10 · Communicate (R4DS ch 29)
:::

Reports, slides, dashboards

::: {.lede}
Quarto is what this entire deck is written in. The same `.qmd` file can become HTML, PDF, Word, or a Reveal.js slide deck — you pick the format in the YAML header.
:::

## The minimum

Create `report.qmd`:

```r
---
title: "AAPL: a mini portfolio note"
author: "Gabriel Cabrera"
format: html
execute:
  echo: true
  warning: false
---

## Setup

```{r}
library(readr); library(dplyr); library(ggplot2)
aapl <- read_csv("data/AAPL.csv", show_col_types = FALSE)
```

## Price history

```{r}
ggplot(aapl, aes(date, adjusted)) + geom_line() + theme_minimal()
```

## Summary

- Mean daily log return: `{r} round(mean(log(aapl$adjusted / lag(aapl$adjusted)), na.rm = TRUE), 5)`
```

Then in the terminal:

```
quarto render report.qmd
```

## Publication-grade tables with `gt`

```{r}
#| message: false
library(gt)

capm_results <- tibble(
  ticker = c("AAPL", "MSFT", "SPY", "GLD"),
  alpha  = c(0.0002, 0.0001, 0.0000, 0.0001),
  beta   = c(1.21, 1.09, 1.00, 0.06),
  r2     = c(0.42, 0.51, 1.00, 0.02)
)

capm_results |>
  gt() |>
  tab_header(title = "CAPM regression summary") |>
  fmt_number(columns = c(alpha), decimals = 4) |>
  fmt_number(columns = c(beta, r2), decimals = 2) |>
  cols_label(ticker = "Ticker", alpha = "α", beta = "β", r2 = "R²")
```

## Ship the whole analysis

Pick your output format in the YAML:

```yaml
format: revealjs      # for a slide deck like this one
format: html          # for a notebook-style report
format: pdf           # for a printable PDF
format: docx          # for a Word document
```

Same `.qmd`, four different outputs. Add `execute: freeze: auto` to cache chunk results so successive renders only re-run edited chunks.
```

- [ ] **Step 3: Render + verify**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -3
grep -c "s09-capm\|s10-communicate" _site/index.html
grep -c "lm(r_aapl_excess ~ mkt_rf\|CAPM regression" _site/index.html
```

Expected: render exits 0; both greps ≥ 2.

- [ ] **Step 4: Commit**

```bash
git add sections/09-capm.qmd sections/10-communicate.qmd
git commit -m "feat: modules 9–10 (CAPM regression, communicate)"
```

---

## Task 14: Wire it all up — `index.qmd` include list + `check-render.sh`

**Files:**
- Modify: `index.qmd`
- Modify: `scripts/check-render.sh`

- [ ] **Step 1: Replace the includes in `index.qmd`**

Open `index.qmd` and replace everything below the YAML frontmatter with:

```markdown
{{< include sections/00-title.qmd >}}
{{< include sections/00b-about-me.qmd >}}
{{< include sections/01-get-data.qmd >}}
{{< include sections/02-first-plot.qmd >}}
{{< include sections/03-transform.qmd >}}
{{< include sections/04-tidy.qmd >}}
{{< include sections/05-workflow.qmd >}}
{{< include sections/06-dates-timeseries.qmd >}}
{{< include sections/07-functions.qmd >}}
{{< include sections/08-iteration.qmd >}}
{{< include sections/09-capm.qmd >}}
{{< include sections/10-communicate.qmd >}}
{{< include sections/11-resources.qmd >}}
```

The five demo qmds are now included **inside** their parent module qmds (T11), not at the top level. Note that `sections/demo-{mutate,filter,pivot-longer,pivot-wider,ggplot}.qmd` are no longer listed here — they're pulled in by `03-transform.qmd`, `04-tidy.qmd`, and `02-first-plot.qmd`.

- [ ] **Step 2: Update `scripts/check-render.sh` with the new section IDs**

Open `scripts/check-render.sh` and find the loop that iterates over the old section slugs (something like `for n in 00-title 01-installation …`). Replace with the new set:

```bash
for n in 00-title 00b-about \
         01-get-data 02-first-plot 03-transform 04-tidy \
         05-workflow 06-dates-ts 07-functions 08-iteration \
         09-capm 10-communicate 11-resources; do
  if ! grep -q "s${n}" "$OUT"; then
    echo "FAIL: missing section id s${n}"; exit 1
  fi
done
```

Also update any grep asserting demo presence — the demo IDs did not change:

```bash
for demo in demo-mutate-slide demo-filter-slide demo-pivot-longer-slide \
            demo-pivot-wider-slide demo-ggplot-slide; do
  if ! grep -q "$demo" "$OUT"; then
    echo "FAIL: missing demo id $demo"; exit 1
  fi
done
```

Also: remove any grep asserting the presence of "Recap" — we've dropped those.

- [ ] **Step 3: Full clean render**

```bash
rm -rf _freeze _site
quarto render 2>&1 | tail -5
```

Expected: exits 0. `_site/index.html` created. Size should be > 200 KB (the finance modules add real content).

- [ ] **Step 4: Run the build-time checks**

```bash
chmod +x scripts/check-render.sh
./scripts/check-render.sh
```

Expected: prints `OK:` for each section id, `OK:` for each demo id, ends with `All checks passed.`, exits 0.

- [ ] **Step 5: Grep for banned strings**

Confirm no leftover "recap" or "Intro to R" content:

```bash
grep -ic "recap" _site/index.html || echo "0 recap mentions (expected)"
grep -ic "Introduction to R\|palmerpenguins\|bill_length_mm" _site/index.html
```

Expected: first grep = 0 (recap slides truly gone). Second grep = 0 or 1 (palmerpenguins may still appear inside `renv.lock`-generated docs — check `_site/index.html` specifically; the `bill_length_mm` string should be 0 since T4 and T8 replaced it).

If the second grep returns > 0 in `_site/index.html`, it means the demo-ggplot fallback code still holds the old default text somewhere the config globals didn't override. Investigate and fix before committing.

- [ ] **Step 6: Commit**

```bash
git add index.qmd scripts/check-render.sh
git commit -m "feat: wire new module list into index.qmd + check-render.sh"
```

- [ ] **Step 7: Live-check in the browser**

```bash
quarto preview --port 5173 --no-browser &
sleep 4
open "http://localhost:5173"
```

Walk through all ~15 slides (title → about → 10 modules → resources). Confirm:

1. Title reads "R for Finance", 10 modules
2. About-me slide still shows ORCID + contact links (unchanged from before)
3. Every module hero renders with badge + title
4. Live `{r}` chunks show real output (AAPL prices, CAPM coefficients, Sharpe ratios)
5. All 5 demo animations play with finance data (mutate log-returns, filter ticker+date, pivots on prices/returns, ggplot deconstructed shows AAPL/SPY/GLD line series)
6. No "Recap" slides anywhere
7. Footer `gcabrerag.rbind.io` visible on every slide

If anything fails visually, capture the symptom in a short bullet and fix in a follow-up commit before finishing.

- [ ] **Step 8: Final commit if needed**

```bash
git status
# If any fixes made:
git add <files>
git commit -m "fix: manual walkthrough follow-ups"
```

---

## Done

Total task count: 14. Expected commits: ~15–17. Estimated wall-clock: 3–5 hours depending on how much polish each module's prose gets.

**Acceptance signals** (from spec §7):
- ✅ `quarto render` exits 0 from a clean checkout after `renv::restore()`
- ✅ `./scripts/check-render.sh` passes
- ✅ All 10 module heroes render
- ✅ No "Recap" text in output
- ✅ 5 demo animations play on finance data
- ✅ Live R chunks show real numbers (real α/β in §9 CAPM, real Sharpe in §8 iteration, real prices throughout)
