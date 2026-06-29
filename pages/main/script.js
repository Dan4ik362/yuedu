const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('mouseenter', () => sidebar.classList.add('open'));
sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('open'));

const MONTHS_RU = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
let current = new Date();
let viewYear = current.getFullYear();
let viewMonth = current.getMonth();

function changeMonth(dir) {
  viewMonth += dir;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  if (viewMonth < 0)  { viewMonth = 11; viewYear--; }
  renderCalendar();
}

function renderCalendar() {
  document.getElementById('cal-title').textContent = MONTHS_RU[viewMonth] + '. ' + viewYear;

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay  = new Date(viewYear, viewMonth + 1, 0);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const today = new Date();
  let html = '';

  const prevLast = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    html += `<div class="cal-cell other">${prevLast - i}</div>`;
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
    const isSat = (startOffset + d - 1) % 7 === 5;
    const isSun = (startOffset + d - 1) % 7 === 6;
    const cls = ['cal-cell', isToday ? 'today' : '', (isSat || isSun) ? 'weekend' : ''].filter(Boolean).join(' ');
    html += `<div class="${cls}"><span>${d}</span></div>`;
  }

  const totalCells = startOffset + lastDay.getDate();
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= remaining; d++) {
    html += `<div class="cal-cell other">${d}</div>`;
  }

  document.getElementById('cal-body').innerHTML = html;
}

document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

renderCalendar();
lucide.createIcons();
