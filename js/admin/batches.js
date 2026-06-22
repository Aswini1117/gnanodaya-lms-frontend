let allBatches = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
  await Promise.all([loadBatches(), loadCourses(), loadInstructors()]);
});

// ── LOAD BATCHES ───────────────────────────────────────
async function loadBatches() {
  const u           = getUser();
  const instituteId = u?.instituteId || 1;
  const tb          = document.getElementById('batches-table');
  try {
    const res  = await api.get(`/admin/batches/${instituteId}`);
    allBatches = res?.data || res || [];
    document.getElementById('batch-count').textContent = allBatches.length;
    renderTable(allBatches);
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load: ${e.message}</td></tr>`;
  }
}

// ── LOAD COURSES ───────────────────────────────────────
async function loadCourses() {
  const u           = getUser();
  const instituteId = u?.instituteId || 1;
  try {
    const res     = await api.get(`/admin/courses/${instituteId}`);
    const courses = res?.data || res || [];
    const sel     = document.getElementById('batch-course');
    sel.innerHTML = '<option value="">Select course</option>' +
      courses.map(c => `<option value="${c.id}">${c.title || c.name}</option>`).join('');
  } catch (e) {
    console.error('Failed to load courses:', e);
  }
}

// ── LOAD INSTRUCTORS ───────────────────────────────────
async function loadInstructors() {
  const u           = getUser();
  const instituteId = u?.instituteId || 1;
  try {
    const res          = await api.get(`/admin/instructors/${instituteId}`);
    const instructors  = res?.data || res || [];
    const sel          = document.getElementById('batch-instructor');
    sel.innerHTML = '<option value="">Select instructor</option>' +
      instructors.map(i => `<option value="${i.id}">${i.fullName}</option>`).join('');
  } catch (e) {
    console.error('Failed to load instructors:', e);
  }
}

// ── RENDER TABLE ───────────────────────────────────────
function renderTable(data) {
  const tb = document.getElementById('batches-table');
  if (!data.length) {
    tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">No batches found. Create one using the button above.</td></tr>`;
    return;
  }
  tb.innerHTML = data.map(b => `
    <tr>
      <td style="font-weight:600">${b.batchName || '—'}</td>
      <td>${b.instructorName || '—'}</td>
      <td>${formatDate(b.startDate)}</td>
      <td>${formatDate(b.endDate)}</td>
      <td>
        <div>${b.classDays || '—'}</div>
        <small style="color:var(--text-muted)">${formatTime(b.classTime)}</small>
      </td>
      <td>${b.maxStudents || '—'}</td>
      <td>${statusBadge(b.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-danger" onclick="deleteBatch(${b.id})">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── FILTER ─────────────────────────────────────────────
function filterBatches() {
  const q      = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('status-filter').value;
  const filtered = allBatches.filter(b => {
    const matchQ = !q || b.batchName?.toLowerCase().includes(q);
    const matchS = !status || b.status === status;
    return matchQ && matchS;
  });
  renderTable(filtered);
}

// ── OPEN MODAL ─────────────────────────────────────────
function openModal() {
  document.getElementById('modal-title').textContent = 'Create Batch';
  document.getElementById('batch-id').value          = '';
  document.getElementById('batch-name').value        = '';
  document.getElementById('batch-course').value      = '';
  document.getElementById('batch-instructor').value  = '';
  document.getElementById('batch-start').value       = '';
  document.getElementById('batch-end').value         = '';
  document.getElementById('batch-time').value        = '';
  document.getElementById('batch-max').value         = '';
  document.getElementById('batch-status').value      = 'UPCOMING';
  document.getElementById('save-text').textContent   = 'Create Batch';
  document.querySelectorAll('input[name="class-day"]').forEach(cb => cb.checked = false);
  document.getElementById('batch-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('batch-modal').classList.remove('show');
}

// ── SAVE BATCH ─────────────────────────────────────────
async function saveBatch() {
  const name       = document.getElementById('batch-name').value.trim();
  const courseId   = document.getElementById('batch-course').value;
  const instrId    = document.getElementById('batch-instructor').value;
  const startDate  = document.getElementById('batch-start').value;
  const endDate    = document.getElementById('batch-end').value;
  const classTime  = document.getElementById('batch-time').value;
  const maxStudents= document.getElementById('batch-max').value;
  const status     = document.getElementById('batch-status').value;
  const classDays  = [...document.querySelectorAll('input[name="class-day"]:checked')]
    .map(cb => cb.value).join(',');

  if (!name)       { showToast('Batch name is required', 'warning'); return; }
  if (!courseId)   { showToast('Please select a course', 'warning'); return; }
  if (!instrId)    { showToast('Please select an instructor', 'warning'); return; }
  if (!startDate)  { showToast('Start date is required', 'warning'); return; }
  if (!endDate)    { showToast('End date is required', 'warning'); return; }
  if (!classTime)  { showToast('Class time is required', 'warning'); return; }
  if (!classDays)  { showToast('Select at least one class day', 'warning'); return; }

  const u           = getUser();
  const instituteId = u?.instituteId || 1;

  const body = {
    batchName:   name,
    course:      { id: parseInt(courseId) },
    instructor:  { id: parseInt(instrId) },
    institute:   { id: instituteId },
    startDate,
    endDate,
    classTime,
    classDays,
    maxStudents: maxStudents ? parseInt(maxStudents) : 30,
    status
  };

  document.getElementById('save-btn').disabled       = true;
  document.getElementById('save-text').textContent   = 'Saving...';

  try {
    await api.post('/batches', body);
    showToast('Batch created successfully!', 'success');
    closeModal();
    await loadBatches();
  } catch (e) {
    showToast(e.message || 'Failed to create batch', 'error');
  } finally {
    document.getElementById('save-btn').disabled     = false;
    document.getElementById('save-text').textContent = 'Create Batch';
  }
}

// ── DELETE ─────────────────────────────────────────────
async function deleteBatch(id) {
  if (!confirm('Delete this batch?')) return;
  try {
    await api.delete(`/batches/${id}`);
    showToast('Batch deleted', 'success');
    await loadBatches();
  } catch (e) {
    showToast(e.message || 'Failed to delete', 'error');
  }
}

// ── HELPERS ────────────────────────────────────────────
function formatDate(val) {
  if (!val) return '—';
  try {
    if (Array.isArray(val)) {
      const [y, m, d] = val;
      return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function formatTime(val) {
  if (!val) return '—';
  try {
    if (Array.isArray(val)) {
      const [h, m] = val;
      return new Date(0, 0, 0, h, m).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return val;
  } catch { return '—'; }
}

function statusBadge(status) {
  const map = { UPCOMING: 'badge-primary', ONGOING: 'badge-success', COMPLETED: 'badge-secondary', CANCELLED: 'badge-danger' };
  return `<span class="badge ${map[status] || 'badge-secondary'}">${status || '—'}</span>`;
}