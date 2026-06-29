(function () {
  const params = new URLSearchParams(window.location.search);
  const certId = params.get('certId');
  if (!certId) return; // нет ID — показываем статичные данные Гулажар

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

  // Specialty: берём из Специализации (7М04201-Юриспруденция)
  const rawSpec = student.specialization || student.specialty || '';
  const dashIdx = rawSpec.indexOf('-');
  const specCode = dashIdx > 0 ? rawSpec.slice(0, dashIdx).trim() : rawSpec.split(' ')[0];
  const afterDash = dashIdx > 0 ? rawSpec.slice(dashIdx + 1).trim() : rawSpec;
  const nameMatch = afterDash.match(/"([^"]+)"/);
  const specName = nameMatch ? nameMatch[1].toUpperCase() : afterDash.replace(/"/g, '').toUpperCase();

  // Английские названия специальностей
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

  // KZ версия
  set('certCmdTop', mdNum + ' магистр дипломына');
  set('certFio', fioKZ);
  set('certSpecialty', specCode + ' - "' + specName + '" ' + kzSuffix);
  set('certCmdBottom', mdNum);

  // RU версия
  set('certCmdRU', 'к диплому магистра ' + mdNum);
  set('certFioRU', fioKZ);
  set('certSpecialtyRU', specCode + ' - "' + specName + '" ' + ruSuffix);
  document.querySelectorAll('#certPaperRU .cert-footer-cmd').forEach(el => el.textContent = mdNum);

  // EN версия
  set('certCmdEN', mdNum + ' to the Master\'s diploma');
  set('certFioEN', fioEN);
  set('certSpecialtyEN', specCode + ' - "' + specNameEN + '" ' + enSuffix);
  document.querySelectorAll('#certPaperEN .cert-footer-cmd').forEach(el => el.textContent = mdNum);

  function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
})();
