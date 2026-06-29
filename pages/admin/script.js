/* ===== SIDEBAR ===== */
const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('mouseenter', () => sidebar.classList.add('open'));
sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('open'));

/* ===== SECTION NAVIGATION ===== */
const SECTION_TITLES = {
  dashboard: 'Дашборд',
  students:  'Обучающиеся',
  teachers:  'Преподаватели',
  journals:  'Учебные планы',
  certs:     'Сертификаты',
  users:     'Пользователи',
  specs:     'Специальности',
  ops:       'Специализации (ОП)',
  settings:  'Настройки',
};

function showSection(name, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.getElementById('sec-' + name).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('pageHeading').textContent = SECTION_TITLES[name] || name;
  if (name === 'dashboard') renderDashboard();
  if (name === 'students')  renderStudents();
  if (name === 'teachers')  renderTeachers();
  if (name === 'journals')  renderJournals();
  if (name === 'certs')     renderCerts();
  if (name === 'users')     renderUsers();
  if (name === 'specs')     renderSpecs();
  if (name === 'ops')       renderOps();
  lucide.createIcons();
}

/* ===== DATA HELPERS ===== */
const load = key => JSON.parse(localStorage.getItem(key) || '[]');
const loadObj = key => JSON.parse(localStorage.getItem(key) || '{}');

/* ===== DASHBOARD ===== */
function renderDashboard() {
  const students = load('yuedu_students');
  const teachers = load('yuedu_teachers');
  const journal  = load('yuedu_journal');
  const certs    = load('yuedu_certs');

  document.getElementById('st-students').textContent = students.length;
  document.getElementById('st-teachers').textContent = teachers.length;
  document.getElementById('st-journals').textContent = journal.length;
  document.getElementById('st-certs').textContent    = certs.length;

  // Последние 5 студентов
  const tbody = document.getElementById('recentStudentsTbody');
  if (!students.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-cell">Нет данных</td></tr>';
  } else {
    tbody.innerHTML = students.slice(0, 5).map(s => `
      <tr>
        <td><a href="../show_students/?id=${s.id}" style="color:#2563eb;text-decoration:none">${s.fio || '—'}</a></td>
        <td>${s.iin || '—'}</td>
        <td style="font-size:11px;color:#6b7280">${s.specialization || s.specialty || '—'}</td>
      </tr>`).join('');
  }

  // Storage info
  const KEYS = ['yuedu_students','yuedu_teachers','yuedu_journal','yuedu_certs','yuedu_grades'];
  const LABELS = { yuedu_students:'Студенты', yuedu_teachers:'Преподаватели', yuedu_journal:'Журнал', yuedu_certs:'Сертификаты', yuedu_grades:'Оценки' };
  document.getElementById('storageGrid').innerHTML = KEYS.map(k => {
    const raw = localStorage.getItem(k) || '[]';
    let count = '—';
    try {
      const parsed = JSON.parse(raw);
      count = Array.isArray(parsed) ? parsed.length + ' записей' : Object.keys(parsed).length + ' записей';
    } catch {}
    const size = (new Blob([raw]).size / 1024).toFixed(1) + ' KB';
    return `<div class="storage-item"><div class="s-key">${LABELS[k]}</div><div class="s-val">${count} · ${size}</div></div>`;
  }).join('');
}

/* ===== STUDENTS ===== */
let _allStudents = [];
function renderStudents() {
  _allStudents = load('yuedu_students');
  renderStudentsTable(_allStudents);
}

function renderStudentsTable(list) {
  const tbody = document.getElementById('studentsAdminTbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">Нет данных</td></tr>';
    return;
  }
  tbody.innerHTML = list.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><a href="../show_students/?id=${s.id}" style="color:#2563eb;text-decoration:none;font-weight:500">${s.fio || '—'}</a></td>
      <td>${s.iin || '—'}</td>
      <td style="font-size:12px">${s.specialization || s.specialty || '—'}</td>
      <td>${s.fields?.edu_group || '—'}</td>
      <td>${s.payForm || '—'}</td>
      <td style="display:flex;gap:6px">
        <a href="../show_students/?id=${s.id}" class="btn-row view"><i data-lucide="eye" style="width:12px;height:12px"></i> Просмотр</a>
        <button class="btn-row del" onclick="deleteStudent(${s.id})"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
      </td>
    </tr>`).join('');
  lucide.createIcons();
}

function filterStudentsAdmin(q) {
  const filtered = _allStudents.filter(s =>
    (s.fio || '').toLowerCase().includes(q.toLowerCase()) ||
    (s.iin || '').includes(q)
  );
  renderStudentsTable(filtered);
}

function deleteStudent(id) {
  if (!confirm('Удалить студента?')) return;
  const students = load('yuedu_students').filter(s => s.id !== id);
  localStorage.setItem('yuedu_students', JSON.stringify(students));
  renderStudents();
  renderDashboard();
}

/* ===== TEACHERS ===== */
let _allTeachers = [];
function renderTeachers() {
  _allTeachers = load('yuedu_teachers');
  renderTeachersTable(_allTeachers);
}

function renderTeachersTable(list) {
  const tbody = document.getElementById('teachersAdminTbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">Нет данных</td></tr>';
    return;
  }
  tbody.innerHTML = list.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${t.name || t.fio || '—'}</td>
      <td>${t.position || t.dolj || '—'}</td>
      <td>${t.department || t.kafedra || '—'}</td>
    </tr>`).join('');
}

function filterTeachersAdmin(q) {
  const filtered = _allTeachers.filter(t =>
    (t.name || t.fio || '').toLowerCase().includes(q.toLowerCase())
  );
  renderTeachersTable(filtered);
}

/* ===== JOURNALS ===== */
function renderJournals() {
  const journal = load('yuedu_journal');
  const tbody = document.getElementById('journalsAdminTbody');
  if (!journal.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Нет данных</td></tr>';
    return;
  }
  tbody.innerHTML = journal.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.spec || '—'}</td>
      <td>${e.op || '—'}</td>
      <td>${e.group || '—'}</td>
      <td>${e.faculty || '—'}</td>
      <td>${(e.disciplines || []).length + (e.practices || []).length}</td>
    </tr>`).join('');
}

/* ===== CERTS ===== */
function renderCerts() {
  const certs = load('yuedu_certs');
  const tbody = document.getElementById('certsAdminTbody');
  if (!certs.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Нет данных</td></tr>';
    return;
  }
  tbody.innerHTML = certs.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.studentFio || '—'}</td>
      <td>${c.number || '—'}</td>
      <td>${c.type || '—'}</td>
      <td>${c.dateIssue || '—'}</td>
      <td style="display:flex;gap:6px">
        <a href="../cert-view/?certId=${c.id}" class="btn-row view"><i data-lucide="eye" style="width:12px;height:12px"></i> Просмотр</a>
        <button class="btn-row del" onclick="deleteCert(${c.id})"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
      </td>
    </tr>`).join('');
  lucide.createIcons();
}

function deleteCert(id) {
  if (!confirm('Удалить сертификат?')) return;
  const certs = load('yuedu_certs').filter(c => c.id !== id);
  localStorage.setItem('yuedu_certs', JSON.stringify(certs));
  renderCerts();
}

/* ===== USERS ===== */
function renderUsers() {
  const users = load('yuedu_users');
  const tbody = document.getElementById('usersAdminTbody');
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Пользователей нет. Добавьте первого.</td></tr>';
    return;
  }
  tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${u.name}</td>
      <td>${u.login}</td>
      <td><span class="role-badge ${u.role}">${{admin:'Администратор',manager:'Менеджер',teacher:'Преподаватель'}[u.role]||u.role}</span></td>
      <td><span class="status-active">● Активен</span></td>
      <td><button class="btn-row del" onclick="deleteUser(${u.id})"><i data-lucide="trash-2" style="width:12px;height:12px"></i> Удалить</button></td>
    </tr>`).join('');
  lucide.createIcons();
}

function openUserModal() {
  document.getElementById('u_name').value = '';
  document.getElementById('u_login').value = '';
  document.getElementById('u_pass').value = '';
  document.getElementById('u_role').value = 'admin';
  document.getElementById('userModal').classList.add('open');
}

function closeUserModal() {
  document.getElementById('userModal').classList.remove('open');
}

function closeUserOutside(e) {
  if (e.target === document.getElementById('userModal')) closeUserModal();
}

function saveUser() {
  const name  = document.getElementById('u_name').value.trim();
  const login = document.getElementById('u_login').value.trim();
  const pass  = document.getElementById('u_pass').value.trim();
  const role  = document.getElementById('u_role').value;
  if (!name || !login || !pass) { alert('Заполните все поля'); return; }
  const users = load('yuedu_users');
  users.push({ id: Date.now(), name, login, pass, role });
  localStorage.setItem('yuedu_users', JSON.stringify(users));
  closeUserModal();
  renderUsers();
}

function deleteUser(id) {
  if (!confirm('Удалить пользователя?')) return;
  const users = load('yuedu_users').filter(u => u.id !== id);
  localStorage.setItem('yuedu_users', JSON.stringify(users));
  renderUsers();
}

/* ===== SETTINGS ===== */
function saveSettings() {
  const cfg = {
    orgRU: document.getElementById('set_orgRU').value,
    orgKZ: document.getElementById('set_orgKZ').value,
    city:  document.getElementById('set_city').value,
    lang:  document.getElementById('set_lang').value,
    year:  document.getElementById('set_year').value,
  };
  localStorage.setItem('yuedu_settings', JSON.stringify(cfg));
  alert('Настройки сохранены');
}

function clearData(key) {
  if (!confirm('Очистить ' + key + '?')) return;
  localStorage.removeItem(key);
  alert('Очищено');
  renderDashboard();
}

function clearAllData() {
  if (!confirm('Удалить ВСЕ данные системы? Это необратимо!')) return;
  ['yuedu_students','yuedu_teachers','yuedu_journal','yuedu_certs','yuedu_grades','yuedu_users'].forEach(k => localStorage.removeItem(k));
  alert('Все данные удалены');
  renderDashboard();
}

function exportData(key, filename) {
  const data = localStorage.getItem(key) || '[]';
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename + '_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
}

function exportAll() {
  const all = {};
  ['yuedu_students','yuedu_teachers','yuedu_journal','yuedu_certs','yuedu_grades'].forEach(k => {
    try { all[k] = JSON.parse(localStorage.getItem(k) || '[]'); } catch { all[k] = []; }
  });
  const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'yuedu_export_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
}

/* ===== СПЕЦИАЛЬНОСТИ ===== */
let _allSpecs = [];
let _editingSpecId = null;

function renderSpecs() {
  _allSpecs = load('yuedu_specs');
  // Дефолтные данные если пусто
  if (!_allSpecs.length) {
    _allSpecs = [{ id: 1, code: 'M078', nameRU: 'Право', nameKZ: 'Құқық', nameEN: 'Law', degree: 'Магистр' }];
    localStorage.setItem('yuedu_specs', JSON.stringify(_allSpecs));
  }
  renderSpecsTable(_allSpecs);
}

function renderSpecsTable(list) {
  const tbody = document.getElementById('specsTbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Нет данных</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(s => `
    <tr>
      <td style="font-family:monospace;font-weight:700;color:#2563eb">${s.code || '—'}</td>
      <td>${s.nameRU || '—'}</td>
      <td>${s.nameKZ || '—'}</td>
      <td>${s.nameEN || '—'}</td>
      <td>${s.degree || '—'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn-row view" onclick="openSpecModal(${s.id})"><i data-lucide="pencil" style="width:12px;height:12px"></i> Изм.</button>
        <button class="btn-row del" onclick="deleteSpec(${s.id})"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
      </td>
    </tr>`).join('');
  lucide.createIcons();
}

function filterSpecs(q) {
  const filtered = _allSpecs.filter(s =>
    (s.code || '').toLowerCase().includes(q.toLowerCase()) ||
    (s.nameRU || '').toLowerCase().includes(q.toLowerCase())
  );
  renderSpecsTable(filtered);
}

function openSpecModal(id) {
  _editingSpecId = id || null;
  const s = id ? _allSpecs.find(x => x.id === id) : null;
  document.getElementById('specModalTitle').textContent = id ? 'Редактировать специальность' : 'Добавить специальность';
  document.getElementById('sp_code').value   = s?.code   || '';
  document.getElementById('sp_nameRU').value = s?.nameRU || '';
  document.getElementById('sp_nameKZ').value = s?.nameKZ || '';
  document.getElementById('sp_nameEN').value = s?.nameEN || '';
  document.getElementById('sp_degree').value = s?.degree || '';
  document.getElementById('specModal').classList.add('open');
}

function closeSpecModal() { document.getElementById('specModal').classList.remove('open'); }
function closeSpecOutside(e) { if (e.target === document.getElementById('specModal')) closeSpecModal(); }

function saveSpec() {
  const code   = document.getElementById('sp_code').value.trim();
  const nameRU = document.getElementById('sp_nameRU').value.trim();
  const nameKZ = document.getElementById('sp_nameKZ').value.trim();
  const nameEN = document.getElementById('sp_nameEN').value.trim();
  const degree = document.getElementById('sp_degree').value.trim();
  if (!code || !nameRU) { alert('Заполните Код и Название (RU)'); return; }

  let specs = load('yuedu_specs');
  if (_editingSpecId) {
    specs = specs.map(s => s.id === _editingSpecId ? { ...s, code, nameRU, nameKZ, nameEN, degree } : s);
  } else {
    specs.push({ id: Date.now(), code, nameRU, nameKZ, nameEN, degree });
  }
  localStorage.setItem('yuedu_specs', JSON.stringify(specs));
  closeSpecModal();
  renderSpecs();
  syncSpecsToGrades();
}

function deleteSpec(id) {
  if (!confirm('Удалить специальность?')) return;
  const specs = load('yuedu_specs').filter(s => s.id !== id);
  localStorage.setItem('yuedu_specs', JSON.stringify(specs));
  renderSpecs();
  syncSpecsToGrades();
}

/* ===== СПЕЦИАЛИЗАЦИИ (ОП) ===== */
let _allOps = [];
let _editingOpId = null;

function renderOps() {
  _allOps = load('yuedu_ops');
  if (!_allOps.length) {
    _allOps = [{ id: 1, code: '7M04201', nameRU: 'Юриспруденция', nameKZ: 'Юриспруденция', nameEN: 'Jurisprudence', specCode: 'M078' }];
    localStorage.setItem('yuedu_ops', JSON.stringify(_allOps));
  }
  renderOpsTable(_allOps);
}

function renderOpsTable(list) {
  const tbody = document.getElementById('opsTbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Нет данных</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(o => `
    <tr>
      <td style="font-family:monospace;font-weight:700;color:#7c3aed">${o.code || '—'}</td>
      <td>${o.nameRU || '—'}</td>
      <td>${o.nameKZ || '—'}</td>
      <td>${o.nameEN || '—'}</td>
      <td style="font-size:12px;color:#6b7280">${o.specCode || '—'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn-row view" onclick="openOpModal(${o.id})"><i data-lucide="pencil" style="width:12px;height:12px"></i> Изм.</button>
        <button class="btn-row del" onclick="deleteOp(${o.id})"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
      </td>
    </tr>`).join('');
  lucide.createIcons();
}

function filterOps(q) {
  const filtered = _allOps.filter(o =>
    (o.code || '').toLowerCase().includes(q.toLowerCase()) ||
    (o.nameRU || '').toLowerCase().includes(q.toLowerCase())
  );
  renderOpsTable(filtered);
}

function openOpModal(id) {
  _editingOpId = id || null;
  const o = id ? _allOps.find(x => x.id === id) : null;
  document.getElementById('opModalTitle').textContent = id ? 'Редактировать специализацию' : 'Добавить специализацию';
  document.getElementById('op_code').value   = o?.code   || '';
  document.getElementById('op_nameRU').value = o?.nameRU || '';
  document.getElementById('op_nameKZ').value = o?.nameKZ || '';
  document.getElementById('op_nameEN').value = o?.nameEN || '';

  // Заполняем список специальностей
  const specs = load('yuedu_specs');
  const sel = document.getElementById('op_spec');
  sel.innerHTML = '<option value="">— Выберите —</option>' +
    specs.map(s => `<option value="${s.code}" ${o?.specCode === s.code ? 'selected' : ''}>${s.code} — ${s.nameRU}</option>`).join('');

  document.getElementById('opModal').classList.add('open');
}

function closeOpModal() { document.getElementById('opModal').classList.remove('open'); }
function closeOpOutside(e) { if (e.target === document.getElementById('opModal')) closeOpModal(); }

function saveOp() {
  const code   = document.getElementById('op_code').value.trim();
  const nameRU = document.getElementById('op_nameRU').value.trim();
  const nameKZ = document.getElementById('op_nameKZ').value.trim();
  const nameEN = document.getElementById('op_nameEN').value.trim();
  const specCode = document.getElementById('op_spec').value;
  if (!code || !nameRU) { alert('Заполните Код и Название (RU)'); return; }

  let ops = load('yuedu_ops');
  if (_editingOpId) {
    ops = ops.map(o => o.id === _editingOpId ? { ...o, code, nameRU, nameKZ, nameEN, specCode } : o);
  } else {
    ops.push({ id: Date.now(), code, nameRU, nameKZ, nameEN, specCode });
  }
  localStorage.setItem('yuedu_ops', JSON.stringify(ops));
  closeOpModal();
  renderOps();
  syncSpecsToGrades();
}

function deleteOp(id) {
  if (!confirm('Удалить специализацию?')) return;
  const ops = load('yuedu_ops').filter(o => o.id !== id);
  localStorage.setItem('yuedu_ops', JSON.stringify(ops));
  renderOps();
  syncSpecsToGrades();
}

// Синхронизирует данные в формат который читает grades/script.js (SPEC_MAP)
function syncSpecsToGrades() {
  const specs = load('yuedu_specs');
  const ops   = load('yuedu_ops');
  const specMap = {};
  specs.forEach(s => {
    specMap[s.code] = ops
      .filter(o => o.specCode === s.code)
      .map(o => ({ id: o.code, name: o.code + ' — ' + o.nameRU }));
  });
  localStorage.setItem('yuedu_spec_map', JSON.stringify(specMap));
}

/* ===== LOAD SAVED SETTINGS ===== */
(function loadSettings() {
  try {
    const cfg = JSON.parse(localStorage.getItem('yuedu_settings') || '{}');
    if (cfg.orgRU) document.getElementById('set_orgRU').value = cfg.orgRU;
    if (cfg.orgKZ) document.getElementById('set_orgKZ').value = cfg.orgKZ;
    if (cfg.city)  document.getElementById('set_city').value  = cfg.city;
    if (cfg.lang)  document.getElementById('set_lang').value  = cfg.lang;
    if (cfg.year)  document.getElementById('set_year').value  = cfg.year;
  } catch {}
})();

/* ===== INIT ===== */
renderDashboard();
lucide.createIcons();
