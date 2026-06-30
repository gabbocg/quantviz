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
        if (!codeEl.dataset.tokenized) {
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
    },

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
  };

  function dispatch(slide) {
    if (!animeReady()) return;
    var slideAnim = slide.dataset && slide.dataset.anim;
    if (slideAnim && EFFECTS[slideAnim]) EFFECTS[slideAnim](slide);
    var children = slide.querySelectorAll('[data-anim]');
    children.forEach(function (el) {
      var name = el.dataset.anim;
      if (EFFECTS[name]) EFFECTS[name](el);
    });
  }

  function runAnimsFor(slide) {
    // Retry until anime.js has loaded, then dispatch exactly once.
    if (!animeReady()) {
      setTimeout(function () { runAnimsFor(slide); }, 50);
      return;
    }
    dispatch(slide);
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

  window.__deckAnims = { EFFECTS: EFFECTS, dispatch: dispatch };
})();
