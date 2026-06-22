document.addEventListener('DOMContentLoaded', () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
});

async function downloadReport(type) {
  try {
    showToast(`Generating ${type} report...`, 'info');
    const d = await api.get(`/admin/reports/${type}`);
    if (!d?.length) { showToast('No data available', 'warning'); return; }
    const keys = Object.keys(d[0]);
    const rows = [keys, ...d.map(row => keys.map(k => row[k] ?? ''))];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${type}-report.csv`;
    a.click();
    showToast('Report downloaded!', 'success');
  } catch (e) { showToast(e.message || 'Failed to generate report', 'error'); }
}