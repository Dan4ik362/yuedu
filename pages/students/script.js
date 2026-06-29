const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('mouseenter', () => sidebar.classList.add('open'));
sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('open'));
function toggleDropdown() {
  document.getElementById('dropdown').classList.toggle('open');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown-wrap')) {
    document.getElementById('dropdown').classList.remove('open');
  }
});
function openAddStudentModal() {
  window.location.href = '../add-student/';
}

function downloadReport() {
  alert('Скачивание отчёта — в разработке');
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function seedDemoStudents() {
  const existing = JSON.parse(localStorage.getItem('yuedu_students') || '[]');
  if (existing.some(s => s.id === 1001)) return;
  const merged = [...existing];
  const demo = [
    {
      id: 1001,
      fio: 'Бакытов Даниял Н.',
      iin: '040307550848',
      dob: '2004-03-07',
      payForm: 'Государственный грант',
      specialty: '6B07201 "Информационные системы"',
      specialization: 'Разработка программного обеспечения',
      dateIn: '2022-09-01',
      fields: {
        f_last: 'Бакытов', f_first: 'Даниял', f_mid: 'Нурланович',
        f_iin: '040307550848', f_dob: '2004-03-07',
        f_gender: 'Мужской', f_nationality: 'Казах',
        f_citizenship: 'Казахстан',
        edu_date_in: '2022-09-01', edu_degree: 'Бакалавр',
        edu_form: 'Бакалавриат очная первое высшее образование',
        edu_lang: 'Казахский',
      }
    },
    {
      id: 1002,
      fio: 'Сейткали Айгерим Б.',
      iin: '030521400612',
      dob: '2003-05-21',
      payForm: 'Платная',
      specialty: '6B04101 "Финансы"',
      specialization: 'Банковское дело',
      dateIn: '2021-09-01',
      fields: {
        f_last: 'Сейткали', f_first: 'Айгерим', f_mid: 'Бекзатовна',
        f_iin: '030521400612', f_dob: '2003-05-21',
        f_gender: 'Женский', f_nationality: 'Казах',
        f_citizenship: 'Казахстан',
        edu_date_in: '2021-09-01', edu_degree: 'Бакалавр',
        edu_form: 'Бакалавриат очная первое высшее образование',
        edu_lang: 'Русский',
      }
    },
    {
      id: 1003,
      fio: 'Иванов Артём С.',
      iin: '011215301234',
      dob: '2001-12-15',
      payForm: 'Государственный грант',
      specialty: '6B07301 "Компьютерная инженерия"',
      specialization: 'Системное программирование',
      dateIn: '2020-09-01',
      fields: {
        f_last: 'Иванов', f_first: 'Артём', f_mid: 'Сергеевич',
        f_iin: '011215301234', f_dob: '2001-12-15',
        f_gender: 'Мужской', f_nationality: 'Русский',
        f_citizenship: 'Казахстан',
        edu_date_in: '2020-09-01', edu_degree: 'Бакалавр',
        edu_form: 'Бакалавриат очная первое высшее образование',
        edu_lang: 'Русский',
      }
    }
  ];
  localStorage.setItem('yuedu_students', JSON.stringify([...demo, ...merged]));
}

function seedGulazhar() {
  const existing = JSON.parse(localStorage.getItem('yuedu_students') || '[]');
  if (existing.some(s => s.id === 1004)) return;
  existing.push({
    id: 1004,
    fio: 'Бақытожанова Гулажар Қ.',
    iin: '010428620184',
    dob: '2001-04-28',
    payForm: 'Государственный грант',
    specialty: '7M04201 "Юриспруденция"',
    specialization: 'Правовое регулирование цифровой среды',
    dateIn: '2023-09-01',
    fields: {
      f_last: 'Бақытожанова', f_first: 'Гулажар', f_mid: 'Қоянбаевна',
      f_iin: '010428620184', f_dob: '2001-04-28',
      f_gender: 'Женский', f_nationality: 'Казах',
      f_citizenship: 'Казахстан',
      edu_date_in: '2023-09-01', edu_degree: 'Магистрант по профильному направлению',
      edu_form: 'Магистратура очная',
      edu_lang: 'Казахский',
    }
  });
  localStorage.setItem('yuedu_students', JSON.stringify(existing));
}
seedGulazhar();

seedDemoStudents();

function renderStudents() {
  const students = JSON.parse(localStorage.getItem('yuedu_students') || '[]');
  const tbody = document.querySelector('.students-table tbody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:24px">Нет добавленных обучающихся</td></tr>';
    return;
  }

  tbody.innerHTML = students.map((s, i) => `
    <tr>
      <td><input type="checkbox"></td>
      <td><a href="../show_students/?id=${s.id}" class="student-link">${s.fio || '—'}</a></td>
      <td>${s.payForm !== '— Выберите —' ? (s.payForm || '—') : '—'}</td>
      <td>${s.specialty !== '— Выберите специальность —' ? (s.specialty || '—') : '—'}</td>
      <td>${s.specialization !== '— Выберите ОП —' ? (s.specialization || '—') : '—'}</td>
      <td>${formatDate(s.dob)}</td>
      <td>${formatDate(s.dateIn)}</td>
    </tr>
  `).join('');
}

renderStudents();

lucide.createIcons();
