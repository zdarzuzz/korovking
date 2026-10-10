/* ==========================================================================
   Каталог мест: поиск, категории, фильтры, сортировка, избранное,
   активные фильтры, синхронизация с URL, список и карта (Leaflet + OSM).
   ========================================================================== */
(function () {
  'use strict';
  var K = window.K;
  var P = K.places;

  /* ---------- состояние ---------- */
  var BOOL_KEYS = ['free', 'wifi', 'sockets', 'quiet', 'team', 'calls', 'open', 'h24', 'weekend', 'dstudent', 'dage', 'fav'];
  var DEFAULTS = {
    q: '', cat: 'all', district: '', unit: 'hour', pmin: '', pmax: '', budget: '',
    sort: 'popular', view: 'list', focus: ''
  };
  BOOL_KEYS.forEach(function (k) { DEFAULTS[k] = false; });

  var CAT_LABELS = { all: 'Все места', study: 'Учёба и работа', food: 'Кафе и еда', discount: 'Со скидками' };
  var UNIT_LABELS = { hour: '₽/час', check: '₽ средний чек', ticket: '₽ вход' };
  var BOOL_LABELS = {
    free: 'Бесплатно', wifi: 'Wi-Fi', sockets: 'Розетки', quiet: 'Тихо', team: 'Можно с командой', calls: 'Можно на созвон',
    open: 'Открыто сейчас', h24: 'Круглосуточно', weekend: 'Работает в выходные',
    dstudent: 'Скидка по студенческому', dage: 'Скидка по возрасту', fav: 'Только избранное'
  };
  var BUDGET_HOURS = 2;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function num(v) { var n = parseInt(v, 10); return isNaN(n) || n < 0 ? '' : String(n); }

  function stateFromURL() {
    var s = clone(DEFAULTS);
    var u = new URLSearchParams(location.search);
    s.q = (u.get('q') || '').slice(0, 80);
    if (CAT_LABELS[u.get('cat')]) s.cat = u.get('cat');
    if (P.districts().indexOf(u.get('district')) !== -1) s.district = u.get('district');
    if (UNIT_LABELS[u.get('unit')]) s.unit = u.get('unit');
    s.pmin = num(u.get('pmin'));
    s.pmax = num(u.get('pmax'));
    if (u.get('budget') === '1000') s.budget = '1000';
    BOOL_KEYS.forEach(function (k) { s[k] = u.get(k) === '1'; });
    if (['popular', 'price-asc', 'price-desc'].indexOf(u.get('sort')) !== -1) s.sort = u.get('sort');
    if (u.get('view') === 'map') s.view = 'map';
    if (P.byId(u.get('focus'))) s.focus = u.get('focus');
    return s;
  }

  function stateToURL(s) {
    var u = new URLSearchParams();
    Object.keys(DEFAULTS).forEach(function (k) {
      if (k === 'unit' && !(s.pmin || s.pmax)) return; // единица важна только с диапазоном
      if (s[k] !== DEFAULTS[k] && s[k] !== '') u.set(k, s[k] === true ? '1' : s[k]);
    });
    var qs = u.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  var state = stateFromURL();

  /* ---------- фильтрация ---------- */
  function matches(p, s) {
    if (s.q) {
      var hay = K.norm([p.name, p.district, p.metro].join(' '));
      var ok = K.norm(s.q).split(' ').every(function (t) { return hay.indexOf(t) !== -1; });
      if (!ok) return false;
    }
    if (s.cat === 'study' && P.group(p) !== 'study') return false;
    if (s.cat === 'food' && P.group(p) !== 'food') return false;
    if (s.cat === 'discount' && !P.hasDiscount(p)) return false;
    if (s.district && p.district !== s.district) return false;

    if (s.free && !P.isFree(p)) return false;
    if (!s.free && (s.pmin || s.pmax)) {
      var min = s.pmin ? +s.pmin : 0, max = s.pmax ? +s.pmax : Infinity;
      if (P.isFree(p)) { if (min > 0) return false; }
      else if (p.price.kind !== s.unit || p.price.amount < min || p.price.amount > max) return false;
    }
    if (s.budget && P.visitCost(p, BUDGET_HOURS) > +s.budget) return false;

    if (s.wifi && !p.amenities.wifi) return false;
    if (s.sockets && !p.amenities.sockets) return false;
    if (s.quiet && !p.amenities.quiet) return false;
    if (s.team && !p.amenities.team) return false;
    if (s.calls && !p.amenities.calls) return false;

    if (s.open && !P.isOpenNow(p)) return false;
    if (s.h24 && !P.is24h(p)) return false;
    if (s.weekend && !P.openOnWeekend(p)) return false;

    if (s.dstudent && !(p.discounts && p.discounts.student)) return false;
    if (s.dage && !(p.discounts && p.discounts.age)) return false;

    if (s.fav && !K.favorites.has(p.id)) return false;
    return true;
  }

  var UNIT_ORDER = { free: 0, hour: 1, check: 2, ticket: 3 };
  function sortList(list, s) {
    var arr = list.slice();
    if (s.sort === 'popular') return arr.sort(function (a, b) { return b.popularity - a.popularity; });
    var dir = s.sort === 'price-asc' ? 1 : -1;
    var sameUnit = !s.free && (s.pmin || s.pmax); // все результаты уже в одной единице (+ бесплатные)
    return arr.sort(function (a, b) {
      if (!sameUnit) {
        var g = UNIT_ORDER[a.price.kind] - UNIT_ORDER[b.price.kind];
        if (g) return g;
      }
      return (a.price.amount - b.price.amount) * dir || b.popularity - a.popularity;
    });
  }

  function filtered(s) { return sortList(P.all.filter(function (p) { return matches(p, s); }), s); }

  /* ---------- элементы ---------- */
  var form = document.getElementById('filter-form');
  var searchForm = document.getElementById('search-form');
  var searchInput = document.getElementById('search-input');
  var listEl = document.querySelector('[data-results-list]');
  var mapWrap = document.querySelector('[data-results-map]');
  var countEl = document.getElementById('results-count');
  var footerEl = document.querySelector('[data-results-footer]');
  var chipsEl = document.querySelector('[data-active-filters]');
  var sortEl = document.getElementById('sort');
  var sortNote = document.querySelector('[data-sort-note]');
  var favToggle = document.querySelector('[data-only-fav]');
  var favCount = document.querySelector('[data-fav-count]');
  var aside = document.getElementById('filters');
  var overlay = document.querySelector('.filters-overlay');
  var openBtn = document.querySelector('[data-filters-open]');
  var applyBtn = document.querySelector('[data-apply]');
  var badge = document.querySelector('[data-filters-badge]');
  var priceRange = document.querySelector('[data-price-range]');
  var mobileMQ = window.matchMedia('(max-width: 900px)');

  // районы из данных
  var districtSelect = document.getElementById('f-district');
  P.districts().forEach(function (d) {
    var o = document.createElement('option');
    o.value = d; o.textContent = d + ' район';
    districtSelect.appendChild(o);
  });

  /* ---------- форма <-> состояние ---------- */
  function writeForm(s) {
    searchInput.value = s.q;
    form.elements.district.value = s.district;
    form.elements.unit.value = s.unit;
    form.elements.pmin.value = s.pmin;
    form.elements.pmax.value = s.pmax;
    form.elements.budget.checked = !!s.budget;
    ['free', 'wifi', 'sockets', 'quiet', 'team', 'calls', 'open', 'h24', 'weekend', 'dstudent', 'dage'].forEach(function (k) {
      form.elements[k].checked = s[k];
    });
    priceRange.hidden = s.free;
    sortEl.value = s.sort;
    document.querySelectorAll('[data-cat]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === s.cat));
    });
  }

  function readForm(base) {
    var s = clone(base);
    s.district = form.elements.district.value;
    s.unit = form.elements.unit.value;
    s.pmin = num(form.elements.pmin.value);
    s.pmax = num(form.elements.pmax.value);
    if (s.pmin && s.pmax && +s.pmin > +s.pmax) { var t = s.pmin; s.pmin = s.pmax; s.pmax = t; }
    s.budget = form.elements.budget.checked ? '1000' : '';
    ['free', 'wifi', 'sockets', 'quiet', 'team', 'calls', 'open', 'h24', 'weekend', 'dstudent', 'dage'].forEach(function (k) {
      s[k] = form.elements[k].checked;
    });
    s.focus = '';
    return s;
  }

  /* ---------- активные фильтры ---------- */
  function activeFilters(s) {
    var out = [];
    if (s.q) out.push({ key: 'q', label: '«' + s.q + '»' });
    if (s.cat !== 'all') out.push({ key: 'cat', label: CAT_LABELS[s.cat] });
    if (s.district) out.push({ key: 'district', label: s.district + ' район' });
    if (s.free) out.push({ key: 'free', label: 'Бесплатно' });
    if (!s.free && (s.pmin || s.pmax)) {
      var range = (s.pmin ? 'от ' + s.pmin + ' ' : '') + (s.pmax ? 'до ' + s.pmax + ' ' : '');
      out.push({ key: 'price', label: range + UNIT_LABELS[s.unit] });
    }
    if (s.budget) out.push({ key: 'budget', label: 'До 1000 ₽ за визит' });
    ['wifi', 'sockets', 'quiet', 'team', 'calls', 'open', 'h24', 'weekend', 'dstudent', 'dage', 'fav'].forEach(function (k) {
      if (s[k]) out.push({ key: k, label: BOOL_LABELS[k] });
    });
    return out;
  }
  function removeFilter(s, key) {
    if (key === 'price') { s.pmin = ''; s.pmax = ''; }
    else if (key in DEFAULTS) s[key] = DEFAULTS[key];
    return s;
  }

  /* ---------- рендер ---------- */
  function countText(n) {
    return n === 0 ? 'Ничего не нашлось' : 'Найдено ' + n + ' ' + K.plural(n, ['место', 'места', 'мест']);
  }

  function render(opts) {
    opts = opts || {};
    var list = filtered(state);
    var n = list.length;
    countEl.textContent = countText(n);

    var actives = activeFilters(state);
    chipsEl.innerHTML = actives.map(function (f) {
      return '<li><button type="button" class="chip is-active chip--removable" data-remove="' + f.key + '" aria-label="Убрать фильтр: ' + K.esc(f.label) + '">' +
        K.esc(f.label) + K.icon('close') + '</button></li>';
    }).join('') + (actives.length > 1 ? '<li><button type="button" class="chip chip--clear" data-reset>Сбросить всё</button></li>' : '');
    chipsEl.hidden = actives.length === 0;

    var filterCount = actives.filter(function (f) { return f.key !== 'q' && f.key !== 'cat' && f.key !== 'fav'; }).length;
    badge.hidden = filterCount === 0;
    badge.textContent = filterCount;

    sortNote.hidden = !(state.sort !== 'popular' && !(!state.free && (state.pmin || state.pmax)));

    var favN = K.favorites.list().filter(P.byId).length;
    favCount.textContent = favN;
    favToggle.setAttribute('aria-pressed', String(state.fav));
    favToggle.querySelector('use').setAttribute('href', K.paths.icons + '#i-' + (state.fav ? 'heart-fill' : 'heart'));

    document.querySelectorAll('.view-toggle [data-view]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === state.view));
    });

    if (n === 0) {
      var favEmpty = state.fav && favN === 0;
      listEl.innerHTML = '<div class="empty-state">' +
        '<img src="' + K.paths.brand + 'logo-cow.png" alt="" width="96">' +
        '<p class="empty-state__title">' + (favEmpty ? 'В избранном пока пусто' : 'Под эти условия мест не нашлось') + '</p>' +
        '<p>' + (favEmpty ? 'Нажми на сердечко в карточке, чтобы сохранить место.' : 'Попробуй убрать часть фильтров или изменить запрос.') + '</p>' +
        '<button type="button" class="btn btn--lime" data-reset>Сбросить фильтры</button></div>';
      listEl.hidden = false;
      mapWrap.hidden = true;
      footerEl.textContent = '';
    } else {
      listEl.hidden = state.view === 'map';
      mapWrap.hidden = state.view !== 'map';
      if (state.view === 'list') {
        listEl.innerHTML = '<div class="place-grid">' + list.map(function (p) { return P.card(p); }).join('') + '</div>';
      } else {
        showMap(list);
      }
      footerEl.textContent = 'Показаны все ' + n + ' ' + K.plural(n, ['место', 'места', 'мест']);
    }

    stateToURL(state);
    if (opts.announce) K.toast(countText(n));
  }

  function apply(next, opts) {
    state = next;
    writeForm(state);
    render(opts);
  }

  /* ---------- события ---------- */
  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var s = clone(state);
    s.q = searchInput.value.trim().slice(0, 80);
    apply(s);
    countEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('cats').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    var s = clone(state);
    s.cat = b.getAttribute('data-cat');
    apply(s);
  });

  // На десктопе фильтры применяются сразу, в мобильной панели — по кнопке.
  function onFormChange() {
    priceRange.hidden = form.elements.free.checked;
    if (isDrawer()) {
      var n = filtered(readForm(state)).length;
      applyBtn.textContent = n ? 'Показать ' + n + ' ' + K.plural(n, ['место', 'места', 'мест']) : 'Ничего не найдено';
    } else {
      apply(readForm(state));
    }
  }
  form.addEventListener('change', onFormChange);
  form.addEventListener('input', function (e) {
    if (e.target.type === 'number') { clearTimeout(form._t); form._t = setTimeout(onFormChange, 400); }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); onFormChange(); });

  sortEl.addEventListener('change', function () {
    var s = clone(state); s.sort = sortEl.value; apply(s);
  });

  favToggle.addEventListener('click', function () {
    var s = clone(state); s.fav = !s.fav; apply(s);
  });

  document.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-remove]');
    if (rm) {
      var key = rm.getAttribute('data-remove');
      apply(removeFilter(clone(state), key));
      var next = chipsEl.querySelector('button') || countEl;
      if (next === countEl) countEl.setAttribute('tabindex', '-1');
      next.focus();
      return;
    }
    if (e.target.closest('[data-reset]')) {
      var keep = clone(DEFAULTS);
      keep.sort = state.sort; keep.view = state.view;
      apply(keep);
      if (isDrawer()) onFormChange();
      K.toast('Фильтры сброшены');
      return;
    }
    var v = e.target.closest('[data-view]');
    if (v) {
      var s = clone(state); s.view = v.getAttribute('data-view'); s.focus = '';
      apply(s);
    }
  });

  document.addEventListener('favorites:change', function () {
    if (state.fav) render(); else {
      var favN = K.favorites.list().filter(P.byId).length;
      favCount.textContent = favN;
    }
  });

  /* ---------- мобильная панель фильтров ---------- */
  function isDrawer() { return mobileMQ.matches; }
  function openDrawer() {
    writeForm(state);
    aside.classList.add('is-open');
    overlay.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    aside.setAttribute('role', 'dialog');
    aside.setAttribute('aria-modal', 'true');
    document.body.classList.add('no-scroll');
    onFormChange();
    aside.querySelector('.filters__close').focus();
  }
  function closeDrawer(applied) {
    if (!aside.classList.contains('is-open')) return;
    if (!applied) writeForm(state); // закрыли без применения — откатываем черновик
    aside.classList.remove('is-open');
    overlay.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    aside.removeAttribute('role');
    aside.removeAttribute('aria-modal');
    document.body.classList.remove('no-scroll');
    openBtn.focus();
  }
  openBtn.addEventListener('click', openDrawer);
  document.querySelectorAll('[data-filters-close]').forEach(function (b) {
    b.addEventListener('click', function () { closeDrawer(false); });
  });
  applyBtn.addEventListener('click', function () {
    apply(readForm(state));
    closeDrawer(true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && aside.classList.contains('is-open')) closeDrawer(false);
  });
  K.trapFocus(aside);
  mobileMQ.addEventListener('change', function () {
    if (!isDrawer()) { closeDrawer(true); apply(readForm(state)); }
  });

  /* ---------- московское время в подсказке ---------- */
  var mskEl = document.querySelector('[data-msk-time]');
  function tick() {
    var now = K.mskNow();
    mskEl.textContent = 'По московскому времени: сейчас ' + P.dayShort[now.day] + ', ' +
      String(Math.floor(now.minutes / 60)).padStart(2, '0') + ':' + String(now.minutes % 60).padStart(2, '0');
  }
  tick();
  setInterval(function () {
    tick();
    if (state.open) render(); // «Открыто сейчас» меняется со временем
  }, 60000);

  /* ---------- карта ---------- */
  var LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  var LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  var leafletPromise = null;
  var map = null, layer = null;
  var mapEl = document.getElementById('map');
  var mapError = document.querySelector('[data-map-error]');

  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise(function (resolve, reject) {
      var link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = LEAFLET_CSS;
      document.head.appendChild(link);
      var s = document.createElement('script');
      s.src = LEAFLET_JS; s.async = true;
      var timer = setTimeout(function () { reject(new Error('timeout')); }, 10000);
      s.onload = function () { clearTimeout(timer); window.L ? resolve(window.L) : reject(new Error('no L')); };
      s.onerror = function () { clearTimeout(timer); reject(new Error('load error')); };
      document.head.appendChild(s);
    });
    leafletPromise.catch(function () { leafletPromise = null; });
    return leafletPromise;
  }

  function popupHTML(p) {
    return '<div class="map-popup">' +
      '<img src="' + K.img(p.photos[0]) + '" alt="" width="220" height="140">' +
      '<p class="map-popup__type">' + K.esc(P.typeLabel(p)) + (p.demo ? ' · пример' : '') + '</p>' +
      '<p class="map-popup__name">' + K.esc(p.name) + '</p>' +
      '<p class="map-popup__meta">' + P.priceShort(p) + (P.priceUnitNote(p) ? ' ' + P.priceUnitNote(p) : '') + ' · м. ' + K.esc(p.metro) + '</p>' +
      '<a class="map-popup__link" href="place.html?id=' + encodeURIComponent(p.id) + '">Подробнее о месте →</a>' +
    '</div>';
  }

  function showMap(list) {
    mapError.hidden = true;
    mapEl.hidden = false;
    loadLeaflet().then(function (L) {
      if (!map) {
        map = L.map(mapEl, { scrollWheelZoom: false }).setView([55.7558, 37.6176], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">участники OpenStreetMap</a>'
        }).addTo(map);
        layer = L.layerGroup().addTo(map);
      }
      layer.clearLayers();
      var icon = L.divIcon({ className: 'map-marker', html: '<span></span>', iconSize: [30, 30], iconAnchor: [15, 28], popupAnchor: [0, -26] });
      var markers = {};
      list.forEach(function (p) {
        var m = L.marker(p.coords, { icon: icon, title: p.name, alt: p.name, keyboard: true })
          .bindPopup(popupHTML(p), { maxWidth: 240 });
        m.addTo(layer);
        markers[p.id] = m;
      });
      setTimeout(function () {
        map.invalidateSize();
        var pts = list.map(function (p) { return p.coords; });
        if (pts.length === 1) map.setView(pts[0], 15);
        else map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
        if (state.focus && markers[state.focus]) {
          map.setView(P.byId(state.focus).coords, 15);
          markers[state.focus].openPopup();
        }
      }, 50);
    }).catch(function () {
      mapEl.hidden = true;
      mapError.hidden = false;
    });
  }

  /* ---------- старт ---------- */
  writeForm(state);
  render();
})();
