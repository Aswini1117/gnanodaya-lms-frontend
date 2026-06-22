let allFees = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
  await loadFees();
});

async function loadFees() {
  const tb = document.getElementById('fee-table');
  try {
    const d = await api.get('/admin/fees');
    allFees = d || [];
    document.getElementById('fee-count').textContent = allFees.length;
    const collected = allFees.filter(f => f.status === 'PAID').reduce((s, f) => s + (f.amount || 0), 0);
    const pending   = allFees.filter(f => f.status !== 'PAID').reduce((s, f) => s + (f.amount || 0), 0);
    document.getElementById('stat-collected').textContent = formatCurrency(collected);
    document.getElementById('stat-pending').textContent   = formatCurrency(pending);
    document.getElementById('stat-students').textContent  = new Set(allFees.map(f => f.studentId)).size;
    renderTable(allFees);
  } catch {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

function renderTable(data) {
  const tb = document.getElementById('fee-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">No records found</td></tr>';
    return;
  }
  tb.innerHTML = data.map(f => `
    <tr>
      <td>${f.studentName || f.studentId || '—'}</td>
      <td>${f.courseName  || f.courseId  || '—'}</td>
      <td style="font-weight:600">${formatCurrency(f.amount)}</td>
      <td>${formatDate(f.dueDate)}</td>
      <td>${formatDate(f.paidOn)}</td>
      <td>${statusBadge(f.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="editFee(${f.id})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteFee(${f.id})">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterFees() {
  const q      = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('status-filter').value;
  const filtered = allFees.filter(f => {
    const matchQ = !q || f.studentName?.toLowerCase().includes(q);
    const matchS = !status || f.status === status;
    return matchQ && matchS;
  });
  renderTable(filtered);
}

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Payment';
  document.getElementById('fee-id').value      = '';
  document.getElementById('fee-student').value = '';
  document.getElementById('fee-course').value  = '';
  document.getElementById('fee-amount').value  = '';
  document.getElementById('fee-due').value     = '';
  document.getElementById('fee-status').value  = 'PENDING';
  document.getElementById('fee-modal').classList.add('show');
}

function editFee(id) {
  const f = allFees.find(x => x.id === id);
  if (!f) return;
  document.getElementById('modal-title').textContent = 'Edit Payment';
  document.getElementById('fee-id').value      = f.id;
  document.getElementById('fee-student').value = f.studentId || '';
  document.getElementById('fee-course').value  = f.courseId  || '';
  document.getElementById('fee-amount').value  = f.amount    || '';
  document.getElementById('fee-due').value     = f.dueDate?.split('T')[0] || '';
  document.getElementById('fee-status').value  = f.status    || 'PENDING';
  document.getElementById('fee-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('fee-modal').classList.remove('show');
}

async function saveFee() {
  const id        = document.getElementById('fee-id').value;
  const studentId = document.getElementById('fee-student').value.trim();
  const courseId  = document.getElementById('fee-course').value.trim();
  const amount    = document.getElementById('fee-amount').value;
  const dueDate   = document.getElementById('fee-due').value;
  const status    = document.getElementById('fee-status').value;
  if (!studentId || !amount) { showToast('Student ID and amount are required', 'warning'); return; }
  try {
    if (id) {
      await api.put(`/admin/fees/${id}`, { studentId, courseId, amount, dueDate, status });
      showToast('Updated!', 'success');
    } else {
      await api.post('/admin/fees', { studentId, courseId, amount, dueDate, status });
      showToast('Payment added!', 'success');
    }
    closeModal();
    loadFees();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function deleteFee(id) {
  if (!confirm('Delete this record?')) return;
  try {
    await api.delete(`/admin/fees/${id}`);
    showToast('Deleted', 'success');
    loadFees();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

function exportFees() {
  const rows = [['Student','Course','Amount','Due Date','Status']];
  allFees.forEach(f => rows.push([f.studentName, f.courseName, f.amount, formatDate(f.dueDate), f.status]));
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fees.csv'; a.click();
}