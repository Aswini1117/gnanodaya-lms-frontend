// ── AUTH HELPERS ───────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('lms_token') || null;
}

function getUser() {
  return {
    id:    localStorage.getItem('lms_userId'),
    name:  localStorage.getItem('lms_name'),
    email: localStorage.getItem('lms_email'),
    role:  localStorage.getItem('lms_role')
  };
}

function isLoggedIn() {
  return !!getToken();
}

function logout() {
  localStorage.clear();
  window.location.href = '/index.html';
}

// ── DATE & CURRENCY ────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  const parsed = new Date(d);
  if (isNaN(parsed)) return '—';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  const parsed = new Date(d);
  if (isNaN(parsed)) return '—';
  return parsed.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

function timeAgo(d) {
  if (!d) return '—';
  const parsed = new Date(d);
  if (isNaN(parsed)) return '—';
  const m = Math.floor((Date.now() - parsed) / 60000);
  if (m < 1)    return 'just now';
  if (m < 60)   return m + 'm ago';
  if (m < 1440) return Math.floor(m / 60) + 'h ago';
  if (m < 10080) return Math.floor(m / 1440) + 'd ago';
  return formatDate(d);
}

// ── STRING HELPERS ─────────────────────────────────────────────────────────────
function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(' ')
    .map(w => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// ── UI HELPERS ─────────────────────────────────────────────────────────────────
function statusBadge(s) {
  const map = {
    ACTIVE:     'badge-success',
    INACTIVE:   'badge-danger',
    PENDING:    'badge-warning',
    SUSPENDED:  'badge-danger',
    PUBLISHED:  'badge-success',
    DRAFT:      'badge-secondary',
    COMPLETED:  'badge-info',
    ENROLLED:   'badge-primary',
    APPROVED:   'badge-success',
    REJECTED:   'badge-danger'
  };
  const cls = map[s?.toUpperCase()] || 'badge-secondary';
  return `<span class="badge ${cls}">${capitalize(s) || '—'}</span>`;
}

function avatarEl(name, bg) {
  return `<div class="user-avatar" style="background:${bg || 'var(--primary)'}">
    ${initials(name)}
  </div>`;
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  if (el) el.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <p>${msg}</p>
    </div>`;
}

function showEmpty(elId, msg = 'No data found.') {
  const el = document.getElementById(elId);
  if (el) el.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <p>${msg}</p>
    </div>`;
}