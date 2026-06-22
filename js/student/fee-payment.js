document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadFees();
});

async function loadFees() {
  const tb = document.getElementById('fee-table');
  try {
    const d = await api.get('/student/fees');
    const due  = d?.filter(f => f.status !== 'PAID').reduce((s, f) => s + (f.amount || 0), 0) || 0;
    const paid = d?.filter(f => f.status === 'PAID').reduce((s, f) => s + (f.amount || 0), 0) || 0;
    document.getElementById('stat-due').textContent  = formatCurrency(due);
    document.getElementById('stat-paid').textContent = formatCurrency(paid);

    if (!d?.length) {
      tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">No fee records</td></tr>';
      return;
    }
    tb.innerHTML = d.map(f => `
      <tr>
        <td style="font-weight:600">${f.courseName || '—'}</td>
        <td>${formatCurrency(f.amount)}</td>
        <td>${formatDate(f.dueDate)}</td>
        <td>${statusBadge(f.status)}</td>
        <td>
          ${f.status !== 'PAID'
            ? `<button class="btn btn-sm btn-primary" onclick="payFee(${f.id}, ${f.amount})">💳 Pay Now</button>`
            : '<span style="color:var(--success);font-size:12px">✓ Paid</span>'
          }
        </td>
      </tr>
    `).join('');
  } catch {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

async function payFee(id, amount) {
  if (!confirm(`Pay ${formatCurrency(amount)} now?`)) return;
  try {
    const res = await api.post(`/student/fees/${id}/pay`, {});
    if (res.paymentUrl) {
      window.open(res.paymentUrl, '_blank');
    } else {
      showToast('Payment initiated!', 'success');
      loadFees();
    }
  } catch (e) { showToast(e.message || 'Payment failed', 'error'); }
}