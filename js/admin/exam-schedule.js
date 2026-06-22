let allExams = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
  await loadExams();
});

async function loadExams() {
  const tb = document.getElementById('exams-table');
  try {
    const d = await api.get('/admin/exams');
    allExams = d || [];
    document.getElementById('exam-count').textContent = allExams.length;
    renderTable(allExams);
  } catch {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

function renderTable(data) {
  const tb = document.getElementById('exams-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">No exams scheduled</td></tr>';
    return;
  }
  tb.innerHTML = data.map(e => `
    <tr>
      <td style="font-weight:600">${e.title || '—'}</td>
      <td>${e.courseName || e.courseId || '—'}</td>
      <td>${formatDate(e.date)}</td>
      <td>${e.time || '—'}</td>
      <td>${e.duration ? e.duration + ' mins' : '—'}</td>
      <td>${statusBadge(e.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="editExam(${e.id})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteExam(${e.id})">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Schedule Exam';
  document.getElementById('exam-id').value       = '';
  document.getElementById('exam-title').value    = '';
  document.getElementById('exam-course').value   = '';
  document.getElementById('exam-date').value     = '';
  document.getElementById('exam-time').value     = '';
  document.getElementById('exam-duration').value = '';
  document.getElementById('exam-status').value   = 'SCHEDULED';
  document.getElementById('exam-modal').classList.add('show');
}

function editExam(id) {
  const e = allExams.find(x => x.id === id);
  if (!e) return;
  document.getElementById('modal-title').textContent = 'Edit Exam';
  document.getElementById('exam-id').value       = e.id;
  document.getElementById('exam-title').value    = e.title || '';
  document.getElementById('exam-course').value   = e.courseId || '';
  document.getElementById('exam-date').value     = e.date?.split('T')[0] || '';
  document.getElementById('exam-time').value     = e.time || '';
  document.getElementById('exam-duration').value = e.duration || '';
  document.getElementById('exam-status').value   = e.status || 'SCHEDULED';
  document.getElementById('exam-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('exam-modal').classList.remove('show');
}

async function saveExam() {
  const id       = document.getElementById('exam-id').value;
  const title    = document.getElementById('exam-title').value.trim();
  const courseId = document.getElementById('exam-course').value.trim();
  const date     = document.getElementById('exam-date').value;
  const time     = document.getElementById('exam-time').value;
  const duration = document.getElementById('exam-duration').value;
  const status   = document.getElementById('exam-status').value;
  if (!title || !courseId || !date) { showToast('Title, course and date are required', 'warning'); return; }
  try {
    if (id) {
      await api.put(`/admin/exams/${id}`, { title, courseId, date, time, duration, status });
      showToast('Exam updated!', 'success');
    } else {
      await api.post('/admin/exams', { title, courseId, date, time, duration, status });
      showToast('Exam scheduled!', 'success');
    }
    closeModal();
    loadExams();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function deleteExam(id) {
  if (!confirm('Delete this exam?')) return;
  try {
    await api.delete(`/admin/exams/${id}`);
    showToast('Deleted', 'success');
    loadExams();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}