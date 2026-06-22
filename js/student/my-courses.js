let allCourses = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadCourses();
});

async function loadCourses() {
  const grid = document.getElementById('courses-grid');
  try {
    const d = await api.get('/student/courses/enrolled');
    allCourses = d || [];
    renderCourses(allCourses);
  } catch {
    grid.innerHTML = '<p style="color:var(--text-muted)">Failed to load courses</p>';
  }
}

function renderCourses(data) {
  const grid = document.getElementById('courses-grid');
  if (!data.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>No courses found.</p>
        <a href="/student/course-browser.html" class="btn btn-primary" style="margin-top:12px">Browse Courses</a>
      </div>`;
    return;
  }
  grid.innerHTML = data.map(c => `
    <div class="panel">
      <div class="panel-body">
        <div style="font-size:32px;margin-bottom:12px">${c.icon || '📖'}</div>
        <div style="font-weight:700;font-size:15px;margin-bottom:6px">${c.title || '—'}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">${c.instructorName || ''}</div>
        <div class="progress-bar" style="margin-bottom:6px">
          <div class="progress-fill" style="width:${c.progress ?? 0}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:14px">
          <span>${c.progress ?? 0}% complete</span>
          <span>${statusBadge(c.status)}</span>
        </div>
        <a href="/student/course-player.html?id=${c.id}" class="btn btn-primary btn-full">
          ${c.progress > 0 ? '▶ Resume' : '▶ Start'}
        </a>
      </div>
    </div>
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
  renderCourses(filtered);
}