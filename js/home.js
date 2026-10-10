/* Главная: название подборки бесплатных мест и строки статей. */
(function () {
  'use strict';
  var K = window.K;

  // «Топ N бесплатных мест» — N не больше реального количества в данных
  var freeCount = K.places.all.filter(K.places.isFree).length;
  var freeTitle = document.querySelector('[data-free-title]');
  if (freeTitle) {
    var n = Math.min(10, freeCount);
    freeTitle.textContent = n > 1
      ? 'Топ ' + n + ' ' + K.plural(n, ['бесплатного места', 'бесплатных мест', 'бесплатных мест'])
      : 'Бесплатные места';
  }

  // Три материала, как на макете
  var HOME_ARTICLES = ['odin-kofe', 'na-chuzhom-lugu', 'pochemu-doma-ne-rabotaetsya'];
  var list = document.querySelector('[data-home-reads]');
  if (list) {
    list.innerHTML = HOME_ARTICLES.map(K.articles.byId).filter(Boolean).map(function (a, i) {
      return '<li class="read-row">' +
        '<span class="read-row__num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<h3 class="read-row__title"><a class="read-row__link" href="' + K.articles.url(a) + '">' + K.esc(a.title) + '</a></h3>' +
        '<p class="read-row__meta"><span>' + K.esc(K.articles.rubricLabel(a)) + '</span><span>' + K.articles.minutesLabel(a) + '</span></p>' +
        '<span class="read-row__media"><img src="' + K.img(a.cover) + '" alt="" loading="lazy" width="417" height="320"></span>' +
        '<span class="read-row__arrow" aria-hidden="true">' + K.icon('arrow-right') + '</span>' +
      '</li>';
    }).join('');
  }
})();
