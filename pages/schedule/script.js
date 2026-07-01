const CAL_KEY = 'yuedu_calendar';
const API_KEY = 'a3f8c2d1e9b74056f2a1c8d3e7f0b9a2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0';
const MONTHS  = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

let allCalendars = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initFaculties();
  allCalendars = JSON.parse(localStorage.getItem(CAL_KEY) || '[]');
  renderTable(allCalendars);
});

/* ===== DATE HELPERS ===== */
function fmtDate(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`;
}
function fmtRange(s, e) {
  if (s && e) return `${fmtDate(s)}–${fmtDate(e)}`;
  return fmtDate(s) || fmtDate(e) || '';
}
function autoWeeks(prefix) {
  const s = gv(prefix === 's3' ? 's3_start' : `${prefix}_theor_start`);
  const e = gv(prefix === 's3' ? 's3_end'   : `${prefix}_theor_end`);
  const wId = prefix === 's3' ? 's3_weeks' : `${prefix}_theor_weeks`;
  if (s && e) {
    const weeks = Math.round((new Date(e) - new Date(s)) / (7 * 864e5));
    const el = document.getElementById(wId);
    if (el && weeks > 0) el.value = weeks;
  }
}

/* ===== FACULTY (один запрос, кэш) ===== */
let _faculties = [];

async function initFaculties() {
  try {
    const res  = await fetch('https://api-platonus.yu.edu.kz/api/v1/faculties/', {
      headers: { accept: 'application/json', 'x-api-key': API_KEY }
    });
    const data = await res.json();
    _faculties = (data.items || data || []).map(f => f.nameRU || f.nameKZ || '').filter(Boolean);
  } catch { _faculties = []; }

  const filter = document.getElementById('filterFaculty');
  filter.innerHTML = '<option value="">Все</option>';
  _faculties.forEach(n => filter.appendChild(new Option(n, n)));

  const modal = document.getElementById('m_faculty');
  modal.innerHTML = '<option value="">— Выберите —</option>';
  _faculties.forEach(n => modal.appendChild(new Option(n, n)));
}

/* ===== FILTERS ===== */
function applyFilters() {
  const year   = document.getElementById('filterYear').value;
  const course = document.getElementById('filterCourse').value;
  const fac    = document.getElementById('filterFaculty').value;
  renderTable(allCalendars.filter(c =>
    (!year   || c.year    === year)   &&
    (!course || c.course  === course) &&
    (!fac    || c.faculty === fac)
  ));
}

/* ===== TABLE ===== */
function renderTable(list) {
  document.getElementById('foundCount').textContent = list.length;
  const tbody = document.getElementById('calTableBody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:32px">Нет данных</td></tr>';
    return;
  }
  tbody.innerHTML = list.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.faculty || '—'}</td>
      <td>${c.course ? c.course + ' курс' : '—'}</td>
      <td>${c.year || '—'}</td>
      <td>${countSems(c)}</td>
      <td><div style="display:flex;gap:6px">
        <button class="tbl-btn" onclick="viewCalendar(${c.id})" title="Просмотр"><i data-lucide="eye" style="width:14px;height:14px"></i></button>
        <button class="tbl-btn" onclick="editCalendar(${c.id})" title="Редактировать"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
        <button class="tbl-btn tbl-btn--del" onclick="deleteCalendar(${c.id})" title="Удалить"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
      </div></td>
    </tr>`).join('');
  lucide.createIcons();
}
function countSems(c) {
  return [c.s1?.theor_start, c.s2?.theor_start, c.s3?.start].filter(Boolean).length || '—';
}

/* ===== MODAL ===== */
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Добавить академический календарь';
  clearModal();
  switchSemTab(0);
  document.getElementById('addModal').classList.add('open');
  lucide.createIcons();
}
function closeAddModal(e) {
  if (e && e.target !== document.getElementById('addModal')) return;
  document.getElementById('addModal').classList.remove('open');
}
function clearModal() {
  ['s1_theor_start','s1_theor_end','s1_theor_weeks',
   's1_reg_start','s1_reg_end',
   's1_rk1_start','s1_rk1_end','s1_rk2_start','s1_rk2_end',
   's1_session_start','s1_session_end',
   's1_hol_start','s1_hol_end',
   's2_theor_start','s2_theor_end','s2_theor_weeks',
   's2_reg_start','s2_reg_end',
   's2_rk1_start','s2_rk1_end','s2_rk2_start','s2_rk2_end',
   's2_session_start','s2_session_end',
   's2_hol_start','s2_hol_end',
   's3_start','s3_end','s3_weeks',
   's3_reg_start','s3_reg_end',
   's3_rk1_start','s3_rk1_end','s3_rk2_start','s3_rk2_end',
   's3_session_start','s3_session_end'
  ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('s1_practices').innerHTML = '';
  document.getElementById('s2_practices').innerHTML = '';
  document.getElementById('m_year').value = '2025-2026';
  document.getElementById('m_course').value = '1';
  document.getElementById('m_faculty').value = '';
}
function switchSemTab(idx) {
  document.querySelectorAll('.sem-tab').forEach((t, i)  => t.classList.toggle('active', i === idx));
  document.querySelectorAll('.sem-panel').forEach((p, i) => p.classList.toggle('active', i === idx));
}

/* ===== PRACTICE ROWS ===== */
function addPracticeRow(containerId, data = {}) {
  const wrap = document.getElementById(containerId);
  const div  = document.createElement('div');
  div.className = 'practice-row';
  div.innerHTML = `
    <div class="practice-fields">
      <div class="sem-field practice-name">
        <label>Название практики</label>
        <input type="text" class="pr_name" value="${data.name || ''}" placeholder="Педагогическая практика">
      </div>
      <div class="sem-field range-field">
        <label>Период практики</label>
        <div class="range-inputs">
          <input type="date" class="pr_period_start" value="${data.period_start || ''}">
          <span class="range-sep">–</span>
          <input type="date" class="pr_period_end" value="${data.period_end || ''}">
        </div>
      </div>
      <div class="sem-field">
        <label>Начало выставления оценки</label>
        <input type="date" class="pr_grade_start" value="${data.grade_start || ''}">
      </div>
      <div class="sem-field">
        <label>Конец выставления оценки</label>
        <input type="date" class="pr_grade_end" value="${data.grade_end || ''}">
      </div>
    </div>
    <button class="practice-del" onclick="this.closest('.practice-row').remove()">
      <i data-lucide="x" style="width:13px;height:13px"></i>
    </button>`;
  wrap.appendChild(div);
  lucide.createIcons();
}
function collectPractices(containerId) {
  return [...document.querySelectorAll(`#${containerId} .practice-row`)].map(r => ({
    name:         r.querySelector('.pr_name').value.trim(),
    period_start: r.querySelector('.pr_period_start').value,
    period_end:   r.querySelector('.pr_period_end').value,
    grade_start:  r.querySelector('.pr_grade_start').value,
    grade_end:    r.querySelector('.pr_grade_end').value,
  })).filter(p => p.name || p.period_start);
}

/* ===== HELPERS ===== */
function gv(id) { return document.getElementById(id)?.value || ''; }
function sv(id, val) { const el = document.getElementById(id); if (el) el.value = val || ''; }

let _toastTimer;
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
  clearTimeout(_toastTimer);
  requestAnimationFrame(() => {
    el.classList.add('show');
    _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  });
}

/* ===== SAVE ===== */
function saveCalendar() {
  const faculty = gv('m_faculty');
  const facSel  = document.getElementById('m_faculty');
  if (!faculty) {
    facSel.style.border = '2px solid #e11d48';
    facSel.focus();
    setTimeout(() => facSel.style.border = '', 2000);
    return;
  }
  facSel.style.border = '';
  try {

  const entry = {
    id: editingId || Date.now(),
    year:    gv('m_year'),
    course:  gv('m_course'),
    faculty,
    createdAt: new Date().toISOString(),
    s1: {
      theor_start:  gv('s1_theor_start'),
      theor_end:    gv('s1_theor_end'),
      theor_weeks:  gv('s1_theor_weeks'),
      reg_start:    gv('s1_reg_start'),    reg_end:    gv('s1_reg_end'),
      rk1_start:    gv('s1_rk1_start'),   rk1_end:    gv('s1_rk1_end'),
      rk2_start:    gv('s1_rk2_start'),   rk2_end:    gv('s1_rk2_end'),
      session_start:gv('s1_session_start'),session_end:gv('s1_session_end'),
      hol_start:    gv('s1_hol_start'),    hol_end:    gv('s1_hol_end'),
      practices:    collectPractices('s1_practices'),
    },
    s2: {
      theor_start:  gv('s2_theor_start'),
      theor_end:    gv('s2_theor_end'),
      theor_weeks:  gv('s2_theor_weeks'),
      reg_start:    gv('s2_reg_start'),    reg_end:    gv('s2_reg_end'),
      rk1_start:    gv('s2_rk1_start'),   rk1_end:    gv('s2_rk1_end'),
      rk2_start:    gv('s2_rk2_start'),   rk2_end:    gv('s2_rk2_end'),
      session_start:gv('s2_session_start'),session_end:gv('s2_session_end'),
      hol_start:    gv('s2_hol_start'),    hol_end:    gv('s2_hol_end'),
      practices:    collectPractices('s2_practices'),
    },
    s3: {
      start:         gv('s3_start'),         end:         gv('s3_end'),
      weeks:         gv('s3_weeks'),
      reg_start:     gv('s3_reg_start'),     reg_end:     gv('s3_reg_end'),
      rk1_start:     gv('s3_rk1_start'),     rk1_end:     gv('s3_rk1_end'),
      rk2_start:     gv('s3_rk2_start'),     rk2_end:     gv('s3_rk2_end'),
      session_start: gv('s3_session_start'), session_end: gv('s3_session_end'),
    }
  };

  if (editingId) {
    allCalendars = allCalendars.map(c => c.id === editingId ? entry : c);
  } else {
    allCalendars.push(entry);
  }
  localStorage.setItem(CAL_KEY, JSON.stringify(allCalendars));
  document.getElementById('addModal').classList.remove('open');
  applyFilters();
  showToast(editingId ? '✓ Изменения сохранены' : '✓ Календарь добавлен');
  } catch(err) {
    console.error('saveCalendar error:', err);
    showToast('Ошибка: ' + err.message, 'error');
  }
}

/* ===== EDIT ===== */
function editCalendar(id) {
  const c = allCalendars.find(x => x.id === id);
  if (!c) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Редактировать академический календарь';
  clearModal();

  sv('m_year', c.year); sv('m_course', c.course);
  setTimeout(() => sv('m_faculty', c.faculty), 300);

  const s1 = c.s1 || {};
  sv('s1_theor_start', s1.theor_start); sv('s1_theor_end', s1.theor_end); sv('s1_theor_weeks', s1.theor_weeks);
  sv('s1_reg_start', s1.reg_start);     sv('s1_reg_end', s1.reg_end);
  sv('s1_rk1_start', s1.rk1_start);    sv('s1_rk1_end', s1.rk1_end);
  sv('s1_rk2_start', s1.rk2_start);    sv('s1_rk2_end', s1.rk2_end);
  sv('s1_session_start', s1.session_start); sv('s1_session_end', s1.session_end);
  sv('s1_hol_start', s1.hol_start);    sv('s1_hol_end', s1.hol_end);
  (s1.practices || []).forEach(p => addPracticeRow('s1_practices', p));

  const s2 = c.s2 || {};
  sv('s2_theor_start', s2.theor_start); sv('s2_theor_end', s2.theor_end); sv('s2_theor_weeks', s2.theor_weeks);
  sv('s2_reg_start', s2.reg_start);     sv('s2_reg_end', s2.reg_end);
  sv('s2_rk1_start', s2.rk1_start);    sv('s2_rk1_end', s2.rk1_end);
  sv('s2_rk2_start', s2.rk2_start);    sv('s2_rk2_end', s2.rk2_end);
  sv('s2_session_start', s2.session_start); sv('s2_session_end', s2.session_end);
  sv('s2_hol_start', s2.hol_start);    sv('s2_hol_end', s2.hol_end);
  (s2.practices || []).forEach(p => addPracticeRow('s2_practices', p));

  const s3 = c.s3 || {};
  sv('s3_start', s3.start); sv('s3_end', s3.end); sv('s3_weeks', s3.weeks);
  sv('s3_reg_start', s3.reg_start);     sv('s3_reg_end', s3.reg_end);
  sv('s3_rk1_start', s3.rk1_start);    sv('s3_rk1_end', s3.rk1_end);
  sv('s3_rk2_start', s3.rk2_start);    sv('s3_rk2_end', s3.rk2_end);
  sv('s3_session_start', s3.session_start); sv('s3_session_end', s3.session_end);

  switchSemTab(0);
  document.getElementById('addModal').classList.add('open');
  lucide.createIcons();
}

/* ===== DELETE ===== */
function deleteCalendar(id) {
  if (!confirm('Удалить этот академический календарь?')) return;
  allCalendars = allCalendars.filter(c => c.id !== id);
  localStorage.setItem(CAL_KEY, JSON.stringify(allCalendars));
  applyFilters();
}

/* ===== VIEW ===== */
function viewCalendar(id) {
  const c = allCalendars.find(x => x.id === id);
  if (!c) return;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
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
    .doc-wrap { background: #fff; max-width: 800px; margin: 0 auto; padding: 40px; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
    .doc-hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .doc-hdr-side { font-size: 9pt; max-width: 220px; line-height: 1.4; }
    .doc-hdr-center img { height: 52px; display: block; }
    hr { border: none; border-top: 2px solid #000; margin: 8px 0 20px; }
    .doc-title { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 20px; line-height: 1.6; }
    .sem-hdr { font-weight: bold; font-size: 12pt; margin: 20px 0 8px; border-bottom: 1px solid #aaa; padding-bottom: 3px; }
    .cal-sec { margin-bottom: 12px; }
    .cal-sec-title { font-weight: bold; margin-bottom: 4px; }
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
  <div class="doc-wrap">${buildCalDoc(c)}</div>
</body></html>`);
  win.document.close();
}

function cr(label, value) {
  if (!value) return '';
  return `<div class="cal-row"><span>${label}</span><span><b>${value}</b></span></div>`;
}

function buildCalDoc(c) {
  let h = `
    <div class="doc-hdr">
      <div class="doc-hdr-side">НАО Каспийский университет технологий и инжиниринга им. Ш.Есенова</div>
      <div class="doc-hdr-center"><img src="../../assets/img/logo.png" alt="YU"></div>
      <div class="doc-hdr-side" style="text-align:right">Ш.Есенов атындағы Каспий технологиялар және инжиниринг университеті КеАК</div>
    </div>
    <hr>
    <div class="doc-title">Академический календарь<br>на ${c.year} учебный год<br>Факультет "${c.faculty}" (${c.year} учебный год) /${c.course}курс</div>`;

  h += buildSemDoc('Осенний семестр (1 семестр)', c.s1, 'winter');
  h += buildSemDoc('Весенний семестр (2 семестр)', c.s2, 'spring');
  if (c.s3?.start) h += buildSumDoc(c.s3);
  return h;
}

function buildSemDoc(title, s, type) {
  if (!s) return '';
  let h = `<div class="sem-hdr">${title}</div>`;

  if (s.theor_start || s.theor_end) {
    h += `<div class="cal-sec"><div class="cal-sec-title">Теоретическое обучение</div>`;
    h += cr('Начало семестра', fmtDate(s.theor_start));
    h += cr('Конец семестра',  fmtDate(s.theor_end));
    h += cr('Всего недель',    s.theor_weeks);
    h += `</div>`;
  }
  if (s.reg_start || s.reg_end) {
    h += `<div class="cal-sec"><div class="cal-sec-title">Регистрация</div>`;
    h += cr('Ориентационная неделя', fmtRange(s.reg_start, s.reg_end));
    h += `</div>`;
  }
  if (s.rk1_start || s.rk2_start) {
    h += `<div class="cal-sec"><div class="cal-sec-title">Рубежные контроли</div>`;
    h += cr('Рубежный контроль 1', fmtRange(s.rk1_start, s.rk1_end));
    h += cr('Рубежный контроль 2', fmtRange(s.rk2_start, s.rk2_end));
    h += `</div>`;
  }
  if (s.session_start || s.session_end) {
    const label = type === 'winter' ? 'Зимняя сессия' : 'Экзаменационная сессия';
    h += `<div class="cal-sec"><div class="cal-sec-title">Сессия</div>`;
    h += cr(label, fmtRange(s.session_start, s.session_end));
    h += `</div>`;
  }
  if (s.practices?.length) {
    h += `<div class="cal-sec"><div class="cal-sec-title">Практика</div>`;
    s.practices.forEach(p => {
      h += cr(p.name || 'Практика', fmtRange(p.period_start, p.period_end));
      h += cr('Начало периода выставления итоговой оценки', fmtDate(p.grade_start));
      h += cr('Конец периода выставления итоговой оценки',  fmtDate(p.grade_end));
    });
    h += `</div>`;
  }
  if (s.hol_start || s.hol_end) {
    const label = type === 'winter' ? 'Зимние каникулы' : 'Летние каникулы';
    h += `<div class="cal-sec">`;
    h += cr(label, fmtRange(s.hol_start, s.hol_end));
    h += `</div>`;
  }
  return h;
}

function buildSumDoc(s) {
  let h = `<div class="sem-hdr">Летний учебный период</div>`;
  if (s.start || s.end) {
    h += `<div class="cal-sec"><div class="cal-sec-title">Учебный период</div>`;
    h += cr('Начало семестра', fmtDate(s.start));
    h += cr('Конец семестра',  fmtDate(s.end));
    h += cr('Всего недель',    s.weeks);
    h += `</div>`;
  }
  if (s.reg_start) { h += `<div class="cal-sec"><div class="cal-sec-title">Регистрация</div>`; h += cr('Регистрация', fmtRange(s.reg_start, s.reg_end)); h += `</div>`; }
  if (s.rk1_start || s.rk2_start) {
    h += `<div class="cal-sec"><div class="cal-sec-title">Рубежные контроли</div>`;
    h += cr('Рубежный контроль 1', fmtRange(s.rk1_start, s.rk1_end));
    h += cr('Рубежный контроль 2', fmtRange(s.rk2_start, s.rk2_end));
    h += `</div>`;
  }
  if (s.session_start) { h += `<div class="cal-sec"><div class="cal-sec-title">Сессия</div>`; h += cr('Сессия', fmtRange(s.session_start, s.session_end)); h += `</div>`; }
  return h;
}
