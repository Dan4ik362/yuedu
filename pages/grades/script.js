const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('mouseenter', () => sidebar.classList.add('open'));
sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('open'));

const PER_PAGE = 10;
let _currentPage = 1;

/* ===== API ===== */
const API_KEY = 'a3f8c2d1e9b74056f2a1c8d3e7f0b9a2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0';
let _teachers = [];
let _faculties = [];

function loadTeachersFromStorage() {
  // Read from cache written by teachers page
  const cached = localStorage.getItem('yuedu_teachers');
  if (cached) {
    _teachers = JSON.parse(cached);
    return true;
  }
  return false;
}

async function fetchFaculties() {
  try {
    const res = await fetch('https://api-platonus.yu.edu.kz/api/v1/faculties/', {
      headers: { 'accept': 'application/json', 'x-api-key': API_KEY }
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    _faculties = (data.items || []).map(f => ({ id: f.id, name: f.nameRU || f.nameKZ || '—' }));
  } catch {
    _faculties = [];
  }
}

function fillFacultySelect() {
  const sel = document.getElementById('m_faculty');
  if (!sel) return;
  sel.innerHTML = _faculties.length
    ? '<option value="">— Выберите факультет —</option>' +
      _faculties.map(f => `<option value="${f.id}">${f.name}</option>`).join('')
    : '<option value="">— Нет данных —</option>';
}

/* ===== JOURNAL DATA ===== */
const JOURNAL_KEY = 'yuedu_journal';
function loadJournal() { return JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]'); }
function saveJournal(d) { localStorage.setItem(JOURNAL_KEY, JSON.stringify(d)); }

/* ===== SPECIALIZATIONS ===== */
const SPEC_MAP = {
  'M078': [{ id: '7M04201', name: '7М04201 — Юриспруденция' }]
};

function onSpecChange() {
  const val = document.getElementById('m_spec').value;
  const opSel = document.getElementById('m_op');
  const ops = SPEC_MAP[val] || [];
  opSel.innerHTML = ops.length
    ? ops.map(o => `<option value="${o.id}">${o.name}</option>`).join('')
    : '<option value="">— Нет специальностей —</option>';
}

/* ===== MODAL ===== */
function openAddModal() {
  _editingId = null;
  loadTeachersFromStorage();
  document.getElementById('addModal').classList.add('open');
  document.getElementById('m_spec').value = '';
  document.getElementById('m_group').value = '';
  onSpecChange();
  fillFacultySelect();
  document.getElementById('discBody').innerHTML = '';
  document.getElementById('practiceBody').innerHTML = '';
  addDiscRow();
  addPracticeRow();
  lucide.createIcons();
}

function closeAddModal(e) {
  if (e && e.target !== document.getElementById('addModal')) return;
  document.getElementById('addModal').classList.remove('open');
}

function buildTeacherOptions() {
  if (!_teachers.length) return '<option value="">— Нет данных —</option>';
  return '<option value="">— Выберите преподавателя —</option>' +
    _teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

function makeRow(namePlaceholder) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <div class="name-langs">
        <div class="name-lang-row"><span class="lang-tag">КЗ</span><input type="text" placeholder="${namePlaceholder}" data-field="name_kz"></div>
        <div class="name-lang-row"><span class="lang-tag">РУ</span><input type="text" placeholder="${namePlaceholder}" data-field="name_ru"></div>
        <div class="name-lang-row"><span class="lang-tag">АНГ</span><input type="text" placeholder="${namePlaceholder}" data-field="name_en"></div>
      </div>
    </td>
    <td class="col-credits"><input type="number" min="1" max="10" placeholder="4" data-field="credits"></td>
    <td><input type="text" placeholder="Преподаватель" data-field="teacher"></td>
    <td class="col-del"><button class="btn-del-row" onclick="this.closest('tr').remove()" title="Удалить"><i data-lucide="trash-2" style="width:13px;height:13px"></i></button></td>
  `;
  return tr;
}

function addDiscRow() {
  const tbody = document.getElementById('discBody');
  tbody.appendChild(makeRow('Название предмета'));
  lucide.createIcons();
}

function addPracticeRow() {
  const tbody = document.getElementById('practiceBody');
  tbody.appendChild(makeRow('Название практики'));
  lucide.createIcons();
}

function saveJournalEntry() {
  const spec    = document.getElementById('m_spec').value;
  const op      = document.getElementById('m_op').value;
  const group   = document.getElementById('m_group').value.trim();
  const facId   = document.getElementById('m_faculty').value;
  const facName = facId
    ? (_faculties.find(f => String(f.id) === String(facId))?.name || facId)
    : '';

  if (!spec)  { alert('Выберите специализацию'); return; }
  if (!op)    { alert('Выберите специальность'); return; }
  if (!group) { alert('Введите группу'); return; }

  function parseRows(tbodyId) {
    return [...document.getElementById(tbodyId).querySelectorAll('tr')].map(tr => ({
      name_kz: tr.querySelector('[data-field="name_kz"]').value.trim(),
      name_ru: tr.querySelector('[data-field="name_ru"]').value.trim(),
      name_en: tr.querySelector('[data-field="name_en"]').value.trim(),
      credits: tr.querySelector('[data-field="credits"]').value,
      teacher: tr.querySelector('[data-field="teacher"]').value.trim(),
    })).filter(d => d.name_kz || d.name_ru || d.name_en);
  }

  const disciplines = parseRows('discBody');
  const practices   = parseRows('practiceBody');

  if (!disciplines.length) { alert('Добавьте хотя бы одну дисциплину с названием'); return; }

  const journal = loadJournal();
  if (_editingId) {
    const idx = journal.findIndex(e => e.id === _editingId);
    if (idx !== -1) journal[idx] = { ...journal[idx], spec, op, group, faculty: facName, disciplines, practices };
    _editingId = null;
  } else {
    journal.push({ id: Date.now(), spec, op, group, faculty: facName, disciplines, practices, createdAt: new Date().toISOString() });
  }
  saveJournal(journal);
  renderJournalTable();
  document.getElementById('addModal').classList.remove('open');
}

/* ===== FILTERS ===== */
function populateFacultyFilter() {
  const journal = loadJournal();
  const sel = document.getElementById('filterFaculty');
  if (!sel) return;
  const faculties = [...new Set(journal.map(e => e.faculty).filter(Boolean))];
  sel.innerHTML = '<option value="">Все</option>' +
    faculties.map(f => `<option value="${f}">${f}</option>`).join('');
}

function applyFilters() {
  const q       = (document.getElementById('filterSearch')?.value || '').toLowerCase();
  const faculty = document.getElementById('filterFaculty')?.value || '';
  const spec    = document.getElementById('filterSpec')?.value || '';
  const op      = document.getElementById('filterOp')?.value || '';
  const group   = (document.getElementById('filterGroup')?.value || '').toLowerCase();

  const journal = loadJournal();
  _filtered = journal.filter(e => {
    if (faculty && e.faculty !== faculty) return false;
    if (spec && e.spec !== spec) return false;
    if (op && e.op !== op) return false;
    if (group && !e.group.toLowerCase().includes(group)) return false;
    if (q) {
      const hay = [e.faculty, e.spec, e.op, e.group,
        ...(e.disciplines || []).map(d => d.name),
        ...(e.practices || []).map(p => p.name)
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  _currentPage = 1;
  renderJournalTable();
}

let _filtered = null;

/* ===== RENDER TABLE ===== */
function renderJournalTable(page) {
  const data = _filtered !== null ? _filtered : loadJournal();
  const total = data.length;
  if (page !== undefined) _currentPage = page;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (_currentPage > totalPages) _currentPage = totalPages;

  document.getElementById('foundCount').textContent = total;
  renderPagination(totalPages);

  const tbody = document.getElementById('journalTableBody');

  if (!total) {
    tbody.innerHTML = Array(3).fill('<tr><td></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td></td></tr>').join('');
    return;
  }

  const slice = data.slice((_currentPage - 1) * PER_PAGE, _currentPage * PER_PAGE);
  let html = '';
  slice.forEach(entry => {
    const totalCredits = [...(entry.disciplines||[]), ...(entry.practices||[])].reduce((s, d) => s + (parseInt(d.credits) || 0), 0);
    const entryId = 'entry_' + entry.id;
    html += `
      <tr class="entry-row" onclick="toggleEntry('${entryId}')">
        <td><button class="row-toggle" id="toggle_${entryId}"><i data-lucide="chevron-right" style="width:14px;height:14px"></i></button></td>
        <td>${entry.faculty || '—'}</td>
        <td>${entry.spec || '—'}</td>
        <td>${entry.op || '—'}</td>
        <td>${entry.group || '—'}</td>
        <td>${totalCredits || '—'}</td>
        <td onclick="event.stopPropagation()">
          <button class="btn-edit-entry" onclick="openEditModal(${entry.id})">
            <i data-lucide="pencil" style="width:12px;height:12px"></i> Изменить
          </button>
        </td>
      </tr>
      <tr class="disc-sub-row" id="${entryId}" style="display:none">
        <td colspan="7" style="padding:0">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f1f5ff">
                <th style="padding:7px 16px 7px 48px;font-size:10px;font-weight:700;color:#6b7280;text-align:left;width:50%">ДИСЦИПЛИНА</th>
                <th style="padding:7px 16px;font-size:10px;font-weight:700;color:#6b7280;text-align:center">КРЕДИТЫ</th>
                <th style="padding:7px 16px;font-size:10px;font-weight:700;color:#6b7280;text-align:left">ПРЕПОДАВАТЕЛЬ</th>
              </tr>
            </thead>
            <tbody>
              ${entry.disciplines.map(d => `
                <tr style="border-top:1px solid #f3f4f6">
                  <td style="padding:8px 16px 8px 48px;font-size:13px;color:#374151">${d.name_ru || d.name_kz || d.name_en || d.name || '—'}</td>
                  <td style="padding:8px 16px;font-size:13px;color:#6b7280;text-align:center">${d.credits || '—'}</td>
                  <td style="padding:8px 16px;font-size:13px;color:#6b7280">${d.teacher || '—'}</td>
                </tr>`).join('')}
              ${entry.practices && entry.practices.length ? `
                <tr style="background:#f0f4ff">
                  <td colspan="3" style="padding:6px 16px 6px 48px;font-size:10px;font-weight:700;color:#6b7280;letter-spacing:.5px">ПРАКТИКА</td>
                </tr>
                ${entry.practices.map(p => `
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:8px 16px 8px 48px;font-size:13px;color:#374151">${p.name_ru || p.name_kz || p.name_en || p.name || '—'}</td>
                    <td style="padding:8px 16px;font-size:13px;color:#6b7280;text-align:center">${p.credits || '—'}</td>
                    <td style="padding:8px 16px;font-size:13px;color:#6b7280">${p.teacher || '—'}</td>
                  </tr>`).join('')}` : ''}
            </tbody>
          </table>
        </td>
      </tr>`;
  });
  tbody.innerHTML = html;
  lucide.createIcons();
}

function renderPagination(totalPages) {
  const pg = document.getElementById('pagination');
  const p = _currentPage;
  let html = '';
  html += `<button class="pg-btn" ${p===1?'disabled':''} onclick="renderJournalTable(1)"><i data-lucide="chevrons-left" style="width:14px;height:14px"></i></button>`;
  html += `<button class="pg-btn" ${p===1?'disabled':''} onclick="renderJournalTable(${p-1})"><i data-lucide="chevron-left" style="width:14px;height:14px"></i></button>`;
  const start = Math.max(1, p - 2), end = Math.min(totalPages, p + 2);
  for (let i = start; i <= end; i++) {
    html += `<button class="pg-btn ${i===p?'active':''}" onclick="renderJournalTable(${i})">${i}</button>`;
  }
  html += `<button class="pg-btn" ${p===totalPages?'disabled':''} onclick="renderJournalTable(${p+1})"><i data-lucide="chevron-right" style="width:14px;height:14px"></i></button>`;
  html += `<button class="pg-btn" ${p===totalPages?'disabled':''} onclick="renderJournalTable(${totalPages})"><i data-lucide="chevrons-right" style="width:14px;height:14px"></i></button>`;
  pg.innerHTML = html;
  lucide.createIcons();
}

function toggleEntry(id) {
  const row = document.getElementById(id);
  const btn = document.getElementById('toggle_' + id);
  const isOpen = row.style.display !== 'none';
  row.style.display = isOpen ? 'none' : 'table-row';
  btn.classList.toggle('open', !isOpen);
}

/* ===== EDIT ===== */
let _editingId = null;

function openEditModal(id) {
  const journal = loadJournal();
  const entry = journal.find(e => e.id === id);
  if (!entry) return;
  _editingId = id;

  loadTeachersFromStorage();
  fillFacultySelect();

  document.getElementById('m_spec').value = entry.spec || '';
  onSpecChange();
  document.getElementById('m_op').value = entry.op || '';
  document.getElementById('m_group').value = entry.group || '';
  // Faculty
  const facSel = document.getElementById('m_faculty');
  [...facSel.options].forEach(o => { if (o.text === entry.faculty) facSel.value = o.value; });

  // Disciplines
  const discBody = document.getElementById('discBody');
  discBody.innerHTML = '';
  (entry.disciplines || []).forEach(d => {
    const tr = makeRow('Название предмета');
    tr.querySelector('[data-field="name_kz"]').value = d.name_kz || d.name || '';
    tr.querySelector('[data-field="name_ru"]').value = d.name_ru || '';
    tr.querySelector('[data-field="name_en"]').value = d.name_en || '';
    tr.querySelector('[data-field="credits"]').value = d.credits || '';
    tr.querySelector('[data-field="teacher"]').value = d.teacher || '';
    discBody.appendChild(tr);
  });
  if (!discBody.children.length) addDiscRow();

  // Practices
  const pracBody = document.getElementById('practiceBody');
  pracBody.innerHTML = '';
  (entry.practices || []).forEach(p => {
    const tr = makeRow('Название практики');
    tr.querySelector('[data-field="name_kz"]').value = p.name_kz || p.name || '';
    tr.querySelector('[data-field="name_ru"]').value = p.name_ru || '';
    tr.querySelector('[data-field="name_en"]').value = p.name_en || '';
    tr.querySelector('[data-field="credits"]').value = p.credits || '';
    tr.querySelector('[data-field="teacher"]').value = p.teacher || '';
    pracBody.appendChild(tr);
  });
  if (!pracBody.children.length) addPracticeRow();

  document.getElementById('addModal').classList.add('open');
  lucide.createIcons();
}

/* ===== INIT ===== */
loadTeachersFromStorage();
fetchFaculties().then(fillFacultySelect);
populateFacultyFilter();
renderJournalTable();
lucide.createIcons();
