/* Страница места: place.html?id=... */
(function () {
  'use strict';
  var K = window.K;
  var P = K.places;
  var root = document.querySelector('[data-place-root]');
  var id = K.param('id');
  var place = id ? P.byId(id) : null;

  if (!place) {
    document.title = 'Место не найдено — Коровкинг';
    root.innerHTML =
      '<div class="container not-found">' +
        '<img src="' + K.paths.brand + 'logo-cow.png" alt="" width="140">' +
        '<h1 class="h1">Место не найдено</h1>' +
        '<p class="lead">Возможно, ссылка устарела или в ней опечатка. Загляни в каталог — там есть из чего выбрать.</p>' +
        '<a class="btn btn--lime" href="places.html">Перейти в каталог</a>' +
      '</div>';
    return;
  }

  document.title = place.name + ' — ' + P.typeLabel(place) + ' — Коровкинг';
  var meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', place.description);

  var status = P.status(place);
  var today = K.mskNow().day;
  var osm = 'https://www.openstreetmap.org/?mlat=' + place.coords[0] + '&mlon=' + place.coords[1] + '#map=17/' + place.coords[0] + '/' + place.coords[1];

  var gallery = place.photos.map(function (src, i) {
    return '<li><button type="button" class="gallery__thumb" data-index="' + i + '" aria-label="Фото ' + (i + 1) + ' из ' + place.photos.length + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' +
      '<img src="' + K.img(src) + '" alt="" width="160" height="120" loading="lazy"></button></li>';
  }).join('');

  var amenities = Object.keys(P.amenityLabels).map(function (k) {
    var yes = place.amenities[k];
    return '<li class="amenity' + (yes ? '' : ' amenity--no') + '">' + K.icon(yes ? 'check' : 'minus') +
      '<span>' + P.amenityLabels[k] + '<span class="visually-hidden">: ' + (yes ? 'есть' : 'нет') + '</span></span></li>';
  }).join('');

  var schedule = place.hours.map(function (day, i) {
    return '<tr' + (i === today ? ' class="is-today"' : '') + '><th scope="row">' + P.dayNames[i] + (i === today ? ' <span class="today-mark">сегодня</span>' : '') + '</th><td>' + P.dayHoursText(day) + '</td></tr>';
  }).join('');

  var discounts = [];
  if (place.discounts.student) discounts.push('<li><strong>По студенческому.</strong> ' + K.esc(place.discounts.student) + '</li>');
  if (place.discounts.age) discounts.push('<li><strong>По возрасту.</strong> ' + K.esc(place.discounts.age) + '</li>');
  var rules = (place.rules || []).map(function (r) { return '<li>' + K.esc(r) + '</li>'; }).join('');

  var website = place.website
    ? '<a class="btn btn--lime btn--block" href="' + K.esc(place.website) + '" target="_blank" rel="noopener noreferrer">Перейти на сайт места ' + K.icon('arrow-up-right') + '<span class="visually-hidden">(откроется в новой вкладке)</span></a>' +
      '<p class="field__hint">Бронирование и оплата — на официальном сайте места. Коровкинг только помогает выбрать.</p>'
    : '<p class="site-missing">' + K.icon('info') + '<span>Это демонстрационное место, поэтому ссылки на официальный сайт нет. У настоящих мест здесь будет кнопка «Перейти на сайт места» — бронирование и оплата проходят там, мы только помогаем выбрать.</span></p>';

  // похожие места: та же группа, больше общих удобств, тот же тип выше
  var similar = P.all.filter(function (p) { return p.id !== place.id; }).map(function (p) {
    var score = 0;
    if (P.group(p) === P.group(place)) score += 3;
    if (p.type === place.type) score += 2;
    if (p.district === place.district) score += 1;
    Object.keys(P.amenityLabels).forEach(function (k) { if (p.amenities[k] && place.amenities[k]) score += 1; });
    return { p: p, score: score };
  }).sort(function (a, b) { return b.score - a.score || b.p.popularity - a.p.popularity; })
    .slice(0, 3).map(function (x) { return P.card(x.p); }).join('');

  root.innerHTML =
    '<div class="container place">' +
      '<nav class="breadcrumbs" aria-label="Хлебные крошки"><ol>' +
        '<li><a href="index.html">Главная</a></li>' +
        '<li><a href="places.html">Места</a></li>' +
        '<li><a href="places.html?cat=' + P.group(place) + '">' + P.groupLabels[P.group(place)] + '</a></li>' +
        '<li aria-current="page">' + K.esc(place.name) + '</li>' +
      '</ol></nav>' +

      '<header class="place__head">' +
        '<p class="place__type"><span class="eyebrow">' + K.esc(P.typeLabel(place)) + '</span>' +
          (place.demo ? '<span class="badge-demo">Демо-пример</span>' : '') + '</p>' +
        '<h1 class="h1 place__title">' + K.esc(place.name) + '</h1>' +
        '<p class="place__sub">' +
          '<span class="status ' + (status.open ? 'status--open' : 'status--closed') + '">' + status.text + '</span>' +
          '<span class="place-card__metro">' + K.icon('metro') + K.esc(place.metro) + ' — ' + place.walk + ' мин пешком</span>' +
        '</p>' +
        '<div class="place__actions">' +
          '<button type="button" class="btn btn--sm fav-inline" data-fav="' + K.esc(place.id) + '" aria-pressed="' + K.favorites.has(place.id) + '">' +
            K.icon(K.favorites.has(place.id) ? 'heart-fill' : 'heart') + '<span data-fav-label>' + (K.favorites.has(place.id) ? 'В избранном' : 'В избранное') + '</span></button>' +
          '<button type="button" class="btn btn--sm" data-share>' + K.icon('share') + 'Поделиться</button>' +
        '</div>' +
      '</header>' +

      '<div class="place__grid">' +
        '<div class="place__main">' +
          '<section class="gallery" aria-label="Фотографии">' +
            '<div class="gallery__main"><img data-gallery-main src="' + K.img(place.photos[0]) + '" alt="' + K.esc(place.alt) + '" width="760" height="560"></div>' +
            (place.photos.length > 1 ? '<ul class="gallery__thumbs" role="list">' + gallery + '</ul>' : '') +
            '<p class="gallery__note">Фото — визуальный пример, не снимок конкретного места.</p>' +
          '</section>' +

          '<section class="place__section" aria-labelledby="about-h"><h2 class="h3" id="about-h">О месте</h2><p class="lead">' + K.esc(place.description) + '</p></section>' +

          '<section class="place__section" aria-labelledby="amen-h"><h2 class="h3" id="amen-h">Удобства</h2><ul class="amenities" role="list">' + amenities + '</ul></section>' +

          '<section class="place__section" aria-labelledby="price-h"><h2 class="h3" id="price-h">Стоимость и условия</h2>' +
            '<p class="price-big">' + P.priceLong(place) + '</p>' +
            '<p>' + K.esc(place.priceNote) + '</p>' +
            (discounts.length ? '<h3 class="place__minor">Скидки</h3><ul class="plain-list">' + discounts.join('') + '</ul>' : '') +
            (rules ? '<h3 class="place__minor">Правила посещения</h3><ul class="plain-list">' + rules + '</ul>' : '') +
          '</section>' +

          '<section class="place__section" aria-labelledby="hours-h"><h2 class="h3" id="hours-h">Расписание</h2>' +
            '<table class="schedule"><caption class="visually-hidden">Часы работы по дням недели, московское время</caption><tbody>' + schedule + '</tbody></table>' +
            '<p class="field__hint">Время московское. Перед визитом проверь часы на сайте места: они могут меняться в праздники.</p>' +
          '</section>' +
        '</div>' +

        '<aside class="place__aside" aria-label="Коротко о месте">' +
          '<div class="info-card">' +
            '<dl class="info-list">' +
              '<div><dt>Стоимость</dt><dd>' + P.priceShort(place) + (P.priceUnitNote(place) ? ' <span class="muted">' + P.priceUnitNote(place) + '</span>' : '') + '</dd></div>' +
              '<div><dt>Адрес</dt><dd>' + (place.address ? K.esc(place.address) : '<span class="muted">Не указан — демонстрационная карточка</span>') + '</dd></div>' +
              '<div><dt>Метро</dt><dd>' + K.esc(place.metro) + ', ' + place.walk + ' мин пешком</dd></div>' +
              '<div><dt>Район</dt><dd>' + K.esc(place.district) + '</dd></div>' +
              '<div><dt>Сегодня</dt><dd>' + P.dayHoursText(place.hours[today]) + '</dd></div>' +
            '</dl>' +
            '<div class="info-card__links">' +
              '<a class="link-arrow" href="places.html?view=map&amp;focus=' + encodeURIComponent(place.id) + '">' + K.icon('pin') + 'На карте каталога</a>' +
              '<a class="link-arrow" href="' + osm + '" target="_blank" rel="noopener noreferrer">' + K.icon('arrow-up-right') + 'Открыть в OpenStreetMap<span class="visually-hidden"> (в новой вкладке)</span></a>' +
            '</div>' +
            website +
          '</div>' +
        '</aside>' +
      '</div>' +

      '<section class="section similar" aria-labelledby="similar-h">' +
        '<div class="section__head"><h2 class="h2" id="similar-h">Похожие места</h2>' +
        '<a class="link-arrow link-arrow--plain" href="places.html">Все места ' + K.icon('arrow-right') + '</a></div>' +
        '<div class="place-grid place-grid--3">' + similar + '</div>' +
      '</section>' +
    '</div>';

  /* галерея */
  var main = root.querySelector('[data-gallery-main]');
  var thumbs = root.querySelectorAll('.gallery__thumb');
  function show(i) {
    main.src = K.img(place.photos[i]);
    main.alt = i === 0 ? place.alt : 'Дополнительное фото: ' + place.alt.charAt(0).toLowerCase() + place.alt.slice(1);
    delete main.dataset.fallbackApplied;
    thumbs.forEach(function (t, j) {
      if (j === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
  }
  thumbs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + thumbs.length) % thumbs.length;
        thumbs[n].focus(); show(n);
      }
    });
  });

  root.querySelector('[data-share]').addEventListener('click', function () {
    K.share({ title: place.name + ' — Коровкинг', text: place.description, url: location.href });
  });
})();
