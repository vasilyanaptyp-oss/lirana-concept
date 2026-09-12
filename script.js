(function () {
  'use strict';

  var form = document.getElementById('order-form');
  var fType = document.getElementById('f-type');
  var fWidth = document.getElementById('f-width');
  var fHeight = document.getElementById('f-height');
  var fQty = document.getElementById('f-qty');
  var fName = document.getElementById('f-name');
  var fPhone = document.getElementById('f-phone');
  var fNote = document.getElementById('f-note');
  var summaryText = document.getElementById('summary-text');
  var result = document.getElementById('result');
  var resultText = document.getElementById('result-text');
  var resultMail = document.getElementById('result-mail');
  var resultBack = document.getElementById('result-back');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
  var pickButtons = Array.prototype.slice.call(document.querySelectorAll('[data-pick]'));

  /* ---------- Live summary ---------- */
  function num(el) {
    if (!el) return null;
    var v = parseInt(String(el.value).replace(/\D+/g, ''), 10);
    return isNaN(v) || v <= 0 ? null : v;
  }

  function buildSummary() {
    var parts = [];
    var type = fType.value.trim();
    var w = num(fWidth);
    var h = num(fHeight);
    var q = num(fQty);

    parts.push(type ? type : 'Gaminys nepasirinktas');

    if (w && h) {
      parts.push(w + ' × ' + h + ' mm');
    } else if (w) {
      parts.push('plotis ' + w + ' mm');
    } else if (h) {
      parts.push('aukštis ' + h + ' mm');
    } else if (type) {
      parts.push('matmenys nenurodyti');
    }

    if (q && q > 1) parts.push(q + ' vnt.');

    var name = fName.value.trim();
    if (name) parts.push(name);

    var phone = fPhone.value.trim();
    if (phone) parts.push(phone);

    return parts.join(' · ');
  }

  function syncActiveCard() {
    var current = fType.value.trim();
    cards.forEach(function (card) {
      var on = card.getAttribute('data-type') === current && current !== '';
      card.classList.toggle('is-active', on);
      var btn = card.querySelector('[data-pick]');
      if (btn) {
        btn.classList.toggle('is-picked', on);
        btn.textContent = on ? 'Pasirinkta' : 'Pasirinkti';
      }
    });
  }

  function updateSummary() {
    summaryText.textContent = buildSummary();
    syncActiveCard();
  }

  ['input', 'change'].forEach(function (evt) {
    form.addEventListener(evt, updateSummary);
  });

  /* ---------- Product pick buttons ---------- */
  function scrollToForm() {
    var target = document.getElementById('uzklausa');
    if (!target) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  pickButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-pick');
      var matched = false;
      Array.prototype.forEach.call(fType.options, function (opt) {
        if (opt.value === value || opt.textContent.trim() === value) {
          fType.value = opt.value || opt.textContent.trim();
          matched = true;
        }
      });
      if (!matched) fType.value = value;

      result.hidden = true;
      form.hidden = false;

      updateSummary();
      scrollToForm();

      window.setTimeout(function () {
        if (fWidth) fWidth.focus({ preventScroll: true });
      }, 420);
    });
  });

  /* ---------- Submit ---------- */
  function buildLetter() {
    var lines = [];
    lines.push('Užklausa iš svetainės');
    lines.push('');
    lines.push('Gaminys: ' + (fType.value.trim() || '—'));
    lines.push('Angos plotis: ' + (num(fWidth) ? num(fWidth) + ' mm' : '—'));
    lines.push('Angos aukštis: ' + (num(fHeight) ? num(fHeight) + ' mm' : '—'));
    lines.push('Kiekis: ' + (num(fQty) ? num(fQty) + ' vnt.' : '1 vnt.'));
    lines.push('Vardas: ' + (fName.value.trim() || '—'));
    lines.push('Telefonas: ' + (fPhone.value.trim() || '—'));
    var note = fNote.value.trim();
    if (note) {
      lines.push('');
      lines.push('Pastabos:');
      lines.push(note);
    }
    return lines.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var typeField = fType.closest('.field');
    if (!fType.value.trim()) {
      typeField.classList.add('has-error');
      fType.focus();
      summaryText.textContent = 'Pirmiausia pasirinkite gaminį';
      return;
    }
    typeField.classList.remove('has-error');

    var letter = buildLetter();
    resultText.textContent = letter;

    var subject = 'Užklausa: ' + fType.value.trim();
    resultMail.href =
      'mailto:silutehronas@gmail.com?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(letter);

    form.hidden = true;
    result.hidden = false;
    result.scrollIntoView({ block: 'nearest' });
    var heading = result.querySelector('h3');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  });

  resultBack.addEventListener('click', function () {
    result.hidden = true;
    form.hidden = false;
    fType.focus({ preventScroll: true });
  });

  /* ---------- Scroll reveal ---------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealAll() {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  if (reduceMotion) {
    revealAll();
  } else {
    revealables.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 55 + 'ms';
    });

    // Primary: IntersectionObserver, zero threshold and a generous margin.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '240px 0px 240px 0px', threshold: 0 });
      revealables.forEach(function (el) { io.observe(el); });
    }

    // Safety net: IntersectionObserver can skip elements during a fast flick or a
    // programmatic jump. This geometry sweep cannot, and it deliberately avoids
    // requestAnimationFrame, which is throttled while the tab is in the background.
    var lastSweep = 0;

    function sweep() {
      lastSweep = Date.now();
      var limit = window.innerHeight * 1.25;
      var toReveal = [];
      var remaining = false;
      // Read every rect first, write classes after, so we never thrash layout.
      revealables.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        if (el.getBoundingClientRect().top < limit) {
          toReveal.push(el);
        } else {
          remaining = true;
        }
      });
      toReveal.forEach(function (el) { el.classList.add('is-in'); });
      if (!remaining) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    }

    function onScroll() {
      if (Date.now() - lastSweep < 80) return;
      sweep();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') sweep();
    });
    sweep();

    // Last resort: nothing on this page may stay invisible.
    window.setTimeout(revealAll, 2500);
  }

  updateSummary();
})();
