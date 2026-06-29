(function () {
  const params = new URLSearchParams(window.location.search);
  const certId = params.get('certId');
  if (!certId) return;

  const certs = JSON.parse(localStorage.getItem('yuedu_certs') || '[]');
  const cert = certs.find(c => String(c.id) === certId);
  if (!cert) return;

  const students = JSON.parse(localStorage.getItem('yuedu_students') || '[]');
  const student = students.find(s => s.id === cert.studentId);
  if (!student) return;

  const f = student.fields || {};
  const fioKZ = [f.f_last, f.f_first, f.f_mid].filter(Boolean).join(' ') || student.fio;
  const fioEN = [f.f_last_tr, f.f_first_tr, f.f_mid_tr].filter(Boolean).join(' ') || fioKZ;
  const mdNum = cert.number || '';

  const rawSpec = student.specialization || student.specialty || '';
  const dashIdx = rawSpec.indexOf('-');
  const specCode = dashIdx > 0 ? rawSpec.slice(0, dashIdx).trim() : rawSpec.split(' ')[0];
  const afterDash = dashIdx > 0 ? rawSpec.slice(dashIdx + 1).trim() : rawSpec;
  const nameMatch = afterDash.match(/"([^"]+)"/);
  const specName = nameMatch ? nameMatch[1].toUpperCase() : afterDash.replace(/"/g, '').toUpperCase();

  const SPEC_EN_MAP = {
    'ЮРИСПРУДЕНЦИЯ': 'JURISPRUDENCE',
    'ПРАВО': 'LAW',
    'ИНФОРМАЦИОННЫЕ СИСТЕМЫ': 'INFORMATION SYSTEMS',
    'ФИНАНСЫ': 'FINANCE',
    'КОМПЬЮТЕРНАЯ ИНЖЕНЕРИЯ': 'COMPUTER ENGINEERING',
  };
  const specNameEN = SPEC_EN_MAP[specName] || specName;

  const degree = (f.edu_degree || '').toLowerCase();
  const isMaster = degree.includes('магистр');
  const kzSuffix = isMaster ? 'БЕЙІНДІК МАГИСТРАТУРАНЫ БІТІРГЕН ТҰЛҒАЛАР ҮШІН' : '';
  const ruSuffix = isMaster ? 'ДЛЯ ЛИЦ, ОКОНЧИВШИХ ПРОФИЛЬНУЮ МАГИСТРАТУРУ' : '';
  const enSuffix = isMaster ? 'FOR PERSONS WHO COMPLETED PROFILE MASTER\'S PROGRAM' : '';

  function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  set('certCmdTop', mdNum + ' магистр дипломына');
  set('certFio', fioKZ);
  set('certSpecialty', specCode + ' - "' + specName + '" ' + kzSuffix);
  set('certCmdBottom', mdNum);

  set('certCmdRU', 'к диплому магистра ' + mdNum);
  set('certFioRU', fioKZ);
  set('certSpecialtyRU', specCode + ' - "' + specName + '" ' + ruSuffix);
  document.querySelectorAll('#certPaperRU .cert-footer-cmd').forEach(el => el.textContent = mdNum);

  set('certCmdEN', mdNum + ' to the Master\'s diploma');
  set('certFioEN', fioEN);
  set('certSpecialtyEN', specCode + ' - "' + specNameEN + '" ' + enSuffix);
  document.querySelectorAll('#certPaperEN .cert-footer-cmd').forEach(el => el.textContent = mdNum);

  /* ===== ЗАПОЛНЯЕМ ТАБЛИЦЫ ИЗ ЖУРНАЛА ===== */
  const specVal = f.edu_specialty || '';
  const opVal   = f.edu_op        || '';
  const grpVal  = f.edu_group     || '';

  const journal = JSON.parse(localStorage.getItem('yuedu_journal') || '[]');
  const entry = journal.find(e => {
    const specMatch = !specVal || e.spec === specVal;
    const opMatch   = !opVal   || e.op   === opVal;
    const grpMatch  = !grpVal  || e.group.toLowerCase() === grpVal.toLowerCase();
    return specMatch && opMatch && grpMatch;
  });

  if (!entry) return;

  const studentId = student.id;
  const gKey = `${studentId}_${entry.id}`;
  const grades = JSON.parse(localStorage.getItem('yuedu_grades') || '{}');
  const saved = grades[gKey] || {};

  // Традиционные оценки на 3 языках
  const TRAD_MAP = {
    'Отлично':            { kz: 'Өте жақсы', en: 'Excellent' },
    'Хорошо':             { kz: 'Жақсы',     en: 'Good' },
    'Удовлетворительно':  { kz: 'Қанағаттанарлық', en: 'Satisfactory' },
    'Неудовлетворительно':{ kz: 'Қанағаттанарлықсыз', en: 'Unsatisfactory' },
  };

  function getGrade(index, section) {
    const rkey = `${index}_${section}`;
    return saved[rkey] || {};
  }

  function buildRows(items, section, lang) {
    return items.map((d, i) => {
      const g = getGrade(i, section);
      const name = lang === 'kz' ? (d.name_kz || d.name_ru || d.name_en || '—')
                 : lang === 'ru' ? (d.name_ru || d.name_kz || d.name_en || '—')
                 : (d.name_en || d.name_ru || d.name_kz || '—');

      const tradRu = g.trad && g.trad !== '—' ? g.trad : '—';
      const tradKz = TRAD_MAP[tradRu]?.kz || tradRu;
      const tradEn = TRAD_MAP[tradRu]?.en || tradRu;
      const trad   = lang === 'kz' ? tradKz : lang === 'en' ? tradEn : tradRu;

      const pct  = g.total ? g.total.replace('%', '') : '—';
      const gpa  = g.gpa  || '—';
      const let_ = g.let  || '—';

      return `<tr>
        <td>${i + 1}</td>
        <td>${name}</td>
        <td>${d.credits || '—'}</td>
        <td>${pct}</td>
        <td>${let_}</td>
        <td>${gpa}</td>
        <td>${trad}</td>
      </tr>`;
    }).join('');
  }

  const disciplines = entry.disciplines || [];
  const practices   = entry.practices   || [];

  // KZ
  const kzDiscTbody = document.querySelector('#certCourseTable tbody');
  const kzPracTbody = document.querySelector('#certPracticeTable tbody');
  if (kzDiscTbody) kzDiscTbody.innerHTML = buildRows(disciplines, 'ДИСЦИПЛИНЫ', 'kz');
  if (kzPracTbody) kzPracTbody.innerHTML = buildRows(practices,   'ПРАКТИКА',   'kz');

  // RU
  const ruDiscTbody = document.querySelector('#certPaperRU .cert-table:nth-of-type(1) tbody');
  const ruPracTbody = document.querySelector('#certPaperRU .cert-table:nth-of-type(2) tbody');
  if (ruDiscTbody) ruDiscTbody.innerHTML = buildRows(disciplines, 'ДИСЦИПЛИНЫ', 'ru');
  if (ruPracTbody) ruPracTbody.innerHTML = buildRows(practices,   'ПРАКТИКА',   'ru');

  // EN
  const enDiscTbody = document.querySelector('#certPaperEN .cert-table:nth-of-type(1) tbody');
  const enPracTbody = document.querySelector('#certPaperEN .cert-table:nth-of-type(2) tbody');
  if (enDiscTbody) enDiscTbody.innerHTML = buildRows(disciplines, 'ДИСЦИПЛИНЫ', 'en');
  if (enPracTbody) enPracTbody.innerHTML = buildRows(practices,   'ПРАКТИКА',   'en');
})();
