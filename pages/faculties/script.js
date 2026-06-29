const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('mouseenter', () => sidebar.classList.add('open'));
sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('open'));

const API_KEY = 'a3f8c2d1e9b74056f2a1c8d3e7f0b9a2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0';
let allItems = [];
const itemsMap = new Map();
let editingId = null;
let nextId = -1;

async function loadFaculties() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="4"><div class="loader"></div></td></tr>';
  try {
    const res = await fetch('https://api-platonus.yu.edu.kz/api/v1/faculties/', {
      headers: { 'accept': 'application/json', 'x-api-key': API_KEY }
    });
    if (!res.ok) throw new Error('Ошибка ' + res.status);
    const data = await res.json();
    allItems = data.items || [];
    renderRows(allItems);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:24px">Ошибка загрузки: ${e.message}</td></tr>`;
  }
}

function renderRows(items) {
  const tbody = document.getElementById('tableBody');
  itemsMap.clear();
  items.forEach(f => itemsMap.set(f.id, f));
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:24px">Нет данных</td></tr>';
    document.getElementById('foundCount').innerHTML = 'Найдено записей: <strong>0</strong>';
    return;
  }
  tbody.innerHTML = items.map(f => `
    <tr class="data-row" onclick="showFaculty(${f.id})">
      <td>${f.nameRU || '—'}</td>
      <td>${f.department_count ?? 0}</td>
      <td>${f.tutor_count ?? 0}</td>
      <td class="actions-cell" onclick="event.stopPropagation()">
        <button class="act-btn edit" onclick="openEditModal(${f.id})"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
        <button class="act-btn del" onclick="deleteItem(${f.id})"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
      </td>
    </tr>`).join('');
  document.getElementById('foundCount').innerHTML = `Найдено записей: <strong>${items.length}</strong>`;
  lucide.createIcons();
}

function filterTable() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allItems.filter(f => (f.nameRU || '').toLowerCase().includes(q));
  renderRows(filtered);
}

function openCreateModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Создать факультет';
  document.getElementById('f_nameRU').value = '';
  document.getElementById('f_nameKZ').value = '';
  document.getElementById('f_nameEN').value = '';
  document.getElementById('f_nameRU').classList.remove('error');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => lucide.createIcons(), 10);
}

function openEditModal(id) {
  const item = itemsMap.get(id);
  if (!item) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Редактировать факультет';
  document.getElementById('f_nameRU').value = item.nameRU || '';
  document.getElementById('f_nameKZ').value = item.nameKZ || '';
  document.getElementById('f_nameEN').value = item.nameEN || '';
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
  const nameKZ = document.getElementById('f_nameKZ').value.trim();
  const nameEN = document.getElementById('f_nameEN').value.trim();
  if (editingId !== null) {
    const item = itemsMap.get(editingId);
    item.nameRU = nameRU; item.nameKZ = nameKZ; item.nameEN = nameEN;
  } else {
    allItems.unshift({ id: nextId--, nameRU, nameKZ, nameEN, department_count: 0, tutor_count: 0 });
  }
  renderRows(allItems);
  closeModal();
}

function deleteItem(id) {
  if (!confirm('Удалить факультет? Это действие нельзя отменить.')) return;
  allItems = allItems.filter(f => f.id !== id);
  renderRows(allItems);
}

async function showFaculty(id) {
  const f = itemsMap.get(id);
  if (!f) return;
  document.getElementById('dt-name').textContent   = f.nameRU || '—';
  document.getElementById('dt-namekz').textContent = f.nameKZ || '—';
  document.getElementById('dt-nameen').textContent = f.nameEN || '—';
  document.getElementById('dt-depts').textContent  = f.department_count ?? 0;
  document.getElementById('dt-tutors').textContent = f.tutor_count ?? 0;
  document.getElementById('dt-id').textContent     = 'ID: ' + f.id;
  const initials = (f.nameRU || '').split(/\s+/).filter(w => /[А-ЯA-Z]/i.test(w[0])).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  document.getElementById('dt-avatar').textContent = initials || 'Ф';
  document.getElementById('dt-depts-list').innerHTML = '<div class="depts-loading"><div class="loader" style="width:20px;height:20px;border-width:2px"></div></div>';
  document.getElementById('detailOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => lucide.createIcons(), 10);

  try {
    const res = await fetch(`https://api-platonus.yu.edu.kz/api/v1/faculties/${id}/departments`, {
      headers: { 'accept': 'application/json', 'x-api-key': API_KEY }
    });
    const depts = await res.json();
    const list = document.getElementById('dt-depts-list');
    if (!Array.isArray(depts) || depts.length === 0) {
      list.innerHTML = '<p class="depts-empty">Нет кафедр</p>';
      return;
    }
    list.innerHTML = depts.map(d => `
      <div class="dept-item">
        <div class="dept-item-icon"><i data-lucide="layers" style="width:14px;height:14px"></i></div>
        <div class="dept-item-name">${d.nameRU || '—'}</div>
        <div class="dept-item-count">${d.tutor_count ?? 0} преп.</div>
      </div>`).join('');
    lucide.createIcons();
  } catch {
    document.getElementById('dt-depts-list').innerHTML = '<p class="depts-empty" style="color:#ef4444">Ошибка загрузки</p>';
  }
}

function closeDetail() {
  const overlay = document.getElementById('detailOverlay');
  overlay.classList.add('closing');
  setTimeout(() => { overlay.classList.remove('open', 'closing'); document.body.style.overflow = ''; }, 220);
}

function closeDetailOutside(e) {
  if (e.target === document.getElementById('detailOverlay')) closeDetail();
}

loadFaculties();
lucide.createIcons();
