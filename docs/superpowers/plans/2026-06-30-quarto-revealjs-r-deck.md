# Quarto Reveal.js R Course Deck — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 17-section English-language Quarto Reveal.js deck that ports the Xaringan course at <https://intro-r-data-analytics.netlify.app>, with live R execution, a custom "Tidyverse Friendly" theme, and a subtle anime.js animation engine.

**Architecture:** Single Quarto project with modular `{{< include >}}` partials (one per module), a shared SCSS theme, a data-attribute-driven anime.js engine, and renv-pinned R dependencies. Build via `quarto render`; cache R chunks with `freeze: auto`.

**Tech Stack:** Quarto 1.9.38 (revealjs format) · R 4.5.1 · knitr · tidyverse + palmerpenguins · renv · anime.js v4 (IIFE bundle) · SCSS · Reveal.js (transitive)

**Spec:** `docs/superpowers/specs/2026-06-30-quarto-revealjs-r-deck-design.md` — read it before starting Task 1.

---

## File Structure Overview

| Path | Purpose | Owner task |
|------|---------|------------|
| `_quarto.yml` | Project config, theme link, execute defaults | Task 2 |
| `index.qmd` | Master deck shell + 17 `{{< include >}}` lines | Task 2 |
| `sections/00-title.qmd` … `16-resources.qmd` | One file per module | Tasks 6–13 |
| `assets/theme.scss` | Palette + typography, extends revealjs default | Task 3 |
| `assets/head.html` | Font preconnect, Google Fonts links, anime.js CDN | Task 3 (fonts) + Task 4 (anime.js) |
| `assets/animations.js` | anime.js dispatcher + 8 effect functions | Tasks 4–5 |
| `assets/syntax.theme` | Custom Pandoc highlight theme | Task 3 |
| `assets/vendor/anime.min.js` | Offline fallback for anime.js | Task 4 |
| `assets/img/` | Logos (tidyverse, posit) | Task 13 (only place logos appear) |
| `scripts/check-render.sh` | Build-time render & grep assertions | Task 14 |
| `renv.lock`, `renv/activate.R`, `.Rprofile` | renv-pinned R deps | Task 1 |
| `_freeze/` | Quarto chunk cache (committed) | created on first render |
| `.gitignore` | (already exists from spec commit) | Task 1 (extend) |
| `README.md` | Bootstrap instructions | Task 1 |

---

## Task 1: Repo bootstrap — README, .gitignore extension, renv init

**Files:**
- Modify: `.gitignore`
- Create: `README.md`
- Create: `renv.lock`, `renv/activate.R`, `.Rprofile` (renv-generated)

- [ ] **Step 1: Extend `.gitignore`**

The current `.gitignore` only contains `.superpowers/` and `.DS_Store`. Add Quarto + R + renv entries.

Final contents of `.gitignore`:

```gitignore
.superpowers/
.DS_Store
_site/
.quarto/
.Rproj.user/
.Rhistory
renv/library/
renv/python/
renv/staging/
```

(Do **not** add `_freeze/` here — it's committed per Quarto convention.)

- [ ] **Step 2: Write `README.md`**

```markdown
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
```

- [ ] **Step 3: Initialize renv (in R)**

Run from the repo root:

```bash
R -e 'install.packages("renv", repos="https://cloud.r-project.org"); renv::init(bare = TRUE)'
```

Expected: `renv/activate.R`, `.Rprofile`, and an empty `renv.lock` are created.

- [ ] **Step 4: Install the required R packages**

```bash
R -e 'renv::install(c("palmerpenguins", "dplyr", "tibble", "ggplot2", "readr", "tidyr", "purrr", "knitr"))'
```

Expected: each package downloads and installs into `renv/library/`. If any fail (network, compiler), retry once; if still failing, surface the error rather than skipping the package.

- [ ] **Step 5: Snapshot the lockfile**

```bash
R -e 'renv::snapshot(prompt = FALSE)'
```

Expected: `renv.lock` now lists all 8 packages plus their transitive deps.

- [ ] **Step 6: Verify renv state**

```bash
R -e 'renv::status()'
```

Expected output contains: `* No issues found -- the project is in a consistent state.`

- [ ] **Step 7: Commit**

```bash
git add .gitignore README.md renv.lock renv/activate.R .Rprofile
git commit -m "chore: bootstrap renv with tidyverse + palmerpenguins"
```

(`renv/library/` is gitignored; do not stage it.)

---

## Task 2: Project skeleton — `_quarto.yml`, `index.qmd`, section stubs, smoke render

**Files:**
- Create: `_quarto.yml`
- Create: `index.qmd`
- Create: `sections/00-title.qmd` through `sections/16-resources.qmd` (17 empty stub files)
- Create: `assets/.gitkeep`, `data/.gitkeep`, `scripts/.gitkeep`

- [ ] **Step 1: Write `_quarto.yml`**

Full content (mirrors spec §7.1; theme/highlight references resolved in Task 3, JS in Tasks 4–5):

```yaml
project:
  type: default
  render: ["index.qmd"]
  output-dir: _site

format:
  revealjs:
    theme: [default, assets/theme.scss]
    slide-number: c/t
    progress: true
    transition: fade
    transition-speed: fast
    history: true
    chalkboard: false
    menu:
      side: left
      numbers: true
    include-in-header:
      - file: assets/head.html
    include-after-body:
      - file: assets/animations.js
    code-line-numbers: true
    highlight-style: assets/syntax.theme

execute:
  echo: true
  warning: false
  message: false
  freeze: auto

knitr:
  opts_chunk:
    dev: "svg"
    fig.width: 7
    fig.height: 4.2
    fig.align: "center"
```

- [ ] **Step 2: Create the 17 section stub files**

Each stub gets a single placeholder slide so the include resolves and the render succeeds. Use this template for each, replacing `NN` and `<Module Title>`:

```markdown
# <Module Title> {.hero data-anim="stagger-up" #sNN-<slug>}

::: {.section-badge}
Module NN
:::

<Module Title>

::: {.lede}
Placeholder — content arrives in a later task.
:::
```

Concrete file names + titles + slugs (these are the canonical IDs referenced in the spec verification grep):

| File | Title | `#` ID |
|------|-------|--------|
| `sections/00-title.qmd` | Introduction to R | `s00-title` |
| `sections/01-installation.qmd` | Installing R & RStudio | `s01-installation` |
| `sections/02-posit-cloud.qmd` | Posit Cloud | `s02-posit-cloud` |
| `sections/03-projects.qmd` | RStudio Projects | `s03-projects` |
| `sections/04-packages.qmd` | Package Management | `s04-packages` |
| `sections/05-scripts.qmd` | R Scripts | `s05-scripts` |
| `sections/06-data-structures.qmd` | Data Structures | `s06-data-structures` |
| `sections/07-vectors-lists.qmd` | Vectors & Lists | `s07-vectors-lists` |
| `sections/08-matrices-arrays.qmd` | Matrices & Arrays | `s08-matrices-arrays` |
| `sections/09-dataframes-tibbles.qmd` | Data Frames & Tibbles | `s09-dataframes-tibbles` |
| `sections/10-subsetting.qmd` | Subsetting | `s10-subsetting` |
| `sections/11-conditionals-loops.qmd` | Conditionals & Loops | `s11-conditionals-loops` |
| `sections/12-functions.qmd` | Functions | `s12-functions` |
| `sections/13-linear-regression.qmd` | Linear Regression | `s13-linear-regression` |
| `sections/14-visualization.qmd` | Visualization | `s14-visualization` |
| `sections/15-tidyverse.qmd` | The Tidyverse | `s15-tidyverse` |
| `sections/16-resources.qmd` | Resources | `s16-resources` |

- [ ] **Step 3: Write `index.qmd`** (master shell with explicit includes)

```markdown
---
title: "Introduction to R"
subtitle: "From installation to the tidyverse"
author: "Gabriel Cabrera"
date: "2026-06-30"
date-format: "MMMM YYYY"
---

{{< include sections/00-title.qmd >}}
{{< include sections/01-installation.qmd >}}
{{< include sections/02-posit-cloud.qmd >}}
{{< include sections/03-projects.qmd >}}
{{< include sections/04-packages.qmd >}}
{{< include sections/05-scripts.qmd >}}
{{< include sections/06-data-structures.qmd >}}
{{< include sections/07-vectors-lists.qmd >}}
{{< include sections/08-matrices-arrays.qmd >}}
{{< include sections/09-dataframes-tibbles.qmd >}}
{{< include sections/10-subsetting.qmd >}}
{{< include sections/11-conditionals-loops.qmd >}}
{{< include sections/12-functions.qmd >}}
{{< include sections/13-linear-regression.qmd >}}
{{< include sections/14-visualization.qmd >}}
{{< include sections/15-tidyverse.qmd >}}
{{< include sections/16-resources.qmd >}}
```

- [ ] **Step 4: Create placeholder asset files so the YAML references don't error**

Empty (or minimal) placeholders for the files Task 3/4 will fill in. Without these, `quarto render` will fail because `include-in-header`/`include-after-body`/`highlight-style`/`theme` all point at missing files.

```bash
mkdir -p assets/vendor assets/img data scripts
touch assets/animations.js assets/head.html
```

Write a one-line `assets/theme.scss`:

```scss
/*-- scss:defaults --*/
$presentation-font-size-root: 32px;
```

Write a minimal valid Pandoc highlight theme at `assets/syntax.theme`. Use Pandoc's built-in `tango` as the starting point:

```bash
quarto pandoc --print-highlight-style tango > assets/syntax.theme
```

Expected: `assets/syntax.theme` is a JSON file ~2 KB starting with `{`.

- [ ] **Step 5: Smoke render**

```bash
quarto render
```

Expected: exits 0. `_site/index.html` is created. Open it in a browser (or check size > 50 KB): the deck shows 17 placeholder hero slides with module titles.

If render fails with a "highlight-style" error, double-check Step 4's `quarto pandoc` output is valid JSON.

- [ ] **Step 6: Commit**

```bash
git add _quarto.yml index.qmd sections/ assets/ data/ scripts/
git commit -m "feat: scaffold Quarto deck with 17 section stubs"
```

---

## Task 3: Theme system — `theme.scss`, fonts in `head.html`, `syntax.theme`

**Files:**
- Modify: `assets/theme.scss` (replace one-line placeholder)
- Modify: `assets/head.html` (add font preconnect + links)
- Modify: `assets/syntax.theme` (palette-matched colors)

- [ ] **Step 1: Write the full `assets/theme.scss`**

Mirrors spec §4. Palette defined as both Sass `$vars` (consumed at compile time by Quarto's revealjs theme machinery) and CSS custom properties (consumed at runtime by `animations.js` for accent colors).

```scss
/*-- scss:defaults --*/

// Tidyverse-Friendly palette
$body-bg: #FBF7F0;
$body-color: #2D2438;
$link-color: #5B8FE0;
$selection-bg: rgba(155, 107, 216, 0.25);

// Code blocks
$code-bg: #FFFFFF;
$code-color: #2D2438;
$code-block-bg: #FFFFFF;

// Typography
$font-family-sans-serif: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
$font-family-monospace: "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace;
$presentation-font-size-root: 32px;
$presentation-h1-font-size: 1.6em;
$presentation-h2-font-size: 1.25em;
$presentation-heading-font-weight: 700;
$presentation-heading-color: #2D2438;

/*-- scss:rules --*/

:root {
  --bg: #FBF7F0;
  --bg-elev: #FFFFFF;
  --ink: #2D2438;
  --ink-soft: #5B5168;
  --accent-1: #9B6BD8;
  --accent-2: #5B8FE0;
  --accent-grad: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  --ok: #2D8F6F;
  --warn: #D9883F;
  --rule: #EAE3F3;
}

.reveal {
  letter-spacing: -0.005em;
}

.reveal h1, .reveal h2, .reveal h3 {
  letter-spacing: -0.015em;
}

// Title underline (the 48px gradient bar)
.reveal section > h2::after {
  content: "";
  display: block;
  width: 48px;
  height: 3px;
  margin-top: 0.4em;
  background: var(--accent-grad);
  border-radius: 2px;
}

// Section badge (small uppercase label above titles)
.section-badge {
  font-size: 0.42em;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-1);
  font-weight: 600;
  margin-bottom: 0.4em;
}

// Hero slides
.reveal section.hero {
  background: var(--accent-grad);
  color: white;
}
.reveal section.hero h1,
.reveal section.hero h2,
.reveal section.hero .section-badge {
  color: white;
}
.reveal section.hero h2::after {
  background: white;
}

// Code blocks
.reveal pre {
  background: var(--bg-elev);
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 0.6em 0.8em;
  box-shadow: 0 1px 0 rgba(45, 36, 56, 0.04);
}
.reveal code {
  font-family: $font-family-monospace;
  font-size: 0.78em;
}

// Progress bar
.reveal .progress {
  color: var(--accent-1);
  height: 4px;
}
.reveal .progress span {
  background: var(--accent-grad);
}

// Utilities
.lede {
  font-size: 1.05em;
  color: var(--ink-soft);
  line-height: 1.45;
}
.muted { color: var(--ink-soft); }
.tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 0.55em;
  background: var(--rule);
  color: var(--accent-1);
  border-radius: 3px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}
.kbd {
  display: inline-block;
  padding: 1px 6px;
  font-family: $font-family-monospace;
  font-size: 0.82em;
  background: var(--bg-elev);
  border: 1px solid var(--rule);
  border-bottom-width: 2px;
  border-radius: 4px;
  color: var(--ink);
}
```

- [ ] **Step 2: Write `assets/head.html` (fonts only — anime.js added in Task 4)**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
```

- [ ] **Step 3: Adjust `assets/syntax.theme` to match the palette**

The Pandoc highlight theme is JSON. Open `assets/syntax.theme` (the tango export from Task 2) and override these color fields (leave other fields as-is):

```json
{
  "background-color": "#FFFFFF",
  "default-color": "#2D2438",
  "text-styles": {
    "Keyword":        { "text-color": "#9B6BD8", "bold": true },
    "DataType":       { "text-color": "#9B6BD8" },
    "Function":       { "text-color": "#5B8FE0", "bold": false },
    "BuiltIn":        { "text-color": "#5B8FE0" },
    "ControlFlow":    { "text-color": "#9B6BD8", "bold": true },
    "String":         { "text-color": "#2D8F6F" },
    "Constant":       { "text-color": "#D9883F" },
    "DecVal":         { "text-color": "#D9883F" },
    "Float":          { "text-color": "#D9883F" },
    "Operator":       { "text-color": "#5B5168" },
    "Comment":        { "text-color": "#5B5168", "italic": true },
    "Variable":       { "text-color": "#2D2438" }
  }
}
```

Only these `text-styles` need updating; merge them into the existing JSON rather than replacing the whole file (other text-style keys can keep tango defaults).

- [ ] **Step 4: Render and verify**

```bash
quarto render
```

Expected: exits 0. Title slide now shows on a cream background with purple accents.

- [ ] **Step 5: Grep-check the theme is wired in**

```bash
grep -c "fonts.googleapis.com" _site/index.html
grep -c -- "--accent-1" _site/index.html
grep -c "JetBrains Mono" _site/index.html
```

Expected: each `grep -c` returns at least `1`. If any return `0`, the corresponding wiring is broken.

- [ ] **Step 6: Commit**

```bash
git add assets/theme.scss assets/head.html assets/syntax.theme
git commit -m "feat: theme system (Tidyverse-Friendly palette + Inter/JBMono)"
```

---

## Task 4: Animation engine + two general-purpose effects (`stagger-up`, `code-type`)

**Files:**
- Modify: `assets/head.html` (add anime.js script tag)
- Create: `assets/vendor/anime.min.js` (offline fallback)
- Modify: `assets/animations.js` (replace empty file with engine + 2 effects)

- [ ] **Step 1: Add anime.js to `assets/head.html`**

Append below the font links:

```html
<script>
  // Fallback loader: prefer CDN, drop to local vendor copy on error
  (function() {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/animejs@4.2.2/lib/anime.iife.min.js';
    s.onerror = function() {
      var f = document.createElement('script');
      f.src = 'assets/vendor/anime.min.js';
      document.head.appendChild(f);
    };
    document.head.appendChild(s);
  })();
</script>
```

(SRI hash intentionally omitted here — the implementer should compute it once the version is finalized and add `integrity="sha384-…"` + `crossorigin="anonymous"`. If unsure, leave SRI off for now; security exposure of a pinned-version CDN tag is low.)

- [ ] **Step 2: Download the offline vendor copy**

```bash
curl -L -o assets/vendor/anime.min.js \
  https://cdn.jsdelivr.net/npm/animejs@4.2.2/lib/anime.iife.min.js
test -s assets/vendor/anime.min.js && echo "OK: $(wc -c < assets/vendor/anime.min.js) bytes"
```

Expected: `OK: <some number > 10000>` (vendor file is non-empty).

If the v4.2.2 URL 404s, the implementer should adjust to the latest v4.x on jsDelivr at <https://www.jsdelivr.com/package/npm/animejs> and update **both** Step 1's CDN URL and this download command. Confirm `anime.animate` and `anime.stagger` exist on the global by running `node -e "globalThis.window={};require('./assets/vendor/anime.min.js'); console.log(Object.keys(window.anime||{}).slice(0,8))"` — if the file is the IIFE bundle, `window.anime` will be populated.

- [ ] **Step 3: Write `assets/animations.js` — engine + two effects**

Full content replacing the empty file:

```javascript
/*
  Slide animation engine.
  - Reads `data-anim="<name>"` attributes on the current slide and its children
  - Dispatches to a named effect function in EFFECTS
  - Respects `prefers-reduced-motion`
  - Replays on back-navigation
*/
(function () {
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animeReady = function () {
    return typeof window.anime !== 'undefined' && typeof window.anime.animate === 'function';
  };

  // Each effect: function(rootEl) — rootEl is either the slide section or a child carrying data-anim
  var EFFECTS = {
    // stagger-up: bullets translateY 12 -> 0, opacity 0 -> 1, 80ms stagger
    'stagger-up': function (root) {
      var items = root.querySelectorAll(':scope > ul > li, :scope > ol > li, [data-stagger-item]');
      if (!items.length) return;
      if (REDUCE) {
        items.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
        return;
      }
      items.forEach(function (el) { el.style.opacity = 0; el.style.transform = 'translateY(12px)'; });
      window.anime.animate(items, {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 420,
        delay: window.anime.stagger(80),
        ease: 'outQuad'
      });
    },

    // code-type: tokens (spans inside <pre><code>) fade in left-to-right
    'code-type': function (root) {
      var codeEls = root.querySelectorAll('pre code');
      if (!codeEls.length) return;
      codeEls.forEach(function (codeEl) {
        // Wrap each non-whitespace word in a span the first time we see this codeEl
        if (!codeEl.dataset.tokenized) {
          var html = codeEl.innerHTML;
          // Wrap text nodes while preserving existing syntax-highlight spans:
          // simpler approach — split visible text into character spans inside any existing structure
          var walker = document.createTreeWalker(codeEl, NodeFilter.SHOW_TEXT, null);
          var textNodes = [];
          while (walker.nextNode()) textNodes.push(walker.currentNode);
          textNodes.forEach(function (tn) {
            var frag = document.createDocumentFragment();
            tn.nodeValue.split(/(\s+)/).forEach(function (chunk) {
              if (/^\s+$/.test(chunk) || chunk === '') {
                frag.appendChild(document.createTextNode(chunk));
              } else {
                var span = document.createElement('span');
                span.className = 'tok';
                span.textContent = chunk;
                frag.appendChild(span);
              }
            });
            tn.parentNode.replaceChild(frag, tn);
          });
          codeEl.dataset.tokenized = '1';
        }
        var tokens = codeEl.querySelectorAll('.tok');
        if (REDUCE) {
          tokens.forEach(function (t) { t.style.opacity = 1; });
          return;
        }
        tokens.forEach(function (t) { t.style.opacity = 0; });
        window.anime.animate(tokens, {
          opacity: [0, 1],
          duration: 220,
          delay: window.anime.stagger(30),
          ease: 'outQuad'
        });
      });
    }

    // Additional effects added in Task 5.
  };

  function dispatch(slide) {
    if (!animeReady()) return;
    // Slide-level data-anim
    var slideAnim = slide.dataset && slide.dataset.anim;
    if (slideAnim && EFFECTS[slideAnim]) EFFECTS[slideAnim](slide);
    // Child-level data-anim
    var children = slide.querySelectorAll('[data-anim]');
    children.forEach(function (el) {
      var name = el.dataset.anim;
      if (EFFECTS[name]) EFFECTS[name](el);
    });
  }

  function runAnimsFor(slide) {
    // Try immediately, and again after a tick in case fonts / syntax highlight haven't settled
    dispatch(slide);
    setTimeout(function () { dispatch(slide); }, 50);
  }

  function init() {
    if (typeof Reveal === 'undefined') {
      setTimeout(init, 30);
      return;
    }
    Reveal.on('slidechanged', function (e) { runAnimsFor(e.currentSlide); });
    Reveal.on('ready', function (e) { runAnimsFor(Reveal.getCurrentSlide()); });
  }
  init();

  // Expose for debugging
  window.__deckAnims = { EFFECTS: EFFECTS, dispatch: dispatch };
})();
```

- [ ] **Step 4: Wire one stub slide as a smoke-test for `stagger-up`**

Edit `sections/00-title.qmd` to add a fragment-style content slide (still placeholder, but exercises the animation engine). Append after the existing hero slide:

```markdown
## What we'll cover {data-anim="stagger-up"}

- Installation and setup
- R fundamentals: data structures, subsetting, control flow
- Linear regression and visualization
- The tidyverse
```

- [ ] **Step 5: Render and visually verify**

```bash
quarto render
quarto preview
```

Open the second slide of §0 — bullets should slide up + fade in with stagger, not appear all at once. Hard-refresh (cmd-shift-R) to bust the cache.

- [ ] **Step 6: Grep-check the engine is present in the rendered output**

```bash
grep -c "data-anim=\"stagger-up\"" _site/index.html
grep -c "runAnimsFor" _site/index.html
grep -c "animejs@" _site/index.html
```

Expected: each returns ≥ 1.

- [ ] **Step 7: Commit**

```bash
git add assets/head.html assets/vendor/anime.min.js assets/animations.js sections/00-title.qmd
git commit -m "feat: animation engine + stagger-up and code-type effects"
```

---

## Task 5: Specialized animation effects (`vector-fill`, `matrix-grid`, `line-draw`, `count-up`, `bracket-glow`, `pipe-flow`)

**Files:**
- Modify: `assets/animations.js` (append 6 effect functions to the `EFFECTS` object)
- Modify: `assets/theme.scss` (append CSS helpers used by these effects)

This task adds the six specialized effects. For each one, the pattern is the same: append the function to `EFFECTS`, add any needed CSS, then add a stub slide somewhere (we'll defer most of these stub slides to the corresponding content task — they're only needed here if you want a smoke-test before content lands).

- [ ] **Step 1: Append CSS helpers to `assets/theme.scss`**

```scss
// Animation helpers
.vec-cell, .mat-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4em;
  height: 2.4em;
  margin: 0 4px;
  background: var(--rule);
  border-radius: 6px;
  font-family: $font-family-monospace;
  font-weight: 600;
  color: #5B3F8C;
}
.vec-row { display: flex; gap: 8px; justify-content: center; }
.mat-grid { display: grid; gap: 6px; justify-content: center; }
.bracket-target { position: relative; display: inline-block; padding: 0 2px; border-radius: 4px; }
.line-draw-svg path.draw { stroke-dasharray: 1; stroke-dashoffset: 1; }
.count-up { font-variant-numeric: tabular-nums; }
.pipe-stage {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 8px 12px;
  background: var(--bg-elev);
  border: 1px solid var(--rule);
  border-radius: 6px;
  font-family: $font-family-monospace;
  font-size: 0.72em;
  color: var(--accent-1);
}
.pipe-arrow { color: var(--ink-soft); font-size: 1.2em; margin: 0 6px; }
```

- [ ] **Step 2: Append effects to `assets/animations.js`**

Insert these six function entries into the `EFFECTS` object, immediately before the closing `}` of `EFFECTS`:

```javascript
,
// vector-fill: cells in a horizontal row scale 0->1 and color-fill
'vector-fill': function (root) {
  var data;
  try { data = JSON.parse(root.dataset.vector || '[]'); } catch (e) { return; }
  if (!data.length) return;
  if (!root.querySelector('.vec-row')) {
    var row = document.createElement('div');
    row.className = 'vec-row';
    data.forEach(function (v) {
      var c = document.createElement('span');
      c.className = 'vec-cell';
      c.textContent = String(v);
      row.appendChild(c);
    });
    root.appendChild(row);
  }
  var cells = root.querySelectorAll('.vec-cell');
  if (REDUCE) { cells.forEach(function (c) { c.style.transform = 'scale(1)'; c.style.opacity = 1; }); return; }
  cells.forEach(function (c) { c.style.transform = 'scale(0)'; c.style.opacity = 0; });
  window.anime.animate(cells, {
    scale: [0, 1],
    opacity: [0, 1],
    duration: 360,
    delay: window.anime.stagger(60),
    ease: 'outBack'
  });
},

// matrix-grid: 2D cells fill row-by-row
'matrix-grid': function (root) {
  var rows, cols, data;
  try { data = JSON.parse(root.dataset.matrix || '[]'); } catch (e) { return; }
  rows = data.length; cols = rows ? data[0].length : 0;
  if (!rows || !cols) return;
  if (!root.querySelector('.mat-grid')) {
    var grid = document.createElement('div');
    grid.className = 'mat-grid';
    grid.style.gridTemplateColumns = 'repeat(' + cols + ', auto)';
    data.forEach(function (row) {
      row.forEach(function (v) {
        var c = document.createElement('span');
        c.className = 'mat-cell';
        c.textContent = String(v);
        grid.appendChild(c);
      });
    });
    root.appendChild(grid);
  }
  var cells = root.querySelectorAll('.mat-cell');
  if (REDUCE) { cells.forEach(function (c) { c.style.opacity = 1; }); return; }
  cells.forEach(function (c) { c.style.opacity = 0; });
  window.anime.animate(cells, {
    opacity: [0, 1],
    duration: 280,
    delay: window.anime.stagger(50, { grid: [cols, rows], from: 'first' }),
    ease: 'outQuad'
  });
},

// line-draw: animate strokeDashoffset on SVG <path class="draw">
'line-draw': function (root) {
  var paths = root.querySelectorAll('svg path.draw');
  paths.forEach(function (p) {
    var len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = REDUCE ? 0 : len;
  });
  if (REDUCE || !paths.length) return;
  window.anime.animate(paths, {
    strokeDashoffset: [function (el) { return el.getTotalLength(); }, 0],
    duration: 900,
    ease: 'outCubic'
  });
},

// count-up: any element matching .count-up with data-final tweens its text 0 -> final
'count-up': function (root) {
  var nodes = root.querySelectorAll('.count-up[data-final]');
  if (!nodes.length) return;
  nodes.forEach(function (n) {
    var final = parseFloat(n.dataset.final);
    var decimals = parseInt(n.dataset.decimals || '0', 10);
    if (REDUCE) { n.textContent = final.toFixed(decimals); return; }
    var obj = { v: 0 };
    window.anime.animate(obj, {
      v: final,
      duration: 600,
      ease: 'outQuad',
      onUpdate: function () { n.textContent = obj.v.toFixed(decimals); }
    });
  });
},

// bracket-glow: pulse a box-shadow around any .bracket-target
'bracket-glow': function (root) {
  var targets = root.querySelectorAll('.bracket-target');
  if (!targets.length) return;
  if (REDUCE) return;
  window.anime.animate(targets, {
    boxShadow: [
      '0 0 0 0 rgba(155,107,216,0)',
      '0 0 0 6px rgba(155,107,216,0.35)',
      '0 0 0 0 rgba(155,107,216,0)'
    ],
    duration: 1100,
    loop: 2,
    ease: 'inOutQuad'
  });
},

// pipe-flow: stages translate in left-to-right, arrows fade in between
'pipe-flow': function (root) {
  var stages = root.querySelectorAll('.pipe-stage');
  var arrows = root.querySelectorAll('.pipe-arrow');
  if (!stages.length) return;
  if (REDUCE) {
    stages.forEach(function (s) { s.style.opacity = 1; s.style.transform = 'none'; });
    arrows.forEach(function (a) { a.style.opacity = 1; });
    return;
  }
  stages.forEach(function (s) { s.style.opacity = 0; s.style.transform = 'translateX(-12px)'; });
  arrows.forEach(function (a) { a.style.opacity = 0; });
  window.anime.animate(stages, {
    opacity: [0, 1],
    translateX: [-12, 0],
    duration: 400,
    delay: window.anime.stagger(180),
    ease: 'outQuad'
  });
  window.anime.animate(arrows, {
    opacity: [0, 1],
    duration: 200,
    delay: window.anime.stagger(180, { start: 180 }),
    ease: 'outQuad'
  });
}
```

(Note: the leading `,` is intentional — it follows the existing `'code-type': function(...) {...}` entry.)

- [ ] **Step 3: Render and verify the engine still loads**

```bash
quarto render
grep -c "vector-fill" _site/index.html
grep -c "matrix-grid" _site/index.html
grep -c "line-draw" _site/index.html
grep -c "count-up" _site/index.html
grep -c "bracket-glow" _site/index.html
grep -c "pipe-flow" _site/index.html
```

Expected: each returns ≥ 1 (the names appear inlined in the `animations.js` script tag).

- [ ] **Step 4: Commit**

```bash
git add assets/animations.js assets/theme.scss
git commit -m "feat: add 6 specialized animation effects"
```

---

## Task 6: §0 Title + §16 Resources (the bookends)

**Files:**
- Modify: `sections/00-title.qmd` (replace stub + Task 4's smoke-test slide with final content)
- Modify: `sections/16-resources.qmd` (replace stub)

- [ ] **Step 1: Final `sections/00-title.qmd`**

```markdown
# Introduction to R {.hero #s00-title}

::: {.section-badge}
Course · 17 modules
:::

Introduction to R

::: {.lede}
From installation to the tidyverse. Live code, real data, reproducible workflows.
:::

## What we'll cover {data-anim="stagger-up"}

- **Setup** — installation, projects, packages, scripts
- **Foundations** — vectors, matrices, data frames, subsetting
- **Programming** — conditionals, loops, functions
- **Analysis** — linear regression, visualization
- **The tidyverse** — modern R workflow

## How this deck works

::: {.lede}
Each module opens with a hero slide, ends with a 3-bullet recap.
:::

- Code blocks are **live**: the output you see was just computed
- Animations highlight *structure*, never decoration
- Navigate with `→` / `←`; press `o` for an overview; `s` for speaker notes

---

::: {.section-badge}
Recap
:::

## Module 0 · Recap {data-anim="stagger-up"}

- 17 modules, ~70 slides, English
- Live R execution via knitr + Quarto
- Subtle animations for pedagogy, never decoration
```

- [ ] **Step 2: Final `sections/16-resources.qmd`**

```markdown
# Resources {.hero #s16-resources}

::: {.section-badge}
Module 16
:::

Where to go next

::: {.lede}
Books, cheatsheets, and the broader R community.
:::

## Essential reading {data-anim="stagger-up"}

- **R for Data Science (2e)** — Wickham, Çetinkaya-Rundel, Grolemund
  [r4ds.hadley.nz](https://r4ds.hadley.nz)
- **Advanced R (2e)** — Hadley Wickham
  [adv-r.hadley.nz](https://adv-r.hadley.nz)
- **The Big Book of R** — curated catalogue of free R books
  [bigbookofr.com](https://www.bigbookofr.com)

## Cheatsheets & references {data-anim="stagger-up"}

- **Posit cheatsheets** — base R, dplyr, ggplot2, tidyr, purrr
  [posit.co/resources/cheatsheets](https://posit.co/resources/cheatsheets)
- **RStudio shortcuts** — Tools → Keyboard Shortcuts Help (or `Alt+Shift+K`)
- **CRAN Task Views** — curated package lists by topic
  [cran.r-project.org/web/views](https://cran.r-project.org/web/views)

---

::: {.section-badge}
Recap
:::

## Module 16 · Recap {data-anim="stagger-up"}

- R4DS is the canonical entry point — read it twice
- Cheatsheets live in `Help → Cheatsheets` inside RStudio
- The R community lives on Posit Community, Mastodon, and R-Ladies
```

- [ ] **Step 3: Render**

```bash
quarto render
```

Expected: exits 0; the title and resources slides show the final content with their animations.

- [ ] **Step 4: Commit**

```bash
git add sections/00-title.qmd sections/16-resources.qmd
git commit -m "feat: §0 title + §16 resources (bookends)"
```

---

## Task 7: §1–§5 Setup-and-tools partials (Install, Posit Cloud, Projects, Packages, Scripts)

**Files:**
- Modify: `sections/01-installation.qmd`
- Modify: `sections/02-posit-cloud.qmd`
- Modify: `sections/03-projects.qmd`
- Modify: `sections/04-packages.qmd`
- Modify: `sections/05-scripts.qmd`

These five are content-similar (prose + code blocks, no chunky animations beyond `code-type` and `stagger-up`). Each follows the same shape: hero → 1–3 content slides → recap.

- [ ] **Step 1: Write `sections/01-installation.qmd`** (3 content slides)

```markdown
# Installing R & RStudio {.hero #s01-installation}

::: {.section-badge}
Module 1
:::

Installing R & RStudio

::: {.lede}
You need R (the engine) and RStudio (the IDE). They are separate downloads.
:::

## Step 1 — Download R from CRAN

::: {.lede}
CRAN (Comprehensive R Archive Network) hosts the R engine.
:::

1. Go to <https://cran.r-project.org>
2. Pick your operating system (macOS / Windows / Linux)
3. Download the latest base R installer

The base install gives you the `R` and `Rscript` binaries — that is what actually executes your code.

## Step 2 — Install RStudio Desktop (free) {data-anim="code-type"}

[posit.co/download/rstudio-desktop](https://posit.co/download/rstudio-desktop)

RStudio is the IDE most R users live in. Once installed, opening it
auto-detects the R you installed in Step 1.

Verify in the RStudio Console:

```r
R.version.string
#> "R version 4.5.1 (2025-06-13)"
```

## Step 3 — Verify your install {data-anim="code-type"}

```r
# Should print TRUE
all(c("base", "utils", "stats") %in% rownames(installed.packages()))

# Should print your platform string
Sys.info()[["sysname"]]
```

If both succeed, you're ready for module 2.

---

::: {.section-badge}
Recap
:::

## Module 1 · Recap {data-anim="stagger-up"}

- R from CRAN, RStudio from Posit — two separate downloads
- RStudio finds R automatically once both are installed
- `R.version.string` and `Sys.info()` are the smoke tests
```

- [ ] **Step 2: Write `sections/02-posit-cloud.qmd`** (2 content slides)

```markdown
# Posit Cloud {.hero #s02-posit-cloud}

::: {.section-badge}
Module 2
:::

Posit Cloud

::: {.lede}
A browser-based RStudio when you can't (or don't want to) install locally.
:::

## What you get

::: {.lede}
[posit.cloud](https://posit.cloud) — full RStudio in the browser, free tier available.
:::

- Same IDE, no install — useful for shared workshops or low-spec machines
- Each project is its own container; state persists between sessions
- File upload/download via the Files pane

## Free tier limits {data-anim="stagger-up"}

- **1 GB RAM** per project (heavier workloads need a paid tier)
- **1 CPU** per project
- **25 project hours/month** soft cap
- **15-minute** idle timeout

For this course the free tier is fine. For research workloads, install locally.

---

::: {.section-badge}
Recap
:::

## Module 2 · Recap {data-anim="stagger-up"}

- Posit Cloud = RStudio in a browser tab
- Free tier: 1 GB RAM, 1 CPU, 25 h/month — enough for teaching
- Local install scales further; Cloud is the zero-friction starting line
```

- [ ] **Step 3: Write `sections/03-projects.qmd`** (2 content slides)

```markdown
# RStudio Projects {.hero #s03-projects}

::: {.section-badge}
Module 3
:::

RStudio Projects

::: {.lede}
A folder, a `.Rproj` file, and a reset working directory. That's it.
:::

## Why projects beat `setwd()` {data-anim="code-type"}

```r
# The old way (DON'T)
setwd("/Users/gabbocg/Documents/my-analysis")

# The project way:
# File → New Project → choose a folder → done.
# The working directory is the project root, automatically.
getwd()
#> "/Users/gabbocg/Documents/my-analysis"
```

A `.Rproj` file makes your code portable: collaborators open the project
and `getwd()` resolves the same way for them.

## The minimum project workflow {data-anim="stagger-up"}

- One folder per analysis
- Open the `.Rproj` file to start work (never the script directly)
- Use **relative** paths: `read.csv("data/raw.csv")`, not absolute paths
- Commit the `.Rproj` to git; it's just a few lines of config

---

::: {.section-badge}
Recap
:::

## Module 3 · Recap {data-anim="stagger-up"}

- `.Rproj` = portable working directory for an analysis
- Open the project, not the script
- Relative paths only — never absolute paths in shared code
```

- [ ] **Step 4: Write `sections/04-packages.qmd`** (3 content slides)

```markdown
# Package Management {.hero #s04-packages}

::: {.section-badge}
Module 4
:::

Package Management

::: {.lede}
Install once, load every session, update on your own schedule.
:::

## install · library · update {data-anim="code-type"}

```r
# Install (writes to your library — do this once per package)
install.packages("dplyr")

# Load (attaches the package — do this every session)
library(dplyr)

# Update (refresh installed versions)
update.packages(ask = FALSE)
```

`install.packages()` writes to disk. `library()` pulls a package into the
current R session's search path.

## Where do packages come from? {data-anim="stagger-up"}

- **CRAN** — the default. 20k+ packages, peer-reviewed for installability.
- **Bioconductor** — life-science / bioinformatics ecosystem
  ```r
  install.packages("BiocManager")
  BiocManager::install("DESeq2")
  ```
- **GitHub** — bleeding edge, development versions
  ```r
  install.packages("pak")
  pak::pkg_install("tidyverse/dplyr")
  ```

## Reproducibility: renv {data-anim="code-type"}

```r
# Snapshot the exact package versions your project uses
install.packages("renv")
renv::init()         # creates renv.lock
renv::snapshot()     # update the lockfile after installing new packages
renv::restore()      # reinstall the locked versions on a new machine
```

This deck itself is reproduced with `renv::restore()`.

---

::: {.section-badge}
Recap
:::

## Module 4 · Recap {data-anim="stagger-up"}

- `install.packages()` once · `library()` every session
- CRAN by default; Bioconductor and GitHub when needed
- `renv` pins versions for reproducible builds
```

- [ ] **Step 5: Write `sections/05-scripts.qmd`** (2 content slides)

```markdown
# R Scripts {.hero #s05-scripts}

::: {.section-badge}
Module 5
:::

R Scripts

::: {.lede}
A `.R` file is a recipe. Run it from top to bottom and you get the same result every time.
:::

## Run-line vs source {data-anim="code-type"}

```r
# Run the current line: Cmd/Ctrl + Enter
mean(1:10)

# Run the whole script: source("analysis.R")
source("R/01-clean.R")
```

- **Run-line** during exploration — fast feedback
- **source()** for finished, reproducible passes

## Anatomy of a clean script {data-anim="stagger-up"}

- **Header comment** — what the script does, who wrote it, when
- **Setup block** — `library(...)` calls grouped at the top
- **One purpose per script** — `01-clean.R`, `02-fit.R`, `03-plot.R`
- **No `setwd()`** — projects handle the working directory
- **No `rm(list = ls())`** — restart R instead

---

::: {.section-badge}
Recap
:::

## Module 5 · Recap {data-anim="stagger-up"}

- `.R` files are reproducible recipes
- Run-line for exploration; `source()` for the final pass
- One purpose per script; libraries at the top; no `setwd()` or `rm(ls())`
```

- [ ] **Step 6: Render & spot-check**

```bash
quarto render
grep -c "s01-installation" _site/index.html
grep -c "Posit Cloud" _site/index.html
grep -c "renv::restore" _site/index.html
```

Expected: each ≥ 1. Open `_site/index.html` in a browser, navigate to §1–§5, confirm code blocks animate (`code-type`) and bullets stagger.

- [ ] **Step 7: Commit**

```bash
git add sections/01-installation.qmd sections/02-posit-cloud.qmd sections/03-projects.qmd sections/04-packages.qmd sections/05-scripts.qmd
git commit -m "feat: §1–§5 setup-and-tools partials"
```

---

## Task 8: §6 Data Structures + §7 Vectors & Lists (first specialized animation)

**Files:**
- Modify: `sections/06-data-structures.qmd`
- Modify: `sections/07-vectors-lists.qmd`

- [ ] **Step 1: Write `sections/06-data-structures.qmd`** (3 content slides)

```markdown
# Data Structures {.hero #s06-data-structures}

::: {.section-badge}
Module 6
:::

Data Structures

::: {.lede}
Two questions classify almost every R object: **how many dimensions** and **is the content homogeneous**.
:::

## The classifying 2×2 {data-anim="stagger-up"}

| | **Homogeneous** | **Heterogeneous** |
|---|---|---|
| **1-D** | atomic vector | list |
| **2-D** | matrix | data frame |
| **n-D** | array | (rare) |

- *Homogeneous* = every element the same type
- *Heterogeneous* = elements can be different types

## When to use what

::: {.columns}

::: {.column width="50%"}
**Reach for a vector** when every element is the same type and order matters.
:::

::: {.column width="50%"}
**Reach for a list** when elements have different types or shapes — fit models, nested API responses, etc.
:::

:::

::: {.columns}

::: {.column width="50%"}
**Reach for a matrix** when you do linear algebra: every cell the same type, fixed dimensions.
:::

::: {.column width="50%"}
**Reach for a data frame** when each column is a variable and each row is an observation.
:::

:::

---

::: {.section-badge}
Recap
:::

## Module 6 · Recap {data-anim="stagger-up"}

- Two axes: dimensionality and homogeneity
- 1-D × homogeneous = vector · 2-D × heterogeneous = data frame
- "Same-type and ordered" → vector; "tabular columns of mixed types" → data frame
```

- [ ] **Step 2: Write `sections/07-vectors-lists.qmd`** (4 content slides, includes `vector-fill`)

```markdown
# Vectors & Lists {.hero #s07-vectors-lists}

::: {.section-badge}
Module 7
:::

Vectors & Lists

::: {.lede}
Atomic vectors hold one type. Lists hold anything. That's the whole distinction.
:::

## Building atomic vectors {data-anim="code-type"}

```{r}
x <- c(1, 2, 3, 4, 5)
x
typeof(x)
length(x)
```

`c()` is the workhorse constructor: it **c**ombines values into a vector.

## What `c()` actually does {data-anim="vector-fill"}

::: {.r-stack data-anim="vector-fill" data-vector="[1,2,3,4,5]"}
:::

::: {.muted style="text-align:center; margin-top:1em;"}
Each cell holds one value; the order is preserved; the type is shared.
:::

## Coercion rules {data-anim="code-type"}

```{r}
# Numbers + logical → numeric (TRUE=1, FALSE=0)
c(1, 2, TRUE)

# Anything + character → all character
c(1, "two", TRUE)

# The hierarchy: logical → integer → double → character
```

When `c()` sees mixed types, it promotes everything to the most-permissive type.

## Lists hold anything {data-anim="code-type"}

```{r}
fit_summary <- list(
  model    = "lm",
  coef     = c(intercept = 0.4, slope = 1.2),
  fitted   = c(0.4, 1.6, 2.8, 4.0),
  formula  = "y ~ x"
)
fit_summary$coef
```

Lists are how R returns complex objects: `lm()`, `summary()`, almost every modelling function returns a list.

---

::: {.section-badge}
Recap
:::

## Module 7 · Recap {data-anim="stagger-up"}

- `c()` builds atomic vectors; one type per vector
- Coercion follows logical → integer → double → character
- Lists are the catch-all heterogeneous container; `$name` accesses elements
```

- [ ] **Step 3: Render and verify**

```bash
quarto render
grep -c "data-vector=\"\\[1,2,3,4,5\\]\"" _site/index.html
grep -c "vector-fill" _site/index.html
```

Expected: each ≥ 1.

Open the rendered deck, navigate to §7 slide 2 ("What `c()` actually does"): five purple cells should pop into existence one-by-one. If they appear all at once, anime.js isn't dispatching — check the browser console.

- [ ] **Step 4: Commit**

```bash
git add sections/06-data-structures.qmd sections/07-vectors-lists.qmd
git commit -m "feat: §6 data structures + §7 vectors (vector-fill debut)"
```

---

## Task 9: §8 Matrices & Arrays + §9 Data Frames & Tibbles (palmerpenguins debut)

**Files:**
- Modify: `sections/08-matrices-arrays.qmd`
- Modify: `sections/09-dataframes-tibbles.qmd`

- [ ] **Step 1: Write `sections/08-matrices-arrays.qmd`** (3 content slides, includes `matrix-grid`)

```markdown
# Matrices & Arrays {.hero #s08-matrices-arrays}

::: {.section-badge}
Module 8
:::

Matrices & Arrays

::: {.lede}
A matrix is a 2-D atomic vector with a `dim()` attribute. Arrays add more dimensions.
:::

## Constructing a matrix {data-anim="code-type"}

```{r}
m <- matrix(1:12, nrow = 3, ncol = 4, byrow = TRUE)
m
dim(m)
```

`matrix()` reshapes a vector. `byrow = TRUE` fills row-by-row;
`byrow = FALSE` (the default) fills column-by-column.

## Visualizing the fill order {data-anim="matrix-grid"}

::: {.r-stack data-anim="matrix-grid" data-matrix="[[1,2,3,4],[5,6,7,8],[9,10,11,12]]"}
:::

::: {.muted style="text-align:center; margin-top:1em;"}
Watch the cells fill row-by-row, just as `byrow = TRUE` instructed.
:::

## Naming dimensions {data-anim="code-type"}

```{r}
rownames(m) <- c("alpha", "beta", "gamma")
colnames(m) <- c("Q1", "Q2", "Q3", "Q4")
m

# Then you can index by name:
m["alpha", "Q3"]
```

For higher dimensions, use `array(values, dim = c(...))`. You'll meet 3-D
arrays mainly in image processing and certain Bayesian outputs.

---

::: {.section-badge}
Recap
:::

## Module 8 · Recap {data-anim="stagger-up"}

- `matrix(vec, nrow, ncol)` — 2-D, single type, ordered
- `byrow` controls fill order; `dim()` reports shape
- `rownames`/`colnames` enable name-based indexing
```

- [ ] **Step 2: Write `sections/09-dataframes-tibbles.qmd`** (4 content slides, palmerpenguins debut)

```markdown
# Data Frames & Tibbles {.hero #s09-dataframes-tibbles}

::: {.section-badge}
Module 9
:::

Data Frames & Tibbles

::: {.lede}
Each column is a variable, each row is an observation. The everyday R table.
:::

## Meet the penguins {data-anim="code-type"}

```{r}
library(palmerpenguins)
library(tibble)

penguins
```

The `penguins` dataset is a **tibble**: 344 rows × 8 columns of measurements
on three species of penguin from the Palmer Archipelago, Antarctica.

## `data.frame` vs `tibble` {data-anim="stagger-up"}

::: {.columns}

::: {.column width="50%"}
**`data.frame`** (base R, since 1990s)

- Prints **all** rows by default
- Coerces strings to factors (historically)
- `df[, "col"]` may return a vector or a frame
:::

::: {.column width="50%"}
**`tibble`** (tidyverse, modern)

- Prints **10 rows** + column types
- Strings stay strings, no factor surprise
- `tb[, "col"]` always returns a tibble
:::

:::

```{r}
class(penguins)
```

A tibble *is* a data frame (it inherits from `data.frame`), with friendlier
defaults — anything that takes a `data.frame` takes a tibble.

## Column access {data-anim="code-type"}

```{r}
# Single column as a vector
head(penguins$bill_length_mm, 5)

# Subset of columns as a tibble
penguins[, c("species", "bill_length_mm")]
```

The `$` operator is the most common way to grab a single column.

## Quick summary {data-anim="code-type"}

```{r}
dim(penguins)
names(penguins)
summary(penguins$body_mass_g)
```

`summary()` adapts to the column type: numeric columns get five-number
summaries; factors get counts.

---

::: {.section-badge}
Recap
:::

## Module 9 · Recap {data-anim="stagger-up"}

- Each column = one variable; each row = one observation
- Tibbles print friendlier and behave more predictably than base `data.frame`
- `$col`, `summary()`, and `head()` are your three first calls on any new frame
```

- [ ] **Step 3: Render and verify**

```bash
quarto render
grep -c "palmerpenguins" _site/index.html
grep -c "data-matrix" _site/index.html
```

Expected: each ≥ 1.

Render-time check: the live `penguins` output must show real rows. If you see a Quarto chunk error here, run `R -e 'library(palmerpenguins); head(penguins)'` interactively to confirm the package loads.

- [ ] **Step 4: Commit**

```bash
git add sections/08-matrices-arrays.qmd sections/09-dataframes-tibbles.qmd
git commit -m "feat: §8 matrices + §9 dataframes (palmerpenguins live)"
```

---

## Task 10: §10 Subsetting + §11 Conditionals & Loops

**Files:**
- Modify: `sections/10-subsetting.qmd`
- Modify: `sections/11-conditionals-loops.qmd`

- [ ] **Step 1: Write `sections/10-subsetting.qmd`** (4 content slides, includes `bracket-glow`)

```markdown
# Subsetting {.hero #s10-subsetting}

::: {.section-badge}
Module 10
:::

Subsetting

::: {.lede}
Three operators do all the work: `[`, `[[`, and `$`. Master them and R becomes a different language.
:::

## The lift-the-box mental model

::: {.lede}
A list is a row of labelled boxes.
:::

- `x[2]` returns **the box** (still a list)
- `x[[2]]` returns **what's inside** the box (the value)
- `x$name` is the same as `x[["name"]]` for named boxes

## Single vs double brackets {data-anim="code-type"}

```{r}
lst <- list(a = 1:3, b = "hello", c = TRUE)

lst[1]      # still a list of length 1
lst[[1]]    # the integer vector 1:3
lst$a       # same as lst[["a"]]
```

The `[` <span class="bracket-target">[</span> · `[[` <span class="bracket-target">[[</span> · `$` <span class="bracket-target">$</span> operators look similar but return different things {data-anim="bracket-glow"}.

## Indexing vectors {data-anim="code-type"}

```{r}
x <- c(10, 20, 30, 40, 50)

# By position
x[3]
x[c(1, 4)]

# By logical mask
x[x > 25]

# By name (when the vector is named)
y <- c(a = 1, b = 2, c = 3)
y["b"]

# Negative positions = "everything except"
x[-2]
```

## Indexing data frames {data-anim="code-type"}

```{r}
library(palmerpenguins)

# [row, col]
penguins[1:3, c("species", "bill_length_mm")]

# Logical row filter
penguins[penguins$species == "Adelie", ][1:3, ]
```

The same `[`, `[[`, `$` family scales to frames — `[` takes two arguments
(rows, cols); `$` plucks one column.

---

::: {.section-badge}
Recap
:::

## Module 10 · Recap {data-anim="stagger-up"}

- `[` returns the same type; `[[` and `$` extract the contained value
- Vectors index by position, logical mask, name, or negation
- Data frames use `[row, col]` — strings select columns, logicals filter rows
```

- [ ] **Step 2: Write `sections/11-conditionals-loops.qmd`** (4 content slides)

```markdown
# Conditionals & Loops {.hero #s11-conditionals-loops}

::: {.section-badge}
Module 11
:::

Conditionals & Loops

::: {.lede}
Branching and iteration — same as every other language, with one R twist: **prefer vectorization**.
:::

## Comparison & logical operators {data-anim="stagger-up"}

- `==`  `!=`  — equality
- `<`  `<=`  `>`  `>=`  — ordering
- `&`  `|`  `!`  — vectorized AND, OR, NOT (elementwise)
- `&&`  `||`  — scalar AND, OR (short-circuit, length-1 only)
- `%in%` — membership: `"Adelie" %in% penguins$species`

## `if` / `else` {data-anim="code-type"}

```{r}
x <- 7
if (x %% 2 == 0) {
  "even"
} else {
  "odd"
}
```

For *vectorized* branching, use `ifelse()` (or `dplyr::if_else()`):

```{r}
ifelse(c(1, 2, 3, 4) %% 2 == 0, "even", "odd")
```

## `for` loops {data-anim="code-type"}

```{r}
totals <- numeric(5)
for (i in seq_len(5)) {
  totals[i] <- sum(1:i)
}
totals
```

The R idiom: pre-allocate the result vector with `numeric(n)` or
`vector("list", n)`, then fill it. Growing a vector inside a loop is slow.

## When *not* to loop {data-anim="code-type"}

```{r}
# Loop way (works, but verbose)
out <- numeric(length(1:5))
for (i in seq_along(1:5)) out[i] <- (1:5)[i]^2
out

# Vectorized way (preferred)
(1:5)^2
```

R operators are vectorized: arithmetic, comparisons, and most math functions
operate elementwise on whole vectors. Use loops only when you genuinely need
sequential state.

---

::: {.section-badge}
Recap
:::

## Module 11 · Recap {data-anim="stagger-up"}

- `&`/`|` are vectorized; `&&`/`||` are scalar short-circuit
- Pre-allocate then fill — never grow a vector inside a loop
- Reach for vectorization first; loops only when state must flow
```

- [ ] **Step 3: Render and verify**

```bash
quarto render
grep -c "bracket-target" _site/index.html
grep -c "bracket-glow" _site/index.html
```

Expected: each ≥ 1.

In-browser: §10 slide 2's three operator tokens should pulse with a purple glow.

- [ ] **Step 4: Commit**

```bash
git add sections/10-subsetting.qmd sections/11-conditionals-loops.qmd
git commit -m "feat: §10 subsetting (bracket-glow) + §11 conditionals/loops"
```

---

## Task 11: §12 Functions (count-up debut)

**Files:**
- Modify: `sections/12-functions.qmd`

- [ ] **Step 1: Write `sections/12-functions.qmd`** (4 content slides)

```markdown
# Functions {.hero #s12-functions}

::: {.section-badge}
Module 12
:::

Functions

::: {.lede}
Three parts: arguments, body, return value. Everything else is convenience.
:::

## Anatomy of a function {data-anim="code-type"}

```{r}
greet <- function(name, greeting = "Hello") {
  paste0(greeting, ", ", name, "!")
}

greet("Ada")
greet("Hadley", greeting = "Welcome")
```

- **Name** on the left of `<-`
- **Formal arguments** in `function(...)` — with optional defaults
- **Body** between `{}` — last expression is the return value

## Example 1 — `is_divisible(n, by)` {data-anim="code-type"}

```{r}
is_divisible <- function(n, by) {
  n %% by == 0
}

is_divisible(12, 3)
is_divisible(c(10, 15, 20), 5)
```

Because `%%` is vectorized, `is_divisible` works on a single number *or* a
whole vector with no extra code.

## Example 2 — `summarize_vec(x)` {data-anim="code-type"}

```{r}
summarize_vec <- function(x) {
  list(
    n     = length(x),
    mean  = mean(x),
    sd    = sd(x),
    range = range(x)
  )
}

library(palmerpenguins)
summarize_vec(penguins$body_mass_g[!is.na(penguins$body_mass_g)])
```

Functions package small repeated workflows; lists are the natural return
type when you want to ship multiple values back.

## Live stats {data-anim="count-up"}

```{r}
#| echo: false
.bm <- penguins$body_mass_g[!is.na(penguins$body_mass_g)]
```

::: {.columns style="text-align:center;"}
::: {.column width="33%"}
**Penguins**

<span class="count-up" data-final="`{r} length(.bm)`" data-decimals="0">0</span>
:::
::: {.column width="33%"}
**Mean mass (g)**

<span class="count-up" data-final="`{r} round(mean(.bm), 1)`" data-decimals="1">0</span>
:::
::: {.column width="33%"}
**SD (g)**

<span class="count-up" data-final="`{r} round(sd(.bm), 1)`" data-decimals="1">0</span>
:::
:::

(The numbers above are computed live and tween from zero on slide entry.)

---

::: {.section-badge}
Recap
:::

## Module 12 · Recap {data-anim="stagger-up"}

- Three parts: arguments, body, return value (last expression)
- Default arguments make functions ergonomic without changing the call site
- Return a list when you need to ship multiple values back
```

- [ ] **Step 2: Render and verify**

```bash
quarto render
grep -c "count-up" _site/index.html
grep -c "data-final" _site/index.html
```

Expected: each ≥ 1.

In-browser: §12's last slide — the three numbers (penguin count, mean mass, sd) tween from 0 to their real values.

- [ ] **Step 3: Commit**

```bash
git add sections/12-functions.qmd
git commit -m "feat: §12 functions with live count-up stats"
```

---

## Task 12: §13 Linear Regression (line-draw + count-up)

**Files:**
- Modify: `sections/13-linear-regression.qmd`

- [ ] **Step 1: Write `sections/13-linear-regression.qmd`** (4 content slides)

```markdown
# Linear Regression {.hero #s13-linear-regression}

::: {.section-badge}
Module 13
:::

Linear Regression

::: {.lede}
The simplest model in statistics, and the workhorse of empirical R analysis.
:::

## The setup {data-anim="code-type"}

```{r}
library(palmerpenguins)
library(dplyr)

dat <- penguins |>
  filter(!is.na(bill_length_mm), !is.na(body_mass_g))

dim(dat)
```

We'll predict bill length from body mass, using the 342 penguins with both
measurements present.

## Fitting `lm()` {data-anim="code-type"}

```{r}
fit <- lm(bill_length_mm ~ body_mass_g, data = dat)
summary(fit)
```

`y ~ x` is R's formula notation. `lm()` returns a list — the same list type
you saw in module 7 — packed with coefficients, residuals, and fit
diagnostics.

## Coefficients

```{r}
#| echo: false
.coefs <- coef(fit)
.r2 <- summary(fit)$r.squared
```

::: {.columns style="text-align:center;"}
::: {.column width="33%"}
**Intercept**

<span class="count-up" data-final="`{r} round(.coefs[[1]], 2)`" data-decimals="2">0</span>
:::
::: {.column width="33%"}
**Slope (×1000 g)**

<span class="count-up" data-final="`{r} round(.coefs[[2]] * 1000, 3)`" data-decimals="3">0</span>
:::
::: {.column width="33%"}
**R²**

<span class="count-up" data-final="`{r} round(.r2, 3)`" data-decimals="3">0</span>
:::
:::

::: {data-anim="count-up"}
:::

Slope is reported per kilogram for legibility; the model itself uses grams.

## The fitted line {data-anim="line-draw"}

```{r}
#| echo: false
#| fig.width: 7
#| fig.height: 4
#| fig.align: center
library(ggplot2)
ggplot(dat, aes(body_mass_g, bill_length_mm)) +
  geom_point(alpha = 0.4, colour = "#5B5168") +
  geom_smooth(method = "lm", se = FALSE, colour = "#9B6BD8") +
  theme_minimal(base_size = 14) +
  labs(x = "Body mass (g)", y = "Bill length (mm)")
```

Each gram of body mass adds about 0.004 mm of bill length — small per unit,
but with 342 observations the relationship is unambiguous.

---

::: {.section-badge}
Recap
:::

## Module 13 · Recap {data-anim="stagger-up"}

- `lm(y ~ x, data = ...)` is R's standard linear regression call
- `summary(fit)` reports coefficients, R², residuals
- 342 penguins · slope ≈ 4 µm bill length per gram of body mass · R² ≈ 0.35
```

- [ ] **Step 2: Render and verify**

```bash
quarto render
grep -c "lm(bill_length_mm" _site/index.html
grep -c "line-draw" _site/index.html
```

Expected: each ≥ 1.

In-browser: §13 should show the live `summary(fit)` (real coefficients), the count-up tiles tween, and the regression scatter plot renders.

(Note: the `line-draw` effect operates on `svg path.draw`. Since this plot
comes from ggplot2's SVG output, the effect is a no-op on the rendered plot
itself; it'll activate on §14 where we draw an SVG path explicitly. Keeping
the `data-anim="line-draw"` attribute here is harmless and documents intent.)

- [ ] **Step 3: Commit**

```bash
git add sections/13-linear-regression.qmd
git commit -m "feat: §13 linear regression on palmerpenguins"
```

---

## Task 13: §14 Visualization + §15 Tidyverse (pipe-flow + true line-draw)

**Files:**
- Modify: `sections/14-visualization.qmd`
- Modify: `sections/15-tidyverse.qmd`

- [ ] **Step 1: Write `sections/14-visualization.qmd`** (4 content slides)

```markdown
# Visualization {.hero #s14-visualization}

::: {.section-badge}
Module 14
:::

Visualization

::: {.lede}
Base R `plot()` for fast looks; ggplot2 for everything you'd want to publish.
:::

## `plot()` is the quick-look tool {data-anim="code-type"}

```{r}
#| fig.width: 6
#| fig.height: 3.6
#| fig.align: center
library(palmerpenguins)
dat <- subset(penguins, !is.na(bill_length_mm) & !is.na(body_mass_g))

plot(dat$body_mass_g, dat$bill_length_mm,
     pch  = 19, col = "#5B516866",
     xlab = "Body mass (g)", ylab = "Bill length (mm)")
abline(lm(bill_length_mm ~ body_mass_g, data = dat),
       col = "#9B6BD8", lwd = 2)
```

Three lines, one plot. Use this in exploration; reach for ggplot2 when the
plot leaves your screen.

## A hand-drawn line {data-anim="line-draw"}

::: {.r-stack style="display:flex; justify-content:center; padding:1em 0;"}
<svg class="line-draw-svg" viewBox="0 0 400 200" width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <line x1="40" y1="170" x2="380" y2="170" stroke="#EAE3F3" stroke-width="2"/>
  <line x1="40" y1="170" x2="40" y2="10" stroke="#EAE3F3" stroke-width="2"/>
  <path class="draw" d="M 40 170 L 110 130 L 180 100 L 250 70 L 320 45 L 380 30"
        fill="none" stroke="#9B6BD8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
:::

::: {.muted style="text-align:center;"}
The line is drawn one segment at a time — `line-draw` animates `strokeDashoffset` from path length to 0.
:::

## Bridge to ggplot2 {data-anim="code-type"}

```{r}
#| fig.width: 7
#| fig.height: 3.6
#| fig.align: center
library(ggplot2)

ggplot(dat, aes(body_mass_g, bill_length_mm, colour = species)) +
  geom_point(alpha = 0.7) +
  scale_colour_manual(values = c("#9B6BD8", "#5B8FE0", "#2D8F6F")) +
  theme_minimal(base_size = 13) +
  labs(x = "Body mass (g)", y = "Bill length (mm)", colour = NULL)
```

ggplot2 layers ("geometries") and aesthetics ("mappings") give you a
declarative grammar — you describe *what* you want to see, not *how* to
draw it.

## Why ggplot2 wins for finished work {data-anim="stagger-up"}

- **Consistent grammar** — one mental model spans bar / line / scatter / faceted
- **Aesthetics ≠ data** — colour, size, shape are mappings, not hard-coded
- **Faceting** — `facet_wrap(~ species)` splits one plot into many
- **Composability** — `+` adds layers; themes are reusable

---

::: {.section-badge}
Recap
:::

## Module 14 · Recap {data-anim="stagger-up"}

- `plot() + abline()` for fast looks during exploration
- ggplot2 = aesthetics + geometries + faceting, declarative grammar
- Layer with `+`; map data to aesthetics inside `aes()`
```

- [ ] **Step 2: Write `sections/15-tidyverse.qmd`** (4 content slides, includes `pipe-flow`)

```markdown
# The Tidyverse {.hero #s15-tidyverse}

::: {.section-badge}
Module 15
:::

The Tidyverse

::: {.lede}
A family of R packages sharing a common philosophy: tidy data, consistent verbs, and the pipe.
:::

## The pipeline {data-anim="pipe-flow"}

::: {.r-stack style="display:flex; align-items:center; justify-content:center; gap:6px; padding:1em 0; flex-wrap:wrap;"}
<span class="pipe-stage">readr</span>
<span class="pipe-arrow">→</span>
<span class="pipe-stage">tidyr</span>
<span class="pipe-arrow">→</span>
<span class="pipe-stage">dplyr</span>
<span class="pipe-arrow">→</span>
<span class="pipe-stage">ggplot2</span>
<span class="pipe-arrow">→</span>
<span class="pipe-stage">purrr</span>
:::

::: {.muted style="text-align:center;"}
Read → tidy → transform → visualize → iterate. One verb at a time, flowing left-to-right.
:::

## What each package owns {data-anim="stagger-up"}

- **readr** — fast file readers: `read_csv`, `read_tsv`, `read_fwf`
- **tidyr** — reshape between long/wide: `pivot_longer`, `pivot_wider`
- **dplyr** — transform rows/columns: `filter`, `mutate`, `select`, `summarise`, `group_by`
- **ggplot2** — declarative graphics (module 14)
- **purrr** — functional iteration over lists/vectors: `map`, `map_dfr`

## The pipe in action {data-anim="code-type"}

```{r}
library(dplyr)
library(palmerpenguins)

penguins |>
  filter(!is.na(bill_length_mm)) |>
  group_by(species) |>
  summarise(
    n         = n(),
    mean_bill = round(mean(bill_length_mm), 2),
    .groups   = "drop"
  )
```

`|>` (base R, since 4.1) passes the left-hand value into the first argument
of the right-hand function. `%>%` (magrittr / tidyverse) does the same with
slightly more flexibility.

## `|>` vs `%>%` {data-anim="stagger-up"}

- `|>` — built-in, simpler, faster
- `%>%` — older, supports `.` placeholder for non-first-arg piping
- **Use `|>`** in new code unless you genuinely need `.`
- Either way: pipelines read top-to-bottom like a recipe

---

::: {.section-badge}
Recap
:::

## Module 15 · Recap {data-anim="stagger-up"}

- Tidyverse = shared grammar across readr / tidyr / dplyr / ggplot2 / purrr
- The pipe (`|>` or `%>%`) lets you read transformations top-to-bottom
- Verbs operate on tidy data: one observation per row, one variable per column
```

- [ ] **Step 3: Render and verify**

```bash
quarto render
grep -c "pipe-stage" _site/index.html
grep -c "line-draw-svg" _site/index.html
grep -c "pipe-flow" _site/index.html
```

Expected: each ≥ 1.

In-browser:
- §14 slide 2 → the purple line draws across the chart, not all at once
- §15 slide 2 → the 5 pipeline stages slide in left-to-right with arrows between

- [ ] **Step 4: Commit**

```bash
git add sections/14-visualization.qmd sections/15-tidyverse.qmd
git commit -m "feat: §14 visualization (line-draw) + §15 tidyverse (pipe-flow)"
```

---

## Task 14: `scripts/check-render.sh` build-time verification

**Files:**
- Create: `scripts/check-render.sh` (executable)

- [ ] **Step 1: Write `scripts/check-render.sh`**

```bash
#!/usr/bin/env bash
# Build-time render and grep assertions. Exits non-zero on any failure.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> quarto render"
quarto render

OUT="_site/index.html"
if [[ ! -f "$OUT" ]]; then
  echo "FAIL: $OUT not found"; exit 1
fi

SIZE=$(wc -c < "$OUT")
if (( SIZE < 102400 )); then
  echo "FAIL: $OUT is suspiciously small ($SIZE bytes; expected > 100 KB)"; exit 1
fi
echo "OK: $OUT is $SIZE bytes"

# Section IDs (one per module)
for n in 00-title 01-installation 02-posit-cloud 03-projects 04-packages \
         05-scripts 06-data-structures 07-vectors-lists 08-matrices-arrays \
         09-dataframes-tibbles 10-subsetting 11-conditionals-loops 12-functions \
         13-linear-regression 14-visualization 15-tidyverse 16-resources; do
  if ! grep -q "s${n}" "$OUT"; then
    echo "FAIL: missing section id s${n}"; exit 1
  fi
done
echo "OK: all 17 section ids present"

# anime.js + theme accent variable + JetBrains Mono
grep -q "animejs@" "$OUT" || { echo "FAIL: no animejs script tag"; exit 1; }
grep -q -- "--accent-1" "$OUT" || { echo "FAIL: --accent-1 CSS variable not inlined"; exit 1; }
grep -q "JetBrains Mono" "$OUT" || { echo "FAIL: JetBrains Mono font reference missing"; exit 1; }
echo "OK: animejs, --accent-1, JetBrains Mono all present"

# Animation effect names should all be referenced in the inlined animations.js
for fx in stagger-up code-type vector-fill matrix-grid line-draw count-up bracket-glow pipe-flow; do
  if ! grep -q "$fx" "$OUT"; then
    echo "FAIL: animation effect $fx not present in rendered HTML"; exit 1
  fi
done
echo "OK: all 8 animation effects referenced"

echo
echo "All checks passed."
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x scripts/check-render.sh
```

- [ ] **Step 3: Run it**

```bash
./scripts/check-render.sh
```

Expected: prints a series of `OK:` lines, ends with `All checks passed.`, exits 0.

If a `FAIL:` appears, the message names exactly what's missing — fix the upstream task and re-run.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-render.sh
git commit -m "test: add build-time render & grep checks"
```

---

## Task 15: Manual visual checklist + close-out

**Files:** (none modified — this task is purely verification + final commit)

- [ ] **Step 1: Start the preview server**

```bash
quarto preview
```

Open the URL it prints (typically `http://localhost:4200`).

- [ ] **Step 2: Walk the deck end-to-end**

Work through the manual checklist from spec §8.2:

1. **Title slide** renders with the gradient underline visible
2. **Navigation** — `→`/`←` arrow keys work; `o` opens overview, ESC closes it; the overview shows ~70 thumbnails
3. **One animation per family** verified — visit each and confirm:
   - §0 → `stagger-up` (bullets staircase in)
   - §1 / §5 → `code-type` (code tokens fade in left-to-right)
   - §7 → `vector-fill` (five purple cells pop in)
   - §8 → `matrix-grid` (cells fill row-by-row)
   - §10 → `bracket-glow` (operators pulse purple)
   - §12 → `count-up` (numbers tween from 0)
   - §13 → `count-up` on regression coefficients
   - §14 → `line-draw` (SVG path draws across viewport)
   - §15 → `pipe-flow` (5 stages slide in with arrows)
4. **Back-navigation replay** — visit §7, advance, return, the cells re-pop from frame 0
5. **Reduced motion** — System Settings → Accessibility → Display → "Reduce motion" ON; revisit §14 and §15; the line/stages should appear instantly in final state with no animation
6. **R outputs are real** — §13 shows actual coefficients (intercept ≈ 26.9, slope ≈ 0.004); §14 plot has real penguin points
7. **Typography** — JetBrains Mono renders cleanly with no fallback-font flash (FOUT); syntax colors match the palette (purple keywords, blue functions, green strings)

Tick each item only after visually confirming it. If any fail, capture the symptom in a one-line note and fix in a follow-up commit before moving on.

- [ ] **Step 3: Re-run the build-time checks**

```bash
./scripts/check-render.sh
```

Expected: exits 0.

- [ ] **Step 4: Final commit if anything changed during verification**

```bash
git status
# if changes:
git add <files>
git commit -m "fix: manual-checklist follow-ups"
```

- [ ] **Step 5: Report completion**

Both signals from spec §8.3 should now hold:

- ✅ `./scripts/check-render.sh` exits 0
- ✅ All 7 manual-checklist items confirmed

The deck is feature-complete. Open `_site/index.html` for the final artifact; rebuild any time with `quarto render`.

---

## Done

That's the full plan. Total task count: 15. Total expected commits: ~17 (15 task commits + 1 setup + 1 spec). Total estimated execution time: 4–6 hours of focused work, depending on how much polish is desired during the content-writing tasks (§6–§13).

The plan assumes the engineer has internet access for renv + Google Fonts + the jsDelivr CDN on first run. After that, `freeze: auto` and the local vendor anime.js copy let subsequent builds run offline.
