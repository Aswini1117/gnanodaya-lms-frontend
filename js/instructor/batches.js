let allBatches = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('INSTRUCTOR');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Instructor';
    document.getElementById('nav-avatar').textContent = (u.name || 'I').charAt(0);
  }
  await loadBatches();
});

// ── LOAD BATCHES ───────────────────────────────────────
async function loadBatches() {
  const u  = getUser();
  const tb = document.getElementById('batches-table');
  try {
    const res  = await api.get(`/batches/instructor/${u?.id}`);
    allBatches = res?.data || res || [];
    updateStats(allBatches);
    document.getElementById('batch-count').textContent = allBatches.length;
    renderTable(allBatches);
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load: ${e.message}</td></tr>`;
  }
}

// ── UPDATE STATS ───────────────────────────────────────
function updateStats(data) {
  document.getElementById('stat-total').textContent     = data.length;
  document.getElementById('stat-ongoing').textContent   = data.filter(b => b.status === 'ONGOING').length;
  document.getElementById('stat-upcoming').textContent  = data.filter(b => b.status === 'UPCOMING').length;
  document.getElementById('stat-completed').textContent = data.filter(b => b.status === 'COMPLETED').length;
}

// ── RENDER TABLE ───────────────────────────────────────
function renderTable(data) {
  const tb = document.getElementById('batches-table');
  if (!data.length) {
    tb.innerHTML = `
      <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">
        <div style="font-size:32px;margin-bottom:8px">📭</div>
        No batches assigned to you yet. Contact admin to assign a batch.
      </td></tr>`;
    return;
  }
  tb.innerHTML = data.map(b => `
    <tr>
      <td style="font-weight:600">${b.batchName || '—'}</td>
      <td>${formatDate(b.startDate)}</td>
      <td>${formatDate(b.endDate)}</td>
      <td>
        <div style="font-size:13px">${b.classDays || '—'}</div>
        <small style="color:var(--text-muted)">${formatTime(b.classTime)}</small>
      </td>
      <td>${b.maxStudents || '—'}</td>
      <td>${statusBadge(b.status)}</td>
      <td>
        <button class="btn btn-sm" onclick="viewStudents(${b.id}, '${b.batchName}')">
          👥 Students
        </button>
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

// ── VIEW STUDENTS ──────────────────────────────────────
async function viewStudents(batchId, batchName) {
  document.getElementById('students-modal-title').textContent = `Students — ${batchName}`;
  document.getElementById('students-modal').classList.add('show');
  const tb = document.getElementById('students-table');
  tb.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">Loading...</td></tr>`;
  try {
    const res      = await api.get(`/batches/${batchId}/students`);
    const students = res?.data || res || [];
    if (!students.length) {
      tb.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">No students enrolled yet</td></tr>`;
      return;
    }
    tb.innerHTML = students.map(e => `
      <tr>
        <td>
          <div class="user-row">
            ${avatarEl(e.studentName || e.student?.fullName, 'var(--primary)')}
            <span style="font-weight:600">${e.studentName || e.student?.fullName || '—'}</span>
          </div>
        </td>
        <td>${e.student?.phone || '—'}</td>
        <td>${e.student?.email || '—'}</td>
        <td><span class="badge badge-success">ENROLLED</span></td>
      </tr>
    `).join('');
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load: ${e.message}</td></tr>`;
  }
}

function closeStudentsModal() {
  document.getElementById('students-modal').classList.remove('show');
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