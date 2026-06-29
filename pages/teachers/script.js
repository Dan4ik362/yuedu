const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('mouseenter', () => sidebar.classList.add('open'));
sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('open'));

function toggleFilter() {
  const block = document.getElementById('filtersBlock');
  const btn = document.getElementById('filterToggle');
  const isHidden = block.style.display === 'none';

  if (isHidden) {
    block.style.display = 'block';
    block.style.animation = 'filterSlideDown 0.22s ease';
    btn.style.background = 'var(--red)';
    btn.style.color = '#fff';
    btn.style.borderColor = 'var(--red)';
  } else {
    block.style.animation = 'filterSlideUp 0.18s ease forwards';
    setTimeout(() => { block.style.display = 'none'; block.style.animation = ''; }, 170);
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
  }
}

function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('closing');
  setTimeout(() => {
    overlay.classList.remove('open', 'closing');
    document.body.style.overflow = '';
    clearForm();
  }, 220);
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function clearForm() {
  ['f_last','f_first','f_mid','f_iin','f_birth','f_hire'].forEach(id => {
    document.getElementById(id).value = '';
  });
  ['f_faculty','f_dept','f_pos','f_type','f_status'].forEach(id => {
    document.getElementById(id).selectedIndex = 0;
  });
  document.querySelectorAll('.modal-field input.error, .modal-field select.error').forEach(el => el.classList.remove('error'));
}

function saveTeacher() {
  const last  = document.getElementById('f_last').value.trim();
  const first = document.getElementById('f_first').value.trim();
  const iin   = document.getElementById('f_iin').value.trim();
  const birth = document.getElementById('f_birth').value;
  const hire  = document.getElementById('f_hire').value;

  let valid = true;
  [['f_last', last], ['f_first', first], ['f_iin', iin], ['f_birth', birth], ['f_hire', hire]].forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!val) { el.classList.add('error'); valid = false; }
    else el.classList.remove('error');
  });
  if (!valid) return;

  const mid = document.getElementById('f_mid').value.trim();
  const fullName = last + ' ' + first.charAt(0) + '.' + (mid ? mid.charAt(0) + '.' : '');

  const tbody = document.querySelector('.teachers-table tbody');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="checkbox"></td>
    <td>${fullName}</td>
    <td>${birth}</td>
    <td>${hire}</td>
  `;
  row.style.animation = 'filterSlideDown 0.22s ease';

  const emptyRows = [...tbody.querySelectorAll('tr')].filter(r => r.cells[1]?.textContent === '—');
  if (emptyRows.length > 0) emptyRows[0].replaceWith(row);
  else tbody.appendChild(row);

  closeModal();
}

const API_BASE = 'https://api-platonus.yu.edu.kz/api/v1/tutors/teachers';
const API_KEY  = 'a3f8c2d1e9b74056f2a1c8d3e7f0b9a2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0';
const PER_PAGE = 20;
let currentPage = 1;
let totalItems  = 0;
const teachersMap = new Map();

async function loadTeachers(page = 1) {
  const tbody = document.getElementById('teachersBody');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="5"><div class="loader"></div></td></tr>';

  try {
    const res = await fetch(`${API_BASE}?page=${page}&per_page=${PER_PAGE}`, {
      headers: { 'accept': 'application/json', 'x-api-key': API_KEY }
    });
    if (!res.ok) throw new Error('Ошибка ' + res.status);
    const data = await res.json();

    const items = data.items || [];
    totalItems = data.total || items.length;
    currentPage = page;

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:24px">Нет данных</td></tr>';
      return;
    }

    teachersMap.clear();
    items.forEach(t => teachersMap.set(t.TutorID, t));

    tbody.innerHTML = items.map(t => {
      const name = `${t.lastname} ${t.firstname?.charAt(0) || ''}.${t.patronymic?.charAt(0) ? t.patronymic.charAt(0) + '.' : ''}`;
      return `<tr class="teacher-row" onclick="showTeacher(${t.TutorID})">
        <td onclick="event.stopPropagation()"><input type="checkbox"></td>
        <td>${name}</td>
        <td>${t.job_title || '—'}</td>
        <td>${t.faculty_name || '—'}</td>
        <td>${t.cafedra_name || '—'}</td>
      </tr>`;
    }).join('');

    document.getElementById('foundTotal').textContent = totalItems;
    document.getElementById('resultsBar').style.display = 'flex';
    renderPagination();

    // Cache all teachers in background for use in other pages
    if (page === 1) cacheAllTeachers(totalItems);

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#ef4444;padding:24px">Ошибка загрузки: ${e.message}</td></tr>`;
  }
}

async function cacheAllTeachers(total) {
  const perPage = 100;
  const pages = Math.ceil(total / perPage);
  const all = [];
  for (let p = 1; p <= pages; p++) {
    try {
      const res = await fetch(`${API_BASE}?page=${p}&per_page=${perPage}`, {
        headers: { 'accept': 'application/json', 'x-api-key': API_KEY }
      });
      if (!res.ok) break;
      const data = await res.json();
      (data.items || []).forEach(t => {
        all.push({
          id: t.TutorID,
          name: [t.lastname, t.firstname, t.patronymic].filter(Boolean).join(' ')
        });
      });
    } catch { break; }
  }
  if (all.length) localStorage.setItem('yuedu_teachers', JSON.stringify(all));
}

function renderPagination() {
  const totalPages = Math.ceil(totalItems / PER_PAGE);
  const pg = document.getElementById('pagination');
  if (totalPages <= 1) { pg.innerHTML = ''; return; }

  let html = `<button class="pg-btn" ${currentPage===1?'disabled':''} onclick="loadTeachers(1)"><i data-lucide="chevrons-left" style="width:13px;height:13px"></i></button>`;
  html += `<button class="pg-btn" ${currentPage===1?'disabled':''} onclick="loadTeachers(${currentPage-1})"><i data-lucide="chevron-left" style="width:13px;height:13px"></i></button>`;

  const start = Math.max(1, currentPage - 2);
  const end   = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    html += `<button class="pg-btn ${i===currentPage?'active':''}" onclick="loadTeachers(${i})">${i}</button>`;
  }

  html += `<button class="pg-btn" ${currentPage===totalPages?'disabled':''} onclick="loadTeachers(${currentPage+1})"><i data-lucide="chevron-right" style="width:13px;height:13px"></i></button>`;
  html += `<button class="pg-btn" ${currentPage===totalPages?'disabled':''} onclick="loadTeachers(${totalPages})"><i data-lucide="chevrons-right" style="width:13px;height:13px"></i></button>`;

  pg.innerHTML = html;
  lucide.createIcons();
}

function showTeacher(id) {
  const t = teachersMap.get(id);
  if (!t) return;
  const fullName = [t.lastname, t.firstname, t.patronymic].filter(Boolean).join(' ');
  const initials = ((t.lastname || '').charAt(0) + (t.firstname || '').charAt(0)).toUpperCase();
  document.getElementById('dt-avatar').textContent   = initials || '?';
  document.getElementById('dt-fullname').textContent = fullName || '—';
  document.getElementById('dt-id').textContent       = 'ID: ' + t.TutorID;
  document.getElementById('dt-iin').textContent      = t.iinplt || '—';
  document.getElementById('dt-job').textContent      = t.job_title || '—';
  document.getElementById('dt-faculty').textContent  = t.faculty_name || '—';
  document.getElementById('dt-cafedra').textContent  = t.cafedra_name || '—';
  const sched = document.getElementById('dt-schedule');
  sched.textContent = t.has_schedule ? 'Да' : 'Нет';
  sched.className   = 'detail-value ' + (t.has_schedule ? 'badge-yes' : 'badge-no');
  const overlay = document.getElementById('detailOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeDetail() {
  const overlay = document.getElementById('detailOverlay');
  overlay.classList.add('closing');
  setTimeout(() => {
    overlay.classList.remove('open', 'closing');
    document.body.style.overflow = '';
  }, 220);
}

function closeDetailOutside(e) {
  if (e.target === document.getElementById('detailOverlay')) closeDetail();
}

loadTeachers();
lucide.createIcons();
