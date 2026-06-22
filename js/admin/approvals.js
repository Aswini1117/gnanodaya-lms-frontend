document.addEventListener('DOMContentLoaded', async () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
  await loadApprovals();
});

async function loadApprovals() {
  const tb = document.getElementById('approvals-table');
  try {
    const d = await api.get('/admin/approvals');
    const pending = d?.filter(a => a.status === 'PENDING') || [];
    document.getElementById('approval-count').textContent = pending.length;
    if (!d?.length) {
      tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">No approvals found</td></tr>';
      return;
    }
    tb.innerHTML = d.map(a => `
      <tr>
        <td>
          <div class="user-row">
            ${avatarEl(a.name, 'var(--instructor)')}
            <span style="font-weight:600">${a.name || '—'}</span>
          </div>
        </td>
        <td>${a.type || '—'}</td>
        <td>${formatDate(a.createdAt)}</td>
        <td>${statusBadge(a.status)}</td>
        <td>
          ${a.status === 'PENDING' ? `
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm btn-success" onclick="approve(${a.id})">✓ Approve</button>
              <button class="btn btn-sm btn-danger"  onclick="reject(${a.id})">✕ Reject</button>
            </div>` : '<span style="color:var(--text-muted);font-size:12px">Processed</span>'}
        </td>
      </tr>
    `).join('');
  } catch {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

async function approve(id) {
  try {
    await api.post(`/admin/approvals/${id}/approve`, {});
    showToast('Approved!', 'success');
    loadApprovals();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function reject(id) {
  try {
    await api.post(`/admin/approvals/${id}/reject`, {});
    showToast('Rejected', 'warning');
    loadApprovals();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}