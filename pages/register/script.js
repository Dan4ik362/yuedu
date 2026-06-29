function togglePass(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

const pwd = document.getElementById('password');
pwd.addEventListener('input', () => {
  const v = pwd.value;
  toggle('rule-len', v.length >= 8);
  toggle('rule-upper', /[A-ZА-Я]/.test(v));
  toggle('rule-num', /\d/.test(v));
});

function toggle(id, ok) {
  const el = document.getElementById(id);
  el.textContent = (ok ? '✓' : '✗') + el.textContent.slice(1);
  el.classList.toggle('ok', ok);
}
