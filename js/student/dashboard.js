document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent    = u.name || 'Student';
    document.getElementById('nav-avatar').textContent  = (u.name || 'S').charAt(0);
    document.getElementById('welcome-name').textContent = u.name?.split(' ')[0] || 'Student';
  }
  await Promise.all([
    loadStats(),
    loadCourses(),
    loadDeadlines(),
    loadAnnouncements()
  ]);
});

async function loadStats() {
  try {
    const d = await api.get('/student/stats');
    document.getElementById('stat-enrolled').textContent    = d.enrolledCourses    ?? '—';
    document.getElementById('stat-hours').textContent       = d.hoursLearned       ?? '—';
    document.getElementById('stat-certs').textContent       = d.certificates        ?? '—';
    document.getElementById('stat-assignments').textContent = d.pendingAssignments  ?? '—';
    if (d.streak) {
      document.getElementById('streak-count').textContent = `🔥 ${d.streak}-day streak`;
    }
  } catch {
    showToast('Failed to load stats', 'error');
  }
}

async function loadCourses() {
  const el = document.getElementById('enrolled-courses');
  try {
    const d = await api.get('/student/courses/enrolled');
    if (!d?.length) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <p>You haven't enrolled in any courses yet.</p>
          <a href="/student/course-browser.html" class="btn btn-primary" style="margin-top:12px">Browse Courses</a>
        </div>`;
      return;
    }
    el.innerHTML = d.slice(0, 4).map(c => `
      <div class="list-item">
        <div class="item-icon" style="background:var(--primary-light);font-size:22px">${c.icon || '📖'}</div>
        <div style="flex:1">
          <div class="item-title">${c.title || '—'}</div>
          <div class="item-sub">Module ${c.currentModule ?? 1} of ${c.totalModules ?? 1}</div>
          <div class="progress-bar" style="margin-top:7px">
            <div class="progress-fill" style="width:${c.progress ?? 0}%"></div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${c.progress ?? 0}% complete</div>
        </div>
        <a href="/student/course-player.html?id=${c.id}" class="btn btn-sm btn-primary">Resume</a>
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Failed to load courses</p>';
  }
}

async function loadDeadlines() {
  const el = document.getElementById('deadlines-list');
  try {
    const d = await api.get('/student/assignments/upcoming');
    if (!d?.length) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No upcoming deadlines 🎉</p>';
      return;
    }
    el.innerHTML = d.slice(0, 4).map(a => {
      const days = Math.ceil((new Date(a.dueDate) - Date.now()) / 86400000);
      const cls  = days < 0 ? 'badge-danger' : days < 2 ? 'badge-danger' : days < 4 ? 'badge-warning' : 'badge-success';
      const lbl  = days < 0 ? 'Overdue' : days === 0 ? 'Due Today' : `${days}d left`;
      return `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div style="font-weight:600;font-size:13px">${a.title || '—'}</div>
            <span class="badge ${cls}">${lbl}</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">${a.courseName || ''} · Due: ${formatDate(a.dueDate)}</div>
          <a href="/student/assignments.html?id=${a.id}" class="btn btn-sm btn-primary">Submit</a>
        </div>`;
    }).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>';
  }
}

async function loadAnnouncements() {
  const el = document.getElementById('announcements-list');
  try {
    const d = await api.get('/student/announcements');
    if (!d?.length) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No announcements</p>';
      return;
    }
    const colors = [['#eff6ff','#1d4ed8'], ['#f0fdf4','#15803d'], ['#fefce8','#a16207']];
    el.innerHTML = d.slice(0, 3).map((a, i) => {
      const [bg, c] = colors[i % colors.length];
      return `
        <div style="background:${bg};border:1px solid ${c}30;border-radius:var(--radius);padding:14px;margin-bottom:10px">
          <div style="font-weight:600;font-size:13px;color:${c};margin-bottom:4px">${a.title || '—'}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${a.message || ''}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px">${timeAgo(a.createdAt)}</div>
        </div>`;
    }).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>';
  }
}