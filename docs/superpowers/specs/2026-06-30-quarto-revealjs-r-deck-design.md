# Quarto Reveal.js R Course Deck — Design Spec

**Date:** 2026-06-30
**Status:** Approved (pending spec review)
**Owner:** Gabriel Cabrera

## 1 · Purpose & Scope

Transform the existing Xaringan presentation at <https://intro-r-data-analytics.netlify.app> (a 17-section *Introduction to R* course originally delivered at Universidad de Chile) into a single cohesive Quarto Reveal.js deck rendered from R, with subtle pedagogical animations powered by anime.js.

The new deck must:

- Reproduce every section of the original (no content dropped)
- Be authored in **English** (the original is in Spanish)
- Execute R chunks **live** at render time (Quarto + knitr)
- Use **palmerpenguins** and base-R built-in datasets — the original facial-competence dataset is replaced
- Look and feel cohesive: one theme, one motion vocabulary across all sections
- Render reliably with `quarto render` from a clean checkout after `renv::restore()`

Out of scope: quizzes/exercises, translations beyond English, instructor speaker notes, polished PDF/print stylesheets, mobile-tuned layout, CI workflows (deferred).

## 2 · Source Material Summary

The source deck has 17 sections:

1. Title & instructor
2. R & RStudio installation
3. RStudio (Posit) Cloud
4. RStudio Projects
5. Package management
6. R Scripts
7. Data Structures (overview)
8. Vectors & Lists
9. Matrices & Arrays
10. Data Frames & Tibbles
11. Subsetting (`[]`, `[[]]`, `$`)
12. Conditionals & Loops
13. Functions
14. Linear Regression (uses facial-competence dataset)
15. Visualization (`plot()`)
16. Tidyverse overview
17. Resources

All sections are kept; section 14's dataset is swapped to **palmerpenguins** and sections 9/13/14 are retargeted to that dataset accordingly.

## 3 · Architecture

### 3.1 File Layout

```
quantviz/
├── _quarto.yml              # project config, theme link, execute defaults
├── index.qmd                # master deck: YAML header + 17 includes
├── sections/                # one .qmd partial per module
│   ├── 00-title.qmd
│   ├── 01-installation.qmd
│   ├── 02-posit-cloud.qmd
│   ├── 03-projects.qmd
│   ├── 04-packages.qmd
│   ├── 05-scripts.qmd
│   ├── 06-data-structures.qmd
│   ├── 07-vectors-lists.qmd
│   ├── 08-matrices-arrays.qmd
│   ├── 09-dataframes-tibbles.qmd
│   ├── 10-subsetting.qmd
│   ├── 11-conditionals-loops.qmd
│   ├── 12-functions.qmd
│   ├── 13-linear-regression.qmd
│   ├── 14-visualization.qmd
│   ├── 15-tidyverse.qmd
│   └── 16-resources.qmd
├── assets/
│   ├── theme.scss           # palette + typography (extends Quarto revealjs)
│   ├── head.html            # font preconnect, anime.js CDN + SRI, vendor fallback
│   ├── animations.js        # anime.js engine: data-anim dispatcher + 8 effects
│   ├── syntax.theme         # custom Pandoc highlight theme matching palette
│   ├── vendor/anime.min.js  # offline fallback (committed)
│   └── img/                 # logos (tidyverse, posit, etc.)
├── data/                    # CSVs only if needed (mostly empty)
├── scripts/
│   └── check-render.sh      # post-render sanity checks
├── docs/superpowers/specs/  # this spec
├── renv.lock                # pinned R dependencies
├── renv/                    # renv state (library/ ignored)
├── _freeze/                 # Quarto chunk cache (committed)
├── README.md
└── .gitignore
```

### 3.2 Include Composition

`index.qmd` is a thin master file: YAML frontmatter, then 17 lines of the form
`{{< include sections/NN-name.qmd >}}`. Each partial owns the slides for its module (heading levels `#` for module break, `##` for individual slides). This gives one cohesive deck while keeping each module editable in isolation.

### 3.3 Why Not Alternatives

- **Single monolithic `index.qmd`** rejected: ~1500-line file harder to navigate and harder to triage when one chunk errors.
- **17 separate decks linked from an index** rejected: breaks the cohesive-deck reader experience; loses the global progress bar and through-arrow navigation; duplicates theme/JS config 17 times.

## 4 · Visual Theme — "Tidyverse Friendly"

### 4.1 Palette (CSS custom properties, defined in `theme.scss`)

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#FBF7F0` | Slide background (warm cream) |
| `--bg-elev` | `#FFFFFF` | Code blocks, cards |
| `--ink` | `#2D2438` | Body text |
| `--ink-soft` | `#5B5168` | Secondary text |
| `--accent-1` | `#9B6BD8` | Purple (primary highlight) |
| `--accent-2` | `#5B8FE0` | Blue (links, keywords) |
| `--accent-grad` | `linear-gradient(90deg, var(--accent-1), var(--accent-2))` | Title underlines, progress bar |
| `--ok` | `#2D8F6F` | Function names, success markers |
| `--warn` | `#D9883F` | Warnings, output diffs |
| `--rule` | `#EAE3F3` | Hairlines, code-block border |

### 4.2 Typography

- **Headings & body:** Inter (Google Fonts, weights 400/600/700, variable axes)
- **Code:** JetBrains Mono (Google Fonts, weights 400/600)
- **Sizes** (Reveal default scale = 1): H1 1.6em, H2 1.25em, body 0.85em, code 0.75em — tuned for projection legibility
- Font preconnect declared in `assets/head.html`

### 4.3 Slide Chrome

- Small uppercase section badge above the title
- H2 title with a 48px-wide, 3px-tall gradient underline (`--accent-grad`)
- Reveal progress bar styled with `--accent-grad`
- No persistent footer; module name shown via a corner state-marker
- Hero slides (section openers) use a full-bleed gradient background

### 4.4 Layout Primitives

Three layout patterns cover every slide:

1. **Title-and-content** (default) — heading + body
2. **Two-column** — `.columns` / `.column` halves, for "code | output" or "concept | code"
3. **Hero** — full-bleed gradient, large title, used as the 17 module openers

Utility classes provided: `.lede`, `.muted`, `.tag`, `.kbd`.

### 4.5 Code Blocks

White elevated card, 1px `--rule` border, 6px corner radius, JetBrains Mono 0.75em. Syntax highlighting via a custom Pandoc theme at `assets/syntax.theme` matching the palette (purple keywords, blue function names, green strings, soft-ink for comments).

## 5 · Animation System (anime.js)

### 5.1 Loading & Integration

- anime.js v4 from a pinned jsDelivr URL with SRI hash, declared in `assets/head.html`
- Fallback to local `assets/vendor/anime.min.js` if the CDN is unreachable
- `assets/animations.js` declared in `_quarto.yml` under `include-after-body`
- A single Reveal listener wires everything:

  ```js
  Reveal.on('slidechanged', e => runAnimsFor(e.currentSlide));
  ```

### 5.2 Opt-In Pattern

Slides declare animation behavior via `data-anim="…"` attributes on either the slide element itself or specific child elements. The engine scans `currentSlide` for these attributes and dispatches to named effect functions. **No per-slide JavaScript** — adding an animation never requires editing `animations.js` for that slide.

Example (Quarto markdown):

```markdown
## Vectors hold one type {data-anim="vector-fill"}

::: {.r-stack data-vector='[1, 2, 3, 4]'}
:::
```

### 5.3 Effect Library

Eight named effects, each implemented as a function in `animations.js`, reused across the deck:

| Effect | Used on | Behavior |
|--------|---------|----------|
| `code-type` | Any slide introducing a code chunk | Tokens fade in left-to-right, ~30ms stagger |
| `vector-fill` | §7 Vectors | Empty cell grid; each cell scales 0→1 + color-fills, 60ms stagger |
| `matrix-grid` | §8 Matrices | 2D grid fills row-by-row, then a row/col highlight pulses |
| `line-draw` | §13 Regression, §14 Viz | SVG path animated via `strokeDashoffset` → 0, ~900ms ease-out |
| `count-up` | §12 Functions, §13 Regression coefficients | Number tweens from 0 to final value, 600ms |
| `bracket-glow` | §10 Subsetting | Box-shadow pulse around `[]` / `[[]]` / `$`, loop=2 |
| `stagger-up` | §0/6/9/11/15/16 (replaces Reveal fragment fade) | Bullets translateY 12px→0 + opacity 0→1, 80ms stagger |
| `pipe-flow` | §15 Tidyverse | Package logos slide into a horizontal pipeline with arrow connectors |

### 5.4 Replay, Accessibility, Safety

- Each effect function checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and short-circuits to the final state
- Re-entering a slide resets and replays its anime instances (`.pause(); .seek(0); .play()`)
- Reveal native fragments still work for plain text reveals; `stagger-up` is per-slide opt-in, not a global override
- No animation function reads or writes anything outside its slide DOM subtree

## 6 · Content Map

Each row: one `.qmd` partial. Slide counts are estimates. Animation column indicates effects from §5.3.

| # | File | Slides | Key content | Animations |
|---|------|--------|-------------|------------|
| 0 | `00-title.qmd` | 1 | Title hero (course name, instructor handle) | `stagger-up` |
| 1 | `01-installation.qmd` | 3 | CRAN → R base → RStudio Desktop (CSS-mockup illustrations, no screenshots) | `code-type` |
| 2 | `02-posit-cloud.qmd` | 2 | Posit Cloud + free-tier limits | — |
| 3 | `03-projects.qmd` | 2 | `.Rproj`, `getwd`/`setwd`, projects-beat-setwd callout | `code-type` |
| 4 | `04-packages.qmd` | 3 | `install.packages`, `library`, `update.packages`, CRAN vs Bioconductor | `code-type` |
| 5 | `05-scripts.qmd` | 2 | `.R` files, reproducibility, run-line vs source | `code-type` |
| 6 | `06-data-structures.qmd` | 3 | Dimensionality × homogeneity 2×2 matrix | `stagger-up` |
| 7 | `07-vectors-lists.qmd` | 4 | Atomic vectors, coercion, `list()`, named lists | `vector-fill`, `code-type` |
| 8 | `08-matrices-arrays.qmd` | 3 | `matrix()`, `dim`, row/colnames, brief array note | `matrix-grid` |
| 9 | `09-dataframes-tibbles.qmd` | 4 | `data.frame` vs `tibble`, palmerpenguins live | `code-type`, `stagger-up` |
| 10 | `10-subsetting.qmd` | 4 | `[]`, `[[]]`, `$`, indexing modes, "lift the box" model | `bracket-glow`, `code-type` |
| 11 | `11-conditionals-loops.qmd` | 4 | Operators, `if`/`else`, `for`, vectorize-first guideline | `code-type`, `stagger-up` |
| 12 | `12-functions.qmd` | 4 | Anatomy + `is_divisible(n, by)` and `summarize_vec(x)` | `code-type`, `count-up` |
| 13 | `13-linear-regression.qmd` | 4 | `lm()` on penguins (bill_length ~ body_mass), summary, fitted/residuals | `line-draw`, `count-up` |
| 14 | `14-visualization.qmd` | 4 | base `plot()` → scatter → fit line; ggplot bridge | `line-draw` |
| 15 | `15-tidyverse.qmd` | 4 | readr/tidyr/dplyr/ggplot2/purrr; `%>%` / `\|>` mini-demo | `pipe-flow`, `stagger-up` |
| 16 | `16-resources.qmd` | 2 | R4DS, Advanced R, cheatsheets, follow-ups | `stagger-up` |

**Total: ~53 slides.** Each section opens with a hero divider (badge + module title + gradient underline). Each module ends with a single-slide *Recap* fragment (3 bullets) — a pedagogical add-on absent from the original.

### 6.1 Translations & Substitutions

- All prose translated to English; code identifiers and code comments in English
- Spanish course-specific references (instructor email, ME-Decanato logo) replaced with generic placeholders configurable via `_quarto.yml` parameters
- "RStudio Cloud" updated to "Posit Cloud"
- Facial-competence dataset → palmerpenguins everywhere it appears (§9, §13, §14)

## 7 · Build & Render Workflow

### 7.1 `_quarto.yml`

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
    menu: { side: left, numbers: true }
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

### 7.2 Caching

`freeze: auto` caches each chunk's output under `_freeze/`, keyed by chunk source. Only edited chunks re-run. `_freeze/` is committed per Quarto convention so first-time renders on a fresh checkout are fast.

### 7.3 Reproducibility

R dependencies pinned via **renv**:

- `renv::init()` at repo root → `renv.lock` committed
- Packages: `palmerpenguins`, `dplyr`, `tibble`, `ggplot2`, `readr`, `tidyr`, `purrr`, plus `knitr` and `rmarkdown` as Quarto dependencies
- `renv/library/` ignored; `renv.lock` committed
- README documents `renv::restore()` as the bootstrap step

### 7.4 Dev Loop

```
quarto preview                       # live-reload while editing
quarto render                        # one-shot full build → _site/
quarto render --to revealjs:pdf      # PDF export (rough, not tuned)
```

### 7.5 Repo Hygiene

`.gitignore`:

```
_site/
.quarto/
.Rproj.user/
.Rhistory
.DS_Store
.superpowers/
renv/library/
```

Committed: `_freeze/`, `renv.lock`, `assets/vendor/anime.min.js`.

## 8 · Verification & Acceptance

### 8.1 Build-Time Checks (`scripts/check-render.sh`)

- `quarto render` exits 0 (every chunk parses and executes, all includes resolve)
- `_site/index.html` exists and is > 100 KB (sanity guard against silent empty render)
- `grep` the rendered HTML for: section IDs `s00-title` … `s16-resources`, the anime.js script tag, the `--accent-1` custom property in the inlined CSS

### 8.2 Manual Visual Checklist

Run once after the deck is built:

1. `quarto preview` boots; title slide displays with gradient underline
2. Arrow keys and `o` (overview) work; ESC overview shows ~53 thumbnails
3. One animation per family verified in-browser:
   - §7 Vectors → `vector-fill`
   - §8 Matrices → `matrix-grid`
   - §10 Subsetting → `bracket-glow`
   - §12 Functions → `count-up`
   - §13 Regression → `line-draw`
   - §15 Tidyverse → `pipe-flow`
4. Back-navigation replay: leave a slide, return, animation replays from frame 0
5. Reduced-motion: toggle macOS "Reduce motion"; animations skip to final state, no flicker
6. R outputs are real: §13 `lm()` summary shows coefficients; §14 penguins plot has real points
7. JetBrains Mono renders without FOUT; syntax colors match palette

### 8.3 Acceptance Criteria

Work is considered done when **both** of the following hold:

- `scripts/check-render.sh` exits 0
- All seven items in §8.2 verified manually by the author

### 8.4 Not Tested

Cross-browser quirks beyond latest Chrome/Safari/Firefox; mobile layout; screen-reader fidelity beyond Reveal's baseline; print-stylesheet polish.

## 9 · Out of Scope (Explicit YAGNI)

- Quizzes, exercises, or any interactivity beyond animations
- Languages other than English
- Instructor speaker notes (can be added in `::: notes` blocks later)
- Mobile-tuned layout
- Polished PDF/print stylesheets
- CI workflows (`.github/workflows/render.yml` is an obvious follow-up but not built now)
- Per-section progress dashboards or completion tracking
- Custom Reveal plugins beyond what's listed
