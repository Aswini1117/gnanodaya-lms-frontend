document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await Promise.all([loadExams(), loadSessions(), loadDeadlines()]);
});

async function loadExams() {
  const el = document.getElementById('exams-list');
  try {
    const d = await api.get('/student/exams/upcoming');
    if (!d?.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No upcoming exams</p>'; return; }
    el.innerHTML = d.map(e => `
      <div class="list-item">
        <div class="item-icon" style="background:#fee2e2">📝</div>
        <div style="flex:1">
          <div class="item-title">${e.title || '—'}</div>
          <div class="item-sub">${e.courseName || ''} · ${formatDate(e.date)} ${e.time || ''}</div>
        </div>
        <span class="badge badge-warning">${e.duration ? e.duration + ' min' : '—'}</span>
      </div>
    `).join('');
  } catch { el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>'; }
}

async function loadSessions() {
  const el = document.getElementById('sessions-list');
  try {
    const d = await api.get('/student/live-sessions/upcoming');
    if (!d?.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No upcoming sessions</p>'; return; }
    el.innerHTML = d.map(s => `
      <div class="list-item">
        <div class="item-icon" style="background:#dbeafe">🎥</div>
        <div style="flex:1">
          <div class="item-title">${s.title || '—'}</div>
          <div class="item-sub">${s.courseName || ''} · ${formatDate(s.date)} ${s.time || ''}</div>
        </div>
        ${s.meetingLink
          ? `<a href="${s.meetingLink}" target="_blank" class="btn btn-sm btn-primary">Join</a>`
          : '<span class="badge badge-secondary">Soon</span>'
        }
      </div>
    `).join('');
  } catch { el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>'; }
}

async function loadDeadlines() {
  const el = document.getElementById('deadlines-list');
  try {
    const d = await api.get('/student/assignments/upcoming');
    if (!d?.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No upcoming deadlines 🎉</p>'; return; }
    el.innerHTML = d.map(a => {
      const days = Math.ceil((new Date(a.dueDate) - Date.now()) / 86400000);
      const cls  = days < 0 ? 'badge-danger' : days < 2 ? 'badge-danger' : days < 4 ? 'badge-warning' : 'badge-success';
      const lbl  = days < 0 ? 'Overdue' : days === 0 ? 'Today' : `${days}d left`;
      return `
        <div class="list-item">
          <div class="item-icon" style="background:#fef3c7">📋</div>
          <div style="flex:1">
            <div class="item-title">${a.title || '—'}</div>
            <div class="item-sub">${a.courseName || ''} · Due: ${formatDate(a.dueDate)}</div>
          </div>
          <span class="badge ${cls}">${lbl}</span>
        </div>`;
    }).join('');
  } catch { el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>'; }
}