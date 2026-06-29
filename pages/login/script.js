function togglePass() {
  const i = document.getElementById('password');
  i.type = i.type === 'password' ? 'text' : 'password';
}
function handleLogin() {
  window.location.href = '../main/';
}
