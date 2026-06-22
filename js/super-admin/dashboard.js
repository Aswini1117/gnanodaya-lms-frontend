document.addEventListener('DOMContentLoaded', async () => {
  guardPage('SUPER_ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Super Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await Promise.all([
    loadStats(),
    loadInstitutes(),
    loadAuditLogs()
  ]);
});

async function loadStats() {
  try {
    const d = await api.get('/super-admin/stats');
    document.getElementById('stat-institutes').textContent = d.totalInstitutes  ?? '—';
    document.getElementById('stat-users').textContent      = d.totalUsers       ?? '—';
    document.getElementById('stat-courses').textContent    = d.totalCourses     ?? '—';
    document.getElementById('stat-revenue').textContent    = formatCurrency(d.monthlyRevenue);
    document.getElementById('stat-uptime').textContent     = (d.uptime ?? 99.9) + '%';
  } catch {
    showToast('Failed to load stats', 'error');
  }
}

async function loadInstitutes() {
  const tb = document.getElementById('institute-list');
  try {
    const d = await api.get('/super-admin/institutes');
    if (!d?.length) {
      tb.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">No institutes</td></tr>';
      return;
    }
    tb.innerHTML = d.map(i => `
      <tr>
        <td>
          <div class="user-row">
            ${avatarEl(i.name, 'var(--super-admin)')}
            <span style="font-weight:600">${i.name || '—'}</span>
          </div>
        </td>
        <td>${i.totalUsers?.toLocaleString() ?? '—'}</td>
        <td>${i.plan || '—'}</td>
        <td>${statusBadge(i.status)}</td>
      </tr>
    `).join('');
  } catch {
    tb.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

async function loadAuditLogs() {
  const el = document.getElementById('audit-log-list');
  try {
    const d = await api.get('/super-admin/audit-logs/recent');
    if (!d?.length) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No logs</p>';
      return;
    }
    el.innerHTML = d.slice(0, 5).map(l => `
      <div class="list-item">
        <div style="flex:1">
          <div class="item-title">${l.action || '—'}</div>
          <div class="item-sub">${l.performedBy || ''} · ${timeAgo(l.createdAt)}</div>
        </div>
        <span class="badge badge-secondary">${l.type || 'Action'}</span>
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">Failed to load</p>';
  }
}