let allAssignments = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('INSTRUCTOR');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Instructor';
    document.getElementById('nav-avatar').textContent = (u.name || 'I').charAt(0);
  }
  await loadAssignments();
});

async function loadAssignments() {
  const tb = document.getElementById('assignments-table');
  try {
    const d = await api.get('/instructor/assignments');
    allAssignments = d || [];
    document.getElementById('assignment-count').textContent = allAssignments.length;
    renderTable(allAssignments);
  } catch {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

function renderTable(data) {
  const tb = document.getElementById('assignments-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">No assignments found</td></tr>';
    return;
  }
  tb.innerHTML = data.map(a => `
    <tr>
      <td style="font-weight:600">${a.title || '—'}</td>
      <td>${a.courseName || '—'}</td>
      <td>${formatDate(a.dueDate)}</td>
      <td>${a.submissionCount ?? 0} submissions</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="editAssignment(${a.id})">✏️</button>
          <a href="/instructor/grade-book.html?assignmentId=${a.id}" class="btn btn-sm btn-primary">Grade</a>
          <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${a.id})">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddModal() {
  document.getElementById('modal-title').textContent    = 'Create Assignment';
  document.getElementById('assignment-id').value        = '';
  document.getElementById('assignment-title').value     = '';
  document.getElementById('assignment-desc').value      = '';
  document.getElementById('assignment-course').value    = '';
  document.getElementById('assignment-due').value       = '';
  document.getElementById('assignment-modal').classList.add('show');
}

function editAssignment(id) {
  const a = allAssignments.find(x => x.id === id);
  if (!a) return;
  document.getElementById('modal-title').textContent    = 'Edit Assignment';
  document.getElementById('assignment-id').value        = a.id;
  document.getElementById('assignment-title').value     = a.title || '';
  document.getElementById('assignment-desc').value      = a.description || '';
  document.getElementById('assignment-course').value    = a.courseId || '';
  document.getElementById('assignment-due').value       = a.dueDate?.split('T')[0] || '';
  document.getElementById('assignment-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('assignment-modal').classList.remove('show');
}

async function saveAssignment() {
  const id          = document.getElementById('assignment-id').value;
  const title       = document.getElementById('assignment-title').value.trim();
  const description = document.getElementById('assignment-desc').value.trim();
  const courseId    = document.getElementById('assignment-course').value.trim();
  const dueDate     = document.getElementById('assignment-due').value;
  if (!title || !courseId) { showToast('Title and course are required', 'warning'); return; }
  try {
    if (id) {
      await api.put(`/instructor/assignments/${id}`, { title, description, courseId, dueDate });
      showToast('Updated!', 'success');
    } else {
      await api.post('/instructor/assignments', { title, description, courseId, dueDate });
      showToast('Assignment created!', 'success');
    }
    closeModal();
    loadAssignments();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function deleteAssignment(id) {
  if (!confirm('Delete this assignment?')) return;
  try {
    await api.delete(`/instructor/assignments/${id}`);
    showToast('Deleted', 'success');
    loadAssignments();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}