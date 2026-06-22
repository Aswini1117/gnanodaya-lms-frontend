function guardPage(requiredRole) {
  const token = localStorage.getItem('lms_token');
  const role  = localStorage.getItem('lms_role');
  if (!token) { window.location.href = '/index.html'; return false; }
  if (requiredRole && role?.toUpperCase() !== requiredRole.toUpperCase()) {
    window.location.href = '/unauthorized.html'; return false;
  }
  return true;
}
function getUser() { const u = localStorage.getItem('lms_user'); return u ? JSON.parse(u) : null; }
function getRole() { return localStorage.getItem('lms_role'); }
function logout()  { localStorage.clear(); window.location.href = '/index.html'; }