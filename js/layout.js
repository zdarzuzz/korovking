/* ==========================================================================
   Коровкинг — общий каркас: шапка, мобильное меню, футер,
   модальные формы «Предложить место» / «Предложить материал».
   Страница указывает раздел в <body data-page="home|places|media|about|...">
   и места для вставки: <div data-site-header></div>, <div data-site-footer></div>.
   ========================================================================== */
(function () {
  'use strict';
  var K = window.K;

  var NAV = [
    { id: 'home', href: 'index.html', label: 'Главная' },
    { id: 'places', href: 'places.html', label: 'Места' },
    { id: 'media', href: 'media.html', label: 'Медиа' },
    { id: 'about', href: 'about.html', label: 'О нас' }
  ];
  // дочерние страницы подсвечивают свой раздел
  var SECTION_OF = { place: 'places', article: 'media' };

  function renderHeader() {
    var slot = document.querySelector('[data-site-header]');
    if (!slot) return;
    var page = document.body.getAttribute('data-page');
    var active = SECTION_OF[page] || page;
    var links = NAV.map(function (n) {
      var current = n.id === active ? ' aria-current="page"' : '';
      return '<li><a class="site-nav__link" href="' + n.href + '"' + current + '>' + n.label + '</a></li>';
    }).join('');
    var city = '<p class="city">' + K.icon('pin') + '<span><span class="visually-hidden">Город: </span>Москва</span></p>';

    slot.outerHTML =
      '<a class="skip-link" href="#main">Перейти к содержанию</a>' +
      '<header class="site-header">' +
        '<div class="container site-header__inner">' +
          '<a class="logo" href="index.html" aria-label="Коровкинг — на главную">' +
            '<img src="' + K.paths.brand + 'logo-cow.png" alt="" width="50" height="40">' +
            '<span class="logo__word" aria-hidden="true">Коровкинг</span>' +
          '</a>' +
          '<nav class="site-nav" id="site-nav" aria-label="Основное меню">' +
            '<ul class="site-nav__list" role="list">' + links + '</ul>' + city +
          '</nav>' +
          city +
          '<button class="burger" type="button" aria-controls="site-nav" aria-expanded="false" aria-label="Открыть меню">' + K.icon('menu') + '</button>' +
        '</div>' +
      '</header>';

    var burger = document.querySelector('.burger');
    var nav = document.getElementById('site-nav');
    function setOpen(open, focusBack) {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      burger.querySelector('use').setAttribute('href', K.paths.icons + '#i-' + (open ? 'close' : 'menu'));
      if (!open && focusBack) burger.focus();
    }
    burger.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false, true);
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !e.target.closest('.site-header')) setOpen(false);
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
  }

  function renderFooter() {
    var slot = document.querySelector('[data-site-footer]');
    if (!slot) return;
    slot.outerHTML =
      '<footer class="site-footer">' +
        '<div class="container">' +
          '<div class="site-footer__top">' +
            '<a class="site-footer__brand" href="index.html" aria-label="Коровкинг — на главную">' +
              '<img src="' + K.paths.brand + 'logo-cow.png" alt="" width="46" height="36"><span aria-hidden="true">КОРОВКИНГ</span></a>' +
            '<ul class="site-footer__nav" role="list">' +
              '<li><a href="about.html">О нас</a></li>' +
              '<li><a href="faq.html">Частые вопросы</a></li>' +
              '<li><button type="button" data-open-form="place">Предложить место</button></li>' +
              '<li><button type="button" data-open-form="material">Предложить материал</button></li>' +
            '</ul>' +
          '</div>' +
          '<div class="site-footer__note">' +
            '<span>© ' + new Date().getFullYear() + ' Коровкинг — студенческое медиа о местах Москвы.</span>' +
            '<span>Места в каталоге — демонстрационные примеры. Условия уточняйте на сайте места.</span>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  /* ======================================================================
     Формы. Сервера пока нет, поэтому работает «честный режим»:
     заявка сохраняется черновиком в localStorage и её можно скачать .txt.
     ====================================================================== */

  /*
   * МЕСТО ДЛЯ ПОДКЛЮЧЕНИЯ ОБРАБОТЧИКА ФОРМ.
   * Когда появится сервер или сервис форм (например, собственный API,
   * Formspree, Getform), укажите адрес в FORM_ENDPOINT. Тогда форма
   * отправит JSON методом POST и покажет «Отправлено» только после
   * успешного ответа сервера. Пока значение null — отправки нет.
   */
  var FORM_ENDPOINT = null;

  function sendToServer(payload) {
    return fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return true;
    });
  }

  var CONTACT_HINT = 'E-mail, ник в Telegram (@name) или телефон';
  function validContact(v) {
    v = v.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ||   // e-mail
      /^@[A-Za-z0-9_]{4,32}$/.test(v) ||                 // Telegram
      /^\+?[\d\s()\-]{10,18}$/.test(v);                  // телефон
  }

  var FORMS = {
    place: {
      title: 'Предложить место',
      intro: 'Расскажи о месте, где удобно учиться, работать или встречаться с командой.',
      fields: [
        { name: 'name', label: 'Название места', type: 'text', required: true, min: 2, autocomplete: 'off' },
        { name: 'where', label: 'Адрес или ссылка', type: 'text', required: true, min: 5, hint: 'Например: улица и дом, станция метро или ссылка на сайт места' },
        { name: 'comment', label: 'Комментарий', type: 'textarea', required: true, min: 10, hint: 'Чем место хорошо: розетки, тишина, цены, атмосфера' },
        { name: 'contact', label: 'Контакт для связи', type: 'text', required: true, contact: true, hint: CONTACT_HINT, autocomplete: 'email' }
      ]
    },
    material: {
      title: 'Предложить материал',
      intro: 'Есть история о местах, людях или своём способе справляться с делами? Поделись идеей.',
      fields: [
        { name: 'author', label: 'Как тебя зовут', type: 'text', required: true, min: 2, autocomplete: 'name' },
        { name: 'topic', label: 'Тема', type: 'text', required: true, min: 3 },
        { name: 'summary', label: 'Кратко о чём материал', type: 'textarea', required: true, min: 20, hint: 'Несколько предложений: о чём история и почему она важна' },
        { name: 'contact', label: 'Контакт для связи', type: 'text', required: true, contact: true, hint: CONTACT_HINT, autocomplete: 'email' }
      ]
    }
  };

  var DRAFTS_KEY = 'korovking:drafts';
  var dialogs = {};
  var lastOpener = null;

  function fieldHTML(kind, f) {
    var id = 'f-' + kind + '-' + f.name;
    var describedBy = (f.hint ? id + '-hint ' : '') + id + '-error';
    var common = 'id="' + id + '" name="' + f.name + '" aria-describedby="' + describedBy + '"' +
      (f.required ? ' required aria-required="true"' : '') + (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : '');
    var control = f.type === 'textarea'
      ? '<textarea class="textarea" ' + common + ' rows="4"></textarea>'
      : '<input class="input" type="text" ' + common + '>';
    return '<div class="field">' +
      '<label class="field__label" for="' + id + '">' + f.label + (f.required ? ' <span aria-hidden="true">*</span>' : '') + '</label>' +
      (f.hint ? '<span class="field__hint" id="' + id + '-hint">' + f.hint + '</span>' : '') +
      control +
      '<span class="field__error" id="' + id + '-error" aria-live="polite"></span>' +
    '</div>';
  }

  function buildDialog(kind) {
    var cfg = FORMS[kind];
    var d = document.createElement('dialog');
    d.className = 'dialog';
    d.setAttribute('aria-labelledby', 'dlg-' + kind + '-title');
    d.innerHTML =
      '<div class="dialog__head">' +
        '<h2 class="dialog__title" id="dlg-' + kind + '-title">' + cfg.title + '</h2>' +
        '<button type="button" class="dialog__close" data-close aria-label="Закрыть окно">' + K.icon('close') + '</button>' +
      '</div>' +
      '<div class="dialog__body">' +
        '<form class="dialog__form" novalidate>' +
          '<div style="display:grid;gap:16px">' +
            '<p>' + cfg.intro + '</p>' +
            '<p class="dialog__note">' + K.icon('info') + '<span>Отправка заявок пока не подключена: у сайта нет сервера. Заявка сохранится черновиком только на этом устройстве, и её можно будет скачать текстовым файлом.</span></p>' +
            cfg.fields.map(function (f) { return fieldHTML(kind, f); }).join('') +
            '<p class="form-summary" role="alert" hidden></p>' +
            '<div class="dialog__actions">' +
              '<button type="submit" class="btn btn--dark">Сохранить черновик</button>' +
              '<button type="button" class="btn" data-close>Отмена</button>' +
            '</div>' +
          '</div>' +
        '</form>' +
        '<div class="dialog__success" hidden>' +
          '<p class="dialog__success-title" tabindex="-1">' + K.icon('check') + '<span data-success-title>Черновик сохранён на этом устройстве</span></p>' +
          '<p data-success-text>Мы пока не получаем заявки онлайн. Черновик хранится в этом браузере — скачай его, чтобы не потерять.</p>' +
          '<div class="dialog__actions">' +
            '<button type="button" class="btn btn--lime" data-download>' + K.icon('download') + 'Скачать .txt</button>' +
            '<button type="button" class="btn" data-new>Заполнить ещё</button>' +
            '<button type="button" class="btn" data-close>Закрыть</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(d);

    var form = d.querySelector('form');
    var success = d.querySelector('.dialog__success');
    var summary = d.querySelector('.form-summary');
    var lastDraft = null;

    function setError(f, msg) {
      var input = form.elements[f.name];
      var err = d.querySelector('#f-' + kind + '-' + f.name + '-error');
      err.textContent = msg || '';
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
    function check(f) {
      var v = (form.elements[f.name].value || '').trim();
      if (f.required && !v) return 'Заполни это поле';
      if (f.min && v.length < f.min) return 'Слишком коротко — минимум ' + f.min + ' ' + K.plural(f.min, ['символ', 'символа', 'символов']);
      if (f.contact && !validContact(v)) return 'Укажи e-mail, ник в Telegram в формате @name или телефон';
      return '';
    }
    cfg.fields.forEach(function (f) {
      form.elements[f.name].addEventListener('blur', function () {
        if (form.elements[f.name].value) setError(f, check(f));
      });
      form.elements[f.name].addEventListener('input', function () {
        if (form.elements[f.name].getAttribute('aria-invalid')) setError(f, check(f));
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null, values = {};
      cfg.fields.forEach(function (f) {
        var msg = check(f);
        setError(f, msg);
        if (msg && !firstBad) firstBad = form.elements[f.name];
        values[f.name] = form.elements[f.name].value.trim();
      });
      if (firstBad) {
        summary.hidden = false;
        summary.textContent = 'Проверь отмеченные поля.';
        firstBad.focus();
        return;
      }
      summary.hidden = true;
      var draft = { id: Date.now().toString(36), kind: kind, createdAt: new Date().toISOString(), page: location.pathname, fields: values };

      if (FORM_ENDPOINT) {
        sendToServer(draft).then(function () {
          showSuccess(draft, true);
        }).catch(function () {
          saveDraft(draft);
          showSuccess(draft, false, 'Отправить не получилось. Мы сохранили черновик на этом устройстве.');
        });
      } else {
        saveDraft(draft);
        showSuccess(draft, false);
      }
    });

    function saveDraft(draft) {
      var list = K.store.get(DRAFTS_KEY, []);
      if (!Array.isArray(list)) list = [];
      list.push(draft);
      if (!K.store.set(DRAFTS_KEY, list)) {
        K.toast('Браузер не разрешил сохранить черновик. Скачайте его файлом.', 'error');
      }
    }
    function showSuccess(draft, sent, note) {
      lastDraft = draft;
      form.hidden = true;
      success.hidden = false;
      d.querySelector('[data-success-title]').textContent = sent ? 'Отправлено' : 'Черновик сохранён на этом устройстве';
      if (note) d.querySelector('[data-success-text]').textContent = note;
      d.querySelector('.dialog__success-title').focus();
    }
    function draftText(draft) {
      var lines = ['Коровкинг — ' + cfg.title.toLowerCase(), 'Черновик от ' + new Date(draft.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) + ' (МСК)', ''];
      cfg.fields.forEach(function (f) { lines.push(f.label + ': ' + draft.fields[f.name]); });
      return lines.join('\n');
    }
    d.addEventListener('click', function (e) {
      if (e.target === d) { d.close(); return; } // клик по подложке
      if (e.target.closest('[data-close]')) d.close();
      if (e.target.closest('[data-download]') && lastDraft) {
        K.downloadText('korovking-' + kind + '-' + lastDraft.id + '.txt', draftText(lastDraft));
      }
      if (e.target.closest('[data-new]')) resetForm(true);
    });
    function resetForm(focus) {
      form.reset();
      cfg.fields.forEach(function (f) { setError(f, ''); });
      summary.hidden = true;
      form.hidden = false;
      success.hidden = true;
      if (focus) form.elements[cfg.fields[0].name].focus();
    }
    K.trapFocus(d);
    d.addEventListener('close', function () {
      if (!success.hidden) resetForm(false);
      if (lastOpener && document.contains(lastOpener)) lastOpener.focus();
    });
    d._reset = resetForm;
    return d;
  }

  K.openForm = function (kind, opener) {
    if (!FORMS[kind]) return;
    lastOpener = opener || document.activeElement;
    var d = dialogs[kind] || (dialogs[kind] = buildDialog(kind));
    if (typeof d.showModal === 'function') {
      d.showModal();
    } else {
      d.setAttribute('open', '');
    }
    var first = d.querySelector('form:not([hidden]) input, form:not([hidden]) textarea');
    if (first) first.focus();
  };

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open-form]');
    if (opener) {
      e.preventDefault();
      K.openForm(opener.getAttribute('data-open-form'), opener);
    }
  });

  renderHeader();
  renderFooter();
})();
