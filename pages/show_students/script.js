const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('mouseenter', () => sidebar.classList.add('open'));
sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('open'));

/* ===== MAIN TABS ===== */
const tabs = document.querySelectorAll('.tab-item');
const panels = document.querySelectorAll('.tab-panel');

function switchTab(index) {
  tabs.forEach(t => t.classList.remove('active'));
  panels.forEach(p => p.classList.remove('active'));
  tabs[index].classList.add('active');
  panels[index].classList.add('active');
}

/* ===== EDUCATION PANEL API ===== */
const API_BASE = 'https://api-platonus.yu.edu.kz/api/v1';
const API_KEY  = 'a3f8c2d1e9b74056f2a1c8d3e7f0b9a2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0';
let _eduLoaded = false;
let _allGroups = [];

async function apiGet(path) {
  const r = await fetch(API_BASE + path, { headers: { 'x-api-key': API_KEY } });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

function fillSelect(id, items, valKey, labelKey, placeholder) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = `<option value="">${placeholder}</option>` +
    items.map(i => `<option value="${i[valKey]}">${i[labelKey]}</option>`).join('');
}

function initEduPanel() {
  if (_eduLoaded) return;
  _eduLoaded = true;

  const SPECIALTIES = [
    { id: 'M078', name: 'M078 Право' },
  ];

  const OPS = [
    { id: '7M04201', name: '7М04201-Юриспруденция' },
  ];

  fillSelect('edu_specialty', SPECIALTIES, 'id', 'name', '— Выберите специальность —');
  fillSelect('edu_op', OPS, 'id', 'name', '— Выберите ОП —');
}

/* ===== INNER TABS (ФИО) ===== */
const innerTabs = document.querySelectorAll('.inner-tab');
const innerPanels = document.querySelectorAll('.inner-panel');

function switchInner(index) {
  innerTabs.forEach(t => t.classList.remove('active'));
  innerPanels.forEach(p => p.classList.remove('active'));
  innerTabs[index].classList.add('active');
  innerPanels[index].classList.add('active');
}

/* ===== COLLAPSIBLE SECTIONS ===== */
function toggleSection(id) {
  const body = document.getElementById(id);
  const chev = document.getElementById('chev-' + id);
  body.classList.toggle('collapsed');
  chev.classList.toggle('rotated');
}

/* ===== ИИН → ДАТА РОЖДЕНИЯ + ПОЛ ===== */
function onIinInput(input) {
  const val = input.value.replace(/\D/g, '').substring(0, 12);
  input.value = val;
  if (val.length < 7) return;

  const yy    = val.substring(0, 2);
  const mm    = val.substring(2, 4);
  const dd    = val.substring(4, 6);
  const cent  = parseInt(val[6]);

  let year;
  if (cent === 1 || cent === 2) year = '18' + yy;
  else if (cent === 3 || cent === 4) year = '19' + yy;
  else year = '20' + yy;

  const monthNum = parseInt(mm);
  const dayNum   = parseInt(dd);
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) return;

  const dobField = document.getElementById('f_dob');
  if (dobField) dobField.value = `${year}-${mm}-${dd}`;

  // Автозаполнение пола
  const genderSel = document.getElementById('f_gender');
  if (genderSel) {
    const isMale = cent % 2 !== 0;
    for (let i = 0; i < genderSel.options.length; i++) {
      const txt = genderSel.options[i].text.toLowerCase();
      if (isMale && (txt.includes('муж') || txt === 'м')) {
        genderSel.selectedIndex = i; break;
      } else if (!isMale && (txt.includes('жен') || txt === 'ж')) {
        genderSel.selectedIndex = i; break;
      }
    }
  }
}

/* ===== PHOTO PREVIEW ===== */
function previewPhoto(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const block = input.closest('.photo-block');
    const ph = block.querySelector('.photo-placeholder');
    ph.innerHTML = `<img src="${e.target.result}" alt="Фото">`;
    let hidden = block.querySelector('#f_photo_data');
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.id = 'f_photo_data';
      block.appendChild(hidden);
    }
    hidden.value = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

/* ===== KATO AUTOCOMPLETE ===== */
const katoTimers = {};

async function katoSearch(input, wrapId) {
  const wrap = document.getElementById(wrapId);
  const dropdown = wrap.querySelector('.kato-dropdown');
  const query = input.value.trim();

  if (query.length < 1) {
    dropdown.classList.remove('open');
    return;
  }

  clearTimeout(katoTimers[wrapId]);
  katoTimers[wrapId] = setTimeout(async () => {
    dropdown.innerHTML = '<div class="kato-loading">Поиск...</div>';
    dropdown.classList.add('open');

    try {
      const url = `https://data.egov.kz/api/v4/kato?apiKey=&filters=%7B%22nameRu%22%3A%7B%22%24like%22%3A%22${encodeURIComponent(query)}%25%22%7D%7D&size=20&page=0`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();
      const items = data.data || data || [];

      if (!items.length) {
        dropdown.innerHTML = '<div class="kato-empty">Ничего не найдено</div>';
        return;
      }

      dropdown.innerHTML = items.map(item => {
        const code = item.code || item.id || '';
        const name = item.nameRu || item.name || '';
        return `<div class="kato-item" onclick="katoSelect('${wrapId}','${code}','${name.replace(/'/g,"\\'")}')">
          <span class="kato-code">${code}</span>
          <span class="kato-name">${name}</span>
        </div>`;
      }).join('');

    } catch (e) {
      // fallback: фильтрация по встроенному списку
      const results = KATO_FALLBACK.filter(k =>
        k.name.toLowerCase().includes(query.toLowerCase()) ||
        k.code.startsWith(query)
      ).slice(0, 20);

      if (!results.length) {
        dropdown.innerHTML = '<div class="kato-empty">Ничего не найдено</div>';
        return;
      }
      dropdown.innerHTML = results.map(k =>
        `<div class="kato-item" onclick="katoSelect('${wrapId}','${k.code}','${k.name.replace(/'/g,"\\'")}')">
          <span class="kato-code">${k.code}</span>
          <span class="kato-name">${k.name}</span>
        </div>`
      ).join('');
    }
  }, 280);
}

function katoSelect(wrapId, code, name) {
  const wrap = document.getElementById(wrapId);
  wrap.querySelector('.kato-input').value = `${code} ${name}`;
  wrap.querySelector('.kato-value').value = code;
  wrap.querySelector('.kato-dropdown').classList.remove('open');
}

document.addEventListener('click', e => {
  document.querySelectorAll('.kato-dropdown.open').forEach(dd => {
    if (!dd.closest('.kato-wrap').contains(e.target)) {
      dd.classList.remove('open');
    }
  });
});

/* ===== KATO FALLBACK LIST (основные населённые пункты РК) ===== */
const KATO_FALLBACK = [
  { code: '710000000', name: 'г. Астана' },
  { code: '750000000', name: 'г. Алматы' },
  { code: '790000000', name: 'г. Шымкент' },
  { code: '110000000', name: 'Акмолинская область' },
  { code: '110100000', name: 'г. Кокшетау (Акмолинская область)' },
  { code: '110200000', name: 'г. Степногорск (Акмолинская область)' },
  { code: '110400000', name: 'Аккольский район (Акмолинская область)' },
  { code: '110600000', name: 'Аршалынский район (Акмолинская область)' },
  { code: '110800000', name: 'Астраханский район (Акмолинская область)' },
  { code: '111000000', name: 'Атбасарский район (Акмолинская область)' },
  { code: '111200000', name: 'Буландынский район (Акмолинская область)' },
  { code: '111800000', name: 'Зерендинский район (Акмолинская область)' },
  { code: '112200000', name: 'Коргалжынский район (Акмолинская область)' },
  { code: '112600000', name: 'Сандыктауский район (Акмолинская область)' },
  { code: '113000000', name: 'Целиноградский район (Акмолинская область)' },
  { code: '113200000', name: 'Шортандинский район (Акмолинская область)' },
  { code: '150000000', name: 'Актюбинская область' },
  { code: '150100000', name: 'г. Актобе (Актюбинская область)' },
  { code: '150300000', name: 'г. Кандыагаш (Актюбинская область)' },
  { code: '150400000', name: 'Айтекебийский район (Актюбинская область)' },
  { code: '150600000', name: 'Байганинский район (Актюбинская область)' },
  { code: '150800000', name: 'Иргизский район (Актюбинская область)' },
  { code: '151000000', name: 'Каргалинский район (Актюбинская область)' },
  { code: '151200000', name: 'Мартукский район (Актюбинская область)' },
  { code: '151400000', name: 'Мугалжарский район (Актюбинская область)' },
  { code: '151600000', name: 'Темирский район (Актюбинская область)' },
  { code: '151800000', name: 'Уилский район (Актюбинская область)' },
  { code: '152000000', name: 'Хромтауский район (Актюбинская область)' },
  { code: '190000000', name: 'Алматинская область' },
  { code: '190100000', name: 'г. Талдыкорган (Алматинская область)' },
  { code: '190200000', name: 'г. Капшагай (Алматинская область)' },
  { code: '190300000', name: 'г. Конаев (Алматинская область)' },
  { code: '190400000', name: 'Балхашский район (Алматинская область)' },
  { code: '190600000', name: 'Енбекшиказахский район (Алматинская область)' },
  { code: '191000000', name: 'Карасайский район (Алматинская область)' },
  { code: '191200000', name: 'Кербулакский район (Алматинская область)' },
  { code: '191400000', name: 'Коксуский район (Алматинская область)' },
  { code: '191600000', name: 'Панфиловский район (Алматинская область)' },
  { code: '191800000', name: 'Райымбекский район (Алматинская область)' },
  { code: '192000000', name: 'Талгарский район (Алматинская область)' },
  { code: '192200000', name: 'Уйгурский район (Алматинская область)' },
  { code: '230000000', name: 'Атырауская область' },
  { code: '230100000', name: 'г. Атырау (Атырауская область)' },
  { code: '230400000', name: 'Индерский район (Атырауская область)' },
  { code: '230600000', name: 'Исатайский район (Атырауская область)' },
  { code: '230800000', name: 'Кызылкогинский район (Атырауская область)' },
  { code: '231000000', name: 'Курмангазинский район (Атырауская область)' },
  { code: '231200000', name: 'Макатский район (Атырауская область)' },
  { code: '231400000', name: 'Махамбетский район (Атырауская область)' },
  { code: '231600000', name: 'Жылыойский район (Атырауская область)' },
  { code: '270000000', name: 'Западно-Казахстанская область' },
  { code: '270100000', name: 'г. Уральск (Западно-Казахстанская область)' },
  { code: '270400000', name: 'Акжаикский район (Западно-Казахстанская область)' },
  { code: '270600000', name: 'Бурлинский район (Западно-Казахстанская область)' },
  { code: '270800000', name: 'Зеленовский район (Западно-Казахстанская область)' },
  { code: '271000000', name: 'Казталовский район (Западно-Казахстанская область)' },
  { code: '271200000', name: 'Каратобинский район (Западно-Казахстанская область)' },
  { code: '271400000', name: 'Сырымский район (Западно-Казахстанская область)' },
  { code: '271600000', name: 'Таскалинский район (Западно-Казахстанская область)' },
  { code: '271800000', name: 'Теректинский район (Западно-Казахстанская область)' },
  { code: '272000000', name: 'Чингирлауский район (Западно-Казахстанская область)' },
  { code: '310000000', name: 'Жамбылская область' },
  { code: '310100000', name: 'г. Тараз (Жамбылская область)' },
  { code: '310400000', name: 'Байзакский район (Жамбылская область)' },
  { code: '310600000', name: 'Жамбылский район (Жамбылская область)' },
  { code: '310800000', name: 'Жуалынский район (Жамбылская область)' },
  { code: '311000000', name: 'Кордайский район (Жамбылская область)' },
  { code: '311200000', name: 'Меркенский район (Жамбылская область)' },
  { code: '311400000', name: 'Мойынкумский район (Жамбылская область)' },
  { code: '311600000', name: 'Рыскуловский район (Жамбылская область)' },
  { code: '311800000', name: 'Сарысуский район (Жамбылская область)' },
  { code: '312000000', name: 'Таласский район (Жамбылская область)' },
  { code: '312200000', name: 'Шуский район (Жамбылская область)' },
  { code: '350000000', name: 'Карагандинская область' },
  { code: '350100000', name: 'г. Караганда (Карагандинская область)' },
  { code: '350200000', name: 'г. Балхаш (Карагандинская область)' },
  { code: '350300000', name: 'г. Жезказган (Карагандинская область)' },
  { code: '350400000', name: 'г. Приозёрск (Карагандинская область)' },
  { code: '350500000', name: 'г. Сарань (Карагандинская область)' },
  { code: '350600000', name: 'г. Темиртау (Карагандинская область)' },
  { code: '350700000', name: 'г. Шахтинск (Карагандинская область)' },
  { code: '351000000', name: 'Абайский район (Карагандинская область)' },
  { code: '351200000', name: 'Актогайский район (Карагандинская область)' },
  { code: '351400000', name: 'Бухар-Жырауский район (Карагандинская область)' },
  { code: '351600000', name: 'Жанааркинский район (Карагандинская область)' },
  { code: '351800000', name: 'Каркаралинский район (Карагандинская область)' },
  { code: '352000000', name: 'Нуринский район (Карагандинская область)' },
  { code: '355600000', name: 'Осакаровский район (Карагандинская область)' },
  { code: '352400000', name: 'Шетский район (Карагандинская область)' },
  { code: '390000000', name: 'Костанайская область' },
  { code: '390100000', name: 'г. Костанай (Костанайская область)' },
  { code: '390200000', name: 'г. Аркалык (Костанайская область)' },
  { code: '390300000', name: 'г. Лисаковск (Костанайская область)' },
  { code: '390400000', name: 'г. Рудный (Костанайская область)' },
  { code: '390600000', name: 'Алтынсаринский район (Костанайская область)' },
  { code: '390800000', name: 'Амангельдинский район (Костанайская область)' },
  { code: '391000000', name: 'Аулиекольский район (Костанайская область)' },
  { code: '391200000', name: 'Денисовский район (Костанайская область)' },
  { code: '391400000', name: 'Джангельдинский район (Костанайская область)' },
  { code: '391600000', name: 'Жангельдинский район (Костанайская область)' },
  { code: '391800000', name: 'Житикаринский район (Костанайская область)' },
  { code: '392000000', name: 'Камыстинский район (Костанайская область)' },
  { code: '392200000', name: 'Карабалыкский район (Костанайская область)' },
  { code: '392400000', name: 'Карасуский район (Костанайская область)' },
  { code: '392600000', name: 'Костанайский район (Костанайская область)' },
  { code: '392800000', name: 'Мендыкаринский район (Костанайская область)' },
  { code: '393000000', name: 'Наурзумский район (Костанайская область)' },
  { code: '393200000', name: 'Сарыкольский район (Костанайская область)' },
  { code: '393400000', name: 'Тарановский район (Костанайская область)' },
  { code: '393600000', name: 'Узункольский район (Костанайская область)' },
  { code: '393800000', name: 'Фёдоровский район (Костанайская область)' },
  { code: '430000000', name: 'Кызылординская область' },
  { code: '430100000', name: 'г. Кызылорда (Кызылординская область)' },
  { code: '430200000', name: 'г. Байконур (Кызылординская область)' },
  { code: '430400000', name: 'Аральский район (Кызылординская область)' },
  { code: '430600000', name: 'Жалагашский район (Кызылординская область)' },
  { code: '430800000', name: 'Жанакорганский район (Кызылординская область)' },
  { code: '431000000', name: 'Казалинский район (Кызылординская область)' },
  { code: '431200000', name: 'Кармакчинский район (Кызылординская область)' },
  { code: '431400000', name: 'Сырдарьинский район (Кызылординская область)' },
  { code: '431600000', name: 'Шиелийский район (Кызылординская область)' },
  { code: '470000000', name: 'Мангистауская область' },
  { code: '470100000', name: 'г. Актау (Мангистауская область)' },
  { code: '470200000', name: 'г. Жанаозен (Мангистауская область)' },
  { code: '470400000', name: 'Бейнеуский район (Мангистауская область)' },
  { code: '470600000', name: 'Каракиянский район (Мангистауская область)' },
  { code: '470800000', name: 'Мангистауский район (Мангистауская область)' },
  { code: '471000000', name: 'Мунайлинский район (Мангистауская область)' },
  { code: '471200000', name: 'Тупкараганский район (Мангистауская область)' },
  { code: '510000000', name: 'Туркестанская область' },
  { code: '510100000', name: 'г. Туркестан (Туркестанская область)' },
  { code: '510200000', name: 'г. Кентау (Туркестанская область)' },
  { code: '510400000', name: 'Байдибекский район (Туркестанская область)' },
  { code: '510600000', name: 'Жетысайский район (Туркестанская область)' },
  { code: '510800000', name: 'Казыгуртский район (Туркестанская область)' },
  { code: '511000000', name: 'Келесский район (Туркестанская область)' },
  { code: '511200000', name: 'Мактааральский район (Туркестанская область)' },
  { code: '511400000', name: 'Ордабасинский район (Туркестанская область)' },
  { code: '511600000', name: 'Отырарский район (Туркестанская область)' },
  { code: '511800000', name: 'Сайрамский район (Туркестанская область)' },
  { code: '512000000', name: 'Сарыагашский район (Туркестанская область)' },
  { code: '512200000', name: 'Созакский район (Туркестанская область)' },
  { code: '512400000', name: 'Толебийский район (Туркестанская область)' },
  { code: '512600000', name: 'Тюлькубасский район (Туркестанская область)' },
  { code: '512800000', name: 'Шардаринский район (Туркестанская область)' },
  { code: '550000000', name: 'Павлодарская область' },
  { code: '550100000', name: 'г. Павлодар (Павлодарская область)' },
  { code: '550200000', name: 'г. Аксу (Павлодарская область)' },
  { code: '550300000', name: 'г. Экибастуз (Павлодарская область)' },
  { code: '550400000', name: 'Актогайский район (Павлодарская область)' },
  { code: '550600000', name: 'Баянаульский район (Павлодарская область)' },
  { code: '550800000', name: 'Железинский район (Павлодарская область)' },
  { code: '551000000', name: 'Иртышский район (Павлодарская область)' },
  { code: '551200000', name: 'Лебяжинский район (Павлодарская область)' },
  { code: '551400000', name: 'Майский район (Павлодарская область)' },
  { code: '551600000', name: 'Павлодарский район (Павлодарская область)' },
  { code: '551800000', name: 'Успенский район (Павлодарская область)' },
  { code: '552000000', name: 'Щербактинский район (Павлодарская область)' },
  { code: '590000000', name: 'Северо-Казахстанская область' },
  { code: '590100000', name: 'г. Петропавловск (Северо-Казахстанская область)' },
  { code: '590400000', name: 'Айыртауский район (Северо-Казахстанская область)' },
  { code: '590600000', name: 'Акжарский район (Северо-Казахстанская область)' },
  { code: '590800000', name: 'Аккайынский район (Северо-Казахстанская область)' },
  { code: '591000000', name: 'Есильский район (Северо-Казахстанская область)' },
  { code: '591200000', name: 'Жамбылский район (Северо-Казахстанская область)' },
  { code: '591400000', name: 'Кызылжарский район (Северо-Казахстанская область)' },
  { code: '591600000', name: 'Магжана Жумабаева район (Северо-Казахстанская область)' },
  { code: '591800000', name: 'Мамлютский район (Северо-Казахстанская область)' },
  { code: '592000000', name: 'Тайыншинский район (Северо-Казахстанская область)' },
  { code: '592200000', name: 'Тимирязевский район (Северо-Казахстанская область)' },
  { code: '592400000', name: 'Уалихановский район (Северо-Казахстанская область)' },
  { code: '592600000', name: 'Шал акына район (Северо-Казахстанская область)' },
  { code: '630000000', name: 'Восточно-Казахстанская область' },
  { code: '630100000', name: 'г. Усть-Каменогорск (Восточно-Казахстанская область)' },
  { code: '630200000', name: 'г. Риддер (Восточно-Казахстанская область)' },
  { code: '630300000', name: 'г. Семей (Восточно-Казахстанская область)' },
  { code: '630400000', name: 'г. Курчатов (Восточно-Казахстанская область)' },
  { code: '630600000', name: 'Аягозский район (Восточно-Казахстанская область)' },
  { code: '630800000', name: 'Бескарагайский район (Восточно-Казахстанская область)' },
  { code: '631000000', name: 'Бородулихинский район (Восточно-Казахстанская область)' },
  { code: '631200000', name: 'Глубоковский район (Восточно-Казахстанская область)' },
  { code: '631400000', name: 'Жарминский район (Восточно-Казахстанская область)' },
  { code: '631600000', name: 'Зайсанский район (Восточно-Казахстанская область)' },
  { code: '631800000', name: 'Зыряновский район (Восточно-Казахстанская область)' },
  { code: '632000000', name: 'Катон-Карагайский район (Восточно-Казахстанская область)' },
  { code: '632200000', name: 'Кокпектинский район (Восточно-Казахстанская область)' },
  { code: '632400000', name: 'Тарбагатайский район (Восточно-Казахстанская область)' },
  { code: '632600000', name: 'Уланский район (Восточно-Казахстанская область)' },
  { code: '632800000', name: 'Урджарский район (Восточно-Казахстанская область)' },
  { code: '633000000', name: 'Шемонаихинский район (Восточно-Казахстанская область)' },
];

/* ===== BENEFITS (Льготы) ===== */
let _benCount = 0;
function toggleBenefits(cb) {
  const wrap = document.getElementById('ben-table-wrap');
  const btn  = document.getElementById('btn-add-benefit');
  if (cb.checked) {
    wrap.style.display = 'none';
    btn.style.display  = 'none';
  } else {
    wrap.style.display = '';
    btn.style.display  = '';
  }
}

function addBenefitRow() {
  _benCount++;
  document.getElementById('ben-tbody').insertAdjacentHTML('beforeend', `
    <tr>
      <td class="col-num">${_benCount}</td>
      <td><select style="width:100%;border:1px solid #e5e7eb;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit">
        <option value="">— Выберите —</option>
        <option>Сирота</option><option>Инвалид</option>
        <option>Многодетная семья</option><option>Другое</option>
      </select></td>
      <td><input type="text" style="width:100%;border:1px solid #e5e7eb;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit"></td>
      <td><input type="date" style="width:100%;border:1px solid #e5e7eb;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit"></td>
      <td><input type="date" style="width:100%;border:1px solid #e5e7eb;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit"></td>
      <td><input type="text" style="width:100%;border:1px solid #e5e7eb;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit"></td>
      <td><button type="button" onclick="this.closest('tr').remove()" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:0">×</button></td>
    </tr>`);
}

/* ===== ACHIEVEMENTS TABS ===== */
function switchAch(index) {
  document.querySelectorAll('.ach-tab').forEach((t, i) => t.classList.toggle('active', i === index));
  document.querySelectorAll('.ach-panel').forEach((p, i) => p.classList.toggle('active', i === index));
}

const _achRowCounts = {};
function addAchRow(tblId) {
  const tbl = document.getElementById(tblId);
  if (!tbl) return;
  _achRowCounts[tblId] = (_achRowCounts[tblId] || 0) + 1;
  const n = _achRowCounts[tblId];
  const cols = tbl.querySelectorAll('thead th').length;
  const cells = Array.from({length: cols}, (_, i) =>
    i === 0
      ? `<td class="col-num">${n}</td>`
      : `<td><input type="text" style="width:100%;border:1px solid #e5e7eb;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit"></td>`
  ).join('');
  tbl.querySelector('tbody').insertAdjacentHTML('beforeend', `<tr>${cells}</tr>`);
}

/* ===== LANGUAGE TABS (prev education) ===== */
function switchLangTab(index) {
  document.querySelectorAll('.lang-tab').forEach((t, i) => t.classList.toggle('active', i === index));
  document.querySelectorAll('.lang-panel').forEach((p, i) => p.classList.toggle('active', i === index));
}

/* ===== COUNTRY PICKER ===== */
const COUNTRIES = [
  ['Afghanistan','af','+93'],['Albania','al','+355'],['Algeria','dz','+213'],
  ['American Samoa','as','+1-684'],['Andorra','ad','+376'],['Angola','ao','+244'],
  ['Argentina','ar','+54'],['Armenia','am','+374'],['Australia','au','+61'],
  ['Austria','at','+43'],['Azerbaijan','az','+994'],['Bahrain','bh','+973'],
  ['Bangladesh','bd','+880'],['Belarus','by','+375'],['Belgium','be','+32'],
  ['Bolivia','bo','+591'],['Bosnia and Herzegovina','ba','+387'],['Brazil','br','+55'],
  ['Bulgaria','bg','+359'],['Cambodia','kh','+855'],['Cameroon','cm','+237'],
  ['Canada','ca','+1'],['Chile','cl','+56'],['China','cn','+86'],
  ['Colombia','co','+57'],['Croatia','hr','+385'],['Cuba','cu','+53'],
  ['Czech Republic','cz','+420'],['Denmark','dk','+45'],['Ecuador','ec','+593'],
  ['Egypt','eg','+20'],['Estonia','ee','+372'],['Ethiopia','et','+251'],
  ['Finland','fi','+358'],['France','fr','+33'],['Georgia','ge','+995'],
  ['Germany','de','+49'],['Ghana','gh','+233'],['Greece','gr','+30'],
  ['Hungary','hu','+36'],['Iceland','is','+354'],['India','in','+91'],
  ['Indonesia','id','+62'],['Iran','ir','+98'],['Iraq','iq','+964'],
  ['Ireland','ie','+353'],['Israel','il','+972'],['Italy','it','+39'],
  ['Japan','jp','+81'],['Jordan','jo','+962'],['Kazakhstan','kz','+7'],
  ['Kenya','ke','+254'],['Kuwait','kw','+965'],['Kyrgyzstan','kg','+996'],
  ['Latvia','lv','+371'],['Lebanon','lb','+961'],['Libya','ly','+218'],
  ['Lithuania','lt','+370'],['Luxembourg','lu','+352'],['Malaysia','my','+60'],
  ['Mexico','mx','+52'],['Moldova','md','+373'],['Mongolia','mn','+976'],
  ['Morocco','ma','+212'],['Netherlands','nl','+31'],['New Zealand','nz','+64'],
  ['Nigeria','ng','+234'],['Norway','no','+47'],['Oman','om','+968'],
  ['Pakistan','pk','+92'],['Palestine','ps','+970'],['Peru','pe','+51'],
  ['Philippines','ph','+63'],['Poland','pl','+48'],['Portugal','pt','+351'],
  ['Qatar','qa','+974'],['Romania','ro','+40'],['Russia','ru','+7'],
  ['Saudi Arabia','sa','+966'],['Serbia','rs','+381'],['Singapore','sg','+65'],
  ['Slovakia','sk','+421'],['Slovenia','si','+386'],['South Korea','kr','+82'],
  ['Spain','es','+34'],['Sweden','se','+46'],['Switzerland','ch','+41'],
  ['Syria','sy','+963'],['Tajikistan','tj','+992'],['Thailand','th','+66'],
  ['Tunisia','tn','+216'],['Turkey','tr','+90'],['Turkmenistan','tm','+993'],
  ['UAE','ae','+971'],['Ukraine','ua','+380'],['United Kingdom','gb','+44'],
  ['United States','us','+1'],['Uzbekistan','uz','+998'],['Venezuela','ve','+58'],
  ['Vietnam','vn','+84'],['Yemen','ye','+967'],
];

function buildCP(id) {
  const list = document.getElementById(id + '-list');
  if (!list || list.children.length) return;
  list.innerHTML = COUNTRIES.map(([name, iso, code]) =>
    `<div class="cp-item${iso==='kz'?' active':''}" data-iso="${iso}" data-code="${code}" onclick="selectCP('${id}','${iso}','${code}')">
      <img src="https://flagcdn.com/w20/${iso}.png" alt="${iso}">
      <span class="cp-item-name">${name}</span>
      <span class="cp-item-code">${code}</span>
    </div>`
  ).join('');
}

function toggleCP(id) {
  buildCP(id);
  const wrap = document.getElementById(id);
  const isOpen = wrap.classList.contains('open');
  document.querySelectorAll('.cp-wrap.open').forEach(w => w.classList.remove('open'));
  if (!isOpen) {
    wrap.classList.add('open');
    const search = wrap.querySelector('.cp-search');
    search.value = '';
    filterCP(id, '');
    search.focus();
  }
}

function filterCP(id, query) {
  const q = query.toLowerCase();
  document.querySelectorAll(`#${id}-list .cp-item`).forEach(item => {
    const name = item.querySelector('.cp-item-name').textContent.toLowerCase();
    const code = item.querySelector('.cp-item-code').textContent;
    item.classList.toggle('hidden', !name.includes(q) && !code.includes(q));
  });
}

function selectCP(id, iso, code) {
  const wrap = document.getElementById(id);
  wrap.querySelector('.cp-flag-btn img').src = `https://flagcdn.com/w20/${iso}.png`;
  wrap.querySelector('.cp-flag-btn img').alt = iso.toUpperCase();
  wrap.querySelectorAll('.cp-item').forEach(i => i.classList.toggle('active', i.dataset.iso === iso));
  const phoneInput = wrap.closest('.phone-wrap').querySelector('input[type=text]');
  phoneInput.value = code;
  phoneInput.focus();
  wrap.classList.remove('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.cp-wrap')) {
    document.querySelectorAll('.cp-wrap.open').forEach(w => w.classList.remove('open'));
  }
});

/* ===== SEARCHABLE SELECT ===== */
function toggleSS(id) {
  const wrap = document.getElementById(id);
  const isOpen = wrap.classList.contains('open');
  document.querySelectorAll('.ss-wrap.open').forEach(w => w.classList.remove('open'));
  if (!isOpen) {
    wrap.classList.add('open');
    const search = wrap.querySelector('.ss-search');
    search.value = '';
    filterSS(id, '');
    search.focus();
  }
}

function filterSS(id, query) {
  const wrap = document.getElementById(id);
  const q = query.toLowerCase();
  wrap.querySelectorAll('.ss-option').forEach(opt => {
    opt.classList.toggle('hidden', !opt.textContent.toLowerCase().includes(q));
  });
}

function selectSS(id, value) {
  const wrap = document.getElementById(id);
  const label = wrap.querySelector('.ss-selected') || wrap.querySelector('.ss-value');
  const hidden = wrap.querySelector('input[type=hidden]');
  if (label) { label.textContent = value; label.style.color = ''; }
  if (hidden) hidden.value = value;
  wrap.querySelectorAll('.ss-option').forEach(opt => {
    opt.classList.toggle('active', opt.textContent.trim() === value);
  });
  wrap.classList.remove('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.ss-wrap')) {
    document.querySelectorAll('.ss-wrap.open').forEach(w => w.classList.remove('open'));
  }
});

/* ===== FILE UPLOAD ===== */
function fileChosen(input) {
  const nameEl = input.closest('.upload-item').querySelector('.upload-filename');
  nameEl.textContent = input.files[0] ? input.files[0].name : '';
}

function addExtraDoc() {
  const list = document.getElementById('extraDocsList');
  const div = document.createElement('div');
  div.className = 'upload-item';
  div.innerHTML = `
    <span class="upload-label">ДОПОЛНИТЕЛЬНЫЙ ДОКУМЕНТ</span>
    <label class="btn-upload"><i data-lucide="upload" style="width:13px;height:13px;margin-right:5px;vertical-align:middle"></i>Загрузить<input type="file" accept=".pdf,.jpg,.png" onchange="fileChosen(this)"></label>
    <span class="upload-filename"></span>
  `;
  list.appendChild(div);
  lucide.createIcons();
}

/* ===== PARENTS MODAL ===== */
function addParent() {
  ['p_last','p_first','p_mid','p_iin','p_phone','p_email',
   'p_address','p_children','p_workplace','p_position',
   'p_doc_num','p_doc_issuer','p_doc_date','p_doc_expiry'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('p_relation').value = '';
  document.getElementById('p_doc_type').value = '';
  const kw = document.getElementById('kato-parent');
  if (kw) { kw.querySelector('.kato-input').value = ''; kw.querySelector('.kato-value').value = ''; }
  document.getElementById('parentOverlay').classList.add('open');
  lucide.createIcons();
}

function closeParentModal() {
  document.getElementById('parentOverlay').classList.remove('open');
}

function closeParentOutside(e) {
  if (e.target === document.getElementById('parentOverlay')) closeParentModal();
}

function saveParent() {
  const last  = document.getElementById('p_last').value.trim();
  const first = document.getElementById('p_first').value.trim();
  const iin   = document.getElementById('p_iin').value.trim();
  const phone = document.getElementById('p_phone').value.trim();

  if (!last || !first || !iin || !phone) {
    alert('Заполните обязательные поля: Фамилия, Имя, ИИН, Мобильный телефон');
    return;
  }

  const relation = document.getElementById('p_relation').value || '—';
  const tbody = document.getElementById('parentsBody');
  const empty = tbody.querySelector('.empty-row');
  if (empty) empty.remove();

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${last} ${first} ${document.getElementById('p_mid').value} (${relation})</td>
    <td>${phone}${document.getElementById('p_email').value ? ' / ' + document.getElementById('p_email').value : ''}</td>
  `;
  tbody.appendChild(tr);
  closeParentModal();
}

/* ===== NOTIFICATION TABLE SORT ===== */
let _notifSortAsc = false;
function sortNotifTable(th) {
  _notifSortAsc = !_notifSortAsc;
  th.querySelector('.sort-arrow').textContent = _notifSortAsc ? '▲' : '▼';
  const tbody = document.getElementById('notif-tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => {
    const av = a.cells[0]?.textContent.trim() || '';
    const bv = b.cells[0]?.textContent.trim() || '';
    return _notifSortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  rows.forEach(r => tbody.appendChild(r));
}

/* ===== COLLECT / RESTORE ALL FIELDS ===== */
function collectAllFields() {
  const data = {};
  document.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
    if (el.type === 'file') return;
    if (el.type === 'checkbox' || el.type === 'radio') {
      data[el.id] = el.checked;
    } else {
      data[el.id] = el.value;
    }
  });
  return data;
}

function restoreAllFields(data) {
  if (!data) return;
  Object.entries(data).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = !!val;
    } else {
      el.value = val;
    }
    // Для ss-wrap обновляем отображаемый текст
    const ssWrap = el.closest('.ss-wrap');
    if (ssWrap && val) {
      const label = ssWrap.querySelector('.ss-value') || ssWrap.querySelector('.ss-selected');
      if (label) label.textContent = val;
    }
  });
  // Восстанавливаем фото
  if (data.f_photo_data) {
    const ph = document.querySelector('.photo-block .photo-placeholder');
    if (ph) ph.innerHTML = `<img src="${data.f_photo_data}" alt="Фото">`;
  }
}

/* ===== SAVE ===== */
function saveStudent() {
  const last  = document.getElementById('f_last')?.value.trim()  || '';
  const first = document.getElementById('f_first')?.value.trim() || '';
  const mid   = document.getElementById('f_mid')?.value.trim()   || '';
  const iin   = document.getElementById('f_iin')?.value.trim()   || '';
  const dob   = document.getElementById('f_dob')?.value          || '';

  if (!last || !first || !iin) {
    alert('Заполните обязательные поля: Фамилия, Имя, ИИН');
    switchTab(0);
    return;
  }

  const fio = [last, first, mid ? mid[0] + '.' : ''].filter(Boolean).join(' ');

  const specialty = document.getElementById('edu_specialty');
  const specText  = specialty?.options[specialty?.selectedIndex]?.text || '—';
  const opEl      = document.getElementById('edu_op');
  const opText    = opEl?.options[opEl?.selectedIndex]?.text || '—';
  const payEl     = document.getElementById('edu_pay');
  const payText   = payEl?.options[payEl?.selectedIndex]?.text || '—';
  const dateIn    = document.getElementById('edu_date_in')?.value || '';

  const fields = collectAllFields();

  const student = {
    id: Date.now(),
    fio, iin, dob,
    payForm: payText,
    specialty: specText,
    specialization: opText,
    dateIn,
    fields,
  };

  let students = JSON.parse(localStorage.getItem('yuedu_students') || '[]');

  if (window._editStudentId) {
    students = students.map(x =>
      x.id === window._editStudentId
        ? { ...student, id: window._editStudentId }
        : x
    );
  } else {
    students.unshift(student);
  }

  localStorage.setItem('yuedu_students', JSON.stringify(students));
  showToast('✓ Данные сохранены');
  setTimeout(() => { window.location.href = '../students/'; }, 1200);
}

function showToast(msg, type = 'success') {
  let el = document.getElementById('appToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appToast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast toast--${type}`;
  requestAnimationFrame(() => el.classList.add('show'));
}

/* ===== LOAD STUDENT FOR EDIT ===== */
function openIUP() {
  document.getElementById('showMenuWrap').classList.remove('open');
  const s = _currentStudent;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
  set('iup-fio',        s ? s.fio : '—');
  set('iup-fio2',       s?.fields ? (s.fields.f_last||'') + ' ' + (s.fields.f_first||'') + ' ' + (s.fields.f_mid||'') : '—');
  set('iup-degree',     s?.fields?.edu_degree || 'Бакалавр');
  set('iup-transcript', '—');
  set('iup-group',      s?.specialty || '—');
  set('iup-op-code',    s?.specialty || '—');
  set('iup-op',         s?.specialization || '—');
  set('iup-op-name',    s?.specialization || '—');
  set('iup-form',       s?.fields?.edu_form || 'Бакалавриат очная первое высшее образование, 4 г.');
  set('iup-course',     '1');
  set('iup-lang',       s?.fields?.edu_lang || 'Казахский');
  set('iup-year',       '2025 – 2026 учебный год');
  set('iup-footer-fio', s ? s.fio : '—');

  // Ищем учебный план студента
  const journal = JSON.parse(localStorage.getItem('yuedu_journal') || '[]');
  const specVal = s?.fields?.edu_specialty || '';
  const opVal   = s?.fields?.edu_op        || '';
  const grpVal  = s?.fields?.edu_group     || '';

  const entry = journal.find(e => {
    const specMatch = !specVal || e.spec === specVal;
    const opMatch   = !opVal   || e.op   === opVal;
    const grpMatch  = !grpVal  || e.group.toLowerCase() === grpVal.toLowerCase();
    return specMatch && opMatch && grpMatch;
  });

  // Загружаем сохранённые оценки
  const studentId = window._editStudentId || 'new';
  const grades    = JSON.parse(localStorage.getItem('yuedu_grades') || '{}');
  const savedGrades = entry ? (grades[`${studentId}_${entry.id}`] || {}) : {};

  const tbody = document.getElementById('iupTableBody');
  let html = '';

  if (!entry) {
    html = `<tr><td colspan="10" style="text-align:center;padding:20px;color:#9ca3af">Учебный план не найден для данного студента</td></tr>`;
  } else {
    const disciplines = entry.disciplines || [];
    const practices   = entry.practices   || [];
    const totalCredits = [...disciplines, ...practices].reduce((acc, d) => acc + (parseInt(d.credits) || 0), 0);
    let num = 1;

    html += `<tr class="iup-period-row"><td colspan="10">1 Курс обучения 2025-2026 учебный год</td></tr>`;

    function buildItemRows(items, sectionKey) {
      if (!items.length) return '';
      let out = `<tr class="iup-period-row"><td colspan="10">${sectionKey}</td></tr>`;
      items.forEach((d, i) => {
        const name  = d.name_ru || d.name_kz || d.name_en || '—';
        const gr    = savedGrades[`${i}_${sectionKey}`] || {};
        const types = (d.class_types || []).filter(ct => ct.type || ct.hours);
        const rows  = types.length || 1;

        if (rows === 1) {
          const ct = types[0] || {};
          out += `<tr class="iup-course-row">
            <td>${num++}</td>
            <td>${d.component || '—'}</td>
            <td>${d.code      || '—'}</td>
            <td>${name}</td>
            <td>${d.credits   || '—'}</td>
            <td>${ct.type     || '—'}</td>
            <td>${d.teacher   || '—'}</td>
            <td>${ct.hours    || '—'}</td>
            <td>${d.control   || '—'}</td>
            <td>${gr.let      || '—'}</td>
          </tr>`;
        } else {
          types.forEach((ct, ci) => {
            out += `<tr class="iup-course-row">`;
            if (ci === 0) {
              out += `<td rowspan="${rows}">${num++}</td>`;
              out += `<td rowspan="${rows}">${d.component || '—'}</td>`;
              out += `<td rowspan="${rows}">${d.code      || '—'}</td>`;
              out += `<td rowspan="${rows}">${name}</td>`;
              out += `<td rowspan="${rows}">${d.credits   || '—'}</td>`;
            }
            out += `<td>${ct.type  || '—'}</td>`;
            if (ci === 0) {
              out += `<td rowspan="${rows}">${d.teacher || '—'}</td>`;
            }
            out += `<td>${ct.hours || '—'}</td>`;
            if (ci === 0) {
              out += `<td rowspan="${rows}">${d.control || '—'}</td>`;
              out += `<td rowspan="${rows}">${gr.let    || '—'}</td>`;
            }
            out += `</tr>`;
          });
        }
      });
      return out;
    }

    html += buildItemRows(disciplines, 'ДИСЦИПЛИНЫ');
    html += buildItemRows(practices,   'ПРАКТИКА');

    html += `<tr class="iup-total-row"><td colspan="4">Общее количество кредитов</td><td>${totalCredits}</td><td colspan="5"></td></tr>`;
    html += `<tr class="iup-total-row"><td colspan="4">Общее количество кредитов за курс</td><td>${totalCredits}</td><td colspan="5"></td></tr>`;
    html += `<tr class="iup-total-row"><td colspan="4">Общее количество кредитов теоретического и практического обучения</td><td>${totalCredits}</td><td colspan="5"></td></tr>`;
  }

  tbody.innerHTML = html;
  closeCertModal();
  document.getElementById('gradeModal')?.classList.remove('open');
  document.getElementById('iupModal').classList.add('open');
  lucide.createIcons();
}

function closeIUP() {
  document.getElementById('iupModal').classList.remove('open');
}

function openIUPWindow() {
  openIUP();
  let content = document.getElementById('iupDocument').innerHTML;
  closeIUP();

  const pageBase = new URL('../../', window.location.href).href;
  content = content.replace(/src="\.\.\/\.\.\//g, `src="${pageBase}`);

  const styles = [...document.styleSheets].map(ss => {
    try { return [...ss.cssRules].map(r => r.cssText).join('\n'); }
    catch { return ''; }
  }).join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Индивидуальный учебный план</title>
  <style>
    ${styles}
    @page { margin: 0mm; size: A4 landscape; }
    body { background: #e5e7eb; margin: 0; padding: 0; font-family: 'Times New Roman', serif; }
    .iup-win-bar { position:fixed !important; bottom:24px !important; right:24px !important; display:flex !important; align-items:center !important; gap:8px !important; z-index:9999 !important; }
    .iup-win-bar button { all:unset; display:inline-block !important; padding:8px 18px !important; border-radius:6px !important; font-size:13px !important; line-height:1.4 !important; cursor:pointer !important; border:1px solid #d1d5db !important; white-space:nowrap !important; box-shadow:0 2px 8px rgba(0,0,0,.15) !important; }
    .iup-win-bar .btn-p { background:#1d4ed8 !important; color:#fff !important; border-color:#1d4ed8 !important; }
    .iup-win-bar .btn-c { background:#fff !important; color:#374151 !important; }
    .iup-win-bar .btn-p:hover { background:#1e40af !important; }
    .iup-win-bar .btn-c:hover { background:#f9fafb !important; }
    .iup-doc-wrap { background:#fff; max-width:1200px; margin:24px auto; padding:32px; box-shadow:0 1px 4px rgba(0,0,0,.12); }
    @media print {
      @page { margin: 0mm; }
      body > * { display: revert !important; }
      .iup-win-bar { display: none !important; }
      body { background: #fff !important; padding: 1.5cm !important; margin: 0 !important; }
      .iup-doc-wrap { margin: 0 !important; padding: 0 !important; box-shadow: none !important; max-width: none !important; }
    }
  </style>
</head>
<body>
  <div class="iup-win-bar">
    <button class="btn-p" onclick="window.print()">Печать / Скачать PDF</button>
    <button class="btn-c" onclick="window.close()">Закрыть</button>
  </div>
  <div class="iup-doc-wrap">
    <div class="iup-document">${content}</div>
  </div>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  window.open(URL.createObjectURL(blob), '_blank');
}

function menuAlert(name) {
  document.getElementById('showMenuWrap').classList.remove('open');
  if (name === 'Индивидуальный учебный план') { openIUPWindow(); return; }
  alert(name + ' — в разработке');
}

function openAcadCalendar() {
  document.getElementById('showMenuWrap').classList.remove('open');

  const s = window._currentStudent;
  const faculty = s?.fields?.edu_faculty || '';

  const calendars = JSON.parse(localStorage.getItem('yuedu_calendar') || '[]');
  const matched = faculty
    ? calendars.filter(c => c.faculty === faculty)
    : calendars;

  if (!matched.length) {
    const dest = '../schedule/' + (faculty ? '?faculty=' + encodeURIComponent(faculty) : '');
    window.open(dest, '_blank');
    return;
  }

  const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  function fmtDate(iso) {
    if (!iso) return '';
    const [, m, d] = iso.split('-');
    return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`;
  }
  function fmtRange(s, e) {
    if (s && e) return `${fmtDate(s)}–${fmtDate(e)}`;
    return fmtDate(s) || fmtDate(e) || '';
  }
  function cr(label, val) {
    if (!val) return '';
    return `<div class="cal-row"><span>${label}</span><span><b>${val}</b></span></div>`;
  }
  function semDoc(title, sem, type) {
    if (!sem) return '';
    let body = '';
    if (sem.theor_start || sem.theor_end) {
      body += `<div class="cal-sec"><div class="cal-sec-t">Теоретическое обучение</div>`;
      body += cr('Начало семестра', fmtDate(sem.theor_start));
      body += cr('Конец семестра',  fmtDate(sem.theor_end));
      body += cr('Всего недель',    sem.theor_weeks);
      body += `</div>`;
    }
    if (sem.reg_start) { body += `<div class="cal-sec"><div class="cal-sec-t">Регистрация</div>${cr('Ориентационная неделя', fmtRange(sem.reg_start, sem.reg_end))}</div>`; }
    if (sem.rk1_start || sem.rk2_start) {
      body += `<div class="cal-sec"><div class="cal-sec-t">Рубежные контроли</div>`;
      body += cr('Рубежный контроль 1', fmtRange(sem.rk1_start, sem.rk1_end));
      body += cr('Рубежный контроль 2', fmtRange(sem.rk2_start, sem.rk2_end));
      body += `</div>`;
    }
    if (sem.session_start) {
      const lbl = type === 'winter' ? 'Зимняя сессия' : 'Экзаменационная сессия';
      body += `<div class="cal-sec"><div class="cal-sec-t">Сессия</div>${cr(lbl, fmtRange(sem.session_start, sem.session_end))}</div>`;
    }
    if (sem.practices?.length) {
      body += `<div class="cal-sec"><div class="cal-sec-t">Практика</div>`;
      sem.practices.forEach(p => {
        body += cr(p.name || 'Практика', fmtRange(p.period_start, p.period_end));
        body += cr('Начало периода выставления итоговой оценки', fmtDate(p.grade_start));
        body += cr('Конец периода выставления итоговой оценки',  fmtDate(p.grade_end));
      });
      body += `</div>`;
    }
    if (sem.hol_start) {
      const lbl = type === 'winter' ? 'Зимние каникулы' : 'Летние каникулы';
      body += `<div class="cal-sec">${cr(lbl, fmtRange(sem.hol_start, sem.hol_end))}</div>`;
    }
    if (!body) return '';
    return `<div class="sem-hdr">${title}</div>` + body;
  }

  const docsHtml = matched.map(c => {
    let body = `
      <div class="doc-hdr">
        <div class="doc-side">НАО Каспийский университет технологий и инжиниринга им. Ш.Есенова</div>
        <div><img src="../../assets/img/logo.png" style="height:52px"></div>
        <div class="doc-side" style="text-align:right">Ш.Есенов атындағы Каспий технологиялар және инжиниринг университеті КеАК</div>
      </div>
      <hr>
      <div class="doc-title">Академический календарь<br>на ${c.year} учебный год<br>${c.faculty} (${c.year} учебный год) / ${c.course} курс</div>`;
    body += semDoc('Осенний семестр (1 семестр)', c.s1, 'winter');
    body += semDoc('Весенний семестр (2 семестр)', c.s2, 'spring');
    if (c.s3?.start) {
      body += `<div class="sem-hdr">Летний учебный период</div>`;
      body += `<div class="cal-sec"><div class="cal-sec-t">Учебный период</div>${cr('Начало', fmtDate(c.s3.start))}${cr('Конец', fmtDate(c.s3.end))}${cr('Всего недель', c.s3.weeks)}</div>`;
    }
    return `<div class="doc-wrap">${body}</div>`;
  }).join('<div style="height:32px"></div>');

  const pageBase = new URL('../../', window.location.href).href;
  const calHtml = `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8">
  <title>Академический календарь</title>
  <style>
    @page { margin: 0mm; size: A4 portrait; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; font-size: 11pt; background: #e5e7eb; padding: 20px; }
    .cal-win-bar { position: fixed; bottom: 20px; right: 20px; display: flex; gap: 8px; z-index: 9999; }
    .cal-win-bar button { padding: 8px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; border: 1px solid #d1d5db; box-shadow: 0 2px 6px rgba(0,0,0,.15); font-family: sans-serif; }
    .btn-p { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
    .btn-c { background: #fff; color: #374151; }
    .doc-wrap { background: #fff; max-width: 800px; margin: 0 auto 32px; padding: 40px; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
    .doc-hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .doc-side { font-size: 9pt; max-width: 220px; line-height: 1.4; }
    hr { border: none; border-top: 2px solid #000; margin: 8px 0 20px; }
    .doc-title { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 20px; line-height: 1.6; }
    .sem-hdr { font-weight: bold; font-size: 12pt; margin: 20px 0 8px; border-bottom: 1px solid #aaa; padding-bottom: 3px; }
    .cal-sec { margin-bottom: 12px; }
    .cal-sec-t { font-weight: bold; margin-bottom: 4px; }
    .cal-row { display: flex; justify-content: space-between; padding: 1px 0; }
    @media print {
      @page { margin: 0mm; }
      .cal-win-bar { display: none !important; }
      body { background: #fff !important; padding: 0 !important; }
      .doc-wrap { box-shadow: none; max-width: none; padding: 1.5cm; }
    }
  </style>
</head><body>
  <div class="cal-win-bar">
    <button class="btn-p" onclick="window.print()">Печать / PDF</button>
    <button class="btn-c" onclick="window.close()">Закрыть</button>
  </div>
  ${docsHtml.replace(/src="\.\.\/\.\.\//g, `src="${pageBase}`)}
</body></html>`;
  const blob = new Blob([calHtml], { type: 'text/html;charset=utf-8' });
  window.open(URL.createObjectURL(blob), '_blank');
}

function openTranscript() {
  document.getElementById('showMenuWrap').classList.remove('open');
  const s = window._currentStudent;
  const journal = JSON.parse(localStorage.getItem('yuedu_journal') || '[]');

  const specVal = s?.fields?.edu_specialty || '';
  const opVal   = s?.fields?.edu_op        || '';
  const grpVal  = s?.fields?.edu_group     || '';

  const entry = journal.find(e => {
    const specMatch = !specVal || e.spec === specVal;
    const opMatch   = !opVal   || e.op   === opVal;
    const grpMatch  = !grpVal  || e.group.toLowerCase() === grpVal.toLowerCase();
    return specMatch && opMatch && grpMatch;
  });

  if (!entry) {
    alert('Учебный план не найден для данного студента.\nПроверьте совпадение Специализации, Специальности и Группы.');
    return;
  }

  const studentId = window._editStudentId || 'new';
  const grades = JSON.parse(localStorage.getItem('yuedu_grades') || '{}');
  const saved  = grades[`${studentId}_${entry.id}`] || {};

  function buildRows(items, sectionLabel) {
    if (!items.length) return { rowsHtml: '', credits: 0, gpaSum: 0, gpaCredits: 0 };
    let rowsHtml = `<tr class="tr-section-row"><td colspan="7">${sectionLabel}</td></tr>`;
    let credits = 0, gpaSum = 0, gpaCredits = 0;
    items.forEach((d, i) => {
      const name = d.name_ru || d.name_kz || d.name_en || d.name || '—';
      const cr   = parseInt(d.credits) || 0;
      const g    = saved[`${i}_${sectionLabel}`] || {};
      credits += cr;
      const gpaNum = parseFloat(g.gpa);
      if (!isNaN(gpaNum)) { gpaSum += gpaNum * cr; gpaCredits += cr; }
      rowsHtml += `<tr>
        <td>${d.code || '—'}</td>
        <td>${name}</td>
        <td class="tr-num">${d.credits || '—'}</td>
        <td class="tr-num">${g.total || '—'}</td>
        <td class="tr-num">${g.gpa   || '—'}</td>
        <td class="tr-num">${g.let   || '—'}</td>
        <td>${g.trad || '—'}</td>
      </tr>`;
    });
    return { rowsHtml, credits, gpaSum, gpaCredits };
  }

  const disc = buildRows(entry.disciplines || [], 'ДИСЦИПЛИНЫ');
  const prac = buildRows(entry.practices   || [], 'ПРАКТИКА');
  const totalCredits = disc.credits + prac.credits;
  const gpaCredits    = disc.gpaCredits + prac.gpaCredits;
  const gpaSum        = disc.gpaSum + prac.gpaSum;
  const overallGpa    = gpaCredits ? (gpaSum / gpaCredits).toFixed(2) : '—';

  const pageBase = new URL('../../', window.location.href).href;
  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8">
  <title>Транскрипт</title>
  <style>
    @page { margin: 0mm; size: A4 portrait; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; font-size: 11pt; background: #e5e7eb; padding: 20px; }
    .tr-win-bar { position: fixed; bottom: 20px; right: 20px; display: flex; gap: 8px; z-index: 9999; }
    .tr-win-bar button { padding: 8px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; border: 1px solid #d1d5db; box-shadow: 0 2px 6px rgba(0,0,0,.15); font-family: sans-serif; }
    .btn-p { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
    .btn-c { background: #fff; color: #374151; }
    .doc-wrap { background: #fff; max-width: 900px; margin: 0 auto 32px; padding: 40px; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
    .doc-hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .doc-side { font-size: 9pt; max-width: 220px; line-height: 1.4; }
    hr { border: none; border-top: 2px solid #000; margin: 8px 0 20px; }
    .doc-title { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 20px; line-height: 1.6; }
    .tr-info { margin-bottom: 20px; }
    .tr-info-row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #ccc; font-size: 10.5pt; }
    .tr-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 16px; }
    .tr-table th, .tr-table td { border: 1px solid #000; padding: 5px 7px; }
    .tr-table th { background: #f3f4f6; font-size: 9pt; }
    .tr-num { text-align: center; }
    .tr-section-row td { background: #eef2ff; font-weight: bold; text-align: center; }
    .tr-summary { display: flex; justify-content: space-between; font-weight: bold; font-size: 11pt; margin-bottom: 24px; }
    .tr-sign { margin-top: 40px; font-size: 10.5pt; }
    .tr-sign-row { display: flex; align-items: flex-end; gap: 10px; margin-bottom: 14px; }
    .tr-sign-line { flex: 1; border-bottom: 1px solid #000; }
    @media print {
      @page { margin: 0mm; }
      .tr-win-bar { display: none !important; }
      body { background: #fff !important; padding: 0 !important; }
      .doc-wrap { box-shadow: none; max-width: none; padding: 1.5cm; }
    }
  </style>
</head><body>
  <div class="tr-win-bar">
    <button class="btn-p" onclick="window.print()">Печать / PDF</button>
    <button class="btn-c" onclick="window.close()">Закрыть</button>
  </div>
  <div class="doc-wrap">
    <div class="doc-hdr">
      <div class="doc-side">НАО Каспийский университет технологий и инжиниринга им. Ш.Есенова</div>
      <div><img src="${pageBase}assets/img/logo.png" style="height:52px"></div>
      <div class="doc-side" style="text-align:right">Ш.Есенов атындағы Каспий технологиялар және инжиниринг университеті КеАК</div>
    </div>
    <hr>
    <div class="doc-title">Транскрипт (академическая справка)</div>
    <div class="tr-info">
      <div class="tr-info-row"><span>Обучающийся</span><b>${s?.fio || '—'}</b></div>
      <div class="tr-info-row"><span>Факультет</span><b>${entry.faculty || '—'}</b></div>
      <div class="tr-info-row"><span>Специальность / ОП</span><b>${entry.spec || '—'} / ${entry.op || '—'}</b></div>
      <div class="tr-info-row"><span>Группа</span><b>${entry.group || '—'}</b></div>
    </div>
    <table class="tr-table">
      <thead>
        <tr>
          <th>Код</th>
          <th>Название дисциплины</th>
          <th>Кредиты</th>
          <th>Итого (%)</th>
          <th>GPA</th>
          <th>Букв.</th>
          <th>Традиц.</th>
        </tr>
      </thead>
      <tbody>
        ${disc.rowsHtml}
        ${prac.rowsHtml}
      </tbody>
    </table>
    <div class="tr-summary">
      <span>Общее количество кредитов: ${totalCredits}</span>
      <span>Средний балл (GPA): ${overallGpa}</span>
    </div>
    <div class="tr-sign">
      <div class="tr-sign-row"><span>Регистратор:</span><span class="tr-sign-line"></span><span>«___» _____________ 20__ г.</span></div>
      <div class="tr-sign-row"><span>М.П.</span><span class="tr-sign-line"></span></div>
    </div>
  </div>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  window.open(URL.createObjectURL(blob), '_blank');
}

function openCertModal() {
  document.getElementById('showMenuWrap').classList.remove('open');
  closeIUP();
  document.getElementById('gradeModal')?.classList.remove('open');
  document.getElementById('certMdInput').value = '';
  const modal = document.getElementById('certModal');
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  setTimeout(() => document.getElementById('certMdInput').focus(), 50);
}

function closeCertModal() {
  document.getElementById('certModal').style.display = 'none';
}

function saveCertAndOpen() {
  const mdNumber = document.getElementById('certMdInput').value.trim();
  if (!mdNumber) { alert('Введите номер MD'); return; }

  const s = _currentStudent;
  if (!s) { alert('Студент не найден'); return; }

  const certs = JSON.parse(localStorage.getItem('yuedu_certs') || '[]');
  const existing = certs.find(c => c.studentId === s.id && c.certView);

  const certData = {
    id: existing ? existing.id : Date.now(),
    studentId: s.id,
    studentFio: s.fio,
    type: 'Академический',
    name: 'Куәлік магистр дипломына',
    number: mdNumber,
    org: 'ЮГУ им. Ш.Есенова',
    dateIssue: new Date().toISOString().split('T')[0],
    dateExpiry: '',
    note: '',
    certView: true,
  };

  if (existing) {
    const idx = certs.findIndex(c => c.id === existing.id);
    certs[idx] = certData;
  } else {
    certs.push(certData);
  }
  localStorage.setItem('yuedu_certs', JSON.stringify(certs));

  window.location.href = '../cert-view/?certId=' + certData.id;
}

function toggleShowMenu() {
  document.getElementById('showMenuWrap').classList.toggle('open');
}
document.addEventListener('click', function(e) {
  if (!e.target.closest('#showMenuWrap')) {
    const wrap = document.getElementById('showMenuWrap');
    if (wrap) wrap.classList.remove('open');
  }
});

function deleteStudent() {
  document.getElementById('showMenuWrap').classList.remove('open');
  const id = window._editStudentId;
  if (!id) return;
  if (!confirm('Удалить обучающегося?')) return;
  const students = JSON.parse(localStorage.getItem('yuedu_students') || '[]');
  localStorage.setItem('yuedu_students', JSON.stringify(students.filter(s => s.id !== id)));
  window.location.href = '../students/';
}

function openEditStudent() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id) {
    window.location.href = '../add-student/?id=' + id;
  } else {
    window.location.href = '../add-student/';
  }
}

(function loadStudentIfEdit() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  if (!id) return;

  const students = JSON.parse(localStorage.getItem('yuedu_students') || '[]');
  const s = students.find(x => x.id === id);
  if (!s) return;

  window._editStudentId = id;
  window._currentStudent = s;

  // Обновляем breadcrumb
  const bc = document.getElementById('bc-student-name');
  if (bc) bc.textContent = s.fio || 'Обучающийся';

  const title = document.querySelector('.page-title');
  if (title) title.textContent = s.fio || 'Обучающийся';

  // Восстанавливаем все поля
  initEduPanel();
  if (s.fields) {
    restoreAllFields(s.fields);
  } else {
    // fallback для старых записей
    const set = (elId, val) => { const el = document.getElementById(elId); if (el && val) el.value = val; };
    if (s.fio) {
      const parts = s.fio.trim().split(' ');
      set('f_last',  parts[0] || '');
      set('f_first', parts[1] || '');
      if (parts[2]) set('f_mid', parts[2].replace('.', ''));
    }
    set('f_iin', s.iin);
    set('f_dob', s.dob);
    set('edu_date_in', s.dateIn);
  }
})();

initEduPanel();
lucide.createIcons();

/* ===== GRADE JOURNAL ===== */
const GRADE_SCALE = [
  {min:95, gpa:'4.0',  let:'A',  trad:'Отлично'},
  {min:90, gpa:'3.67', let:'A-', trad:'Отлично'},
  {min:85, gpa:'3.33', let:'B+', trad:'Хорошо'},
  {min:80, gpa:'3.0',  let:'B',  trad:'Хорошо'},
  {min:75, gpa:'2.67', let:'B-', trad:'Хорошо'},
  {min:70, gpa:'2.33', let:'C+', trad:'Удовлетворительно'},
  {min:65, gpa:'2.0',  let:'C',  trad:'Удовлетворительно'},
  {min:60, gpa:'1.67', let:'C-', trad:'Удовлетворительно'},
  {min:55, gpa:'1.33', let:'D+', trad:'Удовлетворительно'},
  {min:50, gpa:'1.0',  let:'D',  trad:'Удовлетворительно'},
  {min:0,  gpa:'0',    let:'F',  trad:'Неудовлетворительно'},
];

function gradeFromPct(pct) {
  const p = parseFloat(pct);
  if (isNaN(p)) return {gpa:'—', let:'—', trad:'—'};
  return GRADE_SCALE.find(g => p >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

let _gradeJournalId = null;

function openGradeJournal() {
  document.getElementById('showMenuWrap').classList.remove('open');
  const s = window._currentStudent;
  const journal = JSON.parse(localStorage.getItem('yuedu_journal') || '[]');

  // edu_specialty = М078 (spec), edu_op = 7М04201 (op)
  const specVal = s?.fields?.edu_specialty || document.getElementById('edu_specialty')?.value || '';
  const opVal   = s?.fields?.edu_op        || document.getElementById('edu_op')?.value        || '';
  const grpVal  = s?.fields?.edu_group     || document.getElementById('edu_group')?.value     || '';

  const entry = journal.find(e => {
    const specMatch = !specVal || e.spec === specVal;
    const opMatch   = !opVal   || e.op   === opVal;
    const grpMatch  = !grpVal  || e.group.toLowerCase() === grpVal.toLowerCase();
    return specMatch && opMatch && grpMatch;
  });

  if (!entry) {
    alert('Учебный план не найден для данного студента.\nПроверьте совпадение Специализации, Специальности и Группы.');
    return;
  }

  _gradeJournalId = entry.id;
  const studentId = window._editStudentId || 'new';
  const grades = JSON.parse(localStorage.getItem('yuedu_grades') || '{}');
  const gKey = `${studentId}_${entry.id}`;
  const saved = grades[gKey] || {};

  document.getElementById('gradeModalSub').textContent =
    `${s?.fio || '—'}  ·  ${entry.faculty || '—'}  ·  ${entry.spec} / ${entry.op}  ·  ${entry.group}`;

  function buildRows(items, sectionLabel) {
    if (!items.length) return '';
    let html = `<tr class="gj-section-row"><td colspan="8">${sectionLabel}</td></tr>`;
    items.forEach((d, i) => {
      const dname = d.name_ru || d.name_kz || d.name_en || d.name || '—';
      const rkey = `${i}_${sectionLabel}`;
      const safeId = rkey.replace(/[^a-zA-Z0-9]/g,'_');
      const g = saved[rkey] || {};
      html += `<tr>
        <td>${dname}</td>
        <td class="gj-num">${d.credits || '—'}</td>
        <td><input class="gj-input" type="number" min="0" max="100" placeholder="%" data-rkey="${rkey}" data-field="avg" value="${g.avg||''}" oninput="recalcRow(this)"></td>
        <td><input class="gj-input" type="number" min="0" max="100" placeholder="%" data-rkey="${rkey}" data-field="exam" value="${g.exam||''}" oninput="recalcRow(this)"></td>
        <td class="gj-num gj-calc" id="gj_total_${safeId}">${g.total||'—'}</td>
        <td class="gj-num gj-calc" id="gj_gpa_${safeId}">${g.gpa||'—'}</td>
        <td class="gj-num gj-calc" id="gj_let_${safeId}">${g.let||'—'}</td>
        <td class="gj-calc" id="gj_trad_${safeId}">${g.trad||'—'}</td>
      </tr>`;
    });
    return html;
  }

  document.getElementById('gradeModalContent').innerHTML = `
    <table class="gj-table">
      <thead>
        <tr>
          <th>ДИСЦИПЛИНА</th>
          <th class="gj-num">КР.</th>
          <th class="gj-num">РБК СР.<br>(%)</th>
          <th class="gj-num">ЭКЗАМЕН<br>(%)</th>
          <th class="gj-num">ИТОГО<br>(%)</th>
          <th class="gj-num">ЦИФР.</th>
          <th class="gj-num">БУКВ.</th>
          <th>ТРАДИЦ.</th>
        </tr>
      </thead>
      <tbody>
        ${buildRows(entry.disciplines || [], 'ДИСЦИПЛИНЫ')}
        ${buildRows(entry.practices   || [], 'ПРАКТИКА')}
      </tbody>
    </table>`;

  document.getElementById('gradeModal').classList.add('open');
  lucide.createIcons();
}

function recalcRow(input) {
  const rkey = input.dataset.rkey;
  const safeId = rkey.replace(/[^a-zA-Z0-9]/g,'_');
  const row = input.closest('tr');
  const avg  = parseFloat(row.querySelector('[data-field="avg"]')?.value);
  const exam = parseFloat(row.querySelector('[data-field="exam"]')?.value);
  if (!isNaN(avg) && !isNaN(exam)) {
    const total = Math.floor(avg * 0.6 + exam * 0.4);
    const gr = gradeFromPct(total);
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl(`gj_total_${safeId}`, total + '%');
    setEl(`gj_gpa_${safeId}`,   gr.gpa);
    setEl(`gj_let_${safeId}`,   gr.let);
    setEl(`gj_trad_${safeId}`,  gr.trad);
  }
}

function saveGrades() {
  const studentId = window._editStudentId || 'new';
  const gKey = `${studentId}_${_gradeJournalId}`;
  const grades = JSON.parse(localStorage.getItem('yuedu_grades') || '{}');
  if (!grades[gKey]) grades[gKey] = {};

  document.querySelectorAll('.gj-input').forEach(input => {
    const rkey = input.dataset.rkey;
    const safeId = rkey.replace(/[^a-zA-Z0-9]/g,'_');
    if (!grades[gKey][rkey]) grades[gKey][rkey] = {};
    grades[gKey][rkey][input.dataset.field] = input.value;
    const totalEl = document.getElementById(`gj_total_${safeId}`);
    const gpaEl   = document.getElementById(`gj_gpa_${safeId}`);
    const letEl   = document.getElementById(`gj_let_${safeId}`);
    const tradEl  = document.getElementById(`gj_trad_${safeId}`);
    if (totalEl) grades[gKey][rkey].total = totalEl.textContent;
    if (gpaEl)   grades[gKey][rkey].gpa   = gpaEl.textContent;
    if (letEl)   grades[gKey][rkey].let   = letEl.textContent;
    if (tradEl)  grades[gKey][rkey].trad  = tradEl.textContent;
  });

  localStorage.setItem('yuedu_grades', JSON.stringify(grades));
  closeGradeJournal();
}

function closeGradeJournal() {
  document.getElementById('gradeModal').classList.remove('open');
}

function closeGradeJournalOutside(e) {
  if (e.target === document.getElementById('gradeModal')) closeGradeJournal();
}

/* ===== PRINT IUP ===== */
function printIUP() {
  const content = document.getElementById('iupDocument').innerHTML;

  // Собираем все стили страницы
  const styles = [...document.styleSheets].map(ss => {
    try {
      return [...ss.cssRules].map(r => r.cssText).join('\n');
    } catch { return ''; }
  }).join('\n');

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Индивидуальный учебный план</title>
  <style>
    ${styles}
    @page { margin: 1.5cm; }
    body { margin: 0; font-family: 'Times New Roman', serif; background: #fff; }
    .iup-document { padding: 0; }
  </style>
</head>
<body>
  <div class="iup-document">${content}</div>
  <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }<\/script>
</body>
</html>`);
  win.document.close();
}

/* ===== FACULTY SELECT ===== */
(async function loadFacultySelect() {
  const API_KEY = 'a3f8c2d1e9b74056f2a1c8d3e7f0b9a2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0';
  const sel = document.getElementById('edu_faculty');
  if (!sel) return;
  try {
    const res = await fetch('https://api-platonus.yu.edu.kz/api/v1/faculties/', {
      headers: { 'accept': 'application/json', 'x-api-key': API_KEY }
    });
    const data = await res.json();
    const items = data.items || [];
    sel.innerHTML = '';
    sel.appendChild(new Option('— Выберите факультет —', ''));
    items.forEach(f => {
      const name = f.nameRU || f.nameKZ || '';
      if (name) sel.appendChild(new Option(name, name));
    });
    const s = window._currentStudent;
    if (s?.fields?.edu_faculty) sel.value = s.fields.edu_faculty;
  } catch {
    sel.innerHTML = '';
    sel.appendChild(new Option('— Ошибка загрузки —', ''));
  }
})();
