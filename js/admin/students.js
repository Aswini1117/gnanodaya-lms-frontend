let allPending = [];
let allActive  = [];
let currentTab = 'pending';

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
  await Promise.all([loadPending(), loadActive()]);
});

// ── TAB SWITCH ─────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  document.getElementById('panel-pending').style.display = tab === 'pending' ? 'block' : 'none';
  document.getElementById('panel-active').style.display  = tab === 'active'  ? 'block' : 'none';
  document.getElementById('tab-pending').classList.toggle('active', tab === 'pending');
  document.getElementById('tab-active').classList.toggle('active',  tab === 'active');
}

// ── LOAD PENDING ───────────────────────────────────────
async function loadPending() {
  const u           = getUser();
  const instituteId = u?.instituteId || 1;
  const tb          = document.getElementById('pending-table');
  try {
    const res  = await api.get(`/admin/students/pending/${instituteId}`);
    allPending = res?.data || res || [];
    document.getElementById('pending-count').textContent = allPending.length;
    renderPending(allPending);
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load: ${e.message}</td></tr>`;
  }
}

// ── RENDER PENDING ─────────────────────────────────────
function renderPending(data) {
  const tb = document.getElementById('pending-table');
  if (!data.length) {
    tb.innerHTML = `
      <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">
        <div style="font-size:32px;margin-bottom:8px">🎉</div>
        No pending registrations
      </td></tr>`;
    return;
  }
  tb.innerHTML = data.map(s => `
    <tr>
      <td>
        <div class="user-row">
          ${avatarEl(s.fullName, 'var(--warning)')}
          <span style="font-weight:600">${s.fullName || '—'}</span>
        </div>
      </td>
      <td>${s.phone || '—'}</td>
      <td>${s.email || '—'}</td>
      <td>${formatDate(s.createdAt)}</td>
      <td>
        <button class="btn btn-sm btn-success" onclick="giveAccess(${s.id})">
          ✅ Give Access
        </button>
      </td>
    </tr>
  `).join('');
}

// ── LOAD ACTIVE ────────────────────────────────────────
async function loadActive() {
  const u           = getUser();
  const instituteId = u?.instituteId || 1;
  const tb          = document.getElementById('active-table');
  try {
    const res = await api.get(`/admin/students/${instituteId}`);
    allActive = (res?.data || res || []).filter(s => s.status === 'ACTIVE');
    document.getElementById('active-count').textContent       = allActive.length;
    document.getElementById('active-count-table').textContent = allActive.length;
    renderActive(allActive);
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load: ${e.message}</td></tr>`;
  }
}

// ── RENDER ACTIVE ──────────────────────────────────────
function renderActive(data) {
  const tb = document.getElementById('active-table');
  if (!data.length) {
    tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No active students found</td></tr>`;
    return;
  }
  tb.innerHTML = data.map(s => `
    <tr>
      <td>
        <div class="user-row">
          ${avatarEl(s.fullName, 'var(--primary)')}
          <span style="font-weight:600">${s.fullName || '—'}</span>
        </div>
      </td>
      <td>${s.phone || '—'}</td>
      <td>${s.email || '—'}</td>
      <td>${formatDate(s.createdAt)}</td>
      <td><span class="badge badge-success">ACTIVE</span></td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="revokeAccess(${s.id})">
          🚫 Revoke Access
        </button>
      </td>
    </tr>
  `).join('');
}

// ── FILTER ACTIVE ──────────────────────────────────────
function filterActive() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const filtered = allActive.filter(s =>
    !q ||
    s.fullName?.toLowerCase().includes(q) ||
    s.phone?.includes(q)
  );
  renderActive(filtered);
}

// ── GIVE ACCESS ────────────────────────────────────────
async function giveAccess(studentId) {
  const u           = getUser();
  const instituteId = u?.instituteId || 1;
  if (!confirm('Give this student access to log in?')) return;
  try {
    await api.put(`/admin/students/${studentId}/give-access?instituteId=${instituteId}`);
    showToast('Access granted! Student can now log in.', 'success');
    await Promise.all([loadPending(), loadActive()]);
  } catch (e) {
    showToast(e.message || 'Failed to give access', 'error');
  }
}

// ── REVOKE ACCESS ──────────────────────────────────────
async function revokeAccess(studentId) {
  if (!confirm('Revoke this student\'s access? They will not be able to log in.')) return;
  try {
    await api.put(`/admin/students/${studentId}/revoke-access`);
    showToast('Access revoked.', 'success');
    await Promise.all([loadPending(), loadActive()]);
  } catch (e) {
    showToast(e.message || 'Failed to revoke access', 'error');
  }
}

// ── FORMAT DATE ────────────────────────────────────────
function formatDate(val) {
  if (!val) return '—';
  try {
    if (Array.isArray(val)) {
      const [y, m, d] = val;
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const dt = new Date(val);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}