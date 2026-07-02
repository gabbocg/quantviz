/*
  ggplot2, deconstructed — Emil's variant, adapted for anime.js v4.
  Starts with the finished plot (flat), tilts it into 3D, explodes the 4
  SVG "planes" (coord / points / smooth / labs) apart vertically as tilted
  cards, then focuses each layer + its code block in turn, then collapses
  and un-rotates back to flat.

  Fragment progression:
    0: flat, head-on plot
    1: lay flat → tilt into 3D
    2: explode (fan the 4 planes apart, card backings fade in)
    3: focus coord (bottom plane un-tilts)
    4: focus points
    5: focus smooth
    6: focus labs
    7: collapse (bring planes back together)
    8: un-rotate flat
*/
(function () {
  window.TM = window.TM || {};
  TM.onReveal = function (cb) {
    (function go() {
      if (typeof Reveal === 'undefined' || !Reveal.on) { setTimeout(go, 50); return; }
      cb();
    })();
  };
  TM.gate = TM.gate || function (opts) {
    function visibleStage() {
      var n = 0;
      for (var i = 0; i < opts.fragmentIds.length; i++) {
        var f = document.getElementById(opts.fragmentIds[i]);
        if (f && f.classList.contains('visible')) n++;
        else break;
      }
      return n;
    }
    function onThisSlide(slide) {
      return slide && (slide.classList.contains(opts.markerClass) ||
                       slide.querySelector('.' + opts.markerClass));
    }
    TM.onReveal(function () {
      Reveal.on('fragmentshown',  function () { if (onThisSlide(Reveal.getCurrentSlide())) opts.render(visibleStage()); });
      Reveal.on('fragmenthidden', function () { if (onThisSlide(Reveal.getCurrentSlide())) opts.render(visibleStage()); });
      Reveal.on('slidechanged',   function (e) { if (onThisSlide(e.currentSlide)) opts.render(visibleStage()); });
      (function boot() {
        var cur = Reveal.getCurrentSlide && Reveal.getCurrentSlide();
        if (!cur) { setTimeout(boot, 60); return; }
        if (onThisSlide(cur)) opts.render(visibleStage());
      })();
    });
  };

  var SVGNS = 'http://www.w3.org/2000/svg';

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

  function el(name, attrs, parent) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(svg, x, y, s, attrs) {
    var t = el('text', Object.assign({ x: x, y: y, 'font-family': 'sans-serif' }, attrs), svg);
    t.textContent = s;
    return t;
  }

  function svgPlane(id) {
    var d = document.createElement('div');
    d.className = 'gg-plane';
    d.id = id;
    d.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;';
    var tilt = document.createElement('div');
    tilt.className = 'gg-tilt';
    var card = document.createElement('div');
    card.className = 'gg-card';
    tilt.appendChild(card);
    var s = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H });
    s.style.cssText = 'position:absolute;left:0;top:0;';
    tilt.appendChild(s);
    d.appendChild(tilt);
    return { div: d, tilt: tilt, svg: s, card: card };
  }

  var LEG_X = PX1 + 20;
  function legY() { return PY0 + 30; }

  // ---- plane builders ----
  function buildCoord(svg) {
    el('rect', { x: PX0, y: PY0, width: PX1 - PX0, height: PY1 - PY0, fill: '#EBEBEB' }, svg);
    function grid(xs, ys, w) {
      xs.forEach(function (v) { el('line', { x1: sx(v), x2: sx(v), y1: PY0, y2: PY1, stroke: '#fff', 'stroke-width': w }, svg); });
      ys.forEach(function (v) { el('line', { x1: PX0, x2: PX1, y1: sy(v), y2: sy(v), stroke: '#fff', 'stroke-width': w }, svg); });
    }
    grid(X_MINOR, Y_MINOR, 1);
    grid(X_BREAKS, Y_BREAKS, 2);
    X_BREAKS.forEach(function (v) { txt(svg, sx(v), PY1 + 20, v, { 'text-anchor': 'middle', 'font-size': 12, fill: '#4d4d4d' }); });
    Y_BREAKS.forEach(function (v) { txt(svg, PX0 - 10, sy(v) + 4, v, { 'text-anchor': 'end', 'font-size': 12, fill: '#4d4d4d' }); });
    // legend keys
    var ly = legY();
    SPECIES.forEach(function (name, i) {
      var y = ly + i * 24;
      el('rect', { x: LEG_X, y: y - 12, width: 16, height: 16, rx: 2, fill: '#EBEBEB' }, svg);
      el('circle', { cx: LEG_X + 8, cy: y - 4, r: 3.5, fill: COLORS[i] }, svg);
      txt(svg, LEG_X + 24, y, name, { 'font-size': 13, fill: '#1d2433' });
    });
  }
  function buildPoints(svg) {
    if (GEOM === 'line') {
      // Group points by series index (p[2] must be a 0-based integer that
      // indexes into COLORS/SPECIES), then draw one polyline per series.
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
  function buildSmooth(svg) {
    var up = '', dn = '';
    SMOOTH.forEach(function (s, i) { up += (i ? 'L' : 'M') + sx(s[0]) + ',' + sy(s[3]) + ' '; });
    for (var i = SMOOTH.length - 1; i >= 0; i--) dn += 'L' + sx(SMOOTH[i][0]) + ',' + sy(SMOOTH[i][2]) + ' ';
    el('path', { d: up + dn + 'Z', fill: '#999', 'fill-opacity': 0.4, stroke: 'none' }, svg);
    var line = '';
    SMOOTH.forEach(function (s, i) { line += (i ? 'L' : 'M') + sx(s[0]) + ',' + sy(s[1]) + ' '; });
    el('path', { d: line, fill: 'none', stroke: '#000', 'stroke-width': 2 }, svg);
  }
  function buildLabs(svg) {
    txt(svg, PX0, 24, LABS.title, { 'font-size': 17, 'font-weight': 700, fill: '#1d2433' });
    txt(svg, (PX0 + PX1) / 2, H - 18, LABS.x, { 'text-anchor': 'middle', 'font-size': 13, fill: '#1d2433' });
    var yt = txt(svg, 20, (PY0 + PY1) / 2, LABS.y, { 'text-anchor': 'middle', 'font-size': 13, fill: '#1d2433' });
    yt.setAttribute('transform', 'rotate(-90 20 ' + ((PY0 + PY1) / 2) + ')');
    txt(svg, LEG_X, legY() - 22, LABS.color, { 'font-size': 13, 'font-weight': 700, fill: '#1d2433' });
  }

  // ---- code listing — compact form to fit alongside the plot ----
  // window.GG_CODE_HTML lets a demo qmd override the code panel so it stays
  // in sync with the plot labels (otherwise the code shows penguins even when
  // the plot has been retargeted to another dataset).
  var CODE_HTML = window.GG_CODE_HTML ||
    '<span data-blk="coord"><span class="gg-fn">ggplot</span>(penguins,\n' +
    '       <span class="gg-fn">aes</span>(bill_length_mm, body_mass_g, <span class="gg-arg">color</span> = species)) +</span>\n' +
    '<span data-blk="points">  <span class="gg-fn">geom_point</span>() +</span>\n' +
    '<span data-blk="smooth">  <span class="gg-fn">geom_smooth</span>() +</span>\n' +
    '<span data-blk="labs">  <span class="gg-fn">labs</span>(<span class="gg-arg">title</span> = <span class="gg-str">"Bill length vs body mass"</span>,\n' +
    '       <span class="gg-arg">x</span> = <span class="gg-str">"Bill length (mm)"</span>,\n' +
    '       <span class="gg-arg">y</span> = <span class="gg-str">"Body mass (g)"</span>)</span>';

  var built = false;
  var planes = [];              // [coord, points, smooth, labs]
  var codeBlocks = [];
  var BLK = ['coord', 'points', 'smooth', 'labs'];

  function build() {
    var stage = document.getElementById('gg-stage');
    if (!stage || built) return !!stage;
    built = true;

    var code = document.createElement('pre');
    code.className = 'gg-code';
    code.innerHTML = CODE_HTML;
    stage.appendChild(code);
    codeBlocks = Array.prototype.slice.call(code.querySelectorAll('[data-blk]'));

    var plot = document.createElement('div');
    plot.id = 'gg-plot';
    var coord  = svgPlane('gg-plane-coord');
    var points = svgPlane('gg-plane-points');
    var smooth = svgPlane('gg-plane-smooth');
    var labs   = svgPlane('gg-plane-labs');
    buildCoord(coord.svg);
    buildPoints(points.svg);
    buildSmooth(smooth.svg);
    buildLabs(labs.svg);
    planes = [coord, points, smooth, labs];
    planes.forEach(function (p) { plot.appendChild(p.div); });
    stage.appendChild(plot);

    return true;
  }

  function render(stage) {
    if (!build()) return;
    if (typeof window.anime === 'undefined') { setTimeout(function(){ render(stage); }, 60); return; }
    var anime = window.anime;

    var flat = stage >= 8;
    var collapsed = stage >= 7;
    var laid = stage >= 1 && !flat;
    var exploded = stage >= 2 && !collapsed;
    var focusIdx = (stage >= 3 && !collapsed) ? stage - 3 : -1;
    var focusBlk = focusIdx >= 0 ? BLK[focusIdx] : null;

    var N = planes.length;
    var SPREAD = 68;
    var PART = 260;

    planes.forEach(function (p, i) {
      var fan = exploded ? 18 + ((N - 1) / 2 - i) * SPREAD : 0;
      var focused = focusIdx >= 0 && i === focusIdx;
      if (focusIdx >= 0 && !focused) {
        fan += (i < focusIdx) ? PART : -PART;
      }
      var tilted = laid && !focused;

      // outer: screen-space vertical fan
      anime.animate(p.div, {
        translateY: fan,
        duration: 850,
        ease: 'inOutCubic'
      });
      // inner: tilt + explode-scale
      anime.animate(p.tilt, {
        rotateX: tilted ? 56 : 0,
        rotateZ: tilted ? 20 : 0,
        scale: exploded ? 0.82 : 1,
        opacity: 1,
        duration: 850,
        ease: 'inOutCubic'
      });
      // card backing appears when planes explode
      anime.animate(p.card, {
        opacity: exploded ? 1 : 0,
        duration: 600,
        ease: 'inOutQuad'
      });
    });

    // Highlight the focused code block
    codeBlocks.forEach(function (b) {
      b.classList.toggle('gg-hot', b.dataset.blk === focusBlk);
    });
  }

  TM.gate({
    markerClass: 'gg-slide',
    fragmentIds: [
      'gg-lay', 'gg-explode',
      'gg-focus-coord', 'gg-focus-points', 'gg-focus-smooth', 'gg-focus-labs',
      'gg-collapse', 'gg-unrotate'
    ],
    render: render
  });
})();
