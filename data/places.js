/*
 * Единый набор данных «Коровкинга»: каталог, карта, подборки, избранное и квиз
 * читают только этот файл.
 *
 * ВАЖНО: все места ниже — ДЕМОНСТРАЦИОННЫЕ ПРИМЕРЫ (demo: true).
 * Названия, цены, расписания и условия придуманы для проверки интерфейса
 * и не описывают реальные заведения. Поэтому у них нет адресов и
 * официальных ссылок (website: null). Координаты — приблизительные точки
 * у станций метро, только чтобы показать маркеры на карте.
 *
 * Как добавить настоящее место — см. README.md, раздел «Данные мест».
 *
 * Формат расписания: hours[0] — понедельник … hours[6] — воскресенье.
 * Каждый день — массив интервалов ["ЧЧ:ММ", "ЧЧ:ММ"]. Пустой массив — выходной.
 * Если время закрытия меньше времени открытия, интервал переходит через полночь
 * (например ["12:00", "02:00"]). Круглосуточно — ["00:00", "24:00"].
 *
 * Стоимость: price.kind —
 *   "free"   — бесплатно (amount: 0)
 *   "hour"   — почасовая оплата, ₽/час (коворкинги, антикафе)
 *   "check"  — средний чек, ₽ (кафе, кофейни, столовые)
 *   "ticket" — вход/билет, ₽ (культурные пространства)
 */
window.KOROVKING_DATA = window.KOROVKING_DATA || {};

(function () {
  function days(weekday, sat, sun) {
    return [weekday, weekday, weekday, weekday, weekday, sat, sun];
  }
  var ALL = [["00:00", "24:00"]];

  window.KOROVKING_DATA.places = [
    {
      id: 'tihaya-komnata',
      name: 'Тихая комната',
      type: 'coworking',
      demo: true,
      district: 'Басманный',
      metro: 'Китай-город',
      walk: 5,
      coords: [55.7569, 37.6349],
      price: { kind: 'hour', amount: 400 },
      priceNote: 'Пример условий: оплата по факту, минимум один час.',
      discounts: { student: 'Пример: −20% по студенческому билету в будни до 14:00' },
      amenities: { wifi: true, sockets: true, quiet: true, team: false, calls: false },
      hours: days([["09:00", "22:00"]], [["10:00", "20:00"]], [["10:00", "20:00"]]),
      popularity: 96,
      photos: ['place-quiet-room.jpg', 'about-checklist.jpg'],
      alt: 'Светлый зал с длинными деревянными столами, ноутбуками и растениями у окон',
      description: 'Зал для сосредоточенной работы в одиночку: длинные столы, розетки у каждого места и договорённость не разговаривать в общей зоне. Хорошо подходит для курсовой, отчёта или конспектов, когда дома всё отвлекает.',
      rules: ['Разговоры и созвоны — только в коридоре', 'Свои напитки — в закрытой кружке']
    },
    {
      id: 'chitalny-zal',
      name: 'Читальный зал',
      type: 'library',
      demo: true,
      district: 'Гагаринский',
      metro: 'Университет',
      walk: 3,
      coords: [55.6931, 37.5372],
      price: { kind: 'free', amount: 0 },
      priceNote: 'Пример условий: вход свободный, нужен читательский билет.',
      discounts: {},
      amenities: { wifi: true, sockets: true, quiet: true, team: false, calls: false },
      hours: [[], [["10:00", "22:00"]], [["10:00", "22:00"]], [["10:00", "22:00"]], [["10:00", "22:00"]], [["10:00", "22:00"]], [["10:00", "18:00"]]],
      popularity: 91,
      photos: ['place-reading-hall.jpg', 'pick-free.jpg'],
      alt: 'Читальный зал с высокими книжными стеллажами, лампами и длинными столами',
      description: 'Большой читальный зал с высокими стеллажами и настольными лампами. Тишина здесь — общее правило, поэтому время до сессии проходит продуктивно. В понедельник зал закрыт.',
      rules: ['Читательский билет — при первом визите', 'Еда — только в буфете на первом этаже']
    },
    {
      id: 'kofe-i-plany',
      name: 'Кофе и планы',
      type: 'cafe',
      demo: true,
      district: 'Замоскворечье',
      metro: 'Третьяковская',
      walk: 4,
      coords: [55.7413, 37.6283],
      price: { kind: 'check', amount: 350 },
      priceNote: 'Средний чек: напиток и выпечка. Отдельной платы за время нет.',
      discounts: { student: 'Пример: второй напиток за полцены по студенческому' },
      amenities: { wifi: true, sockets: true, quiet: false, team: true, calls: false },
      hours: days([["08:00", "23:00"]], [["09:00", "23:00"]], [["09:00", "23:00"]]),
      popularity: 88,
      photos: ['place-coffee-plans.jpg', 'article-coffee.jpg'],
      alt: 'Кафе с деревянной стойкой, меловой доской меню, растениями и круглыми столиками',
      description: 'Кафе с большими столами у окна, куда удобно прийти вдвоём или втроём обсудить проект. Днём бывает шумно, поэтому для созвонов лучше выбрать другое место.',
      rules: ['В часы обеда (13:00–15:00) просят не занимать большие столы в одиночку']
    },
    {
      id: 'obshchee-mesto',
      name: 'Общее место',
      type: 'coworking',
      demo: true,
      district: 'Басманный',
      metro: 'Бауманская',
      walk: 6,
      coords: [55.7716, 37.6815],
      price: { kind: 'hour', amount: 300 },
      priceNote: 'Пример условий: почасово или абонемент на день.',
      discounts: { student: 'Пример: дневной тариф для студентов дешевле на 25%' },
      amenities: { wifi: true, sockets: true, quiet: false, team: true, calls: true },
      hours: [ALL, ALL, ALL, ALL, ALL, ALL, ALL],
      popularity: 84,
      photos: ['place-common-space.jpg', 'article-meadow.jpg'],
      alt: 'Просторный коворкинг с длинными столами, лампами и надписью на стене про большие идеи',
      description: 'Круглосуточный коворкинг с общей зоной для команд и парой переговорных кабин для созвонов. Подходит для хакатонов и длинных рабочих сессий.',
      rules: ['Переговорные кабины — по записи у администратора', 'Ночью вход по коду']
    },
    {
      id: 'svetly-zal',
      name: 'Светлый зал',
      type: 'library',
      demo: true,
      district: 'Тверской',
      metro: 'Белорусская',
      walk: 7,
      coords: [55.7770, 37.5852],
      price: { kind: 'free', amount: 0 },
      priceNote: 'Пример условий: бесплатно, комнаты для групп — по записи.',
      discounts: {},
      amenities: { wifi: true, sockets: true, quiet: true, team: true, calls: false },
      hours: days([["10:00", "22:00"]], [["10:00", "22:00"]], []),
      popularity: 79,
      photos: ['about-hero.jpg', 'pick-free.jpg'],
      alt: 'Трое студентов с ноутбуком за столом в библиотеке на фоне книжных полок',
      description: 'Библиотека с тихим залом и отдельными комнатами для групповой работы — можно готовиться к семинару вместе и не мешать остальным. В воскресенье закрыто.',
      rules: ['Групповые комнаты — до 3 часов подряд', 'Еда в залах запрещена']
    },
    {
      id: 'chasy-i-chay',
      name: 'Часы и чай',
      type: 'anticafe',
      demo: true,
      district: 'Басманный',
      metro: 'Чистые пруды',
      walk: 5,
      coords: [55.7642, 37.6411],
      price: { kind: 'hour', amount: 280 },
      priceNote: 'Платишь за время, чай и печенье включены.',
      discounts: { student: 'Пример: −15% по студенческому', age: 'Пример: школьникам до 18 лет — −30%' },
      amenities: { wifi: true, sockets: true, quiet: false, team: true, calls: false },
      hours: days([["12:00", "02:00"]], [["12:00", "02:00"]], [["12:00", "00:00"]]),
      popularity: 82,
      photos: ['pick-popular.jpg', 'about-hero.jpg'],
      alt: 'Светлый зал с людьми за ноутбуками, растениями и большими окнами',
      description: 'Антикафе, где платишь за время, а чай и печенье уже включены. Открыто до двух ночи, поэтому сюда приходят доделывать проекты командой после пар.',
      rules: ['Время считается поминутно', 'Свою еду можно, алкоголь — нет']
    },
    {
      id: 'nochnaya-smena',
      name: 'Ночная смена',
      type: 'coworking',
      demo: true,
      district: 'Савёловский',
      metro: 'Савёловская',
      walk: 4,
      coords: [55.7938, 37.5899],
      price: { kind: 'hour', amount: 250 },
      priceNote: 'Пример условий: ночной тариф (с 23:00) — по той же цене.',
      discounts: { age: 'Пример: людям старше 60 лет — бесплатно в будни до 12:00' },
      amenities: { wifi: true, sockets: true, quiet: false, team: true, calls: true },
      hours: [ALL, ALL, ALL, ALL, ALL, ALL, ALL],
      popularity: 72,
      photos: ['hero-home.jpg', 'place-common-space.jpg'],
      alt: 'Студентка с ноутбуком в стикерах конспектирует в общем зале коворкинга',
      description: 'Круглосуточный коворкинг для тех, кто работает по ночам или живёт в ритме дедлайнов. Есть кухня, зона для созвонов и места для небольших команд.',
      rules: ['Ночью вход по предварительной записи']
    },
    {
      id: 'kulturny-dvor',
      name: 'Культурный двор',
      type: 'culture',
      demo: true,
      district: 'Таганский',
      metro: 'Площадь Ильича',
      walk: 8,
      coords: [55.7477, 37.6825],
      price: { kind: 'free', amount: 0 },
      priceNote: 'Пример условий: вход в открытые зоны бесплатный.',
      discounts: {},
      amenities: { wifi: true, sockets: true, quiet: false, team: true, calls: false },
      hours: days([["10:00", "22:00"]], [["10:00", "22:00"]], [["10:00", "22:00"]]),
      popularity: 75,
      photos: ['pick-weekend.jpg', 'article-city.jpg'],
      alt: 'Светлое здание с колоннами и люди на ступенях у входа',
      description: 'Культурный центр с открытыми зонами, лекторием и ступенями, где в тёплую погоду сидят с ноутбуками. Внутри можно встретиться с командой или просто переждать окно между парами.',
      rules: ['В дни мероприятий часть зон закрыта']
    },
    {
      id: 'pavilyon-idey',
      name: 'Павильон идей',
      type: 'culture',
      demo: true,
      district: 'Останкинский',
      metro: 'ВДНХ',
      walk: 10,
      coords: [55.8212, 37.6392],
      price: { kind: 'ticket', amount: 500 },
      priceNote: 'Пример условий: билет на день, рабочая зона входит в билет.',
      discounts: { student: 'Пример: студентам — 250 ₽', age: 'Пример: школьникам и пенсионерам — бесплатно' },
      amenities: { wifi: true, sockets: false, quiet: true, team: true, calls: false },
      hours: [[], [["11:00", "21:00"]], [["11:00", "21:00"]], [["11:00", "21:00"]], [["11:00", "21:00"]], [["11:00", "22:00"]], [["11:00", "22:00"]]],
      popularity: 63,
      photos: ['article-rest.jpg', 'pick-weekend.jpg'],
      alt: 'Девушка задумалась за ноутбуком в зале с книжными полками',
      description: 'Выставочный павильон с читальной зоной на втором этаже. Удобно совместить работу и прогулку в выходной. Розеток мало — приходи с заряженным ноутбуком.',
      rules: ['Билет действует весь день', 'Понедельник — выходной']
    },
    {
      id: 'vremya-bulok',
      name: 'Время булок',
      type: 'bakery',
      demo: true,
      district: 'Тверской',
      metro: 'Тверская',
      walk: 3,
      coords: [55.7652, 37.6067],
      price: { kind: 'check', amount: 450 },
      priceNote: 'Средний чек: завтрак или кофе с выпечкой.',
      discounts: {},
      amenities: { wifi: true, sockets: false, quiet: false, team: false, calls: false },
      hours: days([["07:30", "22:00"]], [["08:30", "22:00"]], [["08:30", "22:00"]]),
      popularity: 86,
      photos: ['pick-snack.jpg', 'place-coffee-plans.jpg'],
      alt: 'Чашка капучино с латте-артом и круассан на столе',
      description: 'Пекарня, куда заходят перекусить между делами: кофе, круассаны, супы. Поработать час можно, но розеток почти нет — это место для паузы, а не для марафона.',
      rules: []
    },
    {
      id: 'obed-po-raspisaniyu',
      name: 'Обед по расписанию',
      type: 'canteen',
      demo: true,
      district: 'Якиманка',
      metro: 'Октябрьская',
      walk: 5,
      coords: [55.7299, 37.6136],
      price: { kind: 'check', amount: 400 },
      priceNote: 'Средний чек: комплексный обед.',
      discounts: { student: 'Пример: студенческий комплекс — 290 ₽' },
      amenities: { wifi: false, sockets: false, quiet: false, team: true, calls: false },
      hours: days([["09:00", "20:00"]], [], []),
      popularity: 67,
      photos: ['article-coffee.jpg', 'pick-snack.jpg'],
      alt: 'Кружка с латте рядом с ноутбуком на столе в кафе',
      description: 'Столовая с большими столами, где команда может пообедать и быстро обсудить задачи. Wi-Fi нет, зато недорого и сытно. Работает только по будням.',
      rules: ['В обеденный пик столы освобождают после еды']
    },
    {
      id: 'chitalnya-v-parke',
      name: 'Читальня в парке',
      type: 'library',
      demo: true,
      district: 'Хамовники',
      metro: 'Парк культуры',
      walk: 9,
      coords: [55.7326, 37.5973],
      price: { kind: 'free', amount: 0 },
      priceNote: 'Пример условий: бесплатно, без записи.',
      discounts: {},
      amenities: { wifi: true, sockets: false, quiet: true, team: false, calls: false },
      hours: days([["10:00", "20:00"]], [["10:00", "21:00"]], [["10:00", "21:00"]]),
      popularity: 70,
      photos: ['pick-free.jpg', 'place-reading-hall.jpg'],
      alt: 'Студент читает книгу за столом с зелёной лампой у книжных полок',
      description: 'Небольшая читальня рядом с парком: тихо, светло, можно взять книгу или поработать с ноутбуком на своём заряде. Розеток нет.',
      rules: ['Ноутбуки — только в беззвучном режиме']
    },
    {
      id: 'pozdny-latte',
      name: 'Поздний латте',
      type: 'coffee',
      demo: true,
      district: 'Тверской',
      metro: 'Новослободская',
      walk: 4,
      coords: [55.7805, 37.6024],
      price: { kind: 'check', amount: 300 },
      priceNote: 'Средний чек: напиток и десерт.',
      discounts: { student: 'Пример: −10% по студенческому после 21:00' },
      amenities: { wifi: true, sockets: true, quiet: false, team: false, calls: true },
      hours: days([["09:00", "01:00"]], [["10:00", "03:00"]], [["10:00", "01:00"]]),
      popularity: 74,
      photos: ['article-evening.jpg', 'article-coffee.jpg'],
      alt: 'Девушка в наушниках у окна с видом на вечерний город и кружкой на подоконнике',
      description: 'Кофейня, которая работает до ночи: у окна есть стойка с розетками, а в дальнем зале тише — там удобно провести короткий созвон.',
      rules: ['После 23:00 работает только первый этаж']
    },
    {
      id: 'peregovorka',
      name: 'Переговорка',
      type: 'coworking',
      demo: true,
      district: 'Беговой',
      metro: 'Динамо',
      walk: 6,
      coords: [55.7893, 37.5610],
      price: { kind: 'hour', amount: 550 },
      priceNote: 'Пример условий: цена за место; переговорная на 6 человек — отдельно.',
      discounts: { student: 'Пример: студенческим командам — −30% в будни' },
      amenities: { wifi: true, sockets: true, quiet: false, team: true, calls: true },
      hours: days([["08:00", "23:00"]], [["10:00", "22:00"]], [["10:00", "22:00"]]),
      popularity: 61,
      photos: ['article-meadow.jpg', 'place-common-space.jpg'],
      alt: 'Компания студентов работает за общим столом с ноутбуками',
      description: 'Коворкинг для команд: переговорные с экраном, маркерные доски и столы, которые можно составить вместе. Для одиночной работы есть места потише.',
      rules: ['Переговорные бронируются через администратора места']
    },
    {
      id: 'studencheskiy-hab',
      name: 'Студенческий хаб',
      type: 'coworking',
      demo: true,
      district: 'Басманный',
      metro: 'Курская',
      walk: 7,
      coords: [55.7590, 37.6624],
      price: { kind: 'free', amount: 0 },
      priceNote: 'Пример условий: бесплатно для студентов после регистрации.',
      discounts: {},
      amenities: { wifi: true, sockets: true, quiet: true, team: true, calls: true },
      hours: days([["10:00", "21:00"]], [["12:00", "18:00"]], []),
      popularity: 80,
      photos: ['about-checklist.jpg', 'place-quiet-room.jpg'],
      alt: 'Стол с ноутбуком, удлинителем, стаканом кофе и списком «Хорошее место»',
      description: 'Бесплатный коворкинг для студентов: тихая зона, комнаты для команд и кабинки для созвонов. В воскресенье закрыто.',
      rules: ['Нужна регистрация со студенческим билетом', 'Комнаты для команд — до 2 часов']
    }
  ];

  window.KOROVKING_DATA.placeTypes = {
    coworking: { label: 'Коворкинг', group: 'study' },
    library: { label: 'Библиотека', group: 'study' },
    anticafe: { label: 'Антикафе', group: 'study' },
    culture: { label: 'Культурный центр', group: 'study' },
    cafe: { label: 'Кафе', group: 'food' },
    coffee: { label: 'Кофейня', group: 'food' },
    bakery: { label: 'Пекарня', group: 'food' },
    canteen: { label: 'Столовая', group: 'food' }
  };
})();
