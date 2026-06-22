let allLogs = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('SUPER_ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Super Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadLogs();
});

async function loadLogs() {
  const tb = document.getElementById('logs-table');
  try {
    const d = await api.get('/super-admin/audit-logs');
    allLogs = d || [];
    document.getElementById('log-count').textContent = allLogs.length;
    renderTable(allLogs);
  } catch {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

function renderTable(data) {
  const tb = document.getElementById('logs-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">No logs found</td></tr>';
    return;
  }
  tb.innerHTML = data.map(l => `
    <tr>
      <td style="font-weight:500">${l.action || '—'}</td>
      <td>${l.performedBy || '—'}</td>
      <td>${l.instituteName || '—'}</td>
      <td><span class="badge badge-secondary">${l.type || '—'}</span></td>
      <td style="color:var(--text-muted);font-size:12px">${formatDate(l.createdAt)} ${l.time || ''}</td>
    </tr>
  `).join('');
}

function filterLogs() {
  const q        = document.getElementById('search-input').value.toLowerCase();
  const type     = document.getElementById('type-filter').value;
  const dateFrom = document.getElementById('date-from').value;
  const dateTo   = document.getElementById('date-to').value;
  const filtered = allLogs.filter(l => {
    const matchQ    = !q    || l.action?.toLowerCase().includes(q) || l.performedBy?.toLowerCase().includes(q);
    const matchType = !type || l.type === type;
    const logDate   = new Date(l.createdAt);
    const matchFrom = !dateFrom || logDate >= new Date(dateFrom);
    const matchTo   = !dateTo   || logDate <= new Date(dateTo);
    return matchQ && matchType && matchFrom && matchTo;
  });
  document.getElementById('log-count').textContent = filtered.length;
  renderTable(filtered);
}

function exportLogs() {
  const rows = [['Action','Performed By','Institute','Type','Time']];
  allLogs.forEach(l => rows.push([l.action, l.performedBy, l.instituteName, l.type, formatDate(l.createdAt)]));
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'audit-logs.csv';
  a.click();
}