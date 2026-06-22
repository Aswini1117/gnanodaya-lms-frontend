let allEnrollments = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
  await loadEnrollments();
});

async function loadEnrollments() {
  const tb = document.getElementById('enrollments-table');
  try {
    const d = await api.get('/admin/enrollments');
    allEnrollments = d || [];
    document.getElementById('enrollment-count').textContent = allEnrollments.length;
    renderTable(allEnrollments);
  } catch {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

function renderTable(data) {
  const tb = document.getElementById('enrollments-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No enrollments found</td></tr>';
    return;
  }
  tb.innerHTML = data.map(e => `
    <tr>
      <td>
        <div class="user-row">
          ${avatarEl(e.studentName, 'var(--primary)')}
          <span style="font-weight:600">${e.studentName || '—'}</span>
        </div>
      </td>
      <td>${e.courseName || '—'}</td>
      <td>${formatDate(e.enrolledAt)}</td>
      <td>
        <div class="progress-bar" style="width:100px">
          <div class="progress-fill" style="width:${e.progress ?? 0}%"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${e.progress ?? 0}%</div>
      </td>
      <td>${statusBadge(e.status)}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="removeEnrollment(${e.id})">🗑 Remove</button>
      </td>
    </tr>
  `).join('');
}

function filterEnrollments() {
  const q      = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('status-filter').value;
  const filtered = allEnrollments.filter(e => {
    const matchQ = !q || e.studentName?.toLowerCase().includes(q) || e.courseName?.toLowerCase().includes(q);
    const matchS = !status || e.status === status;
    return matchQ && matchS;
  });
  renderTable(filtered);
}

function openAddModal() {
  document.getElementById('enroll-student').value = '';
  document.getElementById('enroll-course').value  = '';
  document.getElementById('enrollment-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('enrollment-modal').classList.remove('show');
}

async function saveEnrollment() {
  const studentId = document.getElementById('enroll-student').value.trim();
  const courseId  = document.getElementById('enroll-course').value.trim();
  if (!studentId || !courseId) { showToast('Both fields are required', 'warning'); return; }
  try {
    await api.post('/admin/enrollments', { studentId, courseId });
    showToast('Student enrolled!', 'success');
    closeModal();
    loadEnrollments();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function removeEnrollment(id) {
  if (!confirm('Remove this enrollment?')) return;
  try {
    await api.delete(`/admin/enrollments/${id}`);
    showToast('Enrollment removed', 'success');
    loadEnrollments();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}