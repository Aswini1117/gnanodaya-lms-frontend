document.addEventListener('DOMContentLoaded', async () => {
  guardPage('INSTRUCTOR');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Instructor';
    document.getElementById('nav-avatar').textContent = (u.name || 'I').charAt(0);
  }
  await Promise.all([
    loadStats(),
    loadMyCourses(),
    loadGrading(),
    loadQuestions()
  ]);
});

async function loadStats() {
  try {
    const d = await api.get('/instructor/stats');
    document.getElementById('stat-courses').textContent  = d.totalCourses   ?? '—';
    document.getElementById('stat-students').textContent = d.totalStudents  ?? '—';
    document.getElementById('stat-grading').textContent  = d.pendingGrading ?? '—';
    document.getElementById('stat-rating').textContent   = (d.avgRating ?? 0).toFixed(1);
  } catch {
    showToast('Failed to load stats', 'error');
  }
}

async function loadMyCourses() {
  const el = document.getElementById('my-courses-list');
  try {
    const d = await api.get('/instructor/courses/mine');
    if (!d?.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><p>No courses yet</p></div>';
      return;
    }
    el.innerHTML = d.slice(0, 4).map(c => `
      <div class="list-item">
        <div class="item-icon" style="background:var(--primary-light)">📚</div>
        <div style="flex:1">
          <div class="item-title">${c.title || '—'}</div>
          <div class="item-sub">${c.totalModules ?? 0} modules · ${c.totalStudents ?? 0} students</div>
          <div class="progress-bar" style="margin-top:6px">
            <div class="progress-fill" style="width:${c.publishProgress ?? 100}%"></div>
          </div>
        </div>
        ${statusBadge(c.status)}
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>';
  }
}

async function loadGrading() {
  const el = document.getElementById('grading-list');
  try {
    const d = await api.get('/instructor/assignments/pending-grade');
    if (!d?.length) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">All caught up! ✅</p>';
      return;
    }
    el.innerHTML = d.slice(0, 3).map(a => `
      <div class="list-item">
        <div style="flex:1">
          <div class="item-title">${a.title || '—'}</div>
          <div class="item-sub">${a.submissionCount ?? 0} submissions · Due: ${formatDate(a.dueDate)}</div>
        </div>
        <a href="/instructor/grade-book.html?id=${a.id}" class="btn btn-sm btn-primary">Grade</a>
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>';
  }
}

async function loadQuestions() {
  const el = document.getElementById('questions-list');
  try {
    const d = await api.get('/instructor/discussions/unanswered');
    document.getElementById('question-count').textContent = d?.length || 0;
    if (!d?.length) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No unanswered questions</p>';
      return;
    }
    el.innerHTML = d.slice(0, 4).map(q => `
      <div class="list-item">
        ${avatarEl(q.studentName, 'var(--student)')}
        <div>
          <div class="item-title">${q.question || '—'}</div>
          <div class="item-sub">${q.courseName || ''} · ${timeAgo(q.createdAt)}</div>
        </div>
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>';
  }
}

async function postAnnouncement() {
  const title = document.getElementById('ann-title').value.trim();
  const msg   = document.getElementById('ann-msg').value.trim();
  if (!title || !msg) { showToast('Fill in both fields', 'warning'); return; }
  try {
    await api.post('/instructor/announcements', { title, message: msg });
    showToast('Announcement sent!', 'success');
    document.getElementById('ann-title').value = '';
    document.getElementById('ann-msg').value   = '';
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}