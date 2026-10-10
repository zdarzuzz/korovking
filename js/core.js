/* ==========================================================================
   Коровкинг — общие функции: утилиты, хранилище, избранное, время Москвы,
   стоимость, шаблоны карточек, «Поделиться», уведомления.
   Подключается на всех страницах после файлов из /data.
   ========================================================================== */
(function () {
  'use strict';

  var DATA = window.KOROVKING_DATA || { places: [], articles: [], rubrics: {}, placeTypes: {} };
  var K = window.K = window.K || {};

  K.paths = {
    images: 'assets/images/',
    icons: 'assets/icons/sprite.svg',
    brand: 'assets/brand/',
    fallbackImage: 'assets/images/fallback.svg'
  };

  /* ---------- утилиты ---------- */
  K.esc = function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  // plural(5, ['место', 'места', 'мест']) → 'мест'
  K.plural = function (n, forms) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  };

  K.norm = function (s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  };

  K.money = function (n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  };

  K.icon = function (name, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="' +
      K.paths.icons + '#i-' + name + '"></use></svg>';
  };

  K.img = function (file) { return K.paths.images + file; };

  K.param = function (name) {
    return new URLSearchParams(window.location.search).get(name);
  };

  /* ---------- безопасное localStorage ---------- */
  K.store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    }
  };

  /* ---------- уведомления ---------- */
  K.toast = function (message, type) {
    var region = document.querySelector('.toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    var el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    el.textContent = message;
    region.appendChild(el);
    setTimeout(function () { el.remove(); }, type === 'error' ? 7000 : 3500);
  };

  /* ---------- избранное ---------- */
  var FAV_KEY = 'korovking:favorites';
  K.favorites = {
    list: function () {
      var v = K.store.get(FAV_KEY, []);
      return Array.isArray(v) ? v : [];
    },
    has: function (id) { return K.favorites.list().indexOf(id) !== -1; },
    toggle: function (id) {
      var list = K.favorites.list();
      var i = list.indexOf(id);
      if (i === -1) list.push(id); else list.splice(i, 1);
      var saved = K.store.set(FAV_KEY, list);
      if (!saved) K.toast('Не удалось сохранить избранное: браузер запретил хранение данных.', 'error');
      document.dispatchEvent(new CustomEvent('favorites:change', { detail: { id: id, active: i === -1 } }));
      return i === -1;
    }
  };

  K.favButton = function (place, extraClass) {
    var on = K.favorites.has(place.id);
    return '<button type="button" class="fav-btn' + (extraClass ? ' ' + extraClass : '') + '" data-fav="' + K.esc(place.id) + '" aria-pressed="' + on + '" ' +
      'aria-label="' + (on ? 'Убрать из избранного: ' : 'Добавить в избранное: ') + K.esc(place.name) + '">' +
      K.icon(on ? 'heart-fill' : 'heart') + '</button>';
  };

  function syncFavButtons(id) {
    var on = K.favorites.has(id);
    var place = K.places.byId(id);
    document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(on));
      var use = btn.querySelector('use');
      if (use) use.setAttribute('href', K.paths.icons + '#i-' + (on ? 'heart-fill' : 'heart'));
      var label = btn.querySelector('[data-fav-label]');
      if (label) label.textContent = on ? 'В избранном' : 'В избранное';
      if (!label && place) btn.setAttribute('aria-label', (on ? 'Убрать из избранного: ' : 'Добавить в избранное: ') + place.name);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var id = btn.getAttribute('data-fav');
    var added = K.favorites.toggle(id);
    syncFavButtons(id);
    var place = K.places.byId(id);
    if (place) K.toast(added ? '«' + place.name + '» в избранном' : '«' + place.name + '» убрано из избранного');
  });

  /* ---------- fallback для изображений ---------- */
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && !t.dataset.fallbackApplied) {
      t.dataset.fallbackApplied = '1';
      t.src = K.paths.fallbackImage;
      t.classList.add('is-fallback');
    }
  }, true);

  /* ---------- московское время ---------- */
  var WD = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  K.mskNow = function (date) {
    var d = date || new Date();
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Moscow', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(d);
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return { day: WD[o.weekday], minutes: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (err) {
      // Москва — UTC+3 без перехода на летнее время
      var utc = d.getTime() + d.getTimezoneOffset() * 60000 + 3 * 3600000;
      var m = new Date(utc);
      return { day: (m.getDay() + 6) % 7, minutes: m.getHours() * 60 + m.getMinutes() };
    }
  };

  function toMin(hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  var DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  var DAY_ACC = ['понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу', 'воскресенье'];
  var DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  /* ---------- места ---------- */
  var PRICE_UNITS = {
    free: { label: 'Бесплатно', unit: '', filterLabel: 'бесплатно' },
    hour: { label: 'Почасовая оплата', unit: '₽/час', filterLabel: 'за час' },
    check: { label: 'Средний чек', unit: '₽ средний чек', filterLabel: 'средний чек' },
    ticket: { label: 'Вход', unit: '₽ за вход', filterLabel: 'вход' }
  };

  K.places = {
    all: DATA.places || [],
    types: DATA.placeTypes || {},
    units: PRICE_UNITS,
    dayNames: DAY_NAMES,
    dayShort: DAY_SHORT,
    amenityLabels: {
      wifi: 'Wi-Fi', sockets: 'Розетки', quiet: 'Тихо', team: 'Можно с командой', calls: 'Можно на созвон'
    },
    groupLabels: { study: 'Учёба и работа', food: 'Кафе и еда' },

    byId: function (id) {
      for (var i = 0; i < K.places.all.length; i++) if (K.places.all[i].id === id) return K.places.all[i];
      return null;
    },
    typeLabel: function (p) { return (K.places.types[p.type] || {}).label || 'Место'; },
    group: function (p) { return (K.places.types[p.type] || {}).group || 'study'; },
    hasDiscount: function (p) { return !!(p.discounts && (p.discounts.student || p.discounts.age)); },
    districts: function () {
      var set = {};
      K.places.all.forEach(function (p) { set[p.district] = true; });
      return Object.keys(set).sort(function (a, b) { return a.localeCompare(b, 'ru'); });
    },

    /* Стоимость */
    isFree: function (p) { return p.price.kind === 'free'; },
    priceShort: function (p) {
      var pr = p.price;
      if (pr.kind === 'free') return 'Бесплатно';
      if (pr.kind === 'hour') return K.money(pr.amount) + '/час';
      if (pr.kind === 'check') return '≈ ' + K.money(pr.amount);
      return K.money(pr.amount);
    },
    priceUnitNote: function (p) {
      var k = p.price.kind;
      if (k === 'check') return 'средний чек';
      if (k === 'ticket') return 'вход';
      return '';
    },
    priceLong: function (p) {
      var pr = p.price;
      if (pr.kind === 'free') return 'Бесплатно';
      return K.money(pr.amount) + ' — ' + PRICE_UNITS[pr.kind].label.toLowerCase() + (pr.kind === 'hour' ? ' (за час)' : '');
    },
    /*
     * Оценка стоимости одного визита — используется ТОЛЬКО в подборке
     * «Выходные за 1к» и в квизе, где нужна общая шкала. Правило открыто
     * показывается пользователю: кафе — средний чек, вход — цена билета,
     * почасовые места — цена за выбранное число часов.
     */
    visitCost: function (p, hours) {
      var pr = p.price;
      if (pr.kind === 'free') return 0;
      if (pr.kind === 'hour') return pr.amount * (hours || 2);
      return pr.amount;
    },

    /* Расписание */
    is24h: function (p) {
      return p.hours.every(function (day) {
        return day.some(function (iv) { return iv[0] === '00:00' && iv[1] === '24:00'; });
      });
    },
    openOnWeekend: function (p) { return p.hours[5].length > 0 || p.hours[6].length > 0; },
    /* Открыто ли место в указанный момент (день 0–6 от понедельника, минуты от полуночи по Москве).
       Учитываются интервалы через полночь: «12:00–02:00» в понедельник открыт и во вторник до 02:00. */
    isOpenAt: function (p, day, minutes) {
      var today = p.hours[day] || [];
      for (var i = 0; i < today.length; i++) {
        var o = toMin(today[i][0]), c = toMin(today[i][1]);
        if (c > o) { if (minutes >= o && minutes < c) return true; }
        else if (minutes >= o) return true; // переход через полночь, часть до 24:00
      }
      var prev = p.hours[(day + 6) % 7] || [];
      for (var j = 0; j < prev.length; j++) {
        var po = toMin(prev[j][0]), pc = toMin(prev[j][1]);
        if (pc <= po && minutes < pc) return true; // хвост вчерашнего интервала после полуночи
      }
      return false;
    },
    isOpenNow: function (p) {
      var now = K.mskNow();
      return K.places.isOpenAt(p, now.day, now.minutes);
    },
    /* Текст статуса: «Открыто до 22:00» / «Закрыто · откроется во вторник в 10:00» */
    status: function (p) {
      if (K.places.is24h(p)) return { open: true, text: 'Открыто круглосуточно' };
      var now = K.mskNow();
      var open = K.places.isOpenAt(p, now.day, now.minutes);
      if (open) {
        var closeAt = null;
        (p.hours[now.day] || []).forEach(function (iv) {
          var o = toMin(iv[0]), c = toMin(iv[1]);
          if ((c > o && now.minutes >= o && now.minutes < c) || (c <= o && now.minutes >= o)) closeAt = iv[1];
        });
        if (!closeAt) {
          (p.hours[(now.day + 6) % 7] || []).forEach(function (iv) {
            if (toMin(iv[1]) <= toMin(iv[0]) && now.minutes < toMin(iv[1])) closeAt = iv[1];
          });
        }
        return { open: true, text: 'Открыто до ' + (closeAt === '24:00' ? '00:00' : closeAt) };
      }
      for (var add = 0; add < 8; add++) {
        var d = (now.day + add) % 7;
        var list = p.hours[d] || [];
        for (var i = 0; i < list.length; i++) {
          var o2 = toMin(list[i][0]);
          if (add > 0 || o2 > now.minutes) {
            var when = add === 0 ? 'сегодня' : add === 1 ? 'завтра' : DAY_ACC[d];
            var prep = (add >= 2 && d === 1) ? 'во ' : (add >= 2 ? 'в ' : '');
            return { open: false, text: 'Закрыто · откроется ' + prep + when + ' в ' + list[i][0] };
          }
        }
      }
      return { open: false, text: 'Закрыто' };
    },
    dayHoursText: function (day) {
      if (!day || !day.length) return 'Выходной';
      return day.map(function (iv) {
        if (iv[0] === '00:00' && iv[1] === '24:00') return 'Круглосуточно';
        var overnight = toMin(iv[1]) <= toMin(iv[0]);
        return iv[0] + '–' + iv[1] + (overnight ? ' (до утра следующего дня)' : '');
      }).join(', ');
    },
    amenityList: function (p) {
      return Object.keys(K.places.amenityLabels).filter(function (k) { return p.amenities[k]; });
    },

    /* Карточка места (общая для каталога, подборок, похожих мест, квиза) */
    card: function (p, opts) {
      opts = opts || {};
      var tags = K.places.amenityList(p).slice(0, opts.maxTags || 3).map(function (k) {
        return '<li class="tag">' + K.places.amenityLabels[k] + '</li>';
      }).join('');
      var heading = opts.headingLevel || 3;
      var unit = K.places.priceUnitNote(p);
      return '<article class="place-card">' +
        '<div class="place-card__media"><img src="' + K.img(p.photos[0]) + '" alt="' + K.esc(p.alt) + '" loading="lazy" width="460" height="340"></div>' +
        (p.demo ? '<span class="badge-demo place-card__demo">Пример</span>' : '') +
        K.favButton(p) +
        '<div class="place-card__body">' +
          '<div class="place-card__top"><span class="place-card__type">' + K.esc(K.places.typeLabel(p)) + '</span>' +
          '<span class="place-card__price">' + K.places.priceShort(p) + (unit ? '<small>' + unit + '</small>' : '') + '</span></div>' +
          '<h' + heading + ' class="place-card__title"><a class="place-card__link" href="place.html?id=' + encodeURIComponent(p.id) + '">' + K.esc(p.name) + '</a></h' + heading + '>' +
          '<p class="place-card__metro">' + K.icon('metro') + '<span>' + K.esc(p.metro) + ' — ' + p.walk + ' мин пешком</span></p>' +
          (opts.extra || '') +
          '<ul class="place-card__tags" role="list" aria-label="Удобства">' + tags + '</ul>' +
        '</div>' +
      '</article>';
    }
  };

  /* ---------- статьи ---------- */
  var WORDS_PER_MINUTE = 180;
  function articleText(a) {
    var parts = [a.title, a.lead];
    a.body.forEach(function (b) { parts.push(b.x || ''); (b.items || []).forEach(function (i) { parts.push(i); }); });
    return parts.join(' ');
  }
  K.articles = {
    all: (DATA.articles || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }),
    rubrics: DATA.rubrics || {},
    byId: function (id) {
      for (var i = 0; i < K.articles.all.length; i++) if (K.articles.all[i].id === id) return K.articles.all[i];
      return null;
    },
    rubricLabel: function (a) { return K.articles.rubrics[a.rubric] || ''; },
    words: function (a) { return articleText(a).split(/\s+/).filter(Boolean).length; },
    minutes: function (a) { return Math.max(1, Math.ceil(K.articles.words(a) / WORDS_PER_MINUTE)); },
    minutesLabel: function (a) { return K.articles.minutes(a) + ' мин'; },
    url: function (a) { return 'article.html?id=' + encodeURIComponent(a.id); },
    card: function (a, opts) {
      opts = opts || {};
      var h = opts.headingLevel || 3;
      return '<article class="article-card">' +
        '<div class="article-card__media"><img src="' + K.img(a.cover) + '" alt="' + K.esc(a.coverAlt) + '" loading="lazy" width="417" height="320"></div>' +
        '<p class="article-card__meta"><span>' + K.esc(K.articles.rubricLabel(a)) + '</span><span>' + K.articles.minutesLabel(a) + '</span></p>' +
        '<h' + h + ' class="article-card__title"><a class="article-card__link" href="' + K.articles.url(a) + '">' + K.esc(a.title) + '</a></h' + h + '>' +
      '</article>';
    }
  };

  /* ---------- «Поделиться» ---------- */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  K.copyText = function (text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  };
  K.share = function (data) {
    var url = data.url || window.location.href;
    if (navigator.share) {
      return navigator.share({ title: data.title, text: data.text, url: url }).catch(function (err) {
        if (err && err.name === 'AbortError') return; // пользователь закрыл меню
        return copyWithToast(url);
      });
    }
    return copyWithToast(url);
  };
  function copyWithToast(url) {
    return K.copyText(url).then(function (ok) {
      if (ok) K.toast('Ссылка скопирована');
      else K.toast('Не получилось скопировать автоматически. Скопируйте ссылку из адресной строки: ' + url, 'error');
    });
  }

  /* ---------- удержание фокуса внутри окна/панели ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  K.trapFocus = function (container) {
    container.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var items = Array.prototype.filter.call(container.querySelectorAll(FOCUSABLE), function (el) {
        return el.offsetParent !== null || el === document.activeElement;
      });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  };

  /* ---------- скачать текстовый файл ---------- */
  K.downloadText = function (filename, text) {
    try {
      var blob = new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      return true;
    } catch (e) {
      K.toast('Не удалось скачать файл в этом браузере.', 'error');
      return false;
    }
  };
})();
