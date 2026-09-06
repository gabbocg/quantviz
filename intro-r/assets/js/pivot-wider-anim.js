/*
  tidyr::pivot_wider() animation — long → wide.
  Mirror of pivot_longer: source is long (3 cols), destination is wide.
  Color coding by subject shows how "subject values become column names".

  Stages:
    0: source long table (subject cells pre-colored)
    1: code line highlights names_from / values_from
    2: destination wide table appears; each column colored per subject,
       values slot into the correct column based on their source subject
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

  // ---- config ----
  // PW_LONG_DATA: array of [name, subject, score] rows
  // PW_NAMES: distinct names in order
  // PW_SUBJECTS: distinct subjects in order (also become the column headers)
  var LONG_DATA    = window.PW_LONG_DATA    || [];
  var NAMES        = window.PW_NAMES        || [];
  var SUBJECTS     = window.PW_SUBJECTS     || ['math', 'science', 'english'];
  var SUBJ_COLORS  = window.PW_SUBJECT_COLORS || ['#325D88', '#B94A48', '#557A3E'];
  var TITLE_PRE    = window.PW_TITLE_PRE    || 'pivot_wider(';
  var CONDS_TEXT   = window.PW_CONDS_TEXT   || ['names_from = subject', 'values_from = score'];
  var TITLE_POST   = window.PW_TITLE_POST   || ')';

  // ---- geometry (matches filter/mutate: ROW_H=44) ----
  var ROW_H = 44, HEADER_H = 40, TABLE_Y = 90;
  var LEFT_X = 30, RIGHT_X = 640;
  var W_NAME = 110, W_SUBJ = 130, W_VAL = 90;
  var ROW_W_LEFT = W_NAME + W_SUBJ + W_VAL;  // 330

  function hexRGB(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  var COND = SUBJ_COLORS.map(function (hex) {
    var rgb = hexRGB(hex);
    return {
      fill:  'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.22)',
      clear: 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)',
      ink:   'rgb(' + Math.round(rgb[0]*0.62) + ',' + Math.round(rgb[1]*0.62) + ',' + Math.round(rgb[2]*0.62) + ')',
    };
  });
  var INK = '#3E3F3A';

  var built = false;
  var condSpans = [];
  var leftSubjCells = [];
  var rightHead = null;
  var rightSubjHeaders = [];
  var rightValueCells = [];
  var arrows = [];           // one per source row → destination row

  function rowY(j) { return TABLE_Y + HEADER_H + j * ROW_H; }
  function makeCell(cls, text, w) {
    var c = document.createElement('span');
    c.className = 'fi-cell ' + cls;
    c.textContent = text;
    if (w) { c.style.width = w + 'px'; c.style.minWidth = w + 'px'; }
    return c;
  }
  function absPos(el, x, y) { el.style.transform = 'translate(' + x + 'px, ' + y + 'px)'; }
  function subjIdx(name) { return SUBJECTS.indexOf(name); }

  function build() {
    var stage = document.getElementById('pw-stage');
    if (!stage || built) return !!stage;
    built = true;

    // ---- title code ----
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

    // ---- LEFT (long) header ----
    var lhead = document.createElement('div');
    lhead.className = 'fi-row fi-head';
    absPos(lhead, LEFT_X, TABLE_Y);
    lhead.appendChild(makeCell('', 'name', W_NAME));
    lhead.appendChild(makeCell('', 'subject', W_SUBJ));
    lhead.appendChild(makeCell('', 'score', W_VAL));
    stage.appendChild(lhead);

    // LEFT rows: subject + value pre-colored by subject
    LONG_DATA.forEach(function (row, i) {
      var r = document.createElement('div');
      r.className = 'fi-row';
      absPos(r, LEFT_X, rowY(i));
      r.appendChild(makeCell('', row[0], W_NAME));
      var sCell = makeCell('fi-pl-subj', row[1], W_SUBJ);
      var vCell = makeCell('fi-pl-val', String(row[2]), W_VAL);
      var idx = subjIdx(row[1]);
      if (idx >= 0) {
        var cc = COND[idx % COND.length];
        sCell.style.backgroundColor = cc.fill;
        sCell.style.color = cc.ink;
        vCell.style.backgroundColor = cc.fill;
        vCell.style.color = cc.ink;
      }
      r.appendChild(sCell);
      r.appendChild(vCell);
      stage.appendChild(r);
      leftSubjCells.push({ sCell: sCell, vCell: vCell, subject: row[1] });
    });

    // ---- RIGHT (wide) header ----
    var rhead = document.createElement('div');
    rhead.className = 'fi-row fi-head';
    absPos(rhead, RIGHT_X, TABLE_Y);
    rhead.appendChild(makeCell('', 'name', W_NAME));
    SUBJECTS.forEach(function (sname) {
      var h = makeCell('fi-pw-subj-head', sname, W_VAL);
      rhead.appendChild(h);
      rightSubjHeaders.push(h);
    });
    rhead.style.opacity = 0;
    stage.appendChild(rhead);
    rightHead = rhead;

    // RIGHT rows: one per name, all subject value cells
    NAMES.forEach(function (name, i) {
      var r = document.createElement('div');
      r.className = 'fi-row';
      absPos(r, RIGHT_X, rowY(i));
      r.appendChild(makeCell('', name, W_NAME));
      var rowCells = [];
      SUBJECTS.forEach(function (sname, sIdx) {
        var match = LONG_DATA.find(function (d) { return d[0] === name && d[1] === sname; });
        var val = match ? match[2] : '';
        var c = makeCell('fi-pw-val', String(val), W_VAL);
        c.dataset.subject = sIdx;
        rowCells.push(c);
        r.appendChild(c);
      });
      r.style.opacity = 0;
      stage.appendChild(r);
      rightValueCells.push(rowCells);
    });

    // ---- SVG fan-in arrows: 3 source rows converge to 1 destination row ----
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'fi-arrows-svg');
    var defs = document.createElementNS(svgNS, 'defs');
    SUBJ_COLORS.forEach(function (hex, sIdx) {
      var marker = document.createElementNS(svgNS, 'marker');
      marker.setAttribute('id', 'pw-arrowhead-' + sIdx);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '8'); marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '5'); marker.setAttribute('markerHeight', '5');
      marker.setAttribute('orient', 'auto-start-reverse');
      var head = document.createElementNS(svgNS, 'path');
      head.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
      head.setAttribute('fill', hex);
      marker.appendChild(head);
      defs.appendChild(marker);
    });
    svg.appendChild(defs);

    var sx = LEFT_X + ROW_W_LEFT + 6;
    var dx = RIGHT_X - 8;
    LONG_DATA.forEach(function (row, j) {
      var nameI = NAMES.indexOf(row[0]);
      var sIdx  = SUBJECTS.indexOf(row[1]);
      if (nameI < 0 || sIdx < 0) return;
      var syy = rowY(j) + ROW_H / 2;
      var dyy = rowY(nameI) + ROW_H / 2;
      var p = document.createElementNS(svgNS, 'path');
      p.setAttribute('class', 'fi-arrow');
      p.setAttribute('marker-end', 'url(#pw-arrowhead-' + sIdx + ')');
      p.setAttribute('stroke', SUBJ_COLORS[sIdx]);
      p.setAttribute('d', 'M ' + sx + ' ' + syy + ' C ' + (sx + 100) + ' ' + syy + ', ' + (dx - 100) + ' ' + dyy + ', ' + dx + ' ' + dyy);
      svg.appendChild(p);
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.opacity = 0;
      arrows.push({ p: p, len: len, subject: sIdx });
    });
    stage.appendChild(svg);

    return true;
  }

  function render(stage) {
    console.log('[pivot-wider-anim] render stage=' + stage);
    if (!build()) return;
    if (typeof window.anime === 'undefined') { setTimeout(function(){ render(stage); }, 60); return; }
    var anime = window.anime;

    // Stage 1: code substrings highlight
    var hi = stage >= 1;
    condSpans.forEach(function (s, i) {
      var cc = COND[i % COND.length];
      anime.animate(s, {
        backgroundColor: hi ? cc.fill : cc.clear,
        color: hi ? cc.ink : INK,
        duration: 450,
        ease: 'inOutQuad'
      });
    });

    // Stage 2: arrows draw + right table appears with color coding
    var show2 = stage >= 2;
    if (show2) {
      // Fan-in arrows draw first
      arrows.forEach(function (a, k) {
        anime.animate(a.p, {
          strokeDashoffset: [a.len, 0],
          opacity: [0, 1],
          duration: 550,
          ease: 'inOutCubic',
          delay: k * 60
        });
      });
      // Right-side header + subject-color headers
      anime.animate(rightHead, { opacity: [0, 1], duration: 300, ease: 'outQuad', delay: 400 });
      rightSubjHeaders.forEach(function (h, sIdx) {
        var cc = COND[sIdx % COND.length];
        anime.animate(h, {
          backgroundColor: [cc.clear, cc.fill],
          color: [INK, cc.ink],
          duration: 400,
          ease: 'inOutQuad',
          delay: 500 + sIdx * 80
        });
      });
      rightValueCells.forEach(function (rowCells, i) {
        var rEl = rowCells[0].parentElement;
        var d = 650 + i * 130;
        anime.animate(rEl, { opacity: [0, 1], duration: 300, ease: 'outQuad', delay: d });
        rowCells.forEach(function (c, sIdx) {
          var cc = COND[sIdx % COND.length];
          anime.animate(c, {
            backgroundColor: [cc.clear, cc.fill],
            color: [INK, cc.ink],
            duration: 300,
            ease: 'inOutQuad',
            delay: d + 80
          });
        });
      });
    } else {
      arrows.forEach(function (a) {
        a.p.style.strokeDashoffset = a.len;
        a.p.style.opacity = 0;
      });
      rightHead.style.opacity = 0;
      rightSubjHeaders.forEach(function (h) {
        h.style.backgroundColor = ''; h.style.color = '';
      });
      rightValueCells.forEach(function (rowCells) {
        var rEl = rowCells[0].parentElement;
        rEl.style.opacity = 0;
        rowCells.forEach(function (c) {
          c.style.backgroundColor = ''; c.style.color = '';
        });
      });
    }
  }

  TM.gate({
    markerClass: 'pw-slide',
    fragmentIds: ['pw-frag-1', 'pw-frag-2'],
    render: render
  });
})();
