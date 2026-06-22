document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await Promise.all([loadStats(), loadProgress()]);
});

async function loadStats() {
  try {
    const d = await api.get('/student/stats');
    document.getElementById('stat-enrolled').textContent  = d.enrolledCourses  ?? '—';
    document.getElementById('stat-completed').textContent = d.completedCourses ?? '—';
    document.getElementById('stat-hours').textContent     = d.hoursLearned     ?? '—';
    document.getElementById('stat-score').textContent     = d.avgScore ? d.avgScore + '%' : '—';
  } catch { showToast('Failed to load stats', 'error'); }
}

async function loadProgress() {
  const el = document.getElementById('progress-list');
  try {
    const d = await api.get('/student/progress');
    if (!d?.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>No progress data yet</p></div>';
      return;
    }
    el.innerHTML = d.map(c => `
      <div style="margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div>
            <div style="font-weight:600;font-size:14px">${c.courseName || '—'}</div>
            <div style="font-size:12px;color:var(--text-muted)">${c.instructorName || ''}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;font-size:16px">${c.progress ?? 0}%</div>
            <div>${statusBadge(c.status)}</div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${c.progress ?? 0}%"></div>
        </div>
        <div style="display:flex;gap:20px;margin-top:10px;font-size:12px;color:var(--text-muted)">
          <span>✅ ${c.completedLessons ?? 0}/${c.totalLessons ?? 0} lessons</span>
          <span>📝 ${c.completedAssignments ?? 0} assignments</span>
          <span>🧪 Avg: ${c.avgQuizScore ?? '—'}%</span>
        </div>
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Failed to load progress</p>';
  }
}