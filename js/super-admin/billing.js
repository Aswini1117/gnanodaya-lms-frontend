document.addEventListener('DOMContentLoaded', async () => {
  guardPage('SUPER_ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Super Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadBilling();
});

async function loadBilling() {
  const tb = document.getElementById('billing-table');
  try {
    const d = await api.get('/super-admin/billing');
    document.getElementById('stat-revenue').textContent  = formatCurrency(d.monthlyRevenue  || 0);
    document.getElementById('stat-active').textContent   = d.activeSubscriptions || 0;
    document.getElementById('stat-trials').textContent   = d.trials              || 0;
    document.getElementById('stat-expiring').textContent = d.expiringSoon        || 0;

    const records = d.records || [];
    if (!records.length) {
      tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">No billing records</td></tr>';
      return;
    }
    tb.innerHTML = records.map(r => `
      <tr>
        <td style="font-weight:600">${r.instituteName || '—'}</td>
        <td><span class="badge badge-info">${r.plan || '—'}</span></td>
        <td>${formatCurrency(r.amount)}</td>
        <td>${formatDate(r.startDate)}</td>
        <td>${formatDate(r.expiryDate)}</td>
        <td>${statusBadge(r.status)}</td>
        <td>
          <button class="btn btn-sm" onclick="renewPlan(${r.id})">🔄 Renew</button>
        </td>
      </tr>
    `).join('');
  } catch {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

async function renewPlan(id) {
  if (!confirm('Renew this subscription?')) return;
  try {
    await api.post(`/super-admin/billing/${id}/renew`, {});
    showToast('Plan renewed!', 'success');
    loadBilling();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}