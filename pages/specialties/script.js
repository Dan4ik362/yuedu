const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('mouseenter', () => sidebar.classList.add('open'));
sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('open'));

const API_KEY = 'a3f8c2d1e9b74056f2a1c8d3e7f0b9a2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0';
const PER_PAGE = 20;
let currentPage = 1;
let totalItems = 0;
const itemsMap = new Map();
let editingId = null;
let nextId = -1;

async function loadSpecialties(page = 1) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="4"><div class="loader"></div></td></tr>';
  try {
    const res = await fetch(`https://api-platonus.yu.edu.kz/api/v1/education-programs/?page=${page}&per_page=${PER_PAGE}`, {
      headers: { 'accept': 'application/json', 'x-api-key': API_KEY }
    });
    if (!res.ok) throw new Error('Ошибка ' + res.status);
    const data = await res.json();
    const items = data.items || [];
    totalItems = data.total || items.length;
    currentPage = page;

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:24px">Нет данных</td></tr>';
      document.getElementById('foundCount').innerHTML = 'Найдено записей: <strong>0</strong>';
      return;
    }

    itemsMap.clear();
    items.forEach(s => itemsMap.set(s.professionID, s));

    tbody.innerHTML = items.map(s => `
      <tr class="data-row" onclick="showSpecialty(${s.professionID})">
        <td style="font-family:monospace;font-size:12px;color:#6b7280">${s.professionCode || '—'}</td>
        <td>${s.professionNameRU || '—'}</td>
        <td>${s.degreeRU || s.qualificationRU || '—'}</td>
        <td class="actions-cell" onclick="event.stopPropagation()">
          <button class="act-btn edit" onclick="openEditModal(${s.professionID})"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
          <button class="act-btn del" onclick="deleteItem(${s.professionID})"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
        </td>
      </tr>`).join('');

    document.getElementById('foundCount').innerHTML = `Найдено записей: <strong>${totalItems}</strong>`;
    renderPagination();
    lucide.createIcons();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:24px">Ошибка загрузки: ${e.message}</td></tr>`;
  }
}

function renderPagination() {
  const totalPages = Math.ceil(totalItems / PER_PAGE);
  const pg = document.getElementById('pagination');
  if (totalPages <= 1) { pg.innerHTML = ''; return; }

  let html = `<button class="pg-btn" ${currentPage===1?'disabled':''} onclick="loadSpecialties(1)">&#171;</button>`;
  html += `<button class="pg-btn" ${currentPage===1?'disabled':''} onclick="loadSpecialties(${currentPage-1})">&#8249;</button>`;
  const start = Math.max(1, currentPage - 2);
  const end   = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    html += `<button class="pg-btn ${i===currentPage?'active':''}" onclick="loadSpecialties(${i})">${i}</button>`;
  }
  html += `<button class="pg-btn" ${currentPage===totalPages?'disabled':''} onclick="loadSpecialties(${currentPage+1})">&#8250;</button>`;
  html += `<button class="pg-btn" ${currentPage===totalPages?'disabled':''} onclick="loadSpecialties(${totalPages})">&#187;</button>`;
  pg.innerHTML = html;
}

function filterTable() {
  currentPage = 1;
  loadSpecialties(1);
}

function openCreateModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Создать специальность';
  document.getElementById('f_code').value = '';
  document.getElementById('f_nameRU').value = '';
  document.getElementById('f_degree').value = '';
  document.getElementById('f_nameRU').classList.remove('error');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => lucide.createIcons(), 10);
}

function openEditModal(id) {
  const item = itemsMap.get(id);
  if (!item) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Редактировать специальность';
  document.getElementById('f_code').value = item.professionCode || '';
  document.getElementById('f_nameRU').value = item.professionNameRU || '';
  document.getElementById('f_degree').value = item.degreeRU || item.qualificationRU || '';
  document.getElementById('f_nameRU').classList.remove('error');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => lucide.createIcons(), 10);
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('closing');
  setTimeout(() => { overlay.classList.remove('open', 'closing'); document.body.style.overflow = ''; }, 220);
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function saveItem() {
  const nameRU = document.getElementById('f_nameRU').value.trim();
  const el = document.getElementById('f_nameRU');
  if (!nameRU) { el.classList.add('error'); return; }
  el.classList.remove('error');
  const code = document.getElementById('f_code').value.trim();
  const degree = document.getElementById('f_degree').value.trim();
  if (editingId !== null) {
    const item = itemsMap.get(editingId);
    item.professionCode = code;
    item.professionNameRU = nameRU;
    item.degreeRU = degree;
    itemsMap.set(editingId, item);
    document.querySelectorAll('#tableBody tr').forEach(row => {
      if (row.querySelector(`[onclick="openEditModal(${editingId})"]`)) {
        row.cells[0].textContent = code || '—';
        row.cells[1].textContent = nameRU;
        row.cells[2].textContent = degree || '—';
      }
    });
  } else {
    const id = nextId--;
    const newItem = { professionID: id, professionCode: code, professionNameRU: nameRU, degreeRU: degree, qualificationRU: '' };
    itemsMap.set(id, newItem);
    const tbody = document.getElementById('tableBody');
    const tr = document.createElement('tr');
    tr.className = 'data-row';
    tr.setAttribute('onclick', `showSpecialty(${id})`);
    tr.innerHTML = `
      <td style="font-family:monospace;font-size:12px;color:#6b7280">${code || '—'}</td>
      <td>${nameRU}</td>
      <td>${degree || '—'}</td>
      <td class="actions-cell" onclick="event.stopPropagation()">
        <button class="act-btn edit" onclick="openEditModal(${id})"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
        <button class="act-btn del" onclick="deleteItem(${id})"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
      </td>`;
    tbody.prepend(tr);
    totalItems++;
    document.getElementById('foundCount').innerHTML = `Найдено записей: <strong>${totalItems}</strong>`;
    lucide.createIcons();
  }
  closeModal();
}

function deleteItem(id) {
  if (!confirm('Удалить специальность? Это действие нельзя отменить.')) return;
  const row = document.querySelector(`[onclick="deleteItem(${id})"]`)?.closest('tr');
  if (row) { row.remove(); totalItems--; document.getElementById('foundCount').innerHTML = `Найдено записей: <strong>${totalItems}</strong>`; }
  itemsMap.delete(id);
}

async function showSpecialty(id) {
  const s = itemsMap.get(id);
  if (!s) return;
  document.getElementById('dt-code').textContent    = s.professionCode || '—';
  document.getElementById('dt-name').textContent    = s.professionNameRU || '—';
  document.getElementById('dt-namekz').textContent  = s.professionNameKZ || '—';
  document.getElementById('dt-nameen').textContent  = s.professionNameEN || '—';
  document.getElementById('dt-degree').textContent  = s.degreeRU || s.qualificationRU || '—';
  document.getElementById('dt-faculty').textContent = '—';
  document.getElementById('dt-cafedra').textContent = '—';
  document.getElementById('detailOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => lucide.createIcons(), 10);

  try {
    const res = await fetch(`https://api-platonus.yu.edu.kz/api/v1/education-programs/${id}`, {
      headers: { 'accept': 'application/json', 'x-api-key': API_KEY }
    });
    const d = await res.json();
    document.getElementById('dt-namekz').textContent  = d.professionNameKZ || '—';
    document.getElementById('dt-nameen').textContent  = d.professionNameEN || '—';
    document.getElementById('dt-degree').textContent  = d.degreeRU || d.qualificationRU || '—';
    document.getElementById('dt-faculty').textContent = d.faculty?.facultyNameRU || '—';
    document.getElementById('dt-cafedra').textContent = d.faculty?.cafedraNameRU || '—';

    const forms = [];
    if (d.is_fulltime)  forms.push('Очная');
    if (d.is_parttime)  forms.push('Заочная');
    if (d.is_evening)   forms.push('Вечерняя');
    document.getElementById('dt-form').textContent = forms.length ? forms.join(', ') : '—';
  } catch {}
}

function closeDetail() {
  const overlay = document.getElementById('detailOverlay');
  overlay.classList.add('closing');
  setTimeout(() => { overlay.classList.remove('open', 'closing'); document.body.style.overflow = ''; }, 220);
}

function closeDetailOutside(e) {
  if (e.target === document.getElementById('detailOverlay')) closeDetail();
}

loadSpecialties();
lucide.createIcons();
