const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('mouseenter', () => sidebar.classList.add('open'));
sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('open'));

const DAY_NAMES = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MONTHS_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

let weekOffset = 0;

function getMondayOfWeek(offset) {
  const today = new Date();
  const day = today.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function renderWeek() {
  const monday = getMondayOfWeek(weekOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  document.getElementById('weekLabel').textContent =
    `${monday.getDate()} ${MONTHS_RU[monday.getMonth()]} — ${sunday.getDate()} ${MONTHS_RU[sunday.getMonth()]} ${sunday.getFullYear()}`;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.getTime() === today.getTime();
    const el = document.getElementById('day-' + i);
    el.innerHTML = `
      <div class="day-name">${DAY_NAMES[i]}</div>
      <div class="day-num ${isToday ? 'today' : ''}">${d.getDate()}</div>
    `;
  }
}

function changeWeek(dir) {
  weekOffset += dir;
  renderWeek();
}

function goToday() {
  weekOffset = 0;
  renderWeek();
}

document.querySelectorAll('.view-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

renderWeek();
lucide.createIcons();
