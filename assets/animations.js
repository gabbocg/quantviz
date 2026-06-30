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
    }

    // Additional effects added in Task 5.
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
