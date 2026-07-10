/*
  dplyr::mutate() animation — two-table Emil-style layout.
  Left = source; Right = mutated (adds body_mass_kg column).
  Arrows draw from each source row to its destination on stage 2;
  the new column's values then tween in from 0 → computed value.
*/
(function () {
  // TM.gate helper (idempotent state binding)
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
  var TITLE_PRE   = window.MU_TITLE_PRE   || 'mutate(';
  var CONDS_TEXT  = window.MU_CONDS_TEXT  || ['body_mass_kg = body_mass_g / 1000'];
  var TITLE_POST  = window.MU_TITLE_POST  || ')';
  var DATA        = window.MU_DATA        || [];
  var LEFT_COLS   = window.MU_LEFT_COLS   || ['species', 'body_mass_g'];
  var NEW_COL     = window.MU_NEW_COL     || 'body_mass_kg';
  var TRANSFORM   = window.MU_TRANSFORM   || function (x) { return (parseFloat(x) / 1000).toFixed(2); };
  var COND_HEX    = window.MU_COLORS      || ['#325D88'];  // navy for the mutation expression

  // ---- geometry (matches filter — 2 cols on both sides) ----
  var ROW_H = 44, HEADER_H = 40, TABLE_Y = 90;
  var LEFT_X = 40, RIGHT_X = 660;
  var W_SP = 158, W_VAL = 148;
  var ROW_W_LEFT  = W_SP + W_VAL;             // 306
  var ROW_W_RIGHT = W_SP + W_VAL;             // 306 (species + body_mass_kg — no duplicate g col)

  function hexRGB(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  var COND = COND_HEX.map(function (hex) {
    var rgb = hexRGB(hex);
    return {
      fill:  'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.28)',
      clear: 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)',
      ink:   'rgb(' + Math.round(rgb[0]*0.62) + ',' + Math.round(rgb[1]*0.62) + ',' + Math.round(rgb[2]*0.62) + ')',
    };
  });
  var INK = '#3E3F3A';

  var built = false;
  var condSpans = [];
  var leftRows = [];
  var rightRows = [];
  var kgCells = [];       // the body_mass_kg cell per right row
  var rightHead = null;
  var arrows = [];

  function rowY(j) { return TABLE_Y + HEADER_H + j * ROW_H; }
  function rowCenterY(j) { return rowY(j) + ROW_H / 2; }

  function makeCell(cls, text) {
    var c = document.createElement('span');
    c.className = 'fi-cell ' + cls;
    c.textContent = text;
    return c;
  }

  function makeLeftRow(species, value, isHead) {
    var row = document.createElement('div');
    row.className = 'fi-row' + (isHead ? ' fi-head' : '');
    row.appendChild(makeCell('fi-species', species));
    row.appendChild(makeCell('fi-value', value));
    return row;
  }
  function makeRightRow(species, kg, isHead) {
    var row = document.createElement('div');
    row.className = 'fi-row' + (isHead ? ' fi-head' : '');
    row.appendChild(makeCell('fi-species', species));
    row.appendChild(makeCell('fi-value fi-kg', kg));
    return row;
  }

  function build() {
    var stage = document.getElementById('mu-stage');
    if (!stage || built) return !!stage;
    built = true;

    // ---- title code line with mutation expression as color-coded substring ----
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

    // ---- left table (source) ----
    var lhead = makeLeftRow(LEFT_COLS[0], LEFT_COLS[1], true);
    lhead.style.transform = 'translate(' + LEFT_X + 'px, ' + TABLE_Y + 'px)';
    stage.appendChild(lhead);

    DATA.forEach(function (d, i) {
      var row = makeLeftRow(d[0], d[1], false);
      row.style.transform = 'translate(' + LEFT_X + 'px, ' + rowY(i) + 'px)';
      stage.appendChild(row);
      leftRows.push(row);
    });

    // ---- right table (result — species + body_mass_kg only) ----
    var rhead = makeRightRow(LEFT_COLS[0], NEW_COL, true);
    rhead.style.transform = 'translate(' + RIGHT_X + 'px, ' + TABLE_Y + 'px)';
    rhead.style.opacity = 0;
    stage.appendChild(rhead);
    rightHead = rhead;

    DATA.forEach(function (d, i) {
      var row = makeRightRow(d[0], '', false);  // kg empty until tween
      row.style.transform = 'translate(' + RIGHT_X + 'px, ' + rowY(i) + 'px)';
      row.style.opacity = 0;
      stage.appendChild(row);
      rightRows.push(row);
      kgCells.push(row.querySelector('.fi-kg'));
    });

    // ---- SVG arrows source → destination ----
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'fi-arrows-svg');
    var defs = document.createElementNS(svgNS, 'defs');
    var marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', 'mu-arrowhead');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8'); marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '5'); marker.setAttribute('markerHeight', '5');
    marker.setAttribute('orient', 'auto-start-reverse');
    var head = document.createElementNS(svgNS, 'path');
    head.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    head.setAttribute('fill', '#325D88');
    marker.appendChild(head);
    defs.appendChild(marker);
    svg.appendChild(defs);

    var sx = LEFT_X + ROW_W_LEFT + 6;
    var dx = RIGHT_X - 8;
    DATA.forEach(function (_, i) {
      var syy = rowCenterY(i), dyy = rowCenterY(i);
      var p = document.createElementNS(svgNS, 'path');
      p.setAttribute('class', 'fi-arrow');
      p.setAttribute('marker-end', 'url(#mu-arrowhead)');
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

  function tweenNumber(el, target, decimals, duration) {
    var obj = { v: 0 };
    window.anime.animate(obj, {
      v: parseFloat(target),
      duration: duration || 500,
      ease: 'outQuad',
      onUpdate: function () { el.textContent = obj.v.toFixed(decimals); }
    });
  }

  function render(stage) {
    console.log('[mutate-anim] render stage=' + stage);
    if (!build()) return;
    if (typeof window.anime === 'undefined') { setTimeout(function(){ render(stage); }, 60); return; }
    var anime = window.anime;

    // Stage 1: highlight the mutation expression substring in the code line
    var cc = COND[0];
    var hi1 = stage >= 1;
    condSpans.forEach(function (s) {
      anime.animate(s, {
        backgroundColor: hi1 ? cc.fill : cc.clear,
        color: hi1 ? cc.ink : INK,
        duration: 450,
        ease: 'inOutQuad'
      });
    });

    // Stage 2: choreographed result — arrows draw, right rows appear,
    // and kg values tween in, all in one smooth sequence
    var show2 = stage >= 2;
    if (show2) {
      // 1. Arrows draw first
      arrows.forEach(function (a, k) {
        anime.animate(a.p, {
          strokeDashoffset: [a.len, 0],
          opacity: [0, 1],
          duration: 550,
          ease: 'inOutCubic',
          delay: k * 80
        });
      });
      // 2. Right table header fades in slightly ahead of the rows
      anime.animate(rightHead, {
        opacity: [0, 1],
        duration: 300,
        ease: 'outQuad',
        delay: 400
      });
      // 3. Each right row appears + its kg value tweens in — as one per-row event
      DATA.forEach(function (d, i) {
        var rowDelay = 500 + i * 130;
        var row = rightRows[i];
        anime.animate(row, {
          opacity: [0, 1],
          duration: 280,
          ease: 'outQuad',
          delay: rowDelay
        });
        // Start the kg tween just as the row becomes visible
        setTimeout(function () {
          tweenNumber(kgCells[i], TRANSFORM(d[1]), 2, 450);
        }, rowDelay + 120);
      });
    } else {
      // Hard reset — no animation, no visible flash
      arrows.forEach(function (a) {
        a.p.style.strokeDashoffset = a.len;
        a.p.style.opacity = 0;
      });
      rightHead.style.opacity = 0;
      rightRows.forEach(function (r) { r.style.opacity = 0; });
      kgCells.forEach(function (c) { c.textContent = ''; });
    }
  }

  TM.gate({
    markerClass: 'mu-slide',
    fragmentIds: ['mu-frag-1', 'mu-frag-2'],
    render: render
  });
})();
