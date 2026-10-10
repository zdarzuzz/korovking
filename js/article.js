/* Страница статьи: article.html?id=... */
(function () {
  'use strict';
  var K = window.K;
  var A = K.articles;
  var root = document.querySelector('[data-article-root]');
  var a = A.byId(K.param('id'));

  if (!a) {
    document.title = 'Материал не найден — Коровкинг';
    root.innerHTML =
      '<div class="container not-found">' +
        '<img src="' + K.paths.brand + 'logo-cow.png" alt="" width="140">' +
        '<h1 class="h1">Материал не найден</h1>' +
        '<p class="lead">Возможно, ссылка устарела. Все статьи собраны в разделе «Медиа».</p>' +
        '<a class="btn btn--lime" href="media.html">Перейти в «Медиа»</a>' +
      '</div>';
    return;
  }

  document.title = a.title + ' — Коровкинг';
  var meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', a.lead);

  function block(b) {
    if (b.t === 'h2') return '<h2>' + K.esc(b.x) + '</h2>';
    if (b.t === 'ul' || b.t === 'ol') {
      return '<' + b.t + '>' + b.items.map(function (i) { return '<li>' + K.esc(i) + '</li>'; }).join('') + '</' + b.t + '>';
    }
    return '<p>' + K.esc(b.x) + '</p>';
  }

  var date = new Date(a.date + 'T12:00:00+03:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' });

  var related = A.all.filter(function (x) { return x.id !== a.id; })
    .sort(function (x, y) { return (y.rubric === a.rubric) - (x.rubric === a.rubric) || (x.date < y.date ? 1 : -1); })
    .slice(0, 3);

  root.innerHTML =
    '<article class="article">' +
      '<div class="container article__container">' +
        '<nav class="breadcrumbs" aria-label="Хлебные крошки"><ol>' +
          '<li><a href="index.html">Главная</a></li><li><a href="media.html">Медиа</a></li>' +
          '<li><a href="media.html?rubric=' + a.rubric + '">' + K.esc(A.rubricLabel(a)) + '</a></li>' +
          '<li aria-current="page">' + K.esc(a.title) + '</li></ol></nav>' +
        '<header class="article__head">' +
          '<p class="article__rubric"><a class="chip is-active" href="media.html?rubric=' + a.rubric + '">' + K.esc(A.rubricLabel(a)) + '</a></p>' +
          '<h1 class="h1 article__title">' + K.esc(a.title) + '</h1>' +
          '<p class="lead article__lead">' + K.esc(a.lead) + '</p>' +
          '<div class="article__meta">' +
            '<span>' + K.icon('clock') + A.minutesLabel(a) + ' чтения</span>' +
            '<span><time datetime="' + a.date + '">' + date + '</time></span>' +
            '<button type="button" class="btn btn--sm" data-share>' + K.icon('share') + 'Поделиться</button>' +
          '</div>' +
        '</header>' +
      '</div>' +
      '<figure class="container article__cover"><img src="' + K.img(a.cover) + '" alt="' + K.esc(a.coverAlt) + '" width="756" height="508"></figure>' +
      '<div class="container article__container">' +
        '<div class="prose">' + a.body.map(block).join('') + '</div>' +
        '<footer class="article__foot">' +
          '<a class="link-arrow link-arrow--plain" href="media.html">' + K.icon('arrow-left') + 'Вернуться в «Медиа»</a>' +
          '<button type="button" class="btn btn--sm" data-share>' + K.icon('share') + 'Поделиться</button>' +
        '</footer>' +
      '</div>' +
    '</article>' +
    '<section class="container section related" aria-labelledby="related-h">' +
      '<div class="section__head"><h2 class="h2" id="related-h">Похожие материалы</h2>' +
      '<a class="link-arrow link-arrow--plain" href="media.html">Все статьи ' + K.icon('arrow-right') + '</a></div>' +
      '<div class="article-grid">' + related.map(function (r) { return A.card(r); }).join('') + '</div>' +
    '</section>';

  root.querySelectorAll('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () { K.share({ title: a.title + ' — Коровкинг', text: a.lead, url: location.href }); });
  });
})();
