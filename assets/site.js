/* AutomateSmall — spec v2. No dependencies. Everything degrades without JS. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- C0 state
     Nothing here is stored or transmitted until the visitor presses
     "Email me this list" or books a walkthrough. No account, no sign-up. */
  var check = {
    statements: [],
    industry: null,
    hoursPerWeek: 10,
    teamCount: 0,
    teamHoursEach: 0,
    timeBackChoice: null
  };

  /* E4 — analytics. Pushes to dataLayer; swap in any privacy-friendly tool. */
  function track(event, props) {
    (window.dataLayer = window.dataLayer || []).push(
      Object.assign({ event: event }, props || {})
    );
  }

  /* Default ranking when points tie and no industry is set. */
  var DEFAULT_ORDER = ['W3', 'W5', 'W8', 'W1', 'W7', 'W4', 'W6', 'W2'];

  var INDUSTRY_PRIORITY = {
    home:         ['W5', 'W3', 'W6', 'W8'],
    studios:      ['W4', 'W6', 'W3', 'W2'],
    professional: ['W7', 'W4', 'W3', 'W8'],
    retail:       ['W8', 'W3', 'W1', 'W6'],
    health:       ['W1', 'W2', 'W6', 'W3'],
    childcare:    ['W2', 'W4', 'W3', 'W1'],
    construction: ['W3', 'W5', 'W2', 'W8']
  };

  /* Workflow definitions. These used to be read out of the "what we take off
     your plate" cards; that section is gone, so this is now the only copy. */
  var WORKFLOWS = {
    "W1": {
      "ex": {
        "childcare": "New staff finish background checks and policy sign-offs before they’re on the floor.",
        "construction": "New crew have their safety induction and documents done before they’re on site.",
        "health": "New front-desk and clinical staff finish onboarding paperwork before day one.",
        "home": "New techs have their licences, insurance and van checklist done before the first call-out.",
        "professional": "New staff complete confidentiality agreements without you asking twice.",
        "retail": "New sales staff finish their paperwork before their first shift on the floor.",
        "studios": "New instructors finish their background check and waivers before they teach."
      },
      "outcome": "New hires finish their paperwork without you chasing them.",
      "title": "New employee onboarding"
    },
    "W2": {
      "ex": {
        "childcare": "Staff CPR and first-aid renewals flagged 30 days ahead.",
        "construction": "Subcontractor insurance certificates tracked, with a heads-up before they expire.",
        "health": "Staff certifications tracked and renewed before they lapse.",
        "home": "Licences and trade certifications tracked, so nobody works on an expired ticket.",
        "professional": "Professional licences and continuing-education hours tracked per person.",
        "retail": "Food-handling and age-restricted sales certifications tracked per employee.",
        "studios": "Instructor certifications and first-aid renewals flagged before they lapse."
      },
      "outcome": "Know what’s expiring before it becomes a problem.",
      "title": "Certifications and compliance"
    },
    "W3": {
      "ex": {
        "childcare": "Late fees and outstanding tuition surfaced before the month closes.",
        "construction": "Progress claims raised on schedule and retention tracked per job.",
        "health": "Outstanding account balances chased on a schedule instead of by hand.",
        "home": "Job finished Friday, invoice out Friday, not the following Wednesday.",
        "professional": "Fee notes go out on schedule and overdue accounts arrive as one list.",
        "retail": "Open vendor invoices and unpaid accounts in a single weekly view.",
        "studios": "Failed monthly payments surface the same week, not at month end."
      },
      "outcome": "Know which invoices need attention.",
      "title": "Invoices and payments"
    },
    "W4": {
      "ex": {
        "childcare": "Enrolment forms, allergies and authorised pick-ups collected in one go.",
        "construction": "New clients’ scope, site details and contacts captured once.",
        "health": "New patients complete intake forms and scheduling before they arrive.",
        "home": "New customers give you the address, access notes and photos before you roll a truck.",
        "professional": "New clients complete engagement letters and identity checks in one pass.",
        "retail": "Trade and account customers set up the same way, every time.",
        "studios": "New students’ forms, waivers and first payment, collected before the first class."
      },
      "outcome": "New customers get set up the same way every time.",
      "title": "Customer intake"
    },
    "W5": {
      "ex": {
        "childcare": "Tour requests get a reply and a scheduled visit within the day.",
        "construction": "Tender and quote requests get acknowledged before the deadline passes.",
        "health": "New-patient enquiries get a reply the same day.",
        "home": "Every estimate request gets a reply the same day, even when you’re on a job.",
        "professional": "Referrals get acknowledged the day they arrive, not the week they arrive.",
        "retail": "Special-order and stock enquiries get answered before the customer buys elsewhere.",
        "studios": "Trial-class enquiries get a reply and a booked slot the same day."
      },
      "outcome": "Every inquiry gets a reply, even on your busiest day.",
      "title": "Lead follow-up"
    },
    "W6": {
      "ex": {
        "childcare": "Parents reminded about closures, early pickups and paperwork deadlines.",
        "construction": "Site visits and inspections confirmed with the right people the day before.",
        "health": "Appointment reminders and rescheduling handled without a call from the front desk.",
        "home": "Appointment windows confirmed the day before, so fewer wasted drives.",
        "professional": "Meeting reminders that say what the client needs to bring.",
        "retail": "Fitting, service and pickup appointments confirmed and reminded.",
        "studios": "Class reminders and make-up bookings without the front desk chasing."
      },
      "outcome": "Fewer no-shows and fewer “what time was that?” calls.",
      "title": "Scheduling and reminders"
    },
    "W7": {
      "ex": {
        "childcare": "Immunisation records and authorisation forms collected before the start date.",
        "construction": "Subcontractor insurance, licences and method statements collected before mobilisation.",
        "health": "Staff credentialing documents collected and filed per person.",
        "home": "Permits, sign-offs and job photos collected and filed against the job.",
        "professional": "Tax-season documents requested, tracked and chased without your inbox.",
        "retail": "Supplier paperwork and resale certificates collected and filed.",
        "studios": "Waivers, medical notes and photo permissions collected and filed per student."
      },
      "outcome": "Stop chasing people for forms.",
      "title": "Document collection"
    },
    "W8": {
      "ex": {
        "childcare": "Monday: enrolment numbers, staff ratios and paperwork outstanding.",
        "construction": "Monday: jobs running, claims outstanding and certificates about to expire.",
        "health": "Monday: chair time booked, staff actions and outstanding balances.",
        "home": "Monday: jobs booked, quotes outstanding, invoices unpaid, techs short of work.",
        "professional": "Monday: work in progress, unbilled time, and what’s waiting on a client.",
        "retail": "A Monday summary of sales, open vendor invoices and next week’s staffing.",
        "studios": "Monday: attendance, trials booked, failed payments and memberships lapsing."
      },
      "outcome": "One page on Monday that tells you how the business is doing.",
      "title": "Weekly owner summary"
    }
  };

  /* ------------------------------------------------------------------- nav */
  (function nav() {
    var bar = $('#nav'), btn = $('#nav-toggle'), panel = $('#nav-panel');
    if (btn && panel) {
      btn.addEventListener('click', function () {
        var open = panel.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Close' : 'Menu';
      });
    }
    if (bar) {
      var onScroll = function () { bar.classList.toggle('is-stuck', window.scrollY > 40); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  })();

  /* ------------------------------------------------------------- C1/C6 stacks */
  function stack(rootSel) {
    var root = $(rootSel);
    if (!root) return null;
    var layers = $$('[data-layer]', root), btns = $$('[data-show]', root);
    function set(name) {
      layers.forEach(function (l) {
        var on = l.getAttribute('data-layer') === name;
        l.setAttribute('data-state', on ? 'shown' : 'hidden');
        l.setAttribute('aria-hidden', String(!on));
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
    if (reduced.matches) { set('after'); return; }
    set('before');
    // Plays once, 600ms after load. End state persists; no replay loop.
    window.setTimeout(function () { set('after'); }, 600 + 1900);
  })();

  (function before() { var s = stack('#bv'); if (s) s('after'); })();

  /* -------------------------------------------------------------- C6 tablist */
  (function tabs() {
    var list = $('#fmt-tabs');
    if (!list) return;
    var tabs = $$('[role=tab]', list);
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
      track('format_tab', { format: tab.getAttribute('data-fmt') });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(t), n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft')  n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home')       n = tabs[0];
        if (e.key === 'End')        n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n); n.focus(); }
      });
    });
  })();

  /* ------------------------------------------------- C2 the recognition wall */
  var pill = $('#pill');

  function refreshPill() {
    if (!pill) return;
    var n = check.statements.length;
    var drawerOpen = panelEl && !panelEl.hidden;
    var finalInView = finalSeen;
    pill.classList.toggle('is-on', n > 0 && !drawerOpen && !finalInView);
    $('#pill-n').textContent = String(n);
    $('#pill-word').textContent = n === 1 ? 'picked' : 'picked';
  }

  (function wall() {
    var wallEl = $('#wall');
    if (!wallEl) return;
    var count = $('#wall-count'), cta = $('#wall-cta');

    function refresh() {
      var n = check.statements.length;
      count.textContent = n === 0 ? 'Nothing picked yet' : n + (n === 1 ? ' picked' : ' picked');
      cta.disabled = n === 0;
      refreshPill();
    }
    $$('.stmt', wallEl).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id');
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on));
        var at = check.statements.indexOf(id);
        if (on && at === -1) check.statements.push(id);
        if (!on && at > -1) check.statements.splice(at, 1);
        track('statement_toggle', { id: id, selected: on });
        refresh();
      });
    });
    cta.addEventListener('click', function () { openPanel(); });
    refresh();
  })();

  // Hero CTA sends focus to the first statement, per C0.
  (function heroCta() {
    var b = $('#hero-cta');
    if (!b) return;
    b.addEventListener('click', function (e) {
      e.preventDefault();
      track('hero_cta_click', {});
      var wallEl = $('#wall');
      wallEl.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
      var first = $('.stmt', wallEl);
      window.setTimeout(function () { first.focus(); }, reduced.matches ? 0 : 500);
    });
  })();

  // Hide the pill once the final CTA is on screen.
  var finalSeen = false;
  (function watchFinal() {
    var f = $('#final');
    if (!f || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      finalSeen = entries[0].isIntersecting;
      refreshPill();
    }, { threshold: 0.15 }).observe(f);
  })();

  /* ------------------------------------------------------- C7 industry filter */
  function applyIndustry(key) {
    check.industry = key === 'all' ? null : key;
    var sel = $('#drawer-industry');
    if (sel) sel.value = check.industry || '';
  }

  /* -------------------------------------------------------- C8 the calculator */
  function annualHours() {
    var h = check.hoursPerWeek;
    var annual = h * 50;
    return annual > 100 ? Math.round(annual / 10) * 10 : annual;
  }
  function teamAnnual() { return check.teamCount * check.teamHoursEach * 50; }
  function workWeeks(hrs) { return Math.round((hrs / 40) * 2) / 2; }
  function atLeast() { return check.hoursPerWeek >= 20 ? 'at least ' : ''; }
  function num(n) { return n.toLocaleString('en-US'); }

  (function calc() {
    var slider = $('#hours');
    if (!slider) return;
    var big = $('#calc-big'), sub = $('#calc-sub'), teamOut = $('#calc-team'),
        qLabel = $('#calc-q'), toggle = $('#team-toggle'), fields = $('#team-fields'),
        peopleOut = $('#team-people'), each = $('#team-each'), eachOut = $('#team-each-out');
    var shown = 0, raf = null;

    function countTo(target) {
      if (reduced.matches) { big.textContent = 'About ' + num(target) + ' hours a year'; shown = target; return; }
      cancelAnimationFrame(raf);
      var from = shown, start = null;
      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / 600);
        var v = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
        big.textContent = 'About ' + num(v) + ' hours a year';
        if (p < 1) { raf = requestAnimationFrame(tick); } else { shown = target; }
      }
      raf = requestAnimationFrame(tick);
    }
    function paintText() {
      var a = annualHours();
      sub.textContent = "That's around " + atLeast() + workWeeks(a) + ' full work weeks.';
      qLabel.textContent = 'What would you do with ' + num(a) + ' hours back?';
      var t = teamAnnual();
      if (t > 0) {
        teamOut.hidden = false;
        teamOut.textContent = 'Your team: about ' + num(t) + ' hours a year. Together: ' + num(a + t) + '.';
      } else {
        teamOut.hidden = true;
      }
    }
    function setSlider() {
      var v = Number(slider.value);
      check.hoursPerWeek = v;
      slider.setAttribute('aria-valuetext', (v >= 20 ? '20 or more' : v) + (v === 1 ? ' hour a week' : ' hours a week'));
      $('#hours-out').textContent = (v >= 20 ? '20+' : v) + (v === 1 ? ' hour' : ' hours') + ' a week';
      paintText();
    }
    // Count-up runs when the slider is released, not on every step (B8).
    function release() { countTo(annualHours()); track('calculator_set', { hours: check.hoursPerWeek }); }

    slider.addEventListener('input', function () { setSlider(); big.textContent = 'About ' + num(annualHours()) + ' hours a year'; shown = annualHours(); });
    slider.addEventListener('change', release);
    slider.addEventListener('keyup', release);

    toggle.addEventListener('change', function () {
      fields.hidden = !toggle.checked;
      if (!toggle.checked) { check.teamCount = 0; check.teamHoursEach = 0; peopleOut.textContent = '0'; each.value = 0; eachOut.textContent = '0'; }
      paintText();
    });
    $$('[data-step]', fields).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = Number(b.getAttribute('data-step'));
        check.teamCount = Math.min(20, Math.max(0, check.teamCount + d));
        peopleOut.textContent = String(check.teamCount);
        paintText();
      });
    });
    each.addEventListener('input', function () {
      check.teamHoursEach = Number(each.value);
      eachOut.textContent = String(check.teamHoursEach);
      paintText();
    });

    $$('#timeback .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        var on = c.getAttribute('aria-pressed') !== 'true';
        $$('#timeback .chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', String(on));
        check.timeBackChoice = on ? c.textContent.trim() : null;
      });
    });

    $('#calc-cta').addEventListener('click', function () { openPanel(); });
    setSlider();
    shown = annualHours();
    big.textContent = 'About ' + num(annualHours()) + ' hours a year';
  })();

  /* ------------------------------------------------------- C0 the result panel */
  var panelEl = $('#drawer'), scrim = $('#scrim'), lastFocus = null;

  function score() {
    var pts = {};
    check.statements.forEach(function (id) {
      var el = $('.stmt[data-id="' + id + '"]');
      if (!el) return;
      (el.getAttribute('data-maps') || '').split(/\s+/).forEach(function (w) {
        if (w) pts[w] = (pts[w] || 0) + 1;
      });
    });
    var prio = check.industry ? (INDUSTRY_PRIORITY[check.industry] || []) : [];
    function rank(w) {
      var p = prio.indexOf(w);
      return p > -1 ? p : 100 + DEFAULT_ORDER.indexOf(w);
    }
    return Object.keys(pts)
      .sort(function (a, b) { return (pts[b] - pts[a]) || (rank(a) - rank(b)); })
      .slice(0, 3);
  }

  function renderPanel() {
    var empty = $('#drawer-empty'), body = $('#drawer-result');
    var has = check.statements.length > 0;
    empty.hidden = has;
    body.hidden = !has;
    $('#drawer-book').hidden = !has;
    $('#drawer-email-wrap').hidden = !has;
    if (!has) return;

    var list = $('#drawer-list');
    list.innerHTML = '';
    score().forEach(function (w, n) {
      var card = WORKFLOWS[w];
      if (!card) return;
      var li = document.createElement('li');
      var b = document.createElement('span');
      b.className = 'picked__n'; b.textContent = String(n + 1);
      var d = document.createElement('div');
      var t = document.createElement('div');
      t.className = 'picked__t'; t.textContent = card.title;
      var o = document.createElement('div');
      o.className = 'picked__o'; o.textContent = card.outcome;
      d.appendChild(t); d.appendChild(o);
      var ex = check.industry ? card.ex[check.industry] : null;
      if (ex) {
        var e = document.createElement('div');
        e.className = 'picked__e'; e.textContent = ex;
        d.appendChild(e);
      }
      li.appendChild(b); li.appendChild(d);
      list.appendChild(li);
    });

    var a = annualHours();
    var txt = 'You said about ' + check.hoursPerWeek + (check.hoursPerWeek >= 20 ? '+' : '') +
              ' hours a week. That’s around ' + atLeast() + num(a) + ' hours a year, or ' +
              workWeeks(a) + ' full work weeks.';
    if (check.timeBackChoice) {
      txt += " That's a lot of room to " + check.timeBackChoice.charAt(0).toLowerCase() + check.timeBackChoice.slice(1) + '.';
    }
    $('#drawer-time').textContent = txt;
  }

  function trapFocus(e) {
    if (e.key === 'Escape') { closePanel(); return; }
    if (e.key !== 'Tab') return;
    var items = $$('button, a[href], input, select, textarea', panelEl)
      .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openPanel() {
    lastFocus = document.activeElement;
    renderPanel();
    scrim.hidden = false; panelEl.hidden = false;
    requestAnimationFrame(function () { scrim.classList.add('is-on'); panelEl.classList.add('is-on'); });
    document.body.classList.add('is-locked');
    panelEl.addEventListener('keydown', trapFocus);
    $('#drawer-close').focus();
    refreshPill();
    track('check_result_open', { statements: check.statements.length });
  }

  function closePanel() {
    scrim.classList.remove('is-on'); panelEl.classList.remove('is-on');
    document.body.classList.remove('is-locked');
    panelEl.removeEventListener('keydown', trapFocus);
    window.setTimeout(function () { scrim.hidden = true; panelEl.hidden = true; refreshPill(); }, reduced.matches ? 0 : 260);
    if (lastFocus) lastFocus.focus();
  }

  if (panelEl) {
    $('#drawer-close').addEventListener('click', closePanel);
    scrim.addEventListener('click', closePanel);
    $('#drawer-goto').addEventListener('click', function () {
      closePanel();
      $('#wall').scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
      window.setTimeout(function () { $('.stmt').focus(); }, reduced.matches ? 0 : 500);
    });
    $('#drawer-industry').addEventListener('change', function (e) {
      applyIndustry(e.target.value || 'all');
      track('industry_select', { industry: e.target.value || 'all', from: 'drawer' });
      renderPanel();
    });
    $('#drawer-book').addEventListener('click', function () {
      try { sessionStorage.setItem('automatesmall.check', JSON.stringify(check)); } catch (err) {}
      track('booking_start', { from: 'drawer' });
      window.location.href = 'book.html';
    });
    $('#drawer-email').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = $('#drawer-email-addr');
      if (!f.value.trim() || f.value.indexOf('@') < 0) { f.focus(); return; }
      // NOTE FOR LAUNCH: connect to the mailer. Nothing leaves the browser yet.
      $('#drawer-email').hidden = true;
      $('#drawer-sent').hidden = false;
      track('email_list_sent', { statements: check.statements.length });
    });
  }
  if (pill) pill.addEventListener('click', function () { openPanel(); });

  /* ------------------------------------------------------- D4 booking prefill */
  (function booking() {
    var form = $('#walkthrough');
    if (!form) return;
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('automatesmall.check') || 'null'); } catch (e) {}
    if (saved) {
      if (saved.industry) { var s = $('#biz'); if (s) s.value = saved.industry; }
      var chipWrap = $('#booking-chips');
      if (chipWrap && saved.statements && saved.statements.length) {
        chipWrap.hidden = false;
        var ul = $('#booking-chip-list');
        saved.statements.forEach(function (id) {
          var li = document.createElement('li');
          li.className = 'tag';
          li.textContent = (STATEMENT_TEXT[id] || id);
          ul.appendChild(li);
        });
      }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if ($('#company-website').value) return;   // honeypot
      var ok = true, firstBad = null;
      $$('[data-required]', form).forEach(function (f) {
        var err = $('#' + f.id + '-err');
        var bad = !String(f.value || '').trim();
        if (err) err.hidden = !bad;
        f.setAttribute('aria-invalid', String(bad));
        if (bad) { ok = false; if (!firstBad) firstBad = f; }
      });
      if (!ok) { firstBad.focus(); return; }
      // NOTE FOR LAUNCH: embed the scheduler here (A1.8) and pass these
      // answers into the booking notes. Nothing is transmitted yet.
      form.hidden = true;
      $('#walkthrough-done').hidden = false;
      $('#walkthrough-done').setAttribute('tabindex', '-1');
      $('#walkthrough-done').focus();
      track('booking_complete', {});
    });
  })();

  var STATEMENT_TEXT = {
    R1: 'Entering the same information in three places',
    R2: 'Follow-ups only happen if I remember',
    R3: 'Spreadsheets everywhere',
    R4: 'Five systems, still no clear picture',
    R5: 'Checking employee paperwork by hand',
    R6: 'Invoices going out late',
    R7: 'How we do things lives in someone’s head',
    R8: 'Chasing people for forms'
  };
})();

/* "Not seeing yours?" — same posture as the booking form: validates, confirms,
   and transmits nothing until a mailer is connected. */
(function ask() {
  'use strict';
  var form = document.querySelector('#ask');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var what = document.querySelector('#ask-what');
    if (!what.value.trim()) { what.focus(); return; }
    // NOTE FOR LAUNCH: connect this to the inbox that actually gets read.
    form.hidden = true;
    var done = document.querySelector('#ask-done');
    done.hidden = false;
    done.setAttribute('tabindex', '-1');
    done.focus();
    (window.dataLayer = window.dataLayer || []).push({ event: 'service_request_sent' });
  });
})();
