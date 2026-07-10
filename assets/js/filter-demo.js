/*
  dplyr::filter() animation — two-condition variant.
  Adapted from EmilHvitfeldt/tidy-animations' filter-two pattern
  (anime.js v4 API — anime.animate + `ease` not `easing`).

  Stages driven by Reveal fragments:
    1: condition 1's matching cells + first substring highlight (navy)
    2: condition 2's matching cells + second substring highlight (brick)
    3: rows passing BOTH get a full-row highlight; failing rows dim to 0.22
    4: SVG bezier arrows draw from each passing row → new table on the right,
       right table fades in row-by-row
*/
(function () {
  // ---- TM.gate helper (idempotent state binding) ----
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

  // ---- config ----
  var TITLE_PRE  = window.FI_TITLE_PRE  || 'filter(';
  var CONDS_TEXT = window.FI_CONDS_TEXT || [];
  var TITLE_POST = window.FI_TITLE_POST || ')';
  var DATA       = window.FI_DATA       || [];
  var COLS       = window.FI_COLS       || ['species', 'bill_length_mm'];
  var HITS       = window.FI_HITS       || [];
  var COND_HEX   = window.FI_COLORS     || ['#325D88', '#B94A48'];  // navy, brick

  // ---- geometry ----
  var ROW_H = 44, HEADER_H = 40, TABLE_Y = 90;
  var LEFT_X = 40, RIGHT_X = 660;           // wider spread → more arrow length
  var W_SP = 158, W_VAL = 148;
  var ROW_W = W_SP + W_VAL;

  // ---- colors (translucent fill + darker ink per condition) ----
  function hexRGB(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  var COND = COND_HEX.map(function (hex) {
    var rgb = hexRGB(hex);
    return {
      fill: 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.28)',
      clear: 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)',
      ink:  'rgb(' + Math.round(rgb[0]*0.62) + ',' + Math.round(rgb[1]*0.62) + ',' + Math.round(rgb[2]*0.62) + ')',
      hex:  hex,
    };
  });
  var ROW_HL = 'rgba(50, 93, 136, 0.14)';
  var ROW_CLEAR = 'rgba(50, 93, 136, 0)';
  var INK = '#3E3F3A';

  // ---- derived: which rows survive ----
  var PASS = DATA.map(function (_, i) {
    return HITS.every(function (col) { return col[i]; });
  });
  var passIdx = DATA.map(function (_, i) { return i; }).filter(function (i) { return PASS[i]; });

  // ---- DOM state ----
  var built = false;
  var condSpans = [];
  var leftRows = [];
  var rightEls = [];
  var arrows = [];

  function rowY(j) { return TABLE_Y + HEADER_H + j * ROW_H; }
  function rowCenterY(j) { return rowY(j) + ROW_H / 2; }

  function makeRow(species, value, isHead) {
    var row = document.createElement('div');
    row.className = 'fi-row' + (isHead ? ' fi-head' : '');
    var c1 = document.createElement('span');
    c1.className = 'fi-cell fi-species';
    c1.textContent = species;
    var c2 = document.createElement('span');
    c2.className = 'fi-cell fi-value';
    c2.textContent = value;
    row.appendChild(c1);
    row.appendChild(c2);
    return row;
  }

  function build() {
    var stage = document.getElementById('fi-stage');
    if (!stage || built) return !!stage;
    built = true;

    // ---- title code line with per-condition colored substrings ----
    var title = document.createElement('div');
    title.className = 'fi-title';
    title.appendChild(document.createTextNode(TITLE_PRE));
    CONDS_TEXT.forEach(function (t, i) {
      if (i) title.appendChild(document.createTextNode(', '));
      var s = document.createElement('span');
      s.className = 'fi-code-cond';
      s.textContent = t;
      title.appendChild(s);
      condSpans.push(s);
    });
    title.appendChild(document.createTextNode(TITLE_POST));
    stage.appendChild(title);

    // ---- left table ----
    var lhead = makeRow(COLS[0], COLS[1], true);
    lhead.style.transform = 'translate(' + LEFT_X + 'px, ' + TABLE_Y + 'px)';
    stage.appendChild(lhead);

    DATA.forEach(function (d, i) {
      var row = makeRow(d[0], d[1], false);
      row.style.transform = 'translate(' + LEFT_X + 'px, ' + rowY(i) + 'px)';
      stage.appendChild(row);
      leftRows.push(row);
    });

    // ---- right table (hidden until final stage) ----
    var rhead = makeRow(COLS[0], COLS[1], true);
    rhead.style.transform = 'translate(' + RIGHT_X + 'px, ' + TABLE_Y + 'px)';
    rhead.style.opacity = 0;
    stage.appendChild(rhead);
    rightEls.push(rhead);

    passIdx.forEach(function (srcI, j) {
      var d = DATA[srcI];
      var row = makeRow(d[0], d[1], false);
      row.style.transform = 'translate(' + RIGHT_X + 'px, ' + rowY(j) + 'px)';
      row.style.opacity = 0;
      stage.appendChild(row);
      rightEls.push(row);
    });

    // ---- SVG bezier arrows from source → destination row ----
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'fi-arrows-svg');
    var defs = document.createElementNS(svgNS, 'defs');
    var marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', 'fi-arrowhead');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8'); marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '7'); marker.setAttribute('markerHeight', '7');
    marker.setAttribute('orient', 'auto-start-reverse');
    var head = document.createElementNS(svgNS, 'path');
    head.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    head.setAttribute('fill', '#325D88');
    marker.appendChild(head);
    defs.appendChild(marker);
    svg.appendChild(defs);

    var sx = LEFT_X + ROW_W + 6;
    var dx = RIGHT_X - 8;
    passIdx.forEach(function (srcI, j) {
      var syy = rowCenterY(srcI), dyy = rowCenterY(j);
      var p = document.createElementNS(svgNS, 'path');
      p.setAttribute('class', 'fi-arrow');
      p.setAttribute('marker-end', 'url(#fi-arrowhead)');
      p.setAttribute('d', 'M ' + sx + ' ' + syy + ' C ' + (sx + 100) + ' ' + syy + ', ' + (dx - 100) + ' ' + dyy + ', ' + dx + ' ' + dyy);
      svg.appendChild(p);
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.opacity = 0;
      arrows.push({ p: p, len: len });
    });
    stage.appendChild(svg);

    return true;
  }

  function render(stage) {
    console.log('[filter-anim] render stage=' + stage);
    if (!build()) return;
    if (typeof window.anime === 'undefined') { setTimeout(function () { render(stage); }, 60); return; }
    var anime = window.anime;

    var nConds = HITS.length;

    // Stages 1..nConds: reveal each condition's matches (cells + code substring)
    condSpans.forEach(function (s, c) {
      var hi = stage >= c + 1;
      var cc = COND[c % COND.length];
      anime.animate(s, {
        backgroundColor: hi ? cc.fill : cc.clear,
        color: hi ? cc.ink : INK,
        duration: 450,
        ease: 'inOutQuad'
      });
    });

    leftRows.forEach(function (row, i) {
      var cells = row.querySelectorAll('.fi-cell');
      HITS.forEach(function (col, c) {
        if (!col[i]) return;
        var hi = stage >= c + 1;
        var cc = COND[c % COND.length];
        anime.animate(cells[c], {
          backgroundColor: hi ? cc.fill : cc.clear,
          color: hi ? cc.ink : INK,
          duration: 450,
          ease: 'inOutQuad'
        });
      });
    });

    // Stage nConds+1: full-row highlight for passing rows, dim failing rows
    var both = stage >= nConds + 1;
    leftRows.forEach(function (row, i) {
      anime.animate(row, {
        opacity: both && !PASS[i] ? 0.22 : 1,
        backgroundColor: both && PASS[i] ? ROW_HL : ROW_CLEAR,
        duration: 450,
        ease: 'inOutQuad'
      });
    });

    // Stage nConds+2: draw arrows, then fade in right table
    var show = stage >= nConds + 2;
    if (show) {
      arrows.forEach(function (a, k) {
        anime.animate(a.p, {
          strokeDashoffset: [a.len, 0],
          opacity: [0, 1],
          duration: 600,
          ease: 'inOutCubic',
          delay: k * 90
        });
      });
      anime.animate(rightEls, {
        opacity: [0, 1],
        duration: 450,
        ease: 'inOutQuad',
        delay: anime.stagger(50, { start: 520 })
      });
    } else {
      // Hard reset — no animation, no visible flash before it hides itself
      arrows.forEach(function (a) {
        a.p.style.strokeDashoffset = a.len;
        a.p.style.opacity = 0;
      });
      rightEls.forEach(function (el) { el.style.opacity = 0; });
    }
  }

  TM.gate({
    markerClass: 'fi-slide',
    fragmentIds: ['fi-cond-1', 'fi-cond-2', 'fi-both', 'fi-arrows'],
    render: render
  });
})();
