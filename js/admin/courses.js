let allCourses = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
  await loadCourses();
});

async function loadCourses() {
  const tb = document.getElementById('courses-table');
  try {
    const d = await api.get('/admin/courses');
    allCourses = d || [];
    document.getElementById('course-count').textContent = allCourses.length;
    renderTable(allCourses);
  } catch {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

function renderTable(data) {
  const tb = document.getElementById('courses-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No courses found</td></tr>';
    return;
  }
  tb.innerHTML = data.map(c => `
    <tr>
      <td><div style="font-weight:600">${c.title || '—'}</div><div style="font-size:11px;color:var(--text-muted)">${c.description ? c.description.slice(0,50) + '...' : ''}</div></td>
      <td>${c.instructorName || '—'}</td>
      <td>${c.totalStudents ?? 0}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="editCourse(${c.id})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCourse(${c.id})">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterCourses() {
  const q      = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('status-filter').value;
  const filtered = allCourses.filter(c => {
    const matchQ = !q || c.title?.toLowerCase().includes(q);
    const matchS = !status || c.status === status;
    return matchQ && matchS;
  });
  renderTable(filtered);
}

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Course';
  document.getElementById('course-id').value         = '';
  document.getElementById('course-title').value      = '';
  document.getElementById('course-desc').value       = '';
  document.getElementById('course-instructor').value = '';
  document.getElementById('course-status').value     = 'DRAFT';
  document.getElementById('course-modal').classList.add('show');
}

function editCourse(id) {
  const c = allCourses.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modal-title').textContent  = 'Edit Course';
  document.getElementById('course-id').value          = c.id;
  document.getElementById('course-title').value       = c.title || '';
  document.getElementById('course-desc').value        = c.description || '';
  document.getElementById('course-instructor').value  = c.instructorId || '';
  document.getElementById('course-status').value      = c.status || 'DRAFT';
  document.getElementById('course-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('course-modal').classList.remove('show');
}

async function saveCourse() {
  const id         = document.getElementById('course-id').value;
  const title      = document.getElementById('course-title').value.trim();
  const description= document.getElementById('course-desc').value.trim();
  const instructorId= document.getElementById('course-instructor').value.trim();
  const status     = document.getElementById('course-status').value;

  if (!title) { showToast('Course title is required', 'warning'); return; }

  try {
    if (id) {
      await api.put(`/admin/courses/${id}`, { title, description, instructorId, status });
      showToast('Course updated!', 'success');
    } else {
      await api.post('/admin/courses', { title, description, instructorId, status });
      showToast('Course added!', 'success');
    }
    closeModal();
    loadCourses();
  } catch (e) { showToast(e.message || 'Failed to save', 'error'); }
}

async function deleteCourse(id) {
  if (!confirm('Delete this course?')) return;
  try {
    await api.delete(`/admin/courses/${id}`);
    showToast('Course deleted', 'success');
    loadCourses();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}