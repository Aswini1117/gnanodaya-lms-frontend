let allSessions = [];
let userBatches = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('INSTRUCTOR');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent = u.name || 'Instructor';
    document.getElementById('nav-avatar').textContent = (u.name || 'I').charAt(0);
  }
  await loadBatches();
  await loadSessions();
});

// ── LOAD BATCHES ──────────────────────────────────────
async function loadBatches() {
  try {
    const u = getUser();
    const instructorId = u?.id;

    if (!instructorId) {
      console.error('No instructor ID found');
      return;
    }

    const res = await api.get(`/instructor/my-batches/${instructorId}`);
    userBatches = res?.data || res || [];

    const select = document.getElementById('session-batch');
    if (select) {
      if (userBatches.length === 0) {
        select.innerHTML = '<option value="">No batches found</option>';
      } else {
        select.innerHTML = '<option value="">Select Batch</option>' +
          userBatches.map(b =>
            `<option value="${b.id}">${b.batchName}</option>`
          ).join('');
      }
    }
  } catch (e) {
    console.error('Failed to load batches:', e);
    const select = document.getElementById('session-batch');
    if (select) {
      select.innerHTML = '<option value="">Failed to load batches</option>';
    }
  }
}

// ── LOAD SESSIONS ─────────────────────────────────────
async function loadSessions() {
  const tb = document.getElementById('sessions-table');
  try {
    const res = await api.get('/zoom/meetings/my');
    allSessions = res?.data || res || [];
    document.getElementById('session-count').textContent = allSessions.length;
    renderTable(allSessions);
  } catch {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load sessions</td></tr>';
  }
}

// ── RENDER TABLE ──────────────────────────────────────
function renderTable(data) {
  const tb = document.getElementById('sessions-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">No sessions scheduled yet</td></tr>';
    return;
  }
  tb.innerHTML = data.map(s => `
    <tr>
      <td style="font-weight:600">${s.topic || '—'}</td>
      <td>${s.batchName || '—'}<br>
          <small style="color:var(--text-muted)">${s.courseName || ''}</small>
      </td>
      <td>${formatDateTime(s.startTime)}</td>
      <td>${s.duration || 0} mins</td>
      <td>
        <a href="${s.joinUrl}" target="_blank" class="btn btn-sm btn-primary">
          🎥 Join
        </a>
      </td>
      <td>${statusBadge(s.status || 'SCHEDULED')}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <a href="${s.startUrl}" target="_blank" class="btn btn-sm btn-success">
            ▶ Start
          </a>
          <button class="btn btn-sm btn-danger" onclick="deleteSession(${s.id})">
            🗑
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── OPEN MODAL ────────────────────────────────────────
function openAddModal() {
  document.getElementById('modal-title').textContent = 'Schedule Zoom Session';
  document.getElementById('session-id').value    = '';
  document.getElementById('session-title').value = '';
  document.getElementById('session-agenda').value = '';
  document.getElementById('session-batch').value = '';
  document.getElementById('session-date').value  = '';
  document.getElementById('session-time').value  = '';
  document.getElementById('session-duration').value = '60';
  document.getElementById('session-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('session-modal').classList.remove('show');
}

// ── SAVE SESSION ──────────────────────────────────────
async function saveSession() {
  const topic    = document.getElementById('session-title').value.trim();
  const agenda   = document.getElementById('session-agenda').value.trim();
  const batchId  = document.getElementById('session-batch').value;
  const date     = document.getElementById('session-date').value;
  const time     = document.getElementById('session-time').value;
  const duration = document.getElementById('session-duration').value;

  if (!topic)    { showToast('Topic is required', 'warning'); return; }
  if (!batchId)  { showToast('Please select a batch', 'warning'); return; }
  if (!date)     { showToast('Please select a date', 'warning'); return; }
  if (!time)     { showToast('Please select a time', 'warning'); return; }
  if (!duration) { showToast('Please enter duration', 'warning'); return; }

  // Format startTime as "2026-06-13T10:00:00"
  const startTime = `${date}T${time}:00`;

  const btn = document.querySelector('#session-modal .btn-primary');
  btn.textContent = 'Scheduling...';
  btn.disabled = true;

  try {
    await api.post('/zoom/meetings', {
      topic,
      agenda,
      startTime,
      duration: parseInt(duration),
      batchId: parseInt(batchId)
    });
    showToast('Zoom session scheduled successfully!', 'success');
    closeModal();
    await loadSessions();
  } catch (e) {
    showToast(e.message || 'Failed to schedule session', 'error');
  } finally {
    btn.textContent = 'Schedule Session';
    btn.disabled = false;
  }
}

// ── DELETE SESSION ────────────────────────────────────
async function deleteSession(id) {
  if (!confirm('Delete this Zoom session? This will also cancel it on Zoom.')) return;
  try {
    await api.delete(`/zoom/meetings/${id}`);
    showToast('Session deleted', 'success');
    await loadSessions();
  } catch (e) {
    showToast(e.message || 'Failed to delete', 'error');
  }
}

// ── FORMAT DATE TIME ──────────────────────────────────
function formatDateTime(startTime) {
  if (!startTime) return '—';
  try {
    // Handle array format [2026,6,12,10,0] from backend
    if (Array.isArray(startTime)) {
      const [y, m, d, h, min] = startTime;
      const dt = new Date(y, m - 1, d, h, min);
      return dt.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      }) + ' ' + dt.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    }
    const dt = new Date(startTime);
    return dt.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }) + ' ' + dt.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch {
    return startTime;
  }
}

// ── STATUS BADGE ──────────────────────────────────────
function statusBadge(status) {
  const map = {
    'SCHEDULED':  'badge-primary',
    'LIVE':       'badge-success',
    'COMPLETED':  'badge-secondary',
    'CANCELLED':  'badge-danger'
  };
  return `<span class="badge ${map[status] || 'badge-secondary'}">${status}</span>`;
}