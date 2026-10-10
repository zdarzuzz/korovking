/* ==========================================================================
   Квиз подбора: 3 шага, ответы сохраняются при переходе назад
   (и в sessionStorage — переживают обновление страницы).
   Результат считается по тем же данным, что и каталог (data/places.js).
   ========================================================================== */
(function () {
  'use strict';
  var K = window.K;
  var P = K.places;
  var KEY = 'korovking:quiz';

  var form = document.getElementById('quiz-form');
  var steps = form.querySelectorAll('[data-step]');
  var dots = document.querySelectorAll('[data-step-dot]');
  var statusEl = document.querySelector('[data-step-status]');
  var btnBack = form.querySelector('[data-back]');
  var btnNext = form.querySelector('[data-next]');
  var btnSubmit = form.querySelector('[data-submit]');
  var btnRestart = form.querySelector('[data-restart]');
  var step1Error = form.querySelector('[data-step1-error]');
  var resultsEl = form.querySelector('[data-results]');
  var STEP_NAMES = ['О тебе', 'Предпочтения', 'Результат'];
  var TASKS = { solo: 'Поработать одному', study: 'Учиться', team: 'Встретиться с командой' };
  var PREFS = { quiet: 'Тихо', sockets: 'Розетки', wifi: 'Wi-Fi', calls: 'Можно на созвон' };

  P.districts().forEach(function (d) {
    var o = document.createElement('option');
    o.value = d; o.textContent = d + ' район';
    form.elements.district.appendChild(o);
  });

  var current = 1;

  /* ---------- ответы ---------- */
  function read() {
    var task = form.querySelector('input[name="task"]:checked');
    return {
      task: task ? task.value : '',
      district: form.elements.district.value,
      budget: form.elements.budget.value,
      hours: form.elements.hours.value,
      quiet: form.elements.quiet.checked,
      sockets: form.elements.sockets.checked,
      wifi: form.elements.wifi.checked,
      calls: form.elements.calls.checked,
      student: form.elements.student.checked,
      open: form.elements.open.checked
    };
  }
  function write(a) {
    form.querySelectorAll('input[name="task"]').forEach(function (r) { r.checked = r.value === a.task; });
    form.elements.district.value = P.districts().indexOf(a.district) !== -1 ? a.district : '';
    form.elements.budget.value = a.budget || '';
    form.elements.hours.value = a.hours || '2';
    ['quiet', 'sockets', 'wifi', 'calls', 'student', 'open'].forEach(function (k) { form.elements[k].checked = !!a[k]; });
  }
  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify({ step: current, answers: read() })); } catch (e) { /* не критично */ }
  }
  function restore() {
    try {
      var raw = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (raw && raw.answers) { write(raw.answers); return raw.step || 1; }
    } catch (e) { /* ignore */ }
    return 1;
  }

  /* ---------- подбор ---------- */
  function hardChecks(p, a) {
    var hours = +a.hours || 2;
    var cost = P.visitCost(p, hours);
    return {
      district: !a.district || p.district === a.district,
      budget: a.budget === '' || (a.budget === '0' ? P.isFree(p) : cost <= +a.budget),
      open: !a.open || P.isOpenNow(p),
      team: a.task !== 'team' || p.amenities.team
    };
  }
  function passes(checks) { return checks.district && checks.budget && checks.open && checks.team; }

  function score(p, a) {
    var s = 0;
    var wanted = Object.keys(PREFS).filter(function (k) { return a[k]; });
    wanted.forEach(function (k) { if (p.amenities[k]) s += 3; });
    if (a.student && p.discounts && p.discounts.student) s += 2;
    if (a.task === 'solo') { if (p.amenities.quiet) s += 2; if (p.amenities.sockets) s += 2; if (p.amenities.wifi) s += 1; }
    if (a.task === 'study') { if (p.amenities.quiet) s += 2; if (p.amenities.wifi) s += 1; if (p.type === 'library' || p.type === 'coworking') s += 1; }
    if (a.task === 'team') { if (p.amenities.sockets) s += 1; if (p.amenities.wifi) s += 1; if (P.group(p) === 'study') s += 1; }
    return s + p.popularity / 100;
  }

  function costText(p, a) {
    var hours = +a.hours || 2;
    if (P.isFree(p)) return 'бесплатно';
    if (p.price.kind === 'hour') return '≈ ' + K.money(P.visitCost(p, hours)) + ' за ' + hours + ' ' + K.plural(hours, ['час', 'часа', 'часов']) + ' (' + K.money(p.price.amount) + '/час)';
    if (p.price.kind === 'check') return 'средний чек ' + K.money(p.price.amount);
    return 'вход ' + K.money(p.price.amount);
  }

  function explain(p, a) {
    var lines = [];
    var good = function (t) { lines.push('<li class="match match--yes">' + K.icon('check') + '<span>' + t + '</span></li>'); };
    var bad = function (t) { lines.push('<li class="match match--no">' + K.icon('minus') + '<span>' + t + '</span></li>'); };
    if (a.task === 'team') good('Подходит для команды');
    if (a.task === 'solo' && p.amenities.quiet) good('Тихо — удобно работать одному');
    if (a.task === 'study' && (p.type === 'library' || p.amenities.quiet)) good('Спокойная обстановка для учёбы');
    if (a.district) good(K.esc(p.district) + ' район');
    if (a.budget !== '') good('В бюджете: ' + costText(p, a));
    else lines.push('<li class="match">' + K.icon('info') + '<span>Стоимость: ' + costText(p, a) + '</span></li>');
    if (a.open) good(K.esc(P.status(p).text));
    Object.keys(PREFS).forEach(function (k) {
      if (!a[k]) return;
      if (p.amenities[k]) good(PREFS[k]); else bad('Нет: ' + PREFS[k].toLowerCase());
    });
    if (a.student) {
      if (p.discounts && p.discounts.student) good('Есть студенческая скидка'); else bad('Нет студенческой скидки');
    }
    return '<ul class="matches" role="list">' + lines.join('') + '</ul>';
  }

  function catalogLink(a) {
    var u = new URLSearchParams();
    if (a.district) u.set('district', a.district);
    if (a.budget === '0') u.set('free', '1');
    if (a.budget === '1000') u.set('budget', '1000');
    if (a.task === 'team') u.set('team', '1');
    ['quiet', 'sockets', 'wifi', 'calls'].forEach(function (k) { if (a[k]) u.set(k, '1'); });
    if (a.student) u.set('dstudent', '1');
    if (a.open) u.set('open', '1');
    var qs = u.toString();
    return 'places.html' + (qs ? '?' + qs : '');
  }

  function renderResults() {
    var a = read();
    var all = P.all.map(function (p) { return { p: p, checks: hardChecks(p, a) }; });
    var ok = all.filter(function (x) { return passes(x.checks); })
      .map(function (x) { x.score = score(x.p, a); return x; })
      .sort(function (x, y) { return y.score - x.score; });
    var wanted = Object.keys(PREFS).filter(function (k) { return a[k]; });
    var isExact = function (p) {
      return wanted.every(function (k) { return p.amenities[k]; }) && (!a.student || (p.discounts && p.discounts.student));
    };

    var summary = '<p class="quiz-summary"><strong>Твой запрос:</strong> ' + TASKS[a.task] +
      (a.district ? ', ' + K.esc(a.district) + ' район' : '') +
      (a.budget === '' ? '' : a.budget === '0' ? ', только бесплатно' : ', до ' + K.money(+a.budget) + ' за визит') +
      (wanted.length ? ', ' + wanted.map(function (k) { return PREFS[k].toLowerCase(); }).join(', ') : '') +
      (a.student ? ', студенческая скидка' : '') + (a.open ? ', открыто сейчас' : '') + '.</p>';

    if (!ok.length) {
      // какие обязательные условия мешают — считаем, сколько мест было бы без каждого
      var labels = { district: 'района', budget: 'бюджета', open: 'условия «открыто сейчас»', team: 'требования «подходит для команды»' };
      var hints = Object.keys(labels).map(function (key) {
        var n = all.filter(function (x) {
          var c = Object.assign({}, x.checks); c[key] = true; return passes(c);
        }).length;
        return n && !all.every(function (x) { return x.checks[key]; }) ? '<li>Без ' + labels[key] + ' нашлось бы ' + n + ' ' + K.plural(n, ['место', 'места', 'мест']) + '</li>' : '';
      }).join('');
      resultsEl.innerHTML = summary +
        '<div class="empty-state quiz-empty">' +
          '<img src="' + K.paths.brand + 'logo-cow.png" alt="" width="96">' +
          '<p class="empty-state__title">Точных совпадений нет</p>' +
          '<p>Ни одно место в каталоге не подходит под все обязательные условия. Мы не стали предлагать варианты, которые их нарушают.</p>' +
          (hints ? '<ul class="quiz-hints">' + hints + '</ul>' : '') +
          '<button type="button" class="btn btn--lime" data-goto="2">Изменить условия</button>' +
        '</div>';
      return;
    }

    var top = ok.slice(0, 3);
    var exactCount = top.filter(function (x) { return isExact(x.p); }).length;
    var note = '';
    if (wanted.length || a.student) {
      note = exactCount === top.length
        ? '<p class="quiz-note quiz-note--ok">' + K.icon('check') + 'Все показанные места подходят по обязательным условиям и пожеланиям.</p>'
        : exactCount === 0
          ? '<p class="quiz-note">' + K.icon('info') + 'Мест, где есть всё, что ты отметил, не нашлось. Ниже — ближайшие варианты в рамках обязательных условий; несовпадения отмечены.</p>'
          : '<p class="quiz-note">' + K.icon('info') + 'Не все варианты совпадают со всеми пожеланиями — несовпадения отмечены в карточке.</p>';
    }

    resultsEl.innerHTML = summary + note +
      '<div class="place-grid place-grid--3 quiz-results">' +
        top.map(function (x) { return P.card(x.p, { extra: explain(x.p, a), maxTags: 0 }); }).join('') +
      '</div>' +
      '<p class="quiz-more">Всего под обязательные условия ' + K.plural(ok.length, ['подходит', 'подходят', 'подходят']) + ' ' + ok.length + ' ' + K.plural(ok.length, ['место', 'места', 'мест']) + '. ' +
        '<a class="link-arrow" href="' + catalogLink(a) + '">Открыть похожую подборку в каталоге ' + K.icon('arrow-right') + '</a></p>';
  }

  /* ---------- навигация по шагам ---------- */
  function go(n, focus) {
    current = n;
    steps.forEach(function (s) { s.hidden = +s.getAttribute('data-step') !== n; });
    dots.forEach(function (d) {
      var i = +d.getAttribute('data-step-dot');
      d.classList.toggle('is-current', i === n);
      d.classList.toggle('is-done', i < n);
      if (i === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
    btnBack.hidden = n === 1;
    btnNext.hidden = n !== 1;
    btnSubmit.hidden = n !== 2;
    btnRestart.hidden = n !== 3;
    statusEl.textContent = 'Шаг ' + n + ' из 3: ' + STEP_NAMES[n - 1];
    if (n === 3) renderResults();
    save();
    if (focus) {
      var title = steps[n - 1].querySelector('.quiz-step__title');
      if (title) title.focus();
    }
  }

  function validateStep1() {
    if (!read().task) {
      step1Error.textContent = 'Выбери, что планируешь делать — так подбор будет точнее.';
      form.querySelector('input[name="task"]').focus();
      return false;
    }
    step1Error.textContent = '';
    return true;
  }

  btnNext.addEventListener('click', function () { if (validateStep1()) go(2, true); });
  btnBack.addEventListener('click', function () { go(current - 1, true); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (current === 1) { if (validateStep1()) go(2, true); return; }
    if (!validateStep1()) { go(1, true); return; }
    go(3, true);
  });
  btnRestart.addEventListener('click', function () {
    form.reset();
    try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    go(1, true);
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'task') step1Error.textContent = '';
    save();
  });
  resultsEl.addEventListener('click', function (e) {
    var g = e.target.closest('[data-goto]');
    if (g) go(+g.getAttribute('data-goto'), true);
  });

  var start = restore();
  if (start === 3 && !read().task) start = 1;
  go(start, false);
})();
