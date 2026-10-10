/* Медиа: рубрики, «Выбор редакции», лента с подгрузкой. */
(function () {
  'use strict';
  var K = window.K;
  var A = K.articles;
  var PAGE = 6;   // сколько карточек показываем сначала
  var STEP = 3;   // сколько подгружает «Ещё почитать»

  var featuredEl = document.querySelector('[data-featured]');
  var featuredWrap = document.querySelector('[data-featured-wrap]');
  var feedEl = document.querySelector('[data-feed]');
  var feedTitle = document.querySelector('[data-feed-title]');
  var countEl = document.querySelector('[data-feed-count]');
  var moreBtn = document.querySelector('[data-more]');
  var rubricsEl = document.querySelector('[data-rubrics]');

  var featured = A.all.filter(function (a) { return a.featured; })[0] || A.all[0];
  var rubric = A.rubrics[K.param('rubric')] ? K.param('rubric') : 'all';
  var shown = PAGE;

  function renderFeatured() {
    featuredEl.innerHTML =
      '<article class="featured">' +
        '<div class="featured__media"><img src="' + K.img(featured.cover) + '" alt="' + K.esc(featured.coverAlt) + '" width="756" height="508"></div>' +
        '<div class="featured__body">' +
          '<p class="featured__badge">Выбор редакции</p>' +
          '<svg class="sparks featured__sparks" viewBox="0 0 40 40" aria-hidden="true"><path d="M14 10l6 14M26 12l-4 12M30 26l-8 2" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>' +
          '<h2 class="featured__title">' + K.esc(featured.title) + '</h2>' +
          '<p class="featured__lead">' + K.esc(featured.lead) + '</p>' +
          '<p class="article-card__meta"><span>' + K.esc(A.rubricLabel(featured)) + '</span><span>' + A.minutesLabel(featured) + '</span></p>' +
          '<a class="link-arrow featured__link" href="' + A.url(featured) + '">Читать статью ' + K.icon('arrow-up-right') +
            '<span class="visually-hidden">: ' + K.esc(featured.title) + '</span></a>' +
        '</div>' +
      '</article>';
  }

  function pool() {
    if (rubric === 'all') return A.all.filter(function (a) { return a !== featured; });
    return A.all.filter(function (a) { return a.rubric === rubric; });
  }

  function render(focusFrom) {
    var items = pool();
    featuredWrap.hidden = rubric !== 'all';
    feedTitle.textContent = rubric === 'all' ? 'Свежие материалы' : A.rubrics[rubric];
    var visible = items.slice(0, shown);
    feedEl.innerHTML = visible.length
      ? visible.map(function (a) { return A.card(a); }).join('')
      : '<p class="empty-state">В этой рубрике пока нет материалов.</p>';
    moreBtn.parentElement.hidden = shown >= items.length;
    countEl.textContent = 'Показано ' + visible.length + ' из ' + items.length + ' ' + K.plural(items.length, ['материала', 'материалов', 'материалов']);
    rubricsEl.querySelectorAll('[data-rubric]').forEach(function (b) {
      var on = b.getAttribute('data-rubric') === rubric;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('is-active', on);
    });
    if (typeof focusFrom === 'number') {
      var link = feedEl.querySelectorAll('.article-card__link')[focusFrom];
      if (link) link.focus();
    }
  }

  rubricsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rubric]');
    if (!b) return;
    rubric = b.getAttribute('data-rubric');
    shown = PAGE;
    var url = new URL(location.href);
    if (rubric === 'all') url.searchParams.delete('rubric'); else url.searchParams.set('rubric', rubric);
    history.replaceState(null, '', url.pathname + url.search);
    render();
  });

  moreBtn.addEventListener('click', function () {
    var before = shown;
    shown += STEP;
    render(before); // фокус на первую новую карточку
  });

  renderFeatured();
  render();
})();
