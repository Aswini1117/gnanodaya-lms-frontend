let allSessions = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadSessions();
});

// ── LOAD SESSIONS ─────────────────────────────────────
async function loadSessions() {
  try {
    // Get student's batch ID from user info
    const u = getUser();
    const batchId = u?.batchId;

    if (!batchId) {
      showNoSessions('upcoming-table', 6);
      showNoSessions('past-table', 6);
      document.getElementById('upcoming-count').textContent = '0';
      document.getElementById('past-count').textContent = '0';
      return;
    }

    const res = await api.get(`/zoom/meetings/batch/${batchId}`);
    allSessions = res?.data || res || [];

    // Split into upcoming and past
    const now = new Date();
    const upcoming = allSessions.filter(s =>
      s.status === 'SCHEDULED' || s.status === 'LIVE'
    );
    const past = allSessions.filter(s =>
      s.status === 'COMPLETED' || s.status === 'CANCELLED'
    );

    document.getElementById('upcoming-count').textContent = upcoming.length;
    document.getElementById('past-count').textContent = past.length;

    renderUpcoming(upcoming);
    renderPast(past);

  } catch (e) {
    console.error('Failed to load sessions:', e);
    showNoSessions('upcoming-table', 6);
    showNoSessions('past-table', 6);
  }
}

// ── RENDER UPCOMING ───────────────────────────────────
function renderUpcoming(data) {
  const tb = document.getElementById('upcoming-table');
  if (!data.length) {
    tb.innerHTML = `
      <tr>
        <td colspan="6"
            style="text-align:center;padding:32px;
                   color:var(--text-muted)">
          No upcoming sessions scheduled
        </td>
      </tr>`;
    return;
  }
  tb.innerHTML = data.map(s => `
    <tr>
      <td style="font-weight:600">${s.topic || '—'}</td>
      <td>
        ${s.batchName || '—'}<br>
        <small style="color:var(--text-muted)">
          ${s.courseName || ''}
        </small>
      </td>
      <td>${s.instructorName || '—'}</td>
      <td>${formatDateTime(s.startTime)}</td>
      <td>${s.duration || 0} mins</td>
      <td>
        ${s.status === 'LIVE'
          ? `<a href="${s.joinUrl}" target="_blank"
                class="btn btn-sm btn-success">
               🔴 Join Live
             </a>`
          : `<a href="${s.joinUrl}" target="_blank"
                class="btn btn-sm btn-primary">
               🎥 Join
             </a>`
        }
      </td>
    </tr>
  `).join('');
}

// ── RENDER PAST ───────────────────────────────────────
function renderPast(data) {
  const tb = document.getElementById('past-table');
  if (!data.length) {
    tb.innerHTML = `
      <tr>
        <td colspan="6"
            style="text-align:center;padding:32px;
                   color:var(--text-muted)">
          No past sessions
        </td>
      </tr>`;
    return;
  }
  tb.innerHTML = data.map(s => `
    <tr>
      <td style="font-weight:600">${s.topic || '—'}</td>
      <td>
        ${s.batchName || '—'}<br>
        <small style="color:var(--text-muted)">
          ${s.courseName || ''}
        </small>
      </td>
      <td>${s.instructorName || '—'}</td>
      <td>${formatDateTime(s.startTime)}</td>
      <td>${s.duration || 0} mins</td>
      <td>${statusBadge(s.status)}</td>
    </tr>
  `).join('');
}

// ── HELPER — No Sessions ──────────────────────────────
function showNoSessions(tableId, cols) {
  document.getElementById(tableId).innerHTML = `
    <tr>
      <td colspan="${cols}"
          style="text-align:center;padding:32px;
                 color:var(--text-muted)">
        No sessions found
      </td>
    </tr>`;
}

// ── FORMAT DATE TIME ──────────────────────────────────
function formatDateTime(startTime) {
  if (!startTime) return '—';
  try {
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
    'SCHEDULED': 'badge-primary',
    'LIVE':      'badge-success',
    'COMPLETED': 'badge-secondary',
    'CANCELLED': 'badge-danger'
  };
  return `<span class="badge ${map[status] || 'badge-secondary'}">
            ${status}
          </span>`;
}