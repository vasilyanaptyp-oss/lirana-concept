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

  function updateSummary() {
    summaryText.textContent = buildSummary();
    syncActiveCard();
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

      if (result) result.hidden = true;
      if (form) form.hidden = false;

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
    result.querySelector('h3').setAttribute('tabindex', '-1');
    result.querySelector('h3').focus({ preventScroll: true });
  });

  resultBack.addEventListener('click', function () {
    result.hidden = true;
    form.hidden = false;
    fType.focus({ preventScroll: true });
  });

  /* ---------- Scroll reveal ---------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealables.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 55 + 'ms';
      io.observe(el);
    });
  }

  updateSummary();
})();
