let allAssignments = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadAssignments();
});

async function loadAssignments() {
  const tb = document.getElementById('assignments-table');
  try {
    const d = await api.get('/student/assignments');
    allAssignments = d || [];
    document.getElementById('assignment-count').textContent = allAssignments.length;
    renderTable(allAssignments);
  } catch {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

function renderTable(data) {
  const tb = document.getElementById('assignments-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No assignments found</td></tr>';
    return;
  }
  tb.innerHTML = data.map(a => {
    const days    = Math.ceil((new Date(a.dueDate) - Date.now()) / 86400000);
    const overdue = days < 0 && a.status === 'PENDING';
    return `
      <tr>
        <td style="font-weight:600">${a.title || '—'}</td>
        <td>${a.courseName || '—'}</td>
        <td style="color:${overdue ? 'var(--error)' : 'inherit'}">${formatDate(a.dueDate)}</td>
        <td>${a.grade != null ? a.grade + '/100' : '—'}</td>
        <td>${statusBadge(overdue ? 'OVERDUE' : a.status)}</td>
        <td>
          ${a.status === 'PENDING' || a.status === 'OVERDUE'
            ? `<button class="btn btn-sm btn-primary" onclick="openSubmit(${a.id}, '${a.title}')">Submit</button>`
            : a.status === 'SUBMITTED'
            ? `<span style="font-size:12px;color:var(--text-muted)">Awaiting grade</span>`
            : `<span style="font-size:12px;color:var(--success)">✓ Graded</span>`
          }
        </td>
      </tr>`;
  }).join('');
}

function filterAssignments() {
  const status = document.getElementById('status-filter').value;
  const filtered = allAssignments.filter(a => !status || a.status === status);
  renderTable(filtered);
}

function openSubmit(id, title) {
  document.getElementById('assignment-id').value    = id;
  document.getElementById('modal-title').textContent = `Submit: ${title}`;
  document.getElementById('submit-text').value       = '';
  document.getElementById('submit-file').value       = '';
  document.getElementById('submit-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('submit-modal').classList.remove('show');
}

async function submitAssignment() {
  const id      = document.getElementById('assignment-id').value;
  const text    = document.getElementById('submit-text').value.trim();
  const fileUrl = document.getElementById('submit-file').value.trim();
  if (!text && !fileUrl) { showToast('Please add an answer or file URL', 'warning'); return; }
  try {
    await api.post(`/student/assignments/${id}/submit`, { text, fileUrl });
    showToast('Assignment submitted!', 'success');
    closeModal();
    loadAssignments();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}