document.addEventListener('DOMContentLoaded', async () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
  await Promise.all([
    loadStats(),
    loadEnrollments(),
    loadCoursePerformance(),
    loadApprovals()
  ]);
});

async function loadStats() {
  try {
    const d = await api.get('/admin/stats');
    document.getElementById('stat-students').textContent    = d.totalStudents    ?? '—';
    document.getElementById('stat-instructors').textContent = d.totalInstructors ?? '—';
    document.getElementById('stat-courses').textContent     = d.totalCourses     ?? '—';
    document.getElementById('stat-completion').textContent  = (d.completionRate  ?? 0) + '%';
  } catch (e) {
    showToast('Failed to load stats', 'error');
  }
}

async function loadEnrollments() {
  const tb = document.getElementById('enrollment-list');
  try {
    const d = await api.get('/admin/enrollments/recent');
    if (!d?.length) {
      tb.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">No enrollments yet</td></tr>';
      return;
    }
    tb.innerHTML = d.map(e => `
      <tr>
        <td>
          <div class="user-row">
            ${avatarEl(e.studentName, 'var(--primary)')}
            <div>
              <div style="font-weight:600">${e.studentName || '—'}</div>
              <div style="font-size:11px;color:var(--text-muted)">${e.studentEmail || ''}</div>
            </div>
          </div>
        </td>
        <td>${e.courseName || '—'}</td>
        <td>${formatDate(e.enrolledAt)}</td>
        <td>${statusBadge(e.status)}</td>
      </tr>
    `).join('');
  } catch {
    tb.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

async function loadCoursePerformance() {
  const el = document.getElementById('course-performance');
  try {
    const d = await api.get('/admin/courses/performance');
    if (!d?.length) { el.innerHTML = '<p style="color:var(--text-muted)">No data</p>'; return; }
    el.innerHTML = d.map(c => `
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
          <span style="font-weight:500">${c.courseName}</span>
          <span style="color:var(--text-muted)">${c.completionRate ?? 0}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${c.completionRate ?? 0}%"></div>
        </div>
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>';
  }
}

async function loadApprovals() {
  const el = document.getElementById('pending-approvals');
  try {
    const d = await api.get('/admin/approvals/pending');
    document.getElementById('approval-count').textContent = d?.length || 0;
    if (!d?.length) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No pending approvals 🎉</p>';
      return;
    }
    el.innerHTML = d.slice(0, 4).map(a => `
      <div class="list-item">
        ${avatarEl(a.name, 'var(--instructor)')}
        <div style="flex:1">
          <div class="item-title">${a.name || '—'}</div>
          <div class="item-sub">${a.type || 'Application'}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-success" onclick="approve(${a.id})">✓</button>
          <button class="btn btn-sm btn-danger"  onclick="reject(${a.id})">✕</button>
        </div>
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">Failed to load</p>';
  }
}

async function approve(id) {
  try {
    await api.post(`/admin/approvals/${id}/approve`, {});
    showToast('Approved successfully!', 'success');
    loadApprovals();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function reject(id) {
  try {
    await api.post(`/admin/approvals/${id}/reject`, {});
    showToast('Rejected', 'warning');
    loadApprovals();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}