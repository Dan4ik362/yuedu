const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('mouseenter', () => sidebar.classList.add('open'));
sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('open'));

function downloadReport() {
  alert('Скачивание отчёта — в разработке');
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

/* ===== DEMO DATA ===== */
const DEMO_CERTS = [
  { id: 2001, studentId: 1001, studentFio: 'Бакытов Даниял Н.', type: 'Языковой', name: 'IELTS Academic 6.5', number: 'KZ-2024-001101', org: 'British Council', dateIssue: '2024-03-15', dateExpiry: '2026-03-15', note: '' },
  { id: 2002, studentId: 1001, studentFio: 'Бакытов Даниял Н.', type: 'Профессиональный', name: 'AWS Certified Developer', number: 'AWS-2025-038821', org: 'Amazon Web Services', dateIssue: '2025-01-20', dateExpiry: '2028-01-20', note: '' },
  { id: 2003, studentId: 1002, studentFio: 'Сейткали Айгерим Б.', type: 'Языковой', name: 'TOEFL iBT 95', number: 'TOEFL-2023-774422', org: 'ETS', dateIssue: '2023-06-10', dateExpiry: '2025-06-10', note: 'Действителен 2 года' },
  { id: 2004, studentId: 1002, studentFio: 'Сейткали Айгерим Б.', type: 'Академический', name: 'Диплом с отличием', number: 'ДО-2023-0012', org: 'ЮГУ им. Ш.Есенова', dateIssue: '2023-07-01', dateExpiry: '', note: '' },
  { id: 2005, studentId: 1003, studentFio: 'Иванов Артём С.', type: 'Профессиональный', name: 'Google Cloud Associate', number: 'GCA-2025-990033', org: 'Google', dateIssue: '2025-04-05', dateExpiry: '2028-04-05', note: '' },
  { id: 2006, studentId: 1003, studentFio: 'Иванов Артём С.', type: 'Спортивный', name: 'КМС по шахматам', number: 'КМС-2022-4411', org: 'Федерация шахмат РК', dateIssue: '2022-11-01', dateExpiry: '', note: '' },
  { id: 2007, studentId: 1004, studentFio: 'Бақытожанова Гулажар Қ.', type: 'Академический', name: 'Куәлік магистр дипломына', number: 'CMD 00015228124', org: 'ЮГУ им. Ш.Есенова', dateIssue: '2026-06-29', dateExpiry: '', note: 'Бейіндік магистратура', certView: true },
];

function loadCerts() {
  const stored = JSON.parse(localStorage.getItem('yuedu_certs') || 'null');
  if (!stored) {
    localStorage.setItem('yuedu_certs', JSON.stringify(DEMO_CERTS));
    return DEMO_CERTS;
  }
  if (!stored.some(c => c.id === 2007)) {
    const merged = [...stored, DEMO_CERTS.find(c => c.id === 2007)];
    localStorage.setItem('yuedu_certs', JSON.stringify(merged));
    return merged;
  }
  return stored;
}

function saveCerts(certs) {
  localStorage.setItem('yuedu_certs', JSON.stringify(certs));
}

/* ===== RENDER ===== */
let _allCerts = loadCerts();
let _filtered = [..._allCerts];

function renderTable(certs) {
  const tbody = document.getElementById('certTableBody');
  document.getElementById('resultsCount').textContent = certs.length;

  if (certs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px">Нет сертификатов</td></tr>';
    return;
  }

  tbody.innerHTML = certs.map(c => {
    const expired = c.dateExpiry && isExpired(c.dateExpiry);
    const statusBadge = c.dateExpiry
      ? `<span class="badge-status ${expired ? 'badge-expired' : 'badge-active'}">${expired ? 'Истёк' : 'Активен'}</span>`
      : `<span class="badge-status badge-active">Бессрочный</span>`;
    const nameCell = c.certView
      ? `<a href="../cert-view/?certId=${c.id}" class="cert-link">${c.studentFio || '—'}</a>`
      : `<span class="cert-link">${c.studentFio || '—'}</span>`;
    return `
      <tr>
        <td><input type="checkbox"></td>
        <td>${nameCell}</td>
        <td>${c.type || '—'}</td>
        <td>${c.name || '—'}</td>
        <td>${c.number || '—'}</td>
        <td>${formatDate(c.dateIssue)}</td>
        <td>${c.dateExpiry ? formatDate(c.dateExpiry) : '—'}</td>
        <td>${statusBadge}</td>
      </tr>`;
  }).join('');
}

/* ===== FILTER ===== */
function filterCerts() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const type = document.getElementById('filterType').value;
  const status = document.getElementById('filterStatus').value;
  const year = document.getElementById('filterYear').value;

  _filtered = _allCerts.filter(c => {
    if (q && !c.studentFio.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q) && !c.number.toLowerCase().includes(q)) return false;
    if (type && c.type !== type) return false;
    if (year && !c.dateIssue.startsWith(year)) return false;
    if (status === 'Активен' && c.dateExpiry && isExpired(c.dateExpiry)) return false;
    if (status === 'Истёк' && (!c.dateExpiry || !isExpired(c.dateExpiry))) return false;
    return true;
  });

  renderTable(_filtered);
}

/* ===== ADD CERT MODAL ===== */
function openAddCertModal() {
  const students = JSON.parse(localStorage.getItem('yuedu_students') || '[]');
  const sel = document.getElementById('cert_student');
  sel.innerHTML = '<option value="">— Выберите —</option>' +
    students.map(s => `<option value="${s.id}">${s.fio}</option>`).join('');
  document.getElementById('addCertModal').classList.add('open');
}

function closeAddCertModal() {
  document.getElementById('addCertModal').classList.remove('open');
}

function saveCert() {
  const studentId = parseInt(document.getElementById('cert_student').value);
  const students = JSON.parse(localStorage.getItem('yuedu_students') || '[]');
  const student = students.find(s => s.id === studentId);

  const name = document.getElementById('cert_name').value.trim();
  if (!name) { alert('Введите название сертификата'); return; }

  const newCert = {
    id: Date.now(),
    studentId,
    studentFio: student ? student.fio : '—',
    type: document.getElementById('cert_type').value,
    name,
    number: document.getElementById('cert_number').value.trim(),
    org: document.getElementById('cert_org').value.trim(),
    dateIssue: document.getElementById('cert_date_issue').value,
    dateExpiry: document.getElementById('cert_date_expiry').value,
    note: document.getElementById('cert_note').value.trim(),
  };

  _allCerts.push(newCert);
  saveCerts(_allCerts);
  closeAddCertModal();
  filterCerts();

  ['cert_student','cert_type','cert_name','cert_number','cert_org','cert_date_issue','cert_date_expiry','cert_note'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function toggleAll(cb) {
  document.querySelectorAll('#certTableBody input[type=checkbox]').forEach(c => c.checked = cb.checked);
}

/* ===== INIT ===== */
renderTable(_allCerts);
lucide.createIcons();
