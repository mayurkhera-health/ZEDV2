/* AutomateSmall — small, dependency-free behaviour.
   Everything here degrades to readable static content without JS. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Mobile navigation ---------- */
  (function nav() {
    var btn = $('#nav-toggle'), panel = $('#nav-panel');
    if (!btn || !panel) return;
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Close' : 'Menu';
    });
  })();

  /* ---------- Hero: rotating probe questions ---------- */
  (function probe() {
    var root = $('#probe');
    if (!root) return;
    var out   = $('#probe-q'), ctrl = $('#probe-ctrl'), dots = $('#probe-dots');
    var qs = [
      'Did everyone submit their paperwork?',
      "Which invoices still haven't been paid?",
      'Whose certification expires next month?',
      'Did anyone follow up with that customer?',
      'Where did we put that spreadsheet?',
      'Did the new hire finish onboarding?',
      'Why am I entering this information again?',
      'Which system has that information?'
    ];
    var i = 0, timer = null, playing = false;

    qs.forEach(function (_, n) {
      var d = document.createElement('span');
      d.className = 'probe__dot' + (n === 0 ? ' is-on' : '');
      dots.appendChild(d);
    });
    var dotEls = $$('.probe__dot', dots);
    out.textContent = qs[0];

    function paint(n) {
      dotEls.forEach(function (d, k) { d.classList.toggle('is-on', k === n); });
    }
    function show(n) {
      i = (n + qs.length) % qs.length;
      if (reduced.matches) { out.textContent = qs[i]; paint(i); return; }
      root.classList.add('is-swapping');
      window.setTimeout(function () {
        out.textContent = qs[i];
        paint(i);
        root.classList.remove('is-swapping');
      }, 350);
    }
    function play() {
      playing = true;
      ctrl.setAttribute('aria-pressed', 'true');
      $('#probe-ctrl-label').textContent = 'Pause';
      $('#probe-ctrl-icon').innerHTML = '<rect x="3" y="2" width="3" height="10" rx="1"/><rect x="8" y="2" width="3" height="10" rx="1"/>';
      clearInterval(timer);
      timer = window.setInterval(function () { show(i + 1); }, 4500);
    }
    function pause() {
      playing = false;
      ctrl.setAttribute('aria-pressed', 'false');
      $('#probe-ctrl-label').textContent = 'Play';
      $('#probe-ctrl-icon').innerHTML = '<path d="M4 2.5v9l7-4.5z"/>';
      clearInterval(timer);
    }
    ctrl.addEventListener('click', function () { playing ? pause() : play(); });
    ctrl.hidden = false;

    if (reduced.matches) { pause(); } else { play(); }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearInterval(timer); }
      else if (playing) { play(); }
    });
  })();

  /* ---------- Two-state stacks (Owner's Desk, Business View) ---------- */
  function stack(rootSel) {
    var root = $(rootSel);
    if (!root) return null;
    var layers = $$('[data-layer]', root);
    var btns   = $$('[data-show]', root);

    function set(name) {
      layers.forEach(function (l) {
        var on = l.getAttribute('data-layer') === name;
        l.setAttribute('data-state', on ? 'shown' : 'hidden');
        l.setAttribute('aria-hidden', on ? 'false' : 'true');
        $$('button, a, input, select', l).forEach(function (c) {
          if (on) { c.removeAttribute('tabindex'); } else { c.setAttribute('tabindex', '-1'); }
        });
      });
      btns.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-show') === name));
      });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { set(b.getAttribute('data-show')); });
    });
    return set;
  }

  (function desk() {
    var set = stack('#desk');
    if (!set) return;
    set('before');
    if (reduced.matches) { set('after'); return; }
    // One orchestrated moment: the desk resolves itself once, then the
    // visitor owns the control.
    window.setTimeout(function () {
      var d = $('#desk');
      var seen = d.getBoundingClientRect().top < window.innerHeight;
      if (seen) { set('after'); }
    }, 2200);
  })();

  (function bizview() {
    var set = stack('#bv');
    if (set) { set('after'); }
  })();

  /* ---------- Delivery preference ---------- */
  (function delivery() {
    var wrap = $('#delivery');
    if (!wrap) return;
    var out = $('#delivery-out');
    var copy = {
      dashboard: 'One page you open when you want it. Nothing for your staff to install, nothing new for them to learn.',
      email: 'One email before you start your day. Anything that needs a decision sits at the top.',
      text: 'A short message only when something actually needs you. Quiet the rest of the time.'
    };
    $$('.chip', wrap).forEach(function (c) {
      c.addEventListener('click', function () {
        $$('.chip', wrap).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
        out.textContent = copy[c.getAttribute('data-delivery')] || '';
      });
    });
  })();

  /* ---------- Recognition slips ---------- */
  (function recognition() {
    var list = $('#recog');
    if (!list) return;
    var count = $('#recog-count'), cta = $('#recog-cta');
    var panel = $('#recstart'), out = $('#recstart-list'), lead = $('#recstart-lead');

    function picked() {
      return $$('.recog__item[aria-pressed="true"]', list);
    }
    function refresh() {
      var n = picked().length;
      count.innerHTML = n === 0
        ? 'Nothing picked yet'
        : '<em>' + n + '</em> picked';
      cta.disabled = n === 0;
      cta.setAttribute('aria-disabled', String(n === 0));
      if (!panel.hidden && n === 0) { panel.hidden = true; }
      if (!panel.hidden) { render(); }
    }
    function render() {
      var items = picked().slice(0, 3);
      out.innerHTML = '';
      items.forEach(function (el, n) {
        var li = document.createElement('li');
        var b = document.createElement('span');
        b.className = 'recstart__n';
        b.textContent = String(n + 1);
        var d = document.createElement('div');
        var t = document.createElement('div');
        t.className = 'recstart__t';
        t.textContent = el.getAttribute('data-rec-title');
        var p = document.createElement('div');
        p.className = 'recstart__d';
        p.textContent = el.getAttribute('data-rec-body');
        d.appendChild(t); d.appendChild(p);
        li.appendChild(b); li.appendChild(d);
        out.appendChild(li);
      });
      var total = picked().length;
      lead.textContent = total > 3
        ? 'You picked ' + total + '. We would not try to fix all of them at once — here is the order we would suggest, starting with the first.'
        : 'Here is where we would start, in that order. One at a time, finished properly, before moving on.';
    }
    $$('.recog__item', list).forEach(function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        refresh();
      });
    });
    cta.addEventListener('click', function () {
      if (picked().length === 0) return;
      panel.hidden = false;
      render();
      panel.setAttribute('tabindex', '-1');
      panel.focus();
    });
    refresh();
  })();

  /* ---------- Industry filter ---------- */
  (function jobs() {
    var bar = $('#filterbar');
    if (!bar) return;
    var cards = $$('#jobs .job'), empty = $('#jobs-empty');
    $$('.chip', bar).forEach(function (c) {
      c.addEventListener('click', function () {
        var key = c.getAttribute('data-filter');
        $$('.chip', bar).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
        var shown = 0;
        cards.forEach(function (card) {
          var tags = (card.getAttribute('data-tags') || '').split(' ');
          var on = key === 'all' || tags.indexOf(key) > -1;
          card.hidden = !on;
          if (on) shown++;
        });
        empty.hidden = shown > 0;
        $('#jobs-live').textContent = shown + (shown === 1 ? ' job shown' : ' jobs shown');
      });
    });
  })();

  /* ---------- Time calculator ---------- */
  (function calc() {
    var slider = $('#hours');
    if (!slider) return;
    var hrsOut = $('#calc-hours'), bigOut = $('#calc-annual'),
        weeksOut = $('#calc-weeks'), ack = $('#calc-ack');
    var shown = 0, raf = null;

    function words(n) {
      return n.toLocaleString('en-US');
    }
    function paintBig(target) {
      if (reduced.matches) { bigOut.textContent = words(target); shown = target; return; }
      cancelAnimationFrame(raf);
      var from = shown, start = null, dur = 420;
      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        var v = Math.round(from + (target - from) * eased);
        bigOut.textContent = words(v);
        if (p < 1) { raf = requestAnimationFrame(tick); } else { shown = target; }
      }
      raf = requestAnimationFrame(tick);
    }
    function update() {
      var h = Number(slider.value);
      var plus = h >= 20;
      hrsOut.innerHTML = (plus ? '20+' : h) + ' <span>' + (h === 1 ? 'hour' : 'hours') + ' a week</span>';
      var annual = h * 50;
      paintBig(annual);
      var w = Math.floor(annual / 40);
      weeksOut.textContent = w < 1
        ? "That is most of a working week, every year."
        : "That is more than " + w + " full work " + (w === 1 ? 'week' : 'weeks') + ".";
    }
    slider.addEventListener('input', update);
    update();

    var ackCopy = {
      customers: 'Then that is where we would aim first — take the admin off the front of your day so more of it reaches customers.',
      grow: 'Then the first thing to fix is whatever you personally have to touch before the business can take on more.',
      team: 'Then we would start with the work that has you checking up on people instead of working alongside them.',
      service: 'Then we would look for the steps where things get dropped, because that is usually what customers feel.',
      home: 'Then we would start with whatever is keeping you at the desk after everyone else has gone.'
    };
    $$('#timeback .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        $$('#timeback .chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
        ack.textContent = ackCopy[c.getAttribute('data-want')] || '';
      });
    });
  })();

  /* ---------- Walkthrough request form ---------- */
  (function book() {
    var form = $('#walkthrough');
    if (!form) return;
    var done = $('#walkthrough-done');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      $$('[data-required]', form).forEach(function (f) {
        var err = $('#' + f.id + '-err');
        var empty = !String(f.value || '').trim();
        if (err) { err.hidden = !empty; }
        f.setAttribute('aria-invalid', String(empty));
        if (empty) { ok = false; if (!firstBad) firstBad = f; }
      });
      if (!ok) { firstBad.focus(); return; }
      // NOTE FOR LAUNCH: connect this to the booking tool / inbox of choice.
      // Nothing is transmitted until that connection is made.
      form.hidden = true;
      done.hidden = false;
      done.setAttribute('tabindex', '-1');
      done.focus();
    });
  })();
})();
